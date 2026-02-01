import React, { useState } from 'react';
import { accountUnlock } from '../services/api';

const AccountUnlockModal = ({ 
  isOpen, 
  onClose, 
  username,
  onUnlockSuccess,
  onUnlockError 
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    try {
      await accountUnlock({ username });
      setMessage('Unlock request submitted successfully. An administrator will review your request.');
      if (onUnlockSuccess) {
        onUnlockSuccess();
      }
    } catch (error) {
      console.error('Account unlock error:', error);
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to submit unlock request';
      setMessage(errorMessage);
      if (onUnlockError) {
        onUnlockError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Account Locked</h2>
          <button className="close-button" onClick={onClose} disabled={isLoading}>
            ×
          </button>
        </div>
        
        <div className="modal-body">
          <p>Your account has been locked by administration. Would you like to submit a request to unlock it?</p>
          
          {message && (
            <div className={`alert ${message.includes('successfully') ? 'alert-success' : 'alert-error'}`}>
              {message}
            </div>
          )}
          
          <div className="modal-actions">
            <button 
              type="button" 
              className="btn btn-secondary"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              onClick={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? 'Submitting...' : 'Submit Unlock Request'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountUnlockModal;