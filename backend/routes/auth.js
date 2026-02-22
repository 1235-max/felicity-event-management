import express from 'express';
import Participant from '../models/Participant.js';
import Organizer from '../models/Organizer.js';
import Admin from '../models/Admin.js';
import PasswordResetRequest from '../models/PasswordResetRequest.js';
import { generateToken } from '../utils/jwt.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Participant Signup
router.post('/signup/participant', async (req, res) => {
  try {
    const { email, password, firstName, lastName, contactNumber, college, areasOfInterest, followedClubs } = req.body;

    // Validate required fields
    if (!email || !password || !firstName || !lastName || !contactNumber || !college) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: email, password, firstName, lastName, contactNumber, college'
      });
    }

    // Password validation
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    // Check participant type based on email - IIIT email domain validation
    const isIIIT = email.match(/@(iiit|students\.iiit)\.ac\.in$/i);
    
    // IIIT Participants must use IIIT email only
    if (email.toLowerCase().includes('iiit') && !isIIIT) {
      return res.status(400).json({
        success: false,
        message: 'IIIT participants must register using IIIT-issued email ID (@iiit.ac.in or @students.iiit.ac.in)'
      });
    }

    // Check if participant already exists
    const existingParticipant = await Participant.findOne({ email: email.toLowerCase() });
    if (existingParticipant) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered'
      });
    }

    // Create participant with onboarding preferences (can be empty/skipped)
    const participant = await Participant.create({
      email: email.toLowerCase(),
      password,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      contactNumber: contactNumber.trim(),
      college: college.trim(),
      participantType: isIIIT ? 'IIIT' : 'External',
      areasOfInterest: areasOfInterest || [],
      followedClubs: followedClubs || [],
      onboardingCompleted: !!(areasOfInterest && areasOfInterest.length > 0) // Mark as completed if preferences provided
    });

    // Generate JWT token with 7 days expiration for session persistence
    const token = generateToken(participant._id, 'participant');

    res.status(201).json({
      success: true,
      message: 'Participant registered successfully',
      token,
      user: {
        id: participant._id,
        email: participant.email,
        firstName: participant.firstName,
        lastName: participant.lastName,
        name: `${participant.firstName} ${participant.lastName}`,
        role: 'participant',
        participantType: participant.participantType,
        onboardingCompleted: participant.onboardingCompleted,
        dashboardUrl: '/participant/dashboard'
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during signup'
    });
  }
});

// Login (for all user types)
router.post('/login', async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email, password and role'
      });
    }

    let user;
    let Model;

    // Select model based on role
    switch(role) {
      case 'participant':
        Model = Participant;
        break;
      case 'organizer':
        Model = Organizer;
        break;
      case 'admin':
        Model = Admin;
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid role'
        });
    }

    // Find user - handle organizer's dual email fields
    if (role === 'organizer') {
      user = await Model.findOne({ 
        $or: [{ email }, { contactEmail: email }]
      });
    } else {
      user = await Model.findOne({ email });
    }
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if organizer is active
    if (role === 'organizer' && !user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact the administrator.'
      });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate token with longer expiration for session persistence
    const token = generateToken(user._id, role);

    // Prepare user data for dashboard redirect
    const userData = {
      id: user._id,
      email: user.email,
      role
    };

    if (role === 'participant') {
      userData.name = user.name;
      userData.participantType = user.participantType;
      userData.dashboardUrl = '/participant/dashboard';
    } else if (role === 'organizer') {
      userData.organizerName = user.organizerName || user.clubName;
      userData.clubName = user.clubName || user.organizerName;
      userData.contactPerson = user.contactPerson;
      userData.category = user.category;
      userData.dashboardUrl = '/organizer/dashboard';
    } else if (role === 'admin') {
      userData.name = user.name;
      userData.dashboardUrl = '/admin/dashboard';
    }

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: userData
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
});

// Get current user
router.get('/me', protect, async (req, res) => {
  try {
    res.json({
      success: true,
      user: {
        ...req.user.toObject(),
        role: req.user.role
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching user data'
    });
  }
});

// Logout endpoint (frontend should clear token)
router.post('/logout', protect, async (req, res) => {
  try {
    // In JWT, logout is handled client-side by removing the token
    // This endpoint is for any server-side cleanup if needed
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error during logout'
    });
  }
});

// Update participant onboarding preferences
router.post('/onboarding/participant', protect, authorize('participant'), async (req, res) => {
  try {
    const { areasOfInterest, followedClubs } = req.body;

    const participant = await Participant.findByIdAndUpdate(
      req.user._id,
      {
        areasOfInterest: areasOfInterest || [],
        followedClubs: followedClubs || [],
        onboardingCompleted: true
      },
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      success: true,
      message: 'Preferences updated successfully',
      user: participant
    });
  } catch (error) {
    console.error('Onboarding error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating preferences'
    });
  }
});

// Request Password Reset (13.2 - User requests, Admin handles)
router.post('/request-password-reset', async (req, res) => {
  try {
    const { email, reason } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Check if user exists (organizer or participant)
    let user = await Organizer.findOne({ 
      $or: [{ email: email.toLowerCase() }, { contactEmail: email.toLowerCase() }]
    });
    let userType = 'organizer';

    if (!user) {
      user = await Participant.findOne({ email: email.toLowerCase() });
      userType = 'participant';
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No account found with this email address'
      });
    }

    // Check if there's already a pending request
    const existingRequest = await PasswordResetRequest.findOne({
      email: email.toLowerCase(),
      status: 'Pending'
    });

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: 'You already have a pending password reset request. Please wait for admin approval.'
      });
    }

    // Create password reset request
    const resetRequest = await PasswordResetRequest.create({
      userType,
      userId: user._id,
      email: email.toLowerCase(),
      name: userType === 'organizer' 
        ? (user.organizerName || user.clubName) 
        : `${user.firstName} ${user.lastName}`,
      reason: reason || 'Forgot password',
      status: 'Pending'
    });

    res.status(201).json({
      success: true,
      message: 'Password reset request submitted successfully. An admin will review and process your request.',
      request: {
        id: resetRequest._id,
        email: resetRequest.email,
        status: resetRequest.status,
        createdAt: resetRequest.createdAt
      }
    });
  } catch (error) {
    console.error('Password reset request error:', error);
    res.status(500).json({
      success: false,
      message: 'Error submitting password reset request'
    });
  }
});

// Check password reset request status
router.get('/password-reset-status/:email', async (req, res) => {
  try {
    const { email } = req.params;

    const requests = await PasswordResetRequest.find({
      email: email.toLowerCase()
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('status createdAt processedAt adminNotes');

    res.json({
      success: true,
      requests
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching request status'
    });
  }
});

export default router;
