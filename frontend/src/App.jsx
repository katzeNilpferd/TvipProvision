import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import Dashboard from './pages/Dashboard'
import DeviceConfig from './pages/DeviceConfig'
import DefaultConfig from './pages/DefaultConfig'
import DevicesList from './pages/DevicesList'
import Login from './pages/Login'
import Register from './pages/Register'
import './App.css'

function App() {
  const authEnabled = import.meta.env.VITE_AUTH_ENABLED === 'true';

  return (
    <Layout>
      <Routes>
        {authEnabled && (
          <>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </>
        )}
        <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/devices" element={<ProtectedRoute><DevicesList /></ProtectedRoute>} />
        <Route path="/devices/:macAddress" element={<ProtectedRoute><DeviceConfig /></ProtectedRoute>} />
        <Route path="/default-config" element={<ProtectedRoute><DefaultConfig /></ProtectedRoute>} />
        <Route path="*" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      </Routes>
    </Layout>
  )
}

export default App