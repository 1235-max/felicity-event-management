import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { eventAPI } from '../../utils/api';
import { toast } from 'react-toastify';
import './EditEvent.css';

const EditEvent = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    eventType: 'Normal',
    eligibility: 'All',
    startDate: '',
    endDate: '',
    registrationDeadline: '',
    venue: '',
    maxParticipants: '',
    price: 0,
    stock: '',
    imageUrl: ''
  });
  const [customFields, setCustomFields] = useState([]);
  const [editingRules, setEditingRules] = useState(null);
  const [formLocked, setFormLocked] = useState(false);

  useEffect(() => {
    fetchEvent();
  }, [id]);

  const fetchEvent = async () => {
    try {
      setLoading(true);
      const response = await eventAPI.getById(id);
      const eventData = response.data.event;
      setEvent(eventData);

      // Format dates for datetime-local input
      const formatDate = (date) => {
        if (!date) return '';
        const d = new Date(date);
        return d.toISOString().slice(0, 16);
      };

      setFormData({
        title: eventData.title || eventData.eventName || '',
        description: eventData.description || eventData.eventDescription || '',
        eventType: eventData.eventType || 'Normal',
        eligibility: eventData.eligibility || 'All',
        startDate: formatDate(eventData.startDate || eventData.eventStartDate),
        endDate: formatDate(eventData.endDate || eventData.eventEndDate),
        registrationDeadline: formatDate(eventData.registrationDeadline),
        venue: eventData.venue || '',
        maxParticipants: eventData.maxParticipants || eventData.registrationLimit || '',
        price: eventData.price || eventData.registrationFee || 0,
        stock: eventData.stock || eventData.stockQuantity || '',
        imageUrl: eventData.imageUrl || ''
      });

      // Load custom form fields
      const fields = eventData.customRegistrationForm?.fields || eventData.customForm?.fields || [];
      setCustomFields(fields);
      setFormLocked(
        eventData.customRegistrationForm?.isLocked ||
        eventData.customForm?.isLocked ||
        (eventData.currentParticipants && eventData.currentParticipants > 0)
      );
    } catch (error) {
      console.error('Error loading event:', error);
      toast.error('Error loading event');
      navigate('/organizer/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate dates
    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    const deadline = new Date(formData.registrationDeadline);

    if (deadline > start) {
      toast.error('Registration deadline must be before the event start date');
      return;
    }

    if (end < start) {
      toast.error('End date must be after start date');
      return;
    }

    try {
      const response = await eventAPI.update(id, formData);
      toast.success('Event updated successfully!');
      setEditingRules(response.data.editingRules);
      fetchEvent(); // Refresh data
    } catch (error) {
      console.error('Update event error:', error);
      toast.error(error.response?.data?.message || 'Error updating event');
    }
  };

  const handlePublish = async () => {
    if (!window.confirm('Publish this event? It will be visible to all users.')) {
      return;
    }

    try {
      await eventAPI.publish(id);
      toast.success('Event published successfully!');
      fetchEvent();
    } catch (error) {
      console.error('Publish error:', error);
      toast.error(error.response?.data?.message || 'Error publishing event');
    }
  };

  const handleStatusChange = async (newStatus) => {
    if (!window.confirm(`Change event status to ${newStatus}?`)) {
      return;
    }

    try {
      await eventAPI.update(id, { status: newStatus });
      toast.success(`Event marked as ${newStatus}`);
      fetchEvent();
    } catch (error) {
      console.error('Status change error:', error);
      toast.error(error.response?.data?.message || 'Error changing status');
    }
  };

  // Form Builder Functions
  const addField = () => {
    setCustomFields([
      ...customFields,
      {
        fieldId: `field_${Date.now()}`,
        fieldType: 'text',
        label: '',
        options: [],
        required: false,
        order: customFields.length
      }
    ]);
  };

  const updateField = (index, updates) => {
    const updated = [...customFields];
    updated[index] = { ...updated[index], ...updates };
    setCustomFields(updated);
  };

  const removeField = (index) => {
    setCustomFields(customFields.filter((_, idx) => idx !== index));
  };

  const moveField = (index, direction) => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= customFields.length) return;

    const updated = [...customFields];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    
    // Update order property
    updated.forEach((field, idx) => {
      field.order = idx;
    });

    setCustomFields(updated);
  };

  const saveCustomForm = async () => {
    try {
      await eventAPI.updateForm(id, customFields);
      toast.success('Custom form updated successfully!');
      fetchEvent();
    } catch (error) {
      console.error('Form update error:', error);
      toast.error(error.response?.data?.message || 'Error updating form');
    }
  };

  const canEdit = (field) => {
    const status = event?.status;
    if (status === 'Draft') return true;
    if (status === 'Published') {
      return ['description', 'venue', 'registrationDeadline', 'maxParticipants', 'imageUrl'].includes(field);
    }
    return false;
  };

  const canChangeStatus = () => {
    const status = event?.status;
    return status === 'Ongoing' || status === 'Completed';
  };

  if (loading) {
    return (
      <>
        <Navbar role="organizer" />
        <div className="container">
          <div className="loading">Loading event...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar role="organizer" />
      <div className="edit-event">
        <div className="container">
          <div className="page-header">
            <div>
              <button onClick={() => navigate('/organizer/dashboard')} className="back-link">
                ← Back to Dashboard
              </button>
              <h1>Edit Event</h1>
              <div className="status-info">
                <span className={`status-badge status-${event?.status?.toLowerCase()}`}>
                  {event?.status}
                </span>
                {event?.status === 'Draft' && (
                  <button onClick={handlePublish} className="btn btn-success btn-sm">
                    📢 Publish Event
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Editing Rules Information */}
          <div className="editing-rules-info">
            <h3>📋 Editing Rules</h3>
            {event?.status === 'Draft' && (
              <p>✅ <strong>Draft:</strong> You can edit all fields and publish the event when ready.</p>
            )}
            {event?.status === 'Published' && (
              <div>
                <p>⚠️ <strong>Published:</strong> Limited editing allowed:</p>
                <ul>
                  <li>✅ Update description</li>
                  <li>✅ Update venue</li>
                  <li>✅ Extend registration deadline (cannot shorten)</li>
                  <li>✅ Increase participant limit (cannot decrease)</li>
                  <li>✅ Update image</li>
                  <li>❌ Cannot edit: Title, dates, type, eligibility, price</li>
                </ul>
              </div>
            )}
            {(event?.status === 'Ongoing' || event?.status === 'Completed') && (
              <div>
                <p>🔒 <strong>{event?.status}:</strong> No edits allowed except status changes.</p>
                <div className="status-actions">
                  {event?.status === 'Ongoing' && (
                    <button onClick={() => handleStatusChange('Completed')} className="btn btn-primary btn-sm">
                      Mark as Completed
                    </button>
                  )}
                  <button onClick={() => handleStatusChange('Cancelled')} className="btn btn-danger btn-sm">
                    Mark as Cancelled
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Event Edit Form */}
          {(event?.status === 'Draft' || event?.status === 'Published') && (
            <form onSubmit={handleSubmit} className="edit-form">
              <div className="form-section">
                <h2>Basic Information</h2>
                <div className="form-row">
                  <div className="form-group">
                    <label>Event Title {!canEdit('title') && <span className="locked">🔒</span>}</label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      disabled={!canEdit('title')}
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group full-width">
                    <label>Description</label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      disabled={!canEdit('description')}
                      rows={5}
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Event Type {!canEdit('eventType') && <span className="locked">🔒</span>}</label>
                    <select
                      name="eventType"
                      value={formData.eventType}
                      onChange={handleChange}
                      disabled={!canEdit('eventType')}
                    >
                      <option value="Normal">Normal</option>
                      <option value="Merchandise">Merchandise</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Eligibility {!canEdit('eligibility') && <span className="locked">🔒</span>}</label>
                    <select
                      name="eligibility"
                      value={formData.eligibility}
                      onChange={handleChange}
                      disabled={!canEdit('eligibility')}
                    >
                      <option value="All">All</option>
                      <option value="IIIT Only">IIIT Only</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h2>Date & Time</h2>
                <div className="form-row">
                  <div className="form-group">
                    <label>Start Date {!canEdit('startDate') && <span className="locked">🔒</span>}</label>
                    <input
                      type="datetime-local"
                      name="startDate"
                      value={formData.startDate}
                      onChange={handleChange}
                      disabled={!canEdit('startDate')}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>End Date {!canEdit('endDate') && <span className="locked">🔒</span>}</label>
                    <input
                      type="datetime-local"
                      name="endDate"
                      value={formData.endDate}
                      onChange={handleChange}
                      disabled={!canEdit('endDate')}
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Registration Deadline</label>
                    <input
                      type="datetime-local"
                      name="registrationDeadline"
                      value={formData.registrationDeadline}
                      onChange={handleChange}
                      disabled={!canEdit('registrationDeadline')}
                      required
                    />
                    {event?.status === 'Published' && (
                      <small className="form-hint">Can only be extended, not shortened</small>
                    )}
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h2>Location & Capacity</h2>
                <div className="form-row">
                  <div className="form-group">
                    <label>Venue</label>
                    <input
                      type="text"
                      name="venue"
                      value={formData.venue}
                      onChange={handleChange}
                      disabled={!canEdit('venue')}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Max Participants</label>
                    <input
                      type="number"
                      name="maxParticipants"
                      value={formData.maxParticipants}
                      onChange={handleChange}
                      disabled={!canEdit('maxParticipants')}
                      min={event?.currentParticipants || 0}
                    />
                    {event?.status === 'Published' && (
                      <small className="form-hint">Can only be increased, not decreased</small>
                    )}
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h2>Pricing</h2>
                <div className="form-row">
                  <div className="form-group">
                    <label>Price (₹) {!canEdit('price') && <span className="locked">🔒</span>}</label>
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleChange}
                      disabled={!canEdit('price')}
                      min="0"
                    />
                  </div>

                  {formData.eventType === 'Merchandise' && (
                    <div className="form-group">
                      <label>Stock {!canEdit('stock') && <span className="locked">🔒</span>}</label>
                      <input
                        type="number"
                        name="stock"
                        value={formData.stock}
                        onChange={handleChange}
                        disabled={!canEdit('stock')}
                        min="0"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="form-section">
                <h2>Media</h2>
                <div className="form-row">
                  <div className="form-group full-width">
                    <label>Image URL</label>
                    <input
                      type="url"
                      name="imageUrl"
                      value={formData.imageUrl}
                      onChange={handleChange}
                      disabled={!canEdit('imageUrl')}
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" className="btn btn-primary">
                  💾 Save Changes
                </button>
                <button type="button" onClick={() => navigate('/organizer/dashboard')} className="btn btn-secondary">
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Custom Form Builder */}
          <div className="form-builder-section">
            <div className="section-header">
              <h2>📝 Custom Registration Form Builder</h2>
              {formLocked && (
                <span className="locked-badge">🔒 Form Locked (registrations received)</span>
              )}
            </div>

            {!formLocked ? (
              <div className="form-builder">
                <p className="form-builder-desc">
                  Create custom fields for participant registration. Supports text, dropdown, checkbox, file upload, etc.
                  Form will be locked after the first registration.
                </p>

                <button type="button" onClick={addField} className="btn btn-success btn-sm">
                  + Add Field
                </button>

                <div className="custom-fields-list">
                  {customFields.map((field, index) => (
                    <div key={field.fieldId} className="custom-field-item">
                      <div className="field-order">
                        <button type="button" onClick={() => moveField(index, 'up')} disabled={index === 0}>
                          ↑
                        </button>
                        <span>{index + 1}</span>
                        <button type="button" onClick={() => moveField(index, 'down')} disabled={index === customFields.length - 1}>
                          ↓
                        </button>
                      </div>

                      <div className="field-content">
                        <div className="field-row">
                          <input
                            type="text"
                            placeholder="Field Label"
                            value={field.label}
                            onChange={(e) => updateField(index, { label: e.target.value })}
                            className="field-label-input"
                          />

                          <select
                            value={field.fieldType}
                            onChange={(e) => updateField(index, { fieldType: e.target.value })}
                            className="field-type-select"
                          >
                            <option value="text">Text</option>
                            <option value="textarea">Text Area</option>
                            <option value="number">Number</option>
                            <option value="email">Email</option>
                            <option value="dropdown">Dropdown</option>
                            <option value="checkbox">Checkbox</option>
                            <option value="file">File Upload</option>
                          </select>

                          <label className="field-required">
                            <input
                              type="checkbox"
                              checked={field.required}
                              onChange={(e) => updateField(index, { required: e.target.checked })}
                            />
                            Required
                          </label>

                          <button type="button" onClick={() => removeField(index)} className="btn-remove">
                            ✕
                          </button>
                        </div>

                        {field.fieldType === 'dropdown' && (
                          <div className="field-options">
                            <input
                              type="text"
                              placeholder="Options (comma-separated)"
                              value={field.options?.join(', ') || ''}
                              onChange={(e) => updateField(index, { 
                                options: e.target.value.split(',').map(o => o.trim()).filter(o => o)
                              })}
                              className="field-options-input"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {customFields.length > 0 && (
                  <button type="button" onClick={saveCustomForm} className="btn btn-primary">
                    💾 Save Custom Form
                  </button>
                )}
              </div>
            ) : (
              <div className="form-locked-message">
                <p>⚠️ The registration form is locked because registrations have been received.</p>
                <p>Current fields:</p>
                <ul>
                  {customFields.map((field, index) => (
                    <li key={field.fieldId}>
                      {index + 1}. {field.label} ({field.fieldType}) {field.required && <strong>*Required</strong>}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Event Stats */}
          <div className="event-stats">
            <h3>Event Statistics</h3>
            <div className="stats-grid">
              <div className="stat-item">
                <strong>Current Participants:</strong>
                <span>{event?.currentParticipants || 0}</span>
              </div>
              <div className="stat-item">
                <strong>Max Limit:</strong>
                <span>{event?.maxParticipants || event?.registrationLimit || '∞'}</span>
              </div>
              <div className="stat-item">
                <strong>Price:</strong>
                <span>₹{event?.price || event?.registrationFee || 0}</span>
              </div>
              <div className="stat-item">
                <strong>Revenue:</strong>
                <span>₹{(event?.price || event?.registrationFee || 0) * (event?.currentParticipants || 0)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default EditEvent;
