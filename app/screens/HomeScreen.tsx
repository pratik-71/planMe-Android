import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {theme} from '../../stores/ThemeStore';

interface Props {
  onScheduleDay: () => void;
  onViewDay: () => void;
  onOpenWaterBreaks: () => void;
  onManage: () => void;
  onOpenProteinTracker?: () => void;
  onOpenBucketList?: () => void;
}

export default function HomeScreen({
  onScheduleDay,
  onViewDay,
  onOpenWaterBreaks,
  onManage,
  onOpenProteinTracker,
  onOpenBucketList,
}: Props) {
  return (
    <LinearGradient
      colors={[theme.background, theme.surface]}
      style={styles.container}
      start={{x: 0, y: 0}}
      end={{x: 1, y: 1}}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Header Section */}
        <View style={styles.header}>
          <Text style={styles.title}>PlanMe</Text>
          <Text style={styles.subtitle}>
            Your personal productivity companion
          </Text>
        </View>

        {/* Main Actions Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Daily Planning</Text>
          <View style={styles.cardRow}>
            <TouchableOpacity
              style={styles.primaryCard}
              onPress={onScheduleDay}>
              <LinearGradient
                colors={[theme.primary, theme.accent]}
                style={styles.cardGradient}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 1}}>
                <View style={styles.cardContent}>
                  <Text style={styles.cardTitle}>Schedule Day</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryCard} onPress={onViewDay}>
              <LinearGradient
                colors={[theme.accent, theme.primary]}
                style={styles.cardGradient}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 1}}>
                <View style={styles.cardContent}>
                  <Text style={styles.cardTitle}>View Day</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {/* Health & Wellness Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Health & Wellness</Text>
          <View style={styles.cardRow}>
            <TouchableOpacity
              style={styles.healthCard}
              onPress={onOpenWaterBreaks}>
              <LinearGradient
                colors={['#4FC3F7', '#0288D1']}
                style={styles.cardGradient}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 1}}>
                <View style={styles.cardContent}>
                  <Text style={styles.cardTitle}>Water Breaks</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>

            {onOpenProteinTracker && (
              <TouchableOpacity
                style={styles.healthCard}
                onPress={onOpenProteinTracker}>
                <LinearGradient
                  colors={['#66BB6A', '#2E7D32']}
                  style={styles.cardGradient}
                  start={{x: 0, y: 0}}
                  end={{x: 1, y: 1}}>
                  <View style={styles.cardContent}>
                    <Text style={styles.cardTitle}>Protein Tracker</Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Goals & Dreams Section */}
        {onOpenBucketList && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Goals & Dreams</Text>
            <TouchableOpacity
              style={styles.fullWidthCard}
              onPress={onOpenBucketList}>
              <LinearGradient
                colors={['#FF6B35', '#E91E63']}
                style={styles.cardGradient}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 1}}>
                <View style={styles.cardContent}>
                  <Text style={styles.cardTitle}>Bucket List</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {/* Management Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Management</Text>
          <TouchableOpacity style={styles.managementCard} onPress={onManage}>
            <View style={styles.managementCardContent}>
              <Text style={styles.managementCardTitle}>
                Templates & Schedules
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    paddingTop: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: theme.primary,
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: theme.textSecondary,
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: 22,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.textPrimary,
    marginBottom: 16,
    marginLeft: 4,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  primaryCard: {
    flex: 1,
    borderRadius: 16,
    shadowColor: theme.primary,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  secondaryCard: {
    flex: 1,
    borderRadius: 16,
    shadowColor: theme.accent,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  healthCard: {
    flex: 1,
    borderRadius: 16,
    shadowColor: '#0288D1',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  fullWidthCard: {
    borderRadius: 16,
    shadowColor: '#E91E63',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  managementCard: {
    borderRadius: 16,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.borderLight,
    shadowColor: theme.shadow,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  cardGradient: {
    padding: 16,
    minHeight: 80,
    justifyContent: 'center',
  },
  cardContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  managementCardContent: {
    padding: 16,
    minHeight: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  managementCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.textPrimary,
    letterSpacing: -0.3,
    textAlign: 'center',
  },
});
