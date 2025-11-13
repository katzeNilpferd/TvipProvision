import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { 
  ArrowLeft, Save, RotateCcw, RefreshCw, 
  Settings, Globe, Tv, Palette, Shield, Monitor, Server 
} from 'lucide-react'
import { getDeviceConfig, replaceDeviceConfig, resetDeviceConfig } from '../services/api'
import { CONFIG_FIELDS, TABS } from './configFields'
import './DeviceConfig.css'

// Сопоставление иконок
const ICON_MAP = {
  Settings, Globe, Tv, Palette, Shield, Monitor, Server
}

const DeviceConfig = () => {
  const { macAddress } = useParams()
  const [config, setConfig] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState({})
  const [refreshing, setRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState('basic')
  const [saving, setSaving] = useState(false)

  // Загружаем конфигурацию устройства
  useEffect(() => {
    loadDeviceConfig()
  }, [macAddress])

  const loadDeviceConfig = async () => {
    try {
      setRefreshing(true)
      const data = await getDeviceConfig(macAddress)
      setConfig(data)
      
      // Преобразуем данные в простой формат
      const simpleData = {}
      if (data?.config?.parameters?.provision) {
        flattenObject(data.config.parameters.provision, 'provision', simpleData)
      }
      setFormData(simpleData)
    } catch (error) {
      console.error('Failed to load device config:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  // Преобразуем вложенные объекты в плоскую структуру
  const flattenObject = (obj, path = '', result = {}) => {
    for (const key in obj) {
      const newPath = path ? `${path}.${key}` : key
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        flattenObject(obj[key], newPath, result)
      } else {
        result[newPath] = String(obj[key])
      }
    }
  }

  // Создаем вложенную структуру для API (replace)
  const prepareDataForSave = () => {
    const fullConfig = {}

    Object.entries(formData).forEach(([key, value]) => {
      fullConfig[key] = value ?? ''
    })

    return fullConfig
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      const dataToReplace = prepareDataForSave()
      await replaceDeviceConfig(macAddress, dataToReplace)
      setEditing(false)
      await loadDeviceConfig()
    } catch (error) {
      console.error('Failed to save config:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleReset = async () => {
    if (window.confirm('Reset all settings to default?')) {
      try {
        await resetDeviceConfig(macAddress)
        loadDeviceConfig()
        setEditing(false)
      } catch (error) {
        console.error('Failed to reset config:', error)
      }
    }
  }

  // Рендерим поле ввода
  const renderField = (fieldConfig) => {
    const { key, label, type = 'text', options = [] } = fieldConfig
    const value = formData[key] || ''

    return (
      <div key={key} className="param-row">
        <label className="param-label">{label}</label>
        {editing ? (
          type === 'select' ? (
            <select
              value={value}
              onChange={(e) => setFormData(prev => ({ ...prev, [key]: e.target.value }))}
              className="param-select"
            >
              <option value="">Not set</option>
              {options.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          ) : (
            <input
              type={type}
              value={value}
              onChange={(e) => setFormData(prev => ({ ...prev, [key]: e.target.value }))}
              className="param-input"
            />
          )
        ) : (
          <span className="param-value">{value || 'Not set'}</span>
        )}
      </div>
    )
  }

  if (loading) return <div className="loading">Loading configuration...</div>
  if (!config) return <div className="error">Device not found</div>

  const ActiveTabIcon = ICON_MAP[TABS.find(tab => tab.id === activeTab)?.icon] || Settings

  return (
    <div className="page device-config-page">
      {/* Шапка */}
      <div className="page-header">
        <Link to="/devices" className="back-button">
          <ArrowLeft size={20} />
          Back to Devices
        </Link>
        
        <div className="header-title">
          <div className="device-identity">
            <span className="mac-address">{config.device.mac_address}</span>
          </div>
        </div>
        
        <div className="actions">
          <button onClick={loadDeviceConfig} className="btn btn-secondary" disabled={refreshing}>
            <RefreshCw size={16} className={refreshing ? 'spinning' : ''} />
            Refresh
          </button>
          
          {editing ? (
            <>
              <button 
                onClick={handleSave} 
                className="btn btn-primary" 
                disabled={saving}
              >
                <Save size={16} />
                {saving ? 'Saving...' : 'Save'}
              </button>
              <button onClick={() => setEditing(false)} className="btn btn-secondary">
                Cancel
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setEditing(true)} className="btn btn-primary">
                Edit Configuration
              </button>
              <button onClick={handleReset} className="btn btn-warning">
                <RotateCcw size={16} />
                Reset
              </button>
            </>
          )}
        </div>
      </div>

      {/* Основной контент */}
      <div className="config-container">
        {/* Вкладки */}
        <div className="tabs-navigation">
          {TABS.map(tab => {
            const IconComponent = ICON_MAP[tab.icon]
            return (
              <button
                key={tab.id}
                className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <IconComponent size={16} />
                {tab.name}
              </button>
            )
          })}
        </div>

        {/* Содержимое вкладки */}
        <div className="tab-content">
          <div className="tab-header">
            <ActiveTabIcon size={20} />
            <h2>{TABS.find(tab => tab.id === activeTab)?.name} Settings</h2>
          </div>

          <div className="config-section">
            <div className="config-group">
              {CONFIG_FIELDS[activeTab]?.map(field => renderField(field))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DeviceConfig