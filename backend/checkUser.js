import mongoose from 'mongoose';
import Participant from './models/Participant.js';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/felicity';

mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log('✅ MongoDB connected');
    
    const email = 'sara.bansal@students.iiit.ac.in';
    const participant = await Participant.findOne({ email }).select('+password');
    
    if (participant) {
      console.log('\n✅ Participant found:');
      console.log('Email:', participant.email);
      console.log('First Name:', participant.firstName);
      console.log('Last Name:', participant.lastName);
      console.log('Contact Number:', participant.contactNumber);
      console.log('College:', participant.college);
      console.log('Participant Type:', participant.participantType);
      console.log('Has Password:', !!participant.password);
      console.log('\nTry logging in with this email and the password you used during signup.');
    } else {
      console.log('\n❌ No participant found with email:', email);
      console.log('You need to sign up first!');
    }
    
    await mongoose.connection.close();
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
