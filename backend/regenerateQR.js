import mongoose from 'mongoose';
import QRCode from 'qrcode';
import Ticket from './models/Ticket.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/felicity';

async function regenerateQRCodes() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const tickets = await Ticket.find({ ticketId: /^MER-/ });
    console.log(`Found ${tickets.length} merchandise tickets`);

    for (const ticket of tickets) {
      const qrCodeData = JSON.stringify({
        ticketId: ticket.ticketId,
        eventId: ticket.event.toString(),
        participantId: ticket.participant.toString(),
        orderType: 'merchandise'
      });

      const qrCode = await QRCode.toDataURL(qrCodeData);
      ticket.qrCode = qrCode;
      await ticket.save();
      
      console.log(`✅ Updated QR for ticket: ${ticket.ticketId}`);
    }

    console.log('🎉 All QR codes regenerated!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

regenerateQRCodes();
