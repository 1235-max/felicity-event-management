import mongoose from 'mongoose';

const forumMessageSchema = new mongoose.Schema({
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'authorModel'
  },
  authorModel: {
    type: String,
    required: true,
    enum: ['Participant', 'Organizer']
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  parentMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ForumMessage',
    default: null
  },
  isPinned: {
    type: Boolean,
    default: false
  },
  isAnnouncement: {
    type: Boolean,
    default: false
  },
  reactions: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    type: {
      type: String,
      enum: ['like', 'love', 'helpful', 'question'],
      required: true
    }
  }],
  deleted: {
    type: Boolean,
    default: false
  },
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organizer'
  },
  deletedAt: Date
}, {
  timestamps: true
});

// Index for faster queries
forumMessageSchema.index({ event: 1, createdAt: -1 });
forumMessageSchema.index({ event: 1, parentMessage: 1 });
forumMessageSchema.index({ event: 1, isPinned: -1, createdAt: -1 });

const ForumMessage = mongoose.model('ForumMessage', forumMessageSchema);

export default ForumMessage;
