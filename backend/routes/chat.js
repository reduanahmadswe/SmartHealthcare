const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticateToken, requirePatient, requireDoctor } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const Appointment = require('../models/Appointment');

const router = express.Router();

// @route   GET /api/chat/conversations
// @desc    Get user's chat conversations
// @access  Private
router.get('/conversations', asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;

  // Get appointments that have chat enabled
  const query = {
    $or: [
      { patient: req.user._id },
      { doctor: req.user._id }
    ],
    status: { $in: ['confirmed', 'in_progress', 'completed'] }
  };

  const appointments = await Appointment.find(query)
    .populate('patient', 'firstName lastName email profilePicture')
    .populate('doctor', 'firstName lastName email profilePicture')
    .sort({ updatedAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await Appointment.countDocuments(query);

  // Format conversations
  const conversations = appointments.map(appointment => {
    const otherUser = req.user.role === 'patient' 
      ? appointment.doctor 
      : appointment.patient;

    return {
      appointmentId: appointment._id,
      otherUser: {
        id: otherUser._id,
        name: `${otherUser.firstName} ${otherUser.lastName}`,
        email: otherUser.email,
        profilePicture: otherUser.profilePicture
      },
      appointmentDate: appointment.appointmentDate,
      appointmentTime: appointment.appointmentTime,
      status: appointment.status,
      lastMessage: appointment.chatMessages && appointment.chatMessages.length > 0 
        ? appointment.chatMessages[appointment.chatMessages.length - 1]
        : null,
      unreadCount: appointment.chatMessages 
        ? appointment.chatMessages.filter(msg => 
            !msg.readBy.includes(req.user._id.toString()) && 
            msg.sender.toString() !== req.user._id.toString()
          ).length
        : 0
    };
  });

  res.json({
    success: true,
    data: {
      conversations,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalConversations: total,
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1
      }
    }
  });
}));

// @route   GET /api/chat/messages/:appointmentId
// @desc    Get chat messages for an appointment
// @access  Private
router.get('/messages/:appointmentId', asyncHandler(async (req, res) => {
  const { appointmentId } = req.params;
  const { page = 1, limit = 50 } = req.query;

  const appointment = await Appointment.findById(appointmentId)
    .populate('patient', 'firstName lastName email profilePicture')
    .populate('doctor', 'firstName lastName email profilePicture');

  if (!appointment) {
    return res.status(404).json({
      success: false,
      message: 'Appointment not found'
    });
  }

  // Check if user has access to this chat
  const isPatient = appointment.patient._id.toString() === req.user._id.toString();
  const isDoctor = appointment.doctor._id.toString() === req.user._id.toString();

  if (!isPatient && !isDoctor) {
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }

  // Get messages with pagination
  const messages = appointment.chatMessages || [];
  const totalMessages = messages.length;
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedMessages = messages.slice(startIndex, endIndex).reverse();

  // Mark messages as read
  const unreadMessages = messages.filter(msg => 
    !msg.readBy.includes(req.user._id.toString()) && 
    msg.sender.toString() !== req.user._id.toString()
  );

  if (unreadMessages.length > 0) {
    const messageIds = unreadMessages.map(msg => msg._id);
    await Appointment.updateOne(
      { _id: appointmentId, 'chatMessages._id': { $in: messageIds } },
      { $addToSet: { 'chatMessages.$.readBy': req.user._id } }
    );
  }

  res.json({
    success: true,
    data: {
      appointment: {
        id: appointment._id,
        patient: {
          id: appointment.patient._id,
          name: `${appointment.patient.firstName} ${appointment.patient.lastName}`,
          email: appointment.patient.email,
          profilePicture: appointment.patient.profilePicture
        },
        doctor: {
          id: appointment.doctor._id,
          name: `${appointment.doctor.firstName} ${appointment.doctor.lastName}`,
          email: appointment.doctor.email,
          profilePicture: appointment.doctor.profilePicture
        },
        appointmentDate: appointment.appointmentDate,
        appointmentTime: appointment.appointmentTime,
        status: appointment.status
      },
      messages: paginatedMessages,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalMessages / limit),
        totalMessages,
        hasNextPage: page * limit < totalMessages,
        hasPrevPage: page > 1
      }
    }
  });
}));

