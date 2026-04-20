import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  X, TrendingUp, TrendingDown, Activity, AlertTriangle, 
  ZoomOut, Wifi, WifiOff, Radio, Film, Volume2, Video 
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  LineChart,
  Line,
  ComposedChart,
  Area
} from 'recharts';
import { getNetworkStatistics, getMediaStatistics } from '../services/api';
import statisticsWebSocket from '../services/websocket';
import './NetworkStatisticsModal.css';

// Константы для оптимизации
const MAX_DATA_POINTS = {
  '1h': 120,
  '6h': 360,
  '24h': 288,
  '3d': 288,
  '7d': 336
};

// Диапазоны, для которых доступен real-time
const REALTIME_ENABLED_RANGES = ['1h', '6h', '24h'];

// Типы статистики
const STATISTICS_TYPES = {
  NETWORK: 'network',
  MEDIA: 'media'
};

// Алгоритм LTTB для децимации
const lttb = (data, threshold) => {
  if (!data || !Array.isArray(data)) return [];
  const dataLength = data.length;

  if (threshold >= dataLength || threshold <= 0 || dataLength === 0) {
    return [...data];
  }
  if (dataLength <= 3) return [...data];
  
  const sampled = [];
  let sampledIndex = 0;
  const bucketSize = (dataLength - 2) / (threshold - 2);
  
  let a = 0;
  sampled[sampledIndex++] = data[a];
  
  for (let i = 0; i < threshold - 2; i++) {
    let avgX = 0, avgY = 0;
    let avgRangeStart = Math.floor((i + 1) * bucketSize) + 1;
    let avgRangeEnd = Math.floor((i + 2) * bucketSize) + 1;
    avgRangeEnd = Math.min(avgRangeEnd, dataLength);
    
    const avgRangeLength = Math.max(1, avgRangeEnd - avgRangeStart);
    
    for (let j = avgRangeStart; j < avgRangeEnd; j++) {
      avgX += data[j].timestamp;
      avgY += data[j].avg_bitrate || (data[j].receivedRate + data[j].sentRate) || 0;
    }
    avgX /= avgRangeLength;
    avgY /= avgRangeLength;
    
    const rangeOffs = Math.floor(i * bucketSize) + 1;
    const rangeTo = Math.min(Math.floor((i + 1) * bucketSize) + 1, dataLength - 1);
    
    if (rangeOffs >= rangeTo) continue;
    
    const pointA = data[a];
    const pointAValue = pointA.avg_bitrate || (pointA.receivedRate + pointA.sentRate) || 0;
    
    let maxArea = -1;
    let maxAreaIndex = rangeOffs;
    
    for (let j = rangeOffs; j < rangeTo; j++) {
      const dataValue = data[j].avg_bitrate || (data[j].receivedRate + data[j].sentRate) || 0;
      const area = Math.abs(
        (pointA.timestamp - avgX) * (dataValue - pointAValue) -
        (pointA.timestamp - data[j].timestamp) * (avgY - pointAValue)
      ) * 0.5;
      
      if (area > maxArea) {
        maxArea = area;
        maxAreaIndex = j;
      }
    }
    
    sampled[sampledIndex++] = data[maxAreaIndex];
    a = maxAreaIndex;
  }
  sampled[sampledIndex++] = data[dataLength - 1];
  
  return sampled.filter(point => point && point.timestamp !== undefined);
};

