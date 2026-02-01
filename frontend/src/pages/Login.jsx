import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ForgotPasswordModal from '../components/ForgotPasswordModal';
import AccountUnlockModal from '../components/AccountUnlockModal';
import { forgotPassword, passwordRecovery } from '../services/api';
import './Login.css';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [showAccountUnlockModal, setShowAccountUnlockModal] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get message from location state (for registration success)
  const message = location.state?.message;
  
  // Get the redirect path from location state, default to dashboard
  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    const result = await login(username, password);
    
    if (result.success) {
      // After successful login, redirect to the intended page
      navigate(from, { replace: true });
    } else {
      if (result.isBlocked) {
        // Show account unlock modal for blocked accounts
        setShowAccountUnlockModal(true);
      } else {
        setError(result.error || 'Login failed');
      }
      setLoading(false);
    }
  };

  const handleUnlockSuccess = () => {
    setShowAccountUnlockModal(false);
    setError('Unlock request submitted successfully. Please contact administration if you need further assistance.');
  };

  const handleUnlockError = (errorMessage) => {
    setError(errorMessage);
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <h1>TVIP Manager</h1>
          <p>Please sign in to continue</p>
        </div>
        
        <form className="login-form" onSubmit={handleSubmit}>
          {message && <div className="success-message">{message}</div>}
          {error && !showAccountUnlockModal && <div className="error-message">{error}</div>}
          
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              required
              disabled={loading}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              disabled={loading}
            />
          </div>
          
          <button 
            type="submit" 
            className="btn btn-primary main-login-button"
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        
        <div className="login-footer">
          <div className="login-links">
            <p>
              Don't have an account?{' '}
              <Link to="/register" className="login-link">
                Create one here
              </Link>
            </p>
            <button 
              type="button"
              className="forgot-password-link"
              onClick={() => setShowForgotPasswordModal(true)}
            >
              Forgot password?
            </button>
          </div>
        </div>
      </div>
      
      <ForgotPasswordModal
        isOpen={showForgotPasswordModal}
        onClose={() => setShowForgotPasswordModal(false)}
        onForgotPassword={forgotPassword}
        onRecoverPassword={passwordRecovery}
      />
      
      <AccountUnlockModal
        isOpen={showAccountUnlockModal}
        onClose={() => setShowAccountUnlockModal(false)}
        username={username}
        onUnlockSuccess={handleUnlockSuccess}
        onUnlockError={handleUnlockError}
      />
    </div>
  );
};

export default Login;