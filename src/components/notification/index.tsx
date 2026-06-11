import type { AlertColor } from '@mui/material/Alert';

import { useState, useContext, useCallback, createContext } from 'react';

import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';

// ----------------------------------------------------------------------

const DEFAULT_SUCCESS = 'Acción realizada con éxito';
const DEFAULT_ERROR = 'Ha ocurrido un error al lanzar la acción';

type NotificationEntry = {
  type: AlertColor;
  message: string;
};

type NotificationContextValue = {
  notifySuccess: (message?: string) => void;
  notifyError: (message?: string) => void;
};

const NotificationContext = createContext<NotificationContextValue>({
  notifySuccess: () => {},
  notifyError: () => {},
});

// ----------------------------------------------------------------------

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [entry, setEntry] = useState<NotificationEntry | null>(null);

  const notifySuccess = useCallback((message: string = DEFAULT_SUCCESS) => {
    setEntry({ type: 'success', message });
  }, []);

  const notifyError = useCallback((message: string = DEFAULT_ERROR) => {
    setEntry({ type: 'error', message });
  }, []);

  return (
    <NotificationContext.Provider value={{ notifySuccess, notifyError }}>
      {children}
      <Snackbar
        open={entry !== null}
        autoHideDuration={3500}
        onClose={() => setEntry(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          severity={entry?.type ?? 'success'}
          onClose={() => setEntry(null)}
          variant="filled"
          sx={{ minWidth: 300 }}
        >
          {entry?.message}
        </Alert>
      </Snackbar>
    </NotificationContext.Provider>
  );
}

// ----------------------------------------------------------------------

export function useNotification() {
  return useContext(NotificationContext);
}
