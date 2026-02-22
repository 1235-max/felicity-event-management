import mongoose from 'mongoose';
import Organizer from '../models/Organizer.js';
import dotenv from 'dotenv';

dotenv.config();

const resetPassword = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find The Dance Crew organizer
    const organizer = await Organizer.findOne({ 
      $or: [
        { email: 'hardik.singla@reasearch.iiit.ac.in' },
        { contactEmail: 'hardik.singla@reasearch.iiit.ac.in' }
      ]
    });

    if (!organizer) {
      console.log('❌ Organizer not found!');
      process.exit(1);
    }

    console.log(`\n✅ Found organizer: ${organizer.organizerName || organizer.clubName}`);
    console.log(`Email: ${organizer.contactEmail || organizer.email}`);

    // Ensure all required fields are set
    if (!organizer.organizerName) {
      organizer.organizerName = organizer.clubName || 'The Dance Crew';
    }
    if (!organizer.contactEmail) {
      organizer.contactEmail = organizer.email;
    }
    if (!organizer.category) {
      organizer.category = 'Cultural';
    }
    if (!organizer.description) {
      organizer.description = 'Dance club';
    }

    // Set new password - will be hashed by pre-save middleware
    const newPassword = 'dance123';
    organizer.password = newPassword;
    await organizer.save();

    console.log('\n✅ Password reset successful!');
    console.log('\n📋 LOGIN CREDENTIALS:');
    console.log('=====================================');
    console.log(`Email: ${organizer.contactEmail || organizer.email}`);
    console.log(`Password: ${newPassword}`);
    console.log(`Role: organizer`);
    console.log('=====================================\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

resetPassword();
