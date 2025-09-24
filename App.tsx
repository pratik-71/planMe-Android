/**
 * App entry - renders simple Navigator for Home/Schedule/View with authentication
 */
import React from 'react';
import {StatusBar, useColorScheme} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import AuthGuard from './components/AuthGuard';
import Navigator from './navigation';

function App() {
  const isDarkMode = useColorScheme() === 'dark';
  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <AuthGuard>
        <Navigator />
      </AuthGuard>
    </SafeAreaProvider>
  );
}

export default App;
