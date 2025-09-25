/**
 * App entry - renders simple Navigator for Home/Schedule/View with authentication
 */
import React, {useEffect} from 'react';
import {StatusBar, useColorScheme} from 'react-native';
import './services/BackgroundHandler';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import AuthGuard from './components/AuthGuard';
import Navigator from './navigation';

function App() {
  const isDarkMode = useColorScheme() === 'dark';
  // Do not auto-navigate to Alarm screen on cold start
  const initialAlarm = undefined as unknown as
    | {slotId: string; slotTitle: string}
    | undefined;

  // Stop any ringing when app opens
  useEffect(() => {
    try {
      const {NativeModules, Platform} = require('react-native');
      if (
        Platform.OS === 'android' &&
        NativeModules?.AlarmClockModule?.stopRinging
      ) {
        NativeModules.AlarmClockModule.stopRinging();
      }
    } catch {}
  }, []);
  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <AuthGuard>
        <Navigator initialAlarm={initialAlarm} />
      </AuthGuard>
    </SafeAreaProvider>
  );
}

export default App;
