import express from 'express';
import Organizer from '../models/Organizer.js';
import Event from '../models/Event.js';
import Registration from '../models/Registration.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Organizer Dashboard (10.2)
router.get('/dashboard', protect, authorize('organizer'), async (req, res) => {
  try {
    const organizerId = req.user._id;

    // Get all events created by organizer
    const events = await Event.find({
      $or: [
        { organizer: organizerId },
        { organizerId: organizerId }
      ]
    })
      .select('title eventName eventType status startDate eventStartDate endDate eventEndDate currentParticipants registrationLimit price registrationFee')
      .sort({ createdAt: -1 })
      .lean();

    // Categorize events for carousel
    const eventsByStatus = {
      draft: events.filter(e => e.status === 'Draft'),
      published: events.filter(e => e.status === 'Published'),
      ongoing: events.filter(e => e.status === 'Ongoing'),
      completed: events.filter(e => e.status === 'Completed'),
      cancelled: events.filter(e => e.status === 'Cancelled')
    };

    // Get analytics for completed events
    const completedEventIds = eventsByStatus.completed.map(e => e._id);
    const completedRegistrations = await Registration.find({
      event: { $in: completedEventIds }
    }).lean();

    // Calculate overall analytics
    const analytics = {
      totalEvents: events.length,
      draftEvents: eventsByStatus.draft.length,
      publishedEvents: eventsByStatus.published.length,
      ongoingEvents: eventsByStatus.ongoing.length,
      completedEvents: eventsByStatus.completed.length,
      totalRegistrations: completedRegistrations.length,
      totalRevenue: completedRegistrations.reduce((sum, r) => sum + (r.paymentAmount || 0), 0),
      totalAttendance: completedRegistrations.filter(r => r.attended).length,
      attendanceRate: completedRegistrations.length > 0 
        ? (completedRegistrations.filter(r => r.attended).length / completedRegistrations.length * 100).toFixed(2)
        : 0
    };

    // Events for carousel with essential info
    const eventsCarousel = events.map(e => ({
      id: e._id,
      name: e.eventName || e.title,
      type: e.eventType,
      status: e.status,
      startDate: e.eventStartDate || e.startDate,
      endDate: e.eventEndDate || e.endDate,
      participants: e.currentParticipants,
      limit: e.registrationLimit,
      revenue: (e.price || e.registrationFee || 0) * e.currentParticipants
    }));

    res.json({
      success: true,
      dashboard: {
        eventsCarousel,
        eventsByStatus,
        analytics
      }
    });
  } catch (error) {
    console.error('Organizer dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard data'
    });
  }
});

// Get organizer profile
router.get('/profile', protect, authorize('organizer'), async (req, res) => {
  try {
    const organizer = await Organizer.findById(req.user._id)
      .select('-password')
      .lean();

    res.json({
      success: true,
      organizer
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching profile'
    });
  }
});

// Update organizer profile (10.5 Organizer Profile Page)
router.put('/profile', protect, authorize('organizer'), async (req, res) => {
  try {
    const { organizerName, category, description, contactEmail, phone, discordWebhook } = req.body;

    const organizer = await Organizer.findById(req.user._id);

    // Editable fields
    if (organizerName) {
      organizer.organizerName = organizerName;
      organizer.clubName = organizerName; // Sync for backward compatibility
    }
    if (category) organizer.category = category;
    if (description) organizer.description = description;
    if (phone) organizer.phone = phone;
    if (discordWebhook !== undefined) organizer.discordWebhook = discordWebhook;
    
    // Contact email is editable but login email is not
    if (contactEmail && contactEmail !== organizer.email) {
      organizer.contactEmail = contactEmail;
    }

    // Email (login credential) is non-editable

    await organizer.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      organizer: {
        ...organizer.toObject(),
        password: undefined,
        editableFields: ['organizerName', 'category', 'description', 'contactEmail', 'phone', 'discordWebhook'],
        nonEditableFields: ['email']
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating profile'
    });
  }
});

// Change Password (Organizer Security Settings)
router.post('/change-password', protect, authorize('organizer'), async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide current password and new password'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long'
      });
    }

    const organizer = await Organizer.findById(req.user._id);

    // Verify current password
    const isPasswordValid = await organizer.comparePassword(currentPassword);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password (will be hashed by pre-save hook)
    organizer.password = newPassword;
    await organizer.save();

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({
      success: false,
      message: 'Error changing password'
    });
  }
});