// @route   POST /api/chat/send-message
// @desc    Send a message in chat
// @access  Private
router.post('/send-message', [
  body('appointmentId').isMongoId().withMessage('Valid appointment ID is required'),
  body('message').notEmpty().withMessage('Message is required'),
  body('messageType').optional().isIn(['text', 'image', 'file', 'prescription']),
  body('fileUrl').optional().isURL().withMessage('Valid file URL is required for file messages')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const { appointmentId, message, messageType = 'text', fileUrl } = req.body;

  const appointment = await Appointment.findById(appointmentId)
    .populate('patient', 'firstName lastName email')
    .populate('doctor', 'firstName lastName email');

  if (!appointment) {
    return res.status(404).json({
      success: false,
      message: 'Appointment not found'
    });
  }

  // Check if user has access to this chat
  const isPatient = appointment.patient._id.toString() === req.user._id.toString();
  const isDoctor = appointment.doctor._id.toString() === req.user._id.toString();

  if (!isPatient && !isDoctor) {
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }

  // Create new message
  const newMessage = {
    sender: req.user._id,
    message,
    messageType,
    fileUrl: fileUrl || null,
    timestamp: new Date(),
    readBy: [req.user._id.toString()]
  };

  // Add message to appointment
  appointment.chatMessages = appointment.chatMessages || [];
  appointment.chatMessages.push(newMessage);
  await appointment.save();

  // Emit message to socket (handled by socket.io)
  const io = req.app.get('io');
  const roomName = `appointment_${appointmentId}`;
  
  io.to(roomName).emit('new_message', {
    appointmentId,
    message: newMessage,
    sender: {
      id: req.user._id,
      name: `${req.user.firstName} ${req.user.lastName}`,
      role: req.user.role
    }
  });

  res.json({
    success: true,
    message: 'Message sent successfully',
    data: {
      message: newMessage
    }
  });
}));

// @route   PUT /api/chat/mark-read
// @desc    Mark messages as read
// @access  Private
router.put('/mark-read', [
  body('appointmentId').isMongoId().withMessage('Valid appointment ID is required'),
  body('messageIds').optional().isArray().withMessage('Message IDs must be an array')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const { appointmentId, messageIds } = req.body;

  const appointment = await Appointment.findById(appointmentId);

  if (!appointment) {
    return res.status(404).json({
      success: false,
      message: 'Appointment not found'
    });
  }

  // Check if user has access to this chat
  const isPatient = appointment.patient.toString() === req.user._id.toString();
  const isDoctor = appointment.doctor.toString() === req.user._id.toString();

  if (!isPatient && !isDoctor) {
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }

  // Mark specific messages as read or all unread messages
  if (messageIds && messageIds.length > 0) {
    await Appointment.updateOne(
      { _id: appointmentId, 'chatMessages._id': { $in: messageIds } },
      { $addToSet: { 'chatMessages.$.readBy': req.user._id } }
    );
  } else {
    // Mark all unread messages as read
    const unreadMessages = appointment.chatMessages.filter(msg => 
      !msg.readBy.includes(req.user._id.toString()) && 
      msg.sender.toString() !== req.user._id.toString()
    );

    if (unreadMessages.length > 0) {
      const messageIds = unreadMessages.map(msg => msg._id);
      await Appointment.updateOne(
        { _id: appointmentId, 'chatMessages._id': { $in: messageIds } },
        { $addToSet: { 'chatMessages.$.readBy': req.user._id } }
      );
    }
  }

  res.json({
    success: true,
    message: 'Messages marked as read'
  });
}));

// @route   DELETE /api/chat/delete-message
// @desc    Delete a message (only sender can delete)
// @access  Private
router.delete('/delete-message', [
  body('appointmentId').isMongoId().withMessage('Valid appointment ID is required'),
  body('messageId').isMongoId().withMessage('Valid message ID is required')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const { appointmentId, messageId } = req.body;

  const appointment = await Appointment.findById(appointmentId);

  if (!appointment) {
    return res.status(404).json({
      success: false,
      message: 'Appointment not found'
    });
  }

  // Check if user has access to this chat
  const isPatient = appointment.patient.toString() === req.user._id.toString();
  const isDoctor = appointment.doctor.toString() === req.user._id.toString();

  if (!isPatient && !isDoctor) {
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }

  // Find the message
  const message = appointment.chatMessages.find(msg => 
    msg._id.toString() === messageId
  );

  if (!message) {
    return res.status(404).json({
      success: false,
      message: 'Message not found'
    });
  }

  // Check if user is the sender
  if (message.sender.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'You can only delete your own messages'
    });
  }

  // Remove message
  appointment.chatMessages = appointment.chatMessages.filter(msg => 
    msg._id.toString() !== messageId
  );
  await appointment.save();

  // Emit message deletion to socket
  const io = req.app.get('io');
  const roomName = `appointment_${appointmentId}`;
  
  io.to(roomName).emit('message_deleted', {
    appointmentId,
    messageId
  });

  res.json({
    success: true,
    message: 'Message deleted successfully'
  });
}));

