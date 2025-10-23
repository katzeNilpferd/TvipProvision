import axios from 'axios'

const API_BASE_URL = 'http://127.0.0.1:7373/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false,
})

export const getDevices = async () => {
  const response = await api.get('/devices')
  return response.data
}

export const getDeviceConfig = async (macAddress) => {
  const response = await api.get(`/devices/${macAddress}/config`)
  return response.data
}

export const updateDeviceConfig = async (macAddress, updates) => {
  const response = await api.put(`/devices/${macAddress}/config`, updates)
  return response.data
}

export const getConfigs = async () => {
  const response = await api.get('/configs')
  return response.data
}

export default api
