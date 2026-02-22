import { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import { participantAPI } from '../../utils/api';
import { toast } from 'react-toastify';
import './Dashboard.css';

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      console.log('🔍 Fetching dashboard data...');
      console.log('Token:', localStorage.getItem('token') ? 'EXISTS' : 'MISSING');
      console.log('User:', localStorage.getItem('user'));
      
      const response = await participantAPI.getDashboard();
      console.log('✅ Dashboard response:', response.data);
      setDashboardData(response.data.dashboard);
    } catch (error) {
      console.error('❌ Dashboard error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      toast.error(error.response?.data?.message || 'Error loading dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar role="participant" />
        <div className="container">
          <p>Loading...</p>
        </div>
      </>
    );
  }

  if (!dashboardData) {
    return (
      <>
        <Navbar role="participant" />
        <div className="container">
          <p>No data available</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar role="participant" />
      <div className="container">
        <h1>My Dashboard</h1>
        
        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <h3>Upcoming Events</h3>
            <p className="stat-number">{dashboardData.upcomingEventsCount}</p>
          </div>
          <div className="stat-card">
            <h3>Past Events</h3>
            <p className="stat-number">{dashboardData.pastEventsCount}</p>
          </div>
          <div className="stat-card">
            <h3>Total Tickets</h3>
            <p className="stat-number">{dashboardData.totalTickets}</p>
          </div>
        </div>

        {/* Upcoming Events */}
        <section className="dashboard-section">
          <h2>Upcoming Events</h2>
          {dashboardData.upcomingEvents.length === 0 ? (
            <p>No upcoming events</p>
          ) : (
            <div className="events-grid">
              {dashboardData.upcomingEvents.map((event, index) => (
                <div key={index} className="event-card">
                  <h3>{event.eventName}</h3>
                  <p><strong>Type:</strong> {event.eventType}</p>
                  <p><strong>Organizer:</strong> {event.organizerName}</p>
                  <p><strong>Date:</strong> {new Date(event.startDate).toLocaleDateString()}</p>
                  <p><strong>Ticket ID:</strong> {event.ticketId}</p>
                  <span className={`status-badge status-${event.status.toLowerCase()}`}>
                    {event.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Past Events */}
        {/* Past Events */}
        <section className="dashboard-section">
          <h2>Past Participation</h2>
          {dashboardData.pastParticipation.length === 0 ? (
            <p>No past events</p>
          ) : (
            <div className="events-grid">
              {dashboardData.pastParticipation.map((event, index) => (
                <div key={index} className="event-card">
                  <h3>{event.eventName}</h3>
                  <p><strong>Type:</strong> {event.eventType}</p>
                  <p><strong>Organizer:</strong> {event.organizerName}</p>
                  <p><strong>Date:</strong> {new Date(event.endDate).toLocaleDateString()}</p>
                  <p><strong>Ticket ID:</strong> {event.ticketId}</p>
                  <span className={`status-badge status-${event.status.toLowerCase()}`}>
                    {event.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  );
};

export default Dashboard;
