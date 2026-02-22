import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { organizerAPI, eventAPI } from '../../utils/api';
import { toast } from 'react-toastify';
import './Dashboard.css';

const Dashboard = () => {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const response = await organizerAPI.getDashboard();
      setDashboard(response.data.dashboard);
    } catch (error) {
      console.error('Error loading dashboard:', error);
      toast.error('Error loading dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async (eventId, eventName) => {
    if (!window.confirm(`Publish "${eventName}"? It will be visible to all users.`)) {
      return;
    }

    try {
      await eventAPI.publish(eventId);
      toast.success('Event published successfully! 🎉');
      fetchDashboard(); // Refresh the dashboard
    } catch (error) {
      console.error('Publish error:', error);
      toast.error(error.response?.data?.message || 'Error publishing event');
    }
  };

  const getStatusBadgeClass = (status) => {
    const statusMap = {
      Draft: 'badge-draft',
      Published: 'badge-published',
      Ongoing: 'badge-ongoing',
      Completed: 'badge-completed',
      Cancelled: 'badge-cancelled'
    };
    return statusMap[status] || 'badge-default';
  };

  const filterEvents = (events) => {
    if (activeTab === 'all') return events;
    return events.filter(e => e.status.toLowerCase() === activeTab);
  };

  if (loading) {
    return (
      <>
        <Navbar role="organizer" />
        <div className="container">
          <div className="loading">Loading dashboard...</div>
        </div>
      </>
    );
  }

  const { eventsCarousel, analytics } = dashboard || {};

  return (
    <>
      <Navbar role="organizer" />
      <div className="organizer-dashboard">
        <div className="container">
          <div className="dashboard-header">
            <h1>Organizer Dashboard</h1>
            <Link to="/organizer/events/create" className="btn btn-primary">
              + Create New Event
            </Link>
          </div>

          {/* Event Analytics Section (10.2) */}
          {analytics && (
            <div className="analytics-section">
              <h2>Event Analytics (Completed Events)</h2>
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon">📊</div>
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
                <div className="stat-card">
                  <div className="stat-icon">🎫</div>
                  <div className="stat-content">
                    <h3>Total Events</h3>
                    <p className="stat-number">{analytics.totalEvents}</p>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">✅</div>
                  <div className="stat-content">
                    <h3>Completed Events</h3>
                    <p className="stat-number">{analytics.completedEvents}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Events Carousel Section (10.2) */}
          <div className="events-carousel-section">
            <h2>My Events</h2>
            
            {/* Status Filter Tabs */}
            <div className="event-tabs">
              <button 
                className={activeTab === 'all' ? 'tab active' : 'tab'}
                onClick={() => setActiveTab('all')}
              >
                All ({eventsCarousel?.length || 0})
              </button>
              <button 
                className={activeTab === 'draft' ? 'tab active' : 'tab'}
                onClick={() => setActiveTab('draft')}
              >
                Draft ({eventsCarousel?.filter(e => e.status === 'Draft').length || 0})
              </button>
              <button 
                className={activeTab === 'published' ? 'tab active' : 'tab'}
                onClick={() => setActiveTab('published')}
              >
                Published ({eventsCarousel?.filter(e => e.status === 'Published').length || 0})
              </button>
              <button 
                className={activeTab === 'ongoing' ? 'tab active' : 'tab'}
                onClick={() => setActiveTab('ongoing')}
              >
                Ongoing ({eventsCarousel?.filter(e => e.status === 'Ongoing').length || 0})
              </button>
              <button 
                className={activeTab === 'completed' ? 'tab active' : 'tab'}
                onClick={() => setActiveTab('completed')}
              >
                Completed ({eventsCarousel?.filter(e => e.status === 'Completed').length || 0})
              </button>
            </div>

            {/* Events Grid */}
            <div className="events-carousel">
              {eventsCarousel && filterEvents(eventsCarousel).length > 0 ? (
                filterEvents(eventsCarousel).map((event) => (
                  <div key={event.id} className="event-card">
                    <div className="event-card-header">
                      <h3>{event.name}</h3>
                      <span className={`badge ${getStatusBadgeClass(event.status)}`}>
                        {event.status}
                      </span>
                    </div>
                    <div className="event-card-body">
                      <div className="event-info">
                        <p><strong>Type:</strong> {event.type}</p>
                        <p><strong>Start Date:</strong> {new Date(event.startDate).toLocaleDateString()}</p>
                        <p><strong>End Date:</strong> {new Date(event.endDate).toLocaleDateString()}</p>
                        <p>
                          <strong>Participants:</strong> {event.participants || 0}
                          {event.limit && ` / ${event.limit}`}
                        </p>
                        {event.revenue > 0 && (
                          <p><strong>Revenue:</strong> ₹{event.revenue?.toLocaleString()}</p>
                        )}
                      </div>
                    </div>
                    <div className="event-card-footer">
                      <Link 
                        to={`/organizer/events/${event.id}`} 
                        className="btn btn-sm btn-primary"
                      >
                        View Details
                      </Link>
                      {event.status === 'Draft' && (
                        <>
                          <Link 
                            to={`/organizer/events/${event.id}/edit`} 
                            className="btn btn-sm btn-secondary"
                          >
                            Edit
                          </Link>
                          <button
                            onClick={() => handlePublish(event.id, event.name)}
                            className="btn btn-sm btn-success"
                            title="Publish this event"
                          >
                            📢 Publish
                          </button>
                        </>
                      )}
                      {['Published', 'Ongoing', 'Completed'].includes(event.status) && (
                        <Link 
                          to={`/organizer/events/${event.id}/analytics`} 
                          className="btn btn-sm btn-secondary"
                        >
                          Analytics
                        </Link>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="no-events">
                  <p>No {activeTab !== 'all' ? activeTab : ''} events found.</p>
                  <Link to="/organizer/events/create" className="btn btn-primary">
                    Create Your First Event
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Dashboard;
