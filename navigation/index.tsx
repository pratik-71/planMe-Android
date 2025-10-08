import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {useAuthStore} from '../stores/authStore';
import {BackendService} from '../services/BackendService';
import {setNavigationRef} from '../services/NavigationService';
import HomeScreen from '../app/screens/HomeScreen';
import ScheduleDayScreen from '../app/screens/ScheduleDayScreen';
import ViewDayScreen from '../app/screens/ViewDayScreen';
import AlarmScreen from '../app/screens/AlarmScreen';
import WaterBreaksScreen from '../app/screens/WaterBreaksScreen';
import PermissionsScreen from '../app/screens/PermissionsScreen';
import ManageScreen from '../app/screens/ManageScreen';
import AnalyticsScreen from '../app/screens/AnalyticsScreen';
import ProteinTrackerScreen from '../app/screens/ProteinTrackerScreen';
import BucketListScreen from '../app/screens/BucketListScreen';
import MainLayout from '../components/MainLayout';
import {theme} from '../stores/ThemeStore';

export type Route =
  | {name: 'Home'}
  | {name: 'ScheduleDay'; params: {dateISO: string}}
  | {name: 'ViewDay'; params: {dateISO: string}}
  | {name: 'Alarm'; params: {slotTitle: string; slotId: string}}
  | {name: 'WaterBreaks'}
  | {name: 'Permissions'}
  | {name: 'Manage'}
  | {name: 'Analytics'}
  | {name: 'ProteinTracker'}
  | {name: 'BucketList'};

interface SidebarProps {
  showSidebar: boolean;
  setShowSidebar: (show: boolean) => void;
  setRoute: (route: Route) => void;
  signOut: () => void;
  backendUser: any;
  user: any;
}

const Sidebar: React.FC<SidebarProps> = ({
  showSidebar,
  setShowSidebar,
  setRoute,
  signOut,
  backendUser,
  user,
}) => {
  if (!showSidebar) return null;
  return (
    <View style={styles.sidebar}>
      <LinearGradient
        colors={[theme.surface, theme.background, theme.surfaceVariant]}
        style={styles.sidebarContent}
        start={{x: 0, y: 0}}
        end={{x: 0, y: 1}}>
        <View style={styles.sidebarHeader}>
          <View style={styles.sidebarProfileImage}>
            <Text style={styles.sidebarProfileText}>
              {(backendUser?.name || user?.name || user?.email || 'U')
                .charAt(0)
                .toUpperCase()}
            </Text>
          </View>
          <Text style={styles.sidebarUserName}>
            {backendUser?.name || user?.name || user?.email || 'User'}
          </Text>
          <Text style={styles.sidebarUserEmail}>
            {backendUser?.email || user?.email || ''}
          </Text>
          <View style={styles.sidebarStreakContainer}>
            <View style={styles.streakIconContainer}>
              <Text style={styles.streakIconText}>●</Text>
            </View>
            <Text style={styles.sidebarStreakText}>
              {backendUser?.streak || 0} Day Streak
            </Text>
          </View>
        </View>

        <View style={styles.sidebarMenu}>
          <Text style={styles.sidebarMenuTitle}>Navigation</Text>

          <TouchableOpacity
            style={styles.sidebarItem}
            onPress={() => {
              setShowSidebar(false);
              setRoute({name: 'Home'});
            }}>
            <View style={styles.sidebarIconWrapper}>
              <Text style={styles.sidebarIcon}>H</Text>
            </View>
            <View style={styles.sidebarItemContent}>
              <Text style={styles.sidebarItemText}>Home</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.sidebarItem}
            onPress={() => {
              setShowSidebar(false);
              setRoute({name: 'Manage'});
            }}>
            <View style={styles.sidebarIconWrapper}>
              <Text style={styles.sidebarIcon}>M</Text>
            </View>
            <View style={styles.sidebarItemContent}>
              <Text style={styles.sidebarItemText}>Manage</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.sidebarItem}
            onPress={() => {
              setShowSidebar(false);
              setRoute({name: 'Analytics'});
            }}>
            <View style={styles.sidebarIconWrapper}>
              <Text style={styles.sidebarIcon}>A</Text>
            </View>
            <View style={styles.sidebarItemContent}>
              <Text style={styles.sidebarItemText}>Analytics</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.sidebarDivider} />

          <TouchableOpacity
            style={[styles.sidebarItem, styles.sidebarSignOut]}
            onPress={() => {
              setShowSidebar(false);
              signOut();
            }}>
            <View style={styles.sidebarIconWrapper}>
              <Text style={styles.sidebarIcon}>S</Text>
            </View>
            <View style={styles.sidebarItemContent}>
              <Text style={[styles.sidebarItemText, styles.signOutText]}>
                Sign Out
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </LinearGradient>
      <TouchableOpacity
        style={styles.sidebarOverlay}
        onPress={() => setShowSidebar(false)}
      />
    </View>
  );
};

