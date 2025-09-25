import notifee, {EventType} from '@notifee/react-native';

// Register background notification tap handler
notifee.onBackgroundEvent(async ({type}) => {
  try {
    if (type === EventType.PRESS || type === EventType.ACTION_PRESS) {
      const {Linking, Platform} = require('react-native');
      if (Platform.OS === 'android') {
        await Linking.openURL('alarmapp://viewday');
      }
    }
  } catch {}
});


