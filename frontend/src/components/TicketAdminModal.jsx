import React, { useState, useEffect } from 'react'
import { X, Ticket, Clock, User, Calendar, Key, CheckCircle, AlertCircle, Check, XCircle } from 'lucide-react'
import { getInProgressTickets, approveTicket, rejectTicket } from '../services/api'

const TicketAdminModal = ({ isOpen, onClose }) => {
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(false)
  const [processingTicketId, setProcessingTicketId] = useState(null)
  const [successMessage, setSuccessMessage] = useState('')
  const [error, setError] = useState('')
  const [revealedSecrets, setRevealedSecrets] = useState(new Set())
  const [expandedTicketId, setExpandedTicketId] = useState(null)

  useEffect(() => {
    if (isOpen) {
      loadTickets()
    }
  }, [isOpen])

  const loadTickets = async () => {
    setLoading(true)
    setError('')
    
    try {
      const data = await getInProgressTickets()
      setTickets(data)
    } catch (err) {
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to load tickets'
      setError(errorMessage)
      console.error('Error loading tickets:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setTickets([])
    setError('')
    setSuccessMessage('')
    setProcessingTicketId(null)
    setRevealedSecrets(new Set())
    setExpandedTicketId(null)
    onClose()
  }

  const handleApproveTicket = async (ticketId) => {
    setProcessingTicketId(ticketId)
    setError('')
    setSuccessMessage('')
    
    try {
      await approveTicket(ticketId)
      setSuccessMessage('Ticket approved successfully')
      // Reload tickets to show updated status
      await loadTickets()
    } catch (err) {
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to approve ticket'
      setError(errorMessage)
      console.error('Error approving ticket:', err)
    } finally {
      setProcessingTicketId(null)
    }
  }

  const handleRejectTicket = async (ticketId) => {
    setProcessingTicketId(ticketId)
    setError('')
    setSuccessMessage('')
    
    try {
      await rejectTicket(ticketId)
      setSuccessMessage('Ticket rejected successfully')
      // Reload tickets to show updated status
      await loadTickets()
    } catch (err) {
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to reject ticket'
      setError(errorMessage)
      console.error('Error rejecting ticket:', err)
    } finally {
      setProcessingTicketId(null)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleString()
  }

  const getTicketTypeLabel = (type) => {
    switch (type) {
      case 'forgot_password':
        return 'Forgot Password'
      case 'privilege_upgrade':
        return 'Privilege Upgrade'
      default:
        return type
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'in_progress':
        return '#3b82f6' // blue
      default:
        return '#6b7280' // gray
    }
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content ticket-admin-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>
            <Ticket size={20} />
            Ticket Administration
          </h2>
          <button className="close-button" onClick={handleClose} aria-label="Close">
            <X size={24} />
          </button>
        </div>
        
        <div className="modal-body">
          {successMessage && (
            <div className="success-message">
              <CheckCircle size={16} />
              {successMessage}
            </div>
          )}
          
          {error && (
            <div className="error-message">
              <AlertCircle size={16} />
              {error}
            </div>
          )}
          
          {loading ? (
            <div className="loading-container">
              <div className="spinner"></div>
              <p>Loading tickets...</p>
            </div>
          ) : tickets.length === 0 ? (
            <div className="empty-state">
              <Ticket size={48} />
              <p>No active tickets found</p>
            </div>
          ) : (
            <div className="tickets-list">
              {tickets.map((ticket) => (
                <div 
                  key={ticket.id} 
                  className={`ticket-card ${expandedTicketId === ticket.id ? 'expanded' : ''}`} 
                  data-ticket-id={ticket.id}
                  onClick={() => setExpandedTicketId(expandedTicketId === ticket.id ? null : ticket.id)}
                >
                  <div className="ticket-header">
                    <div className="ticket-summary">
                      <div className="ticket-type">
                        <Ticket size={16} />
                        {getTicketTypeLabel(ticket.ticket_type)}
                      </div>
                      <div className="ticket-user">
                        <User size={14} />
                        {ticket.username}
                      </div>
                    </div>
                    <div className="ticket-header-right">
                      <div 
                        className="ticket-status"
                        style={{ backgroundColor: getStatusColor(ticket.status) }}
                      >
                        <Clock size={14} />
                        {ticket.status.replace('_', ' ')}
                      </div>
                      <div className="expand-indicator">
                        {expandedTicketId === ticket.id ? '▼' : '▶'}
                      </div>
                    </div>
                  </div>
                  
                  {expandedTicketId === ticket.id && (
                    <div className="ticket-details">
                      <div className="ticket-content">
                        <div className="ticket-field">
                          <User size={16} />
                          <span><strong>Username:</strong> {ticket.username}</span>
                        </div>
                        
                        <div className="ticket-field">
                          <Calendar size={16} />
                          <span><strong>Created:</strong> {formatDate(ticket.created_at)}</span>
                        </div>
                        
                        {ticket.secret && (
                          <div 
                            className={`ticket-field secret-field ${revealedSecrets.has(ticket.id) ? 'revealed' : 'blurred'}`}
                          >
                            <Key size={16} />
                            <span>
                              <strong>Secret Code:</strong> 
                              <span className="secret-code">{ticket.secret}</span>
                            </span>
                            <small>{ticket.secret_hint}</small>
                          </div>
                        )}
                        
                        {ticket.description && (
                          <div className="ticket-field">
                            <span><strong>Description:</strong> {ticket.description}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="ticket-actions">
                        {ticket.ticket_type === 'forgot_password' ? (
                          <button 
                            className="btn btn-primary" 
                            onClick={() => {
                              // Reveal the secret code
                              setRevealedSecrets(prev => new Set([...prev, ticket.id]));
                              
                              // Scroll to secret field and highlight it
                              setTimeout(() => {
                                const secretField = document.querySelector(`[data-ticket-id="${ticket.id}"] .secret-field`);
                                if (secretField) {
                                  secretField.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                  secretField.style.animation = 'highlight 2s';
                                }
                              }, 100);
                            }}
                          >
                            <Key size={16} />
                            Show Secret
                          </button>
                        ) : (
                          <>
                            <button 
                              className="btn btn-success" 
                              onClick={() => handleApproveTicket(ticket.id)}
                              disabled={processingTicketId === ticket.id}
                            >
                              {processingTicketId === ticket.id ? (
                                <>
                                  <div className="spinner-small"></div>
                                  Processing...
                                </>
                              ) : (
                                <>
                                  <Check size={16} />
                                  Approve
                                </>
                              )}
                            </button>
                            <button 
                              className="btn btn-danger" 
                              onClick={() => handleRejectTicket(ticket.id)}
                              disabled={processingTicketId === ticket.id}
                            >
                              {processingTicketId === ticket.id ? (
                                <>
                                  <div className="spinner-small"></div>
                                  Processing...
                                </>
                              ) : (
                                <>
                                  <XCircle size={16} />
                                  Reject
                                </>
                              )}
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={loadTickets} disabled={loading}>
            Refresh
          </button>
          <button className="btn btn-primary" onClick={handleClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default TicketAdminModal