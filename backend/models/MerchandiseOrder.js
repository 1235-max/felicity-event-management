import mongoose from 'mongoose';

const merchandiseOrderSchema = new mongoose.Schema({
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
  orderDetails: {
    variant: String,
    size: String,
    color: String,
    quantity: {
      type: Number,
      default: 1
    },
    price: {
      type: Number,
      required: true
    }
  },
  paymentProof: {
    type: String, // URL or base64 image
    default: null
  },
  status: {
    type: String,
    enum: ['Pending Approval', 'Approved', 'Rejected', 'Successful'],
    default: 'Pending Approval'
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organizer'
  },
  reviewedAt: {
    type: Date
  },
  rejectionReason: {
    type: String
  },
  ticket: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ticket'
  },
  qrCode: {
    type: String
  },
  ticketId: {
    type: String
  },
  formResponses: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true
});

// Index for quick queries
merchandiseOrderSchema.index({ participant: 1, event: 1 });
merchandiseOrderSchema.index({ status: 1 });
merchandiseOrderSchema.index({ event: 1, status: 1 });

export default mongoose.model('MerchandiseOrder', merchandiseOrderSchema);
