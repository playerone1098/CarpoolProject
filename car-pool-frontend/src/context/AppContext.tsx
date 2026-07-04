import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { api, checkServerConnection } from '../services/api';
import type { User, Ride, Trip, Notification } from '../services/api';
import { connectSocket, disconnectSocket } from '../services/socket';
import type { ToastNotification } from '../components/common/NotificationToast';

interface AppContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  isMock: boolean;
  rides: Ride[];
  historyRides: Ride[];
  trips: Trip[];
  notifications: Notification[];
  unreadCount: number;

  // Auth actions
  sendOtp: (phone: string) => Promise<{ message: string }>;
  verifyOtp: (phone: string, otp: string) => Promise<void>;
  emailRegister: (name: string, email: string, password: string, phone: string) => Promise<void>;
  emailLogin: (email: string, password: string) => Promise<void>;
  logout: () => void;

  // Profile actions
  updateProfile: (data: Partial<User>) => Promise<void>;
  addBookmark: (bookmark: { name: string; address: string; coords: { lat: number; lng: number } }) => Promise<void>;
  removeBookmark: (bookmarkId: string) => Promise<void>;

  // Rides actions
  refreshRides: () => Promise<void>;
  refreshHistoryRides: () => Promise<void>;
  createRide: (data: any) => Promise<void>;
  bookSeat: (rideId: string) => Promise<void>;
  updateRide: (rideId: string, data: any) => Promise<void>;
  deleteRide: (rideId: string) => Promise<void>;

  // Trips actions
  refreshTrips: () => Promise<void>;
  createTrip: (data: any) => Promise<void>;
  joinTrip: (tripId: string, phone: string) => Promise<void>;
  updateTrip: (tripId: string, data: any) => Promise<void>;
  deleteTrip: (tripId: string) => Promise<void>;



  // Notifications
  refreshNotifications: () => Promise<void>;
  refreshUnreadCount: () => Promise<void>;
  markNotifRead: (id: string) => Promise<void>;
  markAllNotifRead: () => Promise<void>;

  // Toast notifications (real-time push)
  toasts: ToastNotification[];
  dismissToast: (id: string) => void;

  // Connection checks
  serverError: boolean;
  retryConnection: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('auth_token'));
  const [loading, setLoading] = useState(true);
  const [isMock, setIsMock] = useState(false);
  const [serverError, setServerError] = useState(false);

  const [rides, setRides] = useState<Ride[]>([]);
  const [historyRides, setHistoryRides] = useState<Ride[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [toasts, setToasts] = useState<ToastNotification[]>([]);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Toast helpers
  const addToast = useCallback((notification: { _id: string; title: string; message: string; type?: string }) => {
    const toast: ToastNotification = {
      id: notification._id + '-' + Date.now(),
      title: notification.title,
      message: notification.message,
      type: notification.type,
      timestamp: Date.now(),
    };
    setToasts(prev => [toast, ...prev].slice(0, 5)); // Keep max 5 toasts
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Log Out
  const logout = useCallback(() => {
    disconnectSocket();
    localStorage.clear();
    setUser(null);
    setToken(null);
  }, []);

  // Data Refreshers
  const refreshRides = useCallback(async () => {
    try {
      const list = await api.rides.list();
      setRides(list);
    } catch (e) {
      console.error('Failed to load rides:', e);
    }
  }, []);

  const refreshHistoryRides = useCallback(async () => {
    if (!user) return;
    try {
      const list = await api.rides.listHistory(user._id);
      setHistoryRides(list);
    } catch (e) {
      console.error('Failed to load ride history:', e);
    }
  }, [user]);



  const refreshTrips = useCallback(async () => {
    try {
      const list = await api.trips.list();
      setTrips(list);
    } catch (e) {
      console.error('Failed to load trips:', e);
    }
  }, []);

  const refreshNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const list = await api.notifications.listByUser(user._id);
      setNotifications(list);
      setUnreadCount(list.filter(n => !n.read).length);
    } catch (e) {
      console.error('Failed to load notifications:', e);
    }
  }, [user]);

  const refreshUnreadCount = useCallback(async () => {
    if (!user) return;
    try {
      const res = await api.notifications.unreadCount(user._id);
      setUnreadCount(res.count);
    } catch (e) {
      // Silently fail on poll errors
    }
  }, [user]);

  // Initial App Setup (Checks server connection and loads user profile if token is present)
  useEffect(() => {
    const initApp = async () => {
      setLoading(true);
      const connected = await checkServerConnection();
      setIsMock(!connected);
      setServerError(!connected);

      if (connected) {
        const savedToken = localStorage.getItem('auth_token');
        const savedUserId = localStorage.getItem('auth_user_id');

        if (savedToken && savedUserId) {
          try {
            const profile = await api.users.getProfile(savedUserId);
            setUser(profile);
            setToken(savedToken);
          } catch (e) {
            console.error('Session expired or error loading profile. Logging out.');
            logout();
          }
        }
      }
      setLoading(false);
    };

    initApp();
  }, [logout]);

  const retryConnection = useCallback(async () => {
    setLoading(true);
    const connected = await checkServerConnection();
    setIsMock(!connected);
    setServerError(!connected);

    if (connected) {
      const savedToken = localStorage.getItem('auth_token');
      const savedUserId = localStorage.getItem('auth_user_id');

      if (savedToken && savedUserId) {
        try {
          const profile = await api.users.getProfile(savedUserId);
          setUser(profile);
          setToken(savedToken);
        } catch (e) {
          logout();
        }
      }
    }
    setLoading(false);
  }, [logout]);

  useEffect(() => {
    if (user) {
      refreshRides();
      refreshHistoryRides();
      refreshTrips();
      refreshNotifications();
    }
  }, [user, refreshRides, refreshHistoryRides, refreshTrips, refreshNotifications]);

  // Connect WebSocket and setup notification permissions when user is authenticated
  useEffect(() => {
    if (!user) return;

    // Request native browser notification permissions
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(err => {
        console.log('Failed to request notification permission:', err);
      });
    }

    const socket = connectSocket(user._id);

    // Listen for real-time push notifications
    const handleNewNotification = (data: any) => {
      // Add to notification list at the top
      setNotifications(prev => [data, ...prev]);
      // Increment unread count
      setUnreadCount(prev => prev + 1);

      // Always show in-app toast
      addToast(data);

      // Also trigger a native browser/OS push notification if the document is hidden/backgrounded
      if ('Notification' in window && Notification.permission === 'granted' && document.hidden) {
        try {
          new Notification(data.title, {
            body: data.message,
            icon: '/favicon.ico'
          });
        } catch (e) {
          console.error('Error displaying native notification:', e);
        }
      }
    };

    socket.on('new_notification', handleNewNotification);

    return () => {
      socket.off('new_notification', handleNewNotification);
    };
  }, [user, addToast]);

  // Fallback: poll unread count every 60s in case WebSocket misses something
  useEffect(() => {
    if (user) {
      refreshUnreadCount();
      pollIntervalRef.current = setInterval(() => {
        refreshUnreadCount();
      }, 60000);
    }
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [user, refreshUnreadCount]);

  // --- ACTIONS IMPLEMENTATION ---

  const sendOtp = async (phone: string) => {
    return api.auth.sendOtp(phone);
  };

  const verifyOtp = async (phone: string, otp: string) => {
    const res = await api.auth.verifyOtp(phone, otp);
    localStorage.setItem('auth_token', res.token);
    localStorage.setItem('auth_refresh_token', res.refreshToken);
    localStorage.setItem('auth_user_id', res.user._id);
    localStorage.setItem('auth_user_phone', res.user.phone);
    setUser(res.user);
    setToken(res.token);
  };

  const emailRegister = async (name: string, email: string, password: string, phone: string) => {
    const res = await api.auth.emailRegister(name, email, password, phone);
    localStorage.setItem('auth_token', res.token);
    localStorage.setItem('auth_refresh_token', res.refreshToken);
    localStorage.setItem('auth_user_id', res.user._id);
    localStorage.setItem('auth_user_phone', res.user.phone);
    setUser(res.user);
    setToken(res.token);
  };

  const emailLogin = async (email: string, password: string) => {
    const res = await api.auth.emailLogin(email, password);
    localStorage.setItem('auth_token', res.token);
    localStorage.setItem('auth_refresh_token', res.refreshToken);
    localStorage.setItem('auth_user_id', res.user._id);
    localStorage.setItem('auth_user_phone', res.user.phone);
    setUser(res.user);
    setToken(res.token);
  };

  const updateProfile = async (data: Partial<User>) => {
    if (!user) return;
    const updated = await api.users.updateProfile(user._id, data);
    setUser(updated);
  };

  const addBookmark = async (bookmark: { name: string; address: string; coords: { lat: number; lng: number } }) => {
    if (!user) return;
    await api.users.addBookmark(user._id, bookmark);
    const updated = await api.users.getProfile(user._id);
    setUser(updated);
  };

  const removeBookmark = async (bookmarkId: string) => {
    if (!user) return;
    await api.users.removeBookmark(user._id, bookmarkId);
    const updated = await api.users.getProfile(user._id);
    setUser(updated);
  };

  const createRide = async (data: any) => {
    if (!user) return;
    await api.rides.create({
      ...data,
      driver: user._id,
    });
    await refreshRides();
    await refreshHistoryRides();
  };

  const bookSeat = async (rideId: string) => {
    if (!user) return;
    await api.rides.bookSeat(rideId, user._id);
    await refreshRides();
    await refreshHistoryRides();
  };

  const createTrip = async (data: any) => {
    if (!user) return;
    await api.trips.create({
      ...data,
      host_id: user._id,
    });
    await refreshTrips();
  };

  const joinTrip = async (tripId: string, phone: string) => {
    await api.trips.join(tripId, phone, user?._id);
    await refreshTrips();
  };

  const updateRide = async (rideId: string, data: any) => {
    await api.rides.update(rideId, data);
    await refreshRides();
    await refreshHistoryRides();
  };

  const deleteRide = async (rideId: string) => {
    await api.rides.delete(rideId);
    await refreshRides();
    await refreshHistoryRides();
  };

  const updateTrip = async (tripId: string, data: any) => {
    await api.trips.update(tripId, data);
    await refreshTrips();
  };

  const deleteTrip = async (tripId: string) => {
    await api.trips.delete(tripId);
    await refreshTrips();
  };



  const markNotifRead = async (id: string) => {
    await api.notifications.markAsRead(id);
    setUnreadCount(prev => Math.max(0, prev - 1));
    await refreshNotifications();
  };

  const markAllNotifRead = async () => {
    if (!user) return;
    await api.notifications.markAllAsRead(user._id);
    setUnreadCount(0);
    await refreshNotifications();
  };

  return (
    <AppContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        loading,
        isMock,
        rides,
        historyRides,
        trips,
        notifications,
        unreadCount,
        sendOtp,
        verifyOtp,
        emailRegister,
        emailLogin,
        logout,
        updateProfile,
        addBookmark,
        removeBookmark,
        refreshRides,
        refreshHistoryRides,
        createRide,
        bookSeat,
        updateRide,
        deleteRide,
        refreshTrips,
        createTrip,
        joinTrip,
        updateTrip,
        deleteTrip,
        refreshNotifications,
        refreshUnreadCount,
        markNotifRead,
        markAllNotifRead,
        toasts,
        dismissToast,
        serverError,
        retryConnection,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
