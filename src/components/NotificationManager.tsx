import React, { useEffect, useRef } from 'react';
import { db, collection, query, orderBy, onSnapshot, limit, where, doc, updateDoc, serverTimestamp } from '../firebase';
import { useAuth } from '../AuthProvider';
import { Bell, BellOff } from 'lucide-react';
import { cn } from '../lib/utils';
import { PushNotifications } from '@capacitor/push-notifications';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Badge } from '@capawesome/capacitor-badge';
import { Capacitor } from '@capacitor/core';

interface NotificationData {
  id: string;
  userId: string;
  title: string;
  message: string;
  incidentId: string;
  read: boolean;
  createdAt: any;
}

const NotificationManager: React.FC = () => {
  const { user } = useAuth();
  const isInitialLoad = useRef(true);
  const lastToken = useRef<string | null>(null);
  const [permission, setPermission] = React.useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );
  const [isMuted, setIsMuted] = React.useState(() => {
    const saved = localStorage.getItem('notifications_muted');
    return saved === 'true';
  });

  useEffect(() => {
    localStorage.setItem('notifications_muted', isMuted.toString());
  }, [isMuted]);

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      setupNativeNotifications();
    }
  }, []);

  // Sincroniza o token se ele já foi recebido mas o usuário ainda não estava logado
  useEffect(() => {
    if (user?.uid && lastToken.current) {
      updateUserToken(user.uid, lastToken.current);
    }
  }, [user]);

  const updateUserToken = async (uid: string, token: string) => {
    try {
      await updateDoc(doc(db, 'users', uid), {
        fcmToken: token,
        lastTokenUpdate: serverTimestamp()
      });
      console.log('Token FCM sincronizado com sucesso');
    } catch (e) {
      console.error('Erro ao salvar token no Firestore:', e);
    }
  };

  const setupNativeNotifications = async () => {
    let permStatus = await PushNotifications.checkPermissions();

    if (permStatus.receive === 'prompt') {
      permStatus = await PushNotifications.requestPermissions();
    }

    if (permStatus.receive !== 'granted') {
      console.warn('Permissão de notificação negada no nativo');
      return;
    }

    try {
      await PushNotifications.register();
    } catch (e) {
      console.error('Falha ao registrar para notificações push:', e);
      return;
    }

    // Create Notification Channel for Android (Heads-up pop-up)
    if (Capacitor.getPlatform() === 'android') {
      try {
        await PushNotifications.createChannel({
          id: 'alerts',
          name: 'Alertas Defesa Civil',
          description: 'Notificações importantes de emergência',
          importance: 5, // High importance for heads-up
          visibility: 1,
          vibration: true,
        });
      } catch (e) {
        console.error('Erro ao criar canal de notificação:', e);
      }
    }

    PushNotifications.addListener('registration', async (token) => {
      console.log('Push registration success, token: ' + token.value);
      lastToken.current = token.value;
      if (user?.uid) {
        updateUserToken(user.uid, token.value);
      }
    });

    PushNotifications.addListener('pushNotificationReceived', async (notification) => {
      console.log('Push received: ', notification);
      try {
        const { count } = await Badge.get();
        await Badge.set({ count: count + 1 });
      } catch (e) {
        console.error('Erro ao atualizar badge:', e);
      }
    });
  };

  useEffect(() => {
    if (!user) return;

    if (!Capacitor.isNativePlatform() && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(p => setPermission(p));
    }

    const q = query(
      collection(db, 'notifications'), 
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc'), 
      limit(5)
    );
    
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      if (isInitialLoad.current) {
        isInitialLoad.current = false;
        // Reset badge on load
        if (Capacitor.isNativePlatform()) {
          await Badge.set({ count: 0 });
        }
        return;
      }

      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          const newNotification = { id: change.doc.id, ...change.doc.data() } as NotificationData;
          if (Capacitor.isNativePlatform()) {
            sendNativeLocalNotification(newNotification);
          } else {
            sendBrowserNotification(newNotification);
          }
        }
      });
    }, (error) => {
      console.error("Notification listener error:", error);
    });

    return () => unsubscribe();
  }, [user]);

  const sendNativeLocalNotification = async (notif: NotificationData) => {
    if (isMuted) return;

    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            title: notif.title,
            body: notif.message,
            id: Math.floor(Math.random() * 10000),
            extra: {
              incidentId: notif.incidentId
            },
            schedule: { at: new Date(Date.now() + 100) },
            channelId: 'alerts',
            smallIcon: 'ic_stat_name', // Usando o ícone que realmente existe no Android
            largeIcon: 'res://ic_launcher', // Ícone grande que aparece na notificação
          }
        ]
      });

      // Increment Badge
      const { count } = await Badge.get();
      await Badge.set({ count: count + 1 });
    } catch (e) {
      console.error('Erro ao enviar notificação local:', e);
    }
  };

  const sendBrowserNotification = (notif: NotificationData) => {
    if (!('Notification' in window) || isMuted) return;

    if (Notification.permission === 'granted') {
      const browserNotif = new Notification(notif.title, {
        body: notif.message,
        icon: '/favicon.ico',
      });

      browserNotif.onclick = () => {
        window.focus();
      };

      try {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3');
        audio.play();
      } catch (e) {}
    }
  };

  const requestPermission = () => {
    if (Capacitor.isNativePlatform()) {
      setupNativeNotifications();
    } else if ('Notification' in window) {
      Notification.requestPermission().then(p => {
        setPermission(p);
      });
    }
  };

  return null;
};

export default NotificationManager;
