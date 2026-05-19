import api from 'api/api';

const PUSH_SUBSCRIPTION_ID_STORAGE_KEY = 'pwa_push_subscription_id';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

export function isPushNotificationSupported() {
  return typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

export function getNotificationPermission() {
  if (!isPushNotificationSupported()) {
    return 'unsupported';
  }

  return Notification.permission;
}

export function requestNotificationPermission() {
  if (!isPushNotificationSupported()) {
    return Promise.resolve('unsupported');
  }

  return Notification.requestPermission();
}

export async function getServiceWorkerRegistration() {
  if (!('serviceWorker' in navigator)) {
    return null;
  }

  return navigator.serviceWorker.ready;
}

export async function getExistingPushSubscription() {
  const registration = await getServiceWorkerRegistration();
  if (!registration?.pushManager) {
    return null;
  }

  return registration.pushManager.getSubscription();
}

function getVapidPublicKey() {
  const key = import.meta.env.VITE_VAPID_PUBLIC_KEY;
  if (!key || typeof key !== 'string') {
    throw new Error('VITE_VAPID_PUBLIC_KEY is not configured');
  }

  return key.trim();
}

function subscriptionToApiPayload(subscription) {
  const json = subscription.toJSON();

  if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
    throw new Error('Invalid push subscription payload');
  }

  return {
    endpoint: json.endpoint,
    keys: {
      p256dh: json.keys.p256dh,
      auth: json.keys.auth
    },
    user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null
  };
}

export async function subscribeToPushNotifications() {
  if (!isPushNotificationSupported()) {
    throw new Error('Push notifications are not supported in this browser');
  }

  const permission = await requestNotificationPermission();
  if (permission !== 'granted') {
    throw new Error(`Notification permission: ${permission}`);
  }

  const registration = await getServiceWorkerRegistration();
  if (!registration?.pushManager) {
    throw new Error('Push manager is not available');
  }

  const existing = await registration.pushManager.getSubscription();
  const subscription =
    existing ??
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(getVapidPublicKey())
    }));

  const response = await api.post('/push-subscriptions', subscriptionToApiPayload(subscription));
  const serverId = response?.data?.data?.id;

  if (serverId && typeof localStorage !== 'undefined') {
    localStorage.setItem(PUSH_SUBSCRIPTION_ID_STORAGE_KEY, serverId);
  }

  return { subscription, server: response?.data };
}

export async function unsubscribeFromPushNotifications() {
  const subscription = await getExistingPushSubscription();

  if (!subscription) {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(PUSH_SUBSCRIPTION_ID_STORAGE_KEY);
    }
    return;
  }

  const storedId = typeof localStorage !== 'undefined' ? localStorage.getItem(PUSH_SUBSCRIPTION_ID_STORAGE_KEY) : null;

  await subscription.unsubscribe();

  if (storedId) {
    try {
      await api.delete(`/push-subscriptions/${storedId}`);
    } catch (error) {
      console.warn('[push] failed to delete server subscription', error);
    }
    localStorage.removeItem(PUSH_SUBSCRIPTION_ID_STORAGE_KEY);
  }
}
