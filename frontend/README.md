# Felicity Frontend

Event management system frontend built with React 18 and Vite.

## Features

- ✅ Role-based authentication (Participant, Organizer, Admin)
- ✅ Protected routes with role checking
- ✅ Responsive UI with modern design
- ✅ Real-time notifications (React Toastify)
- ✅ QR code display for tickets
- ✅ Custom form builder interface
- ✅ Event browsing with filters and search
- ✅ Trending events section
- ✅ Club following system
- ✅ Profile management
- ✅ Admin organizer management

## Tech Stack

- **React 18** - UI library
- **React Router v6** - Client-side routing
- **Vite** - Build tool and dev server
- **Axios** - HTTP client
- **React Context API** - State management
- **React Toastify** - Notifications
- **React Icons** - Icon library
- **React QR Code** - QR code rendering

## Project Structure

```
frontend/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── Navbar.jsx         # Role-aware navigation
│   │   ├── Navbar.css
│   │   └── ProtectedRoute.jsx # Route protection by role
│   ├── pages/
│   │   ├── Auth/
│   │   │   ├── Login.jsx
│   │   │   ├── SignupParticipant.jsx
│   │   │   └── Auth.css
│   │   ├── Participant/
│   │   │   ├── Dashboard.jsx       # Events + Tickets with QR
│   │   │   ├── Dashboard.css
│   │   │   ├── BrowseEvents.jsx    # Search + Filters + Trending
│   │   │   ├── BrowseEvents.css
│   │   │   ├── EventDetails.jsx    # Event info + Registration
│   │   │   ├── Clubs.jsx           # Follow/Unfollow clubs
│   │   │   └── Profile.jsx         # Edit profile
│   │   ├── Organizer/
│   │   │   ├── Dashboard.jsx       # Stats + Events by status
│   │   │   ├── CreateEvent.jsx     # Event + Custom Form Builder
│   │   │   ├── EditEvent.jsx       # Edit existing event
│   │   │   ├── EventAnalytics.jsx  # Event analytics
│   │   │   └── Profile.jsx         # Organizer profile
│   │   └── Admin/
│   │       ├── Dashboard.jsx       # System stats
│   │       └── ManageOrganizers.jsx # CRUD organizers
│   ├── context/
│   │   └── AuthContext.jsx    # Authentication state
│   ├── utils/
│   │   └── api.js             # Axios instance + API functions
│   ├── App.jsx                # Router configuration
│   ├── index.css              # Global styles
│   └── main.jsx               # Entry point
├── .env.example
├── vite.config.js
└── package.json
```

## Installation

```bash
npm install
```

## Environment Variables

Create `.env` file:

```env
VITE_API_URL=http://localhost:5000/api
```

For production:
```env
VITE_API_URL=https://your-backend-url.com/api
```

## Development

```bash
npm run dev
```

Runs on `http://localhost:3000` with hot module replacement.

## Build

```bash
npm run build
```

Outputs to `dist/` directory.

## Preview Production Build

```bash
npm run preview
```

## Pages Overview

### Public Routes
- `/login` - Login for all roles
- `/signup` - Participant signup

### Participant Routes (Protected)
- `/participant/dashboard` - View events, tickets, stats
- `/participant/browse` - Browse all events with filters
- `/participant/events/:id` - Event details and registration
- `/participant/clubs` - Follow/unfollow clubs
- `/participant/profile` - Edit profile

### Organizer Routes (Protected)
- `/organizer/dashboard` - Event stats and list
- `/organizer/create-event` - Create event with custom form
- `/organizer/edit-event/:id` - Edit event
- `/organizer/events/:id/analytics` - View analytics
- `/organizer/profile` - Edit organizer profile

### Admin Routes (Protected)
- `/admin/dashboard` - System statistics
- `/admin/organizers` - Manage organizers (CRUD)

## Key Components

### AuthContext
Provides authentication state and methods:
- `user` - Current logged-in user
- `token` - JWT token
- `role` - User role (participant/organizer/admin)
- `login(token, userData, role)` - Login user
- `logout()` - Logout user
- `checkAuth()` - Verify token validity

