import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authAPI } from '../utils/api';
import { toast } from 'react-toastify';
import './ForgotPassword.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [reason, setReason] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email) {
      toast.error('Please enter your email address');
      return;
    }

    try {
      setLoading(true);
      await authAPI.requestPasswordReset({ email, reason });
      toast.success('Password reset request submitted successfully!');
      setSubmitted(true);
    } catch (error) {
      console.error('Request error:', error);
      toast.error(error.response?.data?.message || 'Error submitting request');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="forgot-password-page">
        <div className="forgot-password-container">
          <div className="success-message">
            <div className="success-icon">✅</div>
            <h1>Request Submitted!</h1>
            <p>
              Your password reset request has been submitted to the admin team.
              You will receive an email with your new credentials once an admin approves your request.
            </p>
            <div className="info-box">
              <strong>What happens next?</strong>
              <ul>
                <li>Admin will review your request</li>
                <li>If approved, you'll receive new login credentials via email</li>
                <li>You can then login with the new password</li>
              </ul>
            </div>
            <Link to="/login" className="btn btn-primary">
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="forgot-password-page">
      <div className="forgot-password-container">
        <div className="forgot-password-header">
          <h1>🔐 Forgot Password</h1>
          <p>Request a password reset from the admin team</p>
        </div>

        <div className="info-notice">
          <strong>Note:</strong> Password resets must be requested and approved by an admin.
          You will receive new credentials via email once approved.
        </div>

        <form onSubmit={handleSubmit} className="forgot-password-form">
          <div className="form-group">
            <label htmlFor="email">Email Address *</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your registered email"
              required
              className="form-input"
            />
            <small className="form-hint">
              Enter the email you used to register your account
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="reason">Reason (Optional)</label>
            <textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Why do you need a password reset?"
              rows="3"
              className="form-textarea"
            />
          </div>

          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? 'Submitting...' : 'Submit Request'}
          </button>
        </form>

        <div className="back-to-login">
          <Link to="/login">← Back to Login</Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
