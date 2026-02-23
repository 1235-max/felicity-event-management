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

    const event = await Event.findOne({ eventName: 'Merch Distribution' });
    
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
          name: 'Primitive T-Shirt',
          price: 280,
          stockQuantity: 30
        },
        {
          name: 'Non Primitive T-Shirt',
          price: 450,
          stockQuantity: 20
        }
      ]
    };

    // Example: When participant places an order, they can select size and color
    // This would be handled in the order creation logic, e.g.:
    // const participantOrder = {
    //   tshirtVariant: 'Premium T-Shirt',
    //   price: 280, // or 450
    //   size: 'M', // selected by participant
    //   color: 'Blue', // selected by participant
    //   quantity: 1,
    //   paymentProof: 'uploaded_file_url',
    // };
    // Save participantOrder to database as part of MerchandiseOrder model
    
      // Merchandise options
      const merchandiseOptions = [
        {
          type: 'premium',
          cost: 280,
        },
        {
          type: 'premium',
          cost: 450,
        },
        {
          type: 'non-premium',
          cost: 180,
        },
      ];
    
      // Example usage: Add these options to the merchandise details
      // You can integrate this array into your merchandise creation or update logic as needed

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
