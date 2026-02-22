import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const updateDeadline = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    // Update the event with new dates
    const futureDate = new Date('2026-03-15T23:59:00'); // March 15, 2026
    const eventStart = new Date('2026-03-16T10:00:00'); // March 16, 2026
    const eventEnd = new Date('2026-03-16T18:00:00'); // March 16, 2026
    
    const result = await mongoose.connection.db.collection('events').updateOne(
      { title: 'Dance Inaugurals' },
      { 
        $set: { 
          registrationDeadline: futureDate,
          startDate: eventStart,
          endDate: eventEnd,
          eventStartDate: eventStart,
          eventEndDate: eventEnd
        } 
      }
    );

    if (result.modifiedCount === 0) {
      console.log('❌ Event not found or already updated!');
    } else {
      console.log(`✅ Event updated successfully!`);
      console.log(`   New Registration Deadline: ${futureDate.toLocaleString()}`);
      console.log(`   New Start Date: ${eventStart.toLocaleString()}`);
      console.log(`   New End Date: ${eventEnd.toLocaleString()}`);
      console.log(`\n💡 Registration is now OPEN!`);
    }

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

updateDeadline();
