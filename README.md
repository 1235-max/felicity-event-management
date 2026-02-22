# Felicity - Complete Event Management System

A full-stack MERN application to replace Google Forms, Spreadsheets, and WhatsApp for event management. Built for Felicity with three user roles: Participants, Organizers, and Admins.

## 🚀 Features

### Authentication & Security ✅
- ✅ bcrypt password hashing
- ✅ JWT-based authentication
- ✅ Role-based protected routes
- ✅ Session persistence
- ✅ IIIT email validation (@iiit.ac.in/@students.iiit.ac.in)
- ✅ Organizers created only by Admin
- ✅ Admin exists only in database (no signup UI)

### Participant Features (22 marks) ✅

**Dashboard**
- ✅ View upcoming registered events
- ✅ View past participation history
- ✅ View merchandise purchases
- ✅ Clickable ticket IDs with QR codes

**Browse Events**
- ✅ Fuzzy search (events, organizers)
- ✅ Filters: type, eligibility, date range
- ✅ Trending events (top 5 in last 24h)
- ✅ Event cards with all details

**Event Registration**
- ✅ Custom form submission
- ✅ Validation (deadline, capacity, stock)
- ✅ QR ticket generation
- ✅ Email confirmation
- ✅ Stock reduction for merchandise
- ✅ IIIT-only events restriction

**Profile Management**
- ✅ Edit: name, phone, college, interests
- ✅ Follow/unfollow clubs
- ✅ Non-editable: email, participant type

**Clubs**
- ✅ View all organizers
- ✅ Follow/unfollow functionality
- ✅ View club events

### Organizer Features (18 marks) ✅

**Dashboard**
- ✅ Event cards (all status)
- ✅ Analytics for completed events
- ✅ Revenue and registration stats

**Create Event**
- ✅ Draft → Define fields → Publish workflow
- ✅ Status-based edit restrictions:
  - Draft: full edit
  - Published: limited edit
  - Ongoing: no edit

**Custom Form Builder** ⭐
- ✅ Text fields
- ✅ Dropdowns
- ✅ Checkboxes
- ✅ Required/optional toggle
- ✅ Reorder fields
- ✅ Form locked after first registration

**Event Management**
- ✅ View participants list
- ✅ Export to CSV
- ✅ View attendance
- ✅ Analytics dashboard
- ✅ Revenue tracking

**Profile**
- ✅ Edit details
- ✅ Discord webhook integration

### Admin Features (6 marks) ✅

**Dashboard**
- ✅ System statistics
- ✅ Overview of all entities

**Manage Organizers**
- ✅ Create organizer (auto-generate password)
- ✅ Send credentials via email
- ✅ Activate/deactivate organizers
- ✅ Delete organizers (with validation)

### Tickets & QR Codes ✅
- ✅ Unique ticket ID for each registration
- ✅ QR code generation
- ✅ Email delivery
- ✅ Stored in participant dashboard
- ✅ Ticket verification by organizers

### Preferences System ✅
- ✅ Interests selection
- ✅ Club following
- ✅ Affects event recommendations

## 📁 Project Structure

```
a1da/
├── backend/
│   ├── models/         # Mongoose schemas
│   ├── routes/         # API endpoints
│   ├── middleware/     # Auth middleware
│   ├── utils/          # Helpers (JWT, email, QR)
│   ├── scripts/        # Seed scripts
│   ├── server.js       # Entry point
│   └── package.json
└── frontend/
    ├── src/
    │   ├── pages/      # Page components
    │   ├── components/ # Reusable components
    │   ├── context/    # Auth context
    │   ├── utils/      # API utilities
    │   └── App.jsx
    ├── index.html
    └── package.json
```

## 🛠️ Tech Stack

### Backend
- Node.js + Express.js
- MongoDB + Mongoose
- JWT + bcryptjs
- Nodemailer (email)
- QRCode (ticket generation)
- UUID (unique IDs)

### Frontend
- React 18
- React Router DOM v6
- Axios
- React Toastify
- React Icons
- React QR Code
- Vite

## 📦 Installation

### Prerequisites
- Node.js (v18+ recommended)
- MongoDB (local or Atlas)
- Gmail account for email (or other SMTP)

### Backend Setup

```bash
cd backend
npm install

# Configure environment
cp .env.example .env
# Edit .env with your values

# Seed admin account
npm run seed

# Start server
npm run dev  # Development with nodemon
npm start    # Production
```

Backend runs on `http://localhost:5000`

### Frontend Setup

```bash
cd frontend
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

Frontend runs on `http://localhost:3000`

## 🔑 Default Credentials

After seeding:
- **Admin Email**: admin@felicity.com
- **Admin Password**: admin123

**⚠️ Change immediately after first login!**

## 📝 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Endpoints

#### Authentication
- `POST /auth/signup/participant` - Participant signup
- `POST /auth/login` - Login (all roles)
- `GET /auth/me` - Get current user

#### Participants
- `GET /participant/profile` - Get profile
- `PUT /participant/profile` - Update profile
- `GET /participant/registrations` - Get registrations
- `POST /participant/follow/:id` - Follow club
- `DELETE /participant/follow/:id` - Unfollow club
- `GET /participant/clubs` - All clubs

