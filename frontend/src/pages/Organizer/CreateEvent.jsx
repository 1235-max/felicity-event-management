import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { eventAPI } from '../../utils/api';
import { toast } from 'react-toastify';

const CreateEvent = () => {
  const navigate = useNavigate();
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
    stock: ''
  });
  const [customFields, setCustomFields] = useState([]);

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
      const eventData = { ...formData, customForm: { fields: customFields } };
      const response = await eventAPI.create(eventData);
      toast.success('Event created as draft!');
      navigate(`/organizer/events/${response.data.event._id}/edit`);
    } catch (error) {
      console.error('Create event error:', error);
      
      // Show detailed error message
      if (error.response?.data?.errors) {
        error.response.data.errors.forEach(err => toast.error(err));
      } else {
        toast.error(error.response?.data?.message || 'Error creating event');
      }
    }
  };

  const addField = () => {
    setCustomFields([...customFields, {
      fieldId: `field_${Date.now()}`,
      fieldType: 'text',
      label: '',
      options: [],
      required: false,
      order: customFields.length
    }]);
  };

  return (
    <>
      <Navbar role="organizer" />
      <div className="container">
        <h1>Create New Event</h1>
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Event Title*</label>
            <input type="text" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} required />
          </div>
          <div className="form-group">
            <label>Description*</label>
            <textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} required rows={4} />
          </div>
          <div className="form-group">
            <label>Event Type*</label>
            <select value={formData.eventType} onChange={(e) => setFormData({...formData, eventType: e.target.value})}>
              <option value="Normal">Normal</option>
              <option value="Merchandise">Merchandise</option>
            </select>
          </div>
          <div className="form-group">
            <label>Eligibility*</label>
            <select value={formData.eligibility} onChange={(e) => setFormData({...formData, eligibility: e.target.value})}>
              <option value="All">All</option>
              <option value="IIIT Only">IIIT Only</option>
            </select>
          </div>
          <div className="form-group">
            <label>Start Date*</label>
            <input 
              type="datetime-local" 
              value={formData.startDate} 
              onChange={(e) => setFormData({...formData, startDate: e.target.value})} 
              required 
            />
            <small style={{color: '#666', fontSize: '12px'}}>When does the event begin?</small>
          </div>
          <div className="form-group">
            <label>End Date*</label>
            <input 
              type="datetime-local" 
              value={formData.endDate} 
              onChange={(e) => setFormData({...formData, endDate: e.target.value})} 
              required 
            />
            <small style={{color: '#666', fontSize: '12px'}}>When does the event end?</small>
          </div>
          <div className="form-group">
            <label>Registration Deadline*</label>
            <input 
              type="datetime-local" 
              value={formData.registrationDeadline} 
              onChange={(e) => setFormData({...formData, registrationDeadline: e.target.value})} 
              required 
            />
            <small style={{color: '#666', fontSize: '12px'}}>Last date to register (must be before event starts)</small>
          </div>
          <div className="form-group">
            <label>Venue*</label>
            <input type="text" value={formData.venue} onChange={(e) => setFormData({...formData, venue: e.target.value})} required />
          </div>
          <div className="form-group">
            <label>Max Participants (optional)</label>
            <input type="number" value={formData.maxParticipants} onChange={(e) => setFormData({...formData, maxParticipants: e.target.value})} />
          </div>
          <div className="form-group">
            <label>Price (₹)</label>
            <input type="number" value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} />
          </div>
          {formData.eventType === 'Merchandise' && (
            <div className="form-group">
              <label>Stock</label>
              <input type="number" value={formData.stock} onChange={(e) => setFormData({...formData, stock: e.target.value})} />
            </div>
          )}

          <h3>Custom Form Builder</h3>
          <button type="button" onClick={addField} className="btn-secondary">Add Field</button>
          {customFields.map((field, idx) => (
            <div key={field.fieldId} className="field-builder">
              <input placeholder="Field Label" value={field.label} onChange={(e) => {
                const updated = [...customFields];
                updated[idx].label = e.target.value;
                setCustomFields(updated);
              }} />
              <select value={field.fieldType} onChange={(e) => {
                const updated = [...customFields];
                updated[idx].fieldType = e.target.value;
                setCustomFields(updated);
              }}>
                <option value="text">Text</option>
                <option value="dropdown">Dropdown</option>
                <option value="checkbox">Checkbox</option>
              </select>
              <label><input type="checkbox" checked={field.required} onChange={(e) => {
                const updated = [...customFields];
                updated[idx].required = e.target.checked;
                setCustomFields(updated);
              }} /> Required</label>
            </div>
          ))}

          <button type="submit" className="btn-primary">Create Draft</button>
        </form>
      </div>
    </>
  );
};

export default CreateEvent;
