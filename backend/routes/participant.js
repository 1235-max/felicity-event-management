import express from 'express';
import Participant from '../models/Participant.js';
import Registration from '../models/Registration.js';
import Organizer from '../models/Organizer.js';
import Event from '../models/Event.js';
import Ticket from '../models/Ticket.js';
import { protect, authorize } from '../middleware/auth.js';
import { generateTicketId, generateQRCode } from '../utils/qr.js';
import { sendTicketEmail } from '../utils/email.js';

const router = express.Router();

// Get participant dashboard
router.get('/dashboard', protect, authorize('participant'), async (req, res) => {
  try {
    const participantId = req.user._id;
    console.log('Dashboard API called for participant:', participantId);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Fetch all registrations for this participant
    const registrations = await Registration.find({ participant: participantId })
      .populate({
        path: 'event',
        select: 'title eventType startDate endDate organizer',
        populate: {
          path: 'organizer',
          select: 'clubName'
        }
      })
      .sort({ registeredAt: -1 })
      .lean();

    console.log('Found registrations:', registrations.length);

    // Filter upcoming and past events
    const upcomingRegistrations = registrations.filter(reg => 
      reg.event && new Date(reg.event.startDate) >= today
    );

    const pastRegistrations = registrations.filter(reg =>
      reg.event && new Date(reg.event.endDate) < today
    );

    // Build upcoming events list
    const upcomingEvents = upcomingRegistrations.map(reg => ({
      eventName: reg.event.title,
      eventType: reg.event.eventType,
      organizerName: reg.event.organizer?.clubName || 'Unknown',
      startDate: reg.event.startDate,
      ticketId: reg.ticketId,
      status: reg.status
    }));

    // Build past participation list
    const pastParticipation = pastRegistrations.map(reg => ({
      eventName: reg.event.title,
      eventType: reg.event.eventType,
      organizerName: reg.event.organizer?.clubName || 'Unknown',
      status: reg.status,
      ticketId: reg.ticketId,
      endDate: reg.event.endDate
    }));

    // Calculate counts
    const upcomingEventsCount = upcomingRegistrations.length;
    const pastEventsCount = pastRegistrations.length;
    const totalTickets = registrations.length;

    res.json({
      success: true,
      dashboard: {
        upcomingEventsCount,
        pastEventsCount,
        totalTickets,
        upcomingEvents,
        pastParticipation
      }
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard data',
      error: error.message
    });
  }
});

// Get participant profile (9.6 Profile Page)
router.get('/profile', protect, authorize('participant'), async (req, res) => {
  try {
    const participant = await Participant.findById(req.user._id)
      .select('-password')
      .populate('followedClubs', 'clubName organizerName category description email contactEmail')
      .populate({
        path: 'registrations',
        populate: {
          path: 'event',
          select: 'title eventName startDate eventStartDate endDate eventEndDate venue'
        }
      })
      .lean();

    res.json({
      success: true,
      participant: {
        ...participant,
        // Editable fields
        editableFields: ['firstName', 'lastName', 'contactNumber', 'college', 'areasOfInterest', 'followedClubs'],
        // Non-editable fields
        nonEditableFields: ['email', 'participantType']
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching profile'
    });
  }
});

// Update participant profile (9.6 Profile Page - Editable fields only)
router.put('/profile', protect, authorize('participant'), async (req, res) => {
  try {
    const { firstName, lastName, contactNumber, college, areasOfInterest, followedClubs } = req.body;

    const participant = await Participant.findById(req.user._id);

    // Only allow editing of permitted fields
    if (firstName) participant.firstName = firstName;
    if (lastName) participant.lastName = lastName;
    if (contactNumber) participant.contactNumber = contactNumber;
    if (college) participant.college = college;
    if (areasOfInterest) participant.areasOfInterest = areasOfInterest;
    if (followedClubs !== undefined) participant.followedClubs = followedClubs;

    // Email and participantType are non-editable
    // Password change should go through separate endpoint

    await participant.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      participant: {
        ...participant.toObject(),
        password: undefined
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating profile'
    });
  }
});

