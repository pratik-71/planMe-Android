import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  Switch,
  FlatList,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import notifee from '@notifee/react-native';
import {theme} from '../../stores/ThemeStore';
import {
  initialize,
  scheduleWaterNotification,
  cancelAllWaterNotifications,
} from '../../services/WaterNotificationService';

interface Props {
  onBack: () => void;
}

interface ScheduledBreak {
  id: string;
  title: string;
  scheduledTime: Date;
  amount: number;
}

export default function WaterBreaksScreen({onBack}: Props) {
  // Tab state
  const [activeTab, setActiveTab] = useState<'schedule' | 'view'>('schedule');

  // Schedule Breaks tab state
  const [breakfast, setBreakfast] = useState('08:00');
  const [lunch, setLunch] = useState('12:00');
  const [dinner, setDinner] = useState('19:00');
  const [waterGoalLiters, setWaterGoalLiters] = useState('4');
  const [wakeTime, setWakeTime] = useState('07:00');
  const [sleepTime, setSleepTime] = useState('23:00');
  const [extraFrom, setExtraFrom] = useState('14:00');
  const [extraTo, setExtraTo] = useState('15:00');
  const [perReminderMl, setPerReminderMl] = useState<250 | 500>(250);
  const [useExtraBreak, setUseExtraBreak] = useState(false);

  // View Breaks tab state
  const [scheduledBreaks, setScheduledBreaks] = useState<ScheduledBreak[]>([]);
  const [isLoadingBreaks, setIsLoadingBreaks] = useState(false);

  const [showPicker, setShowPicker] = useState<string | null>(null);
  const [tempDate, setTempDate] = useState(new Date());

  // Load scheduled breaks for View Breaks tab
  const loadScheduledBreaks = async () => {
    setIsLoadingBreaks(true);
    try {
      const notifications = await notifee.getTriggerNotifications();
      const waterBreaks: ScheduledBreak[] = [];

      for (const notif of notifications) {
        if (notif.notification.id?.startsWith('water_')) {
          const trigger = notif.trigger;
          if (trigger && 'timestamp' in trigger) {
            const scheduledTime = new Date(trigger.timestamp);
            const title = notif.notification.body || 'Drink water';
            const amountMatch = title.match(/(\d+)ml/);
            const amount = amountMatch ? parseInt(amountMatch[1], 10) : 250;

            waterBreaks.push({
              id: notif.notification.id,
              title: title,
              scheduledTime: scheduledTime,
              amount: amount,
            });
          }
        }
      }

      // Sort by scheduled time
      waterBreaks.sort(
        (a, b) => a.scheduledTime.getTime() - b.scheduledTime.getTime(),
      );
      setScheduledBreaks(waterBreaks);
    } catch (error) {
      console.error('Error loading scheduled breaks:', error);
    } finally {
      setIsLoadingBreaks(false);
    }
  };

  // Load breaks when switching to View tab
  useEffect(() => {
    if (activeTab === 'view') {
      loadScheduledBreaks();
    }
  }, [activeTab]);

  const parseTimeToDate = (timeStr: string): Date => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  };

  const formatTime = (date: Date): string => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const openPicker = (field: string, currentTime: string) => {
    setTempDate(parseTimeToDate(currentTime));
    setShowPicker(field);
  };

  const handleTimeChange = (event: any, selectedDate?: Date) => {
    if (event.type === 'dismissed') {
      setShowPicker(null);
      return;
    }
    if (selectedDate) {
      const timeStr = formatTime(selectedDate);
      if (showPicker === 'breakfast') setBreakfast(timeStr);
      else if (showPicker === 'lunch') setLunch(timeStr);
      else if (showPicker === 'dinner') setDinner(timeStr);
      else if (showPicker === 'wake') setWakeTime(timeStr);
      else if (showPicker === 'sleep') setSleepTime(timeStr);
      else if (showPicker === 'extraFrom') setExtraFrom(timeStr);
      else if (showPicker === 'extraTo') setExtraTo(timeStr);
      setShowPicker(null);
    }
  };

  // kept for reference if we later return to per-slot filtering

  const cancelBreak = async (breakId: string) => {
    try {
      await notifee.cancelNotification(breakId);
      await loadScheduledBreaks(); // Refresh the list
      Alert.alert('Success', 'Water break cancelled successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to cancel water break.');
    }
  };

  const handleSave = async () => {
    try {
      const goal = parseFloat(waterGoalLiters);
      if (isNaN(goal) || goal <= 0) {
        Alert.alert('Invalid Input', 'Please enter a valid water goal.');
        return;
      }

      await initialize();
      await cancelAllWaterNotifications();

      let wakeDate = parseTimeToDate(wakeTime);
      let sleepDate = parseTimeToDate(sleepTime);
      const breakfastDate = parseTimeToDate(breakfast);
      const lunchDate = parseTimeToDate(lunch);
      const dinnerDate = parseTimeToDate(dinner);
      const extraFromDate = parseTimeToDate(extraFrom);
      const extraToDate = parseTimeToDate(extraTo);

      const totalMl = goal * 1000;
      const requiredNotifications = Math.ceil(totalMl / perReminderMl);

      // Normalize overnight window: if sleep is before/equal wake, push sleep to next day
      if (sleepDate.getTime() <= wakeDate.getTime()) {
        sleepDate = new Date(sleepDate.getTime() + 24 * 60 * 60 * 1000);
      }

      // Start after now + 2 minutes to avoid clamping to immediate time
      const nowPlusBuffer = new Date(Date.now() + 2 * 60 * 1000);
      const startBaseline = new Date(
        Math.max(wakeDate.getTime(), nowPlusBuffer.getTime()),
      );

      // Build blocked windows around meals and optional extra window
      type Segment = {start: Date; end: Date};
      const clampToRange = (
        s: Date,
        e: Date,
        min: Date,
        max: Date,
      ): Segment | null => {
        const start = new Date(Math.max(s.getTime(), min.getTime()));
        const end = new Date(Math.min(e.getTime(), max.getTime()));
        if (end.getTime() <= start.getTime()) return null;
        return {start, end};
      };

      const mainRange: Segment = {start: startBaseline, end: sleepDate};
      const blocksRaw: Segment[] = [
        {
          start: new Date(breakfastDate.getTime() - 30 * 60 * 1000),
          end: new Date(breakfastDate.getTime() + 60 * 60 * 1000),
        },
        {
          start: new Date(lunchDate.getTime() - 30 * 60 * 1000),
          end: new Date(lunchDate.getTime() + 60 * 60 * 1000),
        },
        {
          start: new Date(dinnerDate.getTime() - 30 * 60 * 1000),
          end: new Date(dinnerDate.getTime() + 60 * 60 * 1000),
        },
      ];
      if (useExtraBreak) {
        blocksRaw.push({start: extraFromDate, end: extraToDate});
      }

      const blocks: Segment[] = [];
      for (const b of blocksRaw) {
        const clipped = clampToRange(
          b.start,
          b.end,
          mainRange.start,
          mainRange.end,
        );
        if (clipped) blocks.push(clipped);
      }

      // Subtract blocked segments from the mainRange to get allowed segments
      const subtractSegments = (
        segments: Segment[],
        block: Segment,
      ): Segment[] => {
        const result: Segment[] = [];
        for (const seg of segments) {
          // no overlap
          if (
            block.end.getTime() <= seg.start.getTime() ||
            block.start.getTime() >= seg.end.getTime()
          ) {
            result.push(seg);
            continue;
          }
          // overlap on left
          if (block.start.getTime() > seg.start.getTime()) {
            result.push({
              start: seg.start,
              end: new Date(block.start.getTime()),
            });
          }
          // overlap on right
          if (block.end.getTime() < seg.end.getTime()) {
            result.push({start: new Date(block.end.getTime()), end: seg.end});
          }
        }
        return result;
      };

      let allowed: Segment[] = [mainRange];
      for (const blk of blocks) {
        allowed = subtractSegments(allowed, blk);
        if (allowed.length === 0) break;
      }

      // Merge adjacent/overlapping allowed segments defensively
      allowed.sort((a, b) => a.start.getTime() - b.start.getTime());
      const merged: Segment[] = [];
      for (const seg of allowed) {
        if (merged.length === 0) {
          merged.push(seg);
        } else {
          const last = merged[merged.length - 1];
          if (seg.start.getTime() <= last.end.getTime()) {
            last.end = new Date(
              Math.max(last.end.getTime(), seg.end.getTime()),
            );
          } else {
            merged.push(seg);
          }
        }
      }

      const totalAllowedMs = merged.reduce(
        (acc, s) => acc + Math.max(0, s.end.getTime() - s.start.getTime()),
        0,
      );
      if (totalAllowedMs <= 0) {
        Alert.alert(
          'No Time Window',
          'No available time remains between wake and sleep after excluding meal/extra windows.',
        );
        return;
      }

      // Distribute required notifications evenly across allowed intervals
      const step = totalAllowedMs / requiredNotifications;
      const pickTimeAtOffset = (offsetMs: number): Date => {
        let remaining = offsetMs;
        for (const seg of merged) {
          const segLen = seg.end.getTime() - seg.start.getTime();
          if (remaining <= segLen) {
            return new Date(seg.start.getTime() + remaining);
          }
          remaining -= segLen;
        }
        // fallback to end of last segment
        const last = merged[merged.length - 1];
        return new Date(last.end.getTime() - 1000);
      };

      const slotsToSchedule: Date[] = [];
      for (let i = 0; i < requiredNotifications; i++) {
        const offset = step * i + step / 2; // center points
        const t = pickTimeAtOffset(offset);
        slotsToSchedule.push(t);
      }

      for (let i = 0; i < slotsToSchedule.length; i++) {
        await scheduleWaterNotification({
          id: `water_${Date.now()}_${i}`,
          title: `Drink ${perReminderMl}ml of water`,
          dateTime: slotsToSchedule[i],
        });
      }

      Alert.alert(
        'Success',
        `Scheduled ${slotsToSchedule.length} water reminders!`,
      );

      // Switch to view tab to show the scheduled breaks
      setActiveTab('view');
      await loadScheduledBreaks();
    } catch (error) {
      Alert.alert('Error', 'Failed to schedule water reminders.');
    }
  };

  const renderScheduledBreak = ({item}: {item: ScheduledBreak}) => (
    <View style={styles.breakItem}>
      <View style={styles.breakInfo}>
        <Text style={styles.breakTitle}>{item.title}</Text>
        <Text style={styles.breakTime}>{formatTime(item.scheduledTime)}</Text>
      </View>
      <TouchableOpacity
        style={styles.cancelButton}
        onPress={() => cancelBreak(item.id)}>
        <Text style={styles.cancelButtonText}>Cancel</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <LinearGradient
      colors={[theme.background, theme.surface, theme.surfaceVariant]}
      style={styles.container}
      start={{x: 0, y: 0}}
      end={{x: 1, y: 1}}>
      {/* Tab Navigation */}
      <View style={styles.tabNavigation}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'schedule' && styles.tabButtonActive,
          ]}
          onPress={() => setActiveTab('schedule')}>
          <Text
            style={[
              styles.tabButtonText,
              activeTab === 'schedule' && styles.tabButtonTextActive,
            ]}>
            Schedule Breaks
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'view' && styles.tabButtonActive,
          ]}
          onPress={() => setActiveTab('view')}>
          <Text
            style={[
              styles.tabButtonText,
              activeTab === 'view' && styles.tabButtonTextActive,
            ]}>
            View Breaks
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      {activeTab === 'schedule' ? (
        <ScrollView style={styles.scrollView}>
          <View style={styles.content}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Meal Times</Text>
              <TouchableOpacity
                style={styles.inputButton}
                onPress={() => openPicker('breakfast', breakfast)}>
                <Text style={styles.inputLabel}>Breakfast Time</Text>
                <Text style={styles.inputValue}>{breakfast}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.inputButton}
                onPress={() => openPicker('lunch', lunch)}>
                <Text style={styles.inputLabel}>Lunch Time</Text>
                <Text style={styles.inputValue}>{lunch}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.inputButton}
                onPress={() => openPicker('dinner', dinner)}>
                <Text style={styles.inputLabel}>Dinner Time</Text>
                <Text style={styles.inputValue}>{dinner}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Water Goal & Times</Text>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Daily Water Goal (Liters)</Text>
                <TextInput
                  style={styles.textInput}
                  value={waterGoalLiters}
                  onChangeText={setWaterGoalLiters}
                  keyboardType="decimal-pad"
                  placeholder="4"
                />
              </View>
              <View style={styles.rowContainer}>
                <TouchableOpacity
                  style={styles.inputButtonHalf}
                  onPress={() => openPicker('wake', wakeTime)}>
                  <Text style={styles.inputLabel}>Wake Up Time</Text>
                  <Text style={styles.inputValue}>{wakeTime}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.inputButtonHalf}
                  onPress={() => openPicker('sleep', sleepTime)}>
                  <Text style={styles.inputLabel}>Sleep Time</Text>
                  <Text style={styles.inputValue}>{sleepTime}</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.section}>
              <View style={styles.checkboxRow}>
                <Text style={styles.sectionTitle}>Extra Break Window</Text>
                <Switch
                  value={useExtraBreak}
                  onValueChange={setUseExtraBreak}
                  trackColor={{false: theme.borderLight, true: theme.primary}}
                  thumbColor={
                    useExtraBreak ? theme.surface : theme.textSecondary
                  }
                />
              </View>
              {useExtraBreak && (
                <View style={styles.rowContainer}>
                  <TouchableOpacity
                    style={styles.inputButtonHalf}
                    onPress={() => openPicker('extraFrom', extraFrom)}>
                    <Text style={styles.inputLabel}>From</Text>
                    <Text style={styles.inputValue}>{extraFrom}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.inputButtonHalf}
                    onPress={() => openPicker('extraTo', extraTo)}>
                    <Text style={styles.inputLabel}>To</Text>
                    <Text style={styles.inputValue}>{extraTo}</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Reminder Amount</Text>
              <View style={styles.tabContainer}>
                <TouchableOpacity
                  style={[
                    styles.tab,
                    perReminderMl === 250 && styles.tabActive,
                  ]}
                  onPress={() => setPerReminderMl(250)}>
                  <Text
                    style={[
                      styles.tabText,
                      perReminderMl === 250 && styles.tabTextActive,
                    ]}>
                    250ml
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.tab,
                    perReminderMl === 500 && styles.tabActive,
                  ]}
                  onPress={() => setPerReminderMl(500)}>
                  <Text
                    style={[
                      styles.tabText,
                      perReminderMl === 500 && styles.tabTextActive,
                    ]}>
                    500ml
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <LinearGradient
                colors={['#4FC3F7', '#0288D1']}
                style={styles.saveButtonGradient}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 0}}>
                <Text style={styles.saveButtonText}>Save Schedule</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={styles.backButton} onPress={onBack}>
              <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      ) : (
        <View style={styles.viewTabContent}>
          <View style={styles.viewHeader}>
            <Text style={styles.viewTitle}>Scheduled Water Breaks</Text>
            <TouchableOpacity
              style={styles.refreshButton}
              onPress={loadScheduledBreaks}>
              <Text style={styles.refreshButtonText}>Refresh</Text>
            </TouchableOpacity>
          </View>

          {isLoadingBreaks ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading breaks...</Text>
            </View>
          ) : scheduledBreaks.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No water breaks scheduled</Text>
              <Text style={styles.emptySubtext}>
                Go to "Schedule Breaks" tab to create reminders
              </Text>
            </View>
          ) : (
            <FlatList
              data={scheduledBreaks}
              renderItem={renderScheduledBreak}
              keyExtractor={item => item.id}
              style={styles.breaksList}
              showsVerticalScrollIndicator={false}
            />
          )}

          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
        </View>
      )}

      {showPicker && (
        <DateTimePicker
          value={tempDate}
          mode="time"
          is24Hour={true}
          display="default"
          onChange={handleTimeChange}
        />
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // Tab Navigation Styles
  tabNavigation: {
    flexDirection: 'row',
    backgroundColor: theme.surface,
    margin: 16,
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: theme.borderLight,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  tabButtonActive: {
    backgroundColor: theme.primary,
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.textSecondary,
  },
  tabButtonTextActive: {
    color: theme.textInverse,
  },
  // Schedule Breaks Tab Styles
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.textPrimary,
    marginBottom: 12,
  },
  checkboxRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  inputButton: {
    backgroundColor: theme.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.borderLight,
  },
  inputContainer: {
    backgroundColor: theme.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: theme.borderLight,
  },
  inputLabel: {
    fontSize: 14,
    color: theme.textSecondary,
    fontWeight: '600',
  },
  inputValue: {
    fontSize: 16,
    color: theme.primary,
    fontWeight: '700',
  },
  rowContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  inputButtonHalf: {
    flex: 1,
    backgroundColor: theme.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'column',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: theme.borderLight,
  },
  textInput: {
    fontSize: 16,
    color: theme.textPrimary,
    marginTop: 8,
    padding: 8,
    borderBottomWidth: 2,
    borderBottomColor: theme.primary,
  },
  tabContainer: {
    flexDirection: 'row',
    borderRadius: 12,
    backgroundColor: theme.surface,
    padding: 4,
  },
  tab: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: theme.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.textSecondary,
  },
  tabTextActive: {
    color: theme.textInverse,
  },
  saveButton: {
    borderRadius: 16,
    marginTop: 24,
    shadowColor: '#0288D1',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  saveButtonGradient: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  backButton: {
    marginTop: 16,
    padding: 12,
    alignItems: 'center',
  },
  backButtonText: {
    color: theme.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  // View Breaks Tab Styles
  viewTabContent: {
    flex: 1,
    padding: 16,
  },
  viewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  viewTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.textPrimary,
  },
  refreshButton: {
    backgroundColor: theme.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  refreshButtonText: {
    color: theme.textInverse,
    fontSize: 12,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: theme.textSecondary,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 18,
    color: theme.textPrimary,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: theme.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  breaksList: {
    flex: 1,
  },
  breakItem: {
    backgroundColor: theme.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.borderLight,
  },
  breakInfo: {
    flex: 1,
  },
  breakTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.textPrimary,
    marginBottom: 4,
  },
  breakTime: {
    fontSize: 14,
    color: theme.primary,
    fontWeight: '700',
  },
  cancelButton: {
    backgroundColor: theme.error + '15',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: theme.error + '30',
  },
  cancelButtonText: {
    color: theme.error,
    fontSize: 12,
    fontWeight: '600',
  },
});
