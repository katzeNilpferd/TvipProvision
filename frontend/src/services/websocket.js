/**
 * WebSocket сервис для управления подключением к статистике сети
 * 
 * Предоставляет singleton для управления WebSocket соединением:
 * - Автоматическое переподключение при разрыве соединения
 * - Ping/pong для поддержания соединения
 * - Подписка/отписка от устройств
 * - Callback'и для получения данных и статуса подключения
 */

const API_STATS_URL = import.meta.env.VITE_API_STATS_URL || 'http://127.0.0.1:5757'

class StatisticsWebSocket {
  constructor() {
    this.ws = null;
    this.reconnectTimeout = null;
    this.pingInterval = null;
    this.isConnected = false;
    this.isRealtimeEnabled = false;
    this.deviceId = null;
    this.onMessageCallback = null;
    this.onConnectionChangeCallback = null;
    this.onUpdateCallback = null;
  }

  /**
   * Подключение к WebSocket серверу
   * @param {string} deviceId - ID устройства для подписки
   * @param {Function} onMessage - Callback при получении сообщения со статистикой
   * @param {Function} onConnectionChange - Callback при изменении статуса подключения
   * @param {Function} onUpdate - Callback при каждом обновлении данных
   */
  connect(deviceId, onMessage, onConnectionChange, onUpdate) {
    if (!this.isRealtimeEnabled) return;
    
    if (this.isConnected && this.deviceId === deviceId && this.ws?.readyState === WebSocket.OPEN) {
      this.onMessageCallback = onMessage;
      this.onConnectionChangeCallback = onConnectionChange;
      this.onUpdateCallback = onUpdate;
      console.log('WebSocket already connected to same device, callbacks updated');
      return;
    }

    if (this.ws) {
      this.ws.onclose = null; // Отключаем автоматический reconnect
      this.ws.close();
      this.ws = null;
    }
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }

    this.deviceId = deviceId;
    this.onMessageCallback = onMessage;
    this.onConnectionChangeCallback = onConnectionChange;
    this.onUpdateCallback = onUpdate;
    this.isConnected = false;
    
    try {
      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsHost = API_STATS_URL.replace(/^https?:\/\//, '');
      const wsUrl = `${wsProtocol}//${wsHost}/api/ws/statistics?device_id=${deviceId}`;
      
      console.log('Connecting to WebSocket:', wsUrl);
      this.ws = new WebSocket(wsUrl);
      
      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.isConnected = true;
        if (this.onConnectionChangeCallback) {
          this.onConnectionChangeCallback(true);
        }
        
        this.pingInterval = setInterval(() => {
          if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ action: 'ping' }));
          }
        }, 30000);
      };
      
      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          
          if ((message.type === 'network' || message.type === 'media') && message.data) {
            if (this.onMessageCallback) this.onMessageCallback(message);
            if (this.onUpdateCallback) this.onUpdateCallback(new Date());
            return;
          }
          
          if (message.type === 'statistics_update' && message.statistics) {
            if (this.onMessageCallback) this.onMessageCallback(message.statistics);
            if (this.onUpdateCallback) this.onUpdateCallback(new Date());
            return;
          }
          
          if (Array.isArray(message) || (message.stat && message.stat.received_bytes !== undefined)) {
            if (this.onMessageCallback) this.onMessageCallback(message);
            if (this.onUpdateCallback) this.onUpdateCallback(new Date());
          }
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err);
        }
      };
      
      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.isConnected = false;
        if (this.onConnectionChangeCallback) {
          this.onConnectionChangeCallback(false);
        }
      };
      
      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        this.isConnected = false;
        if (this.onConnectionChangeCallback) {
          this.onConnectionChangeCallback(false);
        }
        
        if (this.pingInterval) {
          clearInterval(this.pingInterval);
          this.pingInterval = null;
        }
        
        if (this.isRealtimeEnabled) {
          this.reconnectTimeout = setTimeout(() => {
            this.connect(this.deviceId, this.onMessageCallback, this.onConnectionChangeCallback, this.onUpdateCallback);
          }, 5000);
        }
      };
      
    } catch (err) {
      console.error('Failed to connect WebSocket:', err);
      this.isConnected = false;
      if (this.onConnectionChangeCallback) {
        this.onConnectionChangeCallback(false);
      }
    }
  }

  /**
   * Отключение от WebSocket сервера
   * Очищает все таймеры и закрывает соединение
   */
  disconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
    
    if (this.ws) {
      if (this.deviceId && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({
          action: 'unsubscribe',
          device_id: this.deviceId
        }));
      }
      
      this.ws.close();
      this.ws = null;
    }
    
    this.isConnected = false;
    if (this.onConnectionChangeCallback) {
      this.onConnectionChangeCallback(false);
    }
  }

  /**
   * Включение real-time режима и подключение к серверу
   * @param {string} deviceId - ID устройства для подписки
   * @param {Function} onMessage - Callback при получении сообщения со статистикой
   * @param {Function} onConnectionChange - Callback при изменении статуса подключения
   * @param {Function} onUpdate - Callback при каждом обновлении данных
   */
  enableRealtime(deviceId, onMessage, onConnectionChange, onUpdate) {
    this.isRealtimeEnabled = true;
    this.connect(deviceId, onMessage, onConnectionChange, onUpdate);
  }

  /**
   * Выключение real-time режима и отключение от сервера
   */
  disableRealtime() {
    this.isRealtimeEnabled = false;
    this.disconnect();
  }

  /**
   * Отправка произвольного сообщения через WebSocket
   * @param {Object} message - Объект сообщения для отправки
   */
  sendMessage(message) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  /**
   * Подписка на обновления конкретного устройства
   * @param {string} deviceId - ID устройства
   */
  subscribeToDevice(deviceId) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        action: 'subscribe',
        device_id: deviceId
      }));
    }
  }

  /**
   * Отписка от обновлений конкретного устройства
   * @param {string} deviceId - ID устройства
   */
  unsubscribeFromDevice(deviceId) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        action: 'unsubscribe',
        device_id: deviceId
      }));
    }
  }

  /**
   * Получение текущего статуса подключения
   * @returns {boolean} - true если подключено, иначе false
   */
  getConnectionStatus() {
    return this.isConnected;
  }

  /**
   * Очистка всех callback'ов
   * Используется при_cleanup_ для предотвращения утечек памяти
   */
  clearCallbacks() {
    this.onMessageCallback = null;
    this.onConnectionChangeCallback = null;
    this.onUpdateCallback = null;
  }
}

// Создаем singleton экземпляр
const statisticsWebSocket = new StatisticsWebSocket();

export default statisticsWebSocket;
