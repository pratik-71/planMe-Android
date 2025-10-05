import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {theme} from '../../stores/ThemeStore';
import {TemplateService, Template} from '../../services/TemplateService';
import {loadAllPlansForDate} from '../../services/ScheduleService';
import {ScheduleDay} from '../../domain/schedule.types';

interface Props {
  onBack: () => void;
}

export default function ManageScreen({onBack}: Props) {
  const [activeTab, setActiveTab] = useState<'templates' | 'schedules'>(
    'templates',
  );
  const [templates, setTemplates] = useState<Template[]>([]);
  const [schedules, setSchedules] = useState<ScheduleDay[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (activeTab === 'templates') {
      loadTemplates();
    } else {
      loadSchedules();
    }
  }, [activeTab]);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const userTemplates = await TemplateService.getUserTemplates();
      setTemplates(userTemplates);
    } catch (error) {
      Alert.alert('Error', 'Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const loadSchedules = async () => {
    setLoading(true);
    try {
      // Load schedules for the last 30 days
      const schedulesList: ScheduleDay[] = [];
      const today = new Date();

      for (let i = 0; i < 30; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateISO = date.toISOString().slice(0, 10);

        const plans = await loadAllPlansForDate(dateISO);
        if (plans.length > 0) {
          schedulesList.push(...plans);
        }
      }

      setSchedules(schedulesList);
    } catch (error) {
      Alert.alert('Error', 'Failed to load schedules');
    } finally {
      setLoading(false);
    }
  };

  const deleteTemplate = async (templateId: number, name: string) => {
    Alert.alert(
      'Delete Template',
      `Are you sure you want to delete "${name}"?`,
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await TemplateService.deleteTemplate(templateId);
              await loadTemplates();
              Alert.alert('Success', 'Template deleted');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete template');
            }
          },
        },
      ],
    );
  };

  const renderTemplate = ({item}: {item: Template}) => (
    <View style={styles.card}>
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{item.name}</Text>
        <Text style={styles.cardSubtitle}>
          {item.reminders.length} reminder
          {item.reminders.length !== 1 ? 's' : ''}
        </Text>
        <View style={styles.remindersList}>
          {item.reminders.slice(0, 3).map((reminder, index) => (
            <Text key={index} style={styles.reminderText}>
              • {reminder.time} - {reminder.title}
            </Text>
          ))}
          {item.reminders.length > 3 && (
            <Text style={styles.reminderText}>
              ... and {item.reminders.length - 3} more
            </Text>
          )}
        </View>
      </View>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => deleteTemplate(item.id!, item.name)}>
        <Text style={styles.deleteText}>🗑️</Text>
      </TouchableOpacity>
    </View>
  );

  const renderSchedule = ({item}: {item: ScheduleDay}) => (
    <View style={styles.card}>
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{item.dayName}</Text>
        <Text style={styles.cardSubtitle}>
          {item.dateISO} • {item.slots.length} reminder
          {item.slots.length !== 1 ? 's' : ''}
        </Text>
        <View style={styles.remindersList}>
          {item.slots.slice(0, 3).map(slot => {
            const time = new Date(slot.startISO);
            const timeStr = `${time
              .getHours()
              .toString()
              .padStart(2, '0')}:${time
              .getMinutes()
              .toString()
              .padStart(2, '0')}`;
            return (
              <Text key={slot.id} style={styles.reminderText}>
                • {timeStr} - {slot.title}
                {slot.completed && ' ✓'}
              </Text>
            );
          })}
          {item.slots.length > 3 && (
            <Text style={styles.reminderText}>
              ... and {item.slots.length - 3} more
            </Text>
          )}
        </View>
      </View>
    </View>
  );

  return (
    <LinearGradient
      colors={[theme.background, theme.surface, theme.surfaceVariant]}
      style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manage</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'templates' && styles.activeTab]}
          onPress={() => setActiveTab('templates')}>
          <Text
            style={[
              styles.tabText,
              activeTab === 'templates' && styles.activeTabText,
            ]}>
            Templates
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'schedules' && styles.activeTab]}
          onPress={() => setActiveTab('schedules')}>
          <Text
            style={[
              styles.tabText,
              activeTab === 'schedules' && styles.activeTabText,
            ]}>
            Schedules
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      ) : (
        <FlatList
          data={activeTab === 'templates' ? templates : schedules}
          keyExtractor={item => item.id?.toString() || ''}
          renderItem={
            activeTab === 'templates' ? renderTemplate : renderSchedule
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>
                {activeTab === 'templates'
                  ? 'No templates yet'
                  : 'No schedules found'}
              </Text>
              <Text style={styles.emptyHint}>
                {activeTab === 'templates'
                  ? 'Create templates from the Schedule Day screen'
                  : 'Schedule reminders to see them here'}
              </Text>
            </View>
          }
          contentContainerStyle={styles.listContent}
        />
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: theme.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.borderLight,
  },
  backButton: {
    padding: 8,
  },
  backText: {
    fontSize: 16,
    color: theme.primary,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.textPrimary,
  },
  placeholder: {
    width: 60,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: theme.surface,
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: theme.primary,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.textSecondary,
  },
  activeTabText: {
    color: theme.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: theme.textSecondary,
  },
  listContent: {
    padding: 16,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: theme.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.borderLight,
    shadowColor: theme.shadow,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: theme.textPrimary,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 13,
    color: theme.textSecondary,
    marginBottom: 12,
  },
  remindersList: {
    gap: 4,
  },
  reminderText: {
    fontSize: 13,
    color: theme.textSecondary,
    lineHeight: 18,
  },
  deleteButton: {
    padding: 8,
    alignSelf: 'flex-start',
  },
  deleteText: {
    fontSize: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.textSecondary,
    marginBottom: 8,
  },
  emptyHint: {
    fontSize: 14,
    color: theme.textTertiary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