// @route   GET /api/chat/unread-count
// @desc    Get total unread message count
// @access  Private
router.get('/unread-count', asyncHandler(async (req, res) => {
  // Get all appointments with chat messages
  const appointments = await Appointment.find({
    $or: [
      { patient: req.user._id },
      { doctor: req.user._id }
    ],
    'chatMessages.0': { $exists: true }
  });

  let totalUnread = 0;

  appointments.forEach(appointment => {
    const unreadMessages = appointment.chatMessages.filter(msg => 
      !msg.readBy.includes(req.user._id.toString()) && 
      msg.sender.toString() !== req.user._id.toString()
    );
    totalUnread += unreadMessages.length;
  });

  res.json({
    success: true,
    data: {
      unreadCount: totalUnread
    }
  });
}));

// @route   POST /api/chat/typing
// @desc    Send typing indicator
// @access  Private
router.post('/typing', [
  body('appointmentId').isMongoId().withMessage('Valid appointment ID is required'),
  body('isTyping').isBoolean().withMessage('Typing status is required')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const { appointmentId, isTyping } = req.body;

  const appointment = await Appointment.findById(appointmentId);

  if (!appointment) {
    return res.status(404).json({
      success: false,
      message: 'Appointment not found'
    });
  }

  // Check if user has access to this chat
  const isPatient = appointment.patient.toString() === req.user._id.toString();
  const isDoctor = appointment.doctor.toString() === req.user._id.toString();

  if (!isPatient && !isDoctor) {
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }

  // Emit typing indicator to socket
  const io = req.app.get('io');
  const roomName = `appointment_${appointmentId}`;
  
  io.to(roomName).emit('typing_indicator', {
    appointmentId,
    userId: req.user._id,
    userName: `${req.user.firstName} ${req.user.lastName}`,
    isTyping
  });

  res.json({
    success: true,
    message: 'Typing indicator sent'
  });
}));

// @route   GET /api/chat/search
// @desc    Search messages in conversations
// @access  Private
router.get('/search', asyncHandler(async (req, res) => {
  const { query, page = 1, limit = 20 } = req.query;

  if (!query || query.trim().length < 2) {
    return res.status(400).json({
      success: false,
      message: 'Search query must be at least 2 characters long'
    });
  }

  // Get user's appointments
  const appointments = await Appointment.find({
    $or: [
      { patient: req.user._id },
      { doctor: req.user._id }
    ],
    'chatMessages.0': { $exists: true }
  }).populate('patient', 'firstName lastName')
    .populate('doctor', 'firstName lastName');

  const searchResults = [];

  appointments.forEach(appointment => {
    const matchingMessages = appointment.chatMessages.filter(msg => 
      msg.message.toLowerCase().includes(query.toLowerCase())
    );

    matchingMessages.forEach(message => {
      const otherUser = req.user.role === 'patient' 
        ? appointment.doctor 
        : appointment.patient;

      searchResults.push({
        appointmentId: appointment._id,
        messageId: message._id,
        message: message.message,
        timestamp: message.timestamp,
        sender: {
          id: message.sender,
          name: message.sender.toString() === req.user._id.toString()
            ? `${req.user.firstName} ${req.user.lastName}`
            : `${otherUser.firstName} ${otherUser.lastName}`
        },
        appointment: {
          date: appointment.appointmentDate,
          time: appointment.appointmentTime,
          status: appointment.status
        }
      });
    });
  });

  // Sort by timestamp and paginate
  searchResults.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  
  const totalResults = searchResults.length;
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedResults = searchResults.slice(startIndex, endIndex);

  res.json({
    success: true,
    data: {
      results: paginatedResults,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalResults / limit),
        totalResults,
        hasNextPage: page * limit < totalResults,
        hasPrevPage: page > 1
      }
    }
  });
}));

module.exports = router; 