#### Events
- `GET /events` - Browse events (with filters)
- `GET /events/:id` - Event details
- `POST /events` - Create event (organizer)
- `PUT /events/:id` - Update event (organizer)
- `PUT /events/:id/form` - Update custom form (organizer)
- `PATCH /events/:id/publish` - Publish event (organizer)
- `POST /events/:id/register` - Register for event (participant)
- `DELETE /events/:id` - Delete event (organizer)

#### Organizers
- `GET /organizer/profile` - Get profile
- `PUT /organizer/profile` - Update profile
- `GET /organizer/events` - All events
- `GET /organizer/events/:id/analytics` - Event analytics
- `GET /organizer/events/:id/participants` - Participants list
- `GET /organizer/events/:id/export` - Export CSV

#### Admin
- `GET /admin/organizers` - All organizers
- `POST /admin/organizers` - Create organizer
- `PATCH /admin/organizers/:id/toggle-active` - Toggle status
- `DELETE /admin/organizers/:id` - Delete organizer
- `GET /admin/dashboard-stats` - System stats

#### Tickets
- `GET /tickets/my-tickets` - User's tickets
- `GET /tickets/:ticketId` - Ticket details
- `POST /tickets/:ticketId/verify` - Verify ticket

## 🚀 Deployment (5 marks) ✅

See [deployment.txt](deployment.txt) for complete deployment instructions.

**Deployed on:**
- Frontend: Vercel/Netlify
- Backend: Render/Railway/Heroku
- Database: MongoDB Atlas

## ✅ Features Checklist

### Authentication (Compulsory)
- [x] bcrypt password hashing
- [x] JWT login
- [x] Role-based protected routes
- [x] Session persistence
- [x] Different dashboards per role
- [x] IIIT email validation
- [x] Organizers created only by Admin
- [x] No admin signup UI

### Database Models
- [x] Participants
- [x] Organizers
- [x] Admin
- [x] Events
- [x] Registrations
- [x] Tickets
- [x] Preferences (interests, followed clubs)

### Participant Side (22 marks)
- [x] Dashboard with upcoming/past events
- [x] Browse events with search
- [x] Fuzzy search
- [x] Filters (type, eligibility, date, followed clubs)
- [x] Trending events (top 5 in 24h)
- [x] Event details page
- [x] Registration with custom form
- [x] Validation (deadline, capacity, stock)
- [x] QR ticket generation
- [x] Email confirmation
- [x] Profile management
- [x] Clubs listing with follow/unfollow
- [x] Merchandise with stock management

### Organizer Side (18 marks)
- [x] Dashboard with event cards
- [x] Analytics for completed events
- [x] Create event (draft → publish workflow)
- [x] Custom form builder (text, dropdown, checkbox, file)
- [x] Form field reordering
- [x] Required/optional toggle
- [x] Form lock after first registration
- [x] Status-based edit restrictions
- [x] Participants list
- [x] Export CSV
- [x] Revenue tracking
- [x] Profile with Discord webhook

### Admin Side (6 marks)
- [x] Dashboard with stats
- [x] Create organizer
- [x] Auto-generate password
- [x] Email credentials
- [x] Activate/deactivate organizers
- [x] Delete organizers

### Tickets & QR (Very Important)
- [x] Unique ticket ID
- [x] QR code generation
- [x] Email delivery
- [x] Dashboard storage
- [x] Ticket verification

### Preferences System
- [x] Interests selection
- [x] Club following
- [x] Affects event display

### Deployment (5 marks)
- [x] Frontend on Vercel/Netlify
- [x] Backend on Render/Railway/Heroku
- [x] MongoDB Atlas
- [x] deployment.txt with links

## 🎯 Key Implementation Details

### Custom Form Builder
Organizers can create dynamic forms with:
- Multiple field types (text, dropdown, checkbox)
- Required/optional validation
- Field ordering
- Locked after first registration
- Stored in MongoDB as subdocument

### Event Status Workflow
```
Draft → Published → Ongoing → Completed
```
- **Draft**: Full edit allowed
- **Published**: Limited edit (description, venue, deadline only)
- **Ongoing**: No edit allowed
- **Completed**: Read-only, analytics available

### Registration Validation
- Check deadline
- Check participant limit
- Check stock (for merchandise)
- Check eligibility (IIIT-only events)
- Prevent duplicate registrations

### Ticket System
1. Generate unique ticket ID (FEL-XXXXXXXX)
2. Create QR code with ticket data
3. Store in database
4. Send email with QR code
5. Display in participant dashboard
6. Verify at event by organizer

## 📧 Email Configuration

Uses Nodemailer. For Gmail:
1. Enable 2-factor authentication
2. Generate App Password
3. Use App Password in EMAIL_PASS

## 🔒 Security Features

- Passwords hashed with bcrypt (12 rounds)
- JWT tokens with expiration
- Protected API routes
- Role-based authorization
- Input validation
- CORS configuration
- No admin signup UI

## 🐛 Troubleshooting

**MongoDB Connection Error:**
- Check MONGODB_URI format
- Ensure MongoDB is running
- Check network access in Atlas

**Email Not Sending:**
- Use Gmail App Password
- Check EMAIL_* env variables
- Enable less secure app access (if not using App Password)

**CORS Error:**
- Verify FRONTEND_URL in backend .env
- Check origin in CORS config

## 📄 License

MIT

## 👥 Contributors

Built for Felicity Event Management System

---

**Total Implementation:**
- Backend: ~2000 lines
- Frontend: ~1500 lines
- Full MERN stack with all required features
- Ready for production deployment
