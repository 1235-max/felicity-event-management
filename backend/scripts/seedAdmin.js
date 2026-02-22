import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Admin from '../models/Admin.js';

dotenv.config();

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/felicity');
    
    console.log('✅ MongoDB connected');

    // Check if admin exists
    const existingAdmin = await Admin.findOne({ email: 'admin@felicity.com' });
    
    if (existingAdmin) {
      console.log('ℹ️  Admin already exists');
      process.exit(0);
    }

    // Create admin
    await Admin.create({
      email: 'admin@felicity.com',
      password: 'admin123',
      name: 'System Admin'
    });

    console.log('✅ Admin created successfully');
    console.log('📧 Email: admin@felicity.com');
    console.log('🔑 Password: admin123');
    console.log('\n⚠️  Please change this password after first login!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

seedAdmin();
