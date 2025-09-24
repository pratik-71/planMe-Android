export interface Subgoal {
  id: string;
  text: string;
  completed: boolean;
  priority?: string;
}

export interface TimeSlot {
  id: string;
  title: string;
  startISO: string; // ISO string
  subgoals: Subgoal[];
  alarmId?: string;
  priority?: string;
  category?: string;
}

export interface ScheduleDay {
  dateISO: string; // yyyy-MM-dd
  dayName: string; // Monday, etc.
  slots: TimeSlot[];
  planId?: number; // Optional plan ID for reference
  planName?: string; // Optional plan name
}
