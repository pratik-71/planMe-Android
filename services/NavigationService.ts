import {NavigationContainerRef} from '@react-navigation/native';

let navigationRef: NavigationContainerRef<any> | null = null;

export function setNavigationRef(ref: NavigationContainerRef<any> | null) {
  navigationRef = ref;
}

export function navigateToAlarm(slotTitle: string, slotId: string) {
  try {
    if (navigationRef && navigationRef.navigate) {
      // Add delay to ensure navigation is ready
      setTimeout(() => {
        try {
          navigationRef?.navigate('Alarm', {
            slotTitle,
            slotId,
          });
        } catch (navError) {
          // Silent fail - navigation not ready
        }
      }, 100);
    }
  } catch (error: any) {
    // Silent fail
  }
}

export function navigateToViewDay() {
  try {
    if (navigationRef && navigationRef.navigate) {
      const today = new Date().toISOString().slice(0, 10);
      setTimeout(() => {
        try {
          navigationRef?.navigate('ViewDay', {
            dateISO: today,
          });
        } catch (navError) {
          // Silent fail - navigation not ready
        }
      }, 100);
    }
  } catch (error) {
    // Silent fail
  }
}
