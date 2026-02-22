import { useState, useEffect } from 'react';
import { feedbackAPI } from '../utils/api';
import { toast } from 'react-toastify';
import './FeedbackView.css';

const FeedbackView = ({ eventId }) => {
  const [stats, setStats] = useState(null);
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRating, setSelectedRating] = useState('all');

  useEffect(() => {
    fetchFeedbackData();
  }, [eventId, selectedRating]);

  const fetchFeedbackData = async () => {
    try {
      setLoading(true);
      
      // Fetch stats and feedbacks in parallel
      const [statsRes, feedbacksRes] = await Promise.all([
        feedbackAPI.getStats(eventId),
        feedbackAPI.getFeedback(eventId, selectedRating !== 'all' ? selectedRating : null)
      ]);

      setStats(statsRes.data.stats);
      setFeedbacks(feedbacksRes.data.feedbacks);
    } catch (error) {
      console.error('Error fetching feedback:', error);
      toast.error('Failed to load feedback data');
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating) => {
    return (
      <div className="star-display">
        {[1, 2, 3, 4, 5].map((star) => (
          <span key={star} className={star <= rating ? 'star filled' : 'star'}>
            ★
          </span>
        ))}
      </div>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRatingLabel = (rating) => {
    const labels = {
      1: 'Poor',
      2: 'Fair',
      3: 'Good',
      4: 'Very Good',
      5: 'Excellent'
    };
    return labels[rating] || '';
  };

  if (loading) {
    return (
      <div className="feedback-view-container">
        <div className="loading">Loading feedback data...</div>
      </div>
    );
  }

  return (
    <div className="feedback-view-container">
      {/* Statistics Section */}
      {stats && (
        <div className="feedback-stats-section">
          <h2>📊 Feedback Summary</h2>
          
          <div className="stats-grid">
            <div className="stat-card highlight">
              <div className="stat-icon">⭐</div>
              <div className="stat-content">
                <div className="stat-value">{stats.averageRating.toFixed(1)}</div>
                <div className="stat-label">Average Rating</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">💬</div>
              <div className="stat-content">
                <div className="stat-value">{stats.totalFeedback}</div>
                <div className="stat-label">Total Responses</div>
              </div>
            </div>
          </div>

          {/* Rating Distribution */}
          <div className="rating-distribution">
            <h3>Rating Distribution</h3>
            <div className="distribution-bars">
              {[5, 4, 3, 2, 1].map((rating) => {
                const count = stats.ratingDistribution[rating];
                const percentage = stats.totalFeedback > 0 
                  ? ((count / stats.totalFeedback) * 100).toFixed(0) 
                  : 0;
                
                return (
                  <div key={rating} className="distribution-row">
                    <div className="rating-label">
                      {rating} ★
                    </div>
                    <div className="bar-container">
                      <div 
                        className={`bar rating-${rating}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <div className="rating-count">
                      {count} ({percentage}%)
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Filter Section */}
      <div className="feedback-filter-section">
        <h2>💭 Participant Feedback</h2>
        <div className="filter-buttons">
          <button
            className={selectedRating === 'all' ? 'filter-btn active' : 'filter-btn'}
            onClick={() => setSelectedRating('all')}
          >
            All ({stats?.totalFeedback || 0})
          </button>
          {[5, 4, 3, 2, 1].map((rating) => (
            <button
              key={rating}
              className={selectedRating === rating.toString() ? 'filter-btn active' : 'filter-btn'}
              onClick={() => setSelectedRating(rating.toString())}
            >
              {rating} ★ ({stats?.ratingDistribution[rating] || 0})
            </button>
          ))}
        </div>
      </div>

      {/* Feedback List */}
      <div className="feedback-list-section">
        {feedbacks.length === 0 ? (
          <div className="no-feedback">
            <p>No feedback available {selectedRating !== 'all' && `for ${selectedRating} star rating`}.</p>
          </div>
        ) : (
          <div className="feedback-cards">
            {feedbacks.map((feedback, index) => (
              <div key={feedback._id || index} className="feedback-card">
                <div className="feedback-header">
                  <div className="feedback-rating">
                    {renderStars(feedback.rating)}
                    <span className="rating-label">{getRatingLabel(feedback.rating)}</span>
                  </div>
                  <div className="feedback-date">
                    {formatDate(feedback.createdAt)}
                  </div>
                </div>
                <div className="feedback-comment">
                  <p>{feedback.comment}</p>
                </div>
                <div className="feedback-footer">
                  <span className="anonymous-badge">🔒 Anonymous</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FeedbackView;
