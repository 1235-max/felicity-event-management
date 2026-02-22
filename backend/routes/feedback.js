import express from 'express';
import Feedback from '../models/Feedback.js';
import Event from '../models/Event.js';
import Registration from '../models/Registration.js';
import Attendance from '../models/Attendance.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Submit feedback (Participant only)
// POST /api/feedback/submit
router.post('/submit', protect, authorize('participant'), async (req, res) => {
  try {
    const { eventId, rating, comment } = req.body;

    // Validate input
    if (!eventId || !rating || !comment) {
      return res.status(400).json({
        success: false,
        error: 'Event ID, rating, and comment are required'
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        error: 'Rating must be between 1 and 5'
      });
    }

    // Check if event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Event not found'
      });
    }

    // Check if participant is registered for the event
    const registration = await Registration.findOne({
      event: eventId,
      participant: req.user._id
    });

    if (!registration) {
      return res.status(403).json({
        success: false,
        error: 'You must be registered for this event to submit feedback'
      });
    }

    // Check if participant has attended the event
    const attendance = await Attendance.findOne({
      event: eventId,
      participant: req.user._id
    });

    if (!attendance) {
      return res.status(403).json({
        success: false,
        error: 'You must have attended this event to submit feedback'
      });
    }

    // Check if event has ended
    const now = new Date();
    const eventEndDate = new Date(event.endDate || event.eventEndDate);
    if (now < eventEndDate) {
      return res.status(400).json({
        success: false,
        error: 'You can only submit feedback after the event has ended'
      });
    }

    // Check if feedback already exists
    const existingFeedback = await Feedback.findOne({
      event: eventId,
      participant: req.user._id
    });

    if (existingFeedback) {
      // Update existing feedback
      existingFeedback.rating = rating;
      existingFeedback.comment = comment;
      await existingFeedback.save();

      return res.json({
        success: true,
        message: 'Feedback updated successfully',
        feedback: {
          rating: existingFeedback.rating,
          comment: existingFeedback.comment,
          createdAt: existingFeedback.createdAt
        }
      });
    }

    // Create new feedback
    const feedback = await Feedback.create({
      event: eventId,
      participant: req.user._id,
      rating,
      comment,
      isAnonymous: true
    });

    res.status(201).json({
      success: true,
      message: 'Feedback submitted successfully',
      feedback: {
        rating: feedback.rating,
        comment: feedback.comment,
        createdAt: feedback.createdAt
      }
    });
  } catch (error) {
    console.error('Submit feedback error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit feedback'
    });
  }
});

// Get feedback for an event (Organizer only)
// GET /api/feedback/event/:eventId?rating=X
router.get('/event/:eventId', protect, async (req, res) => {
  try {
    const { eventId } = req.params;
    const { rating } = req.query;

    // Check if event exists and belongs to organizer (if organizer)
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Event not found'
      });
    }

    // Authorization check - only organizer of the event can view feedback
    if (req.user.role === 'organizer') {
      const isOrganizer = event.organizer?.toString() === req.user._id.toString() ||
                          event.organizerId?.toString() === req.user._id.toString();
      
      if (!isOrganizer) {
        return res.status(403).json({
          success: false,
          error: 'Not authorized to view feedback for this event'
        });
      }
    } else if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to view feedback'
      });
    }

    // Build query
    const query = { event: eventId };
    if (rating) {
      const ratingNum = parseInt(rating);
      if (ratingNum >= 1 && ratingNum <= 5) {
        query.rating = ratingNum;
      }
    }

    // Get feedback (anonymous - don't populate participant)
    const feedbacks = await Feedback.find(query)
      .select('rating comment createdAt')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: feedbacks.length,
      feedbacks
    });
  } catch (error) {
    console.error('Get feedback error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve feedback'
    });
  }
});

// Get aggregated feedback stats for an event
// GET /api/feedback/event/:eventId/stats
router.get('/event/:eventId/stats', protect, async (req, res) => {
  try {
    const { eventId } = req.params;

    // Check if event exists and belongs to organizer
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Event not found'
      });
    }

    // Authorization check
    if (req.user.role === 'organizer') {
      const isOrganizer = event.organizer?.toString() === req.user._id.toString() ||
                          event.organizerId?.toString() === req.user._id.toString();
      
      if (!isOrganizer) {
        return res.status(403).json({
          success: false,
          error: 'Not authorized to view feedback for this event'
        });
      }
    } else if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to view feedback'
      });
    }

    // Get all feedback for the event
    const feedbacks = await Feedback.find({ event: eventId });

    // Calculate statistics
    const totalFeedback = feedbacks.length;
    
    if (totalFeedback === 0) {
      return res.json({
        success: true,
        stats: {
          totalFeedback: 0,
          averageRating: 0,
          ratingDistribution: {
            1: 0,
            2: 0,
            3: 0,
            4: 0,
            5: 0
          }
        }
      });
    }

    // Calculate average rating
    const totalRating = feedbacks.reduce((sum, feedback) => sum + feedback.rating, 0);
    const averageRating = (totalRating / totalFeedback).toFixed(2);

    // Calculate rating distribution
    const ratingDistribution = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0
    };

    feedbacks.forEach(feedback => {
      ratingDistribution[feedback.rating]++;
    });

    res.json({
      success: true,
      stats: {
        totalFeedback,
        averageRating: parseFloat(averageRating),
        ratingDistribution
      }
    });
  } catch (error) {
    console.error('Get feedback stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve feedback statistics'
    });
  }
});

// Check if participant has submitted feedback for an event
// GET /api/feedback/check/:eventId
router.get('/check/:eventId', protect, authorize('participant'), async (req, res) => {
  try {
    const { eventId } = req.params;

    const feedback = await Feedback.findOne({
      event: eventId,
      participant: req.user._id
    }).select('rating comment createdAt');

    res.json({
      success: true,
      hasFeedback: !!feedback,
      feedback: feedback || null
    });
  } catch (error) {
    console.error('Check feedback error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check feedback status'
    });
  }
});

export default router;
