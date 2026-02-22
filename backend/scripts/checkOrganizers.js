import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/felicity';

async function checkOrganizers() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB\n');

    const Organizer = mongoose.model('Organizer', new mongoose.Schema({}, { strict: false }));
    
    const organizers = await Organizer.find().lean();
    
    console.log(`📋 Total Organizers: ${organizers.length}\n`);
    
    if (organizers.length > 0) {
      console.log('================================================================================\n');
      organizers.forEach((org, index) => {
        console.log(`${index + 1}. ${org.organizerName || org.clubName}`);
        console.log(`   Email: ${org.email || org.contactEmail}`);
        console.log(`   Category: ${org.category || 'N/A'}`);
        console.log(`   Active: ${org.isActive ? 'Yes' : 'No'}`);
        console.log(`   Followers: ${org.followers?.length || 0}`);
        console.log(`   ID: ${org._id}`);
        console.log('');
      });
      console.log('================================================================================\n');
    } else {
      console.log('❌ No organizers found in database\n');
    }

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkOrganizers();
