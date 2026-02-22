import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Forum from '../../components/Forum';
import FeedbackForm from '../../components/FeedbackForm';
import { eventAPI } from '../../utils/api';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import './EventDetails.css';

const EventDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [event, setEvent] = useState(null);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState('');

  useEffect(() => {
    fetchEvent();
  }, [id]);

  const fetchEvent = async () => {
    try {
      const response = await eventAPI.getById(id);
      setEvent(response.data.event);
      
      // Initialize form data for custom fields
      const initial = {};
      response.data.event.customForm?.fields?.forEach(field => {
        initial[field.fieldId] = '';
      });
      setFormData(initial);
    } catch (error) {
      toast.error('Error loading event');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Please login to register');
      navigate('/login');
      return;
    }

    setRegistering(true);
    
    try {
      if (event.eventType === 'Merchandise') {
        // Merchandise purchase
        await eventAPI.register(id, { 
          formResponses: formData,
          quantity,
          variant: selectedVariant 
        });
        toast.success('Purchase successful! Ticket sent to your email.');
      } else {
        // Normal event registration
        await eventAPI.register(id, formData);
        toast.success('Registration successful! Ticket sent to your email.');
      }
      navigate('/participant/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed');
    } finally {
      setRegistering(false);
    }
  };

  const getBlockingReason = () => {
    if (!event) return null;
    
    const now = new Date();
    const deadline = new Date(event.registrationDeadline);
    
    if (now > deadline) {
      return 'Registration deadline has passed';
    }
    
    if (event.maxParticipants && event.currentParticipants >= event.maxParticipants) {
      return 'Registration limit reached';
    }
    
    if (event.eventType === 'Merchandise' && event.stock !== null && event.stock <= 0) {
      return 'Out of stock';
    }
    
    // Check eligibility
    if (event.eligibility === 'IIIT Only' && user?.participantType !== 'IIIT') {
      return 'This event is only for IIIT participants';
    }
    
    return null;
  };

  const canRegister = () => getBlockingReason() === null;

  const hasEventEnded = () => {
    if (!event) return false;
    const now = new Date();
    const eventEndDate = new Date(event.endDate || event.eventEndDate);
    return now > eventEndDate;
  };

  if (loading) return <><Navbar role="participant" /><div className="container"><div className="loading">Loading event details...</div></div></>;
  if (!event) return <><Navbar role="participant" /><div className="container"><div className="error-message">Event not found</div></div></>;

  const blockingReason = getBlockingReason();

  return (
    <>
      <Navbar role="participant" />
      <div className="container">
        <div className="event-detail-page">
          {/* Event Header */}
          <div className="event-header">
            <div className="event-title-section">
              <h1>{event.title || event.eventName}</h1>
              <span className={`event-type-badge ${event.eventType.toLowerCase()}`}>
                {event.eventType}
              </span>
            </div>
            <p className="event-organizer">
              Organized by <strong>{event.organizer?.clubName || event.organizer?.organizerName || 'Unknown'}</strong>
            </p>
          </div>

          {/* Event Info Grid */}
          <div className="event-info-grid">
            <div className="info-card">
              <span className="info-label">📅 Start Date</span>
              <span className="info-value">{new Date(event.startDate || event.eventStartDate).toLocaleString()}</span>
            </div>
            <div className="info-card">
              <span className="info-label">⏰ End Date</span>
              <span className="info-value">{new Date(event.endDate || event.eventEndDate).toLocaleString()}</span>
            </div>
            <div className="info-card">
              <span className="info-label">📍 Venue</span>
              <span className="info-value">{event.venue}</span>
            </div>
            <div className="info-card">
              <span className="info-label">🎫 Eligibility</span>
              <span className="info-value">{event.eligibility}</span>
            </div>
            <div className="info-card">
              <span className="info-label">⏳ Registration Deadline</span>
              <span className="info-value">{new Date(event.registrationDeadline).toLocaleString()}</span>
            </div>
            <div className="info-card">
              <span className="info-label">👥 Registrations</span>
              <span className="info-value">
                {event.currentParticipants || 0}
                {event.maxParticipants ? ` / ${event.maxParticipants}` : ' (Unlimited)'}
              </span>
            </div>
            {(event.price > 0 || event.registrationFee > 0) && (
              <div className="info-card">
                <span className="info-label">💰 Price</span>
                <span className="info-value">₹{event.price || event.registrationFee}</span>
              </div>
            )}
            {event.eventType === 'Merchandise' && event.stock !== null && (
              <div className="info-card">
                <span className="info-label">📦 Stock</span>
                <span className="info-value">{event.stock > 0 ? `${event.stock} available` : 'Out of stock'}</span>
              </div>
            )}
          </div>

          {/* Event Description */}
          <div className="event-description-section">
            <h2>About This Event</h2>
            <p>{event.description || event.eventDescription}</p>
            
            {/* Merchandise Details */}
            {event.eventType === 'Merchandise' && event.merchandiseDetails && (
              <div className="merchandise-details">
                <h3>📦 Merchandise Options</h3>
                
                {event.merchandiseDetails.variants && event.merchandiseDetails.variants.length > 0 && (
                  <div className="merch-section">
                    <h4>Available Variants:</h4>
                    <div className="variants-grid">
                      {event.merchandiseDetails.variants.map((variant, idx) => (
                        <div key={idx} className="variant-card">
                          <strong>{variant.name}</strong>
                          <span className="variant-price">₹{variant.price}</span>
                          <span className="variant-stock">Stock: {variant.stockQuantity}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {event.merchandiseDetails.sizes && event.merchandiseDetails.sizes.length > 0 && (
                  <div className="merch-section">
                    <h4>Available Sizes:</h4>
                    <div className="options-list">
                      {event.merchandiseDetails.sizes.map((size, idx) => (
                        <span key={idx} className="option-badge">{size}</span>
                      ))}
                    </div>
                  </div>
                )}
                
                {event.merchandiseDetails.colors && event.merchandiseDetails.colors.length > 0 && (
                  <div className="merch-section">
                    <h4>Available Colors:</h4>
                    <div className="options-list">
                      {event.merchandiseDetails.colors.map((color, idx) => (
                        <span key={idx} className="option-badge color-badge">{color}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Blocking Message */}
          {blockingReason && (
            <div className="alert alert-warning">
              <strong>⚠️ Registration Closed:</strong> {blockingReason}
            </div>
          )}

          {/* Registration Form - Normal Event */}
          {canRegister() && event.eventType === 'Normal' && (
            <div className="registration-section">
              <h2>Register for This Event</h2>
              <form onSubmit={handleRegister} className="registration-form">
                {event.customForm?.fields && event.customForm.fields.length > 0 ? (
                  event.customForm.fields.sort((a, b) => a.order - b.order).map((field) => (
                    <div key={field.fieldId} className="form-group">
                      <label>
                        {field.label} {field.required && <span className="required">*</span>}
                      </label>
                      {field.fieldType === 'text' && (
                        <input
                          type="text"
                          value={formData[field.fieldId] || ''}
                          onChange={(e) => setFormData({...formData, [field.fieldId]: e.target.value})}
                          required={field.required}
                          placeholder={field.placeholder || field.label}
                        />
                      )}
                      {field.fieldType === 'textarea' && (
                        <textarea
                          value={formData[field.fieldId] || ''}
                          onChange={(e) => setFormData({...formData, [field.fieldId]: e.target.value})}
                          required={field.required}
                          placeholder={field.placeholder || field.label}
                          rows={4}
                        />
                      )}
                      {field.fieldType === 'dropdown' && (
                        <select
                          value={formData[field.fieldId] || ''}
                          onChange={(e) => setFormData({...formData, [field.fieldId]: e.target.value})}
                          required={field.required}
                        >
                          <option value="">Select...</option>
                          {field.options?.map((opt, idx) => (
                            <option key={idx} value={opt}>{opt}</option>
                          ))}
                        </select>
                      )}
                      {field.fieldType === 'checkbox' && (
                        <label className="checkbox-label">
                          <input
                            type="checkbox"
                            checked={formData[field.fieldId] || false}
                            onChange={(e) => setFormData({...formData, [field.fieldId]: e.target.checked})}
                            required={field.required}
                          />
                          {field.placeholder || 'I agree'}
                        </label>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="info-text">No custom fields required for this event.</p>
                )}
                <button type="submit" className="btn-primary" disabled={registering}>
                  {registering ? 'Processing...' : 'Register Now'}
                </button>
              </form>
            </div>
          )}

          {/* Purchase Form - Merchandise Event */}
          {canRegister() && event.eventType === 'Merchandise' && (
            <div className="registration-section">
              <h2>Purchase This Item</h2>
              <p className="info-text">Click below to proceed with your order and upload payment proof.</p>
              <button 
                onClick={() => navigate(`/participant/merchandise/${event._id}/order`)}
                className="btn-primary"
              >
                🛒 Proceed to Order
              </button>
            </div>
          )}

          {/* Call to Action when not registered */}
          {!user && (
            <div className="alert alert-info">
              <strong>👤 Login Required:</strong> Please <a href="/login">login</a> to register for this event.
            </div>
          )}

          {/* Forum Section - Show if user is logged in */}
          {user && (
            <div className="forum-section">
              <h2>💬 Discussion Forum</h2>
              <Forum 
                eventId={event._id} 
                userRole="participant" 
                userId={user._id}
              />
            </div>
          )}

          {/* Feedback Section - Show after event ends */}
          {user && hasEventEnded() && (
            <div className="feedback-section">
              <h2>⭐ Share Your Feedback</h2>
              <p className="section-subtitle">Help us improve by sharing your experience with this event</p>
              <FeedbackForm 
                eventId={event._id}
                eventName={event.title || event.eventName}
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default EventDetails;
