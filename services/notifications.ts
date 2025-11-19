import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    alert('Failed to get push token for push notification!');
    return;
  }

  if (Platform.OS !== 'web') {
    token = (
      await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId,
      })
    ).data;
  }

  return token;
}

export async function showOTPNotification(otp: string) {
  if (Platform.OS === 'web') {
    // For web, just log to console and show alert
    console.log('🔐 Your OTP Code:', otp);
    alert(`Your OTP Code: ${otp}`);
    return;
  }
  
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Your OTP Code',
      body: `Your verification code is: ${otp}`,
      data: { otp },
      sound: true,
    },
    trigger: null, // Show immediately
  });
}

export function setupNotificationListeners(
  onNotificationReceived: (notification: Notifications.Notification) => void,
  onNotificationResponse: (response: Notifications.NotificationResponse) => void
) {
  const notificationListener = Notifications.addNotificationReceivedListener(
    onNotificationReceived
  );

  const responseListener = Notifications.addNotificationResponseReceivedListener(
    onNotificationResponse
  );

  return () => {
    notificationListener.remove();
    responseListener.remove();
  };
}
