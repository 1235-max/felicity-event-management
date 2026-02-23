import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

const printEvent = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected');

    const eventSchema = new mongoose.Schema({}, { strict: false });
    const Event = mongoose.model('Event', eventSchema);

    const event = await Event.findOne({ eventName: 'Merch Distribution' });
    if (!event) {
      console.log('Merch Distribution event not found');
      process.exit(1);
    }
    console.log('Event details:');
    console.log(JSON.stringify(event, null, 2));
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

printEvent();
