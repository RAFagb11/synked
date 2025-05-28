import React, { createContext, useState, useContext, useEffect } from 'react';
import { query, where, onSnapshot, addDoc, Timestamp, orderBy, updateDoc, doc, writeBatch } from 'firebase/firestore';
import { notificationsRef, db } from '../firebase';
import { AuthContext } from './AuthContext';

export const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const { currentUser } = useContext(AuthContext);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastNotificationTime, setLastNotificationTime] = useState(null);

  useEffect(() => {
    if (!currentUser) return;

    // Subscribe to notifications for the current user
    const notificationsQuery = query(
      notificationsRef,
      where('userId', '==', currentUser.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
      const notificationsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Check for new notifications
      const latestNotification = notificationsData[0];
      if (latestNotification && (!lastNotificationTime || 
          latestNotification.createdAt.seconds > lastNotificationTime)) {
        setLastNotificationTime(latestNotification.createdAt.seconds);
        // Play notification sound if it's a new notification
        if (lastNotificationTime) {
          playNotificationSound();
        }
      }
      
      setNotifications(notificationsData);
      setUnreadCount(notificationsData.filter(n => !n.read).length);
    });

    return () => unsubscribe();
  }, [currentUser, lastNotificationTime]);

  const playNotificationSound = () => {
    const audio = new Audio('/notification.mp3'); // You'll need to add this sound file
    audio.play().catch(error => console.log('Error playing notification sound:', error));
  };

  const createNotification = async (userId, title, message, type, link = '') => {
    try {
      await addDoc(notificationsRef, {
        userId,
        title,
        message,
        type, // 'assignment', 'project', 'application', 'message'
        link, // URL to navigate to when clicked
        read: false,
        createdAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error creating notification:', error);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await updateDoc(doc(notificationsRef, notificationId), {
        read: true
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const batch = writeBatch(db);
      
      notifications.forEach(notification => {
        if (!notification.read) {
          const notificationRef = doc(notificationsRef, notification.id);
          batch.update(notificationRef, { read: true });
        }
      });
      
      await batch.commit();
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'assignment':
        return '📝';
      case 'project':
        return '🎯';
      case 'application':
        return '📨';
      case 'message':
        return '💬';
      default:
        return '🔔';
    }
  };

  const value = {
    notifications,
    unreadCount,
    createNotification,
    markAsRead,
    markAllAsRead,
    getNotificationIcon
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}; 