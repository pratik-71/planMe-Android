import notifee, {EventType} from '@notifee/react-native';

// Register background notification tap handler
notifee.onBackgroundEvent(async ({type, detail}) => {
  try {
    if (
      type === EventType.PRESS ||
      type === EventType.ACTION_PRESS ||
      type === EventType.DISMISSED
    ) {
      const {Linking, Platform} = require('react-native');
      if (Platform.OS === 'android') {
        try {
          const nid = detail?.notification?.id;
          if (nid) {
            await notifee.cancelDisplayedNotification(nid);
          }
        } catch {}
        if (type !== EventType.DISMISSED) {
          await Linking.openURL('alarmapp://viewday');
        }
      }
    }
  } catch {}
});
