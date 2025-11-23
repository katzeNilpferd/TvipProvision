import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BACKEND_URL || 'http://127.0.0.1:7373'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false,
})

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

export default api
