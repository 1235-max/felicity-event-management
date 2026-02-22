import express from 'express';
import Attendance from '../models/Attendance.js';
import Ticket from '../models/Ticket.js';
import Event from '../models/Event.js';
import Participant from '../models/Participant.js';
import Registration from '../models/Registration.js';
import { protect, authorize } from '../middleware/auth.js';
import { Parser } from 'json2csv';

const router = express.Router();

// @route   POST /api/attendance/scan
// @desc    Scan QR code and mark attendance
// @access  Organizer
router.post('/scan', protect, authorize('organizer'), async (req, res) => {
  try {
    const { qrData, eventId, scanMethod } = req.body;

    // Parse QR data
    let ticketData;
    try {
      ticketData = typeof qrData === 'string' ? JSON.parse(qrData) : qrData;
    } catch (error) {
      return res.status(400).json({ message: 'Invalid QR code format' });
    }

    const { ticketId, eventId: qrEventId, participantId } = ticketData;

    // Verify event - check both organizer and organizerId fields
    const event = await Event.findOne({
      _id: eventId,
      $or: [
        { organizer: req.user._id },
        { organizerId: req.user._id }
      ]
    });

    if (!event) {
      return res.status(403).json({ message: 'Unauthorized: Not your event' });
    }

    // Verify ticket belongs to this event
    if (qrEventId.toString() !== eventId.toString()) {
      return res.status(400).json({ message: 'Ticket is not for this event' });
    }

    // Find ticket
    const ticket = await Ticket.findOne({ ticketId })
      .populate('participant', 'name email rollNumber');

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    // Check for duplicate scan
    const existingAttendance = await Attendance.findOne({
      event: eventId,
      participant: participantId
    });

    if (existingAttendance) {
      return res.status(400).json({ 
        message: 'Duplicate scan detected',
        attendance: existingAttendance,
        alreadyScanned: true
      });
    }

    // Mark attendance
    const attendance = await Attendance.create({
      event: eventId,
      participant: participantId,
      ticket: ticket._id,
      ticketId,
      scannedBy: req.user._id,
      scanMethod: scanMethod || 'camera'
    });

    // Update ticket
    ticket.isUsed = true;
    ticket.usedAt = new Date();
    await ticket.save();

    // Update registration
    await Registration.findOneAndUpdate(
      { event: eventId, participant: participantId },
      { attended: true }
    );

    await attendance.populate('participant', 'name email rollNumber');

    res.json({ 
      message: 'Attendance marked successfully',
      attendance,
      participant: ticket.participant
    });
  } catch (error) {
    console.error('Scan error:', error);
    res.status(500).json({ message: 'Error processing scan', error: error.message });
  }
});

// @route   POST /api/attendance/manual
// @desc    Manual attendance override
// @access  Organizer
router.post('/manual', protect, authorize('organizer'), async (req, res) => {
  try {
    const { eventId, participantId, reason } = req.body;

    // Verify event ownership
    const event = await Event.findOne({
      _id: eventId,
      organizerId: req.user._id
    });

    if (!event) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Check if already marked
    const existing = await Attendance.findOne({ event: eventId, participant: participantId });
    if (existing) {
      return res.status(400).json({ message: 'Attendance already marked' });
    }

    // Find ticket for this participant and event
    const ticket = await Ticket.findOne({ event: eventId, participant: participantId });
    
    // Create manual attendance record
    const attendance = await Attendance.create({
      event: eventId,
      participant: participantId,
      ticket: ticket?._id,
      ticketId: ticket?.ticketId || 'MANUAL',
      scannedBy: req.user._id,
      scanMethod: 'manual',
      manualOverride: {
        isManual: true,
        reason: reason || 'Manual override by organizer',
        overriddenBy: req.user._id
      }
    });

    // Update registration
    await Registration.findOneAndUpdate(
      { event: eventId, participant: participantId },
      { attended: true }
    );

    await attendance.populate('participant', 'name email rollNumber');

    res.json({ 
      message: 'Manual attendance marked',
      attendance
    });
  } catch (error) {
    console.error('Manual attendance error:', error);
    res.status(500).json({ message: 'Error marking manual attendance' });
  }
});

