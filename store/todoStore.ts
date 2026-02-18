// ============================================================
// 🏪 TODO STORE — Zustand state for to-do management
// ============================================================

import { create } from 'zustand';
import type { TodoItem, TodoType } from '../lib/types';

interface TodoState {
  todos: TodoItem[];

  // Actions
  setTodos: (todos: TodoItem[]) => void;
  addTodo: (todo: TodoItem) => void;
  removeTodo: (id: string) => void;
  toggleTodo: (id: string) => void;
  updateTodo: (id: string, updates: Partial<TodoItem>) => void;
}

export const useTodoStore = create<TodoState>((set) => ({
  todos: [],

  setTodos: (todos) => set({ todos }),

  addTodo: (todo) =>
    set((state) => ({
      todos: [todo, ...state.todos],
    })),

  removeTodo: (id) =>
    set((state) => ({
      todos: state.todos.filter((t) => t.id !== id),
    })),

  toggleTodo: (id) =>
    set((state) => ({
      todos: state.todos.map((t) =>
        t.id === id
          ? {
              ...t,
              isCompleted: !t.isCompleted,
              completedAt: !t.isCompleted ? new Date().toISOString() : null,
            }
          : t,
      ),
    })),

  updateTodo: (id, updates) =>
    set((state) => ({
      todos: state.todos.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    })),
}));
