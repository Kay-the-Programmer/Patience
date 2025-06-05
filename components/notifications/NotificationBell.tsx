import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { Notification } from '../../types';
import NotificationItem from './NotificationItem';
import Button from '../common/Button';

const NotificationBell: React.FC = () => {
  const { currentUser } = useAuth();
  const { getNotificationsForUser, markAllNotificationsAsRead, markNotificationAsRead } = useData();
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  const notifications = useMemo(() => {
    if (!currentUser) return [];
    return getNotificationsForUser(currentUser.id);
  }, [currentUser, getNotificationsForUser]); // Re-fetch when notifications in context change

  const unreadCount = useMemo(() => {
    return notifications.filter(n => !n.isRead).length;
  }, [notifications]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!currentUser) return null;

  const handleTogglePopover = () => {
    setIsOpen(prev => !prev);
  };
  
  const handleMarkAllRead = () => {
    markAllNotificationsAsRead(currentUser.id);
  };

  const closePopover = () => setIsOpen(false);

  const displayedNotifications = notifications.slice(0, 7); // Show recent 7 notifications

  return (
    <div className="relative">
      <button
        onClick={handleTogglePopover}
        className="p-2 rounded-full text-gray-300 hover:text-white hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white"
        aria-label={`View notifications (${unreadCount} unread)`}
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 block h-5 w-5 transform -translate-y-1 translate-x-1">
            <span className="absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75 animate-ping"></span>
            <span className="relative inline-flex rounded-full h-5 w-5 bg-red-600 text-white text-xs items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          </span>
        )}
      </button>

      {isOpen && (
        <div
          ref={popoverRef}
          className="origin-top-right absolute right-0 mt-2 w-80 sm:w-96 max-h-[70vh] overflow-y-auto rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="notification-panel-title"
        >
          <div className="p-3 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 id="notification-panel-title" className="text-lg font-medium text-gray-900">Notifications</h2>
              {unreadCount > 0 && (
                <Button variant="ghost" size="sm" onClick={handleMarkAllRead} aria-label="Mark all notifications as read">
                  Mark all as read
                </Button>
              )}
            </div>
          </div>
          {notifications.length === 0 ? (
            <p className="text-center text-gray-500 py-6 px-3">No notifications yet.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {displayedNotifications.map(notification => (
                <NotificationItem 
                    key={notification.id} 
                    notification={notification} 
                    onClosePopover={closePopover}
                />
              ))}
            </ul>
          )}
           {notifications.length > displayedNotifications.length && (
                <p className="p-3 text-center text-sm text-gray-500 border-t border-gray-200">
                    Showing {displayedNotifications.length} of {notifications.length} notifications.
                </p>
            )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;