import express from 'express';
import Event from '../models/Event.js';
import Registration from '../models/Registration.js';
import Ticket from '../models/Ticket.js';
import Organizer from '../models/Organizer.js';
import { protect, authorize } from '../middleware/auth.js';
import { generateTicketId, generateQRCode } from '../utils/qr.js';
import { sendTicketEmail } from '../utils/email.js';
import { postEventToDiscord } from '../utils/discord.js';

const router = express.Router();

// Get all published events (with filters and search)
router.get('/', async (req, res) => {
  try {
    const {
      search,
      type,
      eligibility,
      startDate,
      endDate,
      organizer,
      trending
    } = req.query;

    let query = { status: 'Published' };

    // Search by title or description
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Filter by event type
    if (type) {
      query.eventType = type;
    }

    // Filter by eligibility
    if (eligibility) {
      query.eligibility = eligibility;
    }

    // Filter by date range
    if (startDate || endDate) {
      query.startDate = {};
      if (startDate) query.startDate.$gte = new Date(startDate);
      if (endDate) query.startDate.$lte = new Date(endDate);
    }

    // Filter by organizer
    if (organizer) {
      query.organizer = organizer;
    }

    let events;

    if (trending === 'true') {
      // Get trending events (top 5 by views in last 24h)
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      events = await Event.find({
        ...query,
        createdAt: { $gte: oneDayAgo }
      })
        .sort({ viewCount: -1 })
        .limit(5)
        .populate('organizer', 'clubName email')
        .lean();
    } else {
      events = await Event.find(query)
        .sort({ createdAt: -1 })
        .populate('organizer', 'clubName email')
        .lean();
    }

    res.json({
      success: true,
      count: events.length,
      events
    });
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching events'
    });
  }
});

// Get single event details
router.get('/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('organizer', 'clubName email phone description')
      .lean();

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Increment view count
    await Event.findByIdAndUpdate(req.params.id, { $inc: { viewCount: 1 } });

    res.json({
      success: true,
      event
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching event'
    });
  }
});

// Create event (Organizer only)
router.post('/', protect, authorize('organizer'), async (req, res) => {
  try {
    const eventData = {
      ...req.body,
      organizer: req.user._id,
      organizerId: req.user._id, // Set both for compatibility
      status: 'Draft'
    };

    // Ensure venue has a default value
    if (!eventData.venue) {
      eventData.venue = 'TBD';
    }

    const event = await Event.create(eventData);

    res.status(201).json({
      success: true,
      message: 'Event created as draft',
      event
    });
  } catch (error) {
    console.error('Create event error:', error);
    
    // Send detailed validation error
    if (error.name === 'ValidationError') {
      const errors = Object.keys(error.errors).map(key => error.errors[key].message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors
      });
    }
    
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating event'
    });
  }
});

// Update event (Organizer only) - 10.4 Editing Rules
router.put('/:id', protect, authorize('organizer'), async (req, res) => {
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
        message: 'Not authorized to update this event'
      });
    }

    // Apply editing rules based on status (10.4)
    if (event.status === 'Draft') {
      // Draft: Free edits, can be published
      Object.assign(event, req.body);
      
    } else if (event.status === 'Published') {
      // Published: Limited edits
      const allowedFields = [
        'description', 'eventDescription',
        'venue',
        'registrationDeadline',
        'maxParticipants', 'registrationLimit',
        'imageUrl'
      ];
      
      const updates = {};
      Object.keys(req.body).forEach(key => {
        if (allowedFields.includes(key)) {
          // For deadline, only allow extension
          if (key === 'registrationDeadline' && new Date(req.body[key]) < new Date(event.registrationDeadline)) {
            return; // Skip - cannot shorten deadline
          }
          // For limit, only allow increase
          if ((key === 'maxParticipants' || key === 'registrationLimit') && 
              req.body[key] < (event.maxParticipants || event.registrationLimit)) {
            return; // Skip - cannot decrease limit
          }
          updates[key] = req.body[key];
        }
      });

      Object.assign(event, updates);
      
    } else if (event.status === 'Ongoing' || event.status === 'Completed') {
      // Ongoing/Completed: No edits except status change
      if (req.body.status && ['Completed', 'Cancelled'].includes(req.body.status)) {
        event.status = req.body.status;
      } else {
        return res.status(400).json({
          success: false,
          message: 'Cannot edit ongoing or completed events except to mark as completed/cancelled'
        });
      }
    }

    await event.save();

    res.json({
      success: true,
      message: 'Event updated successfully',
      event,
      editingRules: {
        status: event.status,
        allowedActions: event.status === 'Draft' 
          ? ['full_edit', 'publish']
          : event.status === 'Published'
          ? ['description_update', 'extend_deadline', 'increase_limit', 'close_registrations']
          : ['mark_completed', 'mark_cancelled']
      }
    });
  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating event'
    });
  }
});

