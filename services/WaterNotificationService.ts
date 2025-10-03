import notifee, {
  AndroidImportance,
  TimestampTrigger,
  TriggerType,
  AuthorizationStatus,
} from '@notifee/react-native';

export interface WaterNotification {
  id: string;
  title: string;
  dateTime: Date;
}

// Using Android's default notification sound URI
const WATER_CHANNEL_ID = 'water-reminders-v4';

let initialized = false;

export async function initialize() {
  if (initialized) return;
  try {
    const settings = await notifee.getNotificationSettings();
    if (settings.authorizationStatus !== AuthorizationStatus.AUTHORIZED) {
      await notifee.requestPermission();
    }

    await notifee.createChannel({
      id: WATER_CHANNEL_ID,
      name: 'Water Reminders',
      importance: AndroidImportance.HIGH,
      // Using Android's notification sound (different from default)
      sound: 'content://settings/system/notification_sound',
      vibration: true,
      lights: false,
    });

    initialized = true;
  } catch {
    initialized = true;
  }
}

export async function scheduleWaterNotification(
  notification: WaterNotification,
) {
  try {
    if (!initialized) await initialize();

    const now = Date.now();
    const minDelay = 5000;
    const scheduledTime = Math.max(
      notification.dateTime.getTime(),
      now + minDelay,
    );

    const trigger: TimestampTrigger = {
      type: TriggerType.TIMESTAMP,
      timestamp: scheduledTime,
      alarmManager: {allowWhileIdle: true},
    };

    // Schedule single notification
    await notifee.createTriggerNotification(
      {
        id: `water_${notification.id}`,
        title: '💧 Time to drink water',
        body: notification.title,
        android: {
          channelId: WATER_CHANNEL_ID,
          importance: AndroidImportance.HIGH,
          vibrationPattern: [200, 200, 200, 200],
          autoCancel: true,
          showTimestamp: true,
        },
      },
      trigger,
    );
  } catch {}
}

export async function cancelWaterNotification(notificationId: string) {
  try {
    await notifee.cancelNotification(`water_${notificationId}`);
  } catch {}
}

export async function cancelAllWaterNotifications() {
  try {
    const notifications = await notifee.getTriggerNotifications();
    for (const notif of notifications) {
      if (notif.notification.id?.startsWith('water_')) {
        await notifee.cancelNotification(notif.notification.id);
      }
    }
  } catch {}
}
