import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const deleteOldAccount = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/event-management');
    
    const Participant = mongoose.model('Participant', new mongoose.Schema({}, {strict: false}));
    const Registration = mongoose.model('Registration', new mongoose.Schema({}, {strict: false}));
    
    const oldId = '6986f75d98ce37a3eeb66dd5';
    
    // Delete the old participant
    const result = await Participant.deleteOne({ _id: oldId });
    console.log('✅ Deleted old participant:', result.deletedCount, 'document(s)');
    
    // Delete any registrations for the old ID
    const regResult = await Registration.deleteMany({ participant: oldId });
    console.log('✅ Deleted old registrations:', regResult.deletedCount, 'document(s)');
    
    // Verify what's left
    const remaining = await Participant.find({ email: 'sara.bansal@iiit.ac.in' });
    console.log('\n📋 Remaining participant accounts:');
    remaining.forEach(p => {
      console.log('  - ID:', p._id.toString());
      console.log('    Email:', p.email);
    });
    
    console.log('\n🔄 Now LOGOUT and LOGIN again in your browser!');
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

deleteOldAccount();
