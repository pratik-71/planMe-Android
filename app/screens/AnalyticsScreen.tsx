import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Modal,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import LinearGradient from 'react-native-linear-gradient';
import {theme} from '../../stores/ThemeStore';
import {loadAllPlansForDate} from '../../services/ScheduleService';
import {ScheduleDay} from '../../domain/schedule.types';

interface Props {
  onBack: () => void;
}

type FilterType = 'today' | '7days' | 'month' | 'year' | 'custom';

interface AnalyticsData {
  totalDays: number;
  completedDays: number;
  totalReminders: number;
  completedReminders: number;
  currentStreak: number;
  completionRate: number;
  avgRemindersPerDay: number;
  weekStats: {day: string; completed: number; total: number}[];
}

export default function AnalyticsScreen({onBack}: Props) {
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('month');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [customFromDate, setCustomFromDate] = useState(new Date());
  const [customToDate, setCustomToDate] = useState(new Date());
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalDays: 0,
    completedDays: 0,
    totalReminders: 0,
    completedReminders: 0,
    currentStreak: 0,
    completionRate: 0,
    avgRemindersPerDay: 0,
    weekStats: [],
  });

  const getDateRange = useCallback((): {
    startDate: Date;
    endDate: Date;
    days: number;
  } => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    switch (filter) {
      case 'today':
        return {startDate: today, endDate: today, days: 1};

      case '7days':
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
        return {startDate: sevenDaysAgo, endDate: today, days: 7};

      case 'month':
        const monthAgo = new Date(today);
        monthAgo.setDate(monthAgo.getDate() - 29);
        return {startDate: monthAgo, endDate: today, days: 30};

      case 'year':
        const yearAgo = new Date(today);
        yearAgo.setDate(yearAgo.getDate() - 364);
        return {startDate: yearAgo, endDate: today, days: 365};

      case 'custom':
        const from = new Date(customFromDate);
        from.setHours(0, 0, 0, 0);
        const to = new Date(customToDate);
        to.setHours(0, 0, 0, 0);
        const diffTime = Math.abs(to.getTime() - from.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        return {
          startDate: from <= to ? from : to,
          endDate: from <= to ? to : from,
          days: diffDays,
        };

      default:
        return {startDate: today, endDate: today, days: 1};
    }
  }, [filter, customFromDate, customToDate]);

  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const schedules: ScheduleDay[] = [];
      const {startDate, endDate, days} = getDateRange();
      const weekStats: {day: string; completed: number; total: number}[] = [];

      // Load data for the selected range
      for (let i = 0; i < days; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);

        if (date > endDate) break;

        const dateISO = date.toISOString().slice(0, 10);

        const plans = await loadAllPlansForDate(dateISO);
        if (plans.length > 0) {
          schedules.push(...plans);
        }

        // Collect last 7 days for chart (only if in range)
        if (days <= 7 || i >= days - 7) {
          const dayPlans = plans.flatMap(p => p.slots);
          const completedCount = dayPlans.filter(s => s.completed).length;
          const totalCount = dayPlans.length;

          weekStats.push({
            day: date.toLocaleDateString('en-US', {weekday: 'short'}),
            completed: completedCount,
            total: totalCount,
          });
        }
      }

      // Keep only last 7 days for chart if range > 7 days
      const chartStats = weekStats.length > 7 ? weekStats.slice(-7) : weekStats;

      // Calculate stats
      const totalReminders = schedules.reduce(
        (sum, s) => sum + s.slots.length,
        0,
      );
      const completedReminders = schedules.reduce(
        (sum, s) => sum + s.slots.filter(slot => slot.completed).length,
        0,
      );
      const completedDays = schedules.filter(s =>
        s.slots.every(slot => slot.completed),
      ).length;
      const completionRate =
        totalReminders > 0 ? (completedReminders / totalReminders) * 100 : 0;
      const avgRemindersPerDay =
        schedules.length > 0 ? totalReminders / schedules.length : 0;

      // Calculate current streak (simplified - consecutive days with all reminders completed)
      let streak = 0;
      for (let i = 0; i < schedules.length; i++) {
        const allCompleted = schedules[i].slots.every(slot => slot.completed);
        if (allCompleted) {
          streak++;
        } else {
          break;
        }
      }

      setAnalytics({
        totalDays: schedules.length,
        completedDays,
        totalReminders,
        completedReminders,
        currentStreak: streak,
        completionRate,
        avgRemindersPerDay,
        weekStats: chartStats,
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  }, [getDateRange]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const getFilterLabel = () => {
    switch (filter) {
      case 'today':
        return 'Today';
      case '7days':
        return 'Last 7 Days';
      case 'month':
        return 'Last 30 Days';
      case 'year':
        return 'Last Year';
      case 'custom':
        return `${customFromDate.toLocaleDateString()} - ${customToDate.toLocaleDateString()}`;
      default:
        return 'Filter';
    }
  };

  const applyCustomFilter = () => {
    setFilter('custom');
    setShowFilterModal(false);
  };

  const renderStatCard = (
    title: string,
    value: string,
    subtitle: string,
    colors: string[],
  ) => (
    <View style={styles.statCard}>
      <LinearGradient
        colors={colors}
        style={styles.statCardGradient}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statTitle}>{title}</Text>
        <Text style={styles.statSubtitle}>{subtitle}</Text>
      </LinearGradient>
    </View>
  );

  const renderWeekChart = () => {
    const maxTotal = Math.max(...analytics.weekStats.map(d => d.total), 1);

    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Last 7 Days</Text>
        <View style={styles.chart}>
          {analytics.weekStats.map((stat, index) => {
            const completedHeight = (stat.completed / maxTotal) * 120;
            const totalHeight = (stat.total / maxTotal) * 120;
            const completionPercent =
              stat.total > 0 ? (stat.completed / stat.total) * 100 : 0;

            return (
              <View key={index} style={styles.chartBar}>
                <View style={styles.chartBarContainer}>
                  <View
                    style={[styles.chartBarTotal, {height: totalHeight || 4}]}
                  />
                  <View
                    style={[
                      styles.chartBarCompleted,
                      {height: completedHeight || 0},
                    ]}
                  />
                </View>
                <Text style={styles.chartBarLabel}>{stat.day}</Text>
                {stat.total > 0 && (
                  <Text style={styles.chartBarValue}>
                    {completionPercent.toFixed(0)}%
                  </Text>
                )}
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  return (
    <LinearGradient
      colors={[theme.background, theme.surface, theme.surfaceVariant]}
      style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Analytics</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Filter Bar */}
      <View style={styles.filterBar}>
        <Text style={styles.filterLabel}>Period:</Text>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilterModal(true)}>
          <Text style={styles.filterButtonText}>{getFilterLabel()}</Text>
          <Text style={styles.filterButtonIcon}>▼</Text>
        </TouchableOpacity>
      </View>

      {/* Filter Modal */}
      <Modal
        transparent
        visible={showFilterModal}
        animationType="fade"
        onRequestClose={() => setShowFilterModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Select Time Period</Text>

            <TouchableOpacity
              style={[
                styles.filterOption,
                filter === 'today' && styles.filterOptionSelected,
              ]}
              onPress={() => {
                setFilter('today');
                setShowFilterModal(false);
              }}>
              <Text
                style={[
                  styles.filterOptionText,
                  filter === 'today' && styles.filterOptionTextSelected,
                ]}>
                Today
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.filterOption,
                filter === '7days' && styles.filterOptionSelected,
              ]}
              onPress={() => {
                setFilter('7days');
                setShowFilterModal(false);
              }}>
              <Text
                style={[
                  styles.filterOptionText,
                  filter === '7days' && styles.filterOptionTextSelected,
                ]}>
                Last 7 Days
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.filterOption,
                filter === 'month' && styles.filterOptionSelected,
              ]}
              onPress={() => {
                setFilter('month');
                setShowFilterModal(false);
              }}>
              <Text
                style={[
                  styles.filterOptionText,
                  filter === 'month' && styles.filterOptionTextSelected,
                ]}>
                Last 30 Days
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.filterOption,
                filter === 'year' && styles.filterOptionSelected,
              ]}
              onPress={() => {
                setFilter('year');
                setShowFilterModal(false);
              }}>
              <Text
                style={[
                  styles.filterOptionText,
                  filter === 'year' && styles.filterOptionTextSelected,
                ]}>
                Last Year
              </Text>
            </TouchableOpacity>

            <View style={styles.customDateSection}>
              <Text style={styles.customDateTitle}>Custom Range</Text>

              <View style={styles.customDateRow}>
                <Text style={styles.customDateLabel}>From:</Text>
                <TouchableOpacity
                  style={styles.datePickerButton}
                  onPress={() => setShowFromPicker(true)}>
                  <Text style={styles.datePickerText}>
                    {customFromDate.toLocaleDateString()}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.customDateRow}>
                <Text style={styles.customDateLabel}>To:</Text>
                <TouchableOpacity
                  style={styles.datePickerButton}
                  onPress={() => setShowToPicker(true)}>
                  <Text style={styles.datePickerText}>
                    {customToDate.toLocaleDateString()}
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.applyCustomButton}
                onPress={applyCustomFilter}>
                <LinearGradient
                  colors={[theme.primary, theme.accent]}
                  style={styles.applyCustomButtonGradient}>
                  <Text style={styles.applyCustomButtonText}>
                    Apply Custom Range
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowFilterModal(false)}>
              <Text style={styles.modalCloseText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Date Pickers */}
      {showFromPicker && (
        <DateTimePicker
          value={customFromDate}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowFromPicker(false);
            if (selectedDate) {
              setCustomFromDate(selectedDate);
            }
          }}
        />
      )}

      {showToPicker && (
        <DateTimePicker
          value={customToDate}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowToPicker(false);
            if (selectedDate) {
              setCustomToDate(selectedDate);
            }
          }}
        />
      )}

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={styles.loadingText}>Loading analytics...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          {/* Overview Stats */}
          <View style={styles.statsGrid}>
            {renderStatCard(
              'Current Streak',
              `${analytics.currentStreak}`,
              'consecutive days',
              [theme.accent, theme.primary],
            )}
            {renderStatCard(
              'Completion Rate',
              `${analytics.completionRate.toFixed(0)}%`,
              'overall',
              [theme.primary, theme.primaryDark],
            )}
          </View>

          <View style={styles.statsGrid}>
            {renderStatCard(
              'Total Reminders',
              `${analytics.totalReminders}`,
              `${analytics.completedReminders} completed`,
              ['#4FC3F7', '#0288D1'],
            )}
            {renderStatCard(
              'Avg Per Day',
              `${analytics.avgRemindersPerDay.toFixed(1)}`,
              'reminders',
              ['#66BB6A', '#388E3C'],
            )}
          </View>

          {/* Week Chart */}
          {analytics.weekStats.length > 0 && renderWeekChart()}

          {/* Summary Cards */}
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>
              Summary ({getFilterLabel()})
            </Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total Days Scheduled:</Text>
              <Text style={styles.summaryValue}>{analytics.totalDays}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Fully Completed Days:</Text>
              <Text style={styles.summaryValue}>{analytics.completedDays}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total Reminders:</Text>
              <Text style={styles.summaryValue}>
                {analytics.totalReminders}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Completed Reminders:</Text>
              <Text style={styles.summaryValue}>
                {analytics.completedReminders}
              </Text>
            </View>
          </View>

          {analytics.totalDays === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No data yet</Text>
              <Text style={styles.emptyHint}>
                Start scheduling your days to see analytics
              </Text>
            </View>
          )}
        </ScrollView>
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
  filterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: theme.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.borderLight,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.textSecondary,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 8,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  filterButtonIcon: {
    fontSize: 10,
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContainer: {
    backgroundColor: theme.surface,
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 400,
    shadowColor: theme.shadow,
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.textPrimary,
    marginBottom: 16,
    textAlign: 'center',
  },
  filterOption: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginBottom: 8,
    backgroundColor: theme.background,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  filterOptionSelected: {
    backgroundColor: theme.primary + '15',
    borderColor: theme.primary,
  },
  filterOptionText: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.textPrimary,
    textAlign: 'center',
  },
  filterOptionTextSelected: {
    color: theme.primary,
  },
  customDateSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: theme.borderLight,
  },
  customDateTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.textPrimary,
    marginBottom: 12,
  },
  customDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  customDateLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.textSecondary,
  },
  datePickerButton: {
    backgroundColor: theme.background,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.borderLight,
    minWidth: 150,
  },
  datePickerText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.textPrimary,
    textAlign: 'center',
  },
  applyCustomButton: {
    marginTop: 12,
    borderRadius: 10,
    overflow: 'hidden',
  },
  applyCustomButtonGradient: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  applyCustomButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modalCloseButton: {
    marginTop: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.textSecondary,
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
  content: {
    padding: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: theme.shadow,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  statCardGradient: {
    padding: 16,
    minHeight: 100,
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
    opacity: 0.9,
    marginBottom: 2,
  },
  statSubtitle: {
    fontSize: 11,
    fontWeight: '500',
    color: '#FFFFFF',
    opacity: 0.7,
  },
  chartContainer: {
    backgroundColor: theme.surface,
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.borderLight,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.textPrimary,
    marginBottom: 16,
  },
  chart: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 160,
  },
  chartBar: {
    alignItems: 'center',
    flex: 1,
  },
  chartBarContainer: {
    width: 32,
    height: 120,
    justifyContent: 'flex-end',
    alignItems: 'center',
    position: 'relative',
  },
  chartBarTotal: {
    position: 'absolute',
    bottom: 0,
    width: 32,
    backgroundColor: theme.borderLight,
    borderRadius: 4,
  },
  chartBarCompleted: {
    position: 'absolute',
    bottom: 0,
    width: 32,
    backgroundColor: theme.primary,
    borderRadius: 4,
  },
  chartBarLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.textSecondary,
    marginTop: 6,
  },
  chartBarValue: {
    fontSize: 10,
    fontWeight: '600',
    color: theme.textTertiary,
    marginTop: 2,
  },
  summaryCard: {
    backgroundColor: theme.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.borderLight,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.textPrimary,
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.borderLight,
  },
  summaryLabel: {
    fontSize: 14,
    color: theme.textSecondary,
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 15,
    color: theme.textPrimary,
    fontWeight: '700',
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
