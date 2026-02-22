import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { adminAPI } from '../../utils/api';
import { toast } from 'react-toastify';
import './PasswordResets.css';

const PasswordResets = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('Pending');
  const [counts, setCounts] = useState({ pending: 0, approved: 0, rejected: 0 });

  useEffect(() => {
    fetchRequests();
  }, [filterStatus]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getPasswordResetRequests(filterStatus);
      setRequests(response.data.requests);
      setCounts(response.data.counts);
    } catch (error) {
      console.error('Error loading requests:', error);
      toast.error('Error loading password reset requests');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId, email, name) => {
    const newPassword = prompt(
      `Approve password reset for ${name}?\n\nEnter new password (minimum 6 characters):`
    );

    if (!newPassword) return;

    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    try {
      const response = await adminAPI.approvePasswordReset(requestId, newPassword);
      toast.success('Password reset approved! New credentials sent to user.');
      toast.info(`New Password: ${response.data.newPassword}`, { autoClose: 10000 });
      fetchRequests();
    } catch (error) {
      console.error('Approve error:', error);
      toast.error(error.response?.data?.message || 'Error approving request');
    }
  };

  const handleReject = async (requestId, name) => {
    const adminNotes = prompt(`Reject password reset request for ${name}?\n\nOptional reason:`);

    if (adminNotes === null) return; // Cancelled

    try {
      await adminAPI.rejectPasswordReset(requestId, adminNotes);
      toast.success('Password reset request rejected');
      fetchRequests();
    } catch (error) {
      console.error('Reject error:', error);
      toast.error(error.response?.data?.message || 'Error rejecting request');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <>
        <Navbar role="admin" />
        <div className="container">
          <div className="loading">Loading requests...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar role="admin" />
      <div className="password-resets">
        <div className="container">
          <div className="page-header">
            <div>
              <Link to="/admin/dashboard" className="back-link">← Back to Dashboard</Link>
              <h1>Password Reset Requests</h1>
              <p className="subtitle">Manage user password reset requests (Section 13.2)</p>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="filter-tabs">
            <button
              className={filterStatus === 'Pending' ? 'tab active' : 'tab'}
              onClick={() => setFilterStatus('Pending')}
            >
              Pending ({counts.pending})
            </button>
            <button
              className={filterStatus === 'Approved' ? 'tab active' : 'tab'}
              onClick={() => setFilterStatus('Approved')}
            >
              Approved ({counts.approved})
            </button>
            <button
              className={filterStatus === 'Rejected' ? 'tab active' : 'tab'}
              onClick={() => setFilterStatus('Rejected')}
            >
              Rejected ({counts.rejected})
            </button>
            <button
              className={filterStatus === '' ? 'tab active' : 'tab'}
              onClick={() => setFilterStatus('')}
            >
              All ({counts.pending + counts.approved + counts.rejected})
            </button>
          </div>

          <div className="requests-section">
            {requests.length > 0 ? (
              <div className="requests-list">
                {requests.map((request) => (
                  <div key={request._id} className={`request-card status-${request.status.toLowerCase()}`}>
                    <div className="request-header">
                      <div>
                        <h3>{request.name}</h3>
                        <p className="request-email">{request.email}</p>
                        <span className="user-type-badge">
                          {request.userType === 'organizer' ? '🏢 Organizer' : '👤 Participant'}
                        </span>
                      </div>
                      <span className={`status-badge status-${request.status.toLowerCase()}`}>
                        {request.status}
                      </span>
                    </div>
                    
                    <div className="request-body">
                      {request.reason && (
                        <div className="request-reason">
                          <strong>Reason:</strong> {request.reason}
                        </div>
                      )}
                      <div className="request-meta">
                        <span>📅 Requested: {formatDate(request.createdAt)}</span>
                        {request.processedAt && (
                          <span>✅ Processed: {formatDate(request.processedAt)}</span>
                        )}
                      </div>
                      {request.adminNotes && (
                        <div className="admin-notes">
                          <strong>Admin Notes:</strong> {request.adminNotes}
                        </div>
                      )}
                    </div>

                    {request.status === 'Pending' && (
                      <div className="request-actions">
                        <button
                          onClick={() => handleApprove(request._id, request.email, request.name)}
                          className="btn btn-success btn-sm"
                        >
                          ✅ Approve & Set Password
                        </button>
                        <button
                          onClick={() => handleReject(request._id, request.name)}
                          className="btn btn-danger btn-sm"
                        >
                          ❌ Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-requests">
                <div className="no-requests-icon">🔐</div>
                <h2>No {filterStatus || ''} Requests</h2>
                <p>
                  {filterStatus === 'Pending' 
                    ? 'There are currently no pending password reset requests.'
                    : `No ${filterStatus.toLowerCase()} requests found.`}
                </p>
                <Link to="/admin/dashboard" className="btn btn-primary">
                  Back to Dashboard
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default PasswordResets;