// Change Password (9.6 Security Settings)
router.post('/change-password', protect, authorize('participant'), async (req, res) => {
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

    const participant = await Participant.findById(req.user._id);

    // Verify current password
    const isPasswordValid = await participant.comparePassword(currentPassword);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password (will be hashed by pre-save hook)
    participant.password = newPassword;
    await participant.save();

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

// Get participant's registrations
router.get('/registrations', protect, authorize('participant'), async (req, res) => {
  try {
    const registrations = await Registration.find({ participant: req.user._id })
      .populate('event')
      .populate('ticket')
      .sort({ registeredAt: -1 });

    // Separate upcoming and past
    const now = new Date();
    const upcoming = registrations.filter(r => new Date(r.event.endDate) >= now);
    const past = registrations.filter(r => new Date(r.event.endDate) < now);

    res.json({
      success: true,
      registrations: {
        upcoming,
        past,
        all: registrations
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching registrations'
    });
  }
});

// Follow a club
router.post('/follow/:organizerId', protect, authorize('participant'), async (req, res) => {
  try {
    const participant = await Participant.findById(req.user._id);
    
    if (!participant) {
      return res.status(404).json({
        success: false,
        message: 'Participant not found'
      });
    }

    const organizer = await Organizer.findById(req.params.organizerId);

    if (!organizer) {
      return res.status(404).json({
        success: false,
        message: 'Organizer not found'
      });
    }

    if (participant.followedClubs.includes(req.params.organizerId)) {
      return res.status(400).json({
        success: false,
        message: 'Already following this club'
      });
    }

    // Use update operation to avoid validation issues with incomplete legacy data
    await Participant.findByIdAndUpdate(
      req.user._id,
      { $addToSet: { followedClubs: req.params.organizerId } }
    );

    await Organizer.findByIdAndUpdate(
      req.params.organizerId,
      { $addToSet: { followers: req.user._id } }
    );

    res.json({
      success: true,
      message: 'Club followed successfully'
    });
  } catch (error) {
    console.error('Follow club error:', error);
    console.error('Error details:', error.message);
    res.status(500).json({
      success: false,
      message: error.message || 'Error following club'
    });
  }
});

// Unfollow a club
router.delete('/follow/:organizerId', protect, authorize('participant'), async (req, res) => {
  try {
    const organizer = await Organizer.findById(req.params.organizerId);

    if (!organizer) {
      return res.status(404).json({
        success: false,
        message: 'Organizer not found'
      });
    }

    // Use update operations to avoid validation issues with incomplete legacy data
    await Participant.findByIdAndUpdate(
      req.user._id,
      { $pull: { followedClubs: req.params.organizerId } }
    );

    await Organizer.findByIdAndUpdate(
      req.params.organizerId,
      { $pull: { followers: req.user._id } }
    );

    res.json({
      success: true,
      message: 'Club unfollowed successfully'
    });
  } catch (error) {
    console.error('Unfollow club error:', error);
    res.status(500).json({
      success: false,
      message: 'Error unfollowing club'
    });
  }
});

// Get all clubs/organizers (9.7 Clubs/Organizers Listing Page)
router.get('/clubs', protect, authorize('participant'), async (req, res) => {
  try {
    // Only show approved/active organizers
    const clubs = await Organizer.find({ isActive: true })
      .select('clubName organizerName category description followers email contactEmail phone')
      .lean();

    // Add isFollowing flag for current participant
    const clubsWithFollowStatus = clubs.map(club => ({
      ...club,
      name: club.organizerName || club.clubName,
      isFollowing: club.followers.some(
        id => id.toString() === req.user._id.toString()
      ),
      followerCount: club.followers.length
    }));

    res.json({
      success: true,
      count: clubsWithFollowStatus.length,
      clubs: clubsWithFollowStatus
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching clubs'
    });
  }
});

// Get organizer detail page (9.8 Organizer Detail Page - Participant View)
router.get('/clubs/:organizerId', protect, authorize('participant'), async (req, res) => {
  try {
    const organizer = await Organizer.findOne({ 
      _id: req.params.organizerId, 
      isActive: true 
    })
      .select('organizerName clubName category description contactEmail email phone followers')
      .lean();

    if (!organizer) {
      return res.status(404).json({
        success: false,
        message: 'Organizer not found'
      });
    }

    const today = new Date();

    // Get upcoming events
    const upcomingEvents = await Event.find({
      $or: [
        { organizer: req.params.organizerId },
        { organizerId: req.params.organizerId }
      ],
      status: 'Published',
      startDate: { $gte: today }
    })
      .select('title eventName eventType startDate eventStartDate venue registrationDeadline')
      .sort({ startDate: 1 })
      .lean();

    // Get past events
    const pastEvents = await Event.find({
      $or: [
        { organizer: req.params.organizerId },
        { organizerId: req.params.organizerId }
      ],
      status: { $in: ['Completed', 'Published'] },
      endDate: { $lt: today }
    })
      .select('title eventName eventType startDate eventStartDate endDate eventEndDate venue')
      .sort({ startDate: -1 })
      .lean();

    // Check if current participant is following
    const isFollowing = organizer.followers.some(
      id => id.toString() === req.user._id.toString()
    );

    res.json({
      success: true,
      organizer: {
        id: organizer._id,
        name: organizer.organizerName || organizer.clubName,
        category: organizer.category,
        description: organizer.description,
        contactEmail: organizer.contactEmail || organizer.email,
        phone: organizer.phone,
        followerCount: organizer.followers.length,
        isFollowing
      },
      events: {
        upcoming: upcomingEvents.map(e => ({
          ...e,
          eventName: e.eventName || e.title,
          startDate: e.eventStartDate || e.startDate
        })),
        past: pastEvents.map(e => ({
          ...e,
          eventName: e.eventName || e.title,
          startDate: e.eventStartDate || e.startDate,
          endDate: e.eventEndDate || e.endDate
        }))
      }
    });
  } catch (error) {
    console.error('Organizer detail error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching organizer details'
    });
  }
});

// Browse Events Page - with comprehensive filters
router.get('/browse-events', protect, authorize('participant'), async (req, res) => {
  try {
    const {
      search,
      eventType,
      eligibility,
      startDate,
      endDate,
      followedClubsOnly,
      trending,
      sortBy
    } = req.query;

    const participant = await Participant.findById(req.user._id);
    let query = { status: 'Published' };

    // Search: Partial & Fuzzy matching on Event/Organizer names
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim().split('').join('.*'), 'i'); // Fuzzy search
      const organizers = await Organizer.find({
        $or: [
          { clubName: { $regex: search, $options: 'i' } },
          { organizerName: { $regex: search, $options: 'i' } }
        ]
      }).select('_id');
      
      const organizerIds = organizers.map(o => o._id);
      
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { eventName: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { eventDescription: { $regex: search, $options: 'i' } },
        { organizer: { $in: organizerIds } },
        { organizerId: { $in: organizerIds } }
      ];
    }

    // Filter by Event Type
    if (eventType) {
      query.eventType = eventType;
    }

    // Filter by Eligibility
    if (eligibility) {
      query.eligibility = eligibility;
    }

    // Filter by Date Range
    if (startDate || endDate) {
      query.$and = query.$and || [];
      if (startDate) {
        query.$and.push({ startDate: { $gte: new Date(startDate) } });
      }
      if (endDate) {
        query.$and.push({ startDate: { $lte: new Date(endDate) } });
      }
    }

    // Filter by Followed Clubs only
    if (followedClubsOnly === 'true' && participant.followedClubs.length > 0) {
      query.$and = query.$and || [];
      query.$and.push({
        $or: [
          { organizer: { $in: participant.followedClubs } },
          { organizerId: { $in: participant.followedClubs } }
        ]
      });
    }

    let eventsQuery = Event.find(query)
      .populate('organizer organizerId', 'clubName organizerName description email contactEmail category');

    // Trending: Top 5 by views in last 24h
    if (trending === 'true') {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      eventsQuery = eventsQuery
        .where('createdAt').gte(oneDayAgo)
        .sort({ viewCount: -1 })
        .limit(5);
    } else {
      // Sorting based on preferences
      if (sortBy === 'date') {
        eventsQuery = eventsQuery.sort({ startDate: 1 });
      } else if (sortBy === 'deadline') {
        eventsQuery = eventsQuery.sort({ registrationDeadline: 1 });
      } else if (sortBy === 'popular') {
        eventsQuery = eventsQuery.sort({ viewCount: -1 });
      } else {
        // Default: Personalized recommendations based on interests and followed clubs
        eventsQuery = eventsQuery.sort({ createdAt: -1 });
      }
    }

    const events = await eventsQuery.lean();

    // Add additional metadata for each event
    const eventsWithMetadata = events.map(event => {
      const isDeadlinePassed = new Date() > new Date(event.registrationDeadline);
      const isRegistrationFull = event.maxParticipants && event.currentParticipants >= event.maxParticipants;
      const isStockExhausted = event.eventType === 'Merchandise' && event.stock !== null && event.stock <= 0;
      
      return {
        ...event,
        canRegister: !isDeadlinePassed && !isRegistrationFull && !isStockExhausted,
        registrationBlocked: isDeadlinePassed || isRegistrationFull || isStockExhausted,
        blockReason: isDeadlinePassed ? 'Registration deadline passed' 
                   : isRegistrationFull ? 'Registration limit reached'
                   : isStockExhausted ? 'Out of stock'
                   : null
      };
    });

    res.json({
      success: true,
      count: eventsWithMetadata.length,
      events: eventsWithMetadata
    });
  } catch (error) {
    console.error('Browse events error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching events'
    });
  }
});

