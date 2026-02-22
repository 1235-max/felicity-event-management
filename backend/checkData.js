import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Registration from './models/Registration.js';
import Participant from './models/Participant.js';

dotenv.config();

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/event-management')
  .then(async () => {
    const participant = await Participant.findOne({ email: 'sara.bansal@students.iiit.ac.in' });
    console.log('Participant:', participant ? `${participant._id} - ${participant.email}` : 'NOT FOUND');
    
    if (participant) {
      const count = await Registration.countDocuments({ participant: participant._id });
      console.log('Registrations count:', count);
    }
    
    await mongoose.connection.close();
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
