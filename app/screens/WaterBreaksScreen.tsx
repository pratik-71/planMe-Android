import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  Switch,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import {theme} from '../../stores/ThemeStore';
import {
  initialize,
  scheduleWaterNotification,
  cancelAllWaterNotifications,
} from '../../services/WaterNotificationService';

interface Props {
  onBack: () => void;
}

export default function WaterBreaksScreen({onBack}: Props) {
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

  const [showPicker, setShowPicker] = useState<string | null>(null);
  const [tempDate, setTempDate] = useState(new Date());

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

  const isWithinWindow = (
    time: Date,
    start: Date,
    end: Date,
    beforeMin: number,
    afterMin: number,
  ): boolean => {
    const startWindow = new Date(start.getTime() - beforeMin * 60 * 1000);
    const endWindow = new Date(start.getTime() + afterMin * 60 * 1000);
    return time >= startWindow && time <= endWindow;
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

      const wakeDate = parseTimeToDate(wakeTime);
      const sleepDate = parseTimeToDate(sleepTime);
      const breakfastDate = parseTimeToDate(breakfast);
      const lunchDate = parseTimeToDate(lunch);
      const dinnerDate = parseTimeToDate(dinner);
      const extraFromDate = parseTimeToDate(extraFrom);
      const extraToDate = parseTimeToDate(extraTo);

      const totalMl = goal * 1000;
      const numNotifications = Math.ceil(totalMl / perReminderMl);
      const totalMinutes =
        (sleepDate.getTime() - wakeDate.getTime()) / (60 * 1000);
      const interval = totalMinutes / numNotifications;

      let scheduled = 0;
      for (let i = 0; i < numNotifications; i++) {
        const notifTime = new Date(
          wakeDate.getTime() + i * interval * 60 * 1000,
        );

        // Skip if in meal windows
        if (
          isWithinWindow(notifTime, breakfastDate, breakfastDate, 30, 60) ||
          isWithinWindow(notifTime, lunchDate, lunchDate, 30, 60) ||
          isWithinWindow(notifTime, dinnerDate, dinnerDate, 30, 60)
        ) {
          continue;
        }

        // Skip if in extra break window
        if (notifTime >= extraFromDate && notifTime <= extraToDate) {
          continue;
        }

        await scheduleWaterNotification({
          id: `water_${Date.now()}_${i}`,
          title: `Drink ${perReminderMl}ml of water`,
          dateTime: notifTime,
        });
        scheduled++;
      }

      Alert.alert('Success', `Scheduled ${scheduled} water reminders!`);
      onBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to schedule water reminders.');
    }
  };

  return (
    <LinearGradient
      colors={[theme.background, theme.surface, theme.surfaceVariant]}
      style={styles.container}
      start={{x: 0, y: 0}}
      end={{x: 1, y: 1}}>
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
                thumbColor={useExtraBreak ? theme.surface : theme.textSecondary}
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
                style={[styles.tab, perReminderMl === 250 && styles.tabActive]}
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
                style={[styles.tab, perReminderMl === 500 && styles.tabActive]}
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
});
