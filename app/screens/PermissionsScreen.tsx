import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
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
      setNotificationGranted(
        settings.authorizationStatus === AuthorizationStatus.AUTHORIZED,
      );

      // Check overlay permission (Android only)
      if (Platform.OS === 'android' && OverlayPermissionModule) {
        const hasOverlay =
          await OverlayPermissionModule.checkOverlayPermission();
        setOverlayGranted(hasOverlay);
      } else {
        setOverlayGranted(true); // iOS doesn't need this
      }
    } catch (error) {
      console.error('Error checking permissions:', error);
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
          'Notification permission is required for alarms to work properly.',
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to request notification permission');
    }
  };

  const requestOverlayPermission = async () => {
    try {
      if (Platform.OS === 'android' && OverlayPermissionModule) {
        const hasPermission =
          await OverlayPermissionModule.checkOverlayPermission();
        if (!hasPermission) {
          await OverlayPermissionModule.requestOverlayPermission();
          // Recheck after returning from settings
          setTimeout(async () => {
            const granted =
              await OverlayPermissionModule.checkOverlayPermission();
            setOverlayGranted(granted);
          }, 1000);
        }
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

  const handleSkipOverlay = () => {
    Alert.alert(
      'Skip Overlay Permission?',
      'Alarm screen may not show on top of other apps. You can enable this later in settings.',
      [
        {text: 'Go Back', style: 'cancel'},
        {text: 'Skip Anyway', onPress: onComplete},
      ],
    );
  };

  if (checkingPermissions) {
    return (
      <LinearGradient
        colors={[theme.background, theme.surface, theme.surfaceVariant]}
        style={styles.container}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}>
        <View style={styles.center}>
          <Text style={styles.title}>Checking permissions...</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={[theme.background, theme.surface, theme.surfaceVariant]}
      style={styles.container}
      start={{x: 0, y: 0}}
      end={{x: 1, y: 1}}>
      <View style={styles.content}>
        <Text style={styles.title}>📱 Permissions Required</Text>
        <Text style={styles.subtitle}>
          Grant these permissions for the best alarm experience
        </Text>

        {/* Notification Permission */}
        <View style={styles.permissionCard}>
          <View style={styles.permissionHeader}>
            <Text style={styles.permissionIcon}>🔔</Text>
            <View style={styles.permissionTextContainer}>
              <Text style={styles.permissionTitle}>Notifications</Text>
              <Text style={styles.permissionDescription}>
                Required for alarms to ring and remind you
              </Text>
            </View>
          </View>
          <View style={styles.permissionStatus}>
            {notificationGranted ? (
              <View style={styles.statusGranted}>
                <Text style={styles.statusText}>✓ Granted</Text>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.grantButton}
                onPress={requestNotificationPermission}>
                <LinearGradient
                  colors={[theme.primary, theme.accent]}
                  style={styles.grantButtonGradient}
                  start={{x: 0, y: 0}}
                  end={{x: 1, y: 0}}>
                  <Text style={styles.grantButtonText}>Grant Permission</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Overlay Permission */}
        <View style={styles.permissionCard}>
          <View style={styles.permissionHeader}>
            <Text style={styles.permissionIcon}>📲</Text>
            <View style={styles.permissionTextContainer}>
              <Text style={styles.permissionTitle}>
                Display Over Other Apps
              </Text>
              <Text style={styles.permissionDescription}>
                Allows alarm screen to show on top of other apps
              </Text>
            </View>
          </View>
          <View style={styles.permissionStatus}>
            {overlayGranted ? (
              <View style={styles.statusGranted}>
                <Text style={styles.statusText}>✓ Granted</Text>
              </View>
            ) : (
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={styles.skipButton}
                  onPress={handleSkipOverlay}>
                  <Text style={styles.skipButtonText}>Skip</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.grantButton}
                  onPress={requestOverlayPermission}>
                  <LinearGradient
                    colors={[theme.primary, theme.accent]}
                    style={styles.grantButtonGradient}
                    start={{x: 0, y: 0}}
                    end={{x: 1, y: 0}}>
                    <Text style={styles.grantButtonText}>Grant</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* Continue Button */}
        <TouchableOpacity
          style={[
            styles.continueButton,
            !notificationGranted && styles.continueButtonDisabled,
          ]}
          onPress={handleContinue}
          disabled={!notificationGranted}>
          <LinearGradient
            colors={
              notificationGranted
                ? [theme.primary, theme.accent]
                : ['#999', '#777']
            }
            style={styles.continueButtonGradient}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 0}}>
            <Text style={styles.continueButtonText}>
              {notificationGranted
                ? 'Continue to App'
                : 'Grant Notifications First'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        {overlayGranted && (
          <Text style={styles.hint}>
            ✓ All permissions granted! You're ready to go.
          </Text>
        )}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: theme.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: theme.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
  },
  permissionCard: {
    backgroundColor: theme.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.borderLight,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  permissionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  permissionIcon: {
    fontSize: 40,
    marginRight: 16,
  },
  permissionTextContainer: {
    flex: 1,
  },
  permissionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.textPrimary,
    marginBottom: 4,
  },
  permissionDescription: {
    fontSize: 14,
    color: theme.textSecondary,
    lineHeight: 20,
  },
  permissionStatus: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  statusGranted: {
    backgroundColor: theme.success + '20',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  statusText: {
    color: theme.success,
    fontWeight: '600',
    fontSize: 14,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
  },
  grantButton: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  grantButtonGradient: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  grantButtonText: {
    color: theme.textInverse,
    fontWeight: '600',
    fontSize: 14,
  },
  skipButton: {
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.borderLight,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  skipButtonText: {
    color: theme.textSecondary,
    fontWeight: '600',
    fontSize: 14,
  },
  continueButton: {
    marginTop: 24,
    borderRadius: 12,
    overflow: 'hidden',
  },
  continueButtonDisabled: {
    opacity: 0.5,
  },
  continueButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  continueButtonText: {
    color: theme.textInverse,
    fontSize: 18,
    fontWeight: '700',
  },
  hint: {
    marginTop: 16,
    textAlign: 'center',
    color: theme.success,
    fontSize: 14,
    fontWeight: '600',
  },
});
