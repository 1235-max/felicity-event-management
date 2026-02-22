import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const participantSchema = new mongoose.Schema({
  // Required Fields as per specification
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  participantType: {
    type: String,
    enum: ['IIIT', 'External'],
    required: true
  },
  college: {
    type: String,
    required: true
  },
  contactNumber: {
    type: String,
    required: true
  },
  // User Onboarding Preferences
  areasOfInterest: [{
    type: String,
    trim: true
  }],
  followedClubs: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organizer'
  }],
  onboardingCompleted: {
    type: Boolean,
    default: false
  },
  // Legacy field for compatibility
  name: {
    type: String,
    trim: true
  },
  phone: {
    type: String
  },
  // Registrations
  registrations: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Registration'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Virtual for full name (backward compatibility)
participantSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Pre-save middleware to sync legacy fields
participantSchema.pre('save', async function(next) {
  // Sync name field with firstName + lastName
  if (this.firstName && this.lastName) {
    this.name = `${this.firstName} ${this.lastName}`;
  }
  
  // Sync phone with contactNumber
  if (this.contactNumber && !this.phone) {
    this.phone = this.contactNumber;
  }
  
  // Hash password before saving
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password method
participantSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Ensure virtuals are included in JSON
participantSchema.set('toJSON', { virtuals: true });
participantSchema.set('toObject', { virtuals: true });

export default mongoose.model('Participant', participantSchema);
