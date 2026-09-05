import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { supabase } from './supabase';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerForPushNotifications() {
  if (!Device.isDevice) {
    console.log('Push notifications only work on a real device!');
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Permission not granted for push notifications');
    return null;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  const token = (await Notifications.getExpoPushTokenAsync()).data;

  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    await supabase
      .from('profiles')
      .update({ push_token: token })
      .eq('id', user.id);
  }

  return token;
}

export async function sendLikeNotification(catchOwnerId: string, likerUsername: string) {
  const { data } = await supabase
    .from('profiles')
    .select('push_token')
    .eq('id', catchOwnerId)
    .single();

  if (!data?.push_token) return;

  await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to: data.push_token,
      title: '❤️ New Like!',
      body: `${likerUsername} liked your catch!`,
      sound: 'default',
    }),
  });
}

export async function sendFollowNotification(followedUserId: string, followerUsername: string) {
  const { data } = await supabase
    .from('profiles')
    .select('push_token')
    .eq('id', followedUserId)
    .single();

  if (!data?.push_token) return;

  await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to: data.push_token,
      title: '🎣 New Follower!',
      body: `${followerUsername} started following you!`,
      sound: 'default',
    }),
  });
}

export async function sendCommentNotification(catchOwnerId: string, commenterUsername: string) {
  const { data } = await supabase
    .from('profiles')
    .select('push_token')
    .eq('id', catchOwnerId)
    .single();

  if (!data?.push_token) return;

  await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to: data.push_token,
      title: '💬 New Comment!',
      body: `${commenterUsername} commented on your catch!`,
      sound: 'default',
    }),
  });
}
