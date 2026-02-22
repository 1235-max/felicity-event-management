# Felicity - Event Management System (Backend)

Complete backend API for Felicity event management platform built with Node.js, Express, and MongoDB.

## Features

- **Three User Roles**: Participant, Organizer, Admin
- **Authentication**: JWT-based with bcrypt password hashing
- **Event Management**: Custom form builder, registration, merchandise
- **Ticket System**: QR code generation and email delivery
- **Analytics**: Event analytics and participant tracking
- **Email Notifications**: Automated ticket delivery
- **Role-based Access Control**: Protected routes by user role

## Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Copy `.env.example` to `.env` and update:
```bash
cp .env.example .env
```

Required variables:
- `MONGODB_URI`: MongoDB connection string
- `JWT_SECRET`: Secret key for JWT
- `EMAIL_HOST`, `EMAIL_USER`, `EMAIL_PASS`: Email credentials

### 3. Seed Admin Account
```bash
npm run seed
```

Default admin credentials:
- Email: admin@felicity.com
- Password: admin123

**⚠️ Change this password immediately after first login!**

### 4. Start Server
```bash
# Development
npm run dev

# Production
npm start
```

Server runs on `http://localhost:5000`

## API Endpoints

### Authentication
- `POST /api/auth/signup/participant` - Participant signup
- `POST /api/auth/login` - Login (all roles)
- `GET /api/auth/me` - Get current user

### Participants
- `GET /api/participant/profile` - Get profile
- `PUT /api/participant/profile` - Update profile
- `GET /api/participant/registrations` - Get registrations
- `POST /api/participant/follow/:organizerId` - Follow club
- `DELETE /api/participant/follow/:organizerId` - Unfollow club
- `GET /api/participant/clubs` - Get all clubs

### Organizers
- `GET /api/organizer/profile` - Get profile
- `PUT /api/organizer/profile` - Update profile
- `GET /api/organizer/events` - Get all events
- `GET /api/organizer/events/:id/analytics` - Event analytics
- `GET /api/organizer/events/:id/participants` - Participants list
- `GET /api/organizer/events/:id/export` - Export CSV
- `GET /api/organizer/dashboard-stats` - Dashboard stats

### Events
- `GET /api/events` - Get all published events (with filters)
- `GET /api/events/:id` - Get event details
- `POST /api/events` - Create event (organizer)
- `PUT /api/events/:id` - Update event (organizer)
- `PUT /api/events/:id/form` - Update custom form (organizer)
- `PATCH /api/events/:id/publish` - Publish event (organizer)
- `POST /api/events/:id/register` - Register for event (participant)
- `DELETE /api/events/:id` - Delete event (organizer)

### Admin
- `GET /api/admin/organizers` - Get all organizers
- `POST /api/admin/organizers` - Create organizer
- `PATCH /api/admin/organizers/:id/toggle-active` - Toggle status
- `DELETE /api/admin/organizers/:id` - Delete organizer
- `GET /api/admin/dashboard-stats` - Dashboard stats

### Tickets
- `GET /api/tickets/my-tickets` - Get user's tickets
- `GET /api/tickets/:ticketId` - Get ticket details
- `POST /api/tickets/:ticketId/verify` - Verify ticket (organizer)

## Database Models

- **Participant**: Student/external users
- **Organizer**: Event organizers (clubs)
- **Admin**: System administrators
- **Event**: Event details with custom form
- **Registration**: Event registrations
- **Ticket**: QR tickets for events

## Custom Form Builder

Organizers can create forms with:
- Text fields
- Dropdowns
- Checkboxes
- File uploads

Forms are locked after first registration.

## Email Notifications

Automated emails sent for:
- Ticket delivery after registration
- Organizer account credentials

## Security

- Passwords hashed with bcrypt
- JWT token authentication
- Role-based route protection
- IIIT email validation for IIIT participants

## Deployment

Deploy to Render/Railway/Heroku:
1. Set environment variables
2. Connect MongoDB Atlas
3. Deploy from Git repository

## Tech Stack

- Node.js + Express
- MongoDB + Mongoose
- JWT + bcrypt
- Nodemailer
- QRCode
- Multer (file uploads)

## License

ISC
