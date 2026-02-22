import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { organizerAPI } from '../../utils/api';
import { toast } from 'react-toastify';
import './PasswordReset.css';

const PasswordReset = () => {
  const navigate = useNavigate();
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!reason.trim()) {
      toast.error('Please provide a reason for password reset');
      return;
    }

    try {
      setLoading(true);
      const response = await organizerAPI.requestPasswordReset({ reason });
      toast.success(response.data.message || 'Password reset request submitted successfully');
      setReason('');
      // Optionally navigate back
      setTimeout(() => navigate('/organizer/dashboard'), 2000);
    } catch (error) {
      console.error('Error submitting password reset request:', error);
      toast.error(error.response?.data?.error || 'Failed to submit request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="password-reset-container">
        <div className="password-reset-card">
          <h1>Request Password Reset</h1>
          <p className="subtitle">
            Submit a request to reset your password. An admin will review and approve your request.
          </p>
          
          <form onSubmit={handleSubmit} className="password-reset-form">
            <div className="form-group">
              <label htmlFor="reason">Reason for Password Reset *</label>
              <textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Please explain why you need a password reset (e.g., forgot password, security concern)"
                rows={5}
                required
                disabled={loading}
              />
              <small className="form-hint">
                Be specific about your reason. This will help admins process your request faster.
              </small>
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => navigate('/organizer/dashboard')}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={loading}
              >
                {loading ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>
          </form>

          <div className="info-box">
            <h3>📋 What happens next?</h3>
            <ul>
              <li>Your request will be reviewed by an administrator</li>
              <li>You'll receive an email once your request is processed</li>
              <li>If approved, you'll receive a new temporary password</li>
              <li>Change your password immediately after logging in</li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
};

export default PasswordReset;
