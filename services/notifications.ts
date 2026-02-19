/**
 * Notification Service
 * Handles local push notifications for:
 * - Todo deadline reminders
 * - Daily hajari reminders
 * - Salary payment reminders
 */

import * as Notifications from 'expo-notifications';

import { Platform } from 'react-native';
import type { TodoItem } from '@/lib/types';

// Daily to-do ke liye (har 1 ghante me)
export async function scheduleHourlyReminder(todoTitle: string) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '⏰ Daily Todo Reminder',
      body: `Don't forget: ${todoTitle}`,
      sound: 'default',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 3600, // 1 ghanta = 3600 seconds
      repeats: true,
    },
  });
}

// Monthly to-do ke liye (har 12 ghante me)
export async function scheduleTwelveHourlyReminder(todoTitle: string) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '⏰ Monthly Todo Reminder',
      body: `Don't forget: ${todoTitle}`,
      sound: 'default',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 43200, // 12 ghante = 43200 seconds
      repeats: true,
    },
  });
}

// ── Configure notification behavior ──────────────────────────────────
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// ── Request permissions ──────────────────────────────────────────────
export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === 'web') return false;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return false;
  }

  // Android needs a notification channel
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'SiteLy Notifications',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#0EA5E9',
      sound: 'default',
    });

    await Notifications.setNotificationChannelAsync('reminders', {
      name: 'Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#0EA5E9',
      sound: 'default',
    });
  }

  return true;
}

// ── Schedule todo deadline reminder ──────────────────────────────────
export async function scheduleTodoReminder(todo: TodoItem): Promise<string | null> {
  if (!todo.deadline || todo.isCompleted) return null;

  const deadlineDate = new Date(todo.deadline);
  const reminderDate = new Date(deadlineDate.getTime() - 60 * 60 * 1000); // 1 hour before

  if (reminderDate <= new Date()) return null; // Already past

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: '⏰ Todo Deadline Approaching',
      body: `"${todo.title}" is due in 1 hour`,
      data: { type: 'todo', todoId: todo.id },
      sound: 'default',
      ...(Platform.OS === 'android' && { channelId: 'reminders' }),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: reminderDate,
    },
  });

  return id;
}

// ── Schedule daily hajari reminder ───────────────────────────────────
export async function scheduleDailyHajariReminder(
  hour: number = 9,
  minute: number = 0
): Promise<string> {
  // Cancel existing daily reminder
  await cancelNotificationsByTag('daily-hajari');

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: '📋 Daily Hajari Reminder',
      body: 'Don\'t forget to mark today\'s attendance!',
      data: { type: 'hajari', tag: 'daily-hajari' },
      sound: 'default',
      ...(Platform.OS === 'android' && { channelId: 'reminders' }),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });

  return id;
}

// ── Schedule salary payment reminder ─────────────────────────────────
export async function schedulePaymentReminder(
  workerName: string,
  amount: number,
  date: Date
): Promise<string> {
  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: '💰 Payment Reminder',
      body: `Pay ₹${amount} to ${workerName}`,
      data: { type: 'payment' },
      sound: 'default',
      ...(Platform.OS === 'android' && { channelId: 'reminders' }),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date,
    },
  });

  return id;
}

// ── Instant notification ─────────────────────────────────────────────
export async function sendInstantNotification(
  title: string,
  body: string,
  data?: Record<string, any>
): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: data || {},
      sound: 'default',
    },
    trigger: null, // Immediate
  });
}

// ── Cancel notifications ─────────────────────────────────────────────
export async function cancelNotification(id: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(id);
}

export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

async function cancelNotificationsByTag(tag: string): Promise<void> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const notification of scheduled) {
    if ((notification.content.data as any)?.tag === tag) {
      await Notifications.cancelScheduledNotificationAsync(notification.identifier);
    }
  }
}

// ── Get push token (for future server notifications) ─────────────────
export async function getExpoPushToken(): Promise<string | null> {
  try {
    const token = await Notifications.getExpoPushTokenAsync();
    return token.data;
  } catch {
    return null;
  }
}

// ── Listeners ────────────────────────────────────────────────────────
export function addNotificationReceivedListener(
  callback: (notification: Notifications.Notification) => void
) {
  return Notifications.addNotificationReceivedListener(callback);
}

export function addNotificationResponseListener(
  callback: (response: Notifications.NotificationResponse) => void
) {
  return Notifications.addNotificationResponseReceivedListener(callback);
}
