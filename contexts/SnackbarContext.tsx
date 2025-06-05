import React, { createContext, useState, useContext, ReactNode, useCallback } from 'react';
import { SnackbarMessage, SnackbarType, SnackbarContextType } from '../types';
import { v4 as uuidv4 } from 'uuid';

const SnackbarContext = createContext<SnackbarContextType | undefined>(undefined);

export const SnackbarProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [snackbars, setSnackbars] = useState<SnackbarMessage[]>([]);

  const showSnackbar = useCallback((
    message: string, 
    type: SnackbarType, 
    options?: { 
      duration?: number; 
      onUndo?: () => void; 
      onCommit?: () => void;
      undoLabel?: string;
    }
  ) => {
    const id = uuidv4();
    const newSnackbar: SnackbarMessage = {
      id,
      message,
      type,
      duration: options?.duration ?? (options?.onUndo ? 7000 : 4000), // Longer if undoable
      onUndo: options?.onUndo,
      onCommit: options?.onCommit,
      undoLabel: options?.undoLabel ?? 'Undo',
    };
    setSnackbars(prevSnackbars => [...prevSnackbars, newSnackbar]);
  }, []);

  const hideSnackbar = useCallback((id: string) => {
    setSnackbars(prevSnackbars => prevSnackbars.filter(snackbar => snackbar.id !== id));
  }, []);

  return (
    <SnackbarContext.Provider value={{ snackbars, showSnackbar, hideSnackbar }}>
      {children}
    </SnackbarContext.Provider>
  );
};

export const useSnackbar = (): SnackbarContextType => {
  const context = useContext(SnackbarContext);
  if (context === undefined) {
    throw new Error('useSnackbar must be used within a SnackbarProvider');
  }
  return context;
};