import React, { useEffect, useState } from 'react';
import { db, collection, query, where, orderBy, limit, onSnapshot, doc, updateDoc } from '../firebase';
import { useAuth } from '../AuthProvider';
import { X, Bell, MessageSquare, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NotificationData {
  id: string;
  title: string;
  message: string;
  createdAt: any;
  read: boolean;
  incidentId?: string;
}

const NotificationModal: React.FC<NotificationModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationData[]>([]);

  useEffect(() => {
    if (!user || !isOpen) return;

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(20)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as NotificationData[];
      setNotifications(docs);
    });

    return () => unsubscribe();
  }, [user, isOpen]);

  const markAsRead = async (id: string) => {
    try {
      await updateDoc(doc(db, 'notifications', id), { read: true });
    } catch (e) {
      console.error(e);
    }
  };

  const getIcon = (title: string) => {
    if (title.includes('Status')) return <Clock className="w-5 h-5 text-warning" />;
    if (title.includes('Alerta')) return <AlertTriangle className="w-5 h-5 text-danger" />;
    return <MessageSquare className="w-5 h-5 text-primary" />;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[10005] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            className="relative w-full max-w-lg bg-white sm:rounded-[32px] rounded-t-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 p-2 rounded-xl text-primary">
                  <Bell className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Notificações</h3>
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-widest">Central de Alertas</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar pb-10">
              {notifications.length === 0 ? (
                <div className="py-20 flex flex-col items-center justify-center text-center px-6">
                  <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                    <Bell className="w-10 h-10 text-gray-200" />
                  </div>
                  <h4 className="font-bold text-gray-900 text-lg">Nenhuma notificação</h4>
                  <p className="text-gray-400 text-sm mt-1">Você está em dia com todos os seus alertas.</p>
                </div>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    onClick={() => markAsRead(notif.id)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                      notif.read ? 'bg-white border-gray-100' : 'bg-primary/5 border-primary/10 shadow-sm'
                    }`}
                  >
                    <div className="flex gap-4">
                      <div className={`p-2 rounded-xl shrink-0 h-fit ${notif.read ? 'bg-gray-50' : 'bg-white shadow-sm'}`}>
                        {getIcon(notif.title)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className={`font-bold text-sm truncate ${notif.read ? 'text-gray-700' : 'text-primary'}`}>
                            {notif.title}
                          </h4>
                          {!notif.read && (
                            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                          )}
                        </div>
                        <p className={`text-sm leading-relaxed mb-2 ${notif.read ? 'text-gray-500' : 'text-gray-700 font-medium'}`}>
                          {notif.message}
                        </p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">
                          {notif.createdAt?.toDate ? format(notif.createdAt.toDate(), "dd MMM, HH:mm", { locale: ptBR }) : 'Agora'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default NotificationModal;
