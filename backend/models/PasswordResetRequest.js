import mongoose from 'mongoose';

const passwordResetRequestSchema = new mongoose.Schema({
  userType: {
    type: String,
    enum: ['organizer', 'participant'],
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'userType',
    required: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true
  },
  name: {
    type: String,
    required: true
  },
  reason: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending'
  },
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  processedAt: {
    type: Date
  },
  newPassword: {
    type: String // Set by admin when approving
  },
  adminNotes: {
    type: String
  }
}, {
  timestamps: true
});

// Index for faster queries
passwordResetRequestSchema.index({ status: 1, createdAt: -1 });
passwordResetRequestSchema.index({ email: 1 });

export default mongoose.model('PasswordResetRequest', passwordResetRequestSchema);
