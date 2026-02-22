import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { eventAPI, adminAPI } from '../../utils/api';
import { toast } from 'react-toastify';
import './AllEvents.css';

const AllEvents = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await eventAPI.getAll();
      setEvents(response.data.events || []);
    } catch (error) {
      console.error('Error loading events:', error);
      toast.error('Error loading events');
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async (eventId, eventName) => {
    if (!window.confirm(`Publish "${eventName}"?\n\nThis will make the event visible to all users.`)) {
      return;
    }

    try {
      await adminAPI.publishEvent(eventId);
      toast.success('Event published successfully!');
      fetchEvents(); // Refresh the list
    } catch (error) {
      console.error('Publish event error:', error);
      toast.error(error.response?.data?.message || 'Error publishing event');
    }
  };

  // Filter events
  const filteredEvents = events.filter(event => {
    const matchesSearch = 
      event.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.eventName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.organizer?.clubName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = 
      filterStatus === 'all' ||
      (filterStatus === 'published' && event.status === 'Published') ||
      (filterStatus === 'draft' && event.status === 'Draft');
    
    const matchesType = 
      filterType === 'all' ||
      event.eventType === filterType;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const getStatusBadgeClass = (status) => {
    return status === 'Published' ? 'status-published' : 'status-draft';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <>
        <Navbar role="admin" />
        <div className="container">
          <div className="loading">Loading events...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar role="admin" />
      <div className="admin-all-events">
        <div className="container">
          <div className="page-header">
            <div>
              <Link to="/admin/dashboard" className="back-link">← Back to Dashboard</Link>
              <h1>All Platform Events</h1>
              <p className="subtitle">Monitor and view all events across the platform</p>
            </div>
          </div>

          {/* Filters */}
          <div className="filters-section">
            <div className="search-box">
              <input
                type="text"
                placeholder="Search by event name or organizer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
            <div className="filter-group">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Status</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
              </select>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Types</option>
                <option value="Normal">Normal Events</option>
                <option value="Merchandise">Merchandise</option>
              </select>
            </div>
          </div>

          {/* Stats Summary */}
          <div className="stats-summary">
            <div className="stat-item">
              <span className="stat-label">Total Events</span>
              <span className="stat-value">{events.length}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Published</span>
              <span className="stat-value">{events.filter(e => e.status === 'Published').length}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Draft</span>
              <span className="stat-value">{events.filter(e => e.status === 'Draft').length}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Filtered Results</span>
              <span className="stat-value">{filteredEvents.length}</span>
            </div>
          </div>

          {/* Events List */}
          <div className="events-section">
            {filteredEvents.length === 0 ? (
              <div className="no-events">
                <p>No events found matching your filters</p>
              </div>
            ) : (
              <div className="events-table">
                <table>
                  <thead>
                    <tr>
                      <th>Event Name</th>
                      <th>Organizer</th>
                      <th>Type</th>
                      <th>Status</th>
                      <th>Date</th>
                      <th>Registrations</th>
                      <th>Capacity</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEvents.map((event) => (
                      <tr key={event._id}>
                        <td>
                          <div className="event-name-cell">
                            <strong>{event.title || event.eventName}</strong>
                            {event.venue && (
                              <small className="event-venue">📍 {event.venue}</small>
                            )}
                          </div>
                        </td>
                        <td>
                          <div className="organizer-cell">
                            {event.organizer?.clubName || event.organizer?.organizerName || 'N/A'}
                          </div>
                        </td>
                        <td>
                          <span className={`type-badge ${event.eventType?.toLowerCase()}`}>
                            {event.eventType || 'Normal'}
                          </span>
                        </td>
                        <td>
                          <span className={`status-badge ${getStatusBadgeClass(event.status)}`}>
                            {event.status}
                          </span>
                        </td>
                        <td>
                          <div className="date-cell">
                            <div>{formatDate(event.startDate || event.eventStartDate)}</div>
                            {event.registrationDeadline && (
                              <small className="deadline">
                                Deadline: {formatDate(event.registrationDeadline)}
                              </small>
                            )}
                          </div>
                        </td>
                        <td className="center-text">
                          <strong>{event.currentParticipants || 0}</strong>
                        </td>
                        <td className="center-text">
                          {event.maxParticipants || '∞'}
                        </td>
                        <td className="center-text">
                          {event.status === 'Draft' && (
                            <button
                              onClick={() => handlePublish(event._id, event.title || event.eventName)}
                              className="btn btn-sm btn-success"
                              title="Publish this event"
                            >
                              Publish
                            </button>
                          )}
                          {event.status === 'Published' && (
                            <span className="text-muted" style={{ fontSize: '0.85rem' }}>Published</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default AllEvents;
