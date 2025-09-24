import {AppRegistry} from 'react-native';
import {initialize as initializeAlarms} from '../services/AlarmScheduler';

const AlarmRescheduleTask = async taskData => {
  console.log('AlarmRescheduleTask started:', taskData);

  try {
    // Wait a bit for React Native to fully initialize
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Initialize alarm system and reschedule all alarms
    await initializeAlarms();
    console.log('Alarm reschedule task completed successfully');
  } catch (error) {
    console.error('AlarmRescheduleTask error:', error);
  }
};

// Register the task
AppRegistry.registerHeadlessTask(
  'AlarmRescheduleTask',
  () => AlarmRescheduleTask,
);
