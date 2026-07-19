import messaging from '@react-native-firebase/messaging';
import { api } from './api';

export async function requestUserPermission(userId) {
  try {
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (enabled) {
      console.log('FCM Authorization status:', authStatus);
      
      // Get device token
      const token = await messaging().getToken();
      console.log('Device FCM Token:', token);

      // Upload token to Next.js backend
      if (userId && token) {
        await api.post('/api/auth/push-token', { userId, pushToken: token });
      }
      return token;
    }
  } catch (err) {
    console.warn('FCM registration permission error (mock/placeholder check):', err.message);
  }
  return null;
}

export function registerNotificationListeners(navigation) {
  // Foreground message handler
  const unsubscribeForeground = messaging().onMessage(async remoteMessage => {
    console.log('FCM message arrived in foreground:', remoteMessage);
  });

  // Notification click handler (app in background state)
  const unsubscribeOpened = messaging().onNotificationOpenedApp(remoteMessage => {
    console.log('Notification caused app to open from background:', remoteMessage);
    if (remoteMessage.data?.type === 'advisory' && navigation) {
      navigation.navigate('Announcements');
    }
  });

  // Notification click handler (app in quit state)
  messaging()
    .getInitialNotification()
    .then(remoteMessage => {
      if (remoteMessage) {
        console.log('Notification caused app to open from quit:', remoteMessage);
      }
    });

  return () => {
    unsubscribeForeground();
    unsubscribeOpened();
  };
}
