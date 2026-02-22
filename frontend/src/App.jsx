import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Auth
import Login from './pages/Auth/Login';
import SignupParticipant from './pages/Auth/SignupParticipant';
import ForgotPassword from './pages/ForgotPassword';

// Participant
import ParticipantDashboard from './pages/Participant/Dashboard';
import BrowseEvents from './pages/Participant/BrowseEvents';
import EventDetails from './pages/Participant/EventDetails';
import Clubs from './pages/Participant/Clubs';
import ParticipantProfile from './pages/Participant/Profile';
import MerchandiseOrder from './pages/Participant/MerchandiseOrder';
import MyOrders from './pages/Participant/MyOrders';

// Organizer
import OrganizerDashboard from './pages/Organizer/Dashboard';
import CreateEvent from './pages/Organizer/CreateEvent';
import EditEvent from './pages/Organizer/EditEvent';
import EventAnalytics from './pages/Organizer/EventAnalytics';
import OrganizerProfile from './pages/Organizer/Profile';
import OngoingEvents from './pages/Organizer/OngoingEvents';
import EventDetail from './pages/Organizer/EventDetail';
import PaymentApproval from './pages/Organizer/PaymentApproval';
import QRScanner from './pages/Organizer/QRScanner';
import AttendanceDashboard from './pages/Organizer/AttendanceDashboard';
import MerchandiseClub from './pages/Organizer/MerchandiseClub';
import PasswordReset from './pages/Organizer/PasswordReset';

// Admin
import AdminDashboard from './pages/Admin/Dashboard';
import ManageOrganizers from './pages/Admin/ManageOrganizers';
import PasswordResets from './pages/Admin/PasswordResets';
import PasswordResetRequests from './pages/Admin/PasswordResetRequests';
import AllEvents from './pages/Admin/AllEvents';

// Components
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';

function App() {
  return (
    <AuthProvider>
      <Router>
        <ToastContainer position="top-right" autoClose={3000} />
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignupParticipant />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* Participant routes */}
          <Route path="/participant" element={<ProtectedRoute role="participant" />}>
            <Route path="dashboard" element={<ParticipantDashboard />} />
            <Route path="events" element={<BrowseEvents />} />
            <Route path="events/:id" element={<EventDetails />} />
            <Route path="merchandise/:eventId/order" element={<MerchandiseOrder />} />            <Route path="my-orders" element={<MyOrders />} />            <Route path="clubs" element={<Clubs />} />
            <Route path="profile" element={<ParticipantProfile />} />
          </Route>

          {/* Organizer routes */}
          <Route path="/organizer" element={<ProtectedRoute role="organizer" />}>
            <Route path="dashboard" element={<OrganizerDashboard />} />
            <Route path="events/create" element={<CreateEvent />} />
            <Route path="events/ongoing" element={<OngoingEvents />} />
            <Route path="events/:id" element={<EventDetail />} />
            <Route path="events/:id/edit" element={<EditEvent />} />
            <Route path="events/:id/analytics" element={<EventAnalytics />} />
            <Route path="events/:id/payment-approval" element={<PaymentApproval />} />
            <Route path="events/:id/scanner" element={<QRScanner />} />
            <Route path="events/:id/attendance" element={<AttendanceDashboard />} />
            <Route path="merchandise-club" element={<MerchandiseClub />} />
            <Route path="password-reset" element={<PasswordReset />} />
            <Route path="profile" element={<OrganizerProfile />} />
          </Route>

          {/* Admin routes */}
          <Route path="/admin" element={<ProtectedRoute role="admin" />}>
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="password-resets" element={<PasswordResets />} />
            <Route path="password-reset-requests" element={<PasswordResetRequests />} />
            <Route path="organizers" element={<ManageOrganizers />} />
            <Route path="events" element={<AllEvents />} />
          </Route>

          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
