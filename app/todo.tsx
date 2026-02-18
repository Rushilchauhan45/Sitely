// ============================================================
// ✅ TO-DO SCREEN — Daily & Monthly task management
// Stored locally via AsyncStorage
// ============================================================

import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, ScrollView, Pressable, Alert,
  Dimensions, Platform, Modal,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  FadeInDown,
  FadeInRight,
  FadeOut,
  SlideOutLeft,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  Layout,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useApp } from '@/lib/AppContext';
import Colors from '@/constants/colors';
import { Fonts, FontSizes } from '@/theme/typography';
import { GlassCard } from '@/components/ui/GlassCard';
import { GradientButton } from '@/components/ui/GradientButton';
import { FloatingInput } from '@/components/ui/FloatingInput';
import type { TodoItem, TodoType } from '@/lib/types';
import { scheduleTodoReminder } from '@/services/notifications';

const TODO_STORAGE_KEY = 'sitely_todos';

export default function TodoScreen() {
  const { t } = useApp();
  const insets = useSafeAreaInsets();

  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [todoType, setTodoType] = useState<TodoType>('daily');
  const [deadline, setDeadline] = useState('');
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('medium');

  useEffect(() => {
    loadTodos();
  }, []);

  const loadTodos = async () => {
    try {
      const stored = await AsyncStorage.getItem(TODO_STORAGE_KEY);
      if (stored) {
        setTodos(JSON.parse(stored));
      }
    } catch (e) {
      console.warn('Error loading todos:', e);
    }
  };

  const saveTodos = async (newTodos: TodoItem[]) => {
    try {
      await AsyncStorage.setItem(TODO_STORAGE_KEY, JSON.stringify(newTodos));
      setTodos(newTodos);
    } catch (e) {
      console.warn('Error saving todos:', e);
    }
  };

  const handleAddTodo = async () => {
    if (!title.trim()) {
      Alert.alert(t('required'), t('taskTitle'));
      return;
    }

    const newTodo: TodoItem = {
      id: Date.now().toString(),
      title: title.trim(),
      description: description.trim(),
      type: todoType,
      deadline: deadline || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      isCompleted: false,
      createdAt: new Date().toISOString(),
      completedAt: null,
      priority,
    };

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const newTodos = [newTodo, ...todos];
    await saveTodos(newTodos);

    // Schedule notification reminder 1 hour before deadline
    scheduleTodoReminder(newTodo).catch(() => {});

    setTitle('');
    setDescription('');
    setDeadline('');
    setPriority('medium');
    setShowAddForm(false);
  };

  const toggleTodo = async (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const updated = todos.map((todo) =>
      todo.id === id
        ? {
            ...todo,
            isCompleted: !todo.isCompleted,
            completedAt: !todo.isCompleted ? new Date().toISOString() : null,
          }
        : todo,
    );
    await saveTodos(updated);
  };

  const deleteTodo = async (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    const updated = todos.filter((todo) => todo.id !== id);
    await saveTodos(updated);
  };

  const pendingTodos = todos.filter((t) => !t.isCompleted);
  const completedTodos = todos.filter((t) => t.isCompleted);

  const getTimeRemaining = (deadline: string): string => {
    const diff = new Date(deadline).getTime() - Date.now();
    if (diff < 0) return 'Overdue';
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 24) return `${Math.floor(hours / 24)}d ${hours % 24}h`;
    return `${hours}h ${mins}m`;
  };

  const renderTodoItem = (todo: TodoItem, index: number) => (
    <Animated.View
      key={todo.id}
      entering={FadeInDown.delay(index * 40).springify()}
      exiting={SlideOutLeft.duration(300)}
      layout={Layout.springify()}
    >
      <Pressable
        onLongPress={() => {
          Alert.alert(
            t('delete'),
            `${t('delete')} "${todo.title}"?`,
            [
              { text: t('cancel'), style: 'cancel' },
              { text: t('delete'), style: 'destructive', onPress: () => deleteTodo(todo.id) },
            ],
          );
        }}
      >
        <GlassCard style={{ marginBottom: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
            {/* Checkbox */}
            <Pressable
              onPress={() => toggleTodo(todo.id)}
              style={{
                width: 26,
                height: 26,
                borderRadius: 13,
                borderWidth: 2,
                borderColor: todo.isCompleted ? Colors.success : Colors.primary,
                backgroundColor: todo.isCompleted ? Colors.success : 'transparent',
                justifyContent: 'center',
                alignItems: 'center',
                marginTop: 2,
              }}
            >
              {todo.isCompleted && (
                <Ionicons name="checkmark" size={16} color={Colors.white} />
              )}
            </Pressable>

            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontFamily: Fonts.semiBold,
                  fontSize: FontSizes.base,
                  color: todo.isCompleted ? Colors.textTertiary : Colors.white,
                  textDecorationLine: todo.isCompleted ? 'line-through' : 'none',
                }}
              >
                {todo.title}
              </Text>
              {todo.description ? (
                <Text
                  style={{
                    fontFamily: Fonts.regular,
                    fontSize: FontSizes.sm,
                    color: Colors.textTertiary,
                    marginTop: 2,
                  }}
                  numberOfLines={2}
                >
                  {todo.description}
                </Text>
              ) : null}

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 }}>
                {/* Type Badge */}
                <View
                  style={{
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                    borderRadius: 6,
                    backgroundColor: todo.type === 'daily' ? Colors.primaryLight : Colors.warningLight,
                  }}
                >
                  <Text
                    style={{
                      fontFamily: Fonts.medium,
                      fontSize: FontSizes.xs,
                      color: todo.type === 'daily' ? Colors.primary : Colors.warning,
                    }}
                  >
                    {todo.type === 'daily' ? t('daily') : t('monthly')}
                  </Text>
                </View>

                {/* Priority Badge */}
                {todo.priority && (
                  <View
                    style={{
                      paddingHorizontal: 8,
                      paddingVertical: 3,
                      borderRadius: 6,
                      backgroundColor: todo.priority === 'high' ? '#EF444420' : todo.priority === 'medium' ? '#F59E0B20' : '#10B98120',
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: Fonts.medium,
                        fontSize: FontSizes.xs,
                        color: todo.priority === 'high' ? '#EF4444' : todo.priority === 'medium' ? '#F59E0B' : '#10B981',
                      }}
                    >
                      {t(todo.priority) || todo.priority}
                    </Text>
                  </View>
                )}

                {/* Deadline */}
                {!todo.isCompleted && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Ionicons name="time-outline" size={12} color={Colors.textTertiary} />
                    <Text
                      style={{
                        fontFamily: Fonts.regular,
                        fontSize: FontSizes.xs,
                        color: getTimeRemaining(todo.deadline) === 'Overdue' ? Colors.error : Colors.textTertiary,
                      }}
                    >
                      {getTimeRemaining(todo.deadline)}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </GlassCard>
      </Pressable>
    </Animated.View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      {/* Header */}
      <LinearGradient
        colors={[...Colors.gradientHeader]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          paddingTop: insets.top + 12,
          paddingBottom: 20,
          paddingHorizontal: 20,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Pressable
            onPress={() => router.back()}
            style={{
              width: 40, height: 40, borderRadius: 20,
              backgroundColor: Colors.glass,
              justifyContent: 'center', alignItems: 'center',
            }}
          >
            <Ionicons name="arrow-back" size={22} color={Colors.white} />
          </Pressable>
          <Text style={{
            fontFamily: Fonts.bold,
            fontSize: FontSizes.xl,
            color: Colors.white,
            flex: 1,
          }}>
            {t('todos')}
          </Text>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowAddForm(!showAddForm);
            }}
            style={{
              width: 40, height: 40, borderRadius: 20,
              backgroundColor: Colors.glass,
              justifyContent: 'center', alignItems: 'center',
            }}
          >
            <Ionicons name={showAddForm ? 'close' : 'add'} size={24} color={Colors.white} />
          </Pressable>
        </View>

        {/* Stats Row */}
        <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
          <View style={{
            flex: 1,
            backgroundColor: Colors.glass,
            borderRadius: 12,
            padding: 12,
            alignItems: 'center',
          }}>
            <Text style={{
              fontFamily: Fonts.bold,
              fontSize: FontSizes['2xl'],
              color: Colors.white,
            }}>
              {pendingTodos.length}
            </Text>
            <Text style={{
              fontFamily: Fonts.regular,
              fontSize: FontSizes.xs,
              color: Colors.whiteSubtle,
            }}>
              {t('pending')}
            </Text>
          </View>
          <View style={{
            flex: 1,
            backgroundColor: Colors.glass,
            borderRadius: 12,
            padding: 12,
            alignItems: 'center',
          }}>
            <Text style={{
              fontFamily: Fonts.bold,
              fontSize: FontSizes['2xl'],
              color: Colors.success,
            }}>
              {completedTodos.length}
            </Text>
            <Text style={{
              fontFamily: Fonts.regular,
              fontSize: FontSizes.xs,
              color: Colors.whiteSubtle,
            }}>
              {t('completed')}
            </Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Add Form */}
        {showAddForm && (
          <Animated.View entering={FadeInDown.springify()}>
            <GlassCard gradient style={{ marginBottom: 20 }}>
              <Text style={{
                fontFamily: Fonts.semiBold,
                fontSize: FontSizes.lg,
                color: Colors.white,
                marginBottom: 16,
              }}>
                {t('addTodo')}
              </Text>

              <FloatingInput
                label={t('taskTitle')}
                value={title}
                onChangeText={setTitle}
              />
              <FloatingInput
                label={t('taskDescription')}
                value={description}
                onChangeText={setDescription}
                multiline
              />

              {/* Type Toggle */}
              <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
                {(['daily', 'monthly'] as TodoType[]).map((type) => (
                  <Pressable
                    key={type}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setTodoType(type);
                    }}
                    style={{
                      flex: 1,
                      paddingVertical: 14,
                      borderRadius: 14,
                      backgroundColor: todoType === type ? Colors.primary : Colors.glass,
                      borderWidth: 1,
                      borderColor: todoType === type ? Colors.primary : Colors.glassBorder,
                      alignItems: 'center',
                    }}
                  >
                    <Ionicons
                      name={type === 'daily' ? 'sunny-outline' : 'calendar-outline'}
                      size={20}
                      color={todoType === type ? Colors.white : Colors.textSecondary}
                    />
                    <Text style={{
                      fontFamily: Fonts.medium,
                      fontSize: FontSizes.sm,
                      color: todoType === type ? Colors.white : Colors.textSecondary,
                      marginTop: 4,
                    }}>
                      {type === 'daily' ? t('daily') : t('monthly')}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {/* Priority Picker */}
              <Text style={{
                fontFamily: Fonts.medium,
                fontSize: FontSizes.sm,
                color: Colors.textSecondary,
                marginBottom: 8,
              }}>
                {t('priority') || 'Priority'}
              </Text>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
                {(['high', 'medium', 'low'] as const).map((p) => {
                  const pColors = { high: '#EF4444', medium: '#F59E0B', low: '#10B981' };
                  return (
                    <Pressable
                      key={p}
                      onPress={() => { Haptics.selectionAsync(); setPriority(p); }}
                      style={{
                        flex: 1,
                        paddingVertical: 10,
                        borderRadius: 12,
                        backgroundColor: priority === p ? pColors[p] + '25' : Colors.glass,
                        borderWidth: 1,
                        borderColor: priority === p ? pColors[p] : Colors.glassBorder,
                        alignItems: 'center',
                      }}
                    >
                      <Ionicons
                        name={p === 'high' ? 'flame' : p === 'medium' ? 'remove-circle' : 'leaf'}
                        size={18}
                        color={priority === p ? pColors[p] : Colors.textTertiary}
                      />
                      <Text style={{
                        fontFamily: Fonts.medium,
                        fontSize: FontSizes.xs,
                        color: priority === p ? pColors[p] : Colors.textSecondary,
                        marginTop: 2,
                      }}>
                        {t(p) || p.charAt(0).toUpperCase() + p.slice(1)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <GradientButton
                title={t('addTodo')}
                onPress={handleAddTodo}
                icon={<Ionicons name="add-circle-outline" size={20} color={Colors.white} />}
              />
            </GlassCard>
          </Animated.View>
        )}

        {/* Pending Tasks */}
        {pendingTodos.length > 0 && (
          <>
            <Text style={{
              fontFamily: Fonts.semiBold,
              fontSize: FontSizes.base,
              color: Colors.textSecondary,
              marginBottom: 12,
              textTransform: 'uppercase',
              letterSpacing: 1,
            }}>
              {t('pending')} ({pendingTodos.length})
            </Text>
            {pendingTodos.map((todo, i) => renderTodoItem(todo, i))}
          </>
        )}

        {/* Completed Tasks */}
        {completedTodos.length > 0 && (
          <>
            <Text style={{
              fontFamily: Fonts.semiBold,
              fontSize: FontSizes.base,
              color: Colors.textTertiary,
              marginTop: 20,
              marginBottom: 12,
              textTransform: 'uppercase',
              letterSpacing: 1,
            }}>
              {t('completed')} ({completedTodos.length})
            </Text>
            {completedTodos.map((todo, i) => renderTodoItem(todo, i))}
          </>
        )}

        {/* Empty State */}
        {todos.length === 0 && !showAddForm && (
          <View style={{ padding: 40, alignItems: 'center' }}>
            <Ionicons name="checkmark-done-circle-outline" size={64} color={Colors.textTertiary} />
            <Text style={{
              fontFamily: Fonts.medium,
              fontSize: FontSizes.base,
              color: Colors.textSecondary,
              marginTop: 16,
              textAlign: 'center',
            }}>
              {t('noTodos')}
            </Text>
            <GradientButton
              title={t('addTodo')}
              onPress={() => setShowAddForm(true)}
              size="sm"
              fullWidth={false}
              style={{ marginTop: 16 }}
            />
          </View>
        )}
      </ScrollView>
    </View>
  );
}
