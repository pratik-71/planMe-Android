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
import MainLayout from '../components/MainLayout';
import {theme} from '../stores/ThemeStore';

export type Route =
  | {name: 'Home'}
  | {name: 'ScheduleDay'; params: {dateISO: string}}
  | {name: 'ViewDay'; params: {dateISO: string}}
  | {name: 'Alarm'; params: {slotTitle: string; slotId: string}}
  | {name: 'WaterBreaks'};

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
        colors={[theme.background, theme.surface, theme.primaryLight]}
        style={styles.sidebarContent}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}>
        <View style={styles.sidebarHeader}>
          <LinearGradient
            colors={[theme.accent, theme.primary]}
            style={styles.sidebarProfileImage}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}>
            <Text style={styles.sidebarProfileText}>
              {(backendUser?.name || user?.name || user?.email || 'U')
                .charAt(0)
                .toUpperCase()}
            </Text>
          </LinearGradient>
          <Text style={styles.sidebarUserName}>
            {backendUser?.name || user?.name || user?.email || 'User'}
          </Text>
        </View>

        <View style={styles.sidebarMenu}>
          <TouchableOpacity
            style={styles.sidebarItem}
            onPress={() => {
              setShowSidebar(false);
              setRoute({name: 'Home'});
            }}>
            <View style={styles.sidebarIconWrapper}>
              <Text style={styles.sidebarIcon}>⌂</Text>
            </View>
            <Text style={styles.sidebarItemText}>Home</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.sidebarItem}
            onPress={() => {
              setShowSidebar(false);
              signOut();
            }}>
            <View style={styles.sidebarIconWrapper}>
              <Text style={styles.sidebarIcon}>↪</Text>
            </View>
            <Text style={styles.sidebarItemText}>Sign Out</Text>
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

const Navigator: React.FC<NavigatorProps> = ({initialAlarm}) => {
  // Always start at Home; do not auto-open Alarm on launch
  const [route, setRoute] = useState<Route>({name: 'Home'});
  const [showSidebar, setShowSidebar] = useState(false);
  const [backendUser, setBackendUser] = useState<any>(null);
  const [isLoadingBackend, setIsLoadingBackend] = useState(true);
  const user = useAuthStore(s => s.user);
  const signOut = useAuthStore(s => s.signOut);
  const todayISO = new Date().toISOString().slice(0, 10);

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
    width: 300,
    height: '100%',
    paddingTop: 50,
    paddingHorizontal: 24,
    shadowColor: theme.shadow,
    shadowOffset: {width: 4, height: 0},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 12,
  },
  sidebarHeader: {
    alignItems: 'center',
    marginBottom: 40,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.2)',
  },
  sidebarProfileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: theme.shadow,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  sidebarProfileText: {
    color: theme.textInverse,
    fontSize: 32,
    fontWeight: '700',
  },
  sidebarUserName: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.textPrimary,
    textAlign: 'center',
  },
  sidebarMenu: {
    flex: 1,
    paddingTop: 20,
  },
  sidebarOverlay: {
    position: 'absolute',
    top: 0,
    left: 300,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  sidebarItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: 'rgba(0,188,212,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0,188,212,0.2)',
    shadowColor: theme.shadow,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sidebarItemText: {
    fontSize: 18,
    color: theme.primary,
    marginLeft: 16,
    fontWeight: '600',
  },
  sidebarIconWrapper: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,188,212,0.15)',
    borderRadius: 8,
  },
  menuIcon: {
    fontSize: 28,
    color: theme.textInverse,
    fontWeight: 'bold',
  },
  sidebarIcon: {
    fontSize: 18,
    color: theme.primary,
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
