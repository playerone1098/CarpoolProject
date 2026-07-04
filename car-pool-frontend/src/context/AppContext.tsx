import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api, checkServerConnection } from '../services/api';
import type { User, Ride, Group, Trip, Notification } from '../services/api';

interface AppContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  isMock: boolean;
  rides: Ride[];
  historyRides: Ride[];
  groups: Group[];
  trips: Trip[];
  notifications: Notification[];
  
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
  
  // Groups actions
  refreshGroups: () => Promise<void>;
  createGroup: (data: { name: string; type: 'public' | 'private' }) => Promise<void>;
  joinGroup: (groupId: string) => Promise<void>;
  leaveGroup: (groupId: string) => Promise<void>;
  
  // Notifications
  refreshNotifications: () => Promise<void>;
  markNotifRead: (id: string) => Promise<void>;
  
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
  const [groups, setGroups] = useState<Group[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Log Out
  const logout = useCallback(() => {
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

  const refreshGroups = useCallback(async () => {
    try {
      const list = await api.groups.list();
      setGroups(list);
    } catch (e) {
      console.error('Failed to load groups:', e);
    }
  }, []);

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
    } catch (e) {
      console.error('Failed to load notifications:', e);
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

  // Secondary useEffect to load relational data after authentication completes
  useEffect(() => {
    if (user) {
      refreshRides();
      refreshHistoryRides();
      refreshGroups();
      refreshTrips();
      refreshNotifications();
    }
  }, [user, refreshRides, refreshHistoryRides, refreshGroups, refreshTrips, refreshNotifications]);

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
    const ride = await api.rides.bookSeat(rideId, user._id);
    await refreshRides();
    await refreshHistoryRides();
    
    // Send notification to the driver
    const driverId = typeof ride.driver === 'object' ? ride.driver._id : ride.driver;
    if (driverId && driverId !== user._id) {
      await api.notifications.create({
        userId: driverId,
        title: 'Seat Booked!',
        message: `${user.name} has booked a seat on your ride from ${ride.pickupLocation}.`,
      });
    }
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

  const createGroup = async (data: { name: string; type: 'public' | 'private' }) => {
    if (!user) return;
    await api.groups.create({
      ...data,
      createdBy: user._id,
    });
    await refreshGroups();
  };

  const joinGroup = async (groupId: string) => {
    if (!user) return;
    await api.groups.addMember(groupId, user._id);
    await refreshGroups();
  };

  const leaveGroup = async (groupId: string) => {
    if (!user) return;
    await api.groups.removeMember(groupId, user._id);
    await refreshGroups();
  };

  const markNotifRead = async (id: string) => {
    await api.notifications.markAsRead(id);
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
        groups,
        trips,
        notifications,
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
        refreshGroups,
        createGroup,
        joinGroup,
        leaveGroup,
        refreshNotifications,
        markNotifRead,
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
