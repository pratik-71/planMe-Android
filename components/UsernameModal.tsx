import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {theme} from '../stores/ThemeStore';

interface UsernameModalProps {
  visible: boolean;
  userEmail: string;
  onSave: (username: string) => Promise<void>;
  onCancel: () => void;
}

export default function UsernameModal({
  visible,
  userEmail,
  onSave,
  onCancel,
}: UsernameModalProps) {
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [usernameError, setUsernameError] = useState('');

  const validateUsername = () => {
    if (!username.trim()) {
      setUsernameError('Username is required');
      return false;
    }
    if (username.trim().length < 2) {
      setUsernameError('Username must be at least 2 characters long');
      return false;
    }
    setUsernameError('');
    return true;
  };

  const handleSave = async () => {
    if (!validateUsername()) {
      return;
    }

    setIsLoading(true);
    try {
      await onSave(username.trim());
      setUsername('');
      setUsernameError('');
    } catch (error) {
      Alert.alert('Error', 'Failed to save username. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setUsername('');
    onCancel();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleCancel}>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <LinearGradient
            colors={[theme.background, theme.surfaceVariant]}
            style={styles.modalGradient}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Welcome! 👋</Text>
              <Text style={styles.subtitle}>
                Let's set up your profile to get started
              </Text>
            </View>

            {/* User Info */}
            <View style={styles.userInfo}>
              <Text style={styles.emailLabel}>Signed in as:</Text>
              <Text style={styles.emailText}>{userEmail}</Text>
            </View>

            {/* Username Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Choose a username</Text>
              <TextInput
                style={[styles.input, usernameError ? styles.inputError : null]}
                placeholder="Enter your username"
                placeholderTextColor={theme.textTertiary}
                value={username}
                onChangeText={text => {
                  setUsername(text);
                  if (usernameError && text.trim().length >= 2) {
                    setUsernameError('');
                  }
                }}
                maxLength={30}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
              />
              {usernameError && (
                <Text style={styles.errorText}>{usernameError}</Text>
              )}
              <Text style={styles.inputHint}>
                This will be displayed in your app
              </Text>
            </View>

            {/* Buttons */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleCancel}
                disabled={isLoading}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSave}
                disabled={isLoading || !username.trim()}>
                <LinearGradient
                  colors={
                    isLoading || !username.trim()
                      ? [theme.disabled, theme.disabled]
                      : [theme.primary, theme.primaryDark]
                  }
                  style={styles.saveButtonGradient}
                  start={{x: 0, y: 0}}
                  end={{x: 1, y: 0}}>
                  {isLoading ? (
                    <ActivityIndicator color={theme.textInverse} size="small" />
                  ) : (
                    <Text style={styles.saveButtonText}>Save & Continue</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 24,
    shadowColor: theme.shadow,
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  modalGradient: {
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(233, 30, 99, 0.1)',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: theme.textPrimary,
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: theme.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  userInfo: {
    backgroundColor: theme.surface,
    padding: 16,
    borderRadius: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: theme.borderLight,
  },
  emailLabel: {
    fontSize: 14,
    color: theme.textTertiary,
    marginBottom: 4,
    fontWeight: '500',
  },
  emailText: {
    fontSize: 16,
    color: theme.textPrimary,
    fontWeight: '600',
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.textPrimary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: theme.background,
    borderColor: theme.primary,
    borderWidth: 2,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: theme.textPrimary,
    fontWeight: '500',
    shadowColor: theme.shadow,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  inputHint: {
    fontSize: 12,
    color: theme.textTertiary,
    marginTop: 6,
    fontStyle: 'italic',
  },
  inputError: {
    borderColor: theme.error,
    borderWidth: 2,
  },
  errorText: {
    color: theme.error,
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
    fontWeight: '500',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.textSecondary,
  },
  saveButton: {
    flex: 1,
    borderRadius: 16,
    shadowColor: theme.shadow,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.textInverse,
    letterSpacing: 0.5,
  },
});
