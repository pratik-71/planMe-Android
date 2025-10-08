import React, {useEffect, useState, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import {BackendService} from '../../../services/BackendService';
import {theme} from '../../../stores/ThemeStore';

interface Props {
  userId: string;
  dailyGoal?: number;
}

type FilterType = '1day' | '2days' | '7days' | 'month' | 'custom';

interface ProteinData {
  date: string;
  protein: number;
  goal: number;
}

export default function ProteinAnalytics({userId, dailyGoal = 0}: Props) {
  const [filter, setFilter] = useState<FilterType>('7days');
  const [series, setSeries] = useState<ProteinData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [customFromDate, setCustomFromDate] = useState<Date>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 6);
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [customToDate, setCustomToDate] = useState<Date>(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);

  const getDateRange = useCallback((): {days: number; offset: number} => {
    switch (filter) {
      case '1day':
        return {days: 1, offset: 0};
      case '2days':
        return {days: 2, offset: 0};
      case '7days':
        return {days: 7, offset: 0};
      case 'month':
        return {days: 30, offset: 0};
      case 'custom': {
        const from = new Date(customFromDate);
        const to = new Date(customToDate);
        from.setHours(0, 0, 0, 0);
        to.setHours(0, 0, 0, 0);
        const start = from <= to ? from : to;
        const end = from <= to ? to : from;
        const millisPerDay = 1000 * 60 * 60 * 24;
        const days = Math.max(
          1,
          Math.round((end.getTime() - start.getTime()) / millisPerDay) + 1,
        );
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const offset = Math.max(
          0,
          Math.round((today.getTime() - end.getTime()) / millisPerDay),
        );
        return {days, offset};
      }
      default:
        return {days: 7, offset: 0};
    }
  }, [filter, customFromDate, customToDate]);

  const load = useCallback(async () => {
    if (!userId) return;
    try {
      setLoading(true);
      setError('');
      const {days, offset} = getDateRange();
      const res = await BackendService.getProteinHistory(userId, days, offset);
      const rawData = res?.data || [];

      // Transform data to include goal for each day
      const transformedData = rawData.map((item: any) => ({
        date: item.date,
        protein: item.protein || 0,
        goal: dailyGoal || 0,
      }));

      setSeries(transformedData);
    } catch (e) {
      setError('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }, [userId, getDateRange, dailyGoal]);

  useEffect(() => {
    load();
  }, [load]);

  const maxValue = Math.max(dailyGoal || 0, ...series.map(s => s.protein));
  const avg = series.length
    ? Math.round(series.reduce((a, b) => a + b.protein, 0) / series.length)
    : 0;
  const consistency = series.length
    ? Math.round(
        (series.filter(s => s.protein >= (dailyGoal || 1)).length /
          series.length) *
          100,
      )
    : 0;

  const renderLineGraph = () => {
    if (series.length === 0) return null;

    const screenWidth = Dimensions.get('window').width - 64; // Account for padding
    const pointSpacing = screenWidth / Math.max(series.length - 1, 1);
    const graphHeight = 200;
    const goalY = dailyGoal
      ? graphHeight * (1 - dailyGoal / maxValue)
      : graphHeight;

    // Create path for the line
    const points = series.map((item, index) => {
      const x = index * pointSpacing;
      const y = graphHeight * (1 - item.protein / maxValue);
      return {x, y};
    });

    return (
      <View style={styles.graphContainer}>
        <Text style={styles.graphTitle}>Protein Intake Trend</Text>

        {/* Y-axis labels */}
        <View style={styles.yAxisContainer}>
          <Text style={styles.yAxisLabel}>{maxValue}g</Text>
          {dailyGoal > 0 && dailyGoal < maxValue && (
            <Text style={[styles.yAxisLabel, styles.goalLabel]}>
              {dailyGoal}g
            </Text>
          )}
          <Text style={styles.yAxisLabel}>0g</Text>
        </View>

        {/* Graph area */}
        <View style={styles.graphArea}>
          {/* Goal line */}
          {dailyGoal > 0 && <View style={[styles.goalLine, {top: goalY}]} />}

          {/* Data points and line */}
          <View style={styles.lineContainer}>
            {points.map((point, index) => (
              <View
                key={index}
                style={[
                  styles.dataPoint,
                  {
                    left: point.x - 4,
                    top: point.y - 4,
                    backgroundColor:
                      series[index].protein >= dailyGoal
                        ? '#4CAF50'
                        : '#FF5722',
                  },
                ]}
              />
            ))}

            {/* Connect points with lines */}
            {points.map((point, index) => {
              if (index === 0) return null;
              const prevPoint = points[index - 1];
              const length = Math.sqrt(
                Math.pow(point.x - prevPoint.x, 2) +
                  Math.pow(point.y - prevPoint.y, 2),
              );
              const angle =
                Math.atan2(point.y - prevPoint.y, point.x - prevPoint.x) *
                (180 / Math.PI);
              return (
                <View
                  key={`line-${index}`}
                  style={[
                    styles.lineSegment,
                    {
                      left: prevPoint.x,
                      top: prevPoint.y,
                      width: length,
                      transform: [{rotate: `${angle}deg`}],
                      backgroundColor:
                        series[index].protein >= dailyGoal
                          ? '#4CAF50'
                          : '#FF5722',
                    },
                  ]}
                />
              );
            })}
          </View>

          {/* X-axis labels */}
          <View style={styles.xAxisContainer}>
            {series.map((item, index) => (
              <Text key={index} style={styles.xAxisLabel}>
                {new Date(item.date).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })}
              </Text>
            ))}
          </View>
        </View>
      </View>
    );
  };

  const renderDailyBreakdown = () => {
    return (
      <View style={styles.dailyBreakdown}>
        <Text style={styles.dailyTitle}>Daily Breakdown</Text>
        {series.map((item, index) => {
          const isGoalMet = item.protein >= item.goal;
          const percentage =
            item.goal > 0 ? Math.round((item.protein / item.goal) * 100) : 0;
          return (
            <View key={index} style={styles.dailyItem}>
              <View style={styles.dailyDateContainer}>
                <Text style={styles.dailyDate}>
                  {new Date(item.date).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })}
                </Text>
                <Text style={styles.dailyPercentage}>{percentage}%</Text>
              </View>
              <View style={styles.dailyValues}>
                <Text
                  style={[
                    styles.dailyValue,
                    isGoalMet ? styles.goalMet : styles.goalNotMet,
                  ]}>
                  {item.protein}/{item.goal}g
                </Text>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      {width: `${Math.min(percentage, 100)}%`},
                      isGoalMet
                        ? styles.progressGoalMet
                        : styles.progressGoalNotMet,
                    ]}
                  />
                </View>
              </View>
            </View>
          );
        })}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header with filter */}
      <View style={styles.header}>
        <Text style={styles.title}>Protein Analytics</Text>
        <View style={styles.filterContainer}>
          {(['1day', '2days', '7days', 'month', 'custom'] as FilterType[]).map(
            filterType => (
              <TouchableOpacity
                key={filterType}
                style={[
                  styles.filterButton,
                  filter === filterType && styles.filterButtonActive,
                ]}
                onPress={() => setFilter(filterType)}>
                <Text
                  style={[
                    styles.filterButtonText,
                    filter === filterType && styles.filterButtonTextActive,
                  ]}>
                  {filterType === '1day'
                    ? '1D'
                    : filterType === '2days'
                    ? '2D'
                    : filterType === '7days'
                    ? '7D'
                    : filterType === 'month'
                    ? '30D'
                    : 'Custom'}
                </Text>
              </TouchableOpacity>
            ),
          )}
        </View>
      </View>

      {/* Stats badges */}
      <View style={styles.statsContainer}>
        <View style={styles.statBadge}>
          <Text style={styles.statValue}>{avg}g</Text>
          <Text style={styles.statLabel}>Average</Text>
        </View>
        {dailyGoal > 0 && (
          <View style={[styles.statBadge, styles.goalBadge]}>
            <Text style={styles.statValue}>{dailyGoal}g</Text>
            <Text style={styles.statLabel}>Goal</Text>
          </View>
        )}
        <View style={styles.statBadge}>
          <Text style={styles.statValue}>{consistency}%</Text>
          <Text style={styles.statLabel}>Consistency</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={styles.loadingText}>Loading analytics...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollContainer}
          showsVerticalScrollIndicator={false}>
          {/* Line Graph */}
          {renderLineGraph()}

          {/* Custom Range Controls */}
          {filter === 'custom' && (
            <View style={styles.customSection}>
              <Text style={styles.customTitle}>Select Custom Range</Text>
              <View style={styles.customRow}>
                <Text style={styles.customLabel}>From</Text>
                <TouchableOpacity
                  style={styles.dateBtn}
                  onPress={() => setShowFromPicker(true)}>
                  <Text style={styles.dateBtnText}>
                    {customFromDate.toLocaleDateString()}
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={styles.customRow}>
                <Text style={styles.customLabel}>To</Text>
                <TouchableOpacity
                  style={styles.dateBtn}
                  onPress={() => setShowToPicker(true)}>
                  <Text style={styles.dateBtnText}>
                    {customToDate.toLocaleDateString()}
                  </Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.customHint}>
                Range updates automatically after picking dates
              </Text>
            </View>
          )}

          {/* Daily Breakdown */}
          {renderDailyBreakdown()}
        </ScrollView>
      )}

      {/* Date Pickers */}
      {showFromPicker && (
        <DateTimePicker
          value={customFromDate}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowFromPicker(false);
            if (selectedDate) {
              const d = new Date(selectedDate);
              d.setHours(0, 0, 0, 0);
              setCustomFromDate(d);
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
              const d = new Date(selectedDate);
              d.setHours(0, 0, 0, 0);
              setCustomToDate(d);
            }
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.borderLight,
    padding: 16,
    marginTop: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.textPrimary,
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: theme.surfaceVariant,
    borderWidth: 1,
    borderColor: theme.borderLight,
  },
  filterButtonActive: {
    backgroundColor: theme.primary,
    borderColor: theme.primary,
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.textSecondary,
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  statBadge: {
    alignItems: 'center',
    backgroundColor: theme.surfaceVariant,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.borderLight,
    minWidth: 80,
  },
  goalBadge: {
    backgroundColor: '#FFC10722',
    borderColor: '#FFC10766',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.textPrimary,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: theme.textSecondary,
    fontWeight: '500',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 14,
    color: theme.textSecondary,
    marginTop: 8,
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  errorText: {
    fontSize: 14,
    color: theme.error,
  },
  scrollContainer: {
    maxHeight: 500,
  },
  customSection: {
    backgroundColor: theme.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.borderLight,
    padding: 16,
    marginBottom: 16,
  },
  customTitle: {fontSize: 16, fontWeight: '700', color: theme.textPrimary},
  customRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  customLabel: {fontSize: 14, color: theme.textSecondary, fontWeight: '600'},
  dateBtn: {
    backgroundColor: theme.surfaceVariant,
    borderWidth: 1,
    borderColor: theme.borderLight,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    minWidth: 140,
    alignItems: 'center',
  },
  dateBtnText: {color: theme.textPrimary, fontWeight: '700'},
  customHint: {
    marginTop: 8,
    fontSize: 12,
    color: theme.textTertiary,
  },
  graphContainer: {
    backgroundColor: theme.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: theme.borderLight,
  },
  graphTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.textPrimary,
    marginBottom: 16,
    textAlign: 'center',
  },
  yAxisContainer: {
    position: 'absolute',
    left: 0,
    top: 20,
    bottom: 40,
    width: 40,
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingRight: 8,
  },
  yAxisLabel: {
    fontSize: 10,
    color: theme.textSecondary,
    fontWeight: '600',
  },
  goalLabel: {
    color: '#FFC107',
    fontWeight: '700',
  },
  graphArea: {
    marginLeft: 40,
    height: 200,
    position: 'relative',
  },
  goalLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#FFC107',
    opacity: 0.8,
  },
  lineContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 30,
  },
  dataPoint: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  lineSegment: {
    position: 'absolute',
    height: 2,
    borderRadius: 1,
  },
  xAxisContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  xAxisLabel: {
    fontSize: 10,
    color: theme.textSecondary,
    fontWeight: '500',
  },
  dailyBreakdown: {
    backgroundColor: theme.background,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.borderLight,
  },
  dailyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.textPrimary,
    marginBottom: 16,
  },
  dailyItem: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.borderLight,
  },
  dailyDateContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  dailyDate: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.textPrimary,
  },
  dailyPercentage: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.textSecondary,
  },
  dailyValues: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dailyValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  goalMet: {
    color: '#4CAF50',
  },
  goalNotMet: {
    color: '#FF5722',
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: theme.surfaceVariant,
    borderRadius: 3,
    marginLeft: 12,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressGoalMet: {
    backgroundColor: '#4CAF50',
  },
  progressGoalNotMet: {
    backgroundColor: '#FF5722',
  },
});
