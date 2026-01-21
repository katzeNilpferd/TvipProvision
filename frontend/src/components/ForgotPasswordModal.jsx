import React, { useState } from 'react'
import { X, Key, Mail } from 'lucide-react'

const ForgotPasswordModal = ({ isOpen, onClose, onForgotPassword, onRecoverPassword }) => {
  const [step, setStep] = useState(1) // 1 - запрос кода, 2 - ввод кода и нового пароля
  const [username, setUsername] = useState('')
  const [secretKey, setSecretKey] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [requestCodeSent, setRequestCodeSent] = useState(false)

  const handleRequestCode = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    
    if (!username.trim()) {
      setError('Username is required')
      return
    }
    
    setLoading(true)
    
    try {
      await onForgotPassword({ username: username.trim() })
      setSuccess('The password reset request has been sent! Request the recovery code from the administrator.')
      setRequestCodeSent(true)
      setStep(2) // Переход к шагу ввода кода
    } catch (err) {
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to send password reset request'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleRecoverPassword = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    
    // Валидация
    if (!secretKey.trim()) {
      setError('Secret code is required')
      return
    }
    
    if (!newPassword || !confirmPassword) {
      setError('All password fields are required')
      return
    }
    
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long')
      return
    }
    
    setLoading(true)
    
    try {
      await onRecoverPassword({
        username: username.trim(),
        secret_key: secretKey.trim(),
        new_password: newPassword
      })
      setSuccess('Password successfully changed! You can now log in with your new password.')
      
      // Автоматическое закрытие через 1 секунды
      setTimeout(() => {
        handleClose()
      }, 1000)
    } catch (err) {
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to recover password'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    // Очистка формы при закрытии
    setUsername('')
    setSecretKey('')
    setNewPassword('')
    setConfirmPassword('')
    setError('')
    setSuccess('')
    setStep(1)
    setRequestCodeSent(false)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content forgot-password-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>
            {step === 1 ? (
              <>
                <Mail size={20} />
                Forgot Password
              </>
            ) : (
              <>
                <Key size={20} />
                Reset Password
              </>
            )}
          </h2>
          <button className="close-button" onClick={handleClose} aria-label="Close">
            <X size={24} />
          </button>
        </div>
        
        <div className="modal-body">
          {step === 1 ? (
            // Шаг 1: Запрос кода
            <form className="forgot-password-form" onSubmit={handleRequestCode}>
              <p className="form-description">
                Enter your username and we'll send you a secret code to reset your password.
              </p>
              
              {error && <div className="error-message">{error}</div>}
              {success && <div className="success-message">{success}</div>}
              
              <div className="form-group">
                <label htmlFor="forgotUsername">Username</label>
                <input
                  id="forgotUsername"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  required
                  disabled={loading}
                  autoFocus
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
                  {loading ? 'Sending...' : 'Send Reset Request'}
                </button>
              </div>
            </form>
          ) : (
            // Шаг 2: Ввод кода и нового пароля
            <form className="recover-password-form" onSubmit={handleRecoverPassword}>
              <p className="form-description">
                Enter the secret code you received and your new password.
              </p>
              
              {error && <div className="error-message">{error}</div>}
              {success && <div className="success-message">{success}</div>}
              
              <div className="form-group">
                <label htmlFor="secretKey">Secret Code</label>
                <input
                  id="secretKey"
                  type="text"
                  value={secretKey}
                  onChange={(e) => setSecretKey(e.target.value)}
                  placeholder="Enter secret code"
                  required
                  disabled={loading}
                  autoFocus
                />
                <div className="form-hint">Request the recovery code from the administrator</div>
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
                  onClick={() => {
                    setStep(1)
                    setSecretKey('')
                    setNewPassword('')
                    setConfirmPassword('')
                    setError('')
                  }}
                  disabled={loading}
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? 'Resetting...' : 'Reset Password'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

export default ForgotPasswordModal