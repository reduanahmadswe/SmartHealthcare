const express = require('express');
const { authenticateToken, requirePatient, requireDoctor } = require('../../middleware/auth'); 
const { asyncHandler } = require('../../middleware/errorHandler'); 
const messageValidation = require('./chat.validation'); 
const messageController = require('./chat.controller'); 

const router = express.Router();

// All chat routes require authentication
router.use(authenticateToken);

// @route   GET /api/chat/conversations
// @desc    Get user's chat conversations (appointment-based)
// @access  Private
router.get('/conversations',
    messageValidation.getConversations,
    messageController.getConversations
);

// @route   GET /api/chat/messages/:appointmentId
// @desc    Get chat messages for an appointment
// @access  Private
router.get('/messages/:appointmentId',
    messageValidation.getMessagesByAppointmentId,
    messageController.getMessagesByAppointmentId
);

// @route   GET /api/chat/conversations/:userId (using standalone Message model)
// @desc    Get user's conversations (standalone Message model)
// @access  Private
router.get('/conversations/:userId',
    messageValidation.getConversationsByUserId,
    messageController.getConversationsByUserId
);

// @route   GET /api/chat/messages/:conversationId (using standalone Message model)
// @desc    Get messages for a conversation (standalone Message model)
// @access  Private
router.get('/messages/:conversationId',
    messageValidation.getMessagesByConversationId,
    messageController.getMessagesByConversationId
);

// @route   POST /api/chat/send (using standalone Message model)
// @desc    Send a general message
// @access  Private
router.post('/send',
    messageValidation.sendMessageGeneral,
    messageController.sendMessageGeneral
);

// @route   POST /api/chat/send-message (sending message within appointment chat)
// @desc    Send a message in an appointment chat
// @access  Private
router.post('/send-message',
    messageValidation.sendMessageToAppointment,
    messageController.sendMessageToAppointment
);

// @route   PUT /api/chat/mark-read
// @desc    Mark messages as read in an appointment chat
// @access  Private
router.put('/mark-read',
    messageValidation.markRead,
    messageController.markMessagesAsRead
);

// @route   DELETE /api/chat/delete-message
// @desc    Delete a message from an appointment chat (only sender can delete)
// @access  Private
router.delete('/delete-message',
    messageValidation.deleteMessage,
    messageController.deleteMessage
);

// @route   GET /api/chat/unread-count
// @desc    Get total unread message count across appointment chats
// @access  Private
router.get('/unread-count',
    messageController.getUnreadCount
);

// @route   POST /api/chat/typing
// @desc    Send typing indicator for an appointment chat
// @access  Private
router.post('/typing',
    messageValidation.typingIndicator,
    messageController.sendTypingIndicator
);

// @route   GET /api/chat/search
// @desc    Search messages in appointment conversations
// @access  Private
router.get('/search',
    messageValidation.searchMessages,
    messageController.searchMessages
);

module.exports = router;