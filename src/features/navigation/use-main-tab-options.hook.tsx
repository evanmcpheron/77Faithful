import type { BottomTabNavigationOptions } from 'expo-router/tabs';
import { SymbolView } from 'expo-symbols';
import { useTheme } from 'tamagui';

export const useMainTabOptions = () => {
  const theme = useTheme();
  const screenOptions: BottomTabNavigationOptions = {
    headerShown: false,
    tabBarActiveTintColor: theme.link.val,
    tabBarInactiveTintColor: theme.textSecondary.val,
    tabBarPosition: 'bottom',
    tabBarStyle: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: theme.surface.val,
      borderTopColor: theme.border.val,
    },
    sceneStyle: { backgroundColor: theme.background.val },
    tabBarLabelPosition: 'below-icon',
    tabBarHideOnKeyboard: false,
  };
  const today: BottomTabNavigationOptions = {
    title: 'Today',
    tabBarIcon: ({ color, size }) => (
      <SymbolView
        name={{ ios: 'sun.max', android: 'today', web: 'today' }}
        tintColor={color}
        size={size}
      />
    ),
  };
  const journey: BottomTabNavigationOptions = {
    title: 'Journey',
    tabBarIcon: ({ color, size }) => (
      <SymbolView
        name={{ ios: 'book', android: 'menu_book', web: 'menu_book' }}
        tintColor={color}
        size={size}
      />
    ),
  };
  const communities: BottomTabNavigationOptions = {
    title: 'Communities',
    tabBarIcon: ({ color, size }) => (
      <SymbolView
        name={{ ios: 'person.3', android: 'groups', web: 'groups' }}
        tintColor={color}
        size={size}
      />
    ),
  };
  const settings: BottomTabNavigationOptions = {
    title: 'Settings',
    tabBarIcon: ({ color, size }) => (
      <SymbolView
        name={{ ios: 'gearshape', android: 'settings', web: 'settings' }}
        tintColor={color}
        size={size}
      />
    ),
  };
  return { screenOptions, today, journey, communities, settings };
};
