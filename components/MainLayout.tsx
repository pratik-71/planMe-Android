import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {theme} from '../stores/ThemeStore';

interface MainLayoutProps {
  children: React.ReactNode;
  backendUser: any;
  user: any;
  showSidebar: boolean;
  setShowSidebar: (show: boolean) => void;
}

export default function MainLayout({
  children,
  backendUser,
  user: _user,
  showSidebar,
  setShowSidebar,
}: MainLayoutProps) {
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[theme.primary, theme.accent]}
        style={styles.header}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 0}}>
        <StatusBar
          barStyle="light-content"
          backgroundColor="transparent"
          translucent
        />
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => setShowSidebar(!showSidebar)}>
          <Text style={styles.menuIcon}>≡</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>PlanMe</Text>
        <View style={styles.streakContainer}>
          <LinearGradient
            colors={[theme.streakStart, theme.streakEnd]}
            style={styles.streakBadge}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}>
            <Text style={styles.streakIcon}>🔥</Text>
            <Text style={styles.streakText}>{backendUser?.streak || 0}</Text>
          </LinearGradient>
        </View>
      </LinearGradient>
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    paddingTop: 20,
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
  content: {
    flex: 1,
    paddingTop: 84,
  },
  headerButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.textInverse,
    textShadowColor: theme.shadow,
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 2,
  },
  streakContainer: {
    paddingHorizontal: 4,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    shadowColor: theme.streakStart,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  streakIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  streakText: {
    color: theme.textInverse,
    fontSize: 16,
    fontWeight: '700',
  },
  menuIcon: {
    fontSize: 28,
    color: theme.textInverse,
    fontWeight: 'bold',
  },
});
