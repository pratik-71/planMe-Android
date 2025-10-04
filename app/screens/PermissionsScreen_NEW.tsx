import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {theme} from '../../stores/ThemeStore';
import notifee, {AuthorizationStatus} from '@notifee/react-native';
import {NativeModules} from 'react-native';

const {OverlayPermissionModule} = NativeModules;

interface PermissionsScreenProps {
  onComplete: () => void;
}

export default function PermissionsScreen({
  onComplete,
}: PermissionsScreenProps) {
  const [notificationGranted, setNotificationGranted] = useState(false);
  const [overlayGranted, setOverlayGranted] = useState(false);
  const [checkingPermissions, setCheckingPermissions] = useState(true);

  useEffect(() => {
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    try {
      // Check notification permission
      const settings = await notifee.getNotificationSettings();
      const notifGranted =
        settings.authorizationStatus === AuthorizationStatus.AUTHORIZED;
      setNotificationGranted(notifGranted);

      // Check overlay permission (Android only)
      if (Platform.OS === 'android' && OverlayPermissionModule) {
        try {
          const overlayPerm =
            await OverlayPermissionModule.checkOverlayPermission();
          setOverlayGranted(overlayPerm);
        } catch (error) {
          setOverlayGranted(false);
        }
      } else {
        setOverlayGranted(true); // Not applicable on iOS
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to check permissions');
    } finally {
      setCheckingPermissions(false);
    }
  };

  const requestNotificationPermission = async () => {
    try {
      const settings = await notifee.requestPermission();
      const granted =
        settings.authorizationStatus === AuthorizationStatus.AUTHORIZED;
      setNotificationGranted(granted);

      if (!granted) {
        Alert.alert(
          'Permission Denied',
          'Notification permission is required for reminders and alarms.',
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to request notification permission');
    }
  };

  const requestOverlayPermission = async () => {
    try {
      if (Platform.OS === 'android' && OverlayPermissionModule) {
        await OverlayPermissionModule.requestOverlayPermission();
        // Recheck after returning from settings
        setTimeout(async () => {
          const granted =
            await OverlayPermissionModule.checkOverlayPermission();
          setOverlayGranted(granted);
        }, 1000);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to request overlay permission');
    }
  };

  const handleContinue = () => {
    if (!notificationGranted) {
      Alert.alert(
        'Required Permission',
        'Notification permission is required for alarms to work.',
        [
          {text: 'Cancel', style: 'cancel'},
          {text: 'Grant Permission', onPress: requestNotificationPermission},
        ],
      );
      return;
    }
    onComplete();
  };

  if (checkingPermissions) {
    return (
      <LinearGradient
        colors={[theme.primary, theme.primaryDark, theme.accent]}
        style={styles.container}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.loadingText}>Checking permissions...</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={[theme.primary, theme.primaryDark, theme.accent]}
      style={styles.container}
      start={{x: 0, y: 0}}
      end={{x: 1, y: 1}}>
      <View style={styles.content}>
        <Text style={styles.appIcon}>🔔</Text>
        <Text style={styles.mainTitle}>App Permissions</Text>
        <Text style={styles.mainSubtitle}>
          Grant these permissions for the best experience
        </Text>

        {/* Notification Permission Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Notifications</Text>
            {notificationGranted ? (
              <Text style={styles.statusGranted}>✓ Granted</Text>
            ) : (
              <Text style={styles.statusPending}>Required</Text>
            )}
          </View>
          <Text style={styles.cardDescription}>
            Essential for alarms and reminders to work properly
          </Text>
          {!notificationGranted && (
            <TouchableOpacity
              style={styles.grantButton}
              onPress={requestNotificationPermission}
              activeOpacity={0.8}>
              <LinearGradient
                colors={[theme.accent, '#0097A7']}
                style={styles.grantButtonGradient}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 0}}>
                <Text style={styles.grantButtonText}>Grant Permission</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>

        {/* Overlay Permission Card (Android Only) */}
        {Platform.OS === 'android' && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Display Over Apps</Text>
              {overlayGranted ? (
                <Text style={styles.statusGranted}>✓ Granted</Text>
              ) : (
                <Text style={styles.statusOptional}>Optional</Text>
              )}
            </View>
            <Text style={styles.cardDescription}>
              Shows alarms on top of other apps, even when locked
            </Text>
            {!overlayGranted && (
              <>
                <TouchableOpacity
                  style={styles.grantButton}
                  onPress={requestOverlayPermission}
                  activeOpacity={0.8}>
                  <LinearGradient
                    colors={[theme.accent, '#0097A7']}
                    style={styles.grantButtonGradient}
                    start={{x: 0, y: 0}}
                    end={{x: 1, y: 0}}>
                    <Text style={styles.grantButtonText}>Grant Permission</Text>
                  </LinearGradient>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.skipButton}
                  onPress={handleContinue}>
                  <Text style={styles.skipButtonText}>Skip for now</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}

        {/* Continue Button */}
        <TouchableOpacity
          style={[
            styles.continueButton,
            !notificationGranted && styles.continueButtonDisabled,
          ]}
          onPress={handleContinue}
          disabled={!notificationGranted}
          activeOpacity={0.9}>
          <LinearGradient
            colors={
              notificationGranted
                ? ['#FFFFFF', '#F8F9FE']
                : [theme.disabled, theme.disabled]
            }
            style={styles.continueButtonGradient}
            start={{x: 0, y: 0}}
            end={{x: 0, y: 1}}>
            <Text
              style={[
                styles.continueButtonText,
                !notificationGranted && styles.continueButtonTextDisabled,
              ]}>
              Continue →
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
  },
  content: {
    width: '100%',
    maxWidth: 420,
    padding: 32,
    borderRadius: 28,
    backgroundColor: theme.surface,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 16},
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 20,
  },
  appIcon: {
    fontSize: 72,
    marginBottom: 20,
  },
  mainTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: theme.textPrimary,
    marginBottom: 12,
    letterSpacing: -0.8,
  },
  mainSubtitle: {
    fontSize: 15,
    color: theme.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
    fontWeight: '500',
    lineHeight: 22,
  },
  card: {
    backgroundColor: theme.background,
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
    width: '100%',
    borderWidth: 2,
    borderColor: theme.border,
    shadowColor: theme.shadow,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.textPrimary,
    letterSpacing: -0.3,
  },
  statusGranted: {
    color: theme.success,
    fontWeight: '800',
    fontSize: 14,
    letterSpacing: 0.2,
  },
  statusPending: {
    color: theme.error,
    fontWeight: '800',
    fontSize: 14,
    letterSpacing: 0.2,
  },
  statusOptional: {
    color: theme.info,
    fontWeight: '700',
    fontSize: 13,
  },
  cardDescription: {
    fontSize: 14,
    color: theme.textSecondary,
    marginBottom: 16,
    lineHeight: 20,
    fontWeight: '500',
  },
  grantButton: {
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 4,
    shadowColor: theme.accent,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  grantButtonGradient: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  grantButtonText: {
    color: theme.textInverse,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  skipButton: {
    marginTop: 12,
    alignItems: 'center',
    paddingVertical: 8,
  },
  skipButtonText: {
    color: theme.textTertiary,
    fontSize: 13,
    fontWeight: '600',
  },
  continueButton: {
    width: '100%',
    borderRadius: 18,
    overflow: 'hidden',
    marginTop: 24,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  continueButtonDisabled: {
    shadowOpacity: 0,
    elevation: 0,
  },
  continueButtonGradient: {
    paddingVertical: 18,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButtonText: {
    color: theme.textPrimary,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  continueButtonTextDisabled: {
    color: theme.disabledText,
  },
});
