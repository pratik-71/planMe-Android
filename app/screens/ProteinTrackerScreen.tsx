import React, {useEffect, useMemo, useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {theme} from '../../stores/ThemeStore';
import {BackendService} from '../../services/BackendService';
import {useAuthStore} from '../../stores/authStore';
import ProteinIntakeInput from './components/ProteinIntakeInput';
import ProteinAnalytics from './components/ProteinAnalytics';
import LoaderOverlay from '../../components/LoaderOverlay';

interface Props {
  onBack: () => void;
  backendUser?: any;
}

export default function ProteinTrackerScreen({onBack, backendUser}: Props) {
  const user = useAuthStore(s => s.user);
  const [goal, setGoal] = useState<string>(
    backendUser?.protein_goal ? String(backendUser.protein_goal) : '',
  );
  const [status, setStatus] = useState<string>('');
  const [todayProtein, setTodayProtein] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'manage' | 'analytics'>('manage');
  const [saving, setSaving] = useState(false);

  const canSave = useMemo(() => {
    const n = Number(goal);
    return !Number.isNaN(n) && n > 0 && n < 1000;
  }, [goal]);

  const save = async () => {
    if (!user?.id) return;
    try {
      setSaving(true);
      const n = Number(goal);
      await BackendService.updateProteinGoal(user.id, n);
      setStatus('Saved');
      setTimeout(() => setStatus(''), 1200);
    } catch (e) {
      setStatus('Failed');
      setTimeout(() => setStatus(''), 2000);
    } finally {
      setSaving(false);
    }
  };

  // Keep input in sync when backend user data arrives/changes
  useEffect(() => {
    const pg = backendUser?.protein_goal;
    if (pg !== undefined && pg !== null) {
      setGoal(String(pg));
    }
  }, [backendUser?.protein_goal]);

  // Fetch today's protein (Misc) and hydrate intake field
  useEffect(() => {
    const fetchToday = async () => {
      if (!user?.id) return;
      try {
        const res = await BackendService.getTodayMisc(user.id);
        const protein = res?.data?.Daily_Food_Misc?.protein ?? 0;
        setTodayProtein(Number(protein) || 0);
      } catch {}
    };
    fetchToday();
  }, [user?.id]);

  return (
    <LinearGradient
      colors={[theme.background, theme.surface, theme.surfaceVariant]}
      style={styles.container}
      start={{x: 0, y: 0}}
      end={{x: 1, y: 1}}>
      <LoaderOverlay
        visible={saving}
        message={
          activeTab === 'manage' ? 'Updating protein goal...' : 'Loading...'
        }
      />
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Protein Tracker</Text>
      </View>

      <View style={styles.tabHeader}>
        <TouchableOpacity onPress={() => setActiveTab('manage')}>
          <Text
            style={[styles.tab, activeTab === 'manage' && styles.tabActive]}
          >
            Manage protein
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setActiveTab('analytics')}>
          <Text
            style={[styles.tab, activeTab === 'analytics' && styles.tabActive]}
          >
            Protein analytics
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'manage' && (
        <View style={styles.card}>
          <Text style={styles.label}>Daily protein requirement (grams)</Text>
          <TextInput
            keyboardType="numeric"
            value={goal}
            onChangeText={setGoal}
            placeholder="e.g. 120"
            placeholderTextColor={theme.textTertiary}
            style={styles.input}
          />
          <TouchableOpacity
            onPress={save}
            disabled={!canSave}
            style={[styles.saveBtn, !canSave && styles.saveBtnDisabled]}
          >
            <LinearGradient
              colors={['#66BB6A', '#2E7D32']}
              style={styles.saveBtnGradient}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 0}}
            >
              <Text style={styles.saveText}>Update</Text>
            </LinearGradient>
          </TouchableOpacity>
          {!!status && <Text style={styles.status}>{status}</Text>}
        </View>
      )}

      {activeTab === 'manage' && (
        <View style={[styles.card, styles.mt16]}>
          <Text style={styles.label}>Protein consumed today (grams)</Text>
          <Text style={styles.hint}>Current total today: {todayProtein}</Text>
          <ProteinIntakeInput
            onAdded={async add => {
              if (!user?.id) return;
              try {
                const res = await BackendService.addTodayProtein(user.id, add);
                const protein = res?.data?.Daily_Food_Misc?.protein ?? 0;
                setTodayProtein(Number(protein) || 0);
              } catch (e) {
                setStatus('Failed to add protein');
                setTimeout(() => setStatus(''), 2000);
              }
            }}
          />
        </View>
      )}

      {/* Analytics */}
      {activeTab === 'analytics' && (
        <ProteinAnalytics
          userId={user?.id || ''}
          dailyGoal={Number(goal) || backendUser?.protein_goal || 0}
        />
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, padding: 16},
  header: {flexDirection: 'row', alignItems: 'center', marginBottom: 12},
  backBtn: {padding: 8, marginRight: 8},
  backText: {fontSize: 20, color: theme.textPrimary},
  title: {fontSize: 20, fontWeight: '800', color: theme.primary},
  tabHeader: {flexDirection: 'row', marginTop: 8, marginBottom: 16},
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginRight: 8,
    backgroundColor: theme.surface,
    color: theme.textSecondary,
    borderWidth: 1,
    borderColor: theme.borderLight,
    overflow: 'hidden',
  },
  tabActive: {backgroundColor: theme.primary + '22', color: theme.textPrimary},
  card: {
    backgroundColor: theme.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.borderLight,
    padding: 16,
  },
  label: {fontSize: 14, color: theme.textSecondary, marginBottom: 8},
  input: {
    borderWidth: 1,
    borderColor: theme.borderLight,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: theme.textPrimary,
    backgroundColor: theme.surfaceVariant,
  },
  saveBtn: {borderRadius: 12, overflow: 'hidden', marginTop: 16},
  saveBtnDisabled: {opacity: 0.6},
  saveBtnGradient: {paddingVertical: 12, alignItems: 'center'},
  saveText: {color: '#fff', fontWeight: '700'},
  status: {marginTop: 8, color: theme.textSecondary},
  hint: {fontSize: 12, color: theme.textTertiary, marginBottom: 8},
  mt16: {marginTop: 16},
});
