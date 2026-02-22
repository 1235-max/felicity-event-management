import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema({
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  participant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Participant',
    required: true
  },
  ticket: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ticket',
    required: true
  },
  ticketId: {
    type: String,
    required: true
  },
  scannedAt: {
    type: Date,
    default: Date.now
  },
  scannedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organizer',
    required: true
  },
  scanMethod: {
    type: String,
    enum: ['camera', 'upload', 'manual'],
    default: 'camera'
  },
  manualOverride: {
    isManual: {
      type: Boolean,
      default: false
    },
    reason: String,
    overriddenBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organizer'
    }
  },
  notes: {
    type: String
  }
}, {
  timestamps: true
});

// Indexes for performance
attendanceSchema.index({ event: 1, participant: 1 });
attendanceSchema.index({ ticketId: 1 });
attendanceSchema.index({ event: 1, scannedAt: 1 });

// Prevent duplicate scans
attendanceSchema.index({ event: 1, participant: 1 }, { unique: true });

export default mongoose.model('Attendance', attendanceSchema);
