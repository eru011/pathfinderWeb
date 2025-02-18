import { LocalNotifications } from '@capacitor/local-notifications';

export const showNotification = async (title, body) => {
  try {
    await LocalNotifications.requestPermissions();
    
    await LocalNotifications.schedule({
      notifications: [
        {
          title: title,
          body: body,
          id: new Date().getTime(),
          schedule: { at: new Date(Date.now()) },
          sound: null,
          attachments: null,
          actionTypeId: "",
          extra: null
        }
      ]
    });
  } catch (error) {
    console.error('Error showing notification:', error);
  }
}; 