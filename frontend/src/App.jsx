import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import DeviceConfig from './pages/DeviceConfig'
import DefaultConfig from './pages/DefaultConfig'
import DevicesList from './pages/DevicesList'
import './App.css'

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/devices" element={<DevicesList />} />
        <Route path="/devices/:macAddress" element={<DeviceConfig />} />
        <Route path="/default-config" element={<DefaultConfig />} />
      </Routes>
    </Layout>
  )
}

export default App