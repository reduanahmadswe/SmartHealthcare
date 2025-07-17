
const { body, query, param } = require('express-validator');

const messageValidation = {
    getConversations: [
        query('page').optional().isInt({
            min: 1
        }).toInt().withMessage('Page must be a positive integer'),
        query('limit').optional().isInt({
            min: 1
        }).toInt().withMessage('Limit must be a positive integer'),
    ],
    getMessagesByAppointmentId: [
        param('appointmentId').isMongoId().withMessage('Valid Appointment ID is required'),
        query('page').optional().isInt({
            min: 1
        }).toInt().withMessage('Page must be a positive integer'),
        query('limit').optional().isInt({
            min: 1
        }).toInt().withMessage('Limit must be a positive integer'),
    ],
    getConversationsByUserId: [ // For standalone Message model conversations
        param('userId').isMongoId().withMessage('Valid User ID is required'),
        query('page').optional().isInt({
            min: 1
        }).toInt().withMessage('Page must be a positive integer'),
        query('limit').optional().isInt({
            min: 1
        }).toInt().withMessage('Limit must be a positive integer'),
    ],
    getMessagesByConversationId: [ // For standalone Message model conversations
        param('conversationId').notEmpty().isString().matches(/^[0-9a-fA-F]{24}_[0-9a-fA-F]{24}$/).withMessage('Valid Conversation ID is required (e.g., user1Id_user2Id)'),
        query('page').optional().isInt({
            min: 1
        }).toInt().withMessage('Page must be a positive integer'),
        query('limit').optional().isInt({
            min: 1
        }).toInt().withMessage('Limit must be a positive integer'),
    ],
    sendMessageGeneral: [ // For standalone Message model
        body('receiverId').isMongoId().withMessage('Valid receiver ID is required'),
        body('message').notEmpty().withMessage('Message is required').isString().trim().notEmpty().withMessage('Message cannot be empty'),
        body('messageType').optional().isIn(['text', 'image', 'file', 'prescription', 'system']).withMessage('Invalid message type'),
        body('fileData').optional().isObject().withMessage('File data must be an object'),
        body('appointmentId').optional().isMongoId().withMessage('Valid appointment ID is required'),
        body('replyTo').optional().isMongoId().withMessage('Valid reply message ID is required')
    ],
    sendMessageToAppointment: [ // For messages embedded in Appointment
        body('appointmentId').isMongoId().withMessage('Valid appointment ID is required'),
        body('message').notEmpty().withMessage('Message is required').isString().trim().notEmpty().withMessage('Message cannot be empty'),
        body('messageType').optional().isIn(['text', 'image', 'file', 'prescription']).withMessage('Invalid message type'),
        body('fileUrl').optional().isURL().withMessage('Valid file URL is required for file messages')
    ],
    markRead: [
        body('appointmentId').isMongoId().withMessage('Valid appointment ID is required'),
        body('messageIds').optional().isArray().withMessage('Message IDs must be an array of IDs')
    ],
    deleteMessage: [
        body('appointmentId').isMongoId().withMessage('Valid appointment ID is required'),
        body('messageId').isMongoId().withMessage('Valid message ID is required')
    ],
    typingIndicator: [
        body('appointmentId').isMongoId().withMessage('Valid appointment ID is required'),
        body('isTyping').isBoolean().withMessage('Typing status must be a boolean')
    ],
    searchMessages: [
        query('query').notEmpty().withMessage('Search query is required').isString().trim().isLength({
            min: 2
        }).withMessage('Search query must be at least 2 characters long'),
        query('page').optional().isInt({
            min: 1
        }).toInt().withMessage('Page must be a positive integer'),
        query('limit').optional().isInt({
            min: 1
        }).toInt().withMessage('Limit must be a positive integer'),
    ]
};

module.exports = messageValidation;