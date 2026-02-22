import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Participant from '../models/Participant.js';
import Organizer from '../models/Organizer.js';
import Event from '../models/Event.js';
import Registration from '../models/Registration.js';
import bcrypt from 'bcryptjs';

dotenv.config();

const fixOldAccount = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/event-management');
    console.log('MongoDB Connected...');

    // The OLD participant ID that you're currently logged in as
    const oldId = '6986f75d98ce37a3eeb66dd5';
    
    let participant = await Participant.findOne({ email: 'sara.bansal@iiit.ac.in' });
    console.log('Found participant with ID:', participant._id.toString());

    // Get or create organizer
    let organizer = await Organizer.findOne({ clubName: 'ACM IIIT' });
    
    if (!organizer) {
      const hashedPassword = await bcrypt.hash('password123', 10);
      organizer = await Organizer.create({
        email: 'acm@iiit.ac.in',
        password: hashedPassword,
        clubName: 'ACM IIIT',
        description: 'Association for Computing Machinery - IIIT Chapter',
        contactPerson: 'Tech Lead',
        phone: '9876543210',
        isActive: true
      });
      console.log('Created organizer');
    }

    // Delete old registrations for this participant
    await Registration.deleteMany({ participant: participant._id });
    console.log('Cleared old registrations');

    // Get or create events
    let upcomingEvent1 = await Event.findOne({ title: 'Tech Fest 2026' });
    if (!upcomingEvent1) {
      upcomingEvent1 = await Event.create({
        title: 'Tech Fest 2026',
        description: 'Annual technical festival',
        organizer: organizer._id,
        eventType: 'Normal',
        eligibility: 'All',
        startDate: new Date('2026-03-15T09:00:00Z'),
        endDate: new Date('2026-03-17T18:00:00Z'),
        registrationDeadline: new Date('2026-03-10T23:59:59Z'),
        venue: 'Main Auditorium',
        maxParticipants: 500,
        currentParticipants: 1,
        registrationFee: 0,
        isPaid: false,
        status: 'Published'
      });
    }

    let merchEvent = await Event.findOne({ title: 'Tech Fest Hoodie Sale' });
    if (!merchEvent) {
      merchEvent = await Event.create({
        title: 'Tech Fest Hoodie Sale',
        description: 'Official Tech Fest hoodies',
        organizer: organizer._id,
        eventType: 'Merchandise',
        eligibility: 'All',
        startDate: new Date('2026-02-20T10:00:00Z'),
        endDate: new Date('2026-03-20T18:00:00Z'),
        registrationDeadline: new Date('2026-03-15T23:59:59Z'),
        venue: 'Online Store',
        maxParticipants: 200,
        currentParticipants: 1,
        registrationFee: 500,
        isPaid: true,
        status: 'Published'
      });
    }

    let pastEvent1 = await Event.findOne({ title: 'Hackathon 2025' });
    if (!pastEvent1) {
      pastEvent1 = await Event.create({
        title: 'Hackathon 2025',
        description: '24-hour coding marathon',
        organizer: organizer._id,
        eventType: 'Normal',
        eligibility: 'All',
        startDate: new Date('2025-12-10T09:00:00Z'),
        endDate: new Date('2025-12-11T09:00:00Z'),
        registrationDeadline: new Date('2025-12-05T23:59:59Z'),
        venue: 'Computer Lab',
        maxParticipants: 100,
        currentParticipants: 1,
        registrationFee: 0,
        isPaid: false,
        status: 'Completed'
      });
    }

    let pastEvent2 = await Event.findOne({ title: 'Workshop on AI' });
    if (!pastEvent2) {
      pastEvent2 = await Event.create({
        title: 'Workshop on AI',
        description: 'AI and ML workshop',
        organizer: organizer._id,
        eventType: 'Normal',
        eligibility: 'IIIT Only',
        startDate: new Date('2025-11-15T14:00:00Z'),
        endDate: new Date('2025-11-15T17:00:00Z'),
        registrationDeadline: new Date('2025-11-10T23:59:59Z'),
        venue: 'Seminar Hall',
        maxParticipants: 50,
        currentParticipants: 0,
        registrationFee: 100,
        isPaid: true,
        status: 'Completed'
      });
    }

    console.log('Events ready');

    // Create registrations for OLD account
    const registrations = [
      {
        participant: participant._id,
        event: upcomingEvent1._id,
        ticketId: `TKT-${Date.now()}-001`,
        status: 'Registered',
        paymentStatus: 'Completed',
        paymentAmount: 0,
        attended: false,
        registeredAt: new Date('2026-02-01T10:30:00Z')
      },
      {
        participant: participant._id,
        event: merchEvent._id,
        ticketId: `TKT-${Date.now()}-002`,
        status: 'Registered',
        paymentStatus: 'Completed',
        paymentAmount: 500,
        attended: false,
        registeredAt: new Date('2026-02-05T15:20:00Z')
      },
      {
        participant: participant._id,
        event: pastEvent1._id,
        ticketId: `TKT-${Date.now()}-003`,
        status: 'Completed',
        paymentStatus: 'Completed',
        paymentAmount: 0,
        attended: true,
        registeredAt: new Date('2025-12-01T09:00:00Z')
      },
      {
        participant: participant._id,
        event: pastEvent2._id,
        ticketId: `TKT-${Date.now()}-004`,
        status: 'Rejected',
        paymentStatus: 'Failed',
        paymentAmount: 100,
        attended: false,
        registeredAt: new Date('2025-11-08T16:45:00Z')
      }
    ];

    await Registration.insertMany(registrations);
    console.log('✅ Created 4 registrations for account:', participant._id.toString());
    console.log('\n🔄 Now refresh your dashboard to see the data!');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

fixOldAccount();
