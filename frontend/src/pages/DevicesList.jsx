import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Laptop, RefreshCw, Calendar, Network } from 'lucide-react'
import { getDevices } from '../services/api'
import './DevicesList.css'

const DevicesList = () => {
  const [devices, setDevices] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    loadDevices()
  }, [])

  const loadDevices = async () => {
    try {
      setRefreshing(true)
      const data = await getDevices()
      setDevices(data)
    } catch (error) {
      console.error('Failed to load devices:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Never'
    const date = new Date(dateString)
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) return <div className="loading">Loading devices...</div>

  return (
    <div className="page devices-list-page">
      {/* Header */}
      <div className="page-header">
        <div className="header-title">
          <h1>Devices</h1>
          <span className="device-count">{devices.length} device{devices.length !== 1 ? 's' : ''}</span>
        </div>
        
        <div className="actions">
          <button onClick={loadDevices} className="btn btn-secondary" disabled={refreshing}>
            <RefreshCw size={16} className={refreshing ? 'spinning' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* Devices Grid */}
      <div className="devices-grid">
        {devices.length === 0 ? (
          <div className="empty-state">
            <Laptop size={48} />
            <h3>No devices found</h3>
            <p>Devices will appear here once they connect to the provisioning service</p>
          </div>
        ) : (
          devices.map(device => (
            <Link 
              key={device.id} 
              to={`/devices/${device.mac_address}`}
              className="device-card"
            >
              <div className="device-header">
                <div className="device-icon">
                  <Laptop size={24} />
                </div>
                <div className="device-info">
                  <h3 className="device-model">{device.model || 'Unknown Model'}</h3>
                  <span className="device-mac">{device.mac_address}</span>
                </div>
              </div>

              <div className="device-details">
                <div className="detail-row">
                  <Network size={14} />
                  <span className="detail-label">IP Address:</span>
                  <span className="detail-value">{device.ip_address || 'N/A'}</span>
                </div>
                
                <div className="detail-row">
                  <Calendar size={14} />
                  <span className="detail-label">Last Activity:</span>
                  <span className="detail-value">{formatDate(device.last_activity)}</span>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}

export default DevicesList