// Get all events created by organizer
router.get('/events', protect, authorize('organizer'), async (req, res) => {
  try {
    const events = await Event.find({ 
      $or: [
        { organizer: req.user._id },
        { organizerId: req.user._id }
      ]
    })
      .sort({ createdAt: -1 })
      .lean();

    // Categorize events
    const draft = events.filter(e => e.status === 'Draft');
    const published = events.filter(e => e.status === 'Published');
    const ongoing = events.filter(e => e.status === 'Ongoing');
    const completed = events.filter(e => e.status === 'Completed');

    res.json({
      success: true,
      events: {
        all: events,
        draft,
        published,
        ongoing,
        completed
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching events'
    });
  }
});

// Get ongoing events specifically (10.1 Navigation requirement)
router.get('/events/ongoing', protect, authorize('organizer'), async (req, res) => {
  try {
    const ongoingEvents = await Event.find({ 
      $or: [
        { organizer: req.user._id },
        { organizerId: req.user._id }
      ],
      status: 'Ongoing'
    })
      .select('eventName title eventType status eventStartDate startDate eventEndDate endDate currentParticipants registrationLimit')
      .sort({ eventStartDate: -1, startDate: -1 })
      .lean();

    res.json({
      success: true,
      count: ongoingEvents.length,
      events: ongoingEvents
    });
  } catch (error) {
    console.error('Get ongoing events error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching ongoing events'
    });
  }
});

// Get event analytics
router.get('/events/:id/analytics', protect, authorize('organizer'), async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).lean();

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Check ownership
    const organizerId = req.user._id.toString();
    const eventOrganizerId = (event.organizerId || event.organizer).toString();
    
    if (eventOrganizerId !== organizerId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    const registrations = await Registration.find({ event: req.params.id })
      .populate('participant', 'firstName lastName name email college participantType')
      .lean();

    // Calculate analytics
    const totalRegistrations = registrations.length;
    const totalRevenue = registrations.reduce((sum, r) => sum + (r.paymentAmount || 0), 0);
    const totalAttendance = registrations.filter(r => r.attended).length;
    const attendanceRate = totalRegistrations > 0 
      ? (totalAttendance / totalRegistrations * 100).toFixed(2)
      : 0;

    // Registrations by date
    const registrationsByDate = {};
    registrations.forEach(reg => {
      const date = new Date(reg.registeredAt).toLocaleDateString();
      registrationsByDate[date] = (registrationsByDate[date] || 0) + 1;
    });

    // College distribution
    const collegeDistribution = {};
    registrations.forEach(reg => {
      const college = reg.participant?.college || 'Unknown';
      collegeDistribution[college] = (collegeDistribution[college] || 0) + 1;
    });

    // Participant type distribution
    const participantTypeDistribution = {
      IIIT: registrations.filter(r => r.participant?.participantType === 'IIIT').length,
      External: registrations.filter(r => r.participant?.participantType === 'External').length
    };

    const analytics = {
      totalRegistrations,
      totalRevenue,
      totalAttendance,
      attendanceRate: parseFloat(attendanceRate),
      registrationsByDate,
      collegeDistribution,
      participantTypeDistribution,
      paymentStats: {
        completed: registrations.filter(r => r.paymentStatus === 'Completed').length,
        pending: registrations.filter(r => r.paymentStatus === 'Pending').length,
        failed: registrations.filter(r => r.paymentStatus === 'Failed').length
      }
    };

    res.json({
      success: true,
      analytics,
      event: {
        name: event.eventName || event.title,
        type: event.eventType,
        status: event.status
      }
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching analytics'
    });
  }
});

// Get participants list for an event (10.3 Event Detail Page - Participants section)
router.get('/events/:id/participants', protect, authorize('organizer'), async (req, res) => {
  try {
    const { search, filter, sortBy } = req.query;
    
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Check ownership
    const organizerId = req.user._id.toString();
    const eventOrganizerId = (event.organizerId || event.organizer).toString();
    
    if (eventOrganizerId !== organizerId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    let query = { event: req.params.id };

    // Filter by status
    if (filter) {
      query.status = filter;
    }

    let registrations = await Registration.find(query)
      .populate('participant', 'firstName lastName name email phone college contactNumber participantType')
      .populate('ticket', 'ticketId isUsed usedAt')
      .lean();

    // Search by name or email
    if (search) {
      const searchLower = search.toLowerCase();
      registrations = registrations.filter(reg => {
        const participant = reg.participant;
        const fullName = `${participant.firstName || ''} ${participant.lastName || ''}`.toLowerCase();
        const name = (participant.name || '').toLowerCase();
        const email = (participant.email || '').toLowerCase();
        
        return fullName.includes(searchLower) || 
               name.includes(searchLower) || 
               email.includes(searchLower);
      });
    }

    // Sort
    if (sortBy === 'date') {
      registrations.sort((a, b) => new Date(b.registeredAt) - new Date(a.registeredAt));
    } else if (sortBy === 'name') {
      registrations.sort((a, b) => {
        const nameA = a.participant.firstName || a.participant.name || '';
        const nameB = b.participant.firstName || b.participant.name || '';
        return nameA.localeCompare(nameB);
      });
    }

    // Format response
    const participants = registrations.map(reg => ({
      id: reg._id,
      name: reg.participant.firstName && reg.participant.lastName 
        ? `${reg.participant.firstName} ${reg.participant.lastName}`
        : reg.participant.name,
      email: reg.participant.email,
      phone: reg.participant.contactNumber || reg.participant.phone,
      college: reg.participant.college,
      participantType: reg.participant.participantType,
      registrationDate: reg.registeredAt,
      paymentStatus: reg.paymentStatus,
      paymentAmount: reg.paymentAmount,
      status: reg.status,
      attended: reg.attended,
      ticketId: reg.ticket?.ticketId,
      ticketUsed: reg.ticket?.isUsed,
      ticketUsedAt: reg.ticket?.usedAt,
      formResponses: reg.formResponses
    }));

    res.json({
      success: true,
      count: participants.length,
      participants
    });
  } catch (error) {
    console.error('Get participants error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching participants'
    });
  }
});

