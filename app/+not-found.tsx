import { useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';

export default function NotFoundScreen() {
  useEffect(() => {
    // Redirect unknown routes to the root index which handles auth routing
    router.replace('/');
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#0EA5E9" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
