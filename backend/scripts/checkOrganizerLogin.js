import mongoose from 'mongoose';
import Organizer from '../models/Organizer.js';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const checkLogin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    const email = 'hardik.singla@reasearch.iiit.ac.in';
    
    // Find organizer
    const organizer = await Organizer.findOne({ 
      $or: [{ email }, { contactEmail: email }]
    });

    if (!organizer) {
      console.log('❌ Organizer not found with that email!');
      process.exit(1);
    }

    console.log('✅ Found organizer:');
    console.log('   Name:', organizer.organizerName || organizer.clubName);
    console.log('   Email:', organizer.email);
    console.log('   ContactEmail:', organizer.contactEmail);
    console.log('   IsActive:', organizer.isActive);
    console.log('   Password Hash:', organizer.password.substring(0, 20) + '...');

    // Test password
    const testPassword = 'dance123';
    console.log('\n🔐 Testing password:', testPassword);
    
    const isValid = await bcrypt.compare(testPassword, organizer.password);
    console.log('   Password Valid:', isValid);

    if (!isValid) {
      console.log('\n⚠️  Password does not match! Resetting...');
      organizer.password = testPassword;
      await organizer.save();
      console.log('✅ Password reset successfully!');
    }

    console.log('\n📋 LOGIN CREDENTIALS:');
    console.log('   Email:', organizer.contactEmail || organizer.email);
    console.log('   Password:', testPassword);
    console.log('   Role: organizer');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

checkLogin();
