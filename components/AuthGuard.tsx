import React, {useEffect} from 'react';
import {View, ActivityIndicator, StyleSheet} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {useAuthStore} from '../stores/authStore';
import AuthScreen from '../app/screens/AuthScreen';
import {theme} from '../stores/ThemeStore';
import {
  initialize as initializeAlarms,
  initializeAdvancedFeatures,
} from '../services/AlarmScheduler';

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({children}: AuthGuardProps) {
  const user = useAuthStore(s => s.user);
  const isLoading = useAuthStore(s => s.isLoading);
  const init = useAuthStore(s => s.init);

  useEffect(() => {
    init();
  }, [init]);

  // Initialize alarm system when user is authenticated and enters home page
  useEffect(() => {
    if (user && !isLoading) {
      // User has successfully signed in and is on home page
      // Now safely initialize alarm system with permissions
      setTimeout(async () => {
        try {
          // First initialize basic alarm system
          await initializeAlarms();
          // Then set up advanced features (event handlers, rescheduling)
          await initializeAdvancedFeatures();
        } catch (error) {
          // Silent fail - app continues working without alarms
        }
      }, 1000); // Small delay to ensure app is fully loaded
    }
  }, [user, isLoading]);

  if (isLoading) {
    return (
      <LinearGradient
        colors={[theme.background, theme.surface, theme.surfaceVariant]}
        style={styles.loadingContainer}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}>
        <View style={styles.loadingContent}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      </LinearGradient>
    );
  }

  if (!user) {
    return <AuthScreen onAuthSuccess={() => {}} />;
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
  },
  loadingContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
