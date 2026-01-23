import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Wifi, Settings, Home, Sun, Moon, LogOut, User, Cog, Ticket } from 'lucide-react'
import { useTheme } from '../context/ThemeContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import UserProfileModal from './UserProfileModal.jsx'
import TicketAdminModal from './TicketAdminModal.jsx'

const Layout = ({ children }) => {
  const authEnabled = import.meta.env.VITE_AUTH_ENABLED === 'true';
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);

  const location = useLocation()
  const { theme, toggleTheme } = useTheme()
  const { isAuthenticated, user, logout } = useAuth()

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
        
        {authEnabled && (
          <div className="auth-section">
            {isAuthenticated ? (
              <div className="user-info">
                <div className="user-header">
                  <span className="username">
                    <User size={14} />
                    <span className="username-text">
                      {user?.username && user.username.length > 18 
                        ? `${user.username.substring(0, 18)}...` 
                        : user?.username
                      }
                    </span>
                  </span>
                  <div className="user-actions">
                    {user?.is_admin && (
                      <button
                        className="admin-button"
                        onClick={() => setIsTicketModalOpen(true)}
                        aria-label="Ticket administration"
                        title="Ticket administration"
                      >
                        <Ticket size={16} />
                      </button>
                    )}
                    <button
                      className="settings-button"
                      onClick={() => setIsProfileModalOpen(true)}
                      aria-label="Profile settings"
                      title="Profile settings"
                    >
                      <Cog size={16} />
                    </button>
                  </div>
                </div>
                <button
                  className="logout-button"
                  onClick={logout}
                  aria-label="Logout"
                >
                  <LogOut size={16} />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <Link to="/login" className="login-button">
                <span>Login</span>
              </Link>
            )}
          </div>
        )}
        
      </nav>
      
      <main className="content">
        {children}
      </main>
      
      <UserProfileModal 
        isOpen={isProfileModalOpen} 
        onClose={() => setIsProfileModalOpen(false)} 
      />
      <TicketAdminModal 
        isOpen={isTicketModalOpen} 
        onClose={() => setIsTicketModalOpen(false)} 
      />
    </div>
  )
}

export default Layout