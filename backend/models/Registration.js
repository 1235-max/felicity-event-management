import mongoose from 'mongoose';

const registrationSchema = new mongoose.Schema({
  participant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Participant',
    required: true
  },
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  ticket: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ticket'
  },
  ticketId: {
    type: String,
    required: true,
    unique: true
  },
  status: {
    type: String,
    enum: ['Registered', 'Completed', 'Cancelled', 'Rejected'],
    default: 'Registered'
  },
  formResponses: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },
  paymentStatus: {
    type: String,
    enum: ['Pending', 'Completed', 'Failed'],
    default: 'Completed'
  },
  paymentAmount: {
    type: Number,
    default: 0
  },
  attended: {
    type: Boolean,
    default: false
  },
  registeredAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for faster queries
registrationSchema.index({ participant: 1, registeredAt: -1 });
registrationSchema.index({ event: 1 });
registrationSchema.index({ ticketId: 1 });

export default mongoose.model('Registration', registrationSchema);
