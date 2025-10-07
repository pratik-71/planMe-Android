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
// Flat UI - removed gradients for a cleaner look
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

  const toggleReminder = async (planId: number, slotId: string) => {
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
              s.id === slotId ? {...s, completed: !s.completed} : s,
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
      console.error('Error updating reminder:', error);
      Alert.alert('Error', 'Failed to update reminder');
    } finally {
      setIsUpdating(false);
    }
  };

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
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={styles.loadingText}>Loading today's plan...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
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
          {!isToday && <Text style={styles.readOnlyIndicator}>Read Only</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={styles.navButton} onPress={() => changeDay(1)}>
          <Text style={styles.navButtonText}>▶</Text>
        </TouchableOpacity>
      </View>

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

      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}>
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
                      <View key={item.id} style={styles.taskCard}>
                        {/* Main Task Row */}
                        <TouchableOpacity
                          style={[
                            styles.taskRow,
                            item.completed && styles.taskRowCompleted,
                            !isToday && styles.taskRowDisabled,
                          ]}
                          onPress={() => toggleReminder(plan.planId!, item.id)}
                          disabled={isUpdating || !isToday}>
                          {/* Large Checkbox */}
                          <View style={styles.checkboxWrapper}>
                            <View
                              style={[
                                styles.largeCheckbox,
                                item.completed && styles.checkboxCompleted,
                                !isToday && styles.checkboxDisabled,
                              ]}>
                              {item.completed && (
                                <Text style={styles.largeCheckmark}>✓</Text>
                              )}
                            </View>
                          </View>

                          {/* Task Content */}
                          <View style={styles.taskContent}>
                            <Text
                              style={[
                                styles.taskTitle,
                                item.completed && styles.completedText,
                                !isToday && styles.textDisabled,
                              ]}>
                              {item.title}
                            </Text>
                            <View style={styles.timeBadge}>
                              <Text style={styles.timeText}>
                                {new Date(item.startISO).toLocaleTimeString(
                                  [],
                                  {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  },
                                )}
                              </Text>
                            </View>
                          </View>
                        </TouchableOpacity>

                        {/* Subgoals */}
                        {item.subgoals.length > 0 && (
                          <View style={styles.subgoalsContainer}>
                            <Text style={styles.subgoalsTitle}>Subgoals</Text>
                            {item.subgoals.map(sg => (
                              <TouchableOpacity
                                key={sg.id}
                                style={[
                                  styles.subgoalRow,
                                  sg.completed && styles.subgoalRowCompleted,
                                  !isToday && styles.subgoalRowDisabled,
                                ]}
                                onPress={() =>
                                  toggleSubgoal(plan.planId!, item.id, sg.id)
                                }
                                disabled={isUpdating || !isToday}>
                                {/* Subgoal Checkbox */}
                                <View style={styles.subgoalCheckboxWrapper}>
                                  <View
                                    style={[
                                      styles.subgoalCheckbox,
                                      sg.completed && styles.checkboxCompleted,
                                      !isToday && styles.checkboxDisabled,
                                    ]}>
                                    {sg.completed && (
                                      <Text style={styles.subgoalCheckmark}>
                                        ✓
                                      </Text>
                                    )}
                                  </View>
                                </View>

                                {/* Subgoal Content */}
                                <View style={styles.subgoalContent}>
                                  <Text
                                    style={[
                                      styles.subgoalText,
                                      sg.completed && styles.completedText,
                                      !isToday && styles.textDisabled,
                                    ]}>
                                    {sg.text}
                                  </Text>
                                  <View style={styles.priorityBadge}>
                                    <Text style={styles.priorityText}>
                                      {sg.priority || 'Medium'}
                                    </Text>
                                  </View>
                                </View>
                              </TouchableOpacity>
                            ))}
                          </View>
                        )}
                      </View>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
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
    paddingVertical: 12,
    marginBottom: 12,
    backgroundColor: theme.primary,
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
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
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
    shadowColor: theme.shadow,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
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
  slotsContainer: {
    gap: 12,
  },
  taskCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 8,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 8,
  },
  taskRowCompleted: {
    backgroundColor: 'rgba(76, 175, 80, 0.05)',
  },
  taskRowDisabled: {
    opacity: 0.6,
  },
  checkboxWrapper: {
    marginRight: 16,
    padding: 2,
    borderRadius: 4,
  },
  largeCheckbox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: theme.primary,
    backgroundColor: theme.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxCompleted: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  checkboxDisabled: {
    opacity: 0.5,
  },
  largeCheckmark: {
    color: theme.textInverse,
    fontSize: 18,
    fontWeight: 'bold',
  },
  taskContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  taskTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.textPrimary,
    flex: 1,
    marginRight: 12,
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
    marginTop: 12,
    paddingTop: 12,
    paddingLeft: 56,
    borderTopWidth: 1,
    borderTopColor: theme.borderLight,
  },
  subgoalsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.textPrimary,
    marginBottom: 8,
  },
  subgoalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 8,
    marginBottom: 4,
  },
  subgoalRowCompleted: {
    backgroundColor: 'rgba(76, 175, 80, 0.05)',
  },
  subgoalRowDisabled: {
    opacity: 0.6,
  },
  subgoalCheckboxWrapper: {
    marginRight: 12,
    padding: 2,
    borderRadius: 4,
  },
  subgoalCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: theme.primary,
    backgroundColor: theme.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subgoalCheckmark: {
    color: theme.textInverse,
    fontSize: 12,
    fontWeight: 'bold',
  },
  subgoalContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  subgoalText: {
    fontSize: 15,
    color: theme.textPrimary,
    fontWeight: '500',
    flex: 1,
    marginRight: 8,
  },
  priorityBadge: {
    backgroundColor: theme.surfaceVariant,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.borderLight,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '600',
    color: theme.textSecondary,
    textTransform: 'uppercase',
  },
  completedText: {
    textDecorationLine: 'line-through',
    color: theme.textSecondary,
    opacity: 0.7,
  },
  textDisabled: {
    opacity: 0.6,
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

