import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { adminAPI } from '../../utils/api';
import { toast } from 'react-toastify';
import './Dashboard.css';

const Dashboard = () => {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getDashboard();
      setDashboard(response.data.dashboard);
    } catch (error) {
      console.error('Error loading dashboard:', error);
      toast.error('Error loading dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteOrganizer = async (id, name) => {
    if (!window.confirm(
      `⚠️ DELETE organizer "${name}"?\n\nThis will permanently remove the organizer account.\n\n❌ This action CANNOT be undone!\n❌ The organizer must have NO events to be deleted.`
    )) return;
    
    try {
      await adminAPI.removeOrganizer(id);
      toast.success('Organizer deleted successfully');
      fetchDashboard(); // Refresh the dashboard
    } catch (error) {
      console.error('Delete organizer error:', error);
      toast.error(error.response?.data?.message || 'Error deleting organizer');
    }
  };

  if (loading) {
    return (
      <>
        <Navbar role="admin" />
        <div className="container">
          <div className="loading">Loading dashboard...</div>
        </div>
      </>
    );
  }

  const { stats, recentOrganizers, passwordResetRequests } = dashboard || {};

  return (
    <>
      <Navbar role="admin" />
      <div className="admin-dashboard">
        <div className="container">
          <div className="dashboard-header">
            <h1>Admin Dashboard</h1>
            <Link to="/admin/organizers" className="btn btn-primary">
              Manage Organizers
            </Link>
          </div>

          {/* Stats Section */}
          {stats && (
            <div className="stats-section">
              <h2>Platform Statistics</h2>
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon">👥</div>
                  <div className="stat-content">
                    <h3>Total Participants</h3>
                    <p className="stat-number">{stats.totalParticipants}</p>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">🏢</div>
                  <div className="stat-content">
                    <h3>Total Organizers</h3>
                    <p className="stat-number">{stats.totalOrganizers}</p>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">✅</div>
                  <div className="stat-content">
                    <h3>Active Organizers</h3>
                    <p className="stat-number">{stats.activeOrganizers}</p>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">❌</div>
                  <div className="stat-content">
                    <h3>Inactive Organizers</h3>
                    <p className="stat-number">{stats.inactiveOrganizers}</p>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">🎫</div>
                  <div className="stat-content">
                    <h3>Total Events</h3>
                    <p className="stat-number">{stats.totalEvents}</p>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">📝</div>
                  <div className="stat-content">
                    <h3>Total Registrations</h3>
                    <p className="stat-number">{stats.totalRegistrations}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Recent Organizers */}
          {recentOrganizers && recentOrganizers.length > 0 && (
            <div className="recent-section">
              <div className="section-header">
                <h2>Recent Organizers</h2>
                <Link to="/admin/organizers" className="view-all-link">
                  View All →
                </Link>
              </div>
              <div className="organizers-list">
                {recentOrganizers.map((organizer) => (
                  <div key={organizer._id} className="organizer-card">
                    <div>
                      <div className="organizer-info">
                        <h3>{organizer.organizerName || organizer.clubName}</h3>
                        <p className="organizer-email">{organizer.email || organizer.contactEmail}</p>
                        <span className="organizer-category">{organizer.category}</span>
                      </div>
                      <div className="organizer-status">
                        <span className={`status-badge ${organizer.isActive ? 'active' : 'inactive'}`}>
                          {organizer.isActive ? 'Active' : 'Inactive'}
                        </span>
                        <span className="created-date">
                          Created {new Date(organizer.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="organizer-actions">
                      <button
                        onClick={() => handleDeleteOrganizer(
                          organizer._id, 
                          organizer.organizerName || organizer.clubName
                        )}
                        className="btn btn-sm btn-danger"
                        title="Delete organizer"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Password Reset Requests */}
          <div className="password-reset-section">
            <div className="section-header">
              <h2>Password Reset Requests</h2>
              <Link to="/admin/password-resets" className="view-all-link">
                Manage Requests →
              </Link>
            </div>
            {passwordResetRequests && passwordResetRequests.length > 0 ? (
              <div className="reset-requests-list">
                {passwordResetRequests.map((request) => (
                  <div key={request.id} className="reset-request-card">
                    <div className="request-info">
                      <h4>{request.organizerName}</h4>
                      <p>{request.email}</p>
                    </div>
                    <div className="request-actions">
                      <button className="btn btn-sm btn-primary">Process</button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-requests">
                <p>No pending password reset requests</p>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="quick-actions-section">
            <h2>Quick Actions</h2>
            <div className="actions-grid">
              <Link to="/admin/organizers" className="action-card">
                <div className="action-icon">➕</div>
                <h3>Add New Organizer</h3>
                <p>Create a new club/organizer account</p>
              </Link>
              <Link to="/admin/organizers" className="action-card">
                <div className="action-icon">📋</div>
                <h3>View All Organizers</h3>
                <p>Manage existing organizers</p>
              </Link>
              <Link to="/admin/events" className="action-card">
                <div className="action-icon">🎪</div>
                <h3>View All Events</h3>
                <p>Monitor platform events</p>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Dashboard;
