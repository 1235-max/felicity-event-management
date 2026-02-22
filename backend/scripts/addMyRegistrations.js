import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Registration from '../models/Registration.js';
import Organizer from '../models/Organizer.js';
import Event from '../models/Event.js';
import Participant from '../models/Participant.js';
import bcrypt from 'bcryptjs';

dotenv.config();

const addRegistrations = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/event-management');
    console.log('MongoDB Connected...');

    // Get or create participant with new email
    let participant = await Participant.findOne({ email: 'sara.bansal@iiit.ac.in' });
    
    if (!participant) {
      const hashedPassword = await bcrypt.hash('password123', 10);
      participant = await Participant.create({
        email: 'sara.bansal@iiit.ac.in',
        password: hashedPassword,
        name: 'Sara Bansal',
        phone: '7888405594',
        college: 'IIIT Hyderabad',
        participantType: 'IIIT'
      });
      console.log('Created new participant');
    }

    const participantId = participant._id;

    // Clear existing registrations for this participant
    await Registration.deleteMany({ participant: participantId });
    console.log('Cleared existing registrations');

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

    // Create events
    const upcomingEvent1 = await Event.create({
      title: 'Tech Fest 2026',
      description: 'Annual technical festival with coding competitions, workshops, and tech talks',
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

    const merchEvent = await Event.create({
      title: 'Tech Fest Hoodie Sale',
      description: 'Official Tech Fest hoodies - Limited Edition',
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

    const pastEvent1 = await Event.create({
      title: 'Hackathon 2025',
      description: '24-hour coding marathon with amazing prizes',
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

    const pastEvent2 = await Event.create({
      title: 'Workshop on AI',
      description: 'Introduction to Artificial Intelligence and Machine Learning',
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

    console.log('Created events');

    // Create registrations for YOUR account
    const timestamp = Date.now();
    const registrations = [
      {
        participant: participantId,
        event: upcomingEvent1._id,
        ticketId: `TKT-${timestamp}-001`,
        status: 'Registered',
        paymentStatus: 'Completed',
        paymentAmount: 0,
        attended: false,
        registeredAt: new Date('2026-02-01T10:30:00Z')
      },
      {
        participant: participantId,
        event: merchEvent._id,
        ticketId: `TKT-${timestamp}-002`,
        status: 'Registered',
        paymentStatus: 'Completed',
        paymentAmount: 500,
        attended: false,
        registeredAt: new Date('2026-02-05T15:20:00Z')
      },
      {
        participant: participantId,
        event: pastEvent1._id,
        ticketId: `TKT-${timestamp}-003`,
        status: 'Completed',
        paymentStatus: 'Completed',
        paymentAmount: 0,
        attended: true,
        registeredAt: new Date('2025-12-01T09:00:00Z')
      },
      {
        participant: participantId,
        event: pastEvent2._id,
        ticketId: `TKT-${timestamp}-004`,
        status: 'Rejected',
        paymentStatus: 'Failed',
        paymentAmount: 100,
        attended: false,
        registeredAt: new Date('2025-11-08T16:45:00Z')
      }
    ];

    await Registration.insertMany(registrations);
    console.log('Created registrations for your account!');

    console.log('\n✅ Seeding completed successfully!');
    console.log(`\nYour account now has:`);
    console.log(`- Upcoming Events: 2`);
    console.log(`- Past Events: 2`);
    console.log(`- Total Tickets: 4`);
    console.log(`\nJust refresh your dashboard page!`);

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

addRegistrations();
