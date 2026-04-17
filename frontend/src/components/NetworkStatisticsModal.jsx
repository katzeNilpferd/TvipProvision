import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { X, TrendingUp, TrendingDown, Activity, AlertTriangle, ZoomOut, Wifi, WifiOff } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { getNetworkStatistics } from '../services/api';
import statisticsWebSocket from '../services/websocket';
import './NetworkStatisticsModal.css';

// Константы для оптимизации
const MAX_DATA_POINTS = {
  '1h': 120,  // 30 секунд интервал
  '6h': 360,  // 1 минута интервал
  '24h': 288, // 5 минут интервал
  '3d': 288,  // 15 минут интервал
  '7d': 336   // 30 минут интервал
};

// Диапазоны, для которых доступен real-time
const REALTIME_ENABLED_RANGES = ['1h', '6h', '24h'];

// Алгоритм LTTB для сохранения визуальных особенностей при децимации
const lttb = (data, threshold) => {
  const dataLength = data.length;
  if (threshold >= dataLength || threshold === 0) {
    return data;
  }

  const sampled = [];
  let sampledIndex = 0;
  
  const bucketSize = (dataLength - 2) / (threshold - 2);
  
  let a = 0;
  const maxAreaPoint = { index: 0, area: -1 };
  
  sampled[sampledIndex++] = data[a];
  
  for (let i = 0; i < threshold - 2; i++) {
    let avgX = 0;
    let avgY = 0;
    let avgRangeStart = Math.floor((i + 1) * bucketSize) + 1;
    let avgRangeEnd = Math.floor((i + 2) * bucketSize) + 1;
    avgRangeEnd = avgRangeEnd < dataLength ? avgRangeEnd : dataLength;
    
    const avgRangeLength = avgRangeEnd - avgRangeStart;
    
    for (let j = avgRangeStart; j < avgRangeEnd; j++) {
      avgX += data[j].timestamp;
      avgY += data[j].receivedRate + data[j].sentRate;
    }
    avgX /= avgRangeLength;
    avgY /= avgRangeLength;
    
    const rangeOffs = Math.floor(i * bucketSize) + 1;
    const rangeTo = Math.floor((i + 1) * bucketSize) + 1;
    
    const pointA = data[a];
    
    maxAreaPoint.area = -1;
    
    for (let j = rangeOffs; j < rangeTo; j++) {
      const area = Math.abs(
        (pointA.timestamp - avgX) * (data[j].receivedRate + data[j].sentRate - pointA.receivedRate - pointA.sentRate) -
        (pointA.timestamp - data[j].timestamp) * (avgY - pointA.receivedRate - pointA.sentRate)
      ) * 0.5;
      
      if (area > maxAreaPoint.area) {
        maxAreaPoint.area = area;
        maxAreaPoint.index = j;
      }
    }
    
    sampled[sampledIndex++] = data[maxAreaPoint.index];
    a = maxAreaPoint.index;
  }
  
  sampled[sampledIndex++] = data[dataLength - 1];
  
  return sampled;
};