// Update custom form (10.4 Form Builder)
router.put('/:id/form', protect, authorize('organizer'), async (req, res) => {
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

    // Check if form is locked (after first registration)
    const hasRegistrations = event.currentParticipants > 0;
    const isLocked = event.customForm?.isLocked || 
                     event.customRegistrationForm?.isLocked || 
                     hasRegistrations;
    
    if (isLocked) {
      return res.status(400).json({
        success: false,
        message: 'Form is locked after the first registration. Cannot modify fields.'
      });
    }

    // Validate fields
    const { fields } = req.body;
    if (!Array.isArray(fields)) {
      return res.status(400).json({
        success: false,
        message: 'Fields must be an array'
      });
    }

    // Validate each field
    const validFieldTypes = ['text', 'dropdown', 'checkbox', 'file', 'textarea', 'number', 'email'];
    for (const field of fields) {
      if (!field.fieldId || !field.fieldType || !field.label) {
        return res.status(400).json({
          success: false,
          message: 'Each field must have fieldId, fieldType, and label'
        });
      }
      if (!validFieldTypes.includes(field.fieldType)) {
        return res.status(400).json({
          success: false,
          message: `Invalid field type: ${field.fieldType}`
        });
      }
      if (field.fieldType === 'dropdown' && (!field.options || field.options.length === 0)) {
        return res.status(400).json({
          success: false,
          message: 'Dropdown fields must have options'
        });
      }
    }

    // Update both form fields for compatibility
    event.customForm = event.customForm || {};
    event.customForm.fields = fields;
    event.customForm.isLocked = false;

    event.customRegistrationForm = event.customRegistrationForm || {};
    event.customRegistrationForm.fields = fields;
    event.customRegistrationForm.isLocked = false;

    await event.save();

    res.json({
      success: true,
      message: 'Custom registration form updated successfully',
      customForm: event.customRegistrationForm || event.customForm,
      formBuilder: {
        supportedFieldTypes: validFieldTypes,
        capabilities: [
          'Add/remove fields',
          'Mark fields as required/optional',
          'Reorder fields with order property',
          'Various field types (text, dropdown, checkbox, file, etc.)',
          'Form locked after first registration'
        ]
      }
    });
  } catch (error) {
    console.error('Update form error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating form'
    });
  }
});

// Publish event
router.patch('/:id/publish', protect, authorize('organizer'), async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    if (event.organizer.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    if (event.status !== 'Draft') {
      return res.status(400).json({
        success: false,
        message: 'Only draft events can be published'
      });
    }

    event.status = 'Published';
    await event.save();

    // Post to Discord if webhook is configured
    try {
      const organizer = await Organizer.findById(req.user._id);
      if (organizer && organizer.discordWebhook) {
        await postEventToDiscord(organizer.discordWebhook, event, organizer);
      }
    } catch (discordError) {
      console.error('Discord webhook error:', discordError);
      // Don't fail the entire request if Discord posting fails
    }

    res.json({
      success: true,
      message: 'Event published successfully',
      event
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error publishing event'
    });
  }
});

// Register for event (Participant only)
router.post('/:id/register', protect, authorize('participant'), async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).populate('organizer');

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

    if (new Date() > event.registrationDeadline) {
      return res.status(400).json({
        success: false,
        message: 'Registration deadline has passed'
      });
    }

    if (event.maxParticipants && event.currentParticipants >= event.maxParticipants) {
      return res.status(400).json({
        success: false,
        message: 'Event is full'
      });
    }

    if (event.eventType === 'Merchandise' && event.stock !== null && event.stock <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Out of stock'
      });
    }

    // Check eligibility
    if (event.eligibility === 'IIIT Only' && req.user.participantType !== 'IIIT') {
      return res.status(403).json({
        success: false,
        message: 'This event is only for IIIT students'
      });
    }

    // Check if already registered
    const existingRegistration = await Registration.findOne({
      participant: req.user._id,
      event: event._id
    });

    if (existingRegistration) {
      return res.status(400).json({
        success: false,
        message: 'Already registered for this event'
      });
    }

    // Generate ticket ID first
    const ticketId = generateTicketId();
    
    // Create registration with ticketId
    const registration = await Registration.create({
      participant: req.user._id,
      event: event._id,
      ticketId,
      formResponses: req.body.formResponses || {},
      paymentAmount: event.price || 0
    });

    // Generate QR code
    const qrCode = await generateQRCode({
      ticketId,
      eventId: event._id,
      participantId: req.user._id,
      registrationId: registration._id
    });

    const ticket = await Ticket.create({
      ticketId,
      registration: registration._id,
      participant: req.user._id,
      event: event._id,
      qrCode
    });

    // Update registration with ticket
    registration.ticket = ticket._id;
    await registration.save();

    // Update event counters
    event.currentParticipants += 1;
    if (event.eventType === 'Merchandise' && event.stock !== null) {
      event.stock -= 1;
    }
    
    // Lock form after first registration
    if (!event.customForm.isLocked && event.currentParticipants === 1) {
      event.customForm.isLocked = true;
    }
    
    await event.save();

    // Send ticket email
    await sendTicketEmail(req.user.email, {
      ticketId,
      eventTitle: event.title,
      qrCode,
      participantName: `${req.user.firstName} ${req.user.lastName}`
    });

    res.status(201).json({
      success: true,
      message: 'Registration successful! Ticket sent to your email.',
      registration,
      ticket: {
        ticketId: ticket.ticketId,
        qrCode: ticket.qrCode
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Error during registration'
    });
  }
});

// Delete event (Organizer only)
router.delete('/:id', protect, authorize('organizer'), async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    if (event.organizer.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    if (event.currentParticipants > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete event with registrations'
      });
    }

    await event.deleteOne();

    res.json({
      success: true,
      message: 'Event deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting event'
    });
  }
});

export default router;
