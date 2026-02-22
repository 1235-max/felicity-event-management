import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiLogOut, FiUser } from 'react-icons/fi';
import './Navbar.css';

const Navbar = ({ role }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getNavLinks = () => {
    switch (role) {
      case 'participant':
        return [
          { to: '/participant/dashboard', label: 'Dashboard' },
          { to: '/participant/events', label: 'Browse Events' },
          { to: '/participant/clubs', label: 'Clubs' },
          { to: '/participant/my-orders', label: 'My Orders' },
          { to: '/participant/profile', label: 'Profile' }
        ];
      case 'organizer':
        // 10.1 Navigation Menu: Dashboard, Create Event, Profile, Logout, Ongoing Events
        return [
          { to: '/organizer/dashboard', label: 'Dashboard' },
          { to: '/organizer/events/create', label: 'Create Event' },
          { to: '/organizer/events/ongoing', label: 'Ongoing Events' },
          { to: '/organizer/merchandise-club', label: 'Merchandise Club' },
          { to: '/organizer/password-reset', label: 'Request Password Reset' },
          { to: '/organizer/profile', label: 'Profile' }
        ];
      case 'admin':
        // 11.1 Navigation Menu: Dashboard, Manage Clubs/Organizers, Password Reset Requests, Logout
        return [
          { to: '/admin/dashboard', label: 'Dashboard' },
          { to: '/admin/organizers', label: 'Manage Clubs/Organizers' },
          { to: '/admin/password-reset-requests', label: 'Password Reset Requests' }
        ];
      default:
        return [];
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand">
          <h2>Felicity</h2>
          {user && <span className="navbar-role">{role}</span>}
        </div>
        
        <div className="navbar-links">
          {getNavLinks().map((link) => (
            <Link key={link.to} to={link.to} className="navbar-link">
              {link.label}
            </Link>
          ))}
        </div>

        <div className="navbar-user">
          <span className="navbar-username">
            <FiUser /> {user?.name || user?.organizerName || user?.clubName || 'User'}
          </span>
          <button onClick={handleLogout} className="navbar-logout">
            <FiLogOut /> Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
