import { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import { organizerAPI } from '../../utils/api';
import { toast } from 'react-toastify';
import './Profile.css';

const Profile = () => {
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    organizerName: '',
    category: '',
    description: '',
    contactEmail: '',
    phone: '',
    discordWebhook: ''
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await organizerAPI.getProfile();
      const data = response.data.organizer;
      setProfile(data);
      setFormData({
        organizerName: data.organizerName || data.clubName || '',
        category: data.category || '',
        description: data.description || '',
        contactEmail: data.contactEmail || '',
        phone: data.phone || '',
        discordWebhook: data.discordWebhook || ''
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Error loading profile');
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
    try {
      await organizerAPI.updateProfile(formData);
      toast.success('Profile updated successfully');
      setEditing(false);
      fetchProfile();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(error.response?.data?.message || 'Error updating profile');
    }
  };

  const handleCancel = () => {
    setEditing(false);
    // Reset form data to current profile
    setFormData({
      organizerName: profile.organizerName || profile.clubName || '',
      category: profile.category || '',
      description: profile.description || '',
      contactEmail: profile.contactEmail || '',
      phone: profile.phone || '',
      discordWebhook: profile.discordWebhook || ''
    });
  };

  if (loading) {
    return (
      <>
        <Navbar role="organizer" />
        <div className="container">
          <div className="loading">Loading profile...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar role="organizer" />
      <div className="organizer-profile">
        <div className="container">
          <div className="profile-header">
            <h1>Organizer Profile</h1>
            {!editing && (
              <button onClick={() => setEditing(true)} className="btn btn-primary">
                Edit Profile
              </button>
            )}
          </div>

          <div className="profile-content">
            {!editing ? (
              // View Mode
              <div className="profile-view">
                <div className="profile-card">
                  <h2>Account Information</h2>
                  <div className="profile-section">
                    <div className="profile-item">
                      <strong>Login Email:</strong>
                      <span className="profile-value">{profile?.email || profile?.contactEmail}</span>
                      <span className="non-editable-badge">Non-editable</span>
                    </div>
                  </div>
                </div>

                <div className="profile-card">
                  <h2>Organization Details</h2>
                  <div className="profile-section">
                    <div className="profile-item">
                      <strong>Organizer Name:</strong>
                      <span className="profile-value">{profile?.organizerName || profile?.clubName}</span>
                    </div>
                    <div className="profile-item">
                      <strong>Category:</strong>
                      <span className="profile-value">{profile?.category}</span>
                    </div>
                    <div className="profile-item">
                      <strong>Description:</strong>
                      <p className="profile-description">{profile?.description || 'No description provided'}</p>
                    </div>
                  </div>
                </div>

                <div className="profile-card">
                  <h2>Contact Information</h2>
                  <div className="profile-section">
                    <div className="profile-item">
                      <strong>Contact Email:</strong>
                      <span className="profile-value">{profile?.contactEmail || 'Not provided'}</span>
                    </div>
                    <div className="profile-item">
                      <strong>Phone Number:</strong>
                      <span className="profile-value">{profile?.phone || 'Not provided'}</span>
                    </div>
                  </div>
                </div>

                <div className="profile-card">
                  <h2>Discord Integration</h2>
                  <div className="profile-section">
                    <div className="profile-item">
                      <strong>Discord Webhook:</strong>
                      <span className="profile-value">
                        {profile?.discordWebhook ? '••••••••••••' : 'Not configured'}
                      </span>
                      {profile?.discordWebhook && (
                        <span className="webhook-info">
                          ℹ️ Auto-post new events to Discord
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              // Edit Mode
              <form onSubmit={handleSubmit} className="profile-form">
                <div className="profile-card">
                  <h2>Account Information</h2>
                  <div className="form-group">
                    <label>Login Email</label>
                    <input
                      type="email"
                      value={profile?.email || profile?.contactEmail}
                      disabled
                      className="form-input disabled"
                    />
                    <small className="form-hint">Login email cannot be changed</small>
                  </div>
                </div>

                <div className="profile-card">
                  <h2>Organization Details</h2>
                  <div className="form-group">
                    <label>Organizer Name *</label>
                    <input
                      type="text"
                      name="organizerName"
                      value={formData.organizerName}
                      onChange={handleChange}
                      required
                      className="form-input"
                      placeholder="Enter organizer/club name"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Category *</label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      required
                      className="form-input"
                    >
                      <option value="">Select Category</option>
                      <option value="Technical">Technical</option>
                      <option value="Cultural">Cultural</option>
                      <option value="Sports">Sports</option>
                      <option value="Literary">Literary</option>
                      <option value="Arts">Arts</option>
                      <option value="Social">Social</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label>Description *</label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      required
                      className="form-textarea"
                      placeholder="Describe your organization"
                      rows="5"
                    />
                  </div>
                </div>

                <div className="profile-card">
                  <h2>Contact Information</h2>
                  <div className="form-group">
                    <label>Contact Email *</label>
                    <input
                      type="email"
                      name="contactEmail"
                      value={formData.contactEmail}
                      onChange={handleChange}
                      required
                      className="form-input"
                      placeholder="contact@example.com"
                    />
                    <small className="form-hint">Public contact email for participants</small>
                  </div>
                  
                  <div className="form-group">
                    <label>Phone Number</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="form-input"
                      placeholder="+91 1234567890"
                    />
                  </div>
                </div>

                <div className="profile-card">
                  <h2>Discord Integration</h2>
                  <div className="form-group">
                    <label>Discord Webhook URL</label>
                    <input
                      type="url"
                      name="discordWebhook"
                      value={formData.discordWebhook}
                      onChange={handleChange}
                      className="form-input"
                      placeholder="https://discord.com/api/webhooks/..."
                    />
                    <small className="form-hint">
                      Automatically post new events to your Discord server
                    </small>
                  </div>
                </div>

                <div className="form-actions">
                  <button type="submit" className="btn btn-primary">
                    Save Changes
                  </button>
                  <button type="button" onClick={handleCancel} className="btn btn-secondary">
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Profile;
