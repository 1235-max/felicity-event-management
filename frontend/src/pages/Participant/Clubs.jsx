import { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import { participantAPI } from '../../utils/api';
import { toast } from 'react-toastify';
import './Clubs.css';

const Clubs = () => {
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');

  useEffect(() => {
    fetchClubs();
  }, []);

  const fetchClubs = async () => {
    try {
      setLoading(true);
      const response = await participantAPI.getClubs();
      setClubs(response.data.clubs);
    } catch (error) {
      console.error('Error loading clubs:', error);
      toast.error('Error loading clubs');
    } finally {
      setLoading(false);
    }
  };

  const toggleFollow = async (clubId, isFollowing) => {
    try {
      if (isFollowing) {
        await participantAPI.unfollowClub(clubId);
        toast.success('Unfollowed club');
      } else {
        await participantAPI.followClub(clubId);
        toast.success('Following club');
      }
      fetchClubs();
    } catch (error) {
      console.error('Follow error:', error);
      toast.error(error.response?.data?.message || 'Error updating follow status');
    }
  };

  // Get unique categories
  const categories = ['all', ...new Set(clubs.map(c => c.category).filter(Boolean))];

  // Filter clubs
  const filteredClubs = clubs.filter(club => {
    const matchesSearch = 
      club.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      club.clubName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      club.organizerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      club.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = filterCategory === 'all' || club.category === filterCategory;
    
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <>
        <Navbar role="participant" />
        <div className="clubs-page">
          <div className="container">
            <div className="loading">Loading clubs...</div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar role="participant" />
      <div className="clubs-page">
        <div className="container">
          <div className="page-header">
            <h1>Clubs & Organizers</h1>
            <p className="subtitle">Discover and follow clubs to stay updated with their events</p>
          </div>

          {/* Search and Filter */}
          <div className="controls-section">
            <div className="search-box">
              <input
                type="text"
                placeholder="Search clubs by name or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
            <div className="filter-section">
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="category-filter"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>
                    {cat === 'all' ? 'All Categories' : cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Clubs Grid */}
          <div className="clubs-grid">
            {filteredClubs.length > 0 ? (
              filteredClubs.map((club) => (
                <div key={club._id} className="club-card">
                  <div className="club-header">
                    <h3>{club.name || club.clubName || club.organizerName}</h3>
                    {club.category && (
                      <span className="category-badge">{club.category}</span>
                    )}
                  </div>
                  
                  <div className="club-body">
                    {club.description && (
                      <p className="club-description">{club.description}</p>
                    )}
                    
                    <div className="club-stats">
                      <div className="stat-item">
                        <span className="stat-icon">👥</span>
                        <span className="stat-value">{club.followerCount || 0}</span>
                        <span className="stat-label">Followers</span>
                      </div>
                    </div>

                    {club.contactEmail && (
                      <div className="club-contact">
                        <span className="contact-icon">📧</span>
                        <span className="contact-email">{club.contactEmail}</span>
                      </div>
                    )}
                  </div>

                  <div className="club-footer">
                    <button
                      className={`follow-btn ${club.isFollowing ? 'following' : ''}`}
                      onClick={() => toggleFollow(club._id, club.isFollowing)}
                    >
                      {club.isFollowing ? (
                        <>
                          <span>✓</span> Following
                        </>
                      ) : (
                        <>
                          <span>+</span> Follow
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-clubs">
                <p>No clubs found matching your search</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Clubs;
