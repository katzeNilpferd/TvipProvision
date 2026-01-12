import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BACKEND_URL || 'http://127.0.0.1:7373'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false,
})

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const authData = localStorage.getItem('authData');
    if (authData) {
      const parsedData = JSON.parse(authData);
      const token = parsedData.token?.access_token;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Remove token and redirect to login (this would be handled by the calling component)
      localStorage.removeItem('authToken');
    }
    return Promise.reject(error);
  }
);

export const getDevices = async (params = {}) => {
  // Filter out null/undefined/empty strings
  const query = Object.fromEntries(
    Object.entries(params).filter(([_, v]) => v !== undefined && v !== null && v !== '')
  )
  const response = await api.get('/api/devices', { params: query })
  return response.data
}

export const getDeviceConfig = async (macAddress) => {
  const response = await api.get(`/api/devices/${macAddress}/config`)
  return response.data
}

export const replaceDeviceConfig = async (macAddress, newConfig) => {
  const response = await api.put(`/api/devices/${macAddress}/config/replace`, newConfig)
  return response.data
}

export const resetDeviceConfig = async (macAddress) => {
  const response = await api.post(`/api/devices/${macAddress}/config/reset`)
  return response.data
}

export const getDefaultConfig = async () => {
  const response = await api.get('/api/default/config')
  return response.data
}

export const replaceDefaultConfig = async (newConfig) => {
  const response = await api.put('/api/default/config/replace', newConfig)
  return response.data
}

export const login = async (username, password) => {
  const response = await api.post('/api/auth/login', { username, password });
  return response;
};

export const register = async (username, password) => {
  const response = await api.post('/api/auth/register', { username, password });
  return response;
};

export const validateToken = async (token) => {
  const response = await api.post('/api/auth/validate', { token });
  return response.data;
};

export const changePassword = async (userId, currentPassword, newPassword) => {
  const response = await api.post(`/api/users/${userId}/change-password`, {
    current_password: currentPassword,
    new_password: newPassword
  });
  return response.data;
};

export default api
