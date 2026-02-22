import { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import { participantAPI } from '../../utils/api';
import { toast } from 'react-toastify';
import './Profile.css';

const Profile = () => {
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await participantAPI.getProfile();
      setProfile(response.data.participant);
      setFormData({
        name: response.data.participant.name,
        phone: response.data.participant.phone,
        college: response.data.participant.college,
        interests: response.data.participant.interests || []
      });
    } catch (error) {
      toast.error('Error loading profile');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await participantAPI.updateProfile(formData);
      toast.success('Profile updated successfully');
      setEditing(false);
      fetchProfile();
    } catch (error) {
      toast.error('Error updating profile');
    }
  };

  if (!profile) return <><Navbar role="participant" /><div className="container">Loading...</div></>;

  return (
    <>
      <Navbar role="participant" />
      <div className="container">
        <h1 className="profile-main-title">My Profile</h1>
        <div className="profile-container">
          {editing ? (
            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <label>Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>College</label>
                <input
                  type="text"
                  value={formData.college}
                  onChange={(e) => setFormData({...formData, college: e.target.value})}
                  required
                />
              </div>
              <button type="submit" className="btn-primary">Save Changes</button>
              <button type="button" onClick={() => setEditing(false)} className="btn-secondary">Cancel</button>
            </form>
          ) : (
            <div className="animated-profile-info">
              <div className="handwritten-section">
                <div className="handwritten-item animate-item-1">
                  <span className="label-script">Name:</span>
                  <span className="value-script">{profile.name}</span>
                </div>
                
                <div className="handwritten-item animate-item-2">
                  <span className="label-script">Phone:</span>
                  <span className="value-script">{profile.phone}</span>
                </div>
                
                <div className="handwritten-item animate-item-3">
                  <span className="label-script">College:</span>
                  <span className="value-script">{profile.college}</span>
                </div>
              </div>
              
              <div className="static-info">
                <p className="info-item"><strong>Email:</strong> {profile.email} <span className="not-editable">(Not editable)</span></p>
                <p className="info-item"><strong>Type:</strong> {profile.participantType} <span className="not-editable">(Not editable)</span></p>
              </div>
              
              <button onClick={() => setEditing(true)} className="btn-primary edit-btn-animated">Edit Profile</button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Profile;
