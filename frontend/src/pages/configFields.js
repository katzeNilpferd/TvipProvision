// configFields.js

export const CONFIG_FIELDS = {
  // ==================== 1. UPDATE & SERVER MANAGEMENT ====================
  updates: [
    { group: 'Update Server', key: 'provision.update_server.@name', label: 'Update Server URL', type: 'text', description: 'since 1.0.28' },
    { group: 'Provisioning Server', key: 'provision.provision_server.@name', label: 'Alternate Provisioning Server', type: 'text', description: 'since 3.1.0' },
    { 
      group: 'Update Types', 
      key: 'provision.update_types', 
      label: 'Device Update Types',
      type: 'collection',
      itemType: 'device',
      template: {
        '@id': '',
        '@force_type': '',
        '@force_os': '',
        'type': []
      },
      fields: [
        { key: '@id', label: 'Device Model ID', type: 'text', placeholder: 'e.g., s400a' },
        { key: '@force_type', label: 'Force Update Type', type: 'select', options: [
            { value: '', label: 'Not forced' },
            { value: 'release', label: 'Release' },
            { value: 'beta', label: 'Beta' }
          ] 
        },
        { key: '@force_os', label: 'Force OS Type', type: 'select', options: [
            { value: '', label: 'Not forced' },
            { value: 'linux', label: 'Linux' },
            { value: 'linux-qt', label: 'Linux-Qt' },
            { value: 'android', label: 'Android' }
          ] 
        },
        {
          key: 'type',
          label: 'OS Types',
          type: 'subcollection',
          template: {
            '@name': '',
            '@os': '',
            '@type': 'release'
          },
          fields: [
            { key: '@name', label: 'Display Name', type: 'text', placeholder: 'Android/Beta' },
            { key: '@os', label: 'OS', type: 'select', options: [
                { value: 'linux', label: 'Linux' },
                { value: 'linux-qt', label: 'Linux-Qt' },
                { value: 'android', label: 'Android' }
              ] 
            },
            { key: '@type', label: 'Update Type', type: 'select', options: [
                { value: 'release', label: 'Release' },
                { value: 'beta', label: 'Beta' }
              ] 
            }
          ]
        }
      ]
    },
    { group: 'Update Settings', key: 'provision.updates.update_background.@value', label: 'Background Update', type: 'select', options: [
        { value: 'true', label: 'Enabled' },
        { value: 'false', label: 'Disabled' }
      ], description: 'since 3.4.0' },
    { group: 'Update Settings', key: 'provision.updates.update_background.@force', label: 'Force Background Update', type: 'select', options: [
        { value: 'true', label: 'Yes' },
        { value: 'false', label: 'No' }
      ] },
    { group: 'Update Settings', key: 'provision.updates.update_force.@value', label: 'Force Update (no cancel)', type: 'select', options: [
        { value: 'true', label: 'Yes' },
        { value: 'false', label: 'No' }
      ] },
    { group: 'Update Settings', key: 'provision.updates.update_force.@force', label: 'Force This Setting', type: 'select', options: [
        { value: 'true', label: 'Yes' },
        { value: 'false', label: 'No' }
      ] },
    { group: 'Update Settings', key: 'provision.updates.update_period.@value', label: 'Update Check Period (seconds)', type: 'number', min: 3600, max: 86400, placeholder: '10800', description: 'since 3.4.0' },
    { group: 'Update Settings', key: 'provision.updates.update_period.@force', label: 'Force Update Period', type: 'select', options: [
        { value: 'true', label: 'Yes' },
        { value: 'false', label: 'No' }
      ] },
    { group: 'Restart', key: 'provision.restart.@value', label: 'Restart Type', type: 'select', options: [
        { value: '', label: 'None' },
        { value: 'reboot', label: 'Reboot device' },
        { value: 'shell', label: 'Reinitialize app' }
      ], description: 'since 3.4.0' }
  ],

  // ==================== 2. MONITORING & LOGGING ====================
  monitoring: [
    { group: 'Syslog', key: 'provision.syslog_host.@name', label: 'Syslog Server IP', type: 'text', description: 'since 3.9.13' },
    { group: 'Statistics', key: 'provision.statistics.@url', label: 'Statistics Server URL', type: 'text', description: 'since 4.0.13' },
    { group: 'Statistics', key: 'provision.statistics.@accum_period', label: 'Accumulation Period (sec)', type: 'number', placeholder: '45', dependsOn: { key: 'provision.statistics.@url', notEmpty: true } },
    { group: 'Statistics - Media', key: 'provision.statistics.media.@period', label: 'Media Statistics Period (sec)', type: 'number', dependsOn: { key: 'provision.statistics.@url', notEmpty: true }, description: 'if not set - only on stop' },
    { group: 'Statistics - Network', key: 'provision.statistics.network.@period', label: 'Network Statistics Period (sec)', type: 'number', dependsOn: { key: 'provision.statistics.@url', notEmpty: true } },
    { group: 'TR-069 (ACS)', key: 'provision.tr69_server.@url', label: 'ACS URL', type: 'text', description: 'since 3.8.6' },
    { group: 'TR-069 (ACS)', key: 'provision.tr69_server.@user', label: 'ACS Username', type: 'text', dependsOn: { key: 'provision.tr69_server.@url', notEmpty: true } },
    { group: 'TR-069 (ACS)', key: 'provision.tr69_server.@password', label: 'ACS Password', type: 'password', dependsOn: { key: 'provision.tr69_server.@url', notEmpty: true } }
  ],

  // ==================== 3. BRANDING & APPEARANCE ====================
  branding: [
    { group: 'Operator', key: 'provision.operator.@name', label: 'Operator Name', type: 'text' },
    { group: 'Operator', key: 'provision.operator.@tv_app_name', label: 'TV App Name', type: 'text', description: 'since 3.8.11' },
    { group: 'Operator', key: 'provision.operator.@tv_app_icon', label: 'TV App Icon ID', type: 'text', description: 'since 3.8.11' },
    { group: 'Logo', key: 'provision.logo.@url', label: 'Logo URL (PNG)', type: 'text' },
    { group: 'Banner', key: 'provision.banner.@url', label: 'Banner URL (PNG)', type: 'text', description: 'since 4.0.11' },
    { group: 'Banner', key: 'provision.banner.@uri', label: 'Banner Click URI', type: 'text', description: 'since 4.1.9' },
    { group: 'Boot Logo', key: 'provision.bootlogo.@url', label: 'Boot Logo URL (BMP)', type: 'text', description: 'since 3.4.0' },
    { group: 'Main Menu Background', key: 'provision.main_menu_background.@url', label: 'Background URL', type: 'text', description: 'since 4.2.33' },
    { group: 'Main Menu Background', key: 'provision.main_menu_background.@refresh', label: 'Refresh Interval (sec)', type: 'number', placeholder: '3600' },
    
    // Appearance sub-items
    { group: 'Interface - Animation', key: 'provision.appearance.animation.@value', label: 'Enable Animations', type: 'select', options: [
        { value: 'true', label: 'Yes' },
        { value: 'false', label: 'No' }
      ] },
    { group: 'Interface - Animation', key: 'provision.appearance.animation.@force', label: 'Force Animations', type: 'select', options: [
        { value: 'true', label: 'Yes' },
        { value: 'false', label: 'No' }
      ] },
    { group: 'Interface - Lists', key: 'provision.appearance.listlooped.@value', label: 'Loop Lists', type: 'select', options: [
        { value: 'true', label: 'Yes' },
        { value: 'false', label: 'No' }
      ] },
    { group: 'Interface - TV', key: 'provision.appearance.tv_preview_mode.@value', label: 'TV Preview Mode', type: 'select', options: [
        { value: 'true', label: 'Preview current channel' },
        { value: 'false', label: 'No preview' },
        { value: 'hybrid', label: 'Preview channel under cursor' }
      ] },
    { group: 'Interface - TV', key: 'provision.appearance.tv_cursor_mode.@value', label: 'TV Cursor Mode', type: 'select', options: [
        { value: 'true', label: 'Yes' },
        { value: 'false', label: 'No' }
      ] },
    { group: 'Interface - TV', key: 'provision.appearance.display_channel_numbers.@value', label: 'Show Channel Numbers', type: 'select', options: [
        { value: 'true', label: 'Yes' },
        { value: 'false', label: 'No' }
      ], description: 'since 4.0.17' },
    { group: 'Interface - TV', key: 'provision.appearance.channel_icons_aspect.@value', label: 'Channel Icons Aspect Ratio', type: 'text', placeholder: '1.777', description: 'since 4.0.20' },
    { group: 'Interface - Navigation', key: 'provision.appearance.home_uri.@value', label: 'Home Button URI', type: 'text', placeholder: 'tvplayer/?channel=1', description: 'since 4.2.12' },
    { group: 'Interface - TV', key: 'provision.appearance.display_channel_has_archive.@value', label: 'Show Archive Icon', type: 'select', options: [
        { value: 'true', label: 'Yes' },
        { value: 'false', label: 'No' }
      ], description: 'since 4.2.16' },
    { group: 'Interface - Media', key: 'provision.appearance.media_freeze_animation.@value', label: 'Disable Freeze Animation', type: 'select', options: [
        { value: 'true', label: 'Yes (disable)' },
        { value: 'false', label: 'No (keep)' }
      ], description: 'since 4.2.33' },
    { group: 'Interface - Buttons', key: 'provision.appearance.back_as_recall.@value', label: 'Back as Recall (previous channel)', type: 'select', options: [
        { value: 'true', label: 'Yes' },
        { value: 'false', label: 'No' }
      ], description: 'since 5.0.67' },
    { group: 'Interface - Buttons', key: 'provision.appearance.menu_as_home.@value', label: 'Menu as Home in TV app', type: 'select', options: [
        { value: 'true', label: 'Yes' },
        { value: 'false', label: 'No' }
      ], description: 'since 5.0.67' },
    { group: 'Interface - Buttons', key: 'provision.appearance.menu_as_audio_track.@value', label: 'Menu for Audio Track switching', type: 'select', options: [
        { value: 'true', label: 'Yes' },
        { value: 'false', label: 'No' }
      ], description: 'since 5.1.45' },
    { group: 'Background Picture', key: 'provision.appearance.background_picture.@value', label: 'Background Picture ID', type: 'text', description: 'since 4.2.16' },
    { group: 'Background Picture', key: 'provision.appearance.background_picture.@force', label: 'Force Background', type: 'select', options: [
        { value: 'true', label: 'Yes' },
        { value: 'false', label: 'No' }
      ] },
    { group: 'Color Schemes', key: 'provision.appearance.color_schemes.@override', label: 'Override Built-in Schemes', type: 'select', options: [
        { value: 'true', label: 'Yes' },
        { value: 'false', label: 'No' }
      ], description: 'since 4.0.17' },
    { group: 'Color Schemes', key: 'provision.appearance.color_schemes.@default', label: 'Default Scheme Name', type: 'text' },
    { group: 'Color Schemes', key: 'provision.appearance.color_schemes.@force', label: 'Force Scheme Name', type: 'text' }
  ],

  // ==================== 4. SYSTEM SETTINGS ====================
  system: [
    { group: 'Time', key: 'provision.time.@tz', label: 'Time Zone (zoneinfo)', type: 'text', placeholder: 'Europe/Moscow' },
    { group: 'Time', key: 'provision.time.@ntp', label: 'NTP Server', type: 'text', placeholder: 'ru.pool.ntp.org' },
    { group: 'Time', key: 'provision.time.@time_format', label: 'Time Format', type: 'select', options: [
        { value: '24', label: '24-hour' },
        { value: '12', label: '12-hour' }
      ], description: 'since 4.2.3' },
    { group: 'Display - HDMI', key: 'provision.display.hd_format.@value', label: 'HDMI Format', type: 'select', options: [
        { value: 'auto', label: 'Auto' },
        { value: '2160p50', label: '2160p50' },
        { value: '2160p60', label: '2160p60' },
        { value: '1080p50', label: '1080p50' },
        { value: '1080p60', label: '1080p60' },
        { value: '1080i50', label: '1080i50' },
        { value: '720p50', label: '720p50' },
        { value: '720p60', label: '720p60' },
        { value: '576i50', label: '576i50' }
      ] },
    { group: 'Display - HDMI', key: 'provision.display.hdmi_autofr.@value', label: 'Auto Frame Rate', type: 'select', options: [
        { value: 'true', label: 'Enabled' },
        { value: 'false', label: 'Disabled' }
      ] },
    { group: 'Display - SD', key: 'provision.display.sd_format.@value', label: 'SD Format', type: 'select', options: [
        { value: 'auto', label: 'Auto' },
        { value: 'pal', label: 'PAL' },
        { value: 'ntsc', label: 'NTSC' }
      ] },
    { group: 'Display - Aspect', key: 'provision.display.aspect.@value', label: 'Aspect Ratio', type: 'select', options: [
        { value: 'box', label: 'Box' },
        { value: 'zoom', label: 'Zoom' },
        { value: 'full', label: 'Full' }
      ] },
    { group: 'Display - CEC', key: 'provision.display.cec.@value', label: 'HDMI-CEC', type: 'select', options: [
        { value: 'true', label: 'Enabled' },
        { value: 'false', label: 'Disabled' }
      ] },
    { group: 'Display - CEC', key: 'provision.display.cec.@force', label: 'Force CEC', type: 'select', options: [
        { value: 'true', label: 'Yes' },
        { value: 'false', label: 'No' }
      ] },
    { group: 'Display - CEC', key: 'provision.display.sync_standby.@value', label: 'Sync Standby with TV', type: 'select', options: [
        { value: 'true', label: 'Enabled' },
        { value: 'false', label: 'Disabled' }
      ], description: 'since 4.0.13' },
    { group: 'Display - CEC', key: 'provision.display.cec_name.@value', label: 'CEC Device Name', type: 'text', maxLength: 14, description: 'since 5.1.26' },
    { group: 'Power', key: 'provision.auto_standby.@timeout', label: 'Auto Standby Timeout (seconds)', type: 'number', min: 0, max: 2500000, placeholder: '3600', description: 'since 3.8.6, 0=off' },
    { group: 'Power', key: 'provision.auto_standby.@force', label: 'Force Auto Standby', type: 'select', options: [
        { value: 'true', label: 'Yes' },
        { value: 'false', label: 'No' }
      ] },
    { group: 'Media Defaults', key: 'provision.media.default_audio_language.@value', label: 'Default Audio Language', type: 'text', placeholder: 'rus ru eng en', description: 'since 4.0.19, ISO codes' },
    { group: 'Media Defaults', key: 'provision.media.default_audio_language.@force', label: 'Force Audio Language', type: 'select', options: [
        { value: 'true', label: 'Yes' },
        { value: 'false', label: 'No' }
      ] },
    { group: 'Media Defaults', key: 'provision.media.default_subtitle_language.@value', label: 'Default Subtitle Language', type: 'text', placeholder: 'rus ru', description: 'since 4.0.19' },
    { group: 'Media Defaults', key: 'provision.media.default_subtitle_language.@force', label: 'Force Subtitle Language', type: 'select', options: [
        { value: 'true', label: 'Yes' },
        { value: 'false', label: 'No' }
      ] }
  ],

  // ==================== 5. APPLICATIONS & FEATURES ====================
  applications: [
    { group: 'Features - TV', key: 'provision.features.tv.@enabled', label: 'TV App', type: 'select', options: [
        { value: 'true', label: 'Enabled' },
        { value: 'false', label: 'Disabled' }
      ] },
    { group: 'Features - Media', key: 'provision.features.mediaplayer.@enabled', label: 'Media Player', type: 'select', options: [
        { value: 'true', label: 'Enabled' },
        { value: 'false', label: 'Disabled' }
      ] },
    { group: 'Features - DVR', key: 'provision.features.dvr.@enabled', label: 'DVR', type: 'select', options: [
        { value: 'true', label: 'Enabled' },
        { value: 'false', label: 'Disabled' }
      ] },
    { group: 'Features - CCTV', key: 'provision.features.cctv.@enabled', label: 'CCTV', type: 'select', options: [
        { value: 'true', label: 'Enabled' },
        { value: 'false', label: 'Disabled' }
      ] },
    { group: 'Features - VOD', key: 'provision.features.vod.@enabled', label: 'VOD', type: 'select', options: [
        { value: 'true', label: 'Enabled' },
        { value: 'false', label: 'Disabled' }
      ] },
    { group: 'Features - Browser', key: 'provision.features.navigator.@enabled', label: 'Browser (Navigator)', type: 'select', options: [
        { value: 'true', label: 'Enabled' },
        { value: 'false', label: 'Disabled' }
      ], description: 'since 3.9.x' },
    { group: 'Features - Timeshift', key: 'provision.features.timeshift.@enabled', label: 'Local Timeshift', type: 'select', options: [
        { value: 'true', label: 'Enabled' },
        { value: 'false', label: 'Disabled' }
      ], description: 'since 4.2.33' },
    { group: 'Features - RuStore', key: 'provision.features.rustore.@enabled', label: 'RuStore App Store', type: 'select', options: [
        { value: 'true', label: 'Enabled' },
        { value: 'false', label: 'Disabled' }
      ], description: 'since 5.1.26, Android' },
    { group: 'Features - AppStore', key: 'provision.features.appstore.@enabled', label: 'TVIP App Store (7xx)', type: 'select', options: [
        { value: 'true', label: 'Enabled' },
        { value: 'false', label: 'Disabled' }
      ] },
    { group: 'Web Apps', key: 'provision.webapps.@reordering', label: 'Allow Web App Reordering', type: 'select', options: [
        { value: 'true', label: 'Yes' },
        { value: 'false', label: 'No' }
      ], description: 'since 5.0.48' },
    { group: 'Web Apps', key: 'provision.webapps.@override', label: 'Override Default Web Apps', type: 'select', options: [
        { value: 'true', label: 'Yes' },
        { value: 'false', label: 'No' }
      ], description: 'deprecated' },
    { group: 'Android Apps', key: 'provision.android_apps', label: 'Android Apps Configuration', type: 'textarea', description: 'JSON configuration for Android apps, since 5.0.30' }
  ],

  // ==================== 6. TV & MIDDLEWARE ====================
  tv: [
    { group: 'Stream Settings', key: 'provision.tv_stream.@type', label: 'Stream Type', type: 'select', options: [
        { value: 'multicast', label: 'Multicast' },
        { value: 'udpxy', label: 'UDP Proxy' }
      ] },
    { group: 'Stream Settings', key: 'provision.tv_stream.@server', label: 'UDPxy Server', type: 'text', dependsOn: { key: 'provision.tv_stream.@type', value: 'udpxy' }, placeholder: 'http://user:pass@host:4022' },
    { group: 'Stream Settings', key: 'provision.tv_stream.@tsbuffer', label: 'MPEG-TS Buffer (ms)', type: 'number', placeholder: '0', description: 'since 3.3.1' },
    { group: 'Stream Settings', key: 'provision.tv_stream.@tsboost', label: 'TS Boost', type: 'select', options: [
        { value: 'true', label: 'Enabled' },
        { value: 'false', label: 'Disabled' }
      ], description: 'since 4.2.33, disable audio cut' },
    { group: 'Stream Settings', key: 'provision.tv_stream.@hls_version', label: 'HLS Version', type: 'text', placeholder: '4', description: 'since 4.2.33' },
    { group: 'Stream Settings', key: 'provision.tv_stream.@speedtest_url', label: 'Speedtest Config URL', type: 'text', description: 'since 4.2.20/4.3.4' },

    { group: 'TV Protocols - General', key: 'provision.tv_protocols.@default', label: 'Default Middleware Type', type: 'select', options: [
        { value: 'jsonapi', label: 'TVIP JSON API' },
        { value: 'm3u', label: 'M3U Playlist' },
        { value: 'iptvportal', label: 'IPTV PORTAL' },
        { value: 'browser', label: 'Browser Portal (Linux-Qt)' },
        { value: 'androidapp', label: 'Android App (Android OS)' }
      ] },
    { group: 'TV Protocols - General', key: 'provision.tv_protocols.@force', label: 'Force Middleware Type', type: 'select', options: [
        { value: '', label: 'Not forced' },
        { value: 'jsonapi', label: 'Force JSON API' },
        { value: 'm3u', label: 'Force M3U' },
        { value: 'iptvportal', label: 'Force IPTV PORTAL' },
        { value: 'browser', label: 'Force Browser' },
        { value: 'androidapp', label: 'Force Android App' }
      ] },
    { group: 'TV Protocols - General', key: 'provision.tv_protocols.@autostart', label: 'Autostart TV App', type: 'select', options: [
        { value: 'true', label: 'Yes' },
        { value: 'false', label: 'No' }
      ] },
    
    // JSON API specific
    { group: 'TV Protocols - JSON API', key: 'provision.tv_protocols.protocol.@server', label: 'JSON API Server URL', type: 'text', dependsOn: { key: 'provision.tv_protocols.@default', value: 'jsonapi' } },
    { group: 'TV Protocols - JSON API', key: 'provision.tv_protocols.protocol.@hidden', label: 'Hide Server URL', type: 'select', options: [
        { value: 'true', label: 'Hidden' },
        { value: 'false', label: 'Visible' }
      ], dependsOn: { key: 'provision.tv_protocols.@default', value: 'jsonapi' }, description: 'since 5.0.7' },
    
    // M3U specific
    { group: 'TV Protocols - M3U', key: 'provision.tv_protocols.protocol.@m3u', label: 'M3U Playlist URL', type: 'text', dependsOn: { key: 'provision.tv_protocols.@default', value: 'm3u' } },
    { group: 'TV Protocols - M3U', key: 'provision.tv_protocols.protocol.@epg', label: 'EPG URL (XMLTV/JTV)', type: 'text', dependsOn: { key: 'provision.tv_protocols.@default', value: 'm3u' } },
    
    // IPTV Portal specific
    { group: 'TV Protocols - IPTV Portal', key: 'provision.tv_protocols.protocol.@server', label: 'Portal Server', type: 'text', dependsOn: { key: 'provision.tv_protocols.@default', value: 'iptvportal' } },
    
    // Browser Portal specific
    { group: 'TV Protocols - Browser', key: 'provision.tv_protocols.protocol.@server', label: 'Portal URL', type: 'text', dependsOn: { key: 'provision.tv_protocols.@default', value: 'browser' } },
    { group: 'TV Protocols - Browser', key: 'provision.tv_protocols.protocol.@api', label: 'API Type', type: 'select', options: [
        { value: 'tvip', label: 'TVIP' },
        { value: 'mag', label: 'MAG' },
        { value: 'html5', label: 'HTML5' }
      ], dependsOn: { key: 'provision.tv_protocols.@default', value: 'browser' } },
    { group: 'TV Protocols - Browser', key: 'provision.tv_protocols.protocol.@noui', label: 'Replace Whole UI', type: 'select', options: [
        { value: 'true', label: 'Yes' },
        { value: 'false', label: 'No' }
      ], dependsOn: { key: 'provision.tv_protocols.@default', value: 'browser' }, description: 'deprecated' },
    { group: 'TV Protocols - Browser', key: 'provision.tv_protocols.protocol.@combined', label: 'Combined Mode', type: 'select', options: [
        { value: 'true', label: 'Yes' },
        { value: 'false', label: 'No' }
      ], dependsOn: { key: 'provision.tv_protocols.@default', value: 'browser' }, description: 'since 4.0.23' },
    { group: 'TV Protocols - Browser', key: 'provision.tv_protocols.protocol.@proxy', label: 'HTTP Proxy', type: 'text', dependsOn: { key: 'provision.tv_protocols.@default', value: 'browser' } },
    { group: 'TV Protocols - Browser', key: 'provision.tv_protocols.protocol.@uiwidth', label: 'UI Width', type: 'number', placeholder: '1280', dependsOn: { key: 'provision.tv_protocols.@default', value: 'browser' } },
    { group: 'TV Protocols - Browser', key: 'provision.tv_protocols.protocol.@uiheight', label: 'UI Height', type: 'number', placeholder: '720', dependsOn: { key: 'provision.tv_protocols.@default', value: 'browser' } },
    { group: 'TV Protocols - Browser', key: 'provision.tv_protocols.protocol.@cas', label: 'CAS Type', type: 'text', placeholder: 'ares', dependsOn: { key: 'provision.tv_protocols.@default', value: 'browser' } },
    { group: 'TV Protocols - Browser', key: 'provision.tv_protocols.protocol.@multi_portal', label: 'Multi Portal Manager', type: 'select', options: [
        { value: 'true', label: 'Enabled' },
        { value: 'false', label: 'Disabled' }
      ], dependsOn: { key: 'provision.tv_protocols.@default', value: 'browser' }, description: 'since 3.8.19' },
    { group: 'TV Protocols - Browser', key: 'provision.tv_protocols.protocol.@multi_portal_params', label: 'Multi Portal Parameters', type: 'text', dependsOn: { key: 'provision.tv_protocols.@default', value: 'browser' }, description: 'format: server1=Name|url|default&server2=Name2|url2' },
    { group: 'TV Protocols - Browser', key: 'provision.tv_protocols.protocol.@force_retry', label: 'Force Retry', type: 'select', options: [
        { value: 'true', label: 'Yes' },
        { value: 'false', label: 'No' }
      ], dependsOn: { key: 'provision.tv_protocols.@default', value: 'browser' }, description: 'since 5.0.16' },
    { group: 'TV Protocols - Browser', key: 'provision.tv_protocols.protocol.@waiting_animation', label: 'Waiting Animation', type: 'select', options: [
        { value: 'true', label: 'Show' },
        { value: 'false', label: 'Hide' }
      ], dependsOn: { key: 'provision.tv_protocols.@default', value: 'browser' }, description: 'Android since 5.1.10' },
    
    // Android App specific
    { group: 'TV Protocols - Android App', key: 'provision.protocol.@package', label: 'Android App Package', type: 'text', dependsOn: { key: 'provision.tv_protocols.@default', value: 'androidapp' } },
    { group: 'TV Protocols - Android App', key: 'provision.protocol.@autostart', label: 'Autostart App', type: 'select', options: [
        { value: 'true', label: 'Yes' },
        { value: 'false', label: 'No' }
      ], dependsOn: { key: 'provision.tv_protocols.@default', value: 'androidapp' }, description: 'since 5.0.25' }
  ],

  // ==================== 7. SECURITY & RESTRICTIONS ====================
  security: [
    { group: 'Parental Control - Main', key: 'provision.security.enabled.@value', label: 'Security Mode', type: 'select', options: [
        { value: 'true', label: 'Enabled' },
        { value: 'false', label: 'Disabled' }
      ] },
    { group: 'Parental Control - Main', key: 'provision.security.enabled.@force', label: 'Force Security Mode', type: 'select', options: [
        { value: 'true', label: 'Yes' },
        { value: 'false', label: 'No' }
      ] },
    { group: 'Parental Control - Main', key: 'provision.security.password.@value', label: 'Security Password', type: 'password', dependsOn: { key: 'provision.security.enabled.@value', value: 'true' } },
    { group: 'Parental Control - Main', key: 'provision.security.password.@force', label: 'Force Password', type: 'select', options: [
        { value: 'true', label: 'Yes' },
        { value: 'false', label: 'No' }
      ] },
    { group: 'Parental Control - Timeout', key: 'provision.security.autolock_timeout.@value', label: 'Auto Lock Timeout (seconds)', type: 'number', placeholder: '600', dependsOn: { key: 'provision.security.enabled.@value', value: 'true' } },
    { group: 'Parental Control - Timeout', key: 'provision.security.autolock_timeout.@force', label: 'Force Auto Lock', type: 'select', options: [
        { value: 'true', label: 'Yes' },
        { value: 'false', label: 'No' }
      ] },
    { group: 'Parental Control - Channels', key: 'provision.security.channel_default_locked.@value', label: 'Channel Lock Mode', type: 'select', options: [
        { value: 'true', label: 'Blacklist (default locked)' },
        { value: 'false', label: 'Whitelist (default unlocked)' }
      ] },
    { group: 'Parental Control - Channels', key: 'provision.security.channel_adult_lock.@value', label: 'Adult Channels Lock', type: 'select', options: [
        { value: 'true', label: 'Lock' },
        { value: 'false', label: 'Do not lock' }
      ], description: 'up to 3.8' },
    { group: 'Parental Control - Channels', key: 'provision.security.operator_forced_age.@value', label: 'Force Age Restriction', type: 'number', placeholder: '18', description: 'since 4.0.11, years' },
    { group: 'Parental Control - Apps', key: 'provision.security.disabled_apps.@value', label: 'Apps Requiring PIN', type: 'text', placeholder: 'youtube,okko', description: 'comma-separated' },
    { group: 'Parental Control - Apps', key: 'provision.security.disabled_apps.@force', label: 'Force Disabled Apps', type: 'select', options: [
        { value: 'true', label: 'Yes' },
        { value: 'false', label: 'No' }
      ] },
    
    { group: 'System Locks - CTV', key: 'provision.system_locks.ctv.@enabled', label: 'Cable TV Mode', type: 'select', options: [
        { value: 'true', label: 'Enabled' },
        { value: 'false', label: 'Disabled' }
      ], description: 'since 4.2.33' },
    { group: 'System Locks - CTV', key: 'provision.system_locks.ctv.@url', label: 'CTV Stream URL', type: 'text', dependsOn: { key: 'provision.system_locks.ctv.@enabled', value: 'true' } },
    { group: 'System Locks - CTV', key: 'provision.system_locks.ctv.@volume', label: 'CTV Volume', type: 'number', min: 0, max: 100, placeholder: '30', dependsOn: { key: 'provision.system_locks.ctv.@enabled', value: 'true' } },
    { group: 'System Locks - Debug', key: 'provision.system_locks.sysinfo_del.@locked', label: 'Lock Debug Info', type: 'select', options: [
        { value: 'true', label: 'Locked' },
        { value: 'false', label: 'Unlocked' }
      ], description: 'since 3.3.10, s.info->DEL' },
    { group: 'System Locks - Reset', key: 'provision.system_locks.reset.@locked', label: 'Lock Factory Reset', type: 'select', options: [
        { value: 'true', label: 'Locked' },
        { value: 'false', label: 'Unlocked' }
      ], description: 'since 3.4.4, key combo' },
    { group: 'System Locks - Network', key: 'provision.system_locks.igmpv1_block.@enabled', label: 'Block IGMPv1', type: 'select', options: [
        { value: 'true', label: 'Block' },
        { value: 'false', label: 'Allow' }
      ], description: 'since 4.0.13, Linux-Qt' }
  ],

  // ==================== 8. ADDITIONAL RESOURCES ====================
  resources: [
    { group: 'Mount Points - SMB', key: 'provision.mountpoints.mountpoint.@type', label: 'Mount Type', type: 'select', options: [
        { value: 'smb', label: 'SMB' },
        { value: 'nfs', label: 'NFS' }
      ] },
    { group: 'Mount Points - SMB', key: 'provision.mountpoints.mountpoint.@mountname', label: 'Mount Name', type: 'text', placeholder: 'SMB Share' },
    { group: 'Mount Points - SMB', key: 'provision.mountpoints.mountpoint.address.@value', label: 'Server Address', type: 'text', dependsOn: { key: 'provision.mountpoints.mountpoint.@type', value: 'smb' } },
    { group: 'Mount Points - SMB', key: 'provision.mountpoints.mountpoint.folder.@value', label: 'Share Folder', type: 'text', dependsOn: { key: 'provision.mountpoints.mountpoint.@type', value: 'smb' } },
    { group: 'Mount Points - SMB', key: 'provision.mountpoints.mountpoint.username.@value', label: 'Username', type: 'text', dependsOn: { key: 'provision.mountpoints.mountpoint.@type', value: 'smb' } },
    { group: 'Mount Points - SMB', key: 'provision.mountpoints.mountpoint.password.@value', label: 'Password', type: 'password', dependsOn: { key: 'provision.mountpoints.mountpoint.@type', value: 'smb' } },
    
    { group: 'Mount Points - NFS', key: 'provision.mountpoints.mountpoint.@type', label: 'Mount Type', type: 'select', options: [
        { value: 'smb', label: 'SMB' },
        { value: 'nfs', label: 'NFS' }
      ] },
    { group: 'Mount Points - NFS', key: 'provision.mountpoints.mountpoint.@mountname', label: 'Mount Name', type: 'text', placeholder: 'NFS Share' },
    { group: 'Mount Points - NFS', key: 'provision.mountpoints.mountpoint.address.@value', label: 'Server Address', type: 'text', dependsOn: { key: 'provision.mountpoints.mountpoint.@type', value: 'nfs' } },
    { group: 'Mount Points - NFS', key: 'provision.mountpoints.mountpoint.folder.@value', label: 'Export Path', type: 'text', dependsOn: { key: 'provision.mountpoints.mountpoint.@type', value: 'nfs' }, placeholder: '/export/video' },
    
    { group: 'CCTV Sources', key: 'provision.cctv_sources.source.@name', label: 'Source Name', type: 'text', placeholder: 'Cameras' },
    { group: 'CCTV Sources', key: 'provision.cctv_sources.source.@url', label: 'Source URL', type: 'text', placeholder: 'http://cam.operator.com/cameras.m3u' },
    
    { group: 'App Store', key: 'provision.appstore_server.@url', label: 'TVIP App Store URL', type: 'text', description: 'since 4.4.1, Android' },
    
    { group: 'Preferences - Network', key: 'provision.preferences.pref_network.@visible', label: 'Show Network Settings', type: 'select', options: [
        { value: 'true', label: 'Visible' },
        { value: 'false', label: 'Hidden' }
      ] },
    { group: 'Preferences - TV', key: 'provision.preferences.pref_tv.pref_tv_streamtype.@visible', label: 'Show Stream Type Setting', type: 'select', options: [
        { value: 'true', label: 'Visible' },
        { value: 'false', label: 'Hidden' }
      ] },
    { group: 'Preferences - TV', key: 'provision.preferences.pref_tv.pref_tv_middleware.@disabled', label: 'Disable Middleware Change', type: 'select', options: [
        { value: 'true', label: 'Disabled' },
        { value: 'false', label: 'Enabled' }
      ] }
  ]
};

// Export tabs with new structure
export const TABS = [
  { id: 'updates', name: 'Updates & Servers', icon: 'Server' },
  { id: 'monitoring', name: 'Monitoring & Logging', icon: 'Activity' },
  { id: 'branding', name: 'Branding & UI', icon: 'Palette' },
  { id: 'system', name: 'System Settings', icon: 'Settings' },
  { id: 'applications', name: 'Applications', icon: 'Monitor' },
  { id: 'tv', name: 'TV & Middleware', icon: 'Tv' },
  { id: 'security', name: 'Security', icon: 'Shield' },
  { id: 'resources', name: 'Additional Resources', icon: 'Database' }
];