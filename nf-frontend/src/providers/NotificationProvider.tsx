import React from 'react';
import { NotificationProvider as NotificationContextProvider } from 'src/context/NotificationContext';

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return (
    <NotificationContextProvider>
      {children}
    </NotificationContextProvider>
  );
}; 