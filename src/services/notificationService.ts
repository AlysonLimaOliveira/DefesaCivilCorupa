import { db, collection, addDoc, getDocs, query, where, serverTimestamp } from '../firebase';

export const notifyAdmins = async (title: string, message: string, incidentId: string) => {
  try {
    // Find all admins
    const adminsQuery = query(collection(db, 'users'), where('role', '==', 'admin'));
    const adminsSnapshot = await getDocs(adminsQuery);
    
    const notifications = adminsSnapshot.docs.map(adminDoc => ({
      userId: adminDoc.id,
      title,
      message,
      incidentId,
      read: false,
      createdAt: serverTimestamp(),
    }));

    // Create notifications for each admin
    await Promise.all(notifications.map(notif => addDoc(collection(db, 'notifications'), notif)));
  } catch (error) {
    console.error("Error notifying admins:", error);
  }
};

export const notifyUser = async (userId: string, title: string, message: string, incidentId: string) => {
  try {
    await addDoc(collection(db, 'notifications'), {
      userId,
      title,
      message,
      incidentId,
      read: false,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error notifying user:", error);
  }
};
