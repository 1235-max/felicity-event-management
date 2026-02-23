import axios from 'axios';

const API_URL =
  import.meta.env.VITE_API_URL || 'https://felicity-backend-kih5.onrender.com/api';
export const BASE_URL = API_URL.replace('/api', '');

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// Auth APIs
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  signup: (userData) => api.post('/auth/signup/participant', userData),
  getMe: () => api.get('/auth/me'),
  requestPasswordReset: (data) => api.post('/auth/request-password-reset', data),
  checkResetStatus: (email) => api.get(`/auth/password-reset-status/${email}`)
};

// Event APIs
export const eventAPI = {
  getAll: (params) => api.get('/events', { params }),
  getById: (id) => api.get(`/events/${id}`),
  create: (data) => api.post('/events', data),
  update: (id, data) => api.put(`/events/${id}`, data),
  updateForm: (id, fields) => api.put(`/events/${id}/form`, { fields }),
  publish: (id) => api.patch(`/events/${id}/publish`),
  register: (id, formResponses) => api.post(`/events/${id}/register`, { formResponses }),
  delete: (id) => api.delete(`/events/${id}`)
};

// Participant APIs
export const participantAPI = {
  getProfile: () => api.get('/participant/profile'),
  updateProfile: (data) => api.put('/participant/profile', data),
  getDashboard: () => api.get('/participant/dashboard'),
  getRegistrations: () => api.get('/participant/registrations'),
  followClub: (id) => api.post(`/participant/follow/${id}`),
  unfollowClub: (id) => api.delete(`/participant/follow/${id}`),
  getClubs: () => api.get('/participant/clubs')
};

// Organizer APIs
export const organizerAPI = {
  getProfile: () => api.get('/organizer/profile'),
  updateProfile: (data) => api.put('/organizer/profile', data),
  getEvents: () => api.get('/organizer/events'),
  getEvent: (id) => api.get(`/events/${id}`),
  getDashboard: () => api.get('/organizer/dashboard'),
  getOngoingEvents: () => api.get('/organizer/events/ongoing'),
  getEventAnalytics: (id) => api.get(`/organizer/events/${id}/analytics`),
  getEventParticipants: (id, params) => api.get(`/organizer/events/${id}/participants`, { params }),
  exportParticipants: (id) => api.get(`/organizer/events/${id}/export`, { responseType: 'blob' }),
  getDashboardStats: () => api.get('/organizer/dashboard-stats'),
  requestPasswordReset: (data) => api.post('/organizer/password-reset-request', data),
  // Legacy support
  getAnalytics: (id) => api.get(`/organizer/events/${id}/analytics`),
  getParticipants: (id) => api.get(`/organizer/events/${id}/participants`),
  exportCSV: (id) => api.get(`/organizer/events/${id}/export`, { responseType: 'blob' })
};

// Admin APIs
export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  getOrganizers: () => api.get('/admin/organizers'),
  createOrganizer: (data) => api.post('/admin/organizers', data),
  toggleOrganizerStatus: (id) => api.patch(`/admin/organizers/${id}/toggle-active`),
  resetOrganizerPassword: (id, newPassword) => api.patch(`/admin/organizers/${id}/reset-password`, { newPassword }),
  deleteOrganizer: (id) => api.delete(`/admin/organizers/${id}`),
  removeOrganizer: (id) => api.delete(`/admin/organizers/${id}/remove`),
  publishEvent: (id) => api.patch(`/admin/events/${id}/publish`),
  getDashboardStats: () => api.get('/admin/dashboard-stats'),
  getPasswordResetRequests: (status) => api.get('/admin/password-reset-requests', { params: { status } }),
  approvePasswordReset: (id, newPassword) => api.post(`/admin/password-reset-requests/${id}/approve`, { newPassword }),
  rejectPasswordReset: (id, adminNotes) => api.post(`/admin/password-reset-requests/${id}/reject`, { adminNotes })
};

// Ticket APIs
export const ticketAPI = {
  getMyTickets: () => api.get('/tickets/my-tickets'),
  getTicket: (ticketId) => api.get(`/tickets/${ticketId}`),
  verifyTicket: (ticketId) => api.post(`/tickets/${ticketId}/verify`)
};

// Merchandise APIs
export const merchandiseAPI = {
  placeOrder: (data) => api.post('/merchandise/order', data),
  getMyOrders: () => api.get('/merchandise/my-orders'),
  uploadPaymentProof: (orderId, paymentProof) => api.put(`/merchandise/order/${orderId}/upload-proof`, { paymentProof }),
  getEventOrders: (eventId, status) => api.get(`/merchandise/orders/${eventId}`, { params: { status } }),
  approveOrder: (orderId) => api.post(`/merchandise/order/${orderId}/approve`),
  rejectOrder: (orderId, reason) => api.post(`/merchandise/order/${orderId}/reject`, { reason })
};

// Attendance APIs
export const attendanceAPI = {
  scanQR: (data) => api.post('/attendance/scan', data),
  markManual: (data) => api.post('/attendance/manual', data),
  getEventAttendance: (eventId) => api.get(`/attendance/event/${eventId}`),
  exportCSV: (eventId) => api.get(`/attendance/export/${eventId}`, { responseType: 'blob' }),
  removeAttendance: (attendanceId) => api.delete(`/attendance/${attendanceId}`)
};

// Forum APIs
export const forumAPI = {
  getMessages: (eventId) => api.get(`/forum/${eventId}/messages`),
  postMessage: (eventId, data) => api.post(`/forum/${eventId}/messages`, data),
  reactToMessage: (messageId, reaction) => api.put(`/forum/messages/${messageId}/react`, { reaction }),
  pinMessage: (messageId) => api.put(`/forum/messages/${messageId}/pin`),
  deleteMessage: (messageId) => api.delete(`/forum/messages/${messageId}`)
};

// Feedback APIs
export const feedbackAPI = {
  submitFeedback: (data) => api.post('/feedback/submit', data),
  getFeedback: (eventId, rating) => api.get(`/feedback/event/${eventId}`, { params: { rating } }),
  getStats: (eventId) => api.get(`/feedback/event/${eventId}/stats`),
  checkFeedback: (eventId) => api.get(`/feedback/check/${eventId}`)
};