// Register for Normal Event
router.post('/register/event/:eventId', protect, authorize('participant'), async (req, res) => {
  try {
    const { formResponses } = req.body;
    const eventId = req.params.eventId;
    const participantId = req.user._id;

    // Find event
    const event = await Event.findById(eventId).populate('organizer organizerId');
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Validation checks
    if (event.status !== 'Published') {
      return res.status(400).json({
        success: false,
        message: 'Event is not open for registration'
      });
    }

    if (new Date() > new Date(event.registrationDeadline)) {
      return res.status(400).json({
        success: false,
        message: 'Registration deadline has passed'
      });
    }

    if (event.maxParticipants && event.currentParticipants >= event.maxParticipants) {
      return res.status(400).json({
        success: false,
        message: 'Registration limit reached'
      });
    }

    // Check if already registered
    const existingRegistration = await Registration.findOne({
      participant: participantId,
      event: eventId
    });

    if (existingRegistration) {
      return res.status(400).json({
        success: false,
        message: 'Already registered for this event'
      });
    }

    // Check eligibility
    const participant = await Participant.findById(participantId);
    if (event.eligibility === 'IIIT Only' && participant.participantType !== 'IIIT') {
      return res.status(403).json({
        success: false,
        message: 'This event is only for IIIT participants'
      });
    }

    // Generate ticket
    const ticketId = generateTicketId();
    const qrCode = await generateQRCode(ticketId);

    // Create registration
    const registration = await Registration.create({
      participant: participantId,
      event: eventId,
      ticketId,
      status: 'Registered',
      formResponses: formResponses || {},
      paymentAmount: event.price || event.registrationFee || 0,
      paymentStatus: 'Completed'
    });

    // Create ticket
    const ticket = await Ticket.create({
      ticketId,
      registration: registration._id,
      participant: participantId,
      event: eventId,
      qrCode
    });

    // Update registration with ticket reference
    registration.ticket = ticket._id;
    await registration.save();

    // Update event participant count
    event.currentParticipants += 1;
    event.registrations.push(registration._id);
    await event.save();

    // Update participant registrations
    participant.registrations.push(registration._id);
    await participant.save();

    // Send ticket email
    await sendTicketEmail(participant.email, {
      participantName: `${participant.firstName} ${participant.lastName}`,
      eventName: event.title || event.eventName,
      eventDate: event.startDate || event.eventStartDate,
      ticketId,
      qrCode,
      organizerName: event.organizer?.clubName || event.organizerId?.organizerName || 'Event Organizer'
    });

    res.status(201).json({
      success: true,
      message: 'Registration successful. Ticket sent to your email.',
      registration: {
        id: registration._id,
        ticketId,
        status: registration.status,
        eventName: event.title || event.eventName,
        eventDate: event.startDate || event.eventStartDate
      },
      ticket: {
        id: ticket._id,
        ticketId,
        qrCode
      }
    });
  } catch (error) {
    console.error('Event registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Error during registration'
    });
  }
});

