import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import notificationService from '../services/notificationService';

interface SocketIOMessage {
  type: string;
  data: any;
  timestamp: string;
}

interface SocketIOContextType {
  isConnected: boolean;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  subscribe: (eventType: string, callback: (data: any) => void) => () => void;
  emit: (event: string, data: any) => void;
  lastMessage: SocketIOMessage | null;
}

const SocketIOContext = createContext<SocketIOContextType | undefined>(undefined);

export const useSocketIO = () => {
  const context = useContext(SocketIOContext);
  if (!context) {
    throw new Error('useSocketIO must be used within a SocketIOProvider');
  }
  return context;
};

interface SocketIOProviderProps {
  children: React.ReactNode;
}

export const SocketIOProvider: React.FC<SocketIOProviderProps> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  const [lastMessage, setLastMessage] = useState<SocketIOMessage | null>(null);

  const subscribe = useCallback((eventType: string, callback: (data: any) => void) => {
    const wrappedCallback = (data: any) => {
      setLastMessage({ type: eventType, data, timestamp: new Date().toISOString() });
      callback(data);
    };

    notificationService.on(eventType, wrappedCallback);

    return () => {
      notificationService.off(eventType, wrappedCallback);
    };
  }, []);

  const emit = useCallback((event: string, data: any) => {
    notificationService.emitEvent(event, data);
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      notificationService.disconnect();
      setIsConnected(false);
      setConnectionStatus('disconnected');
      return;
    }

    setConnectionStatus('connecting');

    const handleConnect = () => {
      setIsConnected(true);
      setConnectionStatus('connected');
    };
    const handleDisconnect = () => {
      setIsConnected(false);
      setConnectionStatus('disconnected');
    };
    const handleConnectError = () => {
      setIsConnected(false);
      setConnectionStatus('error');
    };

    notificationService.on('connect', handleConnect);
    notificationService.on('disconnect', handleDisconnect);
    notificationService.on('connect_error', handleConnectError);
    notificationService.connect();

    const initialStatus = notificationService.getConnectionStatus();
    setIsConnected(initialStatus);
    setConnectionStatus(initialStatus ? 'connected' : 'connecting');

    return () => {
      notificationService.off('connect', handleConnect);
      notificationService.off('disconnect', handleDisconnect);
      notificationService.off('connect_error', handleConnectError);
    };
  }, [isAuthenticated]);

  const value: SocketIOContextType = {
    isConnected,
    connectionStatus,
    subscribe,
    emit,
    lastMessage,
  };

  return (
    <SocketIOContext.Provider value={value}>
      {children}
    </SocketIOContext.Provider>
  );
};
