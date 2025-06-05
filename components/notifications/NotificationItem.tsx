import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Notification, NotificationType } from '../../types';
import { useData } from '../../contexts/DataContext';

interface NotificationItemProps {
  notification: Notification;
  onClosePopover: () => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({ notification, onClosePopover }) => {
  const { markNotificationAsRead } = useData();
  const navigate = useNavigate();

  const handleClick = () => {
    if (!notification.isRead) {
      markNotificationAsRead(notification.id);
    }
    navigate(`/file/${notification.fileId}`);
    onClosePopover(); 
  };

  const timeSince = (date: string): string => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + "y ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + "mo ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + "d ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + "h ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + "m ago";
    return Math.floor(seconds) + "s ago";
  };

  const icon = () => {
    switch (notification.type) {
      case NotificationType.ARRIVAL:
        return ( // File arriving (download/inbox style)
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-blue-500">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 3.75H6.912a2.25 2.25 0 00-2.15 1.588L2.35 13.12a2.25 2.25 0 002.15 2.92h15a2.25 2.25 0 002.15-2.92l-2.412-7.752A2.25 2.25 0 0017.088 3.75H15m-4.5 3.75V3m0 4.5L12 3m0 4.5H7.5M12 3H7.5" />
          </svg>
        );
      case NotificationType.CONFIRMATION:
        return ( // File confirmed (checkmark style)
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-green-500">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case NotificationType.WORKFLOW_ASSIGNMENT:
         return ( // Workflow related
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-purple-500">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m.75 12l3 3m0 0l3-3m-3 3v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
         );
      case NotificationType.FILE_OVERDUE:
        return ( // Overdue alert
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-red-500">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
        );
      default:
         return ( // Generic notification
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-500">
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
          </svg>
        );
    }
  };

  return (
    <li 
      className={`p-3 hover:bg-gray-100 cursor-pointer border-b border-gray-200 last:border-b-0 ${notification.isRead ? 'opacity-70' : ''}`}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyPress={(e) => e.key === 'Enter' && handleClick()}
      aria-label={`Notification: ${notification.message}. Status: ${notification.isRead ? 'Read' : 'Unread'}. Click to view file and mark as read.`}
    >
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0 pt-1">{icon()}</div>
        <div className="flex-1">
          <p className={`text-sm ${notification.isRead ? 'text-gray-600' : 'text-gray-800 font-medium'}`}>
            {notification.message}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            {timeSince(notification.timestamp)}
            {notification.relatedFileTitle && <span className="italic"> - {notification.relatedFileTitle}</span>}
            {notification.workflowStepName && <span className="italic text-purple-600"> (Step: {notification.workflowStepName})</span>}
          </p>
        </div>
      </div>
    </li>
  );
};

export default NotificationItem;
