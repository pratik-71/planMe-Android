import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {theme} from '../../stores/ThemeStore';

interface Props {
  onScheduleDay: () => void;
  onViewDay: () => void;
  onOpenWaterBreaks: () => void;
}

export default function HomeScreen({
  onScheduleDay,
  onViewDay,
  onOpenWaterBreaks,
}: Props) {
  return (
    <LinearGradient
      colors={[theme.background, theme.surface, theme.surfaceVariant]}
      style={styles.container}
      start={{x: 0, y: 0}}
      end={{x: 1, y: 1}}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>PlanMe</Text>
          <Text style={styles.subtitle}>Simple daily planning</Text>
        </View>

        <View style={styles.buttonsContainer}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={onScheduleDay}>
            <LinearGradient
              colors={[theme.primary, theme.accent]}
              style={styles.primaryButtonGradient}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 0}}>
              <Text style={styles.primaryButtonText}>Schedule a day</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton} onPress={onViewDay}>
            <LinearGradient
              colors={[theme.accent, theme.primary]}
              style={styles.secondaryButtonGradient}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 0}}>
              <Text style={styles.secondaryButtonText}>View day</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.waterButton}
            onPress={onOpenWaterBreaks}>
            <LinearGradient
              colors={['#4FC3F7', '#0288D1']}
              style={styles.waterButtonGradient}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 0}}>
              <Text style={styles.waterButtonText}>Schedule Water Breaks</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: theme.primary,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: theme.textSecondary,
    textAlign: 'center',
    fontWeight: '500',
  },
  buttonsContainer: {
    width: '100%',
    maxWidth: 320,
  },
  primaryButton: {
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: theme.primary,
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  primaryButtonGradient: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    borderRadius: 12,
    shadowColor: theme.accent,
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
    marginBottom: 16,
  },
  secondaryButtonGradient: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  waterButton: {
    borderRadius: 12,
    shadowColor: '#0288D1',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  waterButtonGradient: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  waterButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
