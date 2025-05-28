import React, { useContext, useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { NotificationContext } from '../contexts/NotificationContext';

const NotificationBell = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, getNotificationIcon } = useContext(NotificationContext);
  const [isOpen, setIsOpen] = useState(false);
  const bellRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (bellRef.current && !bellRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = async (notification) => {
    await markAsRead(notification.id);
    if (notification.link) {
      navigate(notification.link);
    }
    setIsOpen(false);
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  const getTimeAgo = (timestamp) => {
    const seconds = Math.floor((new Date() - new Date(timestamp.seconds * 1000)) / 1000);
    
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + 'y ago';
    
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + 'mo ago';
    
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + 'd ago';
    
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + 'h ago';
    
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + 'm ago';
    
    return Math.floor(seconds) + 's ago';
  };

  // Group notifications by date
  const groupNotifications = (notifications) => {
    const groups = {};
    
    notifications.forEach(notification => {
      const date = new Date(notification.createdAt.seconds * 1000);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      let groupKey;
      if (date.toDateString() === today.toDateString()) {
        groupKey = 'Today';
      } else if (date.toDateString() === yesterday.toDateString()) {
        groupKey = 'Yesterday';
      } else {
        groupKey = date.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric'
        });
      }
      
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(notification);
    });
    
    return groups;
  };

  const notificationGroups = groupNotifications(notifications);

  return (
    <div className="notification-bell" ref={bellRef}>
      <button 
        className="bell-button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications"
      >
        <svg 
          width="20" 
          height="20" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2"
          className={unreadCount > 0 ? 'bell-animation' : ''}
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="notification-badge">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="notifications-dropdown">
          <div className="notifications-header">
            <h3>Notifications</h3>
            {notifications.length > 0 && (
              <button 
                className="mark-all-read"
                onClick={handleMarkAllAsRead}
              >
                Mark all as read
              </button>
            )}
          </div>
          
          <div className="notifications-list">
            {notifications.length === 0 ? (
              <div className="no-notifications">
                <div className="empty-icon">🔔</div>
                <p>No notifications</p>
                <p className="empty-subtitle">We'll notify you when something arrives</p>
              </div>
            ) : (
              Object.entries(notificationGroups).map(([date, groupNotifications]) => (
                <div key={date} className="notification-group">
                  <div className="notification-date">{date}</div>
                  {groupNotifications.map(notification => (
                    <div
                      key={notification.id}
                      className={`notification-item ${!notification.read ? 'unread' : ''}`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="notification-icon">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="notification-content">
                        <div className="notification-title">
                          {notification.title}
                        </div>
                        <div className="notification-message">
                          {notification.message}
                        </div>
                        <div className="notification-time">
                          {getTimeAgo(notification.createdAt)}
                        </div>
                      </div>
                      {!notification.read && (
                        <div className="unread-dot" />
                      )}
                    </div>
                  ))}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        .notification-bell {
          position: relative;
        }

        .bell-button {
          background: none;
          border: none;
          padding: 8px;
          cursor: pointer;
          color: var(--text-primary);
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          transition: background-color 0.2s;
        }

        .bell-button:hover {
          background: var(--background-hover);
        }

        .bell-animation {
          animation: bell-shake 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
        }

        @keyframes bell-shake {
          0%, 100% { transform: rotate(0); }
          20%, 60% { transform: rotate(8deg); }
          40%, 80% { transform: rotate(-8deg); }
        }

        .notification-badge {
          position: absolute;
          top: 0;
          right: 0;
          background: var(--danger);
          color: white;
          font-size: 11px;
          font-weight: 600;
          padding: 2px 4px;
          border-radius: 10px;
          min-width: 16px;
          height: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: badge-pop 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }

        @keyframes badge-pop {
          0% { transform: scale(0); }
          100% { transform: scale(1); }
        }

        .notifications-dropdown {
          position: absolute;
          top: calc(100% + 8px);
          right: -8px;
          width: 360px;
          background: white;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          z-index: 1000;
        }

        .notifications-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px;
          border-bottom: 1px solid var(--border);
        }

        .notifications-header h3 {
          font-size: 16px;
          font-weight: 600;
          margin: 0;
        }

        .mark-all-read {
          background: none;
          border: none;
          color: var(--primary);
          font-size: 13px;
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 4px;
          transition: all 0.2s;
        }

        .mark-all-read:hover {
          background: var(--background-hover);
        }

        .notifications-list {
          max-height: 400px;
          overflow-y: auto;
        }

        .notification-group {
          border-bottom: 1px solid var(--border);
        }

        .notification-date {
          padding: 8px 16px;
          font-size: 12px;
          font-weight: 600;
          color: var(--text-tertiary);
          background: var(--background-secondary);
        }

        .no-notifications {
          padding: 32px 16px;
          text-align: center;
          color: var(--text-secondary);
        }

        .empty-icon {
          font-size: 32px;
          margin-bottom: 8px;
          opacity: 0.5;
        }

        .empty-subtitle {
          font-size: 13px;
          color: var(--text-tertiary);
          margin-top: 4px;
        }

        .notification-item {
          padding: 12px 16px;
          cursor: pointer;
          display: flex;
          align-items: flex-start;
          gap: 12px;
          transition: background-color 0.2s;
          position: relative;
        }

        .notification-item:hover {
          background: var(--background-hover);
        }

        .notification-item.unread {
          background: var(--background-unread);
        }

        .notification-item.unread:hover {
          background: var(--background-unread-hover);
        }

        .notification-icon {
          font-size: 20px;
          min-width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .notification-content {
          flex: 1;
          min-width: 0;
        }

        .notification-title {
          font-weight: 500;
          color: var(--text-primary);
          font-size: 14px;
          margin-bottom: 2px;
        }

        .notification-message {
          color: var(--text-secondary);
          font-size: 13px;
          line-height: 1.4;
          margin-bottom: 4px;
          overflow: hidden;
          text-overflow: ellipsis;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
        }

        .notification-time {
          color: var(--text-tertiary);
          font-size: 12px;
        }

        .unread-dot {
          position: absolute;
          top: 50%;
          right: 16px;
          transform: translateY(-50%);
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--primary);
        }

        @media (max-width: 768px) {
          .notifications-dropdown {
            position: fixed;
            top: 64px;
            left: 0;
            right: 0;
            width: 100%;
            border-radius: 0;
            max-height: calc(100vh - 64px);
          }

          .notifications-list {
            max-height: calc(100vh - 64px - 57px);
          }
        }
      `}</style>
    </div>
  );
};

export default NotificationBell; 