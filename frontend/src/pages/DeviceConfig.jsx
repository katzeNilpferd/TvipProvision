import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { 
  ArrowLeft, Save, RotateCcw, RefreshCw, Power, Network, 
  Server, Monitor, Wifi, Shield, Palette, Tv, Video,
  Settings, Globe, Download, Users, Image, Clock
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { getDeviceConfig, updateDeviceConfig } from '../services/api'
import './DeviceConfig.css'

const DeviceConfig = () => {
  const { macAddress } = useParams()
  const [config, setConfig] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState({})
  const [refreshing, setRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState('basic')

  const tabs = [
    { id: 'basic', name: 'Basic', icon: Settings },
    { id: 'network', name: 'Network', icon: Globe },
    { id: 'tv', name: 'TV & Media', icon: Tv },
    { id: 'ui', name: 'UI & Appearance', icon: Palette },
    { id: 'security', name: 'Security', icon: Shield },
    { id: 'apps', name: 'Applications', icon: Monitor },
    { id: 'system', name: 'System', icon: Server }
  ]

  useEffect(() => {
    loadDeviceConfig()
  }, [macAddress])

  const loadDeviceConfig = async () => {
    try {
      setRefreshing(true)
      const data = await getDeviceConfig(macAddress)
      console.log('Loaded config:', data)
      
      const processedData = processConfigData(data)
      setConfig(data)
      setFormData(processedData)
    } catch (error) {
      console.error('Failed to load device config:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const processConfigData = (data) => {
    if (!data?.config?.parameters) return initializeDefaultForm()
    
    const processed = {}
    
    // Обрабатываем структуру provision
    if (data.config.parameters.provision) {
      const provision = data.config.parameters.provision
      
      // Атрибуты provision
      if (provision['@reload']) processed['provision.@reload'] = provision['@reload']
      
      // Вложенные объекты
      if (provision.provision_server) {
        processed['provision.provision_server.@name'] = provision.provision_server['@name'] || ''
      }
      if (provision.operator) {
        processed['provision.operator.@name'] = provision.operator['@name'] || ''
      }
      if (provision.syslog_host) {
        processed['provision.syslog_host.@name'] = provision.syslog_host['@name'] || ''
      }
      if (provision.update_server) {
        processed['provision.update_server.@name'] = provision.update_server['@name'] || ''
      }
      if (provision.tr69_server) {
        processed['provision.tr69_server.@url'] = provision.tr69_server['@url'] || ''
        processed['provision.tr69_server.@user'] = provision.tr69_server['@user'] || ''
        processed['provision.tr69_server.@password'] = provision.tr69_server['@password'] || ''
      }
    }
    
    // Добавляем недостающие поля по умолчанию
    const defaultForm = initializeDefaultForm()
    return { ...defaultForm, ...processed }
  }

  const initializeDefaultForm = () => {
    return {
      // Provision attributes
      'provision.@reload': '86400',
      
      // Basic services
      'provision.provision_server.@name': '',
      'provision.operator.@name': '',
      'provision.syslog_host.@name': '',
      'provision.update_server.@name': 'update.tvip.tv',
      
      // TR-069
      'provision.tr69_server.@url': '',
      'provision.tr69_server.@user': '',
      'provision.tr69_server.@password': '',
      
      // Statistics
      'provision.statistics.@url': '',
      'provision.statistics.@accum_period': '45',
      
      // TV Stream
      'provision.tv_stream.@type': 'multicast',
      'provision.tv_stream.@server': '',
      'provision.tv_stream.@tsbuffer': '0',
      
      // TV Protocols
      'provision.tv_protocols.@default': 'jsonapi',
      'provision.tv_protocols.@autostart': 'true',
      
      // Security
      'provision.security.enabled.@value': 'false',
      'provision.security.enabled.@force': 'false',
      'provision.security.password.@value': '0000',
      'provision.security.password.@force': 'false',
      'provision.security.autolock_timeout.@value': '600',
      
      // UI Elements
      'provision.logo.@url': '',
      'provision.banner.@url': '',
      'provision.bootlogo.@url': '',
      
      // Time
      'provision.time.@tz': 'Europe/Moscow',
      'provision.time.@ntp': 'pool.ntp.org',
      'provision.time.@time_format': '24',
      
      // Features
      'provision.features.tv.@enabled': 'true',
      'provision.features.mediaplayer.@enabled': 'true',
      'provision.features.dvr.@enabled': 'true',
      'provision.features.cctv.@enabled': 'true',
      'provision.features.vod.@enabled': 'true',
      'provision.features.timeshift.@enabled': 'false',
      
      // Display
      'provision.display.hd_format.@value': '1080p50',
      'provision.display.aspect.@value': 'box',
      'provision.display.cec.@value': 'false',
      'provision.display.cec.@force': 'false',
      
      // System
      'provision.auto_standby.@timeout': '0',
      'provision.auto_standby.@force': 'false',
      
      // Updates
      'provision.updates.update_period.@value': '86400',
      'provision.updates.update_period.@force': 'false',
      'provision.updates.update_background.@value': 'false',
      'provision.updates.update_background.@force': 'false'
    }
  }

  const prepareDataForSave = () => {
    // Собираем данные в правильную структуру для API
    const provisionData = {
      '@reload': formData['provision.@reload'] || '86400',
      provision_server: { '@name': formData['provision.provision_server.@name'] || '' },
      operator: { '@name': formData['provision.operator.@name'] || '' },
      syslog_host: { '@name': formData['provision.syslog_host.@name'] || '' },
      update_server: { '@name': formData['provision.update_server.@name'] || '' }
    }

    // Добавляем опциональные поля если они заполнены
    if (formData['provision.tr69_server.@url']) {
      provisionData.tr69_server = {
        '@url': formData['provision.tr69_server.@url'],
        '@user': formData['provision.tr69_server.@user'] || '',
        '@password': formData['provision.tr69_server.@password'] || ''
      }
    }

    if (formData['provision.statistics.@url']) {
      provisionData.statistics = {
        '@url': formData['provision.statistics.@url'],
        '@accum_period': formData['provision.statistics.@accum_period'] || '45'
      }
    }

    if (formData['provision.tv_stream.@type']) {
      provisionData.tv_stream = {
        '@type': formData['provision.tv_stream.@type'],
        '@server': formData['provision.tv_stream.@server'] || '',
        '@tsbuffer': formData['provision.tv_stream.@tsbuffer'] || '0'
      }
    }

    if (formData['provision.tv_protocols.@default']) {
      provisionData.tv_protocols = {
        '@default': formData['provision.tv_protocols.@default'],
        '@autostart': formData['provision.tv_protocols.@autostart'] || 'true'
      }
    }

    // Security
    if (formData['provision.security.enabled.@value']) {
      provisionData.security = {
        enabled: {
          '@value': formData['provision.security.enabled.@value'],
          '@force': formData['provision.security.enabled.@force'] || 'false'
        },
        password: {
          '@value': formData['provision.security.password.@value'] || '0000',
          '@force': formData['provision.security.password.@force'] || 'false'
        },
        autolock_timeout: {
          '@value': formData['provision.security.autolock_timeout.@value'] || '600'
        }
      }
    }

    // UI Elements
    if (formData['provision.logo.@url']) {
      provisionData.logo = { '@url': formData['provision.logo.@url'] }
    }
    if (formData['provision.banner.@url']) {
      provisionData.banner = { '@url': formData['provision.banner.@url'] }
    }
    if (formData['provision.bootlogo.@url']) {
      provisionData.bootlogo = { '@url': formData['provision.bootlogo.@url'] }
    }

    // Time
    if (formData['provision.time.@tz']) {
      provisionData.time = {
        '@tz': formData['provision.time.@tz'],
        '@ntp': formData['provision.time.@ntp'] || 'pool.ntp.org',
        '@time_format': formData['provision.time.@time_format'] || '24'
      }
    }

    // Features
    provisionData.features = {
      tv: { '@enabled': formData['provision.features.tv.@enabled'] || 'true' },
      mediaplayer: { '@enabled': formData['provision.features.mediaplayer.@enabled'] || 'true' },
      dvr: { '@enabled': formData['provision.features.dvr.@enabled'] || 'true' },
      cctv: { '@enabled': formData['provision.features.cctv.@enabled'] || 'true' },
      vod: { '@enabled': formData['provision.features.vod.@enabled'] || 'true' },
      timeshift: { '@enabled': formData['provision.features.timeshift.@enabled'] || 'false' }
    }

    // Display
    provisionData.display = {
      hd_format: { '@value': formData['provision.display.hd_format.@value'] || '1080p50' },
      aspect: { '@value': formData['provision.display.aspect.@value'] || 'box' },
      cec: { 
        '@value': formData['provision.display.cec.@value'] || 'false',
        '@force': formData['provision.display.cec.@force'] || 'false'
      }
    }

    // System
    if (formData['provision.auto_standby.@timeout']) {
      provisionData.auto_standby = {
        '@timeout': formData['provision.auto_standby.@timeout'],
        '@force': formData['provision.auto_standby.@force'] || 'false'
      }
    }

    // Updates
    provisionData.updates = {
      update_period: {
        '@value': formData['provision.updates.update_period.@value'] || '86400',
        '@force': formData['provision.updates.update_period.@force'] || 'false'
      },
      update_background: {
        '@value': formData['provision.updates.update_background.@value'] || 'false',
        '@force': formData['provision.updates.update_background.@force'] || 'false'
      }
    }

    return { provision: provisionData }
  }

  const handleSave = async () => {
    try {
      const dataToSave = prepareDataForSave()
      console.log('Saving data:', dataToSave)
      await updateDeviceConfig(macAddress, dataToSave)
      setEditing(false)
      loadDeviceConfig()
    } catch (error) {
      console.error('Failed to update config:', error)
    }
  }

  const handleReset = async () => {
    if (window.confirm('Reset all settings to default?')) {
      setFormData(initializeDefaultForm())
    }
  }

  const renderField = (key, label, type = 'text', options = []) => {
    const value = formData[key] || ''
    
    return (
      <div key={key} className="param-row">
        <label className="param-label" title={key}>
          {label}
        </label>
        {editing ? (
          type === 'select' ? (
            <select
              value={value}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                [key]: e.target.value
              }))}
              className="param-select"
            >
              {options.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          ) : type === 'textarea' ? (
            <textarea
              value={value}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                [key]: e.target.value
              }))}
              className="param-textarea"
              rows={3}
            />
          ) : (
            <input
              type={type}
              value={value}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                [key]: e.target.value
              }))}
              className="param-input"
            />
          )
        ) : (
          <span className="param-value">{value || 'Not set'}</span>
        )}
      </div>
    )
  }

  const renderBooleanField = (key, label, forceKey = null) => {
    return (
      <div className="boolean-field-group">
        {renderField(key, label, 'select', [
          { value: 'true', label: 'Enabled' },
          { value: 'false', label: 'Disabled' }
        ])}
        {forceKey && renderField(forceKey, 'Force Setting', 'select', [
          { value: 'true', label: 'Force' },
          { value: 'false', label: 'Default' }
        ])}
      </div>
    )
  }

  if (loading) return <div className="loading">Loading configuration...</div>
  if (!config) return <div className="error">Device not found</div>

  const ActiveTabIcon = tabs.find(tab => tab.id === activeTab)?.icon || Settings

  return (
    <div className="page device-config-page">
      {/* Header */}
      <div className="page-header">
        <Link to="/devices" className="back-button">
          <ArrowLeft size={20} />
          Back to Devices
        </Link>
        <div className="header-title">
          <h1>TVIP Configuration</h1>
          <div className="device-identity">
            <span className="mac-address">{config.device.mac_address}</span>
            <span className={`status-dot ${config.device.status || 'online'}`}></span>
          </div>
        </div>
        <div className="actions">
          <button onClick={loadDeviceConfig} className="btn btn-secondary" disabled={refreshing}>
            <RefreshCw size={16} className={refreshing ? 'spinning' : ''} />
            Refresh
          </button>
          {editing ? (
            <>
              <button onClick={handleSave} className="btn btn-primary">
                <Save size={16} />
                Save Configuration
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
                Reset to Default
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Content with Tabs */}
      <div className="config-container">
        {/* Tabs Navigation */}
        <div className="tabs-navigation">
          {tabs.map(tab => {
            const IconComponent = tab.icon
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

        {/* Tab Content */}
        <div className="tab-content">
          <div className="tab-header">
            <ActiveTabIcon size={20} />
            <h2>{tabs.find(tab => tab.id === activeTab)?.name} Settings</h2>
          </div>

          <div className="config-section">
            {activeTab === 'basic' && (
              <div className="config-group">
                <h3>Basic Provisioning</h3>
                {renderField('provision.@reload', 'Reload Interval (seconds)', 'number')}
                {renderField('provision.operator.@name', 'Operator Name')}
                {renderField('provision.update_server.@name', 'Update Server')}
                
                <h3>Core Services</h3>
                {renderField('provision.provision_server.@name', 'Provisioning Server')}
                {renderField('provision.syslog_host.@name', 'Syslog Server')}
              </div>
            )}

            {activeTab === 'network' && (
              <div className="config-group">
                <h3>TR-069 Configuration</h3>
                {renderField('provision.tr69_server.@url', 'ACS URL')}
                {renderField('provision.tr69_server.@user', 'ACS Username')}
                {renderField('provision.tr69_server.@password', 'ACS Password', 'password')}
                
                <h3>Statistics</h3>
                {renderField('provision.statistics.@url', 'Statistics Server')}
                {renderField('provision.statistics.@accum_period', 'Statistics Period (sec)', 'number')}
              </div>
            )}

            {activeTab === 'tv' && (
              <div className="config-group">
                <h3>TV Stream Settings</h3>
                {renderField('provision.tv_stream.@type', 'Stream Type', 'select', [
                  { value: 'multicast', label: 'Multicast' },
                  { value: 'udpxy', label: 'UDP Proxy' }
                ])}
                {renderField('provision.tv_stream.@server', 'Stream Server')}
                {renderField('provision.tv_stream.@tsbuffer', 'TS Buffer (ms)', 'number')}
                
                <h3>Protocol Configuration</h3>
                {renderField('provision.tv_protocols.@default', 'Default Protocol', 'select', [
                  { value: 'jsonapi', label: 'JSON API' },
                  { value: 'm3u', label: 'M3U Playlist' },
                  { value: 'browser', label: 'Web Portal' }
                ])}
                {renderField('provision.tv_protocols.@autostart', 'Auto Start TV', 'select', [
                  { value: 'true', label: 'Enabled' },
                  { value: 'false', label: 'Disabled' }
                ])}
              </div>
            )}

            {activeTab === 'ui' && (
              <div className="config-group">
                <h3>Branding</h3>
                {renderField('provision.logo.@url', 'Logo URL')}
                {renderField('provision.banner.@url', 'Banner URL')}
                {renderField('provision.bootlogo.@url', 'Boot Logo URL')}
                
                <h3>Time Settings</h3>
                {renderField('provision.time.@tz', 'Time Zone')}
                {renderField('provision.time.@ntp', 'NTP Server')}
                {renderField('provision.time.@time_format', 'Time Format', 'select', [
                  { value: '24', label: '24-hour' },
                  { value: '12', label: '12-hour' }
                ])}
              </div>
            )}

            {activeTab === 'security' && (
              <div className="config-group">
                <h3>Parental Control</h3>
                {renderBooleanField(
                  'provision.security.enabled.@value', 
                  'Security Enabled',
                  'provision.security.enabled.@force'
                )}
                {renderField('provision.security.password.@value', 'Security Password', 'password')}
                {renderField('provision.security.autolock_timeout.@value', 'Auto Lock Timeout (sec)', 'number')}
              </div>
            )}

            {activeTab === 'apps' && (
              <div className="config-group">
                <h3>Application Features</h3>
                {renderField('provision.features.tv.@enabled', 'TV App', 'select', [
                  { value: 'true', label: 'Enabled' },
                  { value: 'false', label: 'Disabled' }
                ])}
                {renderField('provision.features.mediaplayer.@enabled', 'Media Player', 'select', [
                  { value: 'true', label: 'Enabled' },
                  { value: 'false', label: 'Disabled' }
                ])}
                {renderField('provision.features.dvr.@enabled', 'DVR', 'select', [
                  { value: 'true', label: 'Enabled' },
                  { value: 'false', label: 'Disabled' }
                ])}
                {renderField('provision.features.cctv.@enabled', 'CCTV', 'select', [
                  { value: 'true', label: 'Enabled' },
                  { value: 'false', label: 'Disabled' }
                ])}
                {renderField('provision.features.vod.@enabled', 'VOD', 'select', [
                  { value: 'true', label: 'Enabled' },
                  { value: 'false', label: 'Disabled' }
                ])}
                {renderField('provision.features.timeshift.@enabled', 'TimeShift', 'select', [
                  { value: 'true', label: 'Enabled' },
                  { value: 'false', label: 'Disabled' }
                ])}
              </div>
            )}

            {activeTab === 'system' && (
              <div className="config-group">
                <h3>Display Settings</h3>
                {renderField('provision.display.hd_format.@value', 'HD Format', 'select', [
                  { value: 'auto', label: 'Auto' },
                  { value: '2160p50', label: '2160p50' },
                  { value: '2160p60', label: '2160p60' },
                  { value: '1080p50', label: '1080p50' },
                  { value: '1080p60', label: '1080p60' },
                  { value: '720p50', label: '720p50' },
                  { value: '720p60', label: '720p60' }
                ])}
                {renderField('provision.display.aspect.@value', 'Aspect Ratio', 'select', [
                  { value: 'box', label: 'Box' },
                  { value: 'zoom', label: 'Zoom' },
                  { value: 'full', label: 'Full' }
                ])}
                {renderBooleanField(
                  'provision.display.cec.@value',
                  'HDMI-CEC',
                  'provision.display.cec.@force'
                )}
                
                <h3>System Behavior</h3>
                {renderField('provision.auto_standby.@timeout', 'Auto Standby (sec)', 'number')}
                
                <h3>Update Settings</h3>
                {renderField('provision.updates.update_period.@value', 'Update Check Period (sec)', 'number')}
                {renderBooleanField(
                  'provision.updates.update_background.@value',
                  'Background Update',
                  'provision.updates.update_background.@force'
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default DeviceConfig