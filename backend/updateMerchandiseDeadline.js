import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

const updateMerchandiseDeadline = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected');

    // Define Event schema
    const eventSchema = new mongoose.Schema({}, { strict: false });
    const Event = mongoose.model('Event', eventSchema);

    // Find merchandise event
    const event = await Event.findOne({ eventName: 'Merchandise' });
    
    if (!event) {
      console.log('Merchandise event not found');
      process.exit(1);
    }

    console.log('Found event:', event.eventName);
    console.log('Current deadline:', event.registrationDeadline);

    // Update to March 12, 2026
    const newDeadline = new Date('2026-03-12T20:00:00.000Z');
    event.registrationDeadline = newDeadline;
    
    await event.save();
    
    console.log('✅ Updated registration deadline to:', newDeadline);
    console.log('Updated successfully!');
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

updateMerchandiseDeadline();
