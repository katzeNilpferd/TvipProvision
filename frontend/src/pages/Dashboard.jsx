import React, { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { Laptop, Calendar, Network, Activity, TrendingUp } from 'lucide-react'
import { getDevices } from '../services/api'
import './Dashboard.css'

const Dashboard = () => {
  const [devices, setDevices] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalDevices: 0,
    onlineDevices: 0,
    // offlineDevices: 0,
    modelDistribution: [],
    recentActivity: []
  })

  useEffect(() => {
    loadDevices()
  }, [])

  const loadDevices = async () => {
    try {
      const data = await getDevices()
      setDevices(data)
      calculateStats(data)
    } catch (error) {
      console.error('Failed to load devices:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (devicesData) => {
    // Total devices
    const totalDevices = devicesData.length
    
    // Online/offline devices (consider online if activity in last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const onlineDevices = devicesData.filter(device => {
      if (!device.last_activity) return false
      
      return new Date(device.last_activity) > oneDayAgo
    }).length
    // const offlineDevices = totalDevices - onlineDevices
    
    // Model distribution
    const modelCount = {}
    devicesData.forEach(device => {
      const model = device.model || 'Unknown'
      modelCount[model] = (modelCount[model] || 0) + 1
    })
    
    const modelDistribution = Object.entries(modelCount).map(([name, count]) => ({
      name,
      value: count
    }))
    
    // Recent activity (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const recentDevices = devicesData.filter(device => {
      if (!device.last_activity) return false
      
      return new Date(device.last_activity) > sevenDaysAgo
    })
    
    // Group by date
    const activityByDate = {}
    recentDevices.forEach(device => {
      const date = new Date(device.last_activity).toISOString().split('T')[0]
      activityByDate[date] = (activityByDate[date] || 0) + 1
    })
    
    const recentActivity = Object.entries(activityByDate)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => new Date(a.date) - new Date(b.date))
    
    setStats({
      totalDevices,
      onlineDevices,
      // offlineDevices,
      modelDistribution,
      recentActivity
    })
  }

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

  if (loading) return <div className="loading">Loading dashboard...</div>

  return (
    <div className="page dashboard-page">
      {/* Header */}
      <div className="page-header">
        <div className="header-title">
          <h1>Dashboard</h1>
          <p>Overview of your TVIP devices</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon primary">
            <Laptop size={24} />
          </div>
          <div className="stat-content">
            <h3>{stats.totalDevices}</h3>
            <p>Total Devices</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon success">
            <Activity size={24} />
          </div>
          <div className="stat-content">
            <h3>{stats.onlineDevices}</h3>
            <p>Online (24h)</p>
          </div>
        </div>
        
        {/* <div className="stat-card">
          <div className="stat-icon warning">
            <Network size={24} />
          </div>
          <div className="stat-content">
            <h3>{stats.offlineDevices}</h3>
            <p>Offline</p>
          </div>
        </div> */}
        
        <div className="stat-card">
          <div className="stat-icon info">
            <TrendingUp size={24} />
          </div>
          <div className="stat-content">
            <h3>{stats.recentActivity.reduce((sum, item) => sum + item.count, 0)}</h3>
            <p>Active (7d)</p>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="charts-grid">
        <div className="chart-container">
          <h2>Device Models</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={stats.modelDistribution}
                cx="50%"
                cy="50%"
                labelLine={true}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {stats.modelDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        <div className="chart-container">
          <h2>Recent Activity (7 days)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={stats.recentActivity}
              margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" angle={-45} textAnchor="end" height={60} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" name="Active Devices" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

export default Dashboard