/**
 * App entry - renders simple Navigator for Home/Schedule/View with authentication
 */
import React from 'react';
import {StatusBar, useColorScheme} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import AuthGuard from './components/AuthGuard';
import Navigator from './navigation';

function App(props: any) {
  const isDarkMode = useColorScheme() === 'dark';
  const initialAlarm = props?.slotId
    ? {slotId: props.slotId as string, slotTitle: (props.slotTitle as string) || 'Alarm'}
    : undefined;
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
