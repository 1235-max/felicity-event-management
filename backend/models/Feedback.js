import mongoose from 'mongoose';

const feedbackSchema = new mongoose.Schema({
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true,
    index: true
  },
  participant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Participant',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  isAnonymous: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound index for unique feedback per participant per event
feedbackSchema.index({ event: 1, participant: 1 }, { unique: true });

// Index for filtering by rating
feedbackSchema.index({ event: 1, rating: 1 });

const Feedback = mongoose.model('Feedback', feedbackSchema);

export default Feedback;
