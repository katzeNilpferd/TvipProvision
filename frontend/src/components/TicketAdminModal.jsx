import React, { useState, useEffect } from 'react'
import { X, Ticket, Clock, User, Calendar, Key, CheckCircle, AlertCircle } from 'lucide-react'
import { getInProgressTickets } from '../services/api'

const TicketAdminModal = ({ isOpen, onClose }) => {
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

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
    onClose()
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleString()
  }

  const getTicketTypeLabel = (type) => {
    switch (type) {
      case 'forgot_password':
        return 'Forgot Password'
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
                <div key={ticket.id} className="ticket-card">
                  <div className="ticket-header">
                    <div className="ticket-type">
                      <Ticket size={16} />
                      {getTicketTypeLabel(ticket.ticket_type)}
                    </div>
                    <div 
                      className="ticket-status"
                      style={{ backgroundColor: getStatusColor(ticket.status) }}
                    >
                      <Clock size={14} />
                      {ticket.status.replace('_', ' ')}
                    </div>
                  </div>
                  
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
                      <div className="ticket-field secret-field">
                        <Key size={16} />
                        <span><strong>Secret Code:</strong> {ticket.secret}</span>
                        <small>{ticket.secret_hint}</small>
                      </div>
                    )}
                    
                    {ticket.description && (
                      <div className="ticket-field">
                        <span><strong>Description:</strong> {ticket.description}</span>
                      </div>
                    )}
                  </div>
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