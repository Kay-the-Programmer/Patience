import React, { useEffect, useState, useCallback } from 'react';
import { SnackbarMessage } from '../../types';
import Button from './Button'; // Assuming you have a Button component

interface SnackbarItemProps {
  snackbar: SnackbarMessage;
  onDismiss: (id: string, committed: boolean) => void; // committed = true if not undone
}

const SnackbarItem: React.FC<SnackbarItemProps> = ({ snackbar, onDismiss }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isPaused, setIsPaused] = useState(false);

  const handleClose = useCallback((committed: boolean = true) => {
    setIsVisible(false);
    // Give time for fade-out animation before fully dismissing
    setTimeout(() => {
      onDismiss(snackbar.id, committed);
    }, 300); // Matches fade-out duration
  }, [onDismiss, snackbar.id]);

  useEffect(() => {
    if (!isPaused && isVisible) {
      const timer = setTimeout(() => {
        handleClose(true); // Auto-dismiss commits the action
      }, snackbar.duration);
      return () => clearTimeout(timer);
    }
  }, [snackbar.duration, isPaused, isVisible, handleClose]);

  const handleUndo = () => {
    if (snackbar.onUndo) {
      snackbar.onUndo();
    }
    handleClose(false); // Undo was clicked, so don't commit
  };

  const getIcon = () => {
    switch (snackbar.type) {
      case 'success':
        return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-green-500"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
      case 'error':
        return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-red-500"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>;
      case 'warning':
        return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-yellow-500"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>;
      case 'info':
      default:
        return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-blue-500"><path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" /></svg>;
    }
  };
  
  const baseBgColor = {
    success: 'bg-green-50',
    error: 'bg-red-50',
    warning: 'bg-yellow-50',
    info: 'bg-blue-50',
  };
  const baseBorderColor = {
    success: 'border-green-400',
    error: 'border-red-400',
    warning: 'border-yellow-400',
    info: 'border-blue-400',
  };
  const baseTextColor = {
    success: 'text-green-700',
    error: 'text-red-700',
    warning: 'text-yellow-700',
    info: 'text-blue-700',
  };


  return (
    <div
      role="alert"
      aria-live="assertive"
      className={`
        p-4 rounded-md shadow-lg flex items-start space-x-3 w-full max-w-sm
        border-l-4
        ${baseBgColor[snackbar.type]} 
        ${baseBorderColor[snackbar.type]}
        transform transition-all duration-300 ease-in-out
        ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full'}
      `}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="flex-shrink-0 pt-0.5">{getIcon()}</div>
      <div className="flex-1">
        <p className={`text-sm font-medium ${baseTextColor[snackbar.type]}`}>
          {snackbar.message}
        </p>
        {snackbar.onUndo && (
          <div className="mt-2">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleUndo} 
              className={`!text-sm !px-2 !py-1 ${baseTextColor[snackbar.type]} hover:!bg-opacity-20`}
            >
              {snackbar.undoLabel}
            </Button>
          </div>
        )}
      </div>
      <div className="flex-shrink-0">
        <button
          onClick={() => handleClose(true)}
          className={`p-1 rounded-full hover:bg-opacity-20 focus:outline-none focus:ring-2 focus:ring-offset-2
            ${snackbar.type === 'success' ? 'hover:bg-green-100 focus:ring-green-600 focus:ring-offset-green-50' : ''}
            ${snackbar.type === 'error'   ? 'hover:bg-red-100 focus:ring-red-600 focus:ring-offset-red-50' : ''}
            ${snackbar.type === 'warning' ? 'hover:bg-yellow-100 focus:ring-yellow-600 focus:ring-offset-yellow-50' : ''}
            ${snackbar.type === 'info'    ? 'hover:bg-blue-100 focus:ring-blue-600 focus:ring-offset-blue-50' : ''}
          `}
          aria-label="Close notification"
        >
           <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-5 h-5 ${baseTextColor[snackbar.type]}`}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default SnackbarItem;