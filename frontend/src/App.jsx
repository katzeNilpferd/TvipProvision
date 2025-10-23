import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
// import Dashboard from './pages/Dashboard'
import DeviceConfig from './pages/DeviceConfig'
// import DevicesList from './pages/DevicesList'
import './App.css'

function App() {
  return (
    <Layout>
      <Routes>
        {/* <Route path="/" element={<Dashboard />} /> */}
        {/* <Route path="/devices" element={<DevicesList />} /> */}
        <Route path="/devices/:macAddress" element={<DeviceConfig />} />
      </Routes>
    </Layout>
  )
}

export default App