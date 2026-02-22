import express from 'express';
import Organizer from '../models/Organizer.js';
import Admin from '../models/Admin.js';
import PasswordResetRequest from '../models/PasswordResetRequest.js';
import { protect, authorize } from '../middleware/auth.js';
import { sendOrganizerCredentials } from '../utils/email.js';
import crypto from 'crypto';
import Participant from '../models/Participant.js';

const router = express.Router();

// Admin Dashboard (11.2)
router.get('/dashboard', protect, authorize('admin'), async (req, res) => {
  try {
    const Event = (await import('../models/Event.js')).default;
    const Registration = (await import('../models/Registration.js')).default;

    const [totalParticipants, totalOrganizers, activeOrganizers, totalEvents, totalRegistrations] = await Promise.all([
      Participant.countDocuments(),
      Organizer.countDocuments(),
      Organizer.countDocuments({ isActive: true }),
      Event.countDocuments(),
      Registration.countDocuments()
    ]);

    // Get recent organizers
    const recentOrganizers = await Organizer.find()
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    // Get pending password reset requests
    const passwordResetRequests = await PasswordResetRequest.find({ status: 'Pending' })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    res.json({
      success: true,
      dashboard: {
        stats: {
          totalParticipants,
          totalOrganizers,
          activeOrganizers,
          inactiveOrganizers: totalOrganizers - activeOrganizers,
          totalEvents,
          totalRegistrations
        },
        recentOrganizers,
        passwordResetRequests
      }
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard data'
    });
  }
});

// Get all organizers
router.get('/organizers', protect, authorize('admin'), async (req, res) => {
  try {
    const organizers = await Organizer.find()
      .select('-password')
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      organizers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching organizers'
    });
  }
});

// Create new organizer
router.post('/organizers', protect, authorize('admin'), async (req, res) => {
  try {
    const { email, organizerName, category, description, contactPerson, phone } = req.body;

    // Validate required fields as per specification
    if (!email || !organizerName || !category) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: email, organizerName, category'
      });
    }

    // Check if organizer already exists
    const existingOrganizer = await Organizer.findOne({ 
      $or: [{ email }, { contactEmail: email }]
    });
    if (existingOrganizer) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered'
      });
    }

    // Generate random password
    const tempPassword = crypto.randomBytes(8).toString('hex');

    // Create organizer with new schema fields
    const organizer = await Organizer.create({
      organizerName,
      category,
      description: description || '',
      contactEmail: email,
      email: email,
      password: tempPassword,
      clubName: organizerName, // For backward compatibility
      contactPerson: contactPerson || '',
      phone: phone || '',
      createdBy: req.user._id,
      isActive: true
    });

    // Send credentials via email
    await sendOrganizerCredentials(email, {
      organizerName,
      clubName: organizerName,
      email,
      password: tempPassword
    });

    res.status(201).json({
      success: true,
      message: 'Organizer created successfully. Credentials sent via email.',
      organizer: {
        id: organizer._id,
        email: organizer.contactEmail,
        organizerName: organizer.organizerName,
        category: organizer.category,
        tempPassword // Return for admin's reference only
      }
    });
  } catch (error) {
    console.error('Create organizer error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating organizer',
      error: error.message
    });
  }
});

// Toggle organizer active status
router.patch('/organizers/:id/toggle-active', protect, authorize('admin'), async (req, res) => {
  try {
    const organizer = await Organizer.findById(req.params.id);

    if (!organizer) {
      return res.status(404).json({
        success: false,
        message: 'Organizer not found'
      });
    }

    organizer.isActive = !organizer.isActive;
    await organizer.save();

    res.json({
      success: true,
      message: `Organizer ${organizer.isActive ? 'activated' : 'deactivated'} successfully`,
      organizer: {
        id: organizer._id,
        isActive: organizer.isActive
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating organizer status'
    });
  }
});

// Delete organizer
router.delete('/organizers/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const organizer = await Organizer.findById(req.params.id);

    if (!organizer) {
      return res.status(404).json({
        success: false,
        message: 'Organizer not found'
      });
    }

    // Check if organizer has events
    const Event = (await import('../models/Event.js')).default;
    const eventCount = await Event.countDocuments({ organizer: req.params.id });

    if (eventCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete organizer with existing events'
      });
    }

    await organizer.deleteOne();

    res.json({
      success: true,
      message: 'Organizer deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting organizer'
    });
  }
});

// Reset organizer password (Admin only)
router.patch('/organizers/:id/reset-password', protect, authorize('admin'), async (req, res) => {
  try {
    const { newPassword } = req.body;
    
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    const organizer = await Organizer.findById(req.params.id);

    if (!organizer) {
      return res.status(404).json({
        success: false,
        message: 'Organizer not found'
      });
    }

    // Update password (will be hashed by pre-save hook)
    organizer.password = newPassword;
    await organizer.save();

    // Send new credentials via email - use contactEmail (primary) or fallback to email
    const emailToUse = organizer.contactEmail || organizer.email;
    await sendOrganizerCredentials(emailToUse, {
      organizerName: organizer.organizerName || organizer.clubName,
      clubName: organizer.clubName || organizer.organizerName,
      email: emailToUse,
      password: newPassword,
      isPasswordReset: true
    });

    res.json({
      success: true,
      message: 'Password reset successfully. New credentials sent via email.',
      tempPassword: newPassword // Return for admin's reference only
    });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({
      success: false,
      message: 'Error resetting password'
    });
  }
});

