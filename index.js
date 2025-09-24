/**
 * @format
 */

import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';

// Register the alarm reschedule task
import './tasks/AlarmRescheduleTask';

AppRegistry.registerComponent(appName, () => App);
