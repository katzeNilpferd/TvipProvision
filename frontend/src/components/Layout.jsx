import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Wifi, Settings, Home } from 'lucide-react'

const Layout = ({ children }) => {
  const location = useLocation()

  return (
    <div className="layout">
      <nav className="sidebar">
        <div className="logo">TVIP Manager</div>
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
        </ul>
      </nav>
      
      <main className="content">
        {children}
      </main>
    </div>
  )
}

export default Layout