import { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import { adminAPI } from '../../utils/api';
import { toast } from 'react-toastify';
import './PasswordResetRequests.css';

const PasswordResetRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getPasswordResetRequests();
      setRequests(response.data.requests || []);
    } catch (error) {
      console.error('Error fetching password reset requests:', error);
      toast.error('Failed to load password reset requests');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId) => {
    if (!window.confirm('Are you sure you want to approve this password reset request?')) {
      return;
    }

    try {
      setProcessingId(requestId);
      
      // Generate a secure random password
      const newPassword = generateSecurePassword();
      
      const response = await adminAPI.approvePasswordReset(requestId, newPassword);
      
      // Show the generated password to the admin
      setGeneratedPassword(newPassword);
      setShowPasswordModal(true);
      
      toast.success('Password reset request approved');
      await fetchRequests(); // Refresh the list
    } catch (error) {
      console.error('Error approving request:', error);
      toast.error(error.response?.data?.error || 'Failed to approve request');
    } finally {
      setProcessingId(null);
    }
  };

  const generateSecurePassword = () => {
    const length = 12;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
  };

  const handleReject = async (requestId) => {
    if (!window.confirm('Are you sure you want to reject this password reset request?')) {
      return;
    }

    try {
      setProcessingId(requestId);
      await adminAPI.rejectPasswordReset(requestId);
      toast.success('Password reset request rejected');
      await fetchRequests(); // Refresh the list
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast.error(error.response?.data?.error || 'Failed to reject request');
    } finally {
      setProcessingId(null);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedPassword);
    toast.success('Password copied to clipboard');
  };

  const closeModal = () => {
    setShowPasswordModal(false);
    setGeneratedPassword('');
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { label: 'Pending', className: 'badge-pending' },
      approved: { label: 'Approved', className: 'badge-approved' },
      rejected: { label: 'Rejected', className: 'badge-rejected' }
    };
    const badge = badges[status] || badges.pending;
    return <span className={`status-badge ${badge.className}`}>{badge.label}</span>;
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="password-reset-requests-container">
          <div className="loading">Loading password reset requests...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="password-reset-requests-container">
        <div className="page-header">
          <h1>Password Reset Requests</h1>
          <p className="subtitle">Review and manage organizer password reset requests</p>
        </div>

        {requests.length === 0 ? (
          <div className="empty-state">
            <p>No password reset requests found.</p>
          </div>
        ) : (
          <div className="requests-grid">
            {requests.map(request => (
              <div key={request._id} className="request-card">
                <div className="request-header">
                  <div className="user-info">
                    <h3>{request.user?.name || 'Unknown User'}</h3>
                    <p className="user-email">{request.user?.email}</p>
                    <p className="user-type">Type: {request.userType}</p>
                  </div>
                  {getStatusBadge(request.status)}
                </div>

                <div className="request-body">
                  <div className="info-row">
                    <strong>Reason:</strong>
                    <p className="reason-text">{request.reason}</p>
                  </div>
                  <div className="info-row">
                    <strong>Requested:</strong>
                    <span>{formatDate(request.createdAt)}</span>
                  </div>
                  {request.status !== 'pending' && (
                    <>
                      <div className="info-row">
                        <strong>Processed By:</strong>
                        <span>{request.processedBy?.name || 'Unknown Admin'}</span>
                      </div>
                      <div className="info-row">
                        <strong>Processed:</strong>
                        <span>{formatDate(request.processedAt)}</span>
                      </div>
                    </>
                  )}
                </div>

                {request.status === 'pending' && (
                  <div className="request-actions">
                    <button
                      className="btn-approve"
                      onClick={() => handleApprove(request._id)}
                      disabled={processingId === request._id}
                    >
                      {processingId === request._id ? 'Processing...' : '✓ Approve'}
                    </button>
                    <button
                      className="btn-reject"
                      onClick={() => handleReject(request._id)}
                      disabled={processingId === request._id}
                    >
                      {processingId === request._id ? 'Processing...' : '✗ Reject'}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Password Modal */}
        {showPasswordModal && (
          <div className="modal-overlay" onClick={closeModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h2>New Password Generated</h2>
              <p className="modal-subtitle">
                Copy this password and send it to the organizer. This password will not be shown again.
              </p>
              <div className="password-display">
                <code>{generatedPassword}</code>
                <button className="btn-copy" onClick={copyToClipboard}>
                  📋 Copy
                </button>
              </div>
              <div className="modal-actions">
                <button className="btn-close" onClick={closeModal}>
                  Close
                </button>
              </div>
              <div className="warning-box">
                <strong>⚠️ Important:</strong> Make sure to copy this password before closing.
                The organizer should change this password immediately after logging in.
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default PasswordResetRequests;
