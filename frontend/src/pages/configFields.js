// configFields.js
export const CONFIG_FIELDS = {
  basic: [
    { key: 'provision.@reload', label: 'Reload Interval (seconds)', type: 'number' },
    { key: 'provision.operator.@name', label: 'Operator Name' },
    { key: 'provision.update_server.@name', label: 'Update Server' },
    { key: 'provision.provision_server.@name', label: 'Provisioning Server' },
    { key: 'provision.syslog_host.@name', label: 'Syslog Server' }
  ],
  network: [
    { key: 'provision.tr69_server.@url', label: 'ACS URL' },
    { key: 'provision.tr69_server.@user', label: 'ACS Username' },
    { key: 'provision.tr69_server.@password', label: 'ACS Password', type: 'password' },
    { key: 'provision.statistics.@url', label: 'Statistics Server' },
    { key: 'provision.statistics.@accum_period', label: 'Statistics Period (sec)', type: 'number' }
  ],
  tv: [
    { 
      key: 'provision.tv_stream.@type', 
      label: 'Stream Type', 
      type: 'select',
      options: [
        { value: 'multicast', label: 'Multicast' },
        { value: 'udpxy', label: 'UDP Proxy' }
      ]
    },
    { key: 'provision.tv_stream.@server', label: 'Stream Server' },
    { key: 'provision.tv_stream.@tsbuffer', label: 'TS Buffer (ms)', type: 'number' }
  ],
  ui: [
    { key: 'provision.logo.@url', label: 'Logo URL' },
    { key: 'provision.banner.@url', label: 'Banner URL' },
    { key: 'provision.bootlogo.@url', label: 'Boot Logo URL' },
    { key: 'provision.time.@tz', label: 'Time Zone' },
    { key: 'provision.time.@ntp', label: 'NTP Server' },
    { 
      key: 'provision.time.@time_format', 
      label: 'Time Format', 
      type: 'select',
      options: [
        { value: '24', label: '24-hour' },
        { value: '12', label: '12-hour' }
      ]
    }
  ],
  security: [
    { 
      key: 'provision.security.enabled.@value', 
      label: 'Security Enabled', 
      type: 'select',
      options: [
        { value: 'true', label: 'Enabled' },
        { value: 'false', label: 'Disabled' }
      ]
    },
    { key: 'provision.security.password.@value', label: 'Security Password', type: 'password' },
    { key: 'provision.security.autolock_timeout.@value', label: 'Auto Lock Timeout (sec)', type: 'number' }
  ],
  apps: [
    { 
      key: 'provision.features.tv.@enabled', 
      label: 'TV App', 
      type: 'select',
      options: [
        { value: 'true', label: 'Enabled' },
        { value: 'false', label: 'Disabled' }
      ]
    },
    { 
      key: 'provision.features.mediaplayer.@enabled', 
      label: 'Media Player', 
      type: 'select',
      options: [
        { value: 'true', label: 'Enabled' },
        { value: 'false', label: 'Disabled' }
      ]
    },
    { 
      key: 'provision.features.dvr.@enabled', 
      label: 'DVR', 
      type: 'select',
      options: [
        { value: 'true', label: 'Enabled' },
        { value: 'false', label: 'Disabled' }
      ]
    },
    { 
      key: 'provision.features.cctv.@enabled', 
      label: 'CCTV', 
      type: 'select',
      options: [
        { value: 'true', label: 'Enabled' },
        { value: 'false', label: 'Disabled' }
      ]
    },
    { 
      key: 'provision.features.vod.@enabled', 
      label: 'VOD', 
      type: 'select',
      options: [
        { value: 'true', label: 'Enabled' },
        { value: 'false', label: 'Disabled' }
      ]
    },
    { 
      key: 'provision.features.timeshift.@enabled', 
      label: 'TimeShift', 
      type: 'select',
      options: [
        { value: 'true', label: 'Enabled' },
        { value: 'false', label: 'Disabled' }
      ]
    }
  ],
  system: [
    { 
      key: 'provision.display.hd_format.@value', 
      label: 'HD Format', 
      type: 'select',
      options: [
        { value: 'auto', label: 'Auto' },
        { value: '2160p50', label: '2160p50' },
        { value: '2160p60', label: '2160p60' },
        { value: '1080p50', label: '1080p50' },
        { value: '1080p60', label: '1080p60' }
      ]
    },
    { 
      key: 'provision.display.aspect.@value', 
      label: 'Aspect Ratio', 
      type: 'select',
      options: [
        { value: 'box', label: 'Box' },
        { value: 'zoom', label: 'Zoom' },
        { value: 'full', label: 'Full' }
      ]
    },
    { key: 'provision.auto_standby.@timeout', label: 'Auto Standby (sec)', type: 'number' },
    { key: 'provision.updates.update_period.@value', label: 'Update Check Period (sec)', type: 'number' }
  ]
}

export const TABS = [
  { id: 'basic', name: 'Basic', icon: 'Settings' },
  { id: 'network', name: 'Network', icon: 'Globe' },
  { id: 'tv', name: 'TV & Media', icon: 'Tv' },
  { id: 'ui', name: 'UI & Appearance', icon: 'Palette' },
  { id: 'security', name: 'Security', icon: 'Shield' },
  { id: 'apps', name: 'Applications', icon: 'Monitor' },
  { id: 'system', name: 'System', icon: 'Server' }
]