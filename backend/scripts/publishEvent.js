import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const publishEvent = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    // Update directly without loading models
    const result = await mongoose.connection.db.collection('events').updateOne(
      { status: 'Draft' },
      { $set: { status: 'Published' } }
    );

    if (result.modifiedCount === 0) {
      console.log('❌ No draft events found or already published!');
    } else {
      console.log(`✅ Event published successfully! (${result.modifiedCount} event updated)`);
      console.log(`\n💡 The event is now visible in Browse Events!`);
    }

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

publishEvent();
