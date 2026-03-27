import axios from '../utils/axios';
import { io } from 'socket.io-client';

export interface Notification {
  _id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  created_at: string;
  url?: string;
  metadata?: any;
}

export interface NotificationResponse {
  notifications: Notification[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

type EventCallback = (data: any) => void;

declare global {
  interface Window {
    __SOCKET_INITIALIZED__?: boolean;
    __SOCKET_INSTANCE__?: any;
    __SOCKET_LISTENERS__?: Map<string, EventCallback[]>;
  }
}

class NotificationService {
  private isConnecting: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      if (!window.__SOCKET_LISTENERS__) {
        window.__SOCKET_LISTENERS__ = new Map();
      }
    }
  }

  private get socket(): any {
    return typeof window !== 'undefined' ? window.__SOCKET_INSTANCE__ : null;
  }

  private set socket(value: any) {
    if (typeof window !== 'undefined') {
      window.__SOCKET_INSTANCE__ = value;
    }
  }

  private get listeners(): Map<string, EventCallback[]> {
    return typeof window !== 'undefined' && window.__SOCKET_LISTENERS__ 
      ? window.__SOCKET_LISTENERS__ 
      : new Map();
  }

  private get isInitialized(): boolean {
    return typeof window !== 'undefined' ? !!window.__SOCKET_INITIALIZED__ : false;
  }

  private set isInitialized(value: boolean) {
    if (typeof window !== 'undefined') {
      window.__SOCKET_INITIALIZED__ = value;
    }
  }

  private initializeSocket() {
    if (this.socket?.connected) {
      this.isInitialized = true;
      return;
    }

    if (this.isInitialized) {
      return;
    }

    if (typeof window === 'undefined') {
      return;
    }

    try {
      this.isInitialized = true;

      const apiUrl = import.meta.env.VITE_API_URL;
      if (!apiUrl || !apiUrl.trim()) {
        console.warn('⚠️ VITE_API_URL is not set, socket not initialized');
        return;
      }

      const serverUrl = apiUrl.trim().replace(/\/api\/?$/, '');
      this.socket = io(serverUrl, {
        transports: ['websocket', 'polling'],
        timeout: 5000,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        forceNew: false,
        autoConnect: false
      });

      this.socket.on('connect', () => {
        this.emit('connect', { connected: true });
        const token = localStorage.getItem('token');
        if (token) {
          this.socket.emit('join_user_room', { token });
        }
      });

      this.socket.on('disconnect', (reason: string) => {
        this.emit('disconnect', { reason });
      });

      this.socket.on('connect_error', (error: Error) => {
        this.emit('connect_error', error);
      });

      // Forward all custom socket events to app subscribers.
      this.socket.onAny((event: string, ...args: any[]) => {
        const payload = args.length <= 1 ? args[0] : args;
        this.emit(event, payload);
      });

    } catch (error) {
      this.socket = null;
      this.isInitialized = false;
    }
  }

  private isSocketConnected(): boolean {
    return this.socket && this.socket.connected;
  }

  public getConnectionStatus(): boolean {
    return this.isSocketConnected();
  }

  public emitEvent(event: string, data: any): void {
    if (this.isSocketConnected()) {
      this.socket.emit(event, data);
    }
  }

  on(event: string, callback: EventCallback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  off(event: string, callback: EventCallback) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  private emit(event: string, data: any) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }
  }

  async getNotifications(options: {
    page?: number;
    limit?: number;
    unreadOnly?: boolean;
    type?: string;
  } = {}): Promise<NotificationResponse> {
    try {
      const params = new URLSearchParams();
      if (options.page) params.append('page', options.page.toString());
      if (options.limit) params.append('limit', options.limit.toString());
      if (options.unreadOnly) params.append('unreadOnly', 'true');
      if (options.type) params.append('type', options.type);

      const response = await axios.get(`/api/notifications?${params.toString()}`);
      return response.data.data;
    } catch (error) {
      throw error;
    }
  }

  async getUnreadCount(): Promise<number> {
    try {
      const response = await axios.get('/api/notifications/unread-count');
      return response.data.data.unreadCount;
    } catch (error) {
      return 0;
    }
  }

  async markAsRead(notificationId: string): Promise<void> {
    try {
      await axios.patch(`/api/notifications/${notificationId}/read`);
    } catch (error) {
      throw error;
    }
  }

  async markAllAsRead(): Promise<void> {
    try {
      await axios.patch('/api/notifications/read-all');
    } catch (error) {
      throw error;
    }
  }

  async deleteNotification(notificationId: string): Promise<void> {
    try {
      await axios.delete(`/api/notifications/${notificationId}`);
    } catch (error) {
      throw error;
    }
  }

  async createNotification(notificationData: {
    user_id: string;
    title: string;
    message: string;
    type?: 'info' | 'success' | 'warning' | 'error';
    url?: string;
    metadata?: any;
  }): Promise<Notification> {
    try {
      const response = await axios.post('/api/notifications', notificationData);
      return response.data.data;
    } catch (error) {
      throw error;
    }
  }

  async createBulkNotifications(notificationData: {
    user_ids: string[];
    title: string;
    message: string;
    type?: 'info' | 'success' | 'warning' | 'error';
    url?: string;
    metadata?: any;
  }): Promise<any> {
    try {
      const response = await axios.post('/api/notifications/bulk', notificationData);
      return response.data.data;
    } catch (error) {
      throw error;
    }
  }

  public connect() {
    if (this.isConnecting) {
      return;
    }

    if (this.socket?.connected) {
      return;
    }

    this.isConnecting = true;

    try {
      if (!this.isInitialized) {
        this.initializeSocket();
      }
      
      if (this.socket && !this.socket.connected) {
        this.socket.connect();
      }
    } finally {
      setTimeout(() => {
        this.isConnecting = false;
      }, 1000);
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.isInitialized = false;
    this.isConnecting = false;
    
    if (typeof window !== 'undefined' && window.__SOCKET_LISTENERS__) {
      window.__SOCKET_LISTENERS__.clear();
    }
  }
}

export default new NotificationService();
