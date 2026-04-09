import React, { useEffect, useRef } from 'react';
import { db, collection, query, orderBy, onSnapshot, limit, where } from '../firebase';
import { useAuth } from '../AuthProvider';
import { Bell, BellOff } from 'lucide-react';
import { cn } from '../lib/utils';

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
    if (!user) return;

    // Request permission on mount if default
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(p => setPermission(p));
    }

    const q = query(
      collection(db, 'notifications'), 
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc'), 
      limit(5)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (isInitialLoad.current) {
        isInitialLoad.current = false;
        return;
      }

      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          const newNotification = { id: change.doc.id, ...change.doc.data() } as NotificationData;
          sendBrowserNotification(newNotification);
        }
      });
    }, (error) => {
      console.error("Notification listener error:", error);
    });

    return () => unsubscribe();
  }, [user]);

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

      // Play a sound
      try {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3');
        audio.play();
      } catch (e) {
        console.log("Audio play failed", e);
      }
    }
  };

  const requestPermission = () => {
    if ('Notification' in window) {
      Notification.requestPermission().then(p => {
        setPermission(p);
        if (p === 'granted') {
          new Notification('Notificações Ativadas', {
            body: 'Você receberá alertas sobre novos incidentes em tempo real.',
          });
        } else if (p === 'denied') {
          console.warn("As notificações foram bloqueadas pelo usuário.");
        }
      }).catch(err => {
        console.error("Erro ao solicitar permissão de notificação:", err);
      });
    }
  };

  if (!('Notification' in window)) return null;

  return (
    <div className="fixed bottom-24 right-8 z-[1000]">
      {permission !== 'granted' && (
        <button
          onClick={requestPermission}
          className="bg-warning text-white p-3 rounded-full shadow-2xl hover:scale-110 transition-transform flex items-center gap-2 group"
          title="Ativar Notificações"
        >
          <BellOff className="w-5 h-5" />
          <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-500 text-xs font-bold whitespace-nowrap">
            Ativar Alertas
          </span>
        </button>
      )}
      {permission === 'granted' && (
        <button
          onClick={() => setIsMuted(!isMuted)}
          className={cn(
            "p-3 rounded-full shadow-2xl flex items-center gap-2 group transition-all duration-300 hover:scale-110",
            isMuted ? "bg-gray-500 text-white" : "bg-success text-white"
          )}
          title={isMuted ? "Ativar Alertas" : "Silenciar Alertas"}
        >
          {isMuted ? <BellOff className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
          <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-500 text-xs font-bold whitespace-nowrap">
            {isMuted ? "Alertas Silenciados" : "Alertas Ativos"}
          </span>
        </button>
      )}
    </div>
  );
};

export default NotificationManager;
