import mongoose from 'mongoose';
import Event from '../models/Event.js';
import Organizer from '../models/Organizer.js';
import dotenv from 'dotenv';

dotenv.config();

const checkEvents = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    // Find all events, sorted by creation date
    const events = await Event.find()
      .populate('organizer organizerId', 'clubName organizerName')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    console.log(`📋 Total Events: ${events.length}\n`);
    console.log('=' .repeat(80));

    events.forEach((event, idx) => {
      console.log(`\n${idx + 1}. ${event.title || event.eventName || 'Untitled Event'}`);
      console.log(`   Status: ${event.status}`);
      console.log(`   Type: ${event.eventType}`);
      console.log(`   Organizer: ${event.organizer?.clubName || event.organizerId?.organizerName || 'Unknown'}`);
      console.log(`   Start Date: ${event.startDate || event.eventStartDate || 'Not set'}`);
      console.log(`   Created: ${new Date(event.createdAt).toLocaleString()}`);
      console.log(`   ID: ${event._id}`);
    });

    console.log('\n' + '='.repeat(80));
    console.log('\n💡 Note: Only PUBLISHED events appear in Browse Events');
    console.log('💡 Participant Dashboard shows only events YOU ARE REGISTERED FOR\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

checkEvents();
