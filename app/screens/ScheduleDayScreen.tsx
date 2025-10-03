import React, {useEffect, useMemo, useState, useCallback} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  FlatList,
  Alert,
  StyleSheet,
  ScrollView,
  Platform,
  Modal,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import LinearGradient from 'react-native-linear-gradient';
import {ScheduleDay, TimeSlot, Subgoal} from '../../domain/schedule.types';
import {
  loadAllPlansForDate,
  saveSchedule,
  upsertSlot,
} from '../../services/ScheduleService';
// Inline uniqueId function - no need for separate file
const uniqueId = (prefix = ''): string => {
  const rand = Math.floor(Math.random() * 1e9).toString(36);
  const time = Date.now().toString(36);
  return `${prefix}${time}${rand}`;
};
import {theme} from '../../stores/ThemeStore';

interface Props {
  dateISO: string;
  onDone: () => void;
}

function addDays(baseISO: string, delta: number): string {
  const d = new Date(baseISO);
  d.setDate(d.getDate() + delta);
  return d.toISOString().slice(0, 10);
}

export default function ScheduleDayScreen({dateISO, onDone}: Props) {
  // Working date (can be changed via UI)
  const [workingDateISO, setWorkingDateISO] = useState<string>(
    dateISO || new Date().toISOString().slice(0, 10),
  );

  const [schedule, setSchedule] = useState<ScheduleDay | null>(null);
  const [title, setTitle] = useState('');
  const [subgoalText, setSubgoalText] = useState('');
  const [subgoalPriority, setSubgoalPriority] = useState('medium');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedTime, _setSelectedTime] = useState(() => {
    const now = new Date();
    now.setSeconds(0, 0);
    return now;
  });
  const [isSaving, setIsSaving] = useState(false);
  const [showSlotModal, setShowSlotModal] = useState(false);
  const [editingSlot, setEditingSlot] = useState<TimeSlot | null>(null);
  const [expandedSlots, setExpandedSlots] = useState<Set<string>>(new Set());
  const [validationErrors, setValidationErrors] = useState<{
    title?: string;
    time?: string;
  }>({});
  const [mainTitleError, setMainTitleError] = useState('');
  const [subgoalError, setSubgoalError] = useState('');

  // Modal-specific state variables
  const [modalTitle, setModalTitle] = useState('');
  const [modalStart, setModalStart] = useState('');
  const [modalSelectedTime, setModalSelectedTime] = useState(() => {
    const now = new Date();
    now.setSeconds(0, 0);
    return now;
  });
  const [modalSubgoals, setModalSubgoals] = useState<Subgoal[]>([]);
  const [modalSlotPriority, setModalSlotPriority] = useState('medium');
  const [modalSlotCategory, setModalSlotCategory] = useState('general');

  // (Removed unused enhanced UI dropdown states)

  const dayName = useMemo(
    () =>
      new Date(workingDateISO).toLocaleDateString(undefined, {weekday: 'long'}),
    [workingDateISO],
  );

  const loadForDate = useCallback(async (dISO: string) => {
    const plans = await loadAllPlansForDate(dISO);
    const dn = new Date(dISO).toLocaleDateString(undefined, {weekday: 'long'});
    // For ScheduleDayScreen, we'll work with the first plan or create a new one
    const existing = plans.length > 0 ? plans[0] : null;
    setSchedule(existing ?? {dateISO: dISO, dayName: dn, slots: []});
  }, []);

  useEffect(() => {
    loadForDate(workingDateISO);
  }, [workingDateISO, loadForDate]);

  const changeDay = (delta: number) => {
    const next = addDays(workingDateISO, delta);
    setWorkingDateISO(next);
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setWorkingDateISO(selectedDate.toISOString().slice(0, 10));
    }
  };

  const onTimeChange = (event: any, selectedDate?: Date) => {
    setShowTimePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setModalSelectedTime(selectedDate);
      const hours = selectedDate.getHours().toString().padStart(2, '0');
      const minutes = selectedDate.getMinutes().toString().padStart(2, '0');
      setModalStart(`${hours}:${minutes}`);
    }
  };

  const addSubgoal = () => {
    if (!subgoalText.trim()) {
      setSubgoalError('Subgoal text is required');
      return;
    }
    if (subgoalText.trim().length < 2) {
      setSubgoalError('Subgoal must be at least 2 characters long');
      return;
    }
    setSubgoalError('');
    setModalSubgoals(prev => [
      ...prev,
      {
        id: uniqueId('sg_'),
        text: subgoalText.trim(),
        completed: false,
        priority: subgoalPriority,
      },
    ]);
    setSubgoalText('');
    setSubgoalPriority('medium'); // Reset to default
  };

  const deleteSubgoal = (subgoalId: string) => {
    setModalSubgoals(prev => prev.filter(sg => sg.id !== subgoalId));
  };

  const validateForm = () => {
    const errors: {title?: string; time?: string} = {};

    if (!modalTitle.trim()) {
      errors.title = 'Title is required';
    }

    if (!modalStart.trim() || !modalStart.includes(':')) {
      errors.time = 'Time is required';
    } else {
      const [hours, minutes] = modalStart.split(':').map(Number);
      if (
        isNaN(hours) ||
        isNaN(minutes) ||
        hours < 0 ||
        hours > 23 ||
        minutes < 0 ||
        minutes > 59
      ) {
        errors.time = 'Invalid time format';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const addSlot = async () => {
    if (!schedule) {
      return;
    }

    const [sh, sm] = modalStart.split(':').map(Number);
    const startISO = new Date(
      `${workingDateISO}T${String(sh).padStart(2, '0')}:${String(sm).padStart(
        2,
        '0',
      )}:00`,
    ).toISOString();

    const slot: TimeSlot = {
      id: editingSlot?.id || uniqueId('slot_'),
      title: modalTitle.trim(),
      startISO,
      completed: editingSlot?.completed || false,
      subgoals: modalSubgoals,
      priority: modalSlotPriority,
      category: modalSlotCategory,
    };
    const next = await upsertSlot(schedule, slot);
    setSchedule(next);
    setEditingSlot(null);
    setValidationErrors({});
  };

  const validateMainTitle = () => {
    // Title is now optional - no validation needed
    setMainTitleError('');
    return true;
  };

  const saveDay = async () => {
    if (!schedule) {
      return;
    }

    // Validate main title
    if (!validateMainTitle()) {
      return;
    }

    // Validate that we have at least one slot
    if (schedule.slots.length === 0) {
      Alert.alert(
        'No Time Slots',
        'Please add at least one time slot before saving.',
      );
      return;
    }

    setIsSaving(true);
    try {
      await saveSchedule(schedule);
      Alert.alert('Success', 'Day plan saved successfully!', [
        {text: 'OK', onPress: onDone},
      ]);
    } catch (error) {
      console.error('Error saving schedule:', error);
      Alert.alert('Error', 'Failed to save day plan. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const editSlot = (slot: TimeSlot) => {
    setEditingSlot(slot);
    setModalTitle(slot.title);
    setModalSubgoals([...slot.subgoals]);
    setModalSlotPriority(slot.priority || 'medium');
    setModalSlotCategory(slot.category || 'general');
    const slotTime = new Date(slot.startISO);
    setModalStart(
      `${slotTime.getHours().toString().padStart(2, '0')}:${slotTime
        .getMinutes()
        .toString()
        .padStart(2, '0')}`,
    );
    setModalSelectedTime(slotTime);
    setShowSlotModal(true);
  };

  const deleteSlot = async (slotId: string) => {
    if (!schedule) return;

    Alert.alert(
      'Delete Slot',
      'Are you sure you want to delete this time slot?',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const next = {
              ...schedule,
              slots: schedule.slots.filter(s => s.id !== slotId),
            };
            setSchedule(next);
            await saveSchedule(next);
          },
        },
      ],
    );
  };

  const toggleSlotExpansion = (slotId: string) => {
    const newExpanded = new Set(expandedSlots);
    if (newExpanded.has(slotId)) {
      newExpanded.delete(slotId);
    } else {
      newExpanded.add(slotId);
    }
    setExpandedSlots(newExpanded);
  };

  const openAddSlotModal = () => {
    setEditingSlot(null);
    setModalTitle('');
    setModalSubgoals([]);
    setSubgoalText('');
    setSubgoalPriority('medium');
    setModalSlotPriority('medium');
    setModalSlotCategory('general');
    setValidationErrors({});
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    setModalStart(`${hh}:${mm}`);
    setModalSelectedTime(now);
    setShowSlotModal(true);
  };

  const closeSlotModal = () => {
    setShowSlotModal(false);
    setEditingSlot(null);
    setModalTitle('');
    setModalSubgoals([]);
    setSubgoalText('');
    setSubgoalPriority('medium');
    setModalSlotPriority('medium');
    setModalSlotCategory('general');
    setValidationErrors({});
  };

  return (
    <LinearGradient
      colors={[theme.surface, theme.surfaceVariant]}
      style={styles.container}
      start={{x: 0, y: 0}}
      end={{x: 0, y: 0}}>
      {/* Beautiful Header with Gradient */}
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
          <Text style={styles.dateText}>{workingDateISO}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navButton} onPress={() => changeDay(1)}>
          <Text style={styles.navButtonText}>▶</Text>
        </TouchableOpacity>
      </LinearGradient>

      {showDatePicker && (
        <View style={styles.pickerContainer}>
          <DateTimePicker
            value={new Date(workingDateISO)}
            mode="date"
            display="default"
            onChange={onDateChange}
          />
        </View>
      )}

      {showTimePicker && (
        <View style={styles.pickerContainer}>
          <DateTimePicker
            value={showSlotModal ? modalSelectedTime : selectedTime}
            mode="time"
            display="default"
            onChange={onTimeChange}
          />
        </View>
      )}

      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}>
        {/* Beautiful Slot Editor Card */}
        <LinearGradient
          colors={[theme.background, theme.surfaceVariant]}
          style={styles.card}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 1}}>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Title (Optional)</Text>
            <TextInput
              style={[styles.input, mainTitleError ? styles.inputError : null]}
              placeholder="Name Your Day (Optional)"
              placeholderTextColor={theme.textTertiary}
              value={title}
              onChangeText={text => {
                setTitle(text);
                if (mainTitleError && text.trim().length > 0) {
                  setMainTitleError('');
                }
              }}
            />
            {mainTitleError && (
              <Text style={styles.errorText}>{mainTitleError}</Text>
            )}
          </View>

          <TouchableOpacity
            style={styles.addSlotButton}
            onPress={openAddSlotModal}>
            <LinearGradient
              colors={[theme.primary, theme.primaryDark]}
              style={styles.addSlotButtonGradient}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 0}}>
              <Text style={styles.addSlotButtonText}>✨ Add Time Slot</Text>
            </LinearGradient>
          </TouchableOpacity>
        </LinearGradient>

        {/* Beautiful Slots Section */}
        <View style={styles.slotsSection}>
          <Text style={styles.sectionTitle}>Planned Slots</Text>
          <FlatList
            data={schedule?.slots ?? []}
            keyExtractor={s => s.id}
            renderItem={({item}) => (
              <LinearGradient
                colors={[theme.background, theme.surfaceVariant]}
                style={styles.slotItem}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 1}}>
                <View style={styles.slotHeader}>
                  <Text style={styles.slotTitle}>{item.title}</Text>
                  <View style={styles.slotActions}>
                    <View style={styles.timeBadge}>
                      <Text style={styles.slotTime}>
                        {new Date(item.startISO).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => editSlot(item)}>
                      <Text style={styles.actionButtonText}>✏️</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => deleteSlot(item.id)}>
                      <Text style={styles.actionButtonText}>🗑️</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.slotFooter}
                  onPress={() => toggleSlotExpansion(item.id)}>
                  <Text style={styles.slotSubgoals}>
                    🎯 {item.subgoals.length} subgoals{' '}
                    {expandedSlots.has(item.id) ? '▼' : '▶'}
                  </Text>
                </TouchableOpacity>
                {expandedSlots.has(item.id) && item.subgoals.length > 0 && (
                  <View style={styles.subgoalsList}>
                    {item.subgoals.map(sg => (
                      <Text key={sg.id} style={styles.subgoalItemText}>
                        • {sg.text}
                      </Text>
                    ))}
                  </View>
                )}
              </LinearGradient>
            )}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No slots</Text>
              </View>
            }
            scrollEnabled={false}
          />
        </View>

        <TouchableOpacity
          style={styles.saveButton}
          onPress={saveDay}
          disabled={isSaving}>
          <LinearGradient
            colors={[theme.primary, theme.primaryDark]}
            style={styles.saveButtonGradient}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 0}}>
            <Text style={styles.saveButtonText}>
              {isSaving ? 'Saving...' : 'Save'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Add Slot Modal */}
        <Modal transparent visible={showSlotModal} animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>
                {editingSlot ? 'Edit Time Slot' : 'Add Time Slot'}
              </Text>

              <Text style={styles.inputLabel}>Title</Text>
              <TextInput
                style={[
                  styles.input,
                  validationErrors.title ? styles.inputError : null,
                ]}
                placeholder="e.g., Morning Workout, Project Meeting"
                placeholderTextColor={theme.textTertiary}
                value={modalTitle}
                onChangeText={text => {
                  setModalTitle(text);
                  // Clear title error when user starts typing
                  if (validationErrors.title && text.trim().length > 0) {
                    setValidationErrors(prev => ({...prev, title: undefined}));
                  }
                }}
              />
              {validationErrors.title && (
                <Text style={styles.errorText}>{validationErrors.title}</Text>
              )}

              <Text style={[styles.inputLabel, styles.modalInputLabel]}>
                Time
              </Text>
              <TouchableOpacity
                style={[
                  styles.timePickerButton,
                  validationErrors.time ? styles.inputError : null,
                ]}
                onPress={() => setShowTimePicker(true)}>
                <Text style={styles.timePickerText}>{modalStart}</Text>
                <Text style={styles.timePickerIcon}>🕐</Text>
              </TouchableOpacity>
              {validationErrors.time && (
                <Text style={styles.errorText}>{validationErrors.time}</Text>
              )}

              {/* Slot Priority */}
              <Text style={[styles.inputLabel, styles.modalInputLabel]}>
                Slot Priority
              </Text>
              <View style={styles.priorityContainer}>
                <TouchableOpacity
                  style={[
                    styles.priorityOption,
                    modalSlotPriority === 'low' &&
                      styles.priorityOptionSelected,
                  ]}
                  onPress={() => setModalSlotPriority('low')}>
                  <Text
                    style={[
                      styles.priorityOptionText,
                      modalSlotPriority === 'low' &&
                        styles.priorityOptionTextSelected,
                    ]}>
                    Low
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.priorityOption,
                    modalSlotPriority === 'medium' &&
                      styles.priorityOptionSelected,
                  ]}
                  onPress={() => setModalSlotPriority('medium')}>
                  <Text
                    style={[
                      styles.priorityOptionText,
                      modalSlotPriority === 'medium' &&
                        styles.priorityOptionTextSelected,
                    ]}>
                    Medium
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.priorityOption,
                    modalSlotPriority === 'high' &&
                      styles.priorityOptionSelected,
                  ]}
                  onPress={() => setModalSlotPriority('high')}>
                  <Text
                    style={[
                      styles.priorityOptionText,
                      modalSlotPriority === 'high' &&
                        styles.priorityOptionTextSelected,
                    ]}>
                    High
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={[styles.inputLabel, styles.modalInputLabel]}>
                Subgoals
              </Text>

              <View style={styles.subgoalRow}>
                <TextInput
                  style={[
                    styles.input,
                    styles.subgoalInput,
                    subgoalError ? styles.inputError : null,
                  ]}
                  placeholder="Add a subgoal..."
                  placeholderTextColor={theme.textTertiary}
                  value={subgoalText}
                  onChangeText={text => {
                    setSubgoalText(text);
                    if (subgoalError && text.trim().length >= 2) {
                      setSubgoalError('');
                    }
                  }}
                />
                <TouchableOpacity style={styles.addButton} onPress={addSubgoal}>
                  <Text style={styles.addButtonText}>+ Add</Text>
                </TouchableOpacity>
              </View>
              {subgoalError && (
                <Text style={styles.errorText}>{subgoalError}</Text>
              )}

              {/* Priority Dropdown for Subgoals */}
              <View style={styles.priorityContainer}>
                <Text style={styles.priorityLabel}>Priority:</Text>
                <View style={styles.priorityDropdown}>
                  <TouchableOpacity
                    style={[
                      styles.priorityOption,
                      subgoalPriority === 'low' &&
                        styles.priorityOptionSelected,
                    ]}
                    onPress={() => setSubgoalPriority('low')}>
                    <Text
                      style={[
                        styles.priorityOptionText,
                        subgoalPriority === 'low' &&
                          styles.priorityOptionTextSelected,
                      ]}>
                      Low
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.priorityOption,
                      subgoalPriority === 'medium' &&
                        styles.priorityOptionSelected,
                    ]}
                    onPress={() => setSubgoalPriority('medium')}>
                    <Text
                      style={[
                        styles.priorityOptionText,
                        subgoalPriority === 'medium' &&
                          styles.priorityOptionTextSelected,
                      ]}>
                      Medium
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.priorityOption,
                      subgoalPriority === 'high' &&
                        styles.priorityOptionSelected,
                    ]}
                    onPress={() => setSubgoalPriority('high')}>
                    <Text
                      style={[
                        styles.priorityOptionText,
                        subgoalPriority === 'high' &&
                          styles.priorityOptionTextSelected,
                      ]}>
                      High
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.subgoalsGap} />

              <FlatList
                data={modalSubgoals}
                keyExtractor={g => g.id}
                renderItem={({item}) => (
                  <View style={styles.subgoalItem}>
                    <View style={styles.subgoalContent}>
                      <Text style={styles.subgoalText}>• {item.text}</Text>
                      <View style={styles.subgoalPriorityBadge}>
                        <Text style={styles.subgoalPriorityText}>
                          {item.priority || 'Medium'}
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={styles.deleteSubgoalButton}
                      onPress={() => deleteSubgoal(item.id)}>
                      <Text style={styles.deleteSubgoalText}>🗑️</Text>
                    </TouchableOpacity>
                  </View>
                )}
                ListEmptyComponent={
                  <Text style={styles.emptyText}>No subgoals</Text>
                }
                scrollEnabled={false}
              />

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalCancel]}
                  onPress={closeSlotModal}>
                  <Text style={styles.modalButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalPrimary]}
                  onPress={async () => {
                    const isValid = validateForm();
                    if (isValid) {
                      await addSlot();
                      closeSlotModal();
                    }
                    // Don't close modal if validation fails - let user see the errors
                  }}>
                  <Text
                    style={[
                      styles.modalButtonText,
                      {color: theme.textInverse},
                    ]}>
                    {editingSlot ? 'Update' : 'Add'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8, // Reduced from 12 to 8 (30% reduction)
    marginBottom: 6, // Reduced from 8 to 6
    shadowColor: theme.shadow,
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 4,
  },
  navButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    paddingHorizontal: 10, // Reduced from 12 to 10
    paddingVertical: 8, // Reduced from 10 to 8
    borderRadius: 16, // Reduced from 18 to 16
    marginHorizontal: 4, // Reduced from 6 to 4
    shadowColor: theme.shadow,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
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
    paddingVertical: 8, // Reduced from 10 to 8
    paddingHorizontal: 12, // Reduced from 14 to 12
    borderRadius: 14, // Reduced from 16 to 14
    marginHorizontal: 4, // Reduced from 6 to 4
  },
  dayName: {
    fontSize: 14, // Reduced from 16 to 14
    fontWeight: '800',
    color: theme.textInverse,
    letterSpacing: -0.2,
  },
  dateText: {
    color: theme.textInverse,
    fontSize: 11, // Reduced from 13 to 11
    fontWeight: '600',
    marginTop: 1, // Reduced from 2 to 1
    opacity: 0.9,
  },
  tapHint: {
    color: theme.textInverse,
    fontSize: 12,
    marginTop: 2,
    opacity: 0.8,
  },
  card: {
    padding: 14,
    marginBottom: 12,
    elevation: 3,
  },
  cardHeader: {
    marginBottom: 20,
  },
  cardTitle: {
    fontWeight: '800',
    color: theme.textPrimary,
    fontSize: 16,
    letterSpacing: -0.2,
  },
  cardSubtitle: {
    color: theme.textSecondary,
    fontSize: 14,
    marginTop: 4,
    fontWeight: '500',
  },
  inputContainer: {
    marginBottom: 8, // Reduced from 16 to 8
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.textPrimary,
    marginBottom: 6,
  },
  modalInputLabel: {
    marginTop: 12,
  },
  input: {
    backgroundColor: theme.background,
    borderColor: theme.border,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: theme.textPrimary,
    fontWeight: '500',
    shadowColor: theme.shadow,
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
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
  timeInput: {
    backgroundColor: theme.background,
    borderColor: theme.border,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: theme.textPrimary,
    fontWeight: '500',
    textAlign: 'center',
    shadowColor: theme.shadow,
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  timePickerButton: {
    backgroundColor: theme.background,
    borderColor: theme.border,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: theme.shadow,
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  timePickerText: {
    fontSize: 16,
    color: theme.textPrimary,
    fontWeight: '600',
  },
  timePickerIcon: {
    fontSize: 18,
  },
  pickerContainer: {
    position: 'absolute',
    top: 100,
    left: 20,
    right: 20,
    backgroundColor: theme.background,
    borderRadius: 12,
    padding: 16,
    shadowColor: theme.shadow,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000,
  },
  timeRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
    alignItems: 'flex-end',
  },
  timeInputContainer: {
    flex: 1,
  },
  subgoalSection: {
    marginBottom: 16,
  },
  subgoalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  subgoalInput: {
    flex: 1,
  },
  addButton: {
    backgroundColor: theme.primary,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    shadowColor: theme.shadow,
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 3,
  },
  addButtonText: {
    color: theme.textInverse,
    fontWeight: '800',
    fontSize: 14,
  },
  subgoalItem: {
    backgroundColor: theme.background,
    borderColor: theme.border,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 6,
    shadowColor: theme.shadow,
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  subgoalsGap: {
    height: 12,
  },
  deleteSubgoalButton: {
    padding: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
  },
  deleteSubgoalText: {
    fontSize: 12,
  },
  subgoalText: {
    color: theme.textPrimary,
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
    marginRight: 8,
  },
  emptyText: {
    color: theme.textTertiary,
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 12,
    fontSize: 13,
  },
  addSlotButton: {
    marginTop: 8, // Reduced from 12 to 8
    borderRadius: 14,
    shadowColor: theme.shadow,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 4,
  },
  addSlotButtonGradient: {
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 14,
  },
  addSlotButtonText: {
    color: theme.textInverse,
    fontWeight: '800',
    fontSize: 14,
    letterSpacing: 0.3,
  },
  slotsSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontWeight: '800',
    color: theme.textPrimary,
    marginBottom: 10,
    fontSize: 16,
    letterSpacing: -0.2,
  },
  slotItem: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    shadowColor: theme.shadow,
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
    borderColor: theme.border,
  },
  slotHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  slotActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 188, 212, 0.1)',
  },
  actionButtonText: {
    fontSize: 14,
  },
  slotTitle: {
    fontWeight: '800',
    color: theme.textPrimary,
    fontSize: 14,
    letterSpacing: -0.2,
    flex: 1,
  },
  timeBadge: {
    backgroundColor: theme.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  slotTime: {
    color: theme.textInverse,
    fontWeight: '700',
    fontSize: 12,
  },
  slotFooter: {
    marginTop: 6,
  },
  subgoalsList: {
    marginTop: 8,
    paddingLeft: 8,
    backgroundColor: 'rgba(0, 188, 212, 0.05)',
    borderRadius: 8,
    paddingVertical: 8,
  },
  subgoalItemText: {
    color: theme.textSecondary,
    fontSize: 12,
    marginBottom: 4,
    paddingLeft: 4,
  },
  slotSubgoals: {
    color: theme.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  saveButton: {
    marginTop: 20,
    marginBottom: 24,
    borderRadius: 14,
    shadowColor: theme.shadow,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonGradient: {
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 14,
  },
  saveButtonText: {
    color: theme.textInverse,
    fontWeight: '800',
    fontSize: 14,
    letterSpacing: 0.3,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  dateButton: {
    backgroundColor: theme.background,
    borderColor: theme.border,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  dateButtonText: {
    color: theme.textPrimary,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: theme.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.borderLight,
    shadowColor: theme.shadow,
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.textPrimary,
    marginBottom: 8,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 12,
  },
  modalButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  modalCancel: {
    backgroundColor: theme.background,
    borderColor: theme.border,
  },
  modalPrimary: {
    backgroundColor: theme.primary,
    borderColor: theme.primary,
  },
  modalButtonText: {
    color: theme.textPrimary,
    fontWeight: '700',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptySubtext: {
    color: theme.textTertiary,
    fontSize: 14,
    marginTop: 4,
    textAlign: 'center',
  },
  // Priority dropdown styles
  priorityContainer: {
    marginTop: 12,
    marginBottom: 8,
  },
  priorityLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.textPrimary,
    marginBottom: 8,
  },
  priorityDropdown: {
    flexDirection: 'row',
    backgroundColor: theme.surface,
    borderRadius: 8,
    padding: 4,
    borderWidth: 1,
    borderColor: theme.borderLight,
  },
  priorityOption: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  priorityOptionSelected: {
    backgroundColor: theme.primary,
  },
  priorityOptionText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.textSecondary,
  },
  priorityOptionTextSelected: {
    color: theme.textInverse,
  },
  // Subgoal priority display styles
  subgoalContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  subgoalPriorityBadge: {
    backgroundColor: theme.surface,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.borderLight,
  },
  subgoalPriorityText: {
    fontSize: 10,
    fontWeight: '600',
    color: theme.textSecondary,
    textTransform: 'uppercase',
  },
});
