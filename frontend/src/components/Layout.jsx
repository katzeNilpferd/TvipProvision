import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Wifi, Settings, Home, Sun, Moon } from 'lucide-react'
import { useTheme } from '../context/ThemeContext.jsx'

const Layout = ({ children }) => {
  const location = useLocation()
  const { theme, toggleTheme } = useTheme()

  return (
    <div className="layout">
      <nav className="sidebar">
        <div className="logo">TVIP Manager</div>
        <button
          type="button"
          className="theme-toggle"
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          <span>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
        </button>
        <ul>
          <li className={location.pathname === '/' ? 'active' : ''}>
            <Link to="/">
              <Home size={20} />
              Dashboard
            </Link>
          </li>
          <li className={location.pathname === '/devices' ? 'active' : ''}>
            <Link to="/devices">
              <Wifi size={20} />
              Devices
            </Link>
          </li>
          <li className={location.pathname === '/default-config' ? 'active' : ''}>
            <Link to="/default-config">
              <Settings size={20} />
              Default Config
            </Link>
          </li>
        </ul>
      </nav>
      
      <main className="content">
        {children}
      </main>
    </div>
  )
}

export default Layout