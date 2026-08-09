import Constants, { ExecutionEnvironment } from 'expo-constants';
import { api } from './api';
import { navigate } from '../navigation/navigationRef';

// Check if running inside Expo Go where SDK 53+ removed remote push notifications
const isExpoGo = Constants.appOwnership === 'expo' || Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

function getNotificationsModule() {
  if (isExpoGo) return null;
  try {
    return require('expo-notifications');
  } catch (err) {
    console.warn('[FCM] Could not load expo-notifications:', err.message);
    return null;
  }
}

// Set notification handler to determine how notifications are handled when the app is active (foreground)
if (!isExpoGo) {
  try {
    const Notifications = getNotificationsModule();
    if (Notifications?.setNotificationHandler) {
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
        }),
      });
    }
  } catch (err) {
    console.warn('Could not set notification handler:', err);
  }
}

export async function requestUserPermission(userId) {
  if (isExpoGo) {
    console.log('[FCM] Running in Expo Go: Remote push notification tokens are not supported on SDK 53+ in Expo Go. Use a development build (npx expo run:android) for push notifications.');
    return null;
  }

  const Notifications = getNotificationsModule();
  if (!Notifications) return null;

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
  if (isExpoGo) {
    return () => {};
  }

  const Notifications = getNotificationsModule();
  if (!Notifications) return () => {};

  try {
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
  } catch (err) {
    console.warn('Failed to register notification listeners:', err.message);
    return () => {};
  }
}


