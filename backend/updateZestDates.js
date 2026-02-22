import mongoose from 'mongoose';
import Event from './models/Event.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env file
dotenv.config({ path: join(__dirname, '.env') });

const updateZestDates = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    
    if (!mongoUri) {
      console.error('❌ MONGODB_URI not found in environment variables');
      console.log('Please check your .env file');
      process.exit(1);
    }

    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Find the Zest event
    const event = await Event.findOne({ 
      $or: [
        { title: 'Zest' },
        { eventName: 'Zest' }
      ]
    });

    if (!event) {
      console.log('❌ Zest event not found');
      await mongoose.disconnect();
      process.exit(1);
    }

    console.log('Found event:', event.title || event.eventName);
    console.log('Current dates:');
    console.log('  Start:', event.startDate || event.eventStartDate);
    console.log('  End:', event.endDate || event.eventEndDate);
    console.log('  Deadline:', event.registrationDeadline);

    // Update dates
    const startDate = new Date('2026-03-17T10:00:00');
    const endDate = new Date('2026-03-17T18:00:00');
    const deadline = new Date('2026-03-11T23:59:59');

    event.startDate = startDate;
    event.eventStartDate = startDate;
    event.endDate = endDate;
    event.eventEndDate = endDate;
    event.registrationDeadline = deadline;

    await event.save();

    console.log('\n✅ Event dates updated successfully!');
    console.log('New dates:');
    console.log('  Start Date: March 17, 2026, 10:00 AM');
    console.log('  End Date: March 17, 2026, 6:00 PM');
    console.log('  Registration Deadline: March 11, 2026, 11:59 PM');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
};

updateZestDates();
