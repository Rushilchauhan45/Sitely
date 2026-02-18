import { QueryClientProvider } from "@tanstack/react-query";
import { Stack, router } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useRef } from "react";
import { Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { queryClient } from "@/lib/query-client";
import { AppProvider } from "@/lib/AppContext";
import {
  useFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from "@expo-google-fonts/poppins";
import {
  requestNotificationPermissions,
  scheduleDailyHajariReminder,
  addNotificationResponseListener,
} from '@/services/notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="index" options={{ gestureEnabled: false }} />
      <Stack.Screen name="auth" options={{ animation: 'fade', gestureEnabled: false }} />
      <Stack.Screen name="onboarding" options={{ animation: 'fade', gestureEnabled: false }} />
      <Stack.Screen name="dashboard" options={{ animation: 'fade', gestureEnabled: false }} />
      <Stack.Screen name="create-site" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
      <Stack.Screen name="todo" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="owner-dashboard" options={{ animation: 'fade', gestureEnabled: false }} />
      <Stack.Screen name="site/[id]" />
      <Stack.Screen name="site/add-worker" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
      <Stack.Screen name="site/hajari" />
      <Stack.Screen name="site/expense" />
      <Stack.Screen name="site/payment" />
      <Stack.Screen name="site/payment-history" />
      <Stack.Screen name="site/photos" />
      <Stack.Screen name="site/workers" />
      <Stack.Screen name="site/materials" />
      <Stack.Screen name="site/reports" />
      <Stack.Screen name="profile" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="help" />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  // ── Notification setup ──────────────────────────────────
  const notifSetupDone = useRef(false);
  useEffect(() => {
    if (!fontsLoaded || notifSetupDone.current || Platform.OS === 'web') return;
    notifSetupDone.current = true;

    (async () => {
      const granted = await requestNotificationPermissions();
      if (granted) {
        // Schedule daily hajari reminder at 9 AM if user opted in
        const enabled = await AsyncStorage.getItem('@notifications_enabled');
        if (enabled !== 'false') {
          scheduleDailyHajariReminder(9, 0).catch(() => {});
        }
      }
    })();

    // Handle notification tap → navigate to relevant screen
    const sub = addNotificationResponseListener((response) => {
      const data = response.notification.request.content.data as any;
      if (data?.type === 'todo') {
        router.push('/todo' as any);
      } else if (data?.type === 'hajari') {
        router.push('/dashboard' as any);
      } else if (data?.type === 'payment') {
        router.push('/dashboard' as any);
      } else {
        router.push('/notifications' as any);
      }
    });

    return () => sub.remove();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <KeyboardProvider>
            <AppProvider>
              <RootLayoutNav />
            </AppProvider>
          </KeyboardProvider>
        </GestureHandlerRootView>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