type NavigatorProps = {initialAlarm?: {slotId: string; slotTitle: string}};

const Navigator: React.FC<NavigatorProps> = ({initialAlarm: _initialAlarm}) => {
  // Check if user needs permissions screen (first time)
  const [_hasSeenPermissions, setHasSeenPermissions] = useState(false);
  const [route, setRoute] = useState<Route>({name: 'Permissions'});
  const [showSidebar, setShowSidebar] = useState(false);
  const [backendUser, setBackendUser] = useState<any>(null);
  const [isLoadingBackend, setIsLoadingBackend] = useState(true);
  const user = useAuthStore(s => s.user);
  const signOut = useAuthStore(s => s.signOut);
  const todayISO = new Date().toISOString().slice(0, 10);

  // Check if user has already seen permissions on app start
  useEffect(() => {
    const checkPermissionsStatus = async () => {
      const AsyncStorage =
        require('@react-native-async-storage/async-storage').default;
      const seen = await AsyncStorage.getItem('@planme_permissions_seen');
      if (seen === 'true') {
        setHasSeenPermissions(true);
        setRoute({name: 'Home'});
      }
    };
    checkPermissionsStatus();
  }, []);

  // Set up navigation reference for NavigationService
  useEffect(() => {
    const navigationRef = {
      navigate: (screenName: string, params?: any) => {
        if (screenName === 'Alarm') {
          setRoute({name: 'Alarm', params: params});
        } else if (screenName === 'ViewDay') {
          setRoute({name: 'ViewDay', params: params});
        } else if (screenName === 'WaterBreaks') {
          setRoute({name: 'WaterBreaks'});
        }
      },
    };
    setNavigationRef(navigationRef as any);
  }, []);

  // Fetch user from backend on app open - with safety checks
  useEffect(() => {
    const fetchUserFromBackend = async () => {
      if (user?.id && user?.email) {
        try {
          setIsLoadingBackend(true);
          // Add delay to prevent startup crashes
          await new Promise(resolve => setTimeout(resolve, 1000));
          const response = await BackendService.checkUser(
            user.email,
            user.id,
            '',
          );
          if (response.success && response.user) {
            setBackendUser(response.user);
          }
        } catch (error) {
          console.error('Error fetching user from backend:', error);
          // Don't crash the app if backend call fails
        } finally {
          setIsLoadingBackend(false);
        }
      } else {
        setIsLoadingBackend(false);
      }
    };

    // Delay backend call to prevent startup crashes
    setTimeout(() => {
      fetchUserFromBackend();
    }, 2000);
  }, [user]);

  // Show loading screen while fetching backend data
  if (isLoadingBackend) {
    return (
      <LinearGradient
        colors={[theme.background, theme.surface, theme.surfaceVariant]}
        style={styles.loadingContainer}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}>
        <View style={styles.loadingContent}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </LinearGradient>
    );
  }

  if (route.name === 'ScheduleDay') {
    return (
      <View style={styles.container}>
        <MainLayout
          showSidebar={showSidebar}
          setShowSidebar={setShowSidebar}
          backendUser={backendUser}
          user={user}>
          <ScheduleDayScreen
            dateISO={route.params.dateISO}
            onDone={() => setRoute({name: 'Home'})}
          />
        </MainLayout>
        <Sidebar
          showSidebar={showSidebar}
          setShowSidebar={setShowSidebar}
          setRoute={setRoute}
          signOut={signOut}
          backendUser={backendUser}
          user={user}
        />
      </View>
    );
  }
  if (route.name === 'ViewDay') {
    return (
      <View style={styles.container}>
        <MainLayout
          showSidebar={showSidebar}
          setShowSidebar={setShowSidebar}
          backendUser={backendUser}
          user={user}>
          <ViewDayScreen
            dateISO={route.params.dateISO}
            onBack={() => setRoute({name: 'Home'})}
          />
        </MainLayout>
        <Sidebar
          showSidebar={showSidebar}
          setShowSidebar={setShowSidebar}
          setRoute={setRoute}
          signOut={signOut}
          backendUser={backendUser}
          user={user}
        />
      </View>
    );
  }
  if (route.name === 'Permissions') {
    return (
      <PermissionsScreen
        onComplete={async () => {
          const AsyncStorage =
            require('@react-native-async-storage/async-storage').default;
          await AsyncStorage.setItem('@planme_permissions_seen', 'true');
          setHasSeenPermissions(true);
          setRoute({name: 'Home'});
        }}
      />
    );
  }

  if (route.name === 'WaterBreaks') {
    return (
      <View style={styles.container}>
        <MainLayout
          showSidebar={showSidebar}
          setShowSidebar={setShowSidebar}
          backendUser={backendUser}
          user={user}>
          <WaterBreaksScreen onBack={() => setRoute({name: 'Home'})} />
        </MainLayout>
        <Sidebar
          showSidebar={showSidebar}
          setShowSidebar={setShowSidebar}
          setRoute={setRoute}
          signOut={signOut}
          backendUser={backendUser}
          user={user}
        />
      </View>
    );
  }

  if (route.name === 'Manage') {
    return (
      <View style={styles.container}>
        <MainLayout
          showSidebar={showSidebar}
          setShowSidebar={setShowSidebar}
          backendUser={backendUser}
          user={user}>
          <ManageScreen onBack={() => setRoute({name: 'Home'})} />
        </MainLayout>
        <Sidebar
          showSidebar={showSidebar}
          setShowSidebar={setShowSidebar}
          setRoute={setRoute}
          signOut={signOut}
          backendUser={backendUser}
          user={user}
        />
      </View>
    );
  }

  if (route.name === 'ProteinTracker') {
    return (
      <View style={styles.container}>
        <MainLayout
          showSidebar={showSidebar}
          setShowSidebar={setShowSidebar}
          backendUser={backendUser}
          user={user}>
          <ProteinTrackerScreen
            onBack={() => setRoute({name: 'Home'})}
            backendUser={backendUser}
          />
        </MainLayout>
        <Sidebar
          showSidebar={showSidebar}
          setShowSidebar={setShowSidebar}
          setRoute={setRoute}
          signOut={signOut}
          backendUser={backendUser}
          user={user}
        />
      </View>
    );
  }

  if (route.name === 'Analytics') {
    return (
      <View style={styles.container}>
        <MainLayout
          showSidebar={showSidebar}
          setShowSidebar={setShowSidebar}
          backendUser={backendUser}
          user={user}>
          <AnalyticsScreen onBack={() => setRoute({name: 'Home'})} />
        </MainLayout>
        <Sidebar
          showSidebar={showSidebar}
          setShowSidebar={setShowSidebar}
          setRoute={setRoute}
          signOut={signOut}
          backendUser={backendUser}
          user={user}
        />
      </View>
    );
  }

  if (route.name === 'BucketList') {
    return (
      <View style={styles.container}>
        <MainLayout
          showSidebar={showSidebar}
          setShowSidebar={setShowSidebar}
          backendUser={backendUser}
          user={user}>
          <BucketListScreen
            onBack={() => setRoute({name: 'Home'})}
            backendUser={backendUser}
          />
        </MainLayout>
        <Sidebar
          showSidebar={showSidebar}
          setShowSidebar={setShowSidebar}
          setRoute={setRoute}
          signOut={signOut}
          backendUser={backendUser}
          user={user}
        />
      </View>
    );
  }

  if (route.name === 'Alarm') {
    try {
      return (
        <AlarmScreen
          route={{
            params: {
              slotTitle: route.params?.slotTitle || 'Alarm',
              slotId: route.params?.slotId || 'unknown',
            },
          }}
        />
      );
    } catch (error) {
      // Fallback to home screen if AlarmScreen fails
      return (
        <View style={styles.container}>
          <MainLayout
            showSidebar={showSidebar}
            setShowSidebar={setShowSidebar}
            backendUser={backendUser}
            user={user}>
            <HomeScreen
              onScheduleDay={() =>
                setRoute({name: 'ScheduleDay', params: {dateISO: todayISO}})
              }
              onViewDay={() =>
                setRoute({name: 'ViewDay', params: {dateISO: todayISO}})
              }
              onOpenWaterBreaks={() => setRoute({name: 'WaterBreaks'})}
              onManage={() => setRoute({name: 'Manage'})}
              onOpenBucketList={() => setRoute({name: 'BucketList'})}
            />
          </MainLayout>
        </View>
      );
    }
  }
  return (
    <View style={styles.container}>
      <MainLayout
        showSidebar={showSidebar}
        setShowSidebar={setShowSidebar}
        backendUser={backendUser}
        user={user}>
        <HomeScreen
          onScheduleDay={() =>
            setRoute({name: 'ScheduleDay', params: {dateISO: todayISO}})
          }
          onViewDay={() =>
            setRoute({name: 'ViewDay', params: {dateISO: todayISO}})
          }
          onOpenWaterBreaks={() => setRoute({name: 'WaterBreaks'})}
          onManage={() => setRoute({name: 'Manage'})}
          onOpenProteinTracker={() => setRoute({name: 'ProteinTracker'})}
          onOpenBucketList={() => setRoute({name: 'BucketList'})}
        />
      </MainLayout>
      <Sidebar
        showSidebar={showSidebar}
        setShowSidebar={setShowSidebar}
        setRoute={setRoute}
        signOut={signOut}
        backendUser={backendUser}
        user={user}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    // Ensure all screens render below the sticky header
    paddingTop: 84,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    paddingTop: 20, // Further reduced padding to move navigation higher
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    shadowColor: theme.shadow,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  headerButton: {
    padding: 8,
  },
  hamburgerIcon: {
    fontSize: 20,
    color: theme.textPrimary,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.textInverse,
    textShadowColor: theme.shadow,
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 2,
  },
  profileButton: {
    padding: 8,
  },
  profileImageContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.shadow,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  profileImageText: {
    color: theme.textInverse,
    fontSize: 14,
    fontWeight: '700',
  },
  sidebar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  sidebarContent: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 280,
    height: '100%',
    paddingTop: 60,
    paddingHorizontal: 20,
    shadowColor: theme.shadow,
    shadowOffset: {width: 4, height: 0},
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 16,
  },
  sidebarHeader: {
    alignItems: 'center',
    marginBottom: 32,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.borderLight,
  },
  sidebarProfileImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: theme.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: theme.primary,
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  sidebarProfileText: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '700',
  },
  sidebarUserName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.textPrimary,
    textAlign: 'center',
    marginBottom: 4,
  },
  sidebarUserEmail: {
    fontSize: 12,
    color: theme.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
  },
  sidebarStreakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surfaceVariant,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.borderLight,
  },
  streakIconContainer: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.primary,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakIconText: {
    fontSize: 4,
    color: '#FFFFFF',
  },
  sidebarStreakText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.textSecondary,
  },
  sidebarMenu: {
    flex: 1,
    paddingTop: 20,
  },
  sidebarOverlay: {
    position: 'absolute',
    top: 0,
    left: 280,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sidebarMenuTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.textTertiary,
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  sidebarItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 6,
    backgroundColor: 'transparent',
  },
  sidebarItemContent: {
    flex: 1,
    marginLeft: 12,
  },
  sidebarItemText: {
    fontSize: 15,
    color: theme.textPrimary,
    fontWeight: '500',
  },
  sidebarIconWrapper: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.surfaceVariant,
    borderRadius: 6,
  },
  sidebarIcon: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.textPrimary,
  },
  sidebarDivider: {
    height: 1,
    backgroundColor: theme.borderLight,
    marginVertical: 16,
  },
  sidebarSignOut: {
    backgroundColor: 'rgba(244, 67, 54, 0.05)',
  },
  signOutText: {
    color: theme.error,
    fontWeight: '600',
  },
  menuIcon: {
    fontSize: 28,
    color: theme.textInverse,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
  },
  loadingContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: theme.textPrimary,
    fontWeight: '600',
    marginTop: 16,
  },
});

export default Navigator;
