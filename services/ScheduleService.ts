import {ScheduleDay, TimeSlot} from '../domain/schedule.types';
import {
  schedule as scheduleAlarm,
  cancel as cancelAlarm,
} from './AlarmScheduler';
import {BackendService} from './BackendService';
import {supabase} from '../stores/authStore';

// const keyForDate = (dateISO: string) => `schedule:${dateISO}`;

export async function loadAllPlansForDate(
  dateISO: string,
): Promise<ScheduleDay[]> {
  const {data} = await supabase.auth.getUser();
  const user = data?.user
    ? {id: data.user.id, email: data.user.email || ''}
    : null;
  if (!user) return [];

  try {
    const response = await BackendService.getAllPlansForDate(user.id, dateISO);

    if (
      response &&
      response.success &&
      response.plans &&
      Array.isArray(response.plans)
    ) {
      const dayName = new Date(dateISO).toLocaleDateString(undefined, {
        weekday: 'long',
      });

      // Convert each plan to ScheduleDay format
      const plans: ScheduleDay[] = response.plans.map((plan: any) => {
        let reminders = [];

        // Handle reminders field from user_daily_plans table
        if (plan.reminders) {
          if (typeof plan.reminders === 'string') {
            try {
              reminders = JSON.parse(plan.reminders);
            } catch (e) {
              reminders = [];
            }
          } else if (Array.isArray(plan.reminders)) {
            reminders = plan.reminders;
          }
        }

        // Convert reminders to slots format
        const slots = reminders.map((r: any) => ({
          id: r.id || `slot_${Date.now()}_${Math.random()}`,
          title: r.title || r.name || 'Untitled',
          startISO:
            r.startISO || r.time || r.start_time || new Date().toISOString(),
          subgoals: r.subgoals || [],
          priority: r.priority || 'medium',
          category: r.category || 'general',
        }));

        return {
          dateISO,
          dayName,
          slots,
          planId: plan.id, // Include plan ID for reference
          planName: plan.plan_name, // Include plan name
        };
      });

      return plans;
    }

    return [];
  } catch (error) {
    console.error('Error loading all plans for date:', error);
    return [];
  }
}

export async function saveSchedule(day: ScheduleDay): Promise<void> {
  const {data} = await supabase.auth.getUser();
  const user = data?.user
    ? {id: data.user.id, email: data.user.email || ''}
    : null;
  if (!user) return;

  const dayName = new Date(day.dateISO).toLocaleDateString(undefined, {
    weekday: 'long',
  });

  const reminders = day.slots.map(slot => ({
    id: slot.id,
    title: slot.title,
    startISO: slot.startISO,
    subgoals: slot.subgoals || [],
    priority: slot.priority || 'medium',
    category: slot.category || 'general',
  }));

  // Always (re)schedule alarms for current slots to ensure triggers are set
  for (const slot of day.slots) {
    try {
      // Only schedule alarms for future times
      const slotTime = new Date(slot.startISO);
      const now = new Date();

      if (slotTime > now) {
        await scheduleAlarm({
          id: slot.id,
          title: slot.title,
          dateTime: slotTime,
        });
      }
    } catch (error) {
      // Silent fail - app continues to work without alarms
    }
  }

  // If this plan already exists, update it in place to avoid duplicates
  if (typeof day.planId === 'number') {
    await BackendService.updateDailyPlan(day.planId, reminders);
    return;
  }

  await BackendService.addDailyPlan(user.id, dayName, day.dateISO, reminders);
}

export async function upsertSlot(
  day: ScheduleDay,
  slot: TimeSlot,
): Promise<ScheduleDay> {
  const idx = day.slots.findIndex(s => s.id === slot.id);
  let next: ScheduleDay;
  if (idx >= 0) {
    next = {...day, slots: day.slots.map(s => (s.id === slot.id ? slot : s))};
  } else {
    next = {...day, slots: [...day.slots, slot]};
  }
  // Do not persist here to avoid creating duplicate plans while editing.
  // Persistence happens via saveSchedule (e.g., when user taps Save Day) or explicit calls.
  return next;
}

// Bulk daily plan helpers (uses BackendService daily plan endpoints)
export async function addDailyPlan(
  planName: string,
  planDateISO: string,
  reminders: any[],
) {
  const {data} = await supabase.auth.getUser();
  const user = data?.user
    ? {id: data.user.id, email: data.user.email || ''}
    : null;
  if (!user) throw new Error('Not authenticated');
  return BackendService.addDailyPlan(user.id, planName, planDateISO, reminders);
}

export async function updateDailyPlan(planId: number, reminders: any[]) {
  return BackendService.updateDailyPlan(planId, reminders);
}

export async function removeSlot(
  day: ScheduleDay,
  slotId: string,
): Promise<ScheduleDay> {
  await cancelAlarm(slotId);
  const next = {...day, slots: day.slots.filter(s => s.id !== slotId)};
  await saveSchedule(next);
  return next;
}
