import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

const addMerchandiseDetails = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected');

    const eventSchema = new mongoose.Schema({}, { strict: false });
    const Event = mongoose.model('Event', eventSchema);

    const event = await Event.findOne({ eventName: 'Merchandise' });
    
    if (!event) {
      console.log('Merchandise event not found');
      process.exit(1);
    }

    console.log('Found event:', event.eventName);

    // Add merchandise details
    event.merchandiseDetails = {
      itemName: 'Felicity T-Shirt',
      sizes: ['S', 'M', 'L', 'XL', 'XXL'],
      colors: ['Red', 'Blue', 'Black', 'White'],
      variants: [
        {
          name: 'Standard T-Shirt',
          price: 280,
          stockQuantity: 30
        },
        {
          name: 'Premium T-Shirt',
          price: 450,
          stockQuantity: 20
        }
      ]
    };

    await event.save();
    
    console.log('✅ Added merchandise details:');
    console.log('- Sizes:', event.merchandiseDetails.sizes);
    console.log('- Colors:', event.merchandiseDetails.colors);
    console.log('- Variants:', event.merchandiseDetails.variants.map(v => v.name));
    console.log('Updated successfully!');
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

addMerchandiseDetails();
