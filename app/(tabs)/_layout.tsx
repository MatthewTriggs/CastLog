import { Tabs } from 'expo-router';
import { useEffect } from 'react';
import { Platform } from 'react-native';

export default function TabLayout() {
  useEffect(() => {
    if (Platform.OS !== 'web') {
      import('../../lib/notifications').then(({ registerForPushNotifications }) => {
        registerForPushNotifications();
      });
    }
  }, []);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0d1b14',
          borderTopColor: '#1e3028',
          height: 80,
          paddingBottom: 20,
        },
        tabBarActiveTintColor: '#e8a830',
        tabBarInactiveTintColor: '#8a9490',
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          textTransform: 'uppercase',
          letterSpacing: 0.5,
        },
      }}>
      <Tabs.Screen name="index" options={{ title: 'Feed', tabBarIcon: ({ color }) => <TabIcon name="home" color={color} /> }} />
      <Tabs.Screen name="explore" options={{ title: 'Explore', tabBarIcon: ({ color }) => <TabIcon name="search" color={color} /> }} />
      <Tabs.Screen name="leaderboard" options={{ title: 'Ranks', tabBarIcon: ({ color }) => <TabIcon name="trophy" color={color} /> }} />
      <Tabs.Screen name="../modal" options={{ href: null }} />
      <Tabs.Screen name="wiki" options={{ title: 'Wiki', tabBarIcon: ({ color }) => <TabIcon name="book" color={color} /> }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: ({ color }) => <TabIcon name="person" color={color} /> }} />
    </Tabs>
  );
}

function TabIcon({ name, color }: { name: string; color: string }) {
  const icons: Record<string, string> = {
    home: '🏠', search: '🔍', trophy: '🏆', book: '📖', person: '👤'
  };
  return <>{icons[name]}</>;
}