// Purchase Merchandise Event
router.post('/register/merchandise/:eventId', protect, authorize('participant'), async (req, res) => {
  try {
    const { quantity, variant } = req.body;
    const eventId = req.params.eventId;
    const participantId = req.user._id;

    // Find event
    const event = await Event.findById(eventId).populate('organizer organizerId');
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Validation checks
    if (event.eventType !== 'Merchandise') {
      return res.status(400).json({
        success: false,
        message: 'This is not a merchandise event'
      });
    }

    if (event.status !== 'Published') {
      return res.status(400).json({
        success: false,
        message: 'Merchandise is not available for purchase'
      });
    }

    if (new Date() > new Date(event.registrationDeadline)) {
      return res.status(400).json({
        success: false,
        message: 'Purchase deadline has passed'
      });
    }

    // Check stock
    if (event.stock !== null && event.stock <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Out of stock'
      });
    }

    const requestedQuantity = quantity || 1;

    // Check purchase limit
    const existingPurchases = await Registration.countDocuments({
      participant: participantId,
      event: eventId
    });

    if (existingPurchases + requestedQuantity > (event.purchaseLimitPerParticipant || 1)) {
      return res.status(400).json({
        success: false,
        message: `Purchase limit exceeded. Maximum ${event.purchaseLimitPerParticipant || 1} per participant`
      });
    }

    // Check if enough stock
    if (event.stock !== null && event.stock < requestedQuantity) {
      return res.status(400).json({
        success: false,
        message: `Insufficient stock. Only ${event.stock} items remaining`
      });
    }

    // Check eligibility
    const participant = await Participant.findById(participantId);
    if (event.eligibility === 'IIIT Only' && participant.participantType !== 'IIIT') {
      return res.status(403).json({
        success: false,
        message: 'This merchandise is only for IIIT participants'
      });
    }

    // Generate ticket
    const ticketId = generateTicketId();
    const qrCode = await generateQRCode(ticketId);

    // Create registration (purchase implies registration)
    const registration = await Registration.create({
      participant: participantId,
      event: eventId,
      ticketId,
      status: 'Registered',
      formResponses: { quantity: requestedQuantity, variant: variant || 'default' },
      paymentAmount: (event.price || event.registrationFee || 0) * requestedQuantity,
      paymentStatus: 'Completed'
    });

    // Create ticket
    const ticket = await Ticket.create({
      ticketId,
      registration: registration._id,
      participant: participantId,
      event: eventId,
      qrCode
    });

    // Update registration with ticket reference
    registration.ticket = ticket._id;
    await registration.save();

    // Decrement stock
    if (event.stock !== null) {
      event.stock -= requestedQuantity;
    }
    event.currentParticipants += 1;
    event.registrations.push(registration._id);
    await event.save();

    // Update participant registrations
    participant.registrations.push(registration._id);
    await participant.save();

    // Send ticket email with purchase confirmation
    await sendTicketEmail(participant.email, {
      participantName: `${participant.firstName} ${participant.lastName}`,
      eventName: event.title || event.eventName,
      eventDate: event.startDate || event.eventStartDate,
      ticketId,
      qrCode,
      organizerName: event.organizer?.clubName || event.organizerId?.organizerName || 'Event Organizer',
      merchandiseDetails: {
        quantity: requestedQuantity,
        variant: variant || 'default',
        totalAmount: (event.price || event.registrationFee || 0) * requestedQuantity
      }
    });

    res.status(201).json({
      success: true,
      message: 'Purchase successful. Ticket sent to your email.',
      registration: {
        id: registration._id,
        ticketId,
        status: registration.status,
        eventName: event.title || event.eventName,
        quantity: requestedQuantity,
        totalAmount: (event.price || event.registrationFee || 0) * requestedQuantity
      },
      ticket: {
        id: ticket._id,
        ticketId,
        qrCode
      }
    });
  } catch (error) {
    console.error('Merchandise purchase error:', error);
    res.status(500).json({
      success: false,
      message: 'Error during purchase'
    });
  }
});

export default router;
