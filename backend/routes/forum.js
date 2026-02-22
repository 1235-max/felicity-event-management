import express from 'express';
import ForumMessage from '../models/ForumMessage.js';
import Event from '../models/Event.js';
import Registration from '../models/Registration.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/forum/:eventId/messages
// @desc    Get all messages for an event
// @access  Registered participants and organizer
router.get('/:eventId/messages', protect, async (req, res) => {
  try {
    const { eventId } = req.params;

    // Check if user is organizer or registered participant
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const isOrganizer = event.organizerId?.toString() === req.user._id.toString() || 
                        event.organizer?.toString() === req.user._id.toString();
    
    if (!isOrganizer && req.user.role === 'participant') {
      const registration = await Registration.findOne({
        event: eventId,
        participant: req.user._id,
        status: { $in: ['Completed', 'Confirmed'] }
      });
      
      if (!registration) {
        return res.status(403).json({ message: 'You must be registered for this event to view the forum' });
      }
    }

    // Get messages
    const messages = await ForumMessage.find({ 
      event: eventId,
      deleted: false
    })
      .populate('author', 'name email rollNumber clubName')
      .populate({
        path: 'parentMessage',
        populate: {
          path: 'author',
          select: 'name'
        }
      })
      .sort({ isPinned: -1, createdAt: -1 })
      .lean();

    res.json({ messages });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: 'Error fetching messages' });
  }
});

// @route   POST /api/forum/:eventId/messages
// @desc    Post a new message
// @access  Registered participants and organizer
router.post('/:eventId/messages', protect, async (req, res) => {
  try {
    const { eventId } = req.params;
    const { message, parentMessage, isAnnouncement } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ message: 'Message content is required' });
    }

    // Check if user is organizer or registered participant
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const isOrganizer = event.organizerId?.toString() === req.user._id.toString() || 
                        event.organizer?.toString() === req.user._id.toString();
    
    if (!isOrganizer && req.user.role === 'participant') {
      const registration = await Registration.findOne({
        event: eventId,
        participant: req.user._id,
        status: { $in: ['Completed', 'Confirmed'] }
      });
      
      if (!registration) {
        return res.status(403).json({ message: 'You must be registered for this event to post in the forum' });
      }
    }

    // Only organizers can post announcements
    const messageData = {
      event: eventId,
      author: req.user._id,
      authorModel: req.user.role === 'organizer' ? 'Organizer' : 'Participant',
      message: message.trim(),
      parentMessage: parentMessage || null,
      isAnnouncement: isOrganizer && isAnnouncement ? true : false
    };

    const newMessage = await ForumMessage.create(messageData);
    await newMessage.populate('author', 'name email rollNumber clubName');

    res.status(201).json({ message: newMessage });
  } catch (error) {
    console.error('Error posting message:', error);
    res.status(500).json({ message: 'Error posting message' });
  }
});

// @route   PUT /api/forum/messages/:messageId/react
// @desc    Add/remove reaction to a message
// @access  Registered participants and organizer
router.put('/messages/:messageId/react', protect, async (req, res) => {
  try {
    const { messageId } = req.params;
    const { reactionType } = req.body;

    if (!['like', 'love', 'helpful', 'question'].includes(reactionType)) {
      return res.status(400).json({ message: 'Invalid reaction type' });
    }

    const message = await ForumMessage.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Check if user already reacted
    const existingReaction = message.reactions.find(
      r => r.user.toString() === req.user._id.toString()
    );

    if (existingReaction) {
      if (existingReaction.type === reactionType) {
        // Remove reaction
        message.reactions = message.reactions.filter(
          r => r.user.toString() !== req.user._id.toString()
        );
      } else {
        // Change reaction
        existingReaction.type = reactionType;
      }
    } else {
      // Add new reaction
      message.reactions.push({
        user: req.user._id,
        type: reactionType
      });
    }

    await message.save();
    await message.populate('author', 'name email rollNumber clubName');

    res.json({ message });
  } catch (error) {
    console.error('Error reacting to message:', error);
    res.status(500).json({ message: 'Error reacting to message' });
  }
});

// @route   PUT /api/forum/messages/:messageId/pin
// @desc    Pin/unpin a message
// @access  Organizer only
router.put('/messages/:messageId/pin', protect, authorize('organizer'), async (req, res) => {
  try {
    const { messageId } = req.params;

    const message = await ForumMessage.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Verify organizer owns this event
    const event = await Event.findById(message.event);
    const isOwner = event.organizerId?.toString() === req.user._id.toString() || 
                    event.organizer?.toString() === req.user._id.toString();
    
    if (!isOwner) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    message.isPinned = !message.isPinned;
    await message.save();
    await message.populate('author', 'name email rollNumber clubName');

    res.json({ message });
  } catch (error) {
    console.error('Error pinning message:', error);
    res.status(500).json({ message: 'Error pinning message' });
  }
});

// @route   DELETE /api/forum/messages/:messageId
// @desc    Delete a message (soft delete)
// @access  Organizer only
router.delete('/messages/:messageId', protect, authorize('organizer'), async (req, res) => {
  try {
    const { messageId } = req.params;

    const message = await ForumMessage.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Verify organizer owns this event
    const event = await Event.findById(message.event);
    const isOwner = event.organizerId?.toString() === req.user._id.toString() || 
                    event.organizer?.toString() === req.user._id.toString();
    
    if (!isOwner) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    message.deleted = true;
    message.deletedBy = req.user._id;
    message.deletedAt = new Date();
    await message.save();

    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ message: 'Error deleting message' });
  }
});

export default router;
