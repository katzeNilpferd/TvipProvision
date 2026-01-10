import React, { useState } from 'react'
import { X, Key, User } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { changePassword } from '../services/api'

const UserProfileModal = ({ isOpen, onClose }) => {
  const { user } = useAuth()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    
    // Валидация
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('All fields are required')
      return
    }
    
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match')
      return
    }
    
    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters long')
      return
    }
    
    if (currentPassword === newPassword) {
      setError('New password must be different from current password')
      return
    }
    
    setLoading(true)
    
    try {
      await changePassword(user.id, currentPassword, newPassword)
      setSuccess('Password changed successfully!')
      // Очистка формы
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      
      // Автоматическое закрытие через 2 секунды
      setTimeout(() => {
        onClose()
        setSuccess('')
      }, 2000)
    } catch (err) {
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to change password'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    // Очистка формы при закрытии
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setError('')
    setSuccess('')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content profile-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>
            <User size={20} />
            Profile Settings
          </h2>
          <button className="close-button" onClick={handleClose} aria-label="Close">
            <X size={24} />
          </button>
        </div>
        
        <div className="profile-info">
          <div className="user-details">
            <User size={48} />
            <div>
              <h3>{user?.username}</h3>
              <p>User ID: {user?.id}</p>
            </div>
          </div>
        </div>
        
        <form className="change-password-form" onSubmit={handleSubmit}>
          <h3>
            <Key size={18} />
            Change Password
          </h3>
          
          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}
          
          <div className="form-group">
            <label htmlFor="currentPassword">Current Password</label>
            <input
              id="currentPassword"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
              required
              disabled={loading}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="newPassword">New Password</label>
            <input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
              required
              disabled={loading}
              minLength={6}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm New Password</label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              required
              disabled={loading}
            />
          </div>
          
          <div className="form-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Changing...' : 'Change Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default UserProfileModal