### ProtectedRoute
Wrapper for protected routes:
```jsx
<Route path="/participant" element={<ProtectedRoute role="participant" />}>
  <Route path="dashboard" element={<Dashboard />} />
</Route>
```

### Navbar
Role-aware navigation:
- Shows different links based on user role
- Highlights active route
- Logout button

## API Integration

All API calls are in `src/utils/api.js`:

```javascript
import { authAPI, eventAPI, participantAPI, organizerAPI, adminAPI, ticketAPI } from './utils/api';

// Example usage
const events = await eventAPI.getAll({ search: 'tech', type: 'Normal' });
const ticket = await ticketAPI.getMyTickets();
await participantAPI.registerForEvent(eventId, formData);
```

## Features Implementation

### Custom Form Builder
Organizers can add fields dynamically:
```javascript
const [customFields, setCustomFields] = useState([]);

const addField = () => {
  setCustomFields([...customFields, {
    fieldId: `field_${Date.now()}`,
    fieldType: 'text',
    label: '',
    required: false,
    order: customFields.length
  }]);
};
```

### Event Filters
Participants can filter events by:
- Search query (fuzzy search)
- Event type (Normal/Merchandise)
- Eligibility (IIIT Only/All)
- Date range (start/end)
- Followed clubs only

### Trending Events
Top 5 events by views in last 24 hours:
```javascript
const trendingEvents = await eventAPI.getAll({ trending: true });
```

### QR Ticket Modal
Display ticket QR code on click:
```javascript
const [selectedTicket, setSelectedTicket] = useState(null);

// In JSX
{selectedTicket && (
  <div className="modal-overlay" onClick={() => setSelectedTicket(null)}>
    <img src={selectedTicket.qrCode} alt="QR Code" />
  </div>
)}
```

## Styling

- CSS Modules approach with component-specific styles
- Consistent color scheme
- Responsive design (mobile-friendly)
- Modern UI with shadows, borders, transitions

### Color Palette
```css
--primary: #4A90E2
--secondary: #50C878
--danger: #E74C3C
--warning: #F39C12
--background: #F5F7FA
--card: #FFFFFF
--text: #2C3E50
```

## Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import project on Vercel
3. Set root directory: `frontend`
4. Add environment variable:
   - `VITE_API_URL`: Your backend URL
5. Deploy

### Netlify

1. Build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Base directory: `frontend`
2. Environment variables:
   - `VITE_API_URL`: Your backend URL
3. Deploy

### Manual Deployment

```bash
npm run build
# Upload dist/ folder to any static hosting
```

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Troubleshooting

### API Calls Failing
- Check `VITE_API_URL` in `.env`
- Verify backend is running
- Check browser console for CORS errors
- Ensure token is valid (check localStorage)

### Routes Not Working
- Ensure server configured for SPA (serve index.html for all routes)
- Check router configuration in App.jsx
- Verify protected route role matches user role

### Styles Not Loading
- Check CSS imports in components
- Run `npm run dev` to rebuild
- Clear browser cache

### Build Errors
- Delete `node_modules` and reinstall
- Check Node.js version (18+ required)
- Verify all imports are correct

## Development Tips

1. **Hot Reload**: Vite provides instant updates
2. **React DevTools**: Install browser extension for debugging
3. **Network Tab**: Monitor API calls in browser DevTools
4. **Console Logs**: Check for errors and warnings
5. **LocalStorage**: Inspect auth token and user data

## Code Quality

```bash
# Check for linting (if configured)
npm run lint

# Format code (if configured)
npm run format
```

## Performance

- Lazy loading for large components (optional)
- Image optimization
- Code splitting by route
- Minimal bundle size with Vite

## Security

- No sensitive data in frontend code
- JWT token stored in localStorage (consider httpOnly cookies for production)
- Protected routes check user role
- API calls include auth header
- Input validation on forms

## Future Enhancements

- [ ] Dark mode toggle
- [ ] Offline support (PWA)
- [ ] Image uploads for events
- [ ] Real-time notifications (WebSockets)
- [ ] Advanced analytics charts
- [ ] Mobile app (React Native)

## License

MIT

---

Built for Felicity Event Management System
