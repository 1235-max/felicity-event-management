import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
  // Required Event Attributes as per specification
  eventName: {
    type: String,
    trim: true
  },
  eventDescription: {
    type: String
  },
  eventType: {
    type: String,
    enum: ['Normal', 'Merchandise'],
    default: 'Normal'
  },
  eligibility: {
    type: String,
    enum: ['IIIT Only', 'All'],
    default: 'All'
  },
  registrationDeadline: {
    type: Date
  },
  eventStartDate: {
    type: Date
  },
  eventEndDate: {
    type: Date
  },
  registrationLimit: {
    type: Number,
    default: null
  },
  organizerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organizer'
  },
  
  // Normal Event specific fields
  registrationFee: {
    type: Number,
    default: 0
  },
  eventTags: [{
    type: String,
    trim: true
  }],
  customRegistrationForm: {
    fields: [{
      fieldId: String,
      fieldType: {
        type: String,
        enum: ['text', 'dropdown', 'checkbox', 'file', 'textarea', 'number', 'email']
      },
      label: String,
      placeholder: String,
      options: [String],
      required: Boolean,
      order: Number
    }],
    isLocked: {
      type: Boolean,
      default: false
    }
  },
  
  // Merchandise Event specific fields
  merchandiseDetails: {
    itemName: String,
    sizes: [String],
    colors: [String],
    variants: [{
      name: String,
      price: Number,
      stockQuantity: Number
    }]
  },
  stockQuantity: {
    type: Number,
    default: null
  },
  purchaseLimitPerParticipant: {
    type: Number,
    default: 1
  },
  
  // Legacy/Additional fields for compatibility
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organizer',
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  maxParticipants: {
    type: Number
  },
  currentParticipants: {
    type: Number,
    default: 0
  },
  price: {
    type: Number,
    default: 0
  },
  stock: {
    type: Number
  },
  venue: {
    type: String,
    default: 'TBD'
  },
  imageUrl: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['Draft', 'Published', 'Ongoing', 'Completed', 'Cancelled'],
    default: 'Draft'
  },
  customForm: {
    fields: [{
      fieldId: String,
      fieldType: {
        type: String,
        enum: ['text', 'dropdown', 'checkbox', 'file']
      },
      label: String,
      options: [String],
      required: Boolean,
      order: Number
    }],
    isLocked: {
      type: Boolean,
      default: false
    }
  },
  registrations: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Registration'
  }],
  viewCount: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Pre-save middleware to sync legacy fields
eventSchema.pre('save', function(next) {
  // Sync event fields
  if (this.eventName && !this.title) {
    this.title = this.eventName;
  } else if (this.title && !this.eventName) {
    this.eventName = this.title;
  }
  
  if (this.eventDescription && !this.description) {
    this.description = this.eventDescription;
  } else if (this.description && !this.eventDescription) {
    this.eventDescription = this.description;
  }
  
  if (this.organizerId && !this.organizer) {
    this.organizer = this.organizerId;
  } else if (this.organizer && !this.organizerId) {
    this.organizerId = this.organizer;
  }
  
  if (this.eventStartDate && !this.startDate) {
    this.startDate = this.eventStartDate;
  } else if (this.startDate && !this.eventStartDate) {
    this.eventStartDate = this.startDate;
  }
  
  if (this.eventEndDate && !this.endDate) {
    this.endDate = this.eventEndDate;
  } else if (this.endDate && !this.eventEndDate) {
    this.eventEndDate = this.endDate;
  }
  
  if (this.registrationLimit && !this.maxParticipants) {
    this.maxParticipants = this.registrationLimit;
  } else if (this.maxParticipants && !this.registrationLimit) {
    this.registrationLimit = this.maxParticipants;
  }
  
  if (this.registrationFee && !this.price) {
    this.price = this.registrationFee;
  } else if (this.price && !this.registrationFee) {
    this.registrationFee = this.price;
  }
  
  if (this.stockQuantity && !this.stock) {
    this.stock = this.stockQuantity;
  } else if (this.stock && !this.stockQuantity) {
    this.stockQuantity = this.stock;
  }
  
  next();
});

// Index for trending events (views in last 24h)
eventSchema.index({ viewCount: -1, createdAt: -1 });

export default mongoose.model('Event', eventSchema);
