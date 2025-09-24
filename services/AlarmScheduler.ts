import notifee, {
  AndroidCategory,
  AndroidImportance,
  EventType,
  TimestampTrigger,
  TriggerType,
} from '@notifee/react-native';

export type AlarmPayload = {
  id: string;
  title: string;
  dateTime: Date;
};

let initialized = false;
let unsubscribeForeground: (() => void) | undefined;

export async function initialize(_onOpenAlarm?: (reminderId: string) => void) {
  if (initialized) return;

  try {
    // Create notification channel
    await notifee.createChannel({
      id: 'alarm-channel',
      name: 'Alarms',
      sound: 'default',
      importance: AndroidImportance.HIGH,
      vibration: true,
    });

    // Request notification permissions when user enters home page
    try {
      const settings = await notifee.getNotificationSettings();
      if (settings.authorizationStatus !== 1) {
        await notifee.requestPermission();
      }
    } catch (err) {
      // Continue anyway - user can still use app without notifications
    }

    initialized = true;
  } catch (e) {
    initialized = true;
  }
}

export function dispose() {
  try {
    unsubscribeForeground?.();
  } catch {}
  initialized = false;
}

// Initialize complex alarm features after app is fully loaded
export async function initializeAdvancedFeatures() {
  try {
    // Set up foreground event handler with comprehensive error handling
    unsubscribeForeground = notifee.onForegroundEvent(
      async ({type, detail}) => {
        try {
          if (
            type === EventType.PRESS ||
            type === EventType.ACTION_PRESS ||
            type === EventType.DELIVERED
          ) {
            const notificationData = detail.notification?.data as any;
            if (notificationData?.reminderId && notificationData?.slotTitle) {
              // Add delay to ensure app is fully loaded
              setTimeout(() => {
                try {
                  const NavigationService = require('./NavigationService');
                  NavigationService.navigateToAlarm(
                    notificationData.slotTitle,
                    notificationData.reminderId,
                  );
                } catch (navError) {
                  // Silent fail - navigation not ready
                }
              }, 500);
            }
          }
        } catch (error) {
          // Silent fail - don't crash app
        }
      },
    );

    // Handle initial notification with error handling
    try {
      const initial = await notifee.getInitialNotification();
      const data = initial?.notification?.data as any;
      if (data?.reminderId && data?.slotTitle) {
        setTimeout(() => {
          try {
            const NavigationService = require('./NavigationService');
            NavigationService.navigateToAlarm(data.slotTitle, data.reminderId);
          } catch (error) {
            // Silent fail - navigation not ready
          }
        }, 2000);
      }
    } catch (initError) {
      // Silent fail - initial notification check failed
    }

    // Reschedule alarms with error handling
    try {
      await rescheduleAllAlarms();
    } catch (rescheduleError) {
      // Silent fail - rescheduling failed
    }
  } catch (e) {
    // Silent fail - don't crash app
  }
}

export async function schedule(alarm: AlarmPayload) {
  try {
    // Ensure channel is created first
    if (!initialized) {
      await initialize();
    }

    // Request notification permissions
    const notificationPermission = await notifee.requestPermission();
    if (notificationPermission.authorizationStatus !== 1) {
      throw new Error('Notification permission not granted');
    }

    // For Android, try to request exact alarm permission
    const {Platform} = require('react-native');
    if (Platform.OS === 'android') {
      try {
        await notifee.requestPermission();
      } catch (permissionError) {
        // Continue anyway - some devices don't support this
      }
    }

    // Try native AlarmClock module first
    try {
      const {NativeModules} = require('react-native');
      const m = NativeModules?.AlarmClockModule;
      if (m?.schedule) {
        await m.schedule(alarm.id, alarm.title, alarm.dateTime.getTime());
        // Also post a silent visual notification at the same time as a UI fallback
        const triggerSilent: TimestampTrigger = {
          type: TriggerType.TIMESTAMP,
          timestamp: alarm.dateTime.getTime(),
          alarmManager: {allowWhileIdle: true},
        };
        await notifee.createTriggerNotification(
          {
            id: `alarm_vis_${alarm.id}`,
            title: 'Alarm',
            body: alarm.title,
            data: {reminderId: alarm.id, slotTitle: alarm.title},
            android: {
              channelId: 'alarm-channel',
              category: AndroidCategory.ALARM,
              importance: AndroidImportance.HIGH,
              // no sound/vibration; the service provides the tone
              pressAction: {
                id: 'open_alarm',
                launchActivity: 'com.alarmapp.AlarmActivity',
              },
              fullScreenAction: {
                id: 'open_alarm',
                launchActivity: 'com.alarmapp.AlarmActivity',
              },
              autoCancel: false,
              showTimestamp: true,
              ongoing: true,
              visibility: 1,
            },
          },
          triggerSilent,
        );
        return;
      }
    } catch {}

    const trigger: TimestampTrigger = {
      type: TriggerType.TIMESTAMP,
      timestamp: alarm.dateTime.getTime(),
      alarmManager: {
        allowWhileIdle: true,
      },
    };

    await notifee.createTriggerNotification(
      {
        id: `alarm_${alarm.id}`,
        title: '🚨 ALARM',
        body: alarm.title,
        data: {reminderId: alarm.id, slotTitle: alarm.title},
        android: {
          channelId: 'alarm-channel',
          category: AndroidCategory.ALARM,
          importance: AndroidImportance.HIGH,
          sound: 'default',
          loopSound: true, // Keep ringing until dismissed
          vibrationPattern: [300, 700, 300, 700],
          pressAction: {
            id: 'open_alarm',
            launchActivity: 'com.alarmapp.MainActivity',
          },
          fullScreenAction: {
            id: 'open_alarm',
            launchActivity: 'com.alarmapp.MainActivity',
          },
          autoCancel: false, // Don't auto-cancel, user must interact
          // Ensure notification shows even when device is locked
          showTimestamp: true,
          ongoing: true, // Make it ongoing so it can't be dismissed
          // Additional settings for full-screen alarm
          visibility: 1, // AndroidVisibility.PUBLIC
        },
      },
      trigger,
    );
  } catch (e) {
    // Silent fail - app continues to work without alarms
  }
}

export async function cancel(reminderId: string) {
  try {
    await notifee.cancelNotification(`alarm_${reminderId}`);
  } catch (e) {
    // Silent fail
  }
}

// Reschedule all alarms from backend after app restart/reboot
async function rescheduleAllAlarms() {
  try {
    await new Promise(resolve => setTimeout(resolve, 5000));

    const {supabase} = require('../stores/authStore');
    const {data} = await supabase.auth.getUser();
    const user = data?.user;

    if (!user?.id) {
      return;
    }

    const ScheduleService = require('./ScheduleService');
    const today = new Date().toISOString().slice(0, 10);
    const todayPlans = await ScheduleService.loadAllPlansForDate(today);

    if (todayPlans && todayPlans.length > 0) {
      for (const plan of todayPlans) {
        for (const slot of plan.slots) {
          const slotTime = new Date(slot.startISO);
          const now = new Date();

          if (slotTime > now) {
            await schedule({
              id: slot.id,
              title: slot.title,
              dateTime: slotTime,
            });
          }
        }
      }
    }
  } catch (e) {
    // Silent fail
  }
}
