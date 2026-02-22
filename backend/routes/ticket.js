import express from 'express';
import Ticket from '../models/Ticket.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Get user's tickets
router.get('/my-tickets', protect, async (req, res) => {
  try {
    const tickets = await Ticket.find({ participant: req.user._id })
      .populate('event', 'title startDate endDate venue')
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      tickets
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching tickets'
    });
  }
});

// Get single ticket
router.get('/:ticketId', protect, async (req, res) => {
  try {
    const ticket = await Ticket.findOne({ ticketId: req.params.ticketId })
      .populate('event')
      .populate('participant', 'name email')
      .lean();

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    // Check if user owns this ticket or is organizer/admin
    const isOwner = ticket.participant._id.toString() === req.user._id.toString();
    const isOrganizer = req.user.role === 'organizer' && ticket.event.organizer.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isOrganizer && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this ticket'
      });
    }

    res.json({
      success: true,
      ticket
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching ticket'
    });
  }
});

// Verify and use ticket (Organizer only)
router.post('/:ticketId/verify', protect, async (req, res) => {
  try {
    const ticket = await Ticket.findOne({ ticketId: req.params.ticketId })
      .populate('event')
      .populate('registration');

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    // Check if organizer owns this event
    if (req.user.role === 'organizer' && ticket.event.organizer.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    if (ticket.isUsed) {
      return res.status(400).json({
        success: false,
        message: 'Ticket already used',
        usedAt: ticket.usedAt
      });
    }

    // Mark ticket as used
    ticket.isUsed = true;
    ticket.usedAt = new Date();
    await ticket.save();

    // Mark registration as attended
    const Registration = (await import('../models/Registration.js')).default;
    await Registration.findByIdAndUpdate(ticket.registration._id, {
      attended: true
    });

    res.json({
      success: true,
      message: 'Ticket verified successfully',
      ticket
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error verifying ticket'
    });
  }
});

export default router;
