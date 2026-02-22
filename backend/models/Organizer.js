import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const organizerSchema = new mongoose.Schema({
  // Required Fields as per specification
  organizerName: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    trim: true,
    enum: ['Technical', 'Cultural', 'Sports', 'Literary', 'Arts', 'Social', 'Other']
  },
  description: {
    type: String,
    required: true,
    default: ''
  },
  contactEmail: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  // Legacy/Additional fields
  email: {
    type: String,
    lowercase: true,
    trim: true
  },
  clubName: {
    type: String,
    trim: true
  },
  contactPerson: {
    type: String
  },
  phone: {
    type: String
  },
  discordWebhook: {
    type: String,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  },
  followers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Participant'
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Pre-save middleware to sync legacy fields
organizerSchema.pre('save', async function(next) {
  // Sync email fields
  if (this.contactEmail && !this.email) {
    this.email = this.contactEmail;
  } else if (this.email && !this.contactEmail) {
    this.contactEmail = this.email;
  }
  
  // Sync name fields
  if (this.organizerName && !this.clubName) {
    this.clubName = this.organizerName;
  } else if (this.clubName && !this.organizerName) {
    this.organizerName = this.clubName;
  }
  
  // Hash password before saving
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password method
organizerSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model('Organizer', organizerSchema);
