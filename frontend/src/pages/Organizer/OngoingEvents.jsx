import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { organizerAPI } from '../../utils/api';
import { toast } from 'react-toastify';
import './OngoingEvents.css';

const OngoingEvents = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOngoingEvents();
  }, []);

  const fetchOngoingEvents = async () => {
    try {
      setLoading(true);
      const response = await organizerAPI.getOngoingEvents();
      setEvents(response.data.events);
    } catch (error) {
      console.error('Error fetching ongoing events:', error);
      toast.error('Error loading ongoing events');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar role="organizer" />
        <div className="container">
          <div className="loading">Loading ongoing events...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar role="organizer" />
      <div className="ongoing-events">
        <div className="container">
          <div className="page-header">
            <h1>Ongoing Events</h1>
            <p className="subtitle">Events that are currently running</p>
          </div>

          {events.length > 0 ? (
            <div className="events-grid">
              {events.map((event) => (
                <div key={event._id} className="event-card">
                  <div className="event-card-header">
                    <h3>{event.eventName || event.title}</h3>
                    <span className="badge badge-ongoing">Ongoing</span>
                  </div>
                  <div className="event-card-body">
                    <div className="event-info">
                      <p><strong>Type:</strong> {event.eventType}</p>
                      <p>
                        <strong>Duration:</strong> 
                        <br />
                        {new Date(event.eventStartDate || event.startDate).toLocaleDateString()} - 
                        {new Date(event.eventEndDate || event.endDate).toLocaleDateString()}
                      </p>
                      <p>
                        <strong>Participants:</strong> {event.currentParticipants || 0}
                        {event.registrationLimit && ` / ${event.registrationLimit}`}
                      </p>
                    </div>
                  </div>
                  <div className="event-card-footer">
                    <Link 
                      to={`/organizer/events/${event._id}/scanner`}
                      className="btn btn-success"
                    >
                      📱 QR Scanner
                    </Link>
                    <Link 
                      to={`/organizer/events/${event._id}/attendance`}
                      className="btn btn-info"
                    >
                      📊 Attendance
                    </Link>
                    <Link 
                      to={`/organizer/events/${event._id}`}
                      className="btn btn-primary"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-events">
              <div className="no-events-icon">📅</div>
              <h2>No Ongoing Events</h2>
              <p>You don't have any events that are currently running.</p>
              <Link to="/organizer/dashboard" className="btn btn-primary">
                Go to Dashboard
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default OngoingEvents;
