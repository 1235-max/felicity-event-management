import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { organizerAPI } from '../../utils/api';
import './MerchandiseClub.css';

const MerchandiseClub = () => {
  const [merchandiseEvents, setMerchandiseEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchMerchandiseEvents();
  }, []);

  const fetchMerchandiseEvents = async () => {
    try {
      const response = await organizerAPI.getEvents();
      console.log('API response:', response.data);
      
      // The API returns events.all, not just events
      const allEvents = response.data.events?.all || response.data.events || [];
      console.log('All events:', allEvents);
      
      // Filter only merchandise events (case-insensitive)
      const merchEvents = allEvents.filter(
        event => event.eventType && event.eventType.toLowerCase() === 'merchandise'
      );
      console.log('Filtered merchandise events:', merchEvents);
      setMerchandiseEvents(merchEvents);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching merchandise events:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar role="organizer" />
        <div className="merchandise-club-container">
          <div className="loading">Loading merchandise events...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar role="organizer" />
      <div className="merchandise-club-container">
        <div className="merchandise-club-header">
          <h1>Merchandise Club</h1>
          <p>Manage payment approvals and orders for your merchandise events</p>
        </div>

        {merchandiseEvents.length === 0 ? (
          <div className="no-events">
            <p>No merchandise events found. Create a merchandise event to start receiving orders.</p>
          </div>
        ) : (
          <div className="merchandise-events-grid">
            {merchandiseEvents.map((event) => (
              <div key={event._id} className="merchandise-event-card">
                <div className="event-card-header">
                  <h3>{event.eventName}</h3>
                  <span className={`status-badge ${event.status}`}>
                    {event.status}
                  </span>
                </div>
                
                <div className="event-card-body">
                  <p className="event-description">{event.description}</p>
                  
                  <div className="event-stats">
                    <div className="stat">
                      <span className="stat-label">Variants:</span>
                      <span className="stat-value">
                        {event.merchandiseDetails?.variants?.length || 0}
                      </span>
                    </div>
                    <div className="stat">
                      <span className="stat-label">Total Stock:</span>
                      <span className="stat-value">{event.stockQuantity || 0}</span>
                    </div>
                    <div className="stat">
                      <span className="stat-label">Price Range:</span>
                      <span className="stat-value">
                        ₹{Math.min(...(event.merchandiseDetails?.variants?.map(v => v.price) || [0]))} - 
                        ₹{Math.max(...(event.merchandiseDetails?.variants?.map(v => v.price) || [0]))}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="event-card-actions">
                  <button
                    className="btn-primary"
                    onClick={() => navigate(`/organizer/events/${event._id}/payment-approval`)}
                  >
                    Manage Orders
                  </button>
                  <button
                    className="btn-secondary"
                    onClick={() => navigate(`/organizer/events/${event._id}/analytics`)}
                  >
                    View Analytics
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default MerchandiseClub;
