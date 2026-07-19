import * as Notifications from 'expo-notifications';
import { api } from './api';
import { navigate } from '../navigation/navigationRef';

// Set notification handler to determine how notifications are handled when the app is active (foreground)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function requestUserPermission(userId) {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('Notification permissions denied.');
      return null;
    }

    // Get the FCM Device token (on Android this is the raw firebase push token)
    // NOTE: For Expo SDK, we fetch the native device push token to register with standard FCM v1 backend
    const tokenData = await Notifications.getDevicePushTokenAsync();
    const token = tokenData.data;
    console.log('Device Push Token (FCM):', token);

    if (userId && token) {
      await api.post('/api/auth/push-token', { userId, pushToken: token });
    }
    return token;
  } catch (err) {
    console.warn('Permission/Token registration failed (graceful simulation):', err.message);
  }
  return null;
}

export function registerNotificationListeners() {
  // Foreground notification listener
  const notificationListener = Notifications.addNotificationReceivedListener(notification => {
    console.log('Foreground notification received:', notification);
  });

  // Response listener (when notification is clicked by user)
  const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
    console.log('Notification clicked by user:', response);
    const data = response.notification.request.content.data;
    if (data?.type === 'advisory') {
      navigate('Announcements');
    }
  });

  return () => {
    notificationListener.remove();
    responseListener.remove();
  };
}
