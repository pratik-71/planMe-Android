import React, {useState, useEffect} from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {theme} from '../../stores/ThemeStore';
import {getContextualMotivation} from '../../constants/motivationalQuotes';

interface Props {
  onScheduleDay: () => void;
  onViewDay: () => void;
  onOpenWaterBreaks: () => void;
  onManage: () => void;
  completionRate?: number;
}

export default function HomeScreen({
  onScheduleDay,
  onViewDay,
  onOpenWaterBreaks,
  onManage,
  completionRate,
}: Props) {
  const [motivationQuote, setMotivationQuote] = useState('');

  useEffect(() => {
    // Get current time of day
    const hour = new Date().getHours();
    const day = new Date().getDay();

    let timeOfDay: 'morning' | 'evening' | 'weekend' | undefined;

    if (day === 0 || day === 6) {
      timeOfDay = 'weekend';
    } else if (hour >= 6 && hour < 12) {
      timeOfDay = 'morning';
    } else if (hour >= 18) {
      timeOfDay = 'evening';
    }

    // Get motivational quote based on context
    const quote = getContextualMotivation({
      completionRate: completionRate,
      currentStreak: 0, // Will be updated when backend integration is complete
      timeOfDay: timeOfDay,
    });

    setMotivationQuote(quote);
  }, [completionRate]);
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

        {/* Motivational Quote Card */}
        {motivationQuote && (
          <View style={styles.motivationCard}>
            <LinearGradient
              colors={[theme.primary + '15', theme.accent + '10']}
              style={styles.motivationGradient}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 1}}>
              <View style={styles.motivationIconContainer}>
                <Text style={styles.motivationIcon}>💪</Text>
              </View>
              <Text style={styles.motivationText}>{motivationQuote}</Text>
            </LinearGradient>
          </View>
        )}

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

          <TouchableOpacity style={styles.manageButton} onPress={onManage}>
            <LinearGradient
              colors={[theme.surfaceVariant, theme.surface]}
              style={styles.manageButtonGradient}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 0}}>
              <Text style={styles.manageButtonText}>
                Manage Templates & Schedules
              </Text>
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
    marginBottom: 20,
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
  motivationCard: {
    width: '100%',
    maxWidth: 340,
    marginBottom: 24,
    borderRadius: 16,
    shadowColor: theme.primary,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  motivationGradient: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.primary + '30',
  },
  motivationIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  motivationIcon: {
    fontSize: 22,
  },
  motivationText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: theme.textPrimary,
    fontWeight: '600',
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
  manageButton: {
    borderRadius: 12,
    shadowColor: theme.shadow,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 2,
    overflow: 'hidden',
    marginTop: 8,
    borderWidth: 1,
    borderColor: theme.borderLight,
  },
  manageButtonGradient: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  manageButtonText: {
    color: theme.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
});