// Export participants as CSV (10.3 Export CSV)
router.get('/events/:id/export', protect, authorize('organizer'), async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Check ownership
    const organizerId = req.user._id.toString();
    const eventOrganizerId = (event.organizerId || event.organizer).toString();
    
    if (eventOrganizerId !== organizerId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    const registrations = await Registration.find({ event: req.params.id })
      .populate('participant', 'firstName lastName name email phone contactNumber college participantType')
      .populate('ticket', 'ticketId isUsed usedAt')
      .lean();

    // Generate CSV
    const csvHeaders = [
      'Name',
      'Email',
      'Phone',
      'College',
      'Participant Type',
      'Registration Date',
      'Payment Status',
      'Payment Amount',
      'Status',
      'Attended',
      'Ticket ID',
      'Ticket Used'
    ];

    const csvRows = registrations.map(reg => {
      const participant = reg.participant;
      return [
        participant.firstName && participant.lastName 
          ? `${participant.firstName} ${participant.lastName}`
          : participant.name || '',
        participant.email || '',
        participant.contactNumber || participant.phone || '',
        participant.college || '',
        participant.participantType || '',
        new Date(reg.registeredAt).toLocaleString(),
        reg.paymentStatus || '',
        reg.paymentAmount || 0,
        reg.status || '',
        reg.attended ? 'Yes' : 'No',
        reg.ticket?.ticketId || '',
        reg.ticket?.isUsed ? 'Yes' : 'No'
      ].map(field => `"${String(field).replace(/"/g, '""')}"`).join(',');
    });

    const csv = [csvHeaders.join(','), ...csvRows].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="participants-${event.title || event.eventName}-${Date.now()}.csv"`);
    res.send(csv);
  } catch (error) {
    console.error('Export CSV error:', error);
    res.status(500).json({
      success: false,
      message: 'Error exporting participants'
    });
  }
});

// Get dashboard stats
router.get('/dashboard-stats', protect, authorize('organizer'), async (req, res) => {
  try {
    const events = await Event.find({ organizer: req.user._id });
    const eventIds = events.map(e => e._id);
    
    const registrations = await Registration.find({ event: { $in: eventIds } });

    const stats = {
      totalEvents: events.length,
      publishedEvents: events.filter(e => e.status === 'Published').length,
      totalRegistrations: registrations.length,
      totalRevenue: registrations.reduce((sum, r) => sum + r.paymentAmount, 0),
      upcomingEvents: events.filter(e => new Date(e.startDate) > new Date()).length
    };

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching stats'
    });
  }
});

// @route   POST /api/organizer/password-reset-request
// @desc    Request password reset from admin
// @access  Organizer
router.post('/password-reset-request', protect, authorize('organizer'), async (req, res) => {
  try {
    const { reason } = req.body;
    
    // Import PasswordResetRequest here to avoid circular dependency
    const PasswordResetRequest = (await import('../models/PasswordResetRequest.js')).default;

    // Check if there's already a pending request
    const existingRequest = await PasswordResetRequest.findOne({
      userId: req.user._id,
      userType: 'organizer',
      status: 'Pending'
    });

    if (existingRequest) {
      return res.status(400).json({ 
        message: 'You already have a pending password reset request' 
      });
    }

    const resetRequest = await PasswordResetRequest.create({
      userType: 'organizer',
      userId: req.user._id,
      email: req.user.email,
      name: req.user.clubName || req.user.name,
      reason: reason || 'Forgot password'
    });

    res.status(201).json({
      message: 'Password reset request submitted successfully. An admin will review it shortly.',
      request: resetRequest
    });
  } catch (error) {
    console.error('Error creating password reset request:', error);
    res.status(500).json({ message: 'Error submitting password reset request' });
  }
});

export default router;

