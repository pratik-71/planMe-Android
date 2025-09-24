import React from 'react';
import {View, StyleSheet, ActivityIndicator, Modal, Text} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {theme} from '../stores/ThemeStore';

interface LoaderOverlayProps {
  visible: boolean;
  message?: string;
}

export default function LoaderOverlay({visible, message}: LoaderOverlayProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent>
      <LinearGradient
        colors={[theme.background, theme.surface, theme.surfaceVariant]}
        style={styles.container}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}>
        <View style={styles.centerBox}>
          <LinearGradient
            colors={[theme.background, theme.surface]}
            style={styles.loaderCard}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}>
            <ActivityIndicator size="large" color={theme.primary} />
            {message && <Text style={styles.message}>{message}</Text>}
          </LinearGradient>
        </View>
      </LinearGradient>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loaderCard: {
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    shadowColor: theme.shadow,
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
    borderWidth: 1,
    borderColor: theme.borderLight,
  },
  message: {
    marginTop: 16,
    fontSize: 16,
    color: theme.textSecondary,
    textAlign: 'center',
    fontWeight: '600',
  },
});
