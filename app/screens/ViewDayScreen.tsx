import React, {useEffect, useMemo, useState, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
  BackHandler,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import LinearGradient from 'react-native-linear-gradient';
import {ScheduleDay} from '../../domain/schedule.types';
import {
  loadAllPlansForDate,
  saveSchedule,
} from '../../services/ScheduleService';
import {theme} from '../../stores/ThemeStore';

interface Props {
  dateISO: string;
  onBack?: () => void;
}

export default function ViewDayScreen({
  dateISO: initialDateISO,
  onBack,
}: Props) {
  const [plans, setPlans] = useState<ScheduleDay[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date(initialDateISO));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [currentDateISO, setCurrentDateISO] = useState(initialDateISO);

  // Check if the current date is today (for editing restrictions)
  const isToday = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return currentDateISO === today;
  }, [currentDateISO]);

  const dayName = useMemo(
    () =>
      new Date(currentDateISO).toLocaleDateString(undefined, {weekday: 'long'}),
    [currentDateISO],
  );

  const loadPlan = useCallback(async (dateISO: string) => {
    setIsLoading(true);
    try {
      const allPlans = await loadAllPlansForDate(dateISO);
      setPlans(allPlans);
    } catch (error) {
      console.error('Error loading plans:', error);
      Alert.alert('Error', 'Failed to load plans for selected date');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleBackPress = useCallback(() => {
    if (onBack) {
      onBack();
    }
  }, [onBack]);

  const changeDay = (direction: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + direction);
    const newDateISO = newDate.toISOString().slice(0, 10);
    setSelectedDate(newDate);
    setCurrentDateISO(newDateISO);
  };

  const handleDateChange = (event: any, pickedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (pickedDate) {
      const newDateISO = pickedDate.toISOString().slice(0, 10);
      setSelectedDate(pickedDate);
      setCurrentDateISO(newDateISO);
    }
  };

  useEffect(() => {
    loadPlan(currentDateISO);
  }, [loadPlan, currentDateISO]);

  // Handle hardware back button on Android
  useEffect(() => {
    const backAction = () => {
      handleBackPress();
      return true; // Prevent default behavior
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction,
    );
    return () => backHandler.remove();
  }, [handleBackPress]);

  const toggleSubgoal = async (
    planId: number,
    slotId: string,
    subgoalId: string,
  ) => {
    if (!plans.length || isUpdating) return;

    // Only allow editing today's plan
    if (!isToday) {
      Alert.alert(
        'Cannot Edit',
        "You can only edit today's plan. Please select today's date to make changes.",
        [{text: 'OK'}],
      );
      return;
    }

    setIsUpdating(true);
    try {
      const updatedPlans = plans.map(plan => {
        if (plan.planId === planId) {
          return {
            ...plan,
            slots: plan.slots.map(s =>
              s.id === slotId
                ? {
                    ...s,
                    subgoals: s.subgoals.map(g =>
                      g.id === subgoalId ? {...g, completed: !g.completed} : g,
                    ),
                  }
                : s,
            ),
          };
        }
        return plan;
      });
      setPlans(updatedPlans);

      // Find the updated plan and save it
      const updatedPlan = updatedPlans.find(plan => plan.planId === planId);
      if (updatedPlan) {
        await saveSchedule(updatedPlan);
      }
    } catch (error) {
      console.error('Error updating subgoal:', error);
      Alert.alert('Error', 'Failed to update subgoal');
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <LinearGradient
        colors={[theme.background, theme.surface, theme.surfaceVariant]}
        style={styles.loadingContainer}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={styles.loadingText}>Loading today's plan...</Text>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={[theme.background, theme.surface, theme.surfaceVariant]}
      style={styles.container}
      start={{x: 0, y: 0}}
      end={{x: 1, y: 1}}>
      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={[theme.primary, theme.primaryDark]}
          style={styles.header}
          start={{x: 0, y: 0}}
          end={{x: 0, y: 0}}>
          <TouchableOpacity
            style={styles.navButton}
            onPress={() => changeDay(-1)}>
            <Text style={styles.navButtonText}>◀</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.dateCard}
            onPress={() => setShowDatePicker(true)}>
            <Text style={styles.dayName}>{dayName}</Text>
            <Text style={styles.dateText}>{currentDateISO}</Text>
            {!isToday && (
              <Text style={styles.readOnlyIndicator}>Read Only</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navButton}
            onPress={() => changeDay(1)}>
            <Text style={styles.navButtonText}>▶</Text>
          </TouchableOpacity>
        </LinearGradient>

        {showDatePicker && (
          <View style={styles.datePickerContainer}>
            <DateTimePicker
              value={selectedDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleDateChange}
              maximumDate={new Date(2030, 11, 31)}
              minimumDate={new Date(2020, 0, 1)}
            />
          </View>
        )}

        {plans.length > 0 ? (
          <View style={styles.plansContainer}>
            {plans.map((plan, planIndex) => (
              <View key={plan.planId || planIndex} style={styles.planCard}>
                <View style={styles.planHeader}>
                  <Text style={styles.planTitle}>
                    {plan.planName || `Plan ${planIndex + 1}`}
                  </Text>
                  <Text style={styles.planSubtitle}>
                    {plan.slots.length} time slot
                    {plan.slots.length !== 1 ? 's' : ''}
                  </Text>
                </View>

                {plan.slots.length > 0 && (
                  <View style={styles.slotsContainer}>
                    {plan.slots.map(item => (
                      <LinearGradient
                        key={item.id}
                        colors={[theme.background, theme.surface]}
                        style={styles.slotCard}
                        start={{x: 0, y: 0}}
                        end={{x: 1, y: 1}}>
                        <View style={styles.slotHeader}>
                          <Text style={styles.slotTitle}>{item.title}</Text>
                          <View style={styles.timeBadge}>
                            <Text style={styles.timeText}>
                              {new Date(item.startISO).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </Text>
                          </View>
                        </View>

                        {item.subgoals.length > 0 && (
                          <View style={styles.subgoalsContainer}>
                            <Text style={styles.subgoalsTitle}>Subgoals</Text>
                            {item.subgoals.map(sg => (
                              <View key={sg.id} style={styles.subgoalRow}>
                                <TouchableOpacity
                                  style={[
                                    styles.subgoalContent,
                                    !isToday && styles.subgoalContentDisabled,
                                  ]}
                                  onPress={() =>
                                    toggleSubgoal(plan.planId!, item.id, sg.id)
                                  }
                                  disabled={isUpdating || !isToday}>
                                  <View style={styles.checkboxContainer}>
                                    <View
                                      style={[
                                        styles.checkbox,
                                        sg.completed &&
                                          styles.checkboxCompleted,
                                        !isToday && styles.checkboxDisabled,
                                      ]}>
                                      {sg.completed && (
                                        <Text style={styles.checkmark}>✓</Text>
                                      )}
                                    </View>
                                  </View>
                                  <View style={styles.subgoalTextContainer}>
                                    <Text
                                      style={[
                                        styles.subgoalText,
                                        sg.completed && styles.completedText,
                                        !isToday && styles.subgoalTextDisabled,
                                      ]}>
                                      {sg.text}
                                    </Text>
                                    <Text
                                      style={[
                                        styles.subgoalPriority,
                                        !isToday &&
                                          styles.subgoalPriorityDisabled,
                                      ]}>
                                      {sg.priority || 'Medium'}
                                    </Text>
                                  </View>
                                </TouchableOpacity>
                              </View>
                            ))}
                          </View>
                        )}
                      </LinearGradient>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📅</Text>
            <Text style={styles.emptyTitle}>No plans for {currentDateISO}</Text>
            <Text style={styles.emptySubtitle}>
              Create your first plan to get started
            </Text>
          </View>
        )}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: theme.textPrimary,
    fontWeight: '600',
  },
  scrollContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 20,
    shadowColor: theme.shadow,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  navButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 40,
  },
  navButtonText: {
    fontWeight: '800',
    color: theme.textInverse,
    fontSize: 16,
  },
  dateCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginHorizontal: 8,
  },
  dayName: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.textInverse,
    marginBottom: 2,
  },
  dateText: {
    color: theme.textInverse,
    fontSize: 11,
    fontWeight: '600',
  },
  readOnlyIndicator: {
    color: theme.textInverse,
    fontSize: 9,
    fontWeight: '600',
    marginTop: 2,
    opacity: 0.8,
  },
  datePickerContainer: {
    backgroundColor: theme.surface,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: theme.shadow,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: theme.textInverse,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: theme.textInverse,
    marginTop: 4,
    opacity: 0.9,
    fontWeight: '600',
  },
  slotsContainer: {
    paddingHorizontal: 16,
  },
  slotCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: theme.shadow,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: theme.borderLight,
  },
  slotHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  slotTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.textPrimary,
    letterSpacing: -0.3,
    flex: 1,
  },
  timeBadge: {
    backgroundColor: theme.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  timeText: {
    color: theme.textInverse,
    fontSize: 14,
    fontWeight: '700',
  },
  subgoalsContainer: {
    backgroundColor: theme.surfaceVariant,
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  subgoalsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.textPrimary,
    marginBottom: 12,
  },
  subgoalRow: {
    marginBottom: 12,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  subgoalContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  subgoalTextContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  subgoalPriority: {
    fontSize: 10,
    fontWeight: '600',
    color: theme.textSecondary,
    textTransform: 'uppercase',
    backgroundColor: theme.surface,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.borderLight,
  },
  // Disabled states for non-today dates
  subgoalContentDisabled: {
    opacity: 0.6,
  },
  checkboxDisabled: {
    opacity: 0.5,
  },
  subgoalTextDisabled: {
    opacity: 0.6,
  },
  subgoalPriorityDisabled: {
    opacity: 0.6,
  },
  checkboxContainer: {
    marginRight: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: theme.border,
    backgroundColor: theme.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxCompleted: {
    backgroundColor: theme.success,
    borderColor: theme.success,
  },
  checkmark: {
    color: theme.textInverse,
    fontSize: 12,
    fontWeight: 'bold',
  },
  subgoalText: {
    fontSize: 15,
    color: theme.textPrimary,
    fontWeight: '500',
    flex: 1,
  },
  completedText: {
    textDecorationLine: 'line-through',
    color: theme.textSecondary,
    opacity: 0.7,
  },
  plansContainer: {
    padding: 16,
  },
  planCard: {
    backgroundColor: theme.surface,
    borderRadius: 16,
    marginBottom: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.borderLight,
  },
  planHeader: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.borderLight,
  },
  planTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.textPrimary,
    marginBottom: 4,
  },
  planSubtitle: {
    fontSize: 14,
    color: theme.textSecondary,
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.textPrimary,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: theme.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});
