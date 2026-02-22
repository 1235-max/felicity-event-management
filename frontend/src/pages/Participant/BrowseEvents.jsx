import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { eventAPI } from '../../utils/api';
import { toast } from 'react-toastify';
import { FiSearch, FiFilter } from 'react-icons/fi';
import './BrowseEvents.css';

const BrowseEvents = () => {
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [trendingEvents, setTrendingEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [filters, setFilters] = useState({
    search: '',
    type: '',
    eligibility: '',
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    fetchEvents();
    fetchTrendingEvents();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [filters, events]);

  const fetchEvents = async () => {
    try {
      const response = await eventAPI.getAll();
      setEvents(response.data.events);
      setFilteredEvents(response.data.events);
    } catch (error) {
      toast.error('Error loading events');
    } finally {
      setLoading(false);
    }
  };

  const fetchTrendingEvents = async () => {
    try {
      const response = await eventAPI.getAll({ trending: true });
      setTrendingEvents(response.data.events);
    } catch (error) {
      console.error('Error loading trending events');
    }
  };

  const applyFilters = () => {
    let filtered = [...events];

    // Search filter
    if (filters.search) {
      filtered = filtered.filter(event =>
        event.title.toLowerCase().includes(filters.search.toLowerCase()) ||
        event.description.toLowerCase().includes(filters.search.toLowerCase()) ||
        event.organizer.clubName.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    // Type filter
    if (filters.type) {
      filtered = filtered.filter(event => event.eventType === filters.type);
    }

    // Eligibility filter
    if (filters.eligibility) {
      filtered = filtered.filter(event => event.eligibility === filters.eligibility);
    }

    // Date filter
    if (filters.startDate) {
      filtered = filtered.filter(event => 
        new Date(event.startDate) >= new Date(filters.startDate)
      );
    }

    if (filters.endDate) {
      filtered = filtered.filter(event => 
        new Date(event.startDate) <= new Date(filters.endDate)
      );
    }

    setFilteredEvents(filtered);
  };

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value
    });
  };

  const resetFilters = () => {
    setFilters({
      search: '',
      type: '',
      eligibility: '',
      startDate: '',
      endDate: ''
    });
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

  return (
    <>
      <Navbar role="participant" />
      <div className="container">
        <h1>Browse Events</h1>

        {/* Trending Events Section */}
        {trendingEvents.length > 0 && (
          <section className="trending-section">
            <h2>🔥 Trending Events (Last 24h)</h2>
            <div className="trending-grid">
              {trendingEvents.map((event) => (
                <Link 
                  key={event._id} 
                  to={`/participant/events/${event._id}`}
                  className="trending-card"
                >
                  <h3>{event.title}</h3>
                  <p>by {event.organizer.clubName}</p>
                  <span className="view-count">{event.viewCount} views</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Filters */}
        <div className="filters-container">
          <div className="search-bar">
            <FiSearch />
            <input
              type="text"
              name="search"
              placeholder="Search events, organizers..."
              value={filters.search}
              onChange={handleFilterChange}
            />
          </div>

          <div className="filters-row">
            <select name="type" value={filters.type} onChange={handleFilterChange}>
              <option value="">All Types</option>
              <option value="Normal">Normal</option>
              <option value="Merchandise">Merchandise</option>
            </select>

            <select name="eligibility" value={filters.eligibility} onChange={handleFilterChange}>
              <option value="">All Eligibility</option>
              <option value="All">All</option>
              <option value="IIIT Only">IIIT Only</option>
            </select>

            <input
              type="date"
              name="startDate"
              value={filters.startDate}
              onChange={handleFilterChange}
              placeholder="Start Date"
            />

            <input
              type="date"
              name="endDate"
              value={filters.endDate}
              onChange={handleFilterChange}
              placeholder="End Date"
            />

            <button onClick={resetFilters} className="btn-reset">
              Reset
            </button>
          </div>
        </div>

        {/* Events Grid */}
        <div className="events-grid">
          {filteredEvents.length === 0 ? (
            <p>No events found</p>
          ) : (
            filteredEvents.map((event) => (
              <Link 
                key={event._id} 
                to={`/participant/events/${event._id}`}
                className="event-card-link"
              >
                <div className="event-card">
                  <div className="event-badge">{event.eventType}</div>
                  {event.eligibility === 'IIIT Only' && (
                    <div className="event-badge iiit">IIIT Only</div>
                  )}
                  <h3>{event.title}</h3>
                  <p className="event-organizer">{event.organizer.clubName}</p>
                  <p className="event-description">
                    {event.description.substring(0, 100)}...
                  </p>
                  <div className="event-details">
                    <p><strong>Date:</strong> {new Date(event.startDate).toLocaleDateString()}</p>
                    <p><strong>Venue:</strong> {event.venue}</p>
                    {event.price > 0 && <p><strong>Price:</strong> ₹{event.price}</p>}
                  </div>
                  <div className="event-footer">
                    <span>{event.currentParticipants} registered</span>
                    {event.maxParticipants && (
                      <span>/ {event.maxParticipants} max</span>
                    )}
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </>
  );
};

export default BrowseEvents;
