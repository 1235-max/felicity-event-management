import express from 'express';
import MerchandiseOrder from '../models/MerchandiseOrder.js';
import Event from '../models/Event.js';
import Ticket from '../models/Ticket.js';
import { protect, authorize } from '../middleware/auth.js';
import { generateQRCode } from '../utils/qr.js';
import { sendTicketEmail } from '../utils/email.js';

const router = express.Router();

// @route   POST /api/merchandise/order
// @desc    Create merchandise order (user places order)
// @access  Participant
router.post('/order', protect, authorize('participant'), async (req, res) => {
  try {
    const { eventId, orderDetails, paymentProof, formResponses } = req.body;

    // Validate event
    const event = await Event.findById(eventId);
    if (!event || event.eventType !== 'Merchandise') {
      return res.status(400).json({ message: 'Invalid merchandise event' });
    }

    // Check stock
    if (event.stockQuantity !== undefined && event.stockQuantity < orderDetails.quantity) {
      return res.status(400).json({ message: 'Insufficient stock' });
    }

    // Create order
    const order = await MerchandiseOrder.create({
      participant: req.user._id,
      event: eventId,
      orderDetails,
      paymentProof,
      formResponses,
      status: 'Pending Approval'
    });

    await order.populate('event', 'eventName');
    
    res.status(201).json({
      message: 'Order placed successfully. Awaiting payment approval.',
      order
    });
  } catch (error) {
    console.error('Order creation error:', error);
    res.status(500).json({ message: 'Error creating order', error: error.message });
  }
});

// @route   GET /api/merchandise/my-orders
// @desc    Get participant's orders
// @access  Participant
router.get('/my-orders', protect, authorize('participant'), async (req, res) => {
  try {
    const orders = await MerchandiseOrder.find({ participant: req.user._id })
      .populate('event', 'eventName eventDescription merchandiseDetails')
      .populate('ticket')
      .sort('-createdAt');
    
    res.json({ orders });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ message: 'Error fetching orders' });
  }
});

// @route   PUT /api/merchandise/order/:id/upload-proof
// @desc    Upload payment proof for existing order
// @access  Participant
router.put('/order/:id/upload-proof', protect, authorize('participant'), async (req, res) => {
  try {
    const { paymentProof } = req.body;
    
    const order = await MerchandiseOrder.findOne({
      _id: req.params.id,
      participant: req.user._id
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    order.paymentProof = paymentProof;
    order.status = 'Pending Approval';
    await order.save();

    res.json({ message: 'Payment proof uploaded', order });
  } catch (error) {
    console.error('Error uploading proof:', error);
    res.status(500).json({ message: 'Error uploading payment proof' });
  }
});

// @route   GET /api/merchandise/orders/:eventId
// @desc    Get all orders for an event (Organizer view)
// @access  Organizer
router.get('/orders/:eventId', protect, authorize('organizer'), async (req, res) => {
  try {
    const { status } = req.query;
    
    // Verify organizer owns this event
    const event = await Event.findOne({
      _id: req.params.eventId,
      $or: [
        { organizer: req.user._id },
        { organizerId: req.user._id }
      ]
    });

    if (!event) {
      return res.status(403).json({ message: 'Unauthorized - Event not found or you do not own this event' });
    }

    const filter = { event: req.params.eventId };
    if (status) filter.status = status;

    const orders = await MerchandiseOrder.find(filter)
      .populate('participant', 'name email phoneNumber')
      .populate('event', 'eventName')
      .sort('-createdAt');

    // Get counts
    const counts = await MerchandiseOrder.aggregate([
      { $match: { event: event._id } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const statusCounts = {
      pending: 0,
      approved: 0,
      rejected: 0,
      successful: 0
    };

    counts.forEach(item => {
      if (item._id === 'Pending Approval') statusCounts.pending = item.count;
      if (item._id === 'Approved') statusCounts.approved = item.count;
      if (item._id === 'Rejected') statusCounts.rejected = item.count;
      if (item._id === 'Successful') statusCounts.successful = item.count;
    });

    res.json({ orders, counts: statusCounts });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ message: 'Error fetching orders' });
  }
});

// @route   POST /api/merchandise/order/:id/approve
// @desc    Approve payment and generate ticket
// @access  Organizer
router.post('/order/:id/approve', protect, authorize('organizer'), async (req, res) => {
  try {
    const order = await MerchandiseOrder.findById(req.params.id)
      .populate('event')
      .populate('participant');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Verify organizer owns this event
    if (order.event.organizerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    if (order.status !== 'Pending Approval') {
      return res.status(400).json({ message: 'Order not in pending state' });
    }

    // Check and decrement stock
    if (order.event.stockQuantity !== undefined) {
      if (order.event.stockQuantity < order.orderDetails.quantity) {
        return res.status(400).json({ message: 'Insufficient stock' });
      }
      order.event.stockQuantity -= order.orderDetails.quantity;
      await order.event.save();
    }

    // Generate unique ticket ID
    const ticketId = `MER-${order.event._id.toString().substring(0, 8)}-${order._id.toString().substring(0, 8)}`;

    // Generate QR code - convert ObjectIds to strings
    const qrCodeData = JSON.stringify({
      ticketId,
      eventId: order.event._id.toString(),
      participantId: order.participant._id.toString(),
      orderType: 'merchandise'
    });
    const qrCode = await generateQRCode(qrCodeData);

    // Create ticket
    const ticket = await Ticket.create({
      ticketId,
      registration: order._id,
      participant: order.participant._id,
      event: order.event._id,
      qrCode
    });

    // Update order
    order.status = 'Successful';
    order.reviewedBy = req.user._id;
    order.reviewedAt = new Date();
    order.ticket = ticket._id;
    order.ticketId = ticketId;
    order.qrCode = qrCode;
    await order.save();

    // Send confirmation email
    try {
      await sendTicketEmail({
        to: order.participant.email,
        participantName: order.participant.name,
        eventName: order.event.eventName,
        ticketId,
        qrCode
      });
    } catch (emailError) {
      console.error('Email send error:', emailError);
    }

    res.json({ 
      message: 'Order approved and ticket generated',
      order,
      ticket
    });
  } catch (error) {
    console.error('Approval error:', error);
    res.status(500).json({ message: 'Error approving order', error: error.message });
  }
});

// @route   POST /api/merchandise/order/:id/reject
// @desc    Reject payment
// @access  Organizer
router.post('/order/:id/reject', protect, authorize('organizer'), async (req, res) => {
  try {
    const { reason } = req.body;
    
    const order = await MerchandiseOrder.findById(req.params.id).populate('event');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Verify organizer owns this event
    if (order.event.organizerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    order.status = 'Rejected';
    order.reviewedBy = req.user._id;
    order.reviewedAt = new Date();
    order.rejectionReason = reason || 'Payment verification failed';
    await order.save();

    res.json({ 
      message: 'Order rejected',
      order
    });
  } catch (error) {
    console.error('Rejection error:', error);
    res.status(500).json({ message: 'Error rejecting order' });
  }
});

export default router;
