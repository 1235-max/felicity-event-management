import mongoose from 'mongoose';
import Event from '../models/Event.js';
import dotenv from 'dotenv';

dotenv.config();

const updateDanceCrewDeadline = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  const event = await Event.findOne({ eventName: 'Dance Crew' });
  if (!event) {
    console.log('❌ Dance Crew event not found');
    process.exit(1);
  }
  event.registrationDeadline = new Date('2026-03-12T23:59:59');
  await event.save();
  console.log('✅ Dance Crew registration deadline updated to March 12, 2026');
  process.exit(0);
};

updateDanceCrewDeadline();
