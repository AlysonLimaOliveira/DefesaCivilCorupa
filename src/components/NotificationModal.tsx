import React, { useEffect, useState } from 'react';
import { db, collection, query, where, orderBy, limit, onSnapshot, doc, updateDoc, writeBatch, getDocs } from '../firebase';
import { Capacitor } from '@capacitor/core';
import { Badge } from '@capawesome/capacitor-badge';
import { useAuth } from '../AuthProvider';
import { X, Bell, MessageSquare, AlertTriangle, CheckCircle, Clock, Check, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToIncident?: (id: string) => void;
  unreadCountFromApp?: number;
}

interface NotificationData {
  id: string;
  title: string;
  message: string;
  createdAt: any;
  read: boolean;
  incidentId?: string;
}

const NotificationModal: React.FC<NotificationModalProps> = ({ isOpen, onClose, onNavigateToIncident, unreadCountFromApp = 0 }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  const [localUnreadCount, setLocalUnreadCount] = useState(0);

  useEffect(() => {
    if (!user || !isOpen) return;

    if (Capacitor.isNativePlatform()) {
      Badge.set({ count: 0 }).catch(console.error);
    }

    // Busca ampliada para encontrar notificações "perdidas"
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid),
      limit(200) // Aumentamos bem o limite para varrer o histórico
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as NotificationData[];

      // Ordenação: Não lidas (ou sem o campo read) no topo, depois por data
      docs.sort((a, b) => {
        const aRead = a.read === true;
        const bRead = b.read === true;
        if (aRead !== bRead) return aRead ? 1 : -1;

        const timeA = a.createdAt?.toMillis?.() || 0;
        const timeB = b.createdAt?.toMillis?.() || 0;
        return timeB - timeA;
      });

      setNotifications(docs);
      setLocalUnreadCount(docs.filter(n => n.read !== true).length);
    }, (error) => {
      console.error("Erro ao carregar notificações:", error);
    });

    return () => unsubscribe();
  }, [user, isOpen]);

  const effectiveUnreadCount = Math.max(unreadCountFromApp, localUnreadCount);

  const markAsRead = async (notif: NotificationData) => {
    if (notif.read) {
      if (notif.incidentId && onNavigateToIncident) {
        onNavigateToIncident(notif.incidentId);
        onClose();
      }
      return;
    }

    try {
      await updateDoc(doc(db, 'notifications', notif.id), { read: true });
      if (notif.incidentId && onNavigateToIncident) {
        onNavigateToIncident(notif.incidentId);
        onClose();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;

    setIsMarkingAll(true);
    try {
      // Busca TODAS as notificações não lidas no servidor, sem limite, para garantir a limpeza
      const q = query(
        collection(db, 'notifications'),
        where('userId', '==', user.uid),
        where('read', '==', false)
      );

      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        // Se a busca filtrada falhar ou estiver vazia, tentamos limpar o que está na lista local
        const batch = writeBatch(db);
        notifications.forEach(n => {
          if (!n.read) batch.update(doc(db, 'notifications', n.id), { read: true });
        });
        await batch.commit();
      } else {
        const batch = writeBatch(db);
        snapshot.docs.forEach(d => {
          batch.update(doc(db, 'notifications', d.id), { read: true });
        });
        await batch.commit();
      }

      // Zera o badge nativo e limpa o estado local
      if (Capacitor.isNativePlatform()) {
        await Badge.set({ count: 0 });
      }
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setLocalUnreadCount(0);

    } catch (e) {
      console.error("Erro crítico ao limpar notificações:", e);
    } finally {
      setIsMarkingAll(false);
    }
  };

  const getIcon = (title: string, read: boolean) => {
    const isEmergency = title.toLowerCase().includes('emergência') || title.toLowerCase().includes('alerta');
    const isStatus = title.toLowerCase().includes('status');

    if (isEmergency) return (
      <div className={`p-2.5 rounded-2xl ${read ? 'bg-red-50 text-red-400' : 'bg-red-500 text-white shadow-lg shadow-red-200 animate-pulse'}`}>
        <AlertTriangle className="w-5 h-5" />
      </div>
    );

    if (isStatus) return (
      <div className={`p-2.5 rounded-2xl ${read ? 'bg-orange-50 text-orange-400' : 'bg-orange-500 text-white shadow-lg shadow-orange-200'}`}>
        <Clock className="w-5 h-5" />
      </div>
    );

    return (
      <div className={`p-2.5 rounded-2xl ${read ? 'bg-blue-50 text-blue-400' : 'bg-primary text-white shadow-lg shadow-primary/20'}`}>
        <MessageSquare className="w-5 h-5" />
      </div>
    );
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[10005] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-md"
          />

          <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="relative w-full max-w-lg bg-gray-50 sm:rounded-[40px] rounded-t-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="bg-white px-8 pt-8 pb-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="bg-primary/10 p-3 rounded-2xl text-primary relative">
                    <Bell className="w-6 h-6" />
                    {effectiveUnreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-danger text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white">
                        {effectiveUnreadCount}
                      </span>
                    )}
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-gray-900 tracking-tight">Notificações</h3>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Central de Alertas Corupá</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 bg-gray-50 hover:bg-gray-100 rounded-full transition-all active:scale-95"
                >
                  <X className="w-6 h-6 text-gray-400" />
                </button>
              </div>

              {effectiveUnreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  disabled={isMarkingAll}
                  className="w-full py-3 bg-orange-500 hover:bg-orange-600 rounded-2xl text-xs font-bold text-white uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg shadow-orange-200 active:scale-[0.98]"
                >
                  {isMarkingAll ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Limpar {effectiveUnreadCount} Notificações (Forçar)
                    </>
                  )}
                </button>
              )}
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar pb-12">
              {notifications.length === 0 ? (
                <div className="py-24 flex flex-col items-center justify-center text-center px-10">
                  <div className="w-24 h-24 bg-white rounded-[32px] shadow-xl shadow-gray-200/50 flex items-center justify-center mb-6">
                    <Bell className="w-10 h-10 text-gray-100" />
                  </div>
                  <h4 className="font-black text-gray-900 text-xl tracking-tight">Tudo em ordem!</h4>
                  <p className="text-gray-400 text-sm mt-2 leading-relaxed font-medium">Você não tem novas notificações no momento. Fique tranquilo, avisaremos se algo mudar.</p>
                </div>
              ) : (
                notifications.map((notif, index) => (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    key={notif.id}
                    onClick={() => markAsRead(notif)}
                    className={`group relative p-5 rounded-[28px] border transition-all cursor-pointer ${
                      notif.read
                        ? 'bg-white/60 border-gray-100 hover:border-gray-200 opacity-70'
                        : 'bg-white border-primary/10 shadow-lg shadow-gray-200/40 border-l-4 border-l-primary'
                    }`}
                  >
                    <div className="flex gap-4">
                      <div className="shrink-0">
                        {getIcon(notif.title, notif.read)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1.5">
                          <h4 className={`text-sm font-black tracking-tight ${notif.read ? 'text-gray-600' : 'text-primary'}`}>
                            {notif.title}
                          </h4>
                          <span className="text-[9px] font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded-lg uppercase whitespace-nowrap">
                            {notif.createdAt?.toDate ? format(notif.createdAt.toDate(), "HH:mm", { locale: ptBR }) : 'Agora'}
                          </span>
                        </div>
                        <p className={`text-sm leading-relaxed ${notif.read ? 'text-gray-400' : 'text-gray-700 font-medium'}`}>
                          {notif.message}
                        </p>

                        <div className="mt-4 flex items-center justify-between">
                          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter flex items-center gap-1.5">
                            <Clock className="w-3 h-3" />
                            {notif.createdAt?.toDate ? format(notif.createdAt.toDate(), "dd 'de' MMMM", { locale: ptBR }) : ''}
                          </span>

                          {notif.incidentId && (
                            <div className={`flex items-center gap-1 text-[10px] font-black uppercase tracking-widest ${notif.read ? 'text-gray-300' : 'text-primary'}`}>
                              Ver detalhes
                              <ChevronRight className="w-3 h-3" />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {/* Bottom Safe Area */}
            <div className="h-6 bg-gray-50 sm:hidden" />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default NotificationModal;
