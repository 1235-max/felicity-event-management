import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

const updateMerchandise = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected');

    const eventSchema = new mongoose.Schema({}, { strict: false });
    const Event = mongoose.model('Event', eventSchema);

    const result = await Event.updateOne(
      { eventName: 'Merchandise' },
      { 
        $set: {
          registrationDeadline: new Date('2026-03-12T20:00:00.000Z'),
          'merchandiseDetails.itemName': 'Felicity T-Shirt',
          'merchandiseDetails.sizes': ['S', 'M', 'L', 'XL', 'XXL'],
          'merchandiseDetails.colors': ['Red', 'Blue', 'Black', 'White'],
          'merchandiseDetails.variants': [
            { name: 'Standard T-Shirt', price: 280, stockQuantity: 30 },
            { name: 'Premium T-Shirt', price: 450, stockQuantity: 20 }
          ]
        }
      }
    );
    
    console.log('✅ Update result:', result);
    
    const updated = await Event.findOne({ eventName: 'Merchandise' });
    console.log('\n📅 Registration Deadline:', updated.registrationDeadline);
    console.log('\n📦 Merchandise Details:');
    console.log('   Item Name:', updated.merchandiseDetails.itemName);
    console.log('   Sizes:', updated.merchandiseDetails.sizes);
    console.log('   Colors:', updated.merchandiseDetails.colors);
    console.log('   Variants:', updated.merchandiseDetails.variants);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

updateMerchandise();
