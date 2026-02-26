import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { 
  ArrowLeft, Save, RotateCcw, RefreshCw, 
  Settings, Globe, Tv, Palette, 
  Shield, Monitor, Server, Activity, Database,
  ChevronRight
} from 'lucide-react'
import lodash from 'lodash'
import dot from 'dot-object'
import { getDeviceConfig, replaceDeviceConfig, resetDeviceConfig } from '../services/api'
import { CONFIG_FIELDS, TABS } from './configFields'
import { useAuth } from '../context/AuthContext'
import CollectionManager from '../components/CollectionManager'
import './DeviceConfig.css'

// Сопоставление иконок
const ICON_MAP = {
  Settings, Globe, Tv, Palette, Shield, Monitor, Server, Activity, Database
}

const DeviceConfig = () => {
  const authEnabled = import.meta.env.VITE_AUTH_ENABLED === 'true';

  const { macAddress } = useParams()
  const { isAuthenticated, user, handleUnauthorized } = useAuth()
  const isAdmin = authEnabled ? user?.is_admin === true : true
  const [config, setConfig] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState({})
  const [originalData, setOriginalData] = useState({})
  const [refreshing, setRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState('updates')
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
      const simpleData = data?.config?.parameters?.provision 
        ? dot.dot(data?.config?.parameters)
        : {}

      setFormData(simpleData)
      setOriginalData(simpleData)
    } catch (error) {
      console.error('Failed to load device config:', error)
      if (error.response?.status === 401) {
        handleUnauthorized();
      } else {
        alert('Failed to load device configuration: ' + (error.response?.data?.detail || error.message));
      }
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  // Создаем полную структуру для API (replace)
  const prepareDataForSave = () => {
    const fullConfig = {}

    Object.entries(formData).forEach(([key, value]) => {
      if (value) fullConfig[key] = value
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
      if (error.response?.status === 401) {
        handleUnauthorized();
      } else if (error.response?.status === 403) {
        alert('Admin privileges required to save configuration')
      } else {
        alert('Failed to save configuration: ' + (error.response?.data?.detail || error.message));
      }
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
        if (error.response?.status === 401) {
          handleUnauthorized();
        } else if (error.response?.status === 403) {
          alert('Admin privileges required to reset configuration')
        } else {
          alert('Failed to reset configuration: ' + (error.response?.data?.detail || error.message));
        }
      }
    }
  }

  const shouldShowField = (fieldConfig) => {
    const { key, dependsOn } = fieldConfig
    if (!dependsOn) return true

    const depValue = formData[dependsOn.key]
    const currentValue = formData[key]
    
    if (currentValue && currentValue.trim() !== '') {
      return true
    }
    
    if (dependsOn.notEmpty) {
      return depValue && depValue.trim() !== ''
    } else if (dependsOn.value !== undefined) {
      return depValue === dependsOn.value
    }
    
    return true
  }

  // Рендерим поле ввода
  const renderField = (fieldConfig, isDependent = false) => {
    const { key, label, type = 'text', options = [], description, dependsOn } = fieldConfig;

    // Для коллекций используем отдельный компонент
    if (type === 'collection') {
      const collectionValue = lodash.get(config.config.parameters, key)

      return (
        <div key={key} className={`param-row collection-row ${isDependent ? 'dependent-field' : ''}`}>
          {isDependent && <ChevronRight size={16} className="dependency-icon" />}
          <CollectionManager
            fieldConfig={fieldConfig}
            value={collectionValue}
            onChange={(path, value) => {
              const newFormData = { ...formData };

              Object.keys(newFormData)
                .filter(key => key.startsWith(`${path}`))
                .forEach(key => delete newFormData[key])

              setFormData(
                Object.assign(
                  newFormData, lodash.mapKeys(
                    dot.dot(value),
                    (v, k) => `${path}${k}`
                  )
                )
              )
            }}
            editing={editing}
            path={key}
            formData={formData}
          />
        </div>
      );
    }

    // Обычные поля
    const value = formData[key] || '';

    return (
      <div key={key} className={`param-row ${isDependent ? 'dependent-field' : ''}`}>
        {isDependent && <ChevronRight size={16} className="dependency-icon" />}
        <label className="param-label">{label}</label>
        {editing ? (
          <div className="param-control">
            {type === 'select' ? (
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
            ) : type === 'textarea' ? (
              <textarea
                value={value}
                onChange={(e) => setFormData(prev => ({ ...prev, [key]: e.target.value }))}
                className="param-textarea"
                rows={4}
              />
            ) : (
              <input
                type={type}
                value={value}
                onChange={(e) => setFormData(prev => ({ ...prev, [key]: e.target.value }))}
                className="param-input"
                placeholder={fieldConfig.placeholder}
                min={fieldConfig.min}
                max={fieldConfig.max}
              />
            )}
            {/* {description && <span className="field-description">{description}</span>} */}
          </div>
        ) : (
          <span className={`param-value ${!value ? 'empty' : ''}`}>
            {value || 'Not set'}
          </span>
        )}
      </div>
    );
  };

  // Рекурсивный рендеринг полей с учетом зависимостей
  const renderFieldsWithDependencies = (fields) => {
    // Сначала отфильтровываем поля, которые не должны показываться
    const visibleFields = fields.filter(shouldShowField)
    
    // Группируем независимые поля
    const independentFields = visibleFields.filter(f => !f.dependsOn)
    
    // Функция для рекурсивного рендеринга зависимых полей
    const renderDependentFields = (parentKey) => {
      const dependentFields = visibleFields.filter(f => f.dependsOn && f.dependsOn.key === parentKey)
      
      if (dependentFields.length === 0) return null
      
      return (
        <div className="dependent-fields-group">
          {dependentFields.map(field => {
            return (
              <div key={field.key}>
                {renderField(field, true)}
                {/* Рекурсивно рендерим поля, зависящие от этого поля */}
                {renderDependentFields(field.key)}
              </div>
            )
          })}
        </div>
      )
    }

    return (
      <>
        {/* Независимые поля */}
        {independentFields.map(field => {
          return (
            <div key={field.key}>
              {renderField(field, false)}
              {/* Рекурсивно рендерим поля, зависящие от этого поля */}
              {renderDependentFields(field.key)}
            </div>
          )
        })}
      </>
    )
  }

  if (loading) return <div className="loading">Loading configuration...</div>
  if (!config) return <div className="error">Device not found</div>

  const ActiveTabIcon = ICON_MAP[TABS.find(tab => tab.id === activeTab)?.icon] || Settings

  const fields = CONFIG_FIELDS[activeTab] || []
  const groupedFields = fields.reduce((acc, field) => {
    const group = field.group || 'Other'
    if (!acc[group]) acc[group] = []
    acc[group].push(field)
    return acc
  }, {})

  return (
    <div className="page device-config-page">
      {/* Шапка */}
      <div className="page-header">
        {(!authEnabled || isAuthenticated) && (
          <Link to="/devices" className="back-button">
            <ArrowLeft size={20} />
            Back
          </Link>
        )}
        
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
                disabled={saving || (authEnabled && !isAuthenticated)}
              >
                <Save size={16} />
                {saving ? 'Saving...' : 'Save'}
              </button>
              <button 
                onClick={() => {
                  setEditing(false)
                  setFormData(originalData)
                }} 
                className="btn btn-secondary"
                disabled={saving}
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              {authEnabled ? (
                isAuthenticated ? (
                  <>
                    <button 
                      onClick={() => setEditing(true)} 
                      className="btn btn-primary"
                      disabled={!isAdmin}
                      title={!isAdmin ? "Admin privileges required to edit configuration" : ""}
                    >
                      Edit Configuration
                    </button>
                    <button 
                      onClick={handleReset} 
                      className="btn btn-warning"
                      disabled={!isAdmin}
                      title={!isAdmin ? "Admin privileges required to reset configuration" : ""}
                    >
                      <RotateCcw size={16} />
                      Reset
                    </button>
                  </>
                ) : (
                  <>
                    <button className="btn btn-primary"
                      title="Please log in to edit configuration"
                      disabled
                    >
                      Edit Configuration
                    </button>
                    <button className="btn btn-warning"
                      title="Please log in to reset configuration"
                      disabled
                    >
                        <RotateCcw size={16} />
                        Reset
                    </button>
                  </>
                )
              ) : (
                // When auth is disabled, allow all operations
                <>
                  <button 
                    onClick={() => setEditing(true)} 
                    className="btn btn-primary"
                  >
                    Edit Configuration
                  </button>
                  <button 
                    onClick={handleReset} 
                    className="btn btn-warning"
                  >
                    <RotateCcw size={16} />
                    Reset
                  </button>
                </>
              )}
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
          {Object.entries(groupedFields).map(([groupName, groupFields]) => (
            <div key={groupName} className="config-group">
              <h3 className="group-title">{groupName}</h3>
              {renderFieldsWithDependencies(groupFields)}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default DeviceConfig