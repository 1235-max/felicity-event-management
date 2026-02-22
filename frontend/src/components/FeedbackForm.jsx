import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { feedbackAPI } from '../utils/api';
import './FeedbackForm.css';

const FeedbackForm = ({ eventId, eventName, onSubmitSuccess }) => {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [existingFeedback, setExistingFeedback] = useState(null);
  const [checkingFeedback, setCheckingFeedback] = useState(true);

  useEffect(() => {
    checkExistingFeedback();
  }, [eventId]);

  const checkExistingFeedback = async () => {
    try {
      setCheckingFeedback(true);
      const response = await feedbackAPI.checkFeedback(eventId);
      if (response.data.hasFeedback) {
        setExistingFeedback(response.data.feedback);
        setRating(response.data.feedback.rating);
        setComment(response.data.feedback.comment);
      }
    } catch (error) {
      console.error('Error checking feedback:', error);
    } finally {
      setCheckingFeedback(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }

    if (!comment.trim()) {
      toast.error('Please provide a comment');
      return;
    }

    try {
      setLoading(true);
      const response = await feedbackAPI.submitFeedback({
        eventId,
        rating,
        comment
      });

      toast.success(response.data.message || 'Feedback submitted successfully!');
      setExistingFeedback(response.data.feedback);
      
      if (onSubmitSuccess) {
        onSubmitSuccess();
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast.error(error.response?.data?.error || 'Failed to submit feedback');
    } finally {
      setLoading(false);
    }
  };

  if (checkingFeedback) {
    return (
      <div className="feedback-form-container">
        <div className="loading-feedback">Loading...</div>
      </div>
    );
  }

  return (
    <div className="feedback-form-container">
      <div className="feedback-form-card">
        <h2>📝 {existingFeedback ? 'Update Your Feedback' : 'Submit Feedback'}</h2>
        <p className="feedback-subtitle">
          Your feedback is anonymous and helps us improve future events.
        </p>

        {existingFeedback && (
          <div className="existing-feedback-notice">
            <strong>✓ You already submitted feedback for this event.</strong>
            <p>You can update your rating and comment below.</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="feedback-form">
          <div className="form-group">
            <label>Rating *</label>
            <div className="star-rating">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className={`star ${(hoveredRating || rating) >= star ? 'filled' : ''}`}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  disabled={loading}
                >
                  ★
                </button>
              ))}
            </div>
            <p className="rating-text">
              {rating === 0 && 'Select a rating'}
              {rating === 1 && '⭐ Poor'}
              {rating === 2 && '⭐⭐ Fair'}
              {rating === 3 && '⭐⭐⭐ Good'}
              {rating === 4 && '⭐⭐⭐⭐ Very Good'}
              {rating === 5 && '⭐⭐⭐⭐⭐ Excellent'}
            </p>
          </div>

          <div className="form-group">
            <label htmlFor="comment">Your Feedback *</label>
            <textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your experience with this event... (max 1000 characters)"
              rows={5}
              maxLength={1000}
              required
              disabled={loading}
            />
            <small className="char-count">
              {comment.length}/1000 characters
            </small>
          </div>

          <div className="anonymous-notice">
            <span className="anonymous-icon">🔒</span>
            <p>Your feedback will be submitted anonymously. The organizer will not see your name.</p>
          </div>

          <button type="submit" className="btn-submit-feedback" disabled={loading}>
            {loading ? 'Submitting...' : existingFeedback ? 'Update Feedback' : 'Submit Feedback'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default FeedbackForm;
