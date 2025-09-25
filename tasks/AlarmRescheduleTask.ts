import {AppRegistry} from 'react-native';
import {initialize as initializeAlarms} from '../services/AlarmScheduler';

const AlarmRescheduleTask = async (_taskData: unknown) => {
  try {
    // Wait a bit for React Native to fully initialize
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Initialize alarm system and reschedule all alarms
    await initializeAlarms();
  } catch (error) {
    console.error('AlarmRescheduleTask error:', error);
  }
};

// Register the task
AppRegistry.registerHeadlessTask(
  'AlarmRescheduleTask',
  () => AlarmRescheduleTask,
);