// @route   GET /api/attendance/event/:eventId
// @desc    Get attendance stats and list for event
// @access  Organizer
router.get('/event/:eventId', protect, authorize('organizer'), async (req, res) => {
  try {
    // Verify event ownership
    const event = await Event.findOne({
      _id: req.params.eventId,
      organizerId: req.user._id
    });

    if (!event) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Get all registrations
    const registrations = await Registration.find({ event: req.params.eventId })
      .populate('participant', 'name email rollNumber phoneNumber');

    // Get all attendance records
    const attendanceRecords = await Attendance.find({ event: req.params.eventId })
      .populate('participant', 'name email rollNumber')
      .populate('scannedBy', 'name')
      .sort('-scannedAt');

    // Create attendance map
    const attendanceMap = {};
    attendanceRecords.forEach(record => {
      attendanceMap[record.participant._id.toString()] = record;
    });

    // Build combined list
    const attendanceList = registrations.map(reg => {
      const attendance = attendanceMap[reg.participant._id.toString()];
      return {
        participant: reg.participant,
        registration: reg,
        attendance: attendance || null,
        scanned: !!attendance,
        scannedAt: attendance?.scannedAt || null,
        scannedBy: attendance?.scannedBy || null,
        scanMethod: attendance?.scanMethod || null,
        isManual: attendance?.manualOverride?.isManual || false
      };
    });

    const stats = {
      total: registrations.length,
      scanned: attendanceRecords.length,
      notScanned: registrations.length - attendanceRecords.length,
      manualOverrides: attendanceRecords.filter(a => a.manualOverride.isManual).length
    };

    res.json({ 
      stats,
      attendanceList,
      attendanceRecords
    });
  } catch (error) {
    console.error('Error fetching attendance:', error);
    res.status(500).json({ message: 'Error fetching attendance data' });
  }
});

// @route   GET /api/attendance/export/:eventId
// @desc    Export attendance as CSV
// @access  Organizer
router.get('/export/:eventId', protect, authorize('organizer'), async (req, res) => {
  try {
    // Verify event ownership
    const event = await Event.findOne({
      _id: req.params.eventId,
      organizerId: req.user._id
    }).select('eventName');

    if (!event) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Get attendance data
    const attendanceRecords = await Attendance.find({ event: req.params.eventId })
      .populate('participant', 'name email rollNumber phoneNumber')
      .populate('scannedBy', 'name')
      .sort('scannedAt');

    // Prepare CSV data
    const csvData = attendanceRecords.map(record => ({
      'Participant Name': record.participant.name,
      'Email': record.participant.email,
      'Roll Number': record.participant.rollNumber || 'N/A',
      'Phone': record.participant.phoneNumber || 'N/A',
      'Ticket ID': record.ticketId,
      'Scanned At': new Date(record.scannedAt).toLocaleString(),
      'Scan Method': record.scanMethod,
      'Manual Override': record.manualOverride.isManual ? 'Yes' : 'No',
      'Scanned By': record.scannedBy.name,
      'Override Reason': record.manualOverride.reason || 'N/A'
    }));

    // Convert to CSV
    const parser = new Parser();
    const csv = parser.parse(csvData);

    // Set headers for download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${event.eventName}-attendance-${Date.now()}.csv"`);
    res.send(csv);
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ message: 'Error exporting attendance' });
  }
});

// @route   DELETE /api/attendance/:id
// @desc    Remove attendance record (audit logged)
// @access  Organizer
router.delete('/:id', protect, authorize('organizer'), async (req, res) => {
  try {
    const attendance = await Attendance.findById(req.params.id).populate('event');

    if (!attendance) {
      return res.status(404).json({ message: 'Attendance record not found' });
    }

    // Verify ownership
    const event = await Event.findOne({
      _id: attendance.event._id,
      organizerId: req.user._id
    });

    if (!event) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Update registration
    await Registration.findOneAndUpdate(
      { event: attendance.event._id, participant: attendance.participant },
      { attended: false }
    );

    // Update ticket
    await Ticket.findOneAndUpdate(
      { _id: attendance.ticket },
      { isUsed: false, usedAt: null }
    );

    await attendance.deleteOne();

    res.json({ message: 'Attendance record removed' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ message: 'Error removing attendance' });
  }
});

export default router;
