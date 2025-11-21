import axios from 'axios'

const API_BASE_URL = 'http://127.0.0.1:7373/api'

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
  const response = await api.get('/devices', { params: query })
  return response.data
}

export const getDeviceConfig = async (macAddress) => {
  const response = await api.get(`/devices/${macAddress}/config`)
  return response.data
}

export const replaceDeviceConfig = async (macAddress, newConfig) => {
  const response = await api.put(`/devices/${macAddress}/config/replace`, newConfig)
  return response.data
}

export const resetDeviceConfig = async (macAddress) => {
  const response = await api.post(`/devices/${macAddress}/config/reset`)
  return response.data
}

export const getDefaultConfig = async () => {
  const response = await api.get('/default/config')
  return response.data
}

export const replaceDefaultConfig = async (newConfig) => {
  const response = await api.put('/default/config/replace', newConfig)
  return response.data
}

export default api
