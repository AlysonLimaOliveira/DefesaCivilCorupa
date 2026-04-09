import { db, collection, addDoc, serverTimestamp } from '../firebase';
import { notifyAdmins } from './notificationService';

const OFFLINE_QUEUE_KEY = 'offline_incidents_queue';

export interface OfflineIncident {
  id: string;
  data: any;
  timestamp: number;
}

export const saveIncidentOffline = (data: any) => {
  const queue = getOfflineQueue();
  const newIncident: OfflineIncident = {
    id: crypto.randomUUID(),
    data,
    timestamp: Date.now(),
  };
  queue.push(newIncident);
  localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
  return newIncident;
};

export const getOfflineQueue = (): OfflineIncident[] => {
  const stored = localStorage.getItem(OFFLINE_QUEUE_KEY);
  return stored ? JSON.parse(stored) : [];
};

export const clearOfflineQueue = () => {
  localStorage.removeItem(OFFLINE_QUEUE_KEY);
};

export const syncOfflineIncidents = async () => {
  const queue = getOfflineQueue();
  if (queue.length === 0) return;

  console.log(`Sincronizando ${queue.length} ocorrências offline...`);
  
  const remainingQueue: OfflineIncident[] = [];

  for (const incident of queue) {
    try {
      const docRef = await addDoc(collection(db, 'incidents'), {
        ...incident.data,
        createdAt: serverTimestamp(), // Use server timestamp when syncing
        isOfflineSync: true,
        originalOfflineTimestamp: incident.timestamp
      });

      await notifyAdmins(
        'Ocorrência Sincronizada (Offline)',
        `${incident.data.category}: ${incident.data.type} em ${incident.data.city}`,
        docRef.id
      );
      
      console.log(`Ocorrência ${incident.id} sincronizada com sucesso.`);
    } catch (error) {
      console.error(`Erro ao sincronizar ocorrência ${incident.id}:`, error);
      remainingQueue.push(incident);
    }
  }

  localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(remainingQueue));
};

// Initialize listener
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    syncOfflineIncidents();
  });

  // Also try to sync on load if online
  if (navigator.onLine) {
    syncOfflineIncidents();
  }
}
