import mongoose from 'mongoose';
import Participant from './models/Participant.js';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/felicity';

mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log('✅ MongoDB connected');
    
    const email = 'sara.bansal@students.iiit.ac.in';
    
    // Update the participant with missing fields
    const updated = await Participant.findOneAndUpdate(
      { email },
      { 
        $set: {
          firstName: 'Sara',
          lastName: 'Bansal',
          contactNumber: '9999999999'
        }
      },
      { new: true }
    );
    
    if (updated) {
      console.log('\n✅ Participant updated successfully:');
      console.log('Email:', updated.email);
      console.log('First Name:', updated.firstName);
      console.log('Last Name:', updated.lastName);
      console.log('Contact Number:', updated.contactNumber);
      console.log('College:', updated.college);
      console.log('\nYou can now login with your email and password!');
    } else {
      console.log('❌ Participant not found');
    }
    
    await mongoose.connection.close();
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