const NetworkStatisticsModal = ({ isOpen, onClose, macAddress }) => {
  // Состояния
  const [statistics, setStatistics] = useState(null);
  const [deviceId, setDeviceId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('1h');
  const [statisticsType, setStatisticsType] = useState(STATISTICS_TYPES.NETWORK);
  const [rawChartData, setRawChartData] = useState([]);
  const [zoomDomain, setZoomDomain] = useState(null);
  const [activeZoomChart, setActiveZoomChart] = useState(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState(null);
  const [selectionEnd, setSelectionEnd] = useState(null);
  const [chartDimensions, setChartDimensions] = useState({
    chart1: null,
    chart2: null,
    chart3: null
  });
  
  // WebSocket состояния
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [pendingWsData, setPendingWsData] = useState({ network: [], media: [] });

  // Refs
  const chartRefs = {
    chart1: useRef(null),
    chart2: useRef(null),
    chart3: useRef(null)
  };

  // Ref для буферизации WebSocket-данных, пришедших до загрузки истории
  const wsBufferRef = useRef({ network: [], media: [] });
  
  // Флаг: загружены ли исторические данные с бэка
  const isHistoricalDataLoadedRef = useRef(false);

  // Проверяем, доступен ли real-time для текущего диапазона
  const isRealtimeAvailable = REALTIME_ENABLED_RANGES.includes(timeRange);

  const chartData = useMemo(() => {
    if (!zoomDomain) return rawChartData;
    return rawChartData.filter(item => 
      item.timestamp >= zoomDomain[0] && item.timestamp <= zoomDomain[1]
    );
  }, [rawChartData, zoomDomain]);

  const aggregateDataForDisplay = useCallback((data, range) => {
    if (!data || data.length === 0) return [];
    const maxPoints = MAX_DATA_POINTS[range] || 200;
    if (data.length <= maxPoints) return data;
    return lttb(data, maxPoints);
  }, []);

  // Обработка WebSocket сообщений
  const handleWebSocketMessage = useCallback((message) => {
    let messageType = null;
    let messageData = null;
    
    if (message.type && (message.type === 'network' || message.type === 'media') && message.data) {
      messageType = message.type;
      messageData = message.data;
    } else if (message.type && (message.type === 'network' || message.type === 'media') && message.stat) {
      messageType = message.type;
      messageData = [message];
    } else if (Array.isArray(message)) {
      messageType = 'network';
      messageData = message;
    } else if (message.stat && message.stat.received_bytes !== undefined) {
      messageType = 'network';
      messageData = [message];
    } else if (message.avg_bitrate !== undefined) {
      messageType = 'media';
      messageData = [message];
    }
    
    if (!messageType || !messageData) {
      return;
    }
    
    // Если исторические данные ещё не загружены — буферизуем
    if (!isHistoricalDataLoadedRef.current) {
      wsBufferRef.current[messageType] = [...wsBufferRef.current[messageType], ...messageData];
      return;
    }
    
    // Иначе обрабатываем как обычно
    if (messageType === 'network') {
      updateNetworkData(messageData);
    } else if (messageType === 'media') {
      updateMediaData(messageData);
    }
    
    setLastUpdate(new Date());
  }, [timeRange, aggregateDataForDisplay]);

  // Обновление сетевых данных
  const updateNetworkData = useCallback((newData) => {
    setRawChartData(prevData => {
      if (statisticsType !== STATISTICS_TYPES.NETWORK) {
        setPendingWsData(prev => ({ ...prev, network: newData }));
        return prevData;
      }
      
      const baseData = prevData && prevData.length > 0 ? [...prevData] : [];
      const newPoints = [];
      const statsArray = Array.isArray(newData) ? newData : [newData];
      const now = Date.now();
      const maxTimestampDrift = 5000;
      
      statsArray.forEach(stat => {
        const statData = stat.stat || stat;
        const timestamp = stat.timestamp * 1000;
        
        if (timestamp > now + maxTimestampDrift || timestamp < now - 24 * 60 * 60 * 1000) {
          return;
        }
        
        const date = new Date(timestamp);
        let timeLabel = timeRange === '24h' 
          ? date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
          : date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        
        const prevPoint = baseData.length > 0 ? baseData[baseData.length - 1] : null;
        
        let receivedRate = 0, sentRate = 0;
        let receivedBytesDelta = 0, sentBytesDelta = 0;
        let receivedPacketsDelta = 0, sentPacketsDelta = 0;
        let receivedErrorsDelta = 0, sentErrorsDelta = 0;
        
        if (prevPoint) {
          const timeDiff = stat.timestamp - Math.floor(prevPoint.timestamp / 1000);
          if (timeDiff > 0 && timeDiff < 300) {
            receivedBytesDelta = Math.max(0, statData.received_bytes - prevPoint.receivedBytes);
            sentBytesDelta = Math.max(0, statData.sent_bytes - prevPoint.sentBytes);
            receivedPacketsDelta = Math.max(0, statData.received_total_packets - prevPoint.receivedPackets);
            sentPacketsDelta = Math.max(0, statData.sent_total_packets - prevPoint.sentPackets);
            
            const currentReceivedErrors = statData.received_error_packets || 0;
            const prevReceivedErrors = prevPoint.receivedErrors || 0;
            const currentSentErrors = statData.sent_error_packets || 0;
            const prevSentErrors = prevPoint.sentErrors || 0;
            
            receivedErrorsDelta = Math.max(0, currentReceivedErrors - prevReceivedErrors);
            sentErrorsDelta = Math.max(0, currentSentErrors - prevSentErrors);
            
            receivedRate = Math.round((receivedBytesDelta * 8) / timeDiff);
            sentRate = Math.round((sentBytesDelta * 8) / timeDiff);
          }
        }
        
        newPoints.push({
          timestamp, time: timeLabel, fullTime: date.toLocaleString('ru-RU'),
          receivedBytes: statData.received_bytes, sentBytes: statData.sent_bytes,
          receivedPackets: statData.received_total_packets, sentPackets: statData.sent_total_packets,
          receivedErrors: statData.received_error_packets || 0, sentErrors: statData.sent_error_packets || 0,
          receivedErrorsDelta, sentErrorsDelta, receivedRate, sentRate,
          receivedPacketsDelta, sentPacketsDelta,
          speed: stat.speed, duplex: stat.duplex, ip: stat.ip
        });
      });
      
      if (newPoints.length === 0) return prevData;
      
      const combinedData = [...baseData, ...newPoints];
      
      const nowDate = new Date();
      let cutoffTime;
      switch (timeRange) {
        case '1h': cutoffTime = new Date(nowDate.getTime() - 60 * 60 * 1000); break;
        case '6h': cutoffTime = new Date(nowDate.getTime() - 6 * 60 * 60 * 1000); break;
        case '24h': cutoffTime = new Date(nowDate.getTime() - 24 * 60 * 60 * 1000); break;
        default: return combinedData;
      }
      
      let filteredData = combinedData.filter(point => point.timestamp >= cutoffTime.getTime());
      
      if (filteredData.length === 0 && combinedData.length > 0) {
        filteredData = [combinedData[combinedData.length - 1]];
      }
      
      if (newPoints.length > 0) {
        const lastPoint = newPoints[newPoints.length - 1];
        setStatistics(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            device: {
              ...prev.device,
              ip_address: lastPoint.ip,
              last_activity: new Date(lastPoint.timestamp).toISOString()
            }
          };
        });
      }
      
      return aggregateDataForDisplay(filteredData, timeRange);
    });
  }, [timeRange, aggregateDataForDisplay, statisticsType]);

  // Обновление медиа данных
  const updateMediaData = useCallback((newData) => {
    setRawChartData(prevData => {
      if (statisticsType !== STATISTICS_TYPES.MEDIA) {
        setPendingWsData(prev => ({ ...prev, media: newData }));
        return prevData;
      }
      
      const baseData = prevData && prevData.length > 0 ? [...prevData] : [];
      
      const newPoints = [];
      const statsArray = Array.isArray(newData) ? newData : [newData];
      
      statsArray.forEach(stat => {
        const timestamp = stat.timestamp * 1000;
        const date = new Date(timestamp);
        
        let timeLabel;
        if (timeRange === '7d' || timeRange === '3d') {
          timeLabel = date.toLocaleDateString('ru-RU', { 
            day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
          });
        } else if (timeRange === '24h') {
          timeLabel = date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
        } else {
          timeLabel = date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        }

        let displayUrl = stat.url;
        try {
          const urlObj = new URL(stat.url);
          displayUrl = urlObj.hostname + urlObj.pathname;
          if (displayUrl.length > 40) {
            displayUrl = displayUrl.substring(0, 37) + '...';
          }
        } catch (e) {
          if (displayUrl && displayUrl.length > 40) {
            displayUrl = displayUrl.substring(0, 37) + '...';
          }
        }

        newPoints.push({
          timestamp, time: timeLabel,
          fullTime: date.toLocaleString('ru-RU'),
          url: stat.url,
          displayUrl,
          avg_bitrate: stat.avg_bitrate,
          begin: stat.begin,
          end: stat.end,
          discontinuities: stat.discontinuties || 0,
          id: stat.id,
          proto: stat.proto,
          video_frames_decoded: stat.video?.frames_decoded || 0,
          video_frames_dropped: stat.video?.frames_dropped || 0,
          video_frames_failed: stat.video?.frames_failed || 0,
          audio_frames_decoded: stat.audio?.frames_decoded || 0,
          audio_frames_dropped: stat.audio?.frames_dropped || 0,
          audio_frames_failed: stat.audio?.frames_failed || 0,
          total_frames_decoded: (stat.video?.frames_decoded || 0) + (stat.audio?.frames_decoded || 0),
          total_frames_dropped: (stat.video?.frames_dropped || 0) + (stat.audio?.frames_dropped || 0),
          total_frames_failed: (stat.video?.frames_failed || 0) + (stat.audio?.frames_failed || 0)
        });
      });
      
      const combinedData = [...baseData, ...newPoints];
      
      const now = new Date();
      let cutoffTime;
      switch (timeRange) {
        case '1h': cutoffTime = new Date(now.getTime() - 60 * 60 * 1000); break;
        case '6h': cutoffTime = new Date(now.getTime() - 6 * 60 * 60 * 1000); break;
        case '24h': cutoffTime = new Date(now.getTime() - 24 * 60 * 60 * 1000); break;
        default: return combinedData;
      }
      
      const filteredData = combinedData.filter(point => point.timestamp >= cutoffTime.getTime());
      return aggregateDataForDisplay(filteredData, timeRange);
    });
  }, [timeRange, aggregateDataForDisplay, statisticsType]);

  // Слияние буферизованных WebSocket-данных с историческими
  const mergeBufferedWsData = useCallback((type) => {
    const buffer = wsBufferRef.current[type];
    if (!buffer || buffer.length === 0) return;
    
    if (type === 'network') {
      updateNetworkData(buffer);
    } else if (type === 'media') {
      updateMediaData(buffer);
    }
    
    // Очищаем буфер после слияния
    wsBufferRef.current[type] = [];
  }, [updateNetworkData, updateMediaData]);

  const handleConnectionChange = useCallback((connected) => {
    setIsRealtimeConnected(connected);
  }, []);

  const handleUpdate = useCallback((date) => {
    setLastUpdate(date);
  }, []);

  // Загрузка сетевой статистики
  const loadNetworkStatistics = useCallback(async () => {
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

    return data;
  }, [macAddress, timeRange]);

  // Загрузка медиа-статистики
  const loadMediaStatistics = useCallback(async () => {
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

    const formatDateTime = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
    };

    const data = await getMediaStatistics({
      mac_address: macAddress,
      start_time: formatDateTime(startTime),
      end_time: formatDateTime(now),
      sort_by_timestamp: 'ascending'
    });

    return data;
  }, [macAddress, timeRange]);

  // Основная функция загрузки
  const loadStatistics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setZoomDomain(null);

      let data;
      if (statisticsType === STATISTICS_TYPES.NETWORK) {
        data = await loadNetworkStatistics();
      } else {
        data = await loadMediaStatistics();
      }

      setStatistics(data);
      
      if (data.device && data.device.id) {
        setDeviceId(data.device.id);
      }
      
      const processed = [];
      const stats = data.statistics;
      
      if (stats && stats.length > 0) {
        if (statisticsType === STATISTICS_TYPES.NETWORK) {
          stats.forEach((stat, index) => {
            const timestamp = stat.timestamp * 1000;
            const date = new Date(timestamp);
            let timeLabel;
            
            if (timeRange === '7d' || timeRange === '3d') {
              timeLabel = date.toLocaleDateString('ru-RU', { 
                day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
              });
            } else if (timeRange === '24h') {
              timeLabel = date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
            } else {
              timeLabel = date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            }

            let receivedRate = 0, sentRate = 0;
            let receivedBytesDelta = 0, sentBytesDelta = 0;
            let receivedPacketsDelta = 0, sentPacketsDelta = 0;
            let receivedErrorsDelta = 0, sentErrorsDelta = 0;

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
              timestamp, time: timeLabel,
              fullTime: date.toLocaleString('ru-RU'),
              receivedBytes: stat.stat.received_bytes,
              sentBytes: stat.stat.sent_bytes,
              receivedPackets: stat.stat.received_total_packets,
              sentPackets: stat.stat.sent_total_packets,
              receivedErrors: stat.stat.received_error_packets || 0,
              sentErrors: stat.stat.sent_error_packets || 0,
              receivedErrorsDelta, sentErrorsDelta,
              receivedRate, sentRate,
              receivedPacketsDelta, sentPacketsDelta,
              speed: stat.speed, duplex: stat.duplex, ip: stat.ip
            });
          });
        } else {
          stats.forEach((stat) => {
            const timestamp = stat.timestamp * 1000;
            const date = new Date(timestamp);
            let timeLabel;
            
            if (timeRange === '7d' || timeRange === '3d') {
              timeLabel = date.toLocaleDateString('ru-RU', { 
                day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
              });
            } else if (timeRange === '24h') {
              timeLabel = date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
            } else {
              timeLabel = date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            }

            let displayUrl = stat.url;
            try {
              const urlObj = new URL(stat.url);
              displayUrl = urlObj.hostname + urlObj.pathname;
              if (displayUrl.length > 40) {
                displayUrl = displayUrl.substring(0, 37) + '...';
              }
            } catch (e) {
              if (displayUrl.length > 40) {
                displayUrl = displayUrl.substring(0, 37) + '...';
              }
            }

            processed.push({
              timestamp, time: timeLabel,
              fullTime: date.toLocaleString('ru-RU'),
              url: stat.url,
              displayUrl,
              avg_bitrate: stat.avg_bitrate,
              begin: stat.begin,
              end: stat.end,
              discontinuities: stat.discontinuties || 0,
              id: stat.id,
              proto: stat.proto,
              video_frames_decoded: stat.video?.frames_decoded || 0,
              video_frames_dropped: stat.video?.frames_dropped || 0,
              video_frames_failed: stat.video?.frames_failed || 0,
              audio_frames_decoded: stat.audio?.frames_decoded || 0,
              audio_frames_dropped: stat.audio?.frames_dropped || 0,
              audio_frames_failed: stat.audio?.frames_failed || 0,
              total_frames_decoded: (stat.video?.frames_decoded || 0) + (stat.audio?.frames_decoded || 0),
              total_frames_dropped: (stat.video?.frames_dropped || 0) + (stat.audio?.frames_dropped || 0),
              total_frames_failed: (stat.video?.frames_failed || 0) + (stat.audio?.frames_failed || 0)
            });
          });
        }
      }
      
      const aggregated = aggregateDataForDisplay(processed, timeRange);
      setRawChartData(aggregated);
      
      // Помечаем, что исторические данные загружены
      isHistoricalDataLoadedRef.current = true;
      
      // Сливаем буферизованные WebSocket-данные
      mergeBufferedWsData(statisticsType);
      
    } catch (err) {
      console.error('Failed to load statistics:', err);
      setError(err.response?.data?.detail || err.message || 'Failed to load statistics');
    } finally {
      setLoading(false);
    }
  }, [macAddress, timeRange, statisticsType, loadNetworkStatistics, loadMediaStatistics, aggregateDataForDisplay, mergeBufferedWsData]);

  // Ref для отслеживания актуального состояния isOpen внутри cleanup
  const isOpenRef = useRef(isOpen);
  useEffect(() => { isOpenRef.current = isOpen; }, [isOpen]);

  // WebSocket эффект
  useEffect(() => {
    if (isOpen && deviceId && isRealtimeAvailable) {
      statisticsWebSocket.enableRealtime(
        deviceId,
        handleWebSocketMessage,
        handleConnectionChange,
        handleUpdate
      );
    } else {
      statisticsWebSocket.disableRealtime();
      setIsRealtimeConnected(false);
    }
    
    return () => {
      if (!isOpenRef.current || !isRealtimeAvailable) {
        statisticsWebSocket.disableRealtime();
        setIsRealtimeConnected(false);
      }
    };
  }, [isOpen, deviceId, isRealtimeAvailable, handleWebSocketMessage, handleConnectionChange, handleUpdate]);

  // При переключении типа статистики проверяем pending данные
  useEffect(() => {
    if (pendingWsData[statisticsType] && pendingWsData[statisticsType].length > 0) {
      if (statisticsType === STATISTICS_TYPES.NETWORK) {
        updateNetworkData(pendingWsData.network);
      } else {
        updateMediaData(pendingWsData.media);
      }
      setPendingWsData(prev => ({ ...prev, [statisticsType]: [] }));
    }
  }, [statisticsType, pendingWsData, updateNetworkData, updateMediaData]);

  // Загрузка данных при изменении параметров
  useEffect(() => {
    if (isOpen && macAddress) {
      // Сбрасываем флаг при новой загрузке
      isHistoricalDataLoadedRef.current = false;
      loadStatistics();
    }
  }, [isOpen, macAddress, timeRange, statisticsType, loadStatistics]);

  // Очистка буфера при закрытии модалки
  useEffect(() => {
    if (!isOpen) {
      wsBufferRef.current = { network: [], media: [] };
      isHistoricalDataLoadedRef.current = false;
    }
  }, [isOpen]);

  useEffect(() => {
    const updateDimensions = () => {
      Object.keys(chartRefs).forEach(key => {
        if (chartRefs[key].current) {
          const rect = chartRefs[key].current.getBoundingClientRect();
          setChartDimensions(prev => ({ ...prev, [key]: rect }));
        }
      });
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, [chartData]);

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
      if (domainValue !== null) setSelectionEnd(domainValue);
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

  const handleDoubleClick = useCallback(() => resetZoom(), [resetZoom]);

  const SelectionOverlay = useCallback(({ chartId }) => {
    if (!isSelecting || activeZoomChart !== chartId || selectionStart === null || selectionEnd === null) {
      return null;
    }
    const start = Math.min(selectionStart, selectionEnd);
    const end = Math.max(selectionStart, selectionEnd);
    return (
      <rect
        x={start} y="0" width={end - start} height="100%"
        fill="rgba(136, 132, 216, 0.2)" stroke="#8884d8"
        strokeWidth="2" strokeDasharray="5,5"
        style={{ pointerEvents: 'none' }}
      />
    );
  }, [isSelecting, activeZoomChart, selectionStart, selectionEnd]);

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
      return { ...config, maxBarSize: Math.min(40, config.maxBarSize * 2) };
    }
    if (zoomDomain) {
      return { ...config, maxBarSize: Math.min(30, config.maxBarSize * 1.5) };
    }
    return config;
  }, [zoomDomain]);

  const xAxisDomain = getXAxisDomain();

  if (!isOpen) return null;

  const isNetworkStats = statisticsType === STATISTICS_TYPES.NETWORK;
  const isMediaStats = statisticsType === STATISTICS_TYPES.MEDIA;

  const showRealtimeStatus = isRealtimeAvailable;
  const realtimeActive = isRealtimeConnected;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content statistics-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>
            {isNetworkStats ? <Activity size={20} /> : <Radio size={20} />}
            {isNetworkStats ? 'Network' : 'Media'} Statistics - {macAddress}
          </h2>
          <div className="modal-header-controls">
            <div className="statistics-type-selector">
              <button 
                className={isNetworkStats ? 'active' : ''} 
                onClick={() => setStatisticsType(STATISTICS_TYPES.NETWORK)}
              >
                <Activity size={14} /> Network
              </button>
              <button 
                className={isMediaStats ? 'active' : ''} 
                onClick={() => setStatisticsType(STATISTICS_TYPES.MEDIA)}
              >
                <Film size={14} /> Media
              </button>
            </div>
            
            {showRealtimeStatus && (
              <div className={`realtime-indicator ${realtimeActive ? 'connected' : 'disconnected'}`}>
                {realtimeActive ? <Wifi size={16} /> : <WifiOff size={16} />}
                <span>{realtimeActive ? 'Live' : 'Offline'}</span>
              </div>
            )}
            {zoomDomain && (
              <button className="reset-zoom-button" onClick={resetZoom}>
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
              1 Hour {showRealtimeStatus && <Wifi size={12} />}
            </button>
            <button className={timeRange === '6h' ? 'active' : ''} onClick={() => setTimeRange('6h')}>
              6 Hours {showRealtimeStatus && <Wifi size={12} />}
            </button>
            <button className={timeRange === '24h' ? 'active' : ''} onClick={() => setTimeRange('24h')}>
              24 Hours {showRealtimeStatus && <Wifi size={12} />}
            </button>
            <button className={timeRange === '3d' ? 'active' : ''} onClick={() => setTimeRange('3d')}>
              3 Days
            </button>
            <button className={timeRange === '7d' ? 'active' : ''} onClick={() => setTimeRange('7d')}>
              7 Days
            </button>
          </div>

          {zoomDomain && (
            <div className="zoom-indicator">
              <span>Zoomed: {new Date(zoomDomain[0]).toLocaleString('ru-RU')} - {new Date(zoomDomain[1]).toLocaleString('ru-RU')}</span>
              <span className="zoom-hint">Double-click on chart to reset</span>
            </div>
          )}

          {loading && (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading {isNetworkStats ? 'network' : 'media'} statistics...</p>
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
              {isNetworkStats ? <Activity size={48} /> : <Radio size={48} />}
              <p>No {isNetworkStats ? 'network' : 'media'} statistics available</p>
            </div>
          )}

          {!loading && !error && chartData.length > 0 && (
            <>
              {isNetworkStats && (
                <>
                  <div className="chart-section">
                    <h3 className="chart-title">
                      <TrendingUp size={18} /> Traffic Rate (bits per second)
                      {zoomDomain && activeZoomChart === 'chart1' && <span className="zoom-badge">Zoomed</span>}
                    </h3>
                    <div 
                      className="chart-container" ref={chartRefs.chart1}
                      onMouseDown={handleMouseDown('chart1')}
                      onMouseMove={handleMouseMove('chart1')}
                      onMouseUp={handleMouseUp('chart1')}
                      onMouseLeave={handleMouseLeave('chart1')}
                      onDoubleClick={handleDoubleClick}
                      style={{ cursor: isSelecting && activeZoomChart === 'chart1' ? 'col-resize' : 'crosshair' }}
                    >
                      <ResponsiveContainer width="100%" height={350}>
                        <BarChart data={chartData} margin={{ top: 10, right: 30, left: 20, bottom: 5 }}
                          barCategoryGap={getBarConfig(timeRange, chartData.length).barCategoryGap}
                          barGap={getBarConfig(timeRange, chartData.length).barGap}>
                          <CartesianGrid strokeDasharray="2 4" stroke="rgba(128, 128, 128, 0.08)" />
                          <XAxis dataKey="timestamp" type="number" domain={xAxisDomain}
                            tickFormatter={formatXAxis} tick={{ fontSize: 12 }}
                            angle={-45} textAnchor="end" height={60} scale="time" />
                          <YAxis tick={{ fontSize: 12 }} tickFormatter={formatBits} />
                          <Tooltip formatter={(value, name) => [formatBits(value), name === 'receivedRate' ? 'Download' : 'Upload']}
                            labelFormatter={(ts) => `Time: ${new Date(ts).toLocaleString('ru-RU')}`} />
                          <Legend />
                          <Bar dataKey="receivedRate" name="Download" fill="#82ca9d" opacity={0.85}
                            isAnimationActive={false} maxBarSize={getBarConfig(timeRange, chartData.length).maxBarSize} />
                          <Bar dataKey="sentRate" name="Upload" fill="#8884d8" opacity={0.85}
                            isAnimationActive={false} maxBarSize={getBarConfig(timeRange, chartData.length).maxBarSize} />
                          {chartData.length > 0 && (
                            <ReferenceLine x={chartData[chartData.length - 1].timestamp} stroke="#ff0000"
                              strokeWidth={1} strokeDasharray="3 3"
                              label={{ value: 'Latest', position: 'top', fontSize: 10, fill: '#ff0000' }} />
                          )}
                          <SelectionOverlay chartId="chart1" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="chart-hint">Click and drag to zoom • Double-click to reset</div>
                  </div>

                  <div className="chart-section">
                    <h3 className="chart-title">
                      <Activity size={18} /> Packets per Interval
                      {zoomDomain && activeZoomChart === 'chart2' && <span className="zoom-badge">Zoomed</span>}
                    </h3>
                    <div 
                      className="chart-container" ref={chartRefs.chart2}
                      onMouseDown={handleMouseDown('chart2')}
                      onMouseMove={handleMouseMove('chart2')}
                      onMouseUp={handleMouseUp('chart2')}
                      onMouseLeave={handleMouseLeave('chart2')}
                      onDoubleClick={handleDoubleClick}
                      style={{ cursor: isSelecting && activeZoomChart === 'chart2' ? 'col-resize' : 'crosshair' }}
                    >
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={chartData} margin={{ top: 10, right: 30, left: 20, bottom: 5 }}
                          barCategoryGap={getBarConfig(timeRange, chartData.length).barCategoryGap}
                          barGap={getBarConfig(timeRange, chartData.length).barGap}>
                          <CartesianGrid strokeDasharray="2 4" stroke="rgba(128, 128, 128, 0.08)" />
                          <XAxis dataKey="timestamp" type="number" domain={xAxisDomain}
                            tickFormatter={formatXAxis} tick={{ fontSize: 12 }}
                            angle={-45} textAnchor="end" height={60} scale="time" />
                          <YAxis tick={{ fontSize: 12 }} />
                          <Tooltip formatter={(value, name) => [value.toLocaleString(), name]}
                            labelFormatter={(ts) => `Time: ${new Date(ts).toLocaleString('ru-RU')}`} />
                          <Legend />
                          <Bar dataKey="receivedPacketsDelta" name="Received Packets" fill="#82ca9d" opacity={0.85}
                            isAnimationActive={false} maxBarSize={getBarConfig(timeRange, chartData.length).maxBarSize} />
                          <Bar dataKey="sentPacketsDelta" name="Sent Packets" fill="#8884d8" opacity={0.85}
                            isAnimationActive={false} maxBarSize={getBarConfig(timeRange, chartData.length).maxBarSize} />
                          <SelectionOverlay chartId="chart2" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="chart-hint">Click and drag to zoom • Double-click to reset</div>
                  </div>

                  <div className="chart-section">
                    <h3 className="chart-title">
                      <AlertTriangle size={18} /> Errors per Interval
                      {zoomDomain && activeZoomChart === 'chart3' && <span className="zoom-badge">Zoomed</span>}
                    </h3>
                    <div 
                      className="chart-container" ref={chartRefs.chart3}
                      onMouseDown={handleMouseDown('chart3')}
                      onMouseMove={handleMouseMove('chart3')}
                      onMouseUp={handleMouseUp('chart3')}
                      onMouseLeave={handleMouseLeave('chart3')}
                      onDoubleClick={handleDoubleClick}
                      style={{ cursor: isSelecting && activeZoomChart === 'chart3' ? 'col-resize' : 'crosshair' }}
                    >
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={chartData} margin={{ top: 10, right: 30, left: 20, bottom: 5 }}
                          barCategoryGap={getBarConfig(timeRange, chartData.length).barCategoryGap}
                          barGap={getBarConfig(timeRange, chartData.length).barGap}>
                          <CartesianGrid strokeDasharray="2 4" stroke="rgba(128, 128, 128, 0.08)" />
                          <XAxis dataKey="timestamp" type="number" domain={xAxisDomain}
                            tickFormatter={formatXAxis} tick={{ fontSize: 12 }}
                            angle={-45} textAnchor="end" height={60} scale="time" />
                          <YAxis tick={{ fontSize: 12 }} />
                          <Tooltip formatter={(value, name) => [value.toLocaleString(), name]}
                            labelFormatter={(ts) => `Time: ${new Date(ts).toLocaleString('ru-RU')}`} />
                          <Legend />
                          <Bar dataKey="receivedErrorsDelta" name="Received Errors" fill="#ff7300" opacity={0.85}
                            isAnimationActive={false} maxBarSize={getBarConfig(timeRange, chartData.length).maxBarSize} />
                          <Bar dataKey="sentErrorsDelta" name="Sent Errors" fill="#ff0000" opacity={0.85}
                            isAnimationActive={false} maxBarSize={getBarConfig(timeRange, chartData.length).maxBarSize} />
                          <SelectionOverlay chartId="chart3" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="chart-hint">Click and drag to zoom • Double-click to reset</div>
                  </div>
                </>
              )}

              {isMediaStats && (
                <>
                  <div className="chart-section">
                    <h3 className="chart-title">
                      <Radio size={18} /> Average Bitrate (bps)
                      {zoomDomain && activeZoomChart === 'chart1' && <span className="zoom-badge">Zoomed</span>}
                    </h3>
                    <div 
                      className="chart-container" ref={chartRefs.chart1}
                      onMouseDown={handleMouseDown('chart1')}
                      onMouseMove={handleMouseMove('chart1')}
                      onMouseUp={handleMouseUp('chart1')}
                      onMouseLeave={handleMouseLeave('chart1')}
                      onDoubleClick={handleDoubleClick}
                      style={{ cursor: isSelecting && activeZoomChart === 'chart1' ? 'col-resize' : 'crosshair' }}
                    >
                      <ResponsiveContainer width="100%" height={300}>
                        <ComposedChart data={chartData} margin={{ top: 10, right: 30, left: 20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="2 4" stroke="rgba(128, 128, 128, 0.08)" />
                          <XAxis dataKey="timestamp" type="number" domain={xAxisDomain}
                            tickFormatter={formatXAxis} tick={{ fontSize: 12 }}
                            angle={-45} textAnchor="end" height={60} scale="time" />
                          <YAxis tick={{ fontSize: 12 }} tickFormatter={formatBits} />
                          <Tooltip formatter={(value) => formatBits(value)}
                            labelFormatter={(ts) => `Time: ${new Date(ts).toLocaleString('ru-RU')}`} />
                          <Legend />
                          <Area type="monotone" dataKey="avg_bitrate" name="Bitrate" 
                            fill="#8884d8" stroke="#8884d8" fillOpacity={0.3} />
                          <SelectionOverlay chartId="chart1" />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="chart-hint">Click and drag to zoom • Double-click to reset</div>
                  </div>

                  <div className="chart-section">
                    <h3 className="chart-title">
                      <Video size={18} /> Video Frames
                      {zoomDomain && activeZoomChart === 'chart2' && <span className="zoom-badge">Zoomed</span>}
                    </h3>
                    <div 
                      className="chart-container" ref={chartRefs.chart2}
                      onMouseDown={handleMouseDown('chart2')}
                      onMouseMove={handleMouseMove('chart2')}
                      onMouseUp={handleMouseUp('chart2')}
                      onMouseLeave={handleMouseLeave('chart2')}
                      onDoubleClick={handleDoubleClick}
                      style={{ cursor: isSelecting && activeZoomChart === 'chart2' ? 'col-resize' : 'crosshair' }}
                    >
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={chartData} margin={{ top: 10, right: 30, left: 20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="2 4" stroke="rgba(128, 128, 128, 0.08)" />
                          <XAxis dataKey="timestamp" type="number" domain={xAxisDomain}
                            tickFormatter={formatXAxis} tick={{ fontSize: 12 }}
                            angle={-45} textAnchor="end" height={60} scale="time" />
                          <YAxis tick={{ fontSize: 12 }} />
                          <Tooltip labelFormatter={(ts) => `Time: ${new Date(ts).toLocaleString('ru-RU')}`} />
                          <Legend />
                          <Line type="monotone" dataKey="video_frames_decoded" name="Decoded" 
                            stroke="#82ca9d" strokeWidth={2} dot={false} />
                          <Line type="monotone" dataKey="video_frames_dropped" name="Dropped" 
                            stroke="#ff7300" strokeWidth={2} dot={false} />
                          <Line type="monotone" dataKey="video_frames_failed" name="Failed" 
                            stroke="#ff0000" strokeWidth={2} dot={false} />
                          <SelectionOverlay chartId="chart2" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="chart-hint">Click and drag to zoom • Double-click to reset</div>
                  </div>

                  <div className="chart-section">
                    <h3 className="chart-title">
                      <Volume2 size={18} /> Audio Frames
                      {zoomDomain && activeZoomChart === 'chart3' && <span className="zoom-badge">Zoomed</span>}
                    </h3>
                    <div 
                      className="chart-container" ref={chartRefs.chart3}
                      onMouseDown={handleMouseDown('chart3')}
                      onMouseMove={handleMouseMove('chart3')}
                      onMouseUp={handleMouseUp('chart3')}
                      onMouseLeave={handleMouseLeave('chart3')}
                      onDoubleClick={handleDoubleClick}
                      style={{ cursor: isSelecting && activeZoomChart === 'chart3' ? 'col-resize' : 'crosshair' }}
                    >
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={chartData} margin={{ top: 10, right: 30, left: 20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="2 4" stroke="rgba(128, 128, 128, 0.08)" />
                          <XAxis dataKey="timestamp" type="number" domain={xAxisDomain}
                            tickFormatter={formatXAxis} tick={{ fontSize: 12 }}
                            angle={-45} textAnchor="end" height={60} scale="time" />
                          <YAxis tick={{ fontSize: 12 }} />
                          <Tooltip labelFormatter={(ts) => `Time: ${new Date(ts).toLocaleString('ru-RU')}`} />
                          <Legend />
                          <Line type="monotone" dataKey="audio_frames_decoded" name="Decoded" 
                            stroke="#82ca9d" strokeWidth={2} dot={false} />
                          <Line type="monotone" dataKey="audio_frames_dropped" name="Dropped" 
                            stroke="#ff7300" strokeWidth={2} dot={false} />
                          <Line type="monotone" dataKey="audio_frames_failed" name="Failed" 
                            stroke="#ff0000" strokeWidth={2} dot={false} />
                          <SelectionOverlay chartId="chart3" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="chart-hint">Click and drag to zoom • Double-click to reset</div>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default NetworkStatisticsModal;