// API client for Carpool website with transparent mock fallback

export interface User {
  _id: string;
  phone: string;
  name: string;
  mode: 'free' | 'pro';
  profilePhoto?: string;
  homeAddress?: {
    address: string;
    coords: { lat: number; lng: number };
  };
  workAddress?: {
    address: string;
    coords: { lat: number; lng: number };
  };
  bookmarks?: Array<{ _id: string; name: string; address: string; coords: { lat: number; lng: number } }>;
  carInfo?: {
    model?: string;
    color?: string;
    plateNumber?: string;
  };
}
export interface Ride {
  _id: string;
  driver: any; // User ID or User object
  carModel: string;
  seatsAvailable: number;
  pickupLocation: string;
  dropLocation: string;
  rideTime: string;
  passengers: any[]; // User IDs or User objects
  pickupCoords?: { lat: number; lng: number };
  dropCoords?: { lat: number; lng: number };
  price?: number;
}

export interface Trip {
  _id: string;
  host_id?: string;
  title: string;
  start_time?: string;
  origin?: any;
  destination?: any;
  route_polyline?: string;
  seats_total: number;
  seats_available: number;
  status: string;
}

export interface Notification {
  _id: string;
  userId: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/v1';

// Helper to check if server is active (always forces real API mode and tests connection)
export async function checkServerConnection(): Promise<boolean> {

  try {
    // A simple ping request to detect server presence
    await fetch(`${API_BASE_URL}/groups`, { method: 'GET', signal: AbortSignal.timeout(1800) });
    return true; // Connection successful (even if it returns a 401/404, the server is running)
  } catch (e) {
    // Network error (server is offline/not reachable)
    return false;
  }
}

// Fetch helper that appends JWT token if available
async function request(path: string, options: RequestInit = {}): Promise<any> {
  const token = localStorage.getItem('auth_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  let response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  // If unauthorized (401) and not doing login/OTP, try refreshing the token
  if (response.status === 401 && path !== '/auth/refresh' && path !== '/auth/email-login' && path !== '/auth/verify-otp') {
    const refreshToken = localStorage.getItem('auth_refresh_token');
    const phone = localStorage.getItem('auth_user_phone');

    if (refreshToken && phone) {
      try {
        const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone, refreshToken }),
        });

        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json();
          const newToken = refreshData.token;

          localStorage.setItem('auth_token', newToken);

          // Retry the original request with the new token
          const retryHeaders = {
            ...headers,
            Authorization: `Bearer ${newToken}`,
          };
          response = await fetch(`${API_BASE_URL}${path}`, {
            ...options,
            headers: retryHeaders,
          });
        }
      } catch (refreshErr) {
        console.error('Failed to refresh token silently:', refreshErr);
      }
    }
  }

  if (!response.ok) {
    const errorText = await response.text();
    let message = 'An error occurred';
    try {
      message = JSON.parse(errorText).message || message;
    } catch { }
    throw new Error(message);
  }

  return response.json();
}

// API Surface
export const api = {
  // --- AUTHENTICATION ---
  auth: {
    sendOtp: async (phone: string): Promise<{ message: string }> => {
      return request('/auth/send-otp', {
        method: 'POST',
        body: JSON.stringify({ phone }),
      });
    },

    verifyOtp: async (phone: string, otp: string): Promise<{ token: string; refreshToken: string; user: User }> => {
      return request('/auth/verify-otp', {
        method: 'POST',
        body: JSON.stringify({ phone, otp }),
      });
    },

    emailRegister: async (name: string, email: string, password: string, phone: string): Promise<{ token: string; refreshToken: string; user: User }> => {
      return request('/auth/email-register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password, phone }),
      });
    },

    emailLogin: async (email: string, password: string): Promise<{ token: string; refreshToken: string; user: User }> => {
      return request('/auth/email-login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
    },
  },

  // --- USERS / PROFILE ---
  users: {
    getProfile: async (id: string): Promise<User> => {
      return request(`/users/${id}`);
    },

    updateProfile: async (id: string, data: Partial<User>): Promise<User> => {

      return request(`/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },

    getBookmarks: async (id: string): Promise<any[]> => {

      return request(`/users/${id}/bookmarks`);
    },

    addBookmark: async (id: string, data: { name: string; address: string; coords: { lat: number; lng: number } }): Promise<any> => {

      return request(`/users/${id}/bookmarks`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    removeBookmark: async (id: string, bookmarkId: string): Promise<any> => {

      return request(`/users/${id}/bookmarks/${bookmarkId}`, {
        method: 'DELETE',
      });
    }
  },

  // --- RIDES ---
  rides: {
    create: async (data: any): Promise<Ride> => {

      return request('/rides', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    list: async (): Promise<Ride[]> => {

      return request('/rides');
    },

    listHistory: async (userId: string): Promise<Ride[]> => {
      return request(`/rides/user/${userId}`);
    },

    bookSeat: async (rideId: string, userId: string): Promise<Ride> => {

      return request(`/rides/${rideId}/book/${userId}`, {
        method: 'POST',
      });
    },

    update: async (rideId: string, data: any): Promise<Ride> => {
      return request(`/rides/${rideId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },

    delete: async (rideId: string): Promise<any> => {
      return request(`/rides/${rideId}`, {
        method: 'DELETE',
      });
    }
  },

  // --- TRIPS ---
  trips: {
    create: async (data: any): Promise<Trip> => {

      return request('/trips', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    list: async (): Promise<Trip[]> => {
      return request('/trips');
    },

    join: async (tripId: string, phone: string, userId?: string): Promise<any> => {

      const headers: any = {};
      if (userId) {
        headers['x-user-id'] = userId;
      }

      return request(`/trips/${tripId}/join`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ phone }),
      });
    },

    update: async (tripId: string, data: any): Promise<Trip> => {
      const headers: any = {};
      const userId = localStorage.getItem('auth_user_id');
      if (userId) headers['x-user-id'] = userId;

      return request(`/trips/${tripId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(data),
      });
    },

    delete: async (tripId: string): Promise<any> => {
      const headers: any = {};
      const userId = localStorage.getItem('auth_user_id');
      if (userId) headers['x-user-id'] = userId;

      return request(`/trips/${tripId}`, {
        method: 'DELETE',
        headers,
      });
    }
  },


  // --- NOTIFICATIONS ---
  notifications: {
    create: async (data: { userId: string; title: string; message: string }): Promise<Notification> => {
      return request('/notifications', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    listByUser: async (userId: string): Promise<Notification[]> => {

      return request(`/notifications/${userId}`);
    },

    markAsRead: async (id: string): Promise<any> => {

      return request(`/notifications/read/${id}`, {
        method: 'PUT',
      });
    },

    unreadCount: async (userId: string): Promise<{ count: number }> => {
      return request(`/notifications/unread-count/${userId}`);
    },

    markAllAsRead: async (userId: string): Promise<any> => {
      return request(`/notifications/read-all/${userId}`, {
        method: 'PUT',
      });
    },

    subscribePush: async (subscription: any): Promise<any> => {
      return request('/notifications/subscribe', {
        method: 'POST',
        body: JSON.stringify(subscription),
      });
    },

    unsubscribePush: async (endpoint: string): Promise<any> => {
      return request('/notifications/unsubscribe', {
        method: 'POST',
        body: JSON.stringify({ endpoint }),
      });
    },

    getVapidPublicKey: async (): Promise<{ publicKey: string }> => {
      return request('/notifications/vapid-public-key');
    },
  }
}