// Get admin dashboard stats
router.get('/dashboard-stats', protect, authorize('admin'), async (req, res) => {
  try {
    const Participant = (await import('../models/Participant.js')).default;
    const Event = (await import('../models/Event.js')).default;
    const Registration = (await import('../models/Registration.js')).default;

    const [
      totalParticipants,
      totalOrganizers,
      totalEvents,
      totalRegistrations,
      activeOrganizers
    ] = await Promise.all([
      Participant.countDocuments(),
      Organizer.countDocuments(),
      Event.countDocuments(),
      Registration.countDocuments(),
      Organizer.countDocuments({ isActive: true })
    ]);

    res.json({
      success: true,
      stats: {
        totalParticipants,
        totalOrganizers,
        activeOrganizers,
        totalEvents,
        totalRegistrations
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching stats'
    });
  }
});

// Publish draft event
router.patch('/events/:id/publish', protect, authorize('admin'), async (req, res) => {
  try {
    const Event = (await import('../models/Event.js')).default;
    
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }
    
    if (event.status === 'Published') {
      return res.status(400).json({
        success: false,
        message: 'Event is already published'
      });
    }
    
    event.status = 'Published';
    await event.save();
    
    res.json({
      success: true,
      message: 'Event published successfully',
      event: {
        id: event._id,
        status: event.status,
        title: event.title || event.eventName
      }
    });
  } catch (error) {
    console.error('Publish event error:', error);
    res.status(500).json({
      success: false,
      message: 'Error publishing event'
    });
  }
});

// Remove organizer (Admin only - removes completely)
router.delete('/organizers/:id/remove', protect, authorize('admin'), async (req, res) => {
  try {
    const organizer = await Organizer.findById(req.params.id);

    if (!organizer) {
      return res.status(404).json({
        success: false,
        message: 'Organizer not found'
      });
    }

    // Check if organizer has events
    const Event = (await import('../models/Event.js')).default;
    const eventCount = await Event.countDocuments({ 
      $or: [
        { organizer: req.params.id },
        { organizerId: req.params.id }
      ]
    });

    if (eventCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot remove organizer with existing events. This organizer has ${eventCount} event(s). Please delete or reassign the events first.`
      });
    }

    const organizerName = organizer.organizerName || organizer.clubName;
    await organizer.deleteOne();

    res.json({
      success: true,
      message: `Organizer "${organizerName}" removed successfully`
    });
  } catch (error) {
    console.error('Remove organizer error:', error);
    res.status(500).json({
      success: false,
      message: 'Error removing organizer',
      error: error.message
    });
  }
});

// Get all password reset requests (13.2)
router.get('/password-reset-requests', protect, authorize('admin'), async (req, res) => {
  try {
    const { status } = req.query;
    
    const query = status ? { status } : {};
    
    const requests = await PasswordResetRequest.find(query)
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      requests,
      counts: {
        pending: await PasswordResetRequest.countDocuments({ status: 'Pending' }),
        approved: await PasswordResetRequest.countDocuments({ status: 'Approved' }),
        rejected: await PasswordResetRequest.countDocuments({ status: 'Rejected' })
      }
    });
  } catch (error) {
    console.error('Get reset requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching password reset requests'
    });
  }
});

// Process password reset request - Approve (13.2)
router.post('/password-reset-requests/:id/approve', protect, authorize('admin'), async (req, res) => {
  try {
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters'
      });
    }

    const request = await PasswordResetRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Reset request not found'
      });
    }

    if (request.status !== 'Pending') {
      return res.status(400).json({
        success: false,
        message: 'This request has already been processed'
      });
    }

    // Update the user's password
    let user;
    if (request.userType === 'organizer') {
      user = await Organizer.findById(request.userId);
    } else {
      user = await Participant.findById(request.userId);
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    // Update request status
    request.status = 'Approved';
    request.processedBy = req.user._id;
    request.processedAt = new Date();
    request.newPassword = newPassword; // Store for admin reference
    await request.save();

    // Send email with new credentials
    if (request.userType === 'organizer') {
      await sendOrganizerCredentials(request.email, {
        organizerName: user.organizerName || user.clubName,
        clubName: user.clubName || user.organizerName,
        email: request.email,
        password: newPassword,
        isPasswordReset: true
      });
    }

    res.json({
      success: true,
      message: 'Password reset approved and new credentials sent to user',
      newPassword // Return for admin's reference
    });
  } catch (error) {
    console.error('Approve reset error:', error);
    res.status(500).json({
      success: false,
      message: 'Error approving password reset'
    });
  }
});

// Process password reset request - Reject (13.2)
router.post('/password-reset-requests/:id/reject', protect, authorize('admin'), async (req, res) => {
  try {
    const { adminNotes } = req.body;

    const request = await PasswordResetRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Reset request not found'
      });
    }

    if (request.status !== 'Pending') {
      return res.status(400).json({
        success: false,
        message: 'This request has already been processed'
      });
    }

    request.status = 'Rejected';
    request.processedBy = req.user._id;
    request.processedAt = new Date();
    request.adminNotes = adminNotes || 'Request rejected';
    await request.save();

    res.json({
      success: true,
      message: 'Password reset request rejected'
    });
  } catch (error) {
    console.error('Reject reset error:', error);
    res.status(500).json({
      success: false,
      message: 'Error rejecting password reset'
    });
  }
});

export default router;
