import React from 'react';
import { useSnackbar } from '../../contexts/SnackbarContext';
import SnackbarItem from './SnackbarItem';
import { SnackbarMessage } from '../../types';

const SnackbarContainer: React.FC = () => {
  const { snackbars, hideSnackbar } = useSnackbar();

  const handleDismiss = (id: string, committed: boolean) => {
    const snackbarToDismiss = snackbars.find(s => s.id === id);
    if (snackbarToDismiss) {
        if (committed && snackbarToDismiss.onCommit) {
            snackbarToDismiss.onCommit();
        }
    }
    hideSnackbar(id);
  };

  if (snackbars.length === 0) {
    return null;
  }

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="fixed bottom-0 right-0 p-4 sm:p-6 space-y-3 z-[100]" // High z-index
      style={{ width: 'auto', maxWidth: 'calc(100% - 2rem)' }} // Ensure it doesn't overflow small screens
    >
      {snackbars.map(snackbar => (
        <SnackbarItem
          key={snackbar.id}
          snackbar={snackbar}
          onDismiss={handleDismiss}
        />
      ))}
    </div>
  );
};

export default SnackbarContainer;