const NetworkStatisticsModal = ({ isOpen, onClose, macAddress }) => {
  // Все useState хуки в начале
  const [statistics, setStatistics] = useState(null);
  const [deviceId, setDeviceId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('1h');
  const [rawChartData, setRawChartData] = useState([]);
  const [zoomDomain, setZoomDomain] = useState(null);
  const [activeZoomChart, setActiveZoomChart] = useState(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState(null);
  const [selectionEnd, setSelectionEnd] = useState(null);
  const [chartDimensions, setChartDimensions] = useState({
    traffic: null,
    packets: null,
    errors: null
  });
  
  // Состояния для WebSocket
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);

  // Все useRef хуки
  const chartRefs = {
    traffic: useRef(null),
    packets: useRef(null),
    errors: useRef(null)
  };

  // Проверяем, доступен ли real-time для текущего диапазона
  const isRealtimeAvailable = REALTIME_ENABLED_RANGES.includes(timeRange);

  // Мемоизированные значения
  const chartData = useMemo(() => {
    if (!zoomDomain) return rawChartData;
    
    return rawChartData.filter(item => 
      item.timestamp >= zoomDomain[0] && item.timestamp <= zoomDomain[1]
    );
  }, [rawChartData, zoomDomain]);

  // Функция агрегации данных
  const aggregateDataForDisplay = useCallback((data, range) => {
    if (!data || data.length === 0) return [];
    
    const maxPoints = MAX_DATA_POINTS[range] || 200;
    
    if (data.length <= maxPoints) return data;
    
    return lttb(data, maxPoints);
  }, []);

  // Обработка новых данных от WebSocket
  const handleWebSocketMessage = useCallback((newStatistics) => {
    console.log('Received real-time statistics:', newStatistics);
    
    setRawChartData(prevData => {
      if (!prevData || prevData.length === 0) return prevData;
      
      // Преобразуем новые данные в формат для графика
      const newPoints = [];
      
      if (Array.isArray(newStatistics)) {
        newStatistics.forEach(stat => {
          const timestamp = stat.timestamp * 1000;
          const date = new Date(timestamp);
          
          let timeLabel;
          if (timeRange === '24h') {
            timeLabel = date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
          } else {
            timeLabel = date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
          }
          
          // Находим предыдущую точку для расчета дельт
          const prevPoint = prevData.length > 0 ? prevData[prevData.length - 1] : null;
          
          let receivedRate = 0;
          let sentRate = 0;
          let receivedBytesDelta = 0;
          let sentBytesDelta = 0;
          let receivedPacketsDelta = 0;
          let sentPacketsDelta = 0;
          let receivedErrorsDelta = 0;
          let sentErrorsDelta = 0;
          
          if (prevPoint) {
            const timeDiff = stat.timestamp - Math.floor(prevPoint.timestamp / 1000);
            if (timeDiff > 0) {
              receivedBytesDelta = Math.max(0, stat.stat.received_bytes - prevPoint.receivedBytes);
              sentBytesDelta = Math.max(0, stat.stat.sent_bytes - prevPoint.sentBytes);
              receivedPacketsDelta = Math.max(0, stat.stat.received_total_packets - prevPoint.receivedPackets);
              sentPacketsDelta = Math.max(0, stat.stat.sent_total_packets - prevPoint.sentPackets);
              
              const currentReceivedErrors = stat.stat.received_error_packets || 0;
              const prevReceivedErrors = prevPoint.receivedErrors || 0;
              const currentSentErrors = stat.stat.sent_error_packets || 0;
              const prevSentErrors = prevPoint.sentErrors || 0;
              
              receivedErrorsDelta = Math.max(0, currentReceivedErrors - prevReceivedErrors);
              sentErrorsDelta = Math.max(0, currentSentErrors - prevSentErrors);
              
              receivedRate = Math.round((receivedBytesDelta * 8) / timeDiff);
              sentRate = Math.round((sentBytesDelta * 8) / timeDiff);
            }
          }
          
          newPoints.push({
            timestamp: timestamp,
            time: timeLabel,
            fullTime: date.toLocaleString('ru-RU'),
            receivedBytes: stat.stat.received_bytes,
            sentBytes: stat.stat.sent_bytes,
            receivedPackets: stat.stat.received_total_packets,
            sentPackets: stat.stat.sent_total_packets,
            receivedErrors: stat.stat.received_error_packets || 0,
            sentErrors: stat.stat.sent_error_packets || 0,
            receivedErrorsDelta,
            sentErrorsDelta,
            receivedRate,
            sentRate,
            receivedPacketsDelta,
            sentPacketsDelta,
            speed: stat.speed,
            duplex: stat.duplex,
            ip: stat.ip
          });
        });
      }
      
      // Объединяем старые и новые данные
      const combinedData = [...prevData, ...newPoints];
      
      // Удаляем старые данные, выходящие за пределы временного диапазона
      const now = new Date();
      let cutoffTime;
      
      switch (timeRange) {
        case '1h': cutoffTime = new Date(now.getTime() - 60 * 60 * 1000); break;
        case '6h': cutoffTime = new Date(now.getTime() - 6 * 60 * 60 * 1000); break;
        case '24h': cutoffTime = new Date(now.getTime() - 24 * 60 * 60 * 1000); break;
        default: return combinedData;
      }
      
      const filteredData = combinedData.filter(point => point.timestamp >= cutoffTime.getTime());
      
      // Применяем агрегацию
      return aggregateDataForDisplay(filteredData, timeRange);
    });
    
    setLastUpdate(new Date());
  }, [timeRange, aggregateDataForDisplay]);

  // Callback для изменения статуса подключения
  const handleConnectionChange = useCallback((connected) => {
    setIsRealtimeConnected(connected);
  }, []);

  // Callback для обновления времени последнего обновления
  const handleUpdate = useCallback((date) => {
    setLastUpdate(date);
  }, []);

  // Включение/выключение real-time при изменении диапазона или открытии/закрытии модалки
  useEffect(() => {
    if (isOpen && deviceId && isRealtimeAvailable) {
      // Подключаем WebSocket с device.id для real-time диапазонов
      console.log('Enabling real-time for device:', deviceId);
      statisticsWebSocket.enableRealtime(
        deviceId,  // Используем UUID устройства вместо MAC
        handleWebSocketMessage,
        handleConnectionChange,
        handleUpdate
      );
    } else if (!isRealtimeAvailable || !deviceId) {
      // Отключаем WebSocket для не-real-time диапазонов или если нет deviceId
      statisticsWebSocket.disableRealtime();
      setIsRealtimeConnected(false);
    }
    
    return () => {
      // При изменении зависимостей отключаем WebSocket
      if (!isOpen || !isRealtimeAvailable) {
        statisticsWebSocket.disableRealtime();
        setIsRealtimeConnected(false);
      }
    };
  }, [isOpen, deviceId, isRealtimeAvailable, handleWebSocketMessage, handleConnectionChange, handleUpdate]);

  // При изменении timeRange перезагружаем данные если не real-time
  useEffect(() => {
    if (isOpen && deviceId && !isRealtimeAvailable) {
      loadStatistics();
    }
  }, [timeRange, isRealtimeAvailable]);

  // Получение текущего домена X
  const getCurrentXDomain = useCallback(() => {
    if (zoomDomain) return zoomDomain;
    if (rawChartData.length === 0) return [0, 1];
    
    const now = new Date();
    let startTime;
    
    switch (timeRange) {
      case '1h': startTime = new Date(now.getTime() - 60 * 60 * 1000); break;
      case '6h': startTime = new Date(now.getTime() - 6 * 60 * 60 * 1000); break;
      case '24h': startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000); break;
      case '3d': startTime = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000); break;
      case '7d': startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); break;
      default: startTime = new Date(now.getTime() - 60 * 60 * 1000);
    }
    
    return [startTime.getTime(), now.getTime()];
  }, [zoomDomain, rawChartData, timeRange]);

  // Преобразование координаты мыши в значение домена
  const mouseToDomain = useCallback((chartId, clientX) => {
    const dimensions = chartDimensions[chartId];
    if (!dimensions) return null;

    const margin = { left: 20, right: 30 };
    const chartWidth = dimensions.width - margin.left - margin.right;
    const relativeX = clientX - dimensions.left - margin.left;
    const percentage = Math.max(0, Math.min(1, relativeX / chartWidth));
    
    const domain = getCurrentXDomain();
    const domainRange = domain[1] - domain[0];
    
    return domain[0] + (percentage * domainRange);
  }, [chartDimensions, getCurrentXDomain]);

  // Обработчики для выделения мышью
  const handleMouseDown = useCallback((chartId) => (e) => {
    if (e.button !== 0) return;
    
    const domainValue = mouseToDomain(chartId, e.clientX);
    if (domainValue === null) return;

    setIsSelecting(true);
    setSelectionStart(domainValue);
    setSelectionEnd(domainValue);
    setActiveZoomChart(chartId);
    
    e.preventDefault();
  }, [mouseToDomain]);

  const handleMouseMove = useCallback((chartId) => (e) => {
    if (!isSelecting || activeZoomChart !== chartId) return;

    requestAnimationFrame(() => {
      const domainValue = mouseToDomain(chartId, e.clientX);
      if (domainValue !== null) {
        setSelectionEnd(domainValue);
      }
    });
    
    e.preventDefault();
  }, [isSelecting, activeZoomChart, mouseToDomain]);

  const handleMouseUp = useCallback((chartId) => (e) => {
    if (!isSelecting || activeZoomChart !== chartId) return;

    const domainValue = mouseToDomain(chartId, e.clientX);
    if (domainValue === null) {
      setIsSelecting(false);
      setSelectionStart(null);
      setSelectionEnd(null);
      return;
    }

    const start = Math.min(selectionStart, domainValue);
    const end = Math.max(selectionStart, domainValue);

    const domain = getCurrentXDomain();
    const minSelection = (domain[1] - domain[0]) * 0.01;
    
    if (end - start > minSelection) {
      setZoomDomain([start, end]);
    }

    setIsSelecting(false);
    setSelectionStart(null);
    setSelectionEnd(null);
    
    e.preventDefault();
  }, [isSelecting, activeZoomChart, mouseToDomain, selectionStart, getCurrentXDomain]);

  const handleMouseLeave = useCallback((chartId) => () => {
    if (isSelecting && activeZoomChart === chartId) {
      setIsSelecting(false);
      setSelectionStart(null);
      setSelectionEnd(null);
    }
  }, [isSelecting, activeZoomChart]);

  const resetZoom = useCallback(() => {
    setZoomDomain(null);
    setActiveZoomChart(null);
  }, []);

  const handleDoubleClick = useCallback(() => {
    resetZoom();
  }, [resetZoom]);

  // Компонент выделения
  const SelectionOverlay = useCallback(({ chartId }) => {
    if (!isSelecting || activeZoomChart !== chartId || selectionStart === null || selectionEnd === null) {
      return null;
    }

    const start = Math.min(selectionStart, selectionEnd);
    const end = Math.max(selectionStart, selectionEnd);
    
    return (
      <rect
        x={start}
        y="0"
        width={end - start}
        height="100%"
        fill="rgba(136, 132, 216, 0.2)"
        stroke="#8884d8"
        strokeWidth="2"
        strokeDasharray="5,5"
        style={{ pointerEvents: 'none' }}
      />
    );
  }, [isSelecting, activeZoomChart, selectionStart, selectionEnd]);

  // Форматирование значений
  const formatBytes = useCallback((bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }, []);

  const formatBits = useCallback((bits) => {
    if (bits === 0) return '0 bps';
    const k = 1000;
    const sizes = ['bps', 'Kbps', 'Mbps', 'Gbps'];
    const i = Math.floor(Math.log(bits) / Math.log(k));
    return parseFloat((bits / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }, []);

  const formatXAxis = useCallback((timestamp) => {
    const date = new Date(timestamp);
    
    if (timeRange === '7d' || timeRange === '3d') {
      return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
    } else if (timeRange === '24h') {
      return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    }
  }, [timeRange]);

  const getXAxisDomain = useCallback(() => {
    if (zoomDomain) return zoomDomain;
    if (rawChartData.length === 0) return [0, 1];
    
    const now = new Date();
    let startTime;
    
    switch (timeRange) {
      case '1h': startTime = new Date(now.getTime() - 60 * 60 * 1000); break;
      case '6h': startTime = new Date(now.getTime() - 6 * 60 * 60 * 1000); break;
      case '24h': startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000); break;
      case '3d': startTime = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000); break;
      case '7d': startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); break;
      default: startTime = new Date(now.getTime() - 60 * 60 * 1000);
    }
    
    return [startTime.getTime(), now.getTime()];
  }, [zoomDomain, rawChartData, timeRange]);

  // Статистика метрик
  const metricStats = useMemo(() => {
    if (chartData.length < 2) return null;

    const receivedRates = chartData.slice(1).map(d => d.receivedRate).filter(r => r > 0);
    const sentRates = chartData.slice(1).map(d => d.sentRate).filter(r => r > 0);

    const max = (arr) => arr.length > 0 ? Math.max(...arr) : 0;
    const avg = (arr) => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

    const lastDataPoint = chartData[chartData.length - 1];

    return {
      received: { max: max(receivedRates), avg: avg(receivedRates) },
      sent: { max: max(sentRates), avg: avg(sentRates) },
      totalReceived: lastDataPoint?.receivedBytes || 0,
      totalSent: lastDataPoint?.sentBytes || 0,
      totalReceivedPackets: lastDataPoint?.receivedPackets || 0,
      totalSentPackets: lastDataPoint?.sentPackets || 0,
      totalReceivedErrors: lastDataPoint?.receivedErrors || 0,
      totalSentErrors: lastDataPoint?.sentErrors || 0
    };
  }, [chartData]);

  const loadStatistics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setZoomDomain(null);

      const now = new Date();
      let startTime;

      switch (timeRange) {
        case '1h':
          startTime = new Date(now.getTime() - 60 * 60 * 1000);
          break;
        case '6h':
          startTime = new Date(now.getTime() - 6 * 60 * 60 * 1000);
          break;
        case '24h':
          startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case '3d':
          startTime = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
          break;
        case '7d':
          startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        default:
          startTime = new Date(now.getTime() - 60 * 60 * 1000);
      }

      const formatDateTime = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
      };

      const data = await getNetworkStatistics({
        mac_address: macAddress,
        start_time: formatDateTime(startTime),
        end_time: formatDateTime(now),
        sort_by_timestamp: 'ascending'
      });

      console.log('Received statistics:', data);
      setStatistics(data);
      
      // Сохраняем device.id для WebSocket
      if (data.device && data.device.id) {
        setDeviceId(data.device.id);
        console.log('Device ID for WebSocket:', data.device.id);
      }
      
      // Обрабатываем данные
      const processed = [];
      const stats = data.statistics;
      
      if (stats && stats.length > 0) {
        stats.forEach((stat, index) => {
          const timestamp = stat.timestamp * 1000;
          
          const date = new Date(timestamp);
          let timeLabel;
          
          if (timeRange === '7d' || timeRange === '3d') {
            timeLabel = date.toLocaleDateString('ru-RU', { 
              day: '2-digit', 
              month: '2-digit',
              hour: '2-digit', 
              minute: '2-digit'
            });
          } else if (timeRange === '24h') {
            timeLabel = date.toLocaleTimeString('ru-RU', { 
              hour: '2-digit', 
              minute: '2-digit'
            });
          } else {
            timeLabel = date.toLocaleTimeString('ru-RU', { 
              hour: '2-digit', 
              minute: '2-digit',
              second: '2-digit'
            });
          }

          let receivedRate = 0;
          let sentRate = 0;
          let receivedBytesDelta = 0;
          let sentBytesDelta = 0;
          let receivedPacketsDelta = 0;
          let sentPacketsDelta = 0;
          let receivedErrorsDelta = 0;
          let sentErrorsDelta = 0;

          if (index > 0) {
            const prevStat = stats[index - 1];
            const timeDiff = stat.timestamp - prevStat.timestamp;

            if (timeDiff > 0) {
              receivedBytesDelta = Math.max(0, stat.stat.received_bytes - prevStat.stat.received_bytes);
              sentBytesDelta = Math.max(0, stat.stat.sent_bytes - prevStat.stat.sent_bytes);
              receivedPacketsDelta = Math.max(0, stat.stat.received_total_packets - prevStat.stat.received_total_packets);
              sentPacketsDelta = Math.max(0, stat.stat.sent_total_packets - prevStat.stat.sent_total_packets);
              
              const currentReceivedErrors = stat.stat.received_error_packets || 0;
              const prevReceivedErrors = prevStat.stat.received_error_packets || 0;
              const currentSentErrors = stat.stat.sent_error_packets || 0;
              const prevSentErrors = prevStat.stat.sent_error_packets || 0;
              
              receivedErrorsDelta = Math.max(0, currentReceivedErrors - prevReceivedErrors);
              sentErrorsDelta = Math.max(0, currentSentErrors - prevSentErrors);

              receivedRate = Math.round((receivedBytesDelta * 8) / timeDiff);
              sentRate = Math.round((sentBytesDelta * 8) / timeDiff);
            }
          }

          processed.push({
            timestamp: timestamp,
            time: timeLabel,
            fullTime: date.toLocaleString('ru-RU'),
            receivedBytes: stat.stat.received_bytes,
            sentBytes: stat.stat.sent_bytes,
            receivedPackets: stat.stat.received_total_packets,
            sentPackets: stat.stat.sent_total_packets,
            receivedErrors: stat.stat.received_error_packets || 0,
            sentErrors: stat.stat.sent_error_packets || 0,
            receivedErrorsDelta,
            sentErrorsDelta,
            receivedRate,
            sentRate,
            receivedPacketsDelta,
            sentPacketsDelta,
            speed: stat.speed,
            duplex: stat.duplex,
            ip: stat.ip
          });
        });
      }
      
      const aggregated = aggregateDataForDisplay(processed, timeRange);
      setRawChartData(aggregated);
      
    } catch (err) {
      console.error('Failed to load statistics:', err);
      setError(err.response?.data?.detail || err.message || 'Failed to load statistics');
    } finally {
      setLoading(false);
    }
  }, [macAddress, timeRange, aggregateDataForDisplay]);

  // Эффекты для начальной загрузки
  useEffect(() => {
    if (isOpen && macAddress) {
      loadStatistics();
    }
  }, [isOpen, macAddress, loadStatistics]);

  useEffect(() => {
    const updateDimensions = () => {
      Object.keys(chartRefs).forEach(key => {
        if (chartRefs[key].current) {
          const rect = chartRefs[key].current.getBoundingClientRect();
          setChartDimensions(prev => ({
            ...prev,
            [key]: rect
          }));
        }
      });
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, [chartData]);

  const xAxisDomain = getXAxisDomain();

  const getBarConfig = useCallback((range, dataLength) => {
    const configs = {
      '1h': { maxBarSize: 30, barCategoryGap: 0, barGap: 0 },
      '6h': { maxBarSize: 20, barCategoryGap: 0, barGap: 0 },
      '24h': { maxBarSize: 15, barCategoryGap: 0, barGap: 0 },
      '3d': { maxBarSize: 10, barCategoryGap: 1, barGap: 0 },
      '7d': { maxBarSize: 8, barCategoryGap: 2, barGap: 1 }
    };
    
    const config = configs[range] || { maxBarSize: 30, barCategoryGap: 0, barGap: 0 };
    
    if (dataLength > 500) {
      return {
        ...config,
        maxBarSize: Math.min(40, config.maxBarSize * 2),
      };
    }
    
    if (zoomDomain) {
      return {
        ...config,
        maxBarSize: Math.min(30, config.maxBarSize * 1.5),
      };
    }
    
    return config;
  }, [zoomDomain]);

  // Функция рендера графика
  const renderChart = useCallback((chartId, title, icon, height, bars) => {
    const barConfig = getBarConfig(timeRange, chartData.length);
    
    return (
      <div className="chart-section" key={chartId}>
        <h3 className="chart-title">
          {icon}
          {title}
          {zoomDomain && activeZoomChart === chartId && <span className="zoom-badge">Zoomed</span>}
        </h3>
        <div 
          className="chart-container"
          ref={chartRefs[chartId]}
          onMouseDown={handleMouseDown(chartId)}
          onMouseMove={handleMouseMove(chartId)}
          onMouseUp={handleMouseUp(chartId)}
          onMouseLeave={handleMouseLeave(chartId)}
          onDoubleClick={handleDoubleClick}
          style={{ cursor: isSelecting && activeZoomChart === chartId ? 'col-resize' : 'crosshair' }}
        >
          <ResponsiveContainer width="100%" height={height}>
            <BarChart 
              data={chartData} 
              margin={{ top: 10, right: 30, left: 20, bottom: 5 }}
              barCategoryGap={barConfig.barCategoryGap}
              barGap={barConfig.barGap}
            >
              <CartesianGrid 
                strokeDasharray="2 4" 
                stroke="rgba(128, 128, 128, 0.08)"
                vertical={true}
                horizontal={true}
              />
              <XAxis 
                dataKey="timestamp"
                type="number"
                domain={xAxisDomain}
                tickFormatter={formatXAxis}
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={60}
                scale="time"
              />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={chartId === 'traffic' ? formatBits : undefined} />
              <Tooltip 
                formatter={chartId === 'traffic' ? 
                  (value, name) => [formatBits(value), name === 'receivedRate' ? 'Download' : 'Upload'] :
                  (value, name) => [value.toLocaleString(), name]
                }
                labelFormatter={(timestamp) => `Time: ${new Date(timestamp).toLocaleString('ru-RU')}`}
              />
              <Legend />
              {bars.map((bar, index) => (
                <Bar 
                  key={index}
                  dataKey={bar.dataKey}
                  name={bar.name}
                  fill={bar.fill}
                  opacity={0.85}
                  isAnimationActive={false}
                  maxBarSize={barConfig.maxBarSize}
                />
              ))}
              {chartData.length > 0 && (
                <ReferenceLine 
                  x={chartData[chartData.length - 1].timestamp} 
                  stroke="#ff0000" 
                  strokeWidth={1}
                  strokeDasharray="3 3"
                  label={chartId === 'traffic' ? { value: 'Latest', position: 'top', fontSize: 10, fill: '#ff0000' } : undefined}
                />
              )}
              <SelectionOverlay chartId={chartId} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="chart-hint">Click and drag to zoom • Double-click to reset</div>
      </div>
    );
  }, [chartData, xAxisDomain, formatXAxis, formatBits, zoomDomain, activeZoomChart, isSelecting, handleMouseDown, handleMouseMove, handleMouseUp, handleMouseLeave, handleDoubleClick, SelectionOverlay, timeRange, getBarConfig]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content statistics-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>
            <Activity size={20} />
            Network Statistics - {macAddress}
          </h2>
          <div className="modal-header-controls">
            {/* Индикатор real-time подключения */}
            {isRealtimeAvailable && (
              <div className={`realtime-indicator ${isRealtimeConnected ? 'connected' : 'disconnected'}`} title={isRealtimeConnected ? 'Real-time connected' : 'Real-time disconnected'}>
                {isRealtimeConnected ? <Wifi size={16} /> : <WifiOff size={16} />}
                <span>{isRealtimeConnected ? 'Live' : 'Offline'}</span>
              </div>
            )}
            {zoomDomain && (
              <button className="reset-zoom-button" onClick={resetZoom} title="Reset Zoom (Double-click on chart)">
                <ZoomOut size={18} />
                <span>Reset Zoom</span>
              </button>
            )}
            <button className="close-button" onClick={onClose}>
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="modal-body">
          <div className="time-range-selector">
            <button className={timeRange === '1h' ? 'active' : ''} onClick={() => setTimeRange('1h')}>
              1 Hour {REALTIME_ENABLED_RANGES.includes('1h') && <Wifi size={12} />}
            </button>
            <button className={timeRange === '6h' ? 'active' : ''} onClick={() => setTimeRange('6h')}>
              6 Hours {REALTIME_ENABLED_RANGES.includes('6h') && <Wifi size={12} />}
            </button>
            <button className={timeRange === '24h' ? 'active' : ''} onClick={() => setTimeRange('24h')}>
              24 Hours {REALTIME_ENABLED_RANGES.includes('24h') && <Wifi size={12} />}
            </button>
            <button className={timeRange === '3d' ? 'active' : ''} onClick={() => setTimeRange('3d')}>
              3 Days
            </button>
            <button className={timeRange === '7d' ? 'active' : ''} onClick={() => setTimeRange('7d')}>
              7 Days
            </button>
          </div>

          {/* Информация о real-time */}
          {isRealtimeAvailable && (
            <div className={`realtime-status ${isRealtimeConnected ? 'connected' : 'disconnected'}`}>
              {isRealtimeConnected ? (
                <>
                  <Wifi size={14} />
                  <span>Real-time updates active</span>
                  {lastUpdate && (
                    <span className="last-update">
                      Last update: {lastUpdate.toLocaleTimeString('ru-RU')}
                    </span>
                  )}
                </>
              ) : (
                <>
                  <WifiOff size={14} />
                  <span>Real-time disconnected - showing cached data</span>
                </>
              )}
            </div>
          )}

          {zoomDomain && (
            <div className="zoom-indicator">
              <span>Zoomed: {new Date(zoomDomain[0]).toLocaleString('ru-RU')} - {new Date(zoomDomain[1]).toLocaleString('ru-RU')}</span>
              <span className="zoom-hint">Double-click on chart to reset</span>
            </div>
          )}

          {loading && (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading statistics...</p>
            </div>
          )}

          {error && (
            <div className="error-state">
              <AlertTriangle size={24} />
              <p>{error}</p>
              <button onClick={loadStatistics} className="btn btn-primary">Retry</button>
            </div>
          )}

          {!loading && !error && rawChartData.length === 0 && (
            <div className="no-data-state">
              <Activity size={48} />
              <p>No statistics data available for this time range</p>
            </div>
          )}

          {!loading && !error && chartData.length > 0 && (
            <>
              {metricStats && (
                <div className="stats-summary">
                  <div className="stat-card received">
                    <div className="stat-icon"><TrendingDown size={20} /></div>
                    <div className="stat-info">
                      <div className="stat-label">Download {zoomDomain && '(Zoomed)'}</div>
                      <div className="stat-value">
                        <div>Avg: {formatBits(metricStats.received.avg)}</div>
                        <div>Max: {formatBits(metricStats.received.max)}</div>
                        <div>Total: {formatBytes(metricStats.totalReceived)}</div>
                      </div>
                    </div>
                  </div>
                  <div className="stat-card sent">
                    <div className="stat-icon"><TrendingUp size={20} /></div>
                    <div className="stat-info">
                      <div className="stat-label">Upload {zoomDomain && '(Zoomed)'}</div>
                      <div className="stat-value">
                        <div>Avg: {formatBits(metricStats.sent.avg)}</div>
                        <div>Max: {formatBits(metricStats.sent.max)}</div>
                        <div>Total: {formatBytes(metricStats.totalSent)}</div>
                      </div>
                    </div>
                  </div>
                  {statistics?.device && chartData.length > 0 && (
                    <div className="stat-card device">
                      <div className="stat-info">
                        <div className="stat-label">Connection Info</div>
                        <div className="stat-value">
                          <div>{chartData[0]?.speed} Mbps {chartData[0]?.duplex}</div>
                          <div>{chartData[0]?.ip}</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {renderChart('traffic', 'Traffic Rate (bits per second)', <TrendingUp size={18} />, 350, [
                { dataKey: 'receivedRate', name: 'Download', fill: '#82ca9d' },
                { dataKey: 'sentRate', name: 'Upload', fill: '#8884d8' }
              ])}

              {renderChart('packets', 'Packets per Interval', <Activity size={18} />, 300, [
                { dataKey: 'receivedPacketsDelta', name: 'Received Packets', fill: '#82ca9d' },
                { dataKey: 'sentPacketsDelta', name: 'Sent Packets', fill: '#8884d8' }
              ])}

              {renderChart('errors', 'Errors per Interval', <AlertTriangle size={18} />, 300, [
                { dataKey: 'receivedErrorsDelta', name: 'Received Errors', fill: '#ff7300' },
                { dataKey: 'sentErrorsDelta', name: 'Sent Errors', fill: '#ff0000' }
              ])}
              
              {metricStats && (metricStats.totalReceivedErrors > 0 || metricStats.totalSentErrors > 0) && (
                <div className="error-stats-summary">
                  <span className="error-stat received">Total Received Errors: {metricStats.totalReceivedErrors}</span>
                  <span className="error-stat sent">Total Sent Errors: {metricStats.totalSentErrors}</span>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default NetworkStatisticsModal;