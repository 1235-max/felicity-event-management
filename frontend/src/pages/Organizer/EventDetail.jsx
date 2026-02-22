import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Forum from '../../components/Forum';
import FeedbackView from '../../components/FeedbackView';
import { organizerAPI } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import './EventDetail.css';

const EventDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [event, setEvent] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [sortBy, setSortBy] = useState('date');

  useEffect(() => {
    fetchEventDetails();
  }, [id]);

  const fetchEventDetails = async () => {
    try {
      setLoading(true);
      const [eventRes, analyticsRes, participantsRes] = await Promise.all([
        organizerAPI.getEvent(id),
        organizerAPI.getEventAnalytics(id),
        organizerAPI.getEventParticipants(id, { search: '', filter: '', sortBy: 'date' })
      ]);
      
      setEvent(eventRes.data.event);
      setAnalytics(analyticsRes.data.analytics);
      setParticipants(participantsRes.data.participants);
    } catch (error) {
      console.error('Error fetching event details:', error);
      toast.error('Error loading event details');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    try {
      const response = await organizerAPI.getEventParticipants(id, {
        search: searchTerm,
        filter: filterStatus,
        sortBy
      });
      setParticipants(response.data.participants);
    } catch (error) {
      toast.error('Error searching participants');
    }
  };

  const handleExport = async () => {
    try {
      const response = await organizerAPI.exportParticipants(id);
      
      // Create blob and download
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `participants-${event?.eventName || 'event'}-${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('Participants exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Error exporting participants');
    }
  };

  useEffect(() => {
    if (activeTab === 'participants') {
      handleSearch();
    }
  }, [searchTerm, filterStatus, sortBy, activeTab]);

  if (loading) {
    return (
      <>
        <Navbar role="organizer" />
        <div className="container">
          <div className="loading">Loading event details...</div>
        </div>
      </>
    );
  }

  if (!event) {
    return (
      <>
        <Navbar role="organizer" />
        <div className="container">
          <div className="error">Event not found</div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar role="organizer" />
      <div className="event-detail">
        <div className="container">
          <div className="event-header">
            <div>
              <Link to="/organizer/dashboard" className="back-link">← Back to Dashboard</Link>
              <h1>{event.eventName || event.title}</h1>
              <span className={`badge badge-${event.status?.toLowerCase()}`}>
                {event.status}
              </span>
            </div>
            <div className="event-actions">
              {event.status === 'Draft' && (
                <Link to={`/organizer/events/${id}/edit`} className="btn btn-secondary">
                  Edit Event
                </Link>
              )}
              <Link to={`/organizer/events/${id}/scanner`} className="btn btn-success">
                📱 QR Scanner
              </Link>
              <Link to={`/organizer/events/${id}/attendance`} className="btn btn-info">
                📊 Attendance
              </Link>
              <Link to={`/organizer/events/${id}/analytics`} className="btn btn-primary">
                View Analytics
              </Link>
            </div>
          </div>

          {/* Tabs */}
          <div className="detail-tabs">
            <button
              className={activeTab === 'overview' ? 'tab active' : 'tab'}
              onClick={() => setActiveTab('overview')}
            >
              Overview
            </button>
            <button
              className={activeTab === 'analytics' ? 'tab active' : 'tab'}
              onClick={() => setActiveTab('analytics')}
            >
              Analytics
            </button>
            <button
              className={activeTab === 'participants' ? 'tab active' : 'tab'}
              onClick={() => setActiveTab('participants')}
            >
              Participants ({participants.length})
            </button>
            <button
              className={activeTab === 'forum' ? 'tab active' : 'tab'}
              onClick={() => setActiveTab('forum')}
            >
              💬 Forum
            </button>
            <button
              className={activeTab === 'feedback' ? 'tab active' : 'tab'}
              onClick={() => setActiveTab('feedback')}
            >
              ⭐ Feedback
            </button>
          </div>

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="overview-section">
              <div className="info-grid">
                <div className="info-card">
                  <h3>Event Information</h3>
                  <div className="info-item">
                    <strong>Name:</strong> {event.eventName || event.title}
                  </div>
                  <div className="info-item">
                    <strong>Type:</strong> {event.eventType}
                  </div>
                  <div className="info-item">
                    <strong>Status:</strong> {event.status}
                  </div>
                  <div className="info-item">
                    <strong>Eligibility:</strong> {event.eligibility}
                  </div>
                  <div className="info-item">
                    <strong>Description:</strong>
                    <p>{event.eventDescription || event.description}</p>
                  </div>
                </div>

                <div className="info-card">
                  <h3>Dates & Timing</h3>
                  <div className="info-item">
                    <strong>Registration Deadline:</strong>
                    <br />
                    {new Date(event.registrationDeadline).toLocaleString()}
                  </div>
                  <div className="info-item">
                    <strong>Event Start:</strong>
                    <br />
                    {new Date(event.eventStartDate || event.startDate).toLocaleString()}
                  </div>
                  <div className="info-item">
                    <strong>Event End:</strong>
                    <br />
                    {new Date(event.eventEndDate || event.endDate).toLocaleString()}
                  </div>
                </div>

                <div className="info-card">
                  <h3>Registration Details</h3>
                  <div className="info-item">
                    <strong>Registration Fee:</strong> ₹{event.registrationFee || event.price || 0}
                  </div>
                  <div className="info-item">
                    <strong>Registration Limit:</strong> {event.registrationLimit || 'Unlimited'}
                  </div>
                  <div className="info-item">
                    <strong>Current Registrations:</strong> {event.currentParticipants || 0}
                  </div>
                  {event.venue && (
                    <div className="info-item">
                      <strong>Venue:</strong> {event.venue}
                    </div>
                  )}
                </div>

                {/* Merchandise Details - Show only for Merchandise events */}
                {event.eventType === 'Merchandise' && event.merchandiseDetails && (
                  <div className="info-card">
                    <h3>Merchandise Details</h3>
                    {event.merchandiseDetails.variants && event.merchandiseDetails.variants.length > 0 && (
                      <div className="info-item">
                        <strong>Variants:</strong>
                        <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
                          {event.merchandiseDetails.variants.map((variant, idx) => (
                            <li key={idx}>
                              {variant.name} - ₹{variant.price} (Stock: {variant.stock})
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {event.merchandiseDetails.sizes && event.merchandiseDetails.sizes.length > 0 && (
                      <div className="info-item">
                        <strong>Available Sizes:</strong>
                        <p>{event.merchandiseDetails.sizes.join(', ')}</p>
                      </div>
                    )}
                    {event.merchandiseDetails.colors && event.merchandiseDetails.colors.length > 0 && (
                      <div className="info-item">
                        <strong>Available Colors:</strong>
                        <p>{event.merchandiseDetails.colors.join(', ')}</p>
                      </div>
                    )}
                    {event.merchandiseDetails.material && (
                      <div className="info-item">
                        <strong>Material:</strong> {event.merchandiseDetails.material}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && analytics && (
            <div className="analytics-section">
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon">👥</div>
                  <div className="stat-content">
                    <h3>Total Registrations</h3>
                    <p className="stat-number">{analytics.totalRegistrations}</p>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">💰</div>
                  <div className="stat-content">
                    <h3>Total Revenue</h3>
                    <p className="stat-number">₹{analytics.totalRevenue?.toLocaleString()}</p>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">✓</div>
                  <div className="stat-content">
                    <h3>Total Attendance</h3>
                    <p className="stat-number">{analytics.totalAttendance}</p>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">📈</div>
                  <div className="stat-content">
                    <h3>Attendance Rate</h3>
                    <p className="stat-number">{analytics.attendanceRate}%</p>
                  </div>
                </div>
              </div>

              {/* Payment Stats */}
              <div className="payment-stats">
                <h3>Payment Status</h3>
                <div className="payment-grid">
                  <div className="payment-stat">
                    <span className="payment-label">Completed:</span>
                    <span className="payment-value">{analytics.paymentStats?.completed || 0}</span>
                  </div>
                  <div className="payment-stat">
                    <span className="payment-label">Pending:</span>
                    <span className="payment-value">{analytics.paymentStats?.pending || 0}</span>
                  </div>
                  <div className="payment-stat">
                    <span className="payment-label">Failed:</span>
                    <span className="payment-value">{analytics.paymentStats?.failed || 0}</span>
                  </div>
                </div>
              </div>

              {/* Participant Type Distribution */}
              {analytics.participantTypeDistribution && (
                <div className="distribution-section">
                  <h3>Participant Type Distribution</h3>
                  <div className="distribution-grid">
                    <div className="distribution-item">
                      <span>IIIT Students:</span>
                      <strong>{analytics.participantTypeDistribution.IIIT || 0}</strong>
                    </div>
                    <div className="distribution-item">
                      <span>External Participants:</span>
                      <strong>{analytics.participantTypeDistribution.External || 0}</strong>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Participants Tab */}
          {activeTab === 'participants' && (
            <div className="participants-section">
              <div className="participants-header">
                <h2>Registered Participants</h2>
                <button onClick={handleExport} className="btn btn-primary">
                  Export CSV
                </button>
              </div>

              {/* Search and Filter */}
              <div className="participants-controls">
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="filter-select"
                >
                  <option value="">All Statuses</option>
                  <option value="Confirmed">Confirmed</option>
                  <option value="Pending">Pending</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="sort-select"
                >
                  <option value="date">Sort by Date</option>
                  <option value="name">Sort by Name</option>
                </select>
              </div>

              {/* Participants Table */}
              <div className="table-container">
                <table className="participants-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Registration Date</th>
                      <th>Payment Status</th>
                      <th>Amount</th>
                      <th>Attended</th>
                      <th>Ticket ID</th>
                    </tr>
                  </thead>
                  <tbody>
                    {participants.length > 0 ? (
                      participants.map((participant) => (
                        <tr key={participant.id}>
                          <td>{participant.name}</td>
                          <td>{participant.email}</td>
                          <td>{new Date(participant.registrationDate).toLocaleDateString()}</td>
                          <td>
                            <span className={`status-badge status-${participant.paymentStatus?.toLowerCase()}`}>
                              {participant.paymentStatus}
                            </span>
                          </td>
                          <td>₹{participant.paymentAmount || 0}</td>
                          <td>
                            <span className={participant.attended ? 'badge-success' : 'badge-pending'}>
                              {participant.attended ? 'Yes' : 'No'}
                            </span>
                          </td>
                          <td>{participant.ticketId || 'N/A'}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7" className="no-data">No participants found</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Forum Tab */}
          {activeTab === 'forum' && user && (
            <div className="forum-section">
              <Forum 
                eventId={id} 
                userRole="organizer" 
                userId={user._id}
              />
            </div>
          )}

          {/* Feedback Tab */}
          {activeTab === 'feedback' && (
            <div className="feedback-section">
              <FeedbackView eventId={id} />
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default EventDetail;
