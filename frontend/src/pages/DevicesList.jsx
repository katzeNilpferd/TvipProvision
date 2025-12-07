import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Laptop, RefreshCw, Calendar, Network, Info, MoveUp } from 'lucide-react'
import { getDevices } from '../services/api'
import './DevicesList.css'

const DevicesList = () => {
  const [devices, setDevices] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [showScrollTop, setShowScrollTop] = useState(false)
  const [searchText, setSearchText] = useState('')

  const parseSearchQuery = (text) => {
    const params = {}
    const pairsRegex = /(\w+):"([^"]+)"|(\w+):'([^']+)'|(\w+):([^\s]+)/g
    let match
    while ((match = pairsRegex.exec(text)) !== null) {
      const key = (match[1] || match[3] || match[5]).toLowerCase()
      const value = match[2] || match[4] || match[6]
      if (key === 'ip') params.ip = value
      else if (key === 'model') params.model = value
      else if (["last_activity_after","last_after","after"].includes(key)) {
        const d = new Date(value)
        if (!isNaN(d)) params.last_activity_after = d.toISOString()
      } else if (["last_activity_before","last_before","before"].includes(key)) {
        const d = new Date(value)
        if (!isNaN(d)) params.last_activity_before = d.toISOString()
      } else if (key === 'limit') {
        const n = Number(value)
        if (!isNaN(n)) params.limit = n
      } else if (key === 'offset') {
        const n = Number(value)
        if (!isNaN(n)) params.offset = n
      }
    }
    const freeText = text.replace(pairsRegex, '').trim()
    if (freeText) {
      const ipPattern = /^(\d{1,3}\.){3}\d{1,3}$/
      if (ipPattern.test(freeText)) params.ip = freeText
      else params.model = freeText
    }
    return params
  }

  const buildParams = () => parseSearchQuery(searchText)

  useEffect(() => {
    loadDevices()
  }, [])

  useEffect(() => {
    const onScroll = () => {
      setShowScrollTop(window.pageYOffset > 300)
    }
    window.addEventListener('scroll', onScroll)
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const loadDevices = async (overrideParams) => {
    try {
      setRefreshing(true)
      const params = overrideParams ?? buildParams()
      const data = await getDevices(params)
      setDevices(data)
    } catch (error) {
      console.error('Failed to load devices:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleSearch = () => {
    loadDevices()
  }

  const handleClear = () => {
    setSearchText('')
    loadDevices({})
  }

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Never'
    
    let normalizedDateString = dateString
    if (!dateString.endsWith('Z')) {
      normalizedDateString += 'Z'
    }
    
    const date = new Date(normalizedDateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now - date) / 1000)
    
    // If the difference is negative or more than 30 days, show formatted date
    if (diffInSeconds < 0 || diffInSeconds > 24 * 60 * 60) {
      return date.toLocaleString('en-EN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }
    
    // Show relative time
    if (diffInSeconds < 60) {
      return 'Just now'
    } else if (diffInSeconds < 60 * 60) {
      const minutes = Math.floor(diffInSeconds / 60)
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`
    } else if (diffInSeconds < 24 * 60 * 60) {
      const hours = Math.floor(diffInSeconds / (60 * 60))
      return `${hours} hour${hours > 1 ? 's' : ''} ago`
    } else {
      const days = Math.floor(diffInSeconds / (24 * 60 * 60))
      return `${days} day${days > 1 ? 's' : ''} ago`
    }
  }

  if (loading) return <div className="loading">Loading devices...</div>

  return (
    <div className="page devices-list-page">
      {/* Header */}
      <div className="page-header">
        <div className="header-title">
          <h1>Devices</h1>
        </div>
        
        <div className="actions">
          <form onSubmit={(e) => { e.preventDefault(); handleSearch(); }} className="search-form">
            <input
              type="text"
              className="search-input"
              placeholder='Search: ip:1.2.3.4 model:"TVIP S-520" after:2025-11-01 limit:20'
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
            <span className="info-button" role="button" tabIndex="0" aria-label="Search help">
              <Info size={16} />
              <div className="info-tooltip">
                <div className="tooltip-title">Search parameters</div>
                <ul>
                  <li>ip:1.2.3.4</li>
                  <li>model:s530</li>
                  <li>after:2025-11-01 или 2025-11-01T00:00:00</li>
                  <li>before:2025-11-05</li>
                  <li>limit:20</li>
                  <li>offset:0</li>
                </ul>
                <div className="tooltip-note">Параметры и их значения укаываются без дополнительных пробелов.</div>
              </div>
            </span>
            <button type="submit" className="btn btn-primary">Search</button>
          </form>
          <button onClick={handleClear} className="btn btn-secondary" disabled={refreshing}>
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
      {/* Scroll to top */}
      {showScrollTop && (
        <button className="scroll-to-top" onClick={scrollToTop} aria-label="Back to top">
          <MoveUp size={40} strokeWidth={4} />
        </button>
      )}
      </div>
    </div>
  )
}

export default DevicesList
