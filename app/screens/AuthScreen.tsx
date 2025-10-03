import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {theme} from '../../stores/ThemeStore';
import {BackendService} from '../../services/BackendService';
const {GoogleSignin} = require('@react-native-google-signin/google-signin');
import LoaderOverlay from '../../components/LoaderOverlay';

const BACKEND_URL = 'https://planme-backend-eduf.onrender.com/api';

// Local types
interface User {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
}

interface AuthScreenProps {
  onAuthSuccess: () => void;
}

export default function AuthScreen({onAuthSuccess}: AuthScreenProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [showUsername, setShowUsername] = useState(false);
  const [pendingUser, setPendingUser] = useState<User | null>(null);
  const [username, setUsername] = useState('');
  const [usernameError, setUsernameError] = useState('');

  const handleGoogleSignIn = async () => {
    if (isLoading) return;
    setIsLoading(true);
    setStatusMsg('Signing in with Google...');

    try {
      // Configure Google Sign-In
      GoogleSignin.configure({
        webClientId:
          '856167145171-gdoaft7lmhra3oa0dantda2qll493lam.apps.googleusercontent.com',
        offlineAccess: true,
        forceCodeForRefreshToken: true,
      });

      await GoogleSignin.hasPlayServices({showPlayServicesUpdateDialog: true});
      await GoogleSignin.signIn();
      const {idToken} = await GoogleSignin.getTokens();
      if (!idToken) throw new Error('No Google ID token received');

      // Send Google token directly to backend for verification
      const response = await fetch(`${BACKEND_URL}/user/google-auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({idToken}),
      });

      if (!response.ok) {
        throw new Error('Backend authentication failed');
      }

      const data = await response.json();

      if (!data.success || !data.user) {
        throw new Error('Authentication failed');
      }

      const {user: backendUser} = data;
      const userId = backendUser.user_id;
      const email = backendUser.email;
      const name = backendUser.name;
      const avatarUrl = data.user.avatar_url;

      if (name && name.trim().length > 0) {
        setStatusMsg('Welcome back!');
        setIsLoading(false);

        // Update auth store with user data
        const {useAuthStore} = require('../../stores/authStore');
        await useAuthStore.getState().setUser({
          id: userId,
          email,
          name,
          avatar_url: avatarUrl,
        });

        // Small delay to ensure state update is processed
        setTimeout(() => {
          onAuthSuccess();
        }, 100);
      } else {
        const nextUser: User = {
          id: userId,
          email,
          avatar_url: avatarUrl,
        };
        setPendingUser(nextUser);
        setShowUsername(true);
        setStatusMsg('Choose a username');
        setIsLoading(false);
      }
    } catch (e: any) {
      setStatusMsg('Sign-in failed');
      Alert.alert('Sign In Error', e?.message || 'Failed to sign in');
      setIsLoading(false);
    }
  };

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

  const handleSaveUsername = async () => {
    if (!pendingUser) return;

    if (!validateUsername()) {
      return;
    }

    setIsLoading(true);
    setStatusMsg('Creating account...');

    try {
      await BackendService.createUser(
        pendingUser.id,
        pendingUser.email,
        username.trim(),
      );

      // account created

      setStatusMsg('Account created successfully!');

      // Update auth store with user data
      const {useAuthStore} = require('../../stores/authStore');
      useAuthStore.getState().setUser({
        id: pendingUser.id,
        email: pendingUser.email,
        name: username.trim(),
        avatar_url: pendingUser.avatar_url,
      });

      // Clear loading and proceed immediately
      setIsLoading(false);
      setShowUsername(false);
      setPendingUser(null);
      setUsername('');

      // Small delay to ensure state update is processed
      setTimeout(() => {
        onAuthSuccess();
      }, 100);
    } catch (e: any) {
      console.error('Account creation error:', e);
      setStatusMsg('Failed to create account');
      Alert.alert('Error', e?.message || 'Failed to create user');
      setIsLoading(false);
    }
  };

  if (showUsername) {
    return (
      <LinearGradient
        colors={['#F5FAFF', '#ECFDF5', '#E8F7F6']}
        style={styles.container}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <View style={styles.center}>
          <Text style={styles.title}>Choose a username</Text>
          <Text style={styles.subtitle}>{pendingUser?.email}</Text>
          <TextInput
            style={[styles.input, usernameError ? styles.inputError : null]}
            placeholder="Your username"
            placeholderTextColor={theme.textSecondary}
            value={username}
            onChangeText={text => {
              setUsername(text);
              if (usernameError && text.trim().length >= 2) {
                setUsernameError('');
              }
            }}
            autoCapitalize="none"
          />
          {usernameError && (
            <Text style={styles.errorText}>{usernameError}</Text>
          )}
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleSaveUsername}
            disabled={isLoading || !username.trim()}>
            {isLoading ? (
              <ActivityIndicator color={theme.textInverse} />
            ) : (
              <Text style={styles.primaryText}>Save and continue</Text>
            )}
          </TouchableOpacity>
          {statusMsg ? <Text style={styles.hint}>{statusMsg}</Text> : null}
        </View>
        <LoaderOverlay visible={isLoading} message={statusMsg} />
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={[theme.background, theme.surface, theme.surfaceVariant]}
      style={styles.container}
      start={{x: 0, y: 0}}
      end={{x: 1, y: 1}}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent
      />
      <View style={styles.center}>
        <Text style={styles.title}>Welcome</Text>
        <Text style={styles.subtitle}>Sign in with Google to continue</Text>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleGoogleSignIn}
          disabled={isLoading}>
          <LinearGradient
            colors={[theme.primary, theme.accent]}
            style={styles.primaryButtonGradient}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 0}}>
            {isLoading ? (
              <ActivityIndicator color={theme.textInverse} />
            ) : (
              <Text style={styles.primaryText}>Continue with Google</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
        {statusMsg ? <Text style={styles.hint}>{statusMsg}</Text> : null}
      </View>
      <LoaderOverlay visible={isLoading} message={statusMsg} />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1},
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: theme.primary,
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: theme.textSecondary,
    marginBottom: 32,
    textAlign: 'center',
  },
  primaryButton: {
    borderRadius: 16,
    shadowColor: theme.primary,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  primaryButtonGradient: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: {
    color: theme.textInverse,
    fontWeight: '700',
    fontSize: 18,
    letterSpacing: 0.5,
    textShadowColor: theme.shadow,
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 2,
  },
  input: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: theme.background,
    borderColor: theme.border,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: theme.textPrimary,
    marginTop: 12,
    marginBottom: 12,
  },
  hint: {
    marginTop: 16,
    color: theme.textSecondary,
    fontSize: 14,
    textAlign: 'center',
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
});
