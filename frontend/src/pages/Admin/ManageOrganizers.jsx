import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { adminAPI } from '../../utils/api';
import { toast } from 'react-toastify';
import './ManageOrganizers.css';

const ManageOrganizers = () => {
  const [organizers, setOrganizers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [formData, setFormData] = useState({
    email: '',
    organizerName: '',
    category: '',
    description: '',
    contactPerson: '',
    phone: ''
  });

  useEffect(() => {
    fetchOrganizers();
  }, []);

  const fetchOrganizers = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getOrganizers();
      setOrganizers(response.data.organizers);
    } catch (error) {
      console.error('Error loading organizers:', error);
      toast.error('Error loading organizers');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await adminAPI.createOrganizer(formData);
      toast.success('Organizer created successfully! Credentials sent via email.');
      
      // Show credentials for admin reference
      if (response.data.organizer?.tempPassword) {
        toast.info(`Temporary Password: ${response.data.organizer.tempPassword}`, { 
          autoClose: 15000 
        });
      }
      
      setShowForm(false);
      fetchOrganizers();
      setFormData({ 
        email: '', 
        organizerName: '', 
        category: '', 
        description: '', 
        contactPerson: '', 
        phone: '' 
      });
    } catch (error) {
      console.error('Create organizer error:', error);
      toast.error(error.response?.data?.message || 'Error creating organizer');
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    const action = currentStatus ? 'deactivate' : 'activate';
    if (!window.confirm(`Are you sure you want to ${action} this organizer?`)) return;
    
    try {
      await adminAPI.toggleOrganizerStatus(id);
      toast.success(`Organizer ${action}d successfully`);
      fetchOrganizers();
    } catch (error) {
      toast.error('Error updating status');
    }
  };

  const handleResetPassword = async (id, email, name) => {
    const newPassword = prompt(
      `Reset password for ${name}?\n\nEnter new password (minimum 6 characters):`
    );
    
    if (!newPassword) return;
    
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    try {
      const response = await adminAPI.resetOrganizerPassword(id, newPassword);
      toast.success('Password reset successfully! Credentials sent via email.');
      toast.info(`New Password: ${response.data.tempPassword}`, { autoClose: 15000 });
    } catch (error) {
      console.error('Reset password error:', error);
      toast.error(error.response?.data?.message || 'Error resetting password');
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(
      `Delete organizer "${name}"?\n\nThis action cannot be undone. The organizer will not be able to log in anymore.`
    )) return;
    
    try {
      await adminAPI.deleteOrganizer(id);
      toast.success('Organizer deleted successfully');
      fetchOrganizers();
    } catch (error) {
      console.error('Delete organizer error:', error);
      toast.error(error.response?.data?.message || 'Error deleting organizer');
    }
  };

  const handleRemove = async (id, name) => {
    if (!window.confirm(
      `⚠️ PERMANENTLY DELETE organizer "${name}"?\n\nThis will COMPLETELY REMOVE the organizer account from the system.\n\n❌ This action CANNOT be undone!\n❌ The organizer must have NO events to be deleted.`
    )) return;
    
    try {
      await adminAPI.removeOrganizer(id);
      toast.success('Organizer deleted successfully');
      fetchOrganizers();
    } catch (error) {
      console.error('Delete organizer error:', error);
      toast.error(error.response?.data?.message || 'Error deleting organizer');
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // Filter organizers
  const filteredOrganizers = organizers.filter(org => {
    const matchesSearch = 
      (org.organizerName?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (org.clubName?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (org.email?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (org.contactEmail?.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesFilter = 
      filterStatus === 'all' ||
      (filterStatus === 'active' && org.isActive) ||
      (filterStatus === 'inactive' && !org.isActive);
    
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <>
        <Navbar role="admin" />
        <div className="container">
          <div className="loading">Loading organizers...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar role="admin" />
      <div className="manage-organizers">
        <div className="container">
          <div className="page-header">
            <div>
              <Link to="/admin/dashboard" className="back-link">← Back to Dashboard</Link>
              <h1>Manage Clubs/Organizers</h1>
              <p className="subtitle">Add, remove, or manage organizer accounts</p>
            </div>
            <button 
              onClick={() => setShowForm(!showForm)} 
              className="btn btn-primary"
            >
              {showForm ? 'Cancel' : '+ Add New Organizer'}
            </button>
          </div>

          {/* Create Organizer Form */}
          {showForm && (
            <div className="create-form-section">
              <h2>Create New Organizer/Club Account</h2>
              <p className="form-description">
                System will auto-generate login credentials and send them via email
              </p>
              <form onSubmit={handleSubmit} className="organizer-form">
                <div className="form-grid">
                  <div className="form-group">
                    <label>Organizer/Club Name *</label>
                    <input
                      type="text"
                      name="organizerName"
                      value={formData.organizerName}
                      onChange={handleChange}
                      required
                      placeholder="e.g., Tech Club, Cultural Society"
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label>Email Address *</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      placeholder="organizer@example.com"
                      className="form-input"
                    />
                    <small className="form-hint">Will be used for login</small>
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
                    <label>Contact Person</label>
                    <input
                      type="text"
                      name="contactPerson"
                      value={formData.contactPerson}
                      onChange={handleChange}
                      placeholder="Contact person name"
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label>Phone Number</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="+91 1234567890"
                      className="form-input"
                    />
                  </div>

                  <div className="form-group full-width">
                    <label>Description</label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      placeholder="Brief description of the organization"
                      className="form-textarea"
                      rows="3"
                    />
                  </div>
                </div>

                <div className="form-actions">
                  <button type="submit" className="btn btn-primary">
                    Create Organizer Account
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setShowForm(false)} 
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Search and Filter */}
          <div className="controls-section">
            <div className="search-box">
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
            <div className="filter-tabs">
              <button
                className={filterStatus === 'all' ? 'filter-tab active' : 'filter-tab'}
                onClick={() => setFilterStatus('all')}
              >
                All ({organizers.length})
              </button>
              <button
                className={filterStatus === 'active' ? 'filter-tab active' : 'filter-tab'}
                onClick={() => setFilterStatus('active')}
              >
                Active ({organizers.filter(o => o.isActive).length})
              </button>
              <button
                className={filterStatus === 'inactive' ? 'filter-tab active' : 'filter-tab'}
                onClick={() => setFilterStatus('inactive')}
              >
                Inactive ({organizers.filter(o => !o.isActive).length})
              </button>
            </div>
          </div>

          {/* Organizers List */}
          <div className="organizers-section">
            <h2>Registered Organizers ({filteredOrganizers.length})</h2>
            {filteredOrganizers.length > 0 ? (
              <div className="organizers-grid">
                {filteredOrganizers.map((org) => (
                  <div key={org._id} className="organizer-card">
                    <div className="organizer-header">
                      <div>
                        <h3>{org.organizerName || org.clubName}</h3>
                        <span className={`status-badge ${org.isActive ? 'active' : 'inactive'}`}>
                          {org.isActive ? '✅ Active' : '❌ Inactive'}
                        </span>
                      </div>
                      <span className="category-badge">{org.category}</span>
                    </div>
                    
                    <div className="organizer-body">
                      <div className="organizer-info">
                        <p><strong>Email:</strong> {org.email || org.contactEmail}</p>
                        {org.contactPerson && (
                          <p><strong>Contact Person:</strong> {org.contactPerson}</p>
                        )}
                        {org.phone && (
                          <p><strong>Phone:</strong> {org.phone}</p>
                        )}
                        {org.description && (
                          <p className="description">{org.description}</p>
                        )}
                        <p className="created-info">
                          Created: {new Date(org.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="organizer-actions">
                      <button
                        onClick={() => toggleStatus(org._id, org.isActive)}
                        className={`btn btn-sm ${org.isActive ? 'btn-warning' : 'btn-success'}`}
                      >
                        {org.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => handleResetPassword(
                          org._id, 
                          org.email || org.contactEmail, 
                          org.organizerName || org.clubName
                        )}
                        className="btn btn-sm btn-info"
                      >
                        Reset Password
                      </button>
                      <button
                        onClick={() => handleRemove(
                          org._id, 
                          org.organizerName || org.clubName
                        )}
                        className="btn btn-sm btn-danger"
                        title="Permanently delete organizer (must have no events)"
                      >
                        Delete Organizer
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-organizers">
                <p>No organizers found matching your criteria</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ManageOrganizers;
