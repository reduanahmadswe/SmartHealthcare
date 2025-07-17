const { validationResult } = require('express-validator');
const messageService = require('./chat.service'); 
const { asyncHandler } = require('../../middleware/errorHandler');

const messageController = {

    getConversations: asyncHandler(async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const { page, limit } = req.query;
        const { conversations, pagination } = await messageService.getAppointmentConversations(req.user._id.toString(), page, limit);

        res.json({
            success: true,
            data: {
                conversations,
                pagination
            }
        });
    }),

    getMessagesByAppointmentId: asyncHandler(async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const { appointmentId } = req.params;
        const { page, limit } = req.query;

        try {
            const { appointment, messages, pagination } = await messageService.getAppointmentMessages(appointmentId, req.user._id.toString(), page, limit);

            res.json({
                success: true,
                data: {
                    appointment,
                    messages,
                    pagination
                }
            });
        } catch (error) {
            if (error.message === 'Appointment not found') {
                return res.status(404).json({
                    success: false,
                    message: error.message
                });
            }
            if (error.message === 'Access denied') {
                return res.status(403).json({
                    success: false,
                    message: error.message
                });
            }
            throw error; // Re-throw other errors for generic error handler
        }
    }),

    getConversationsByUserId: asyncHandler(async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const { userId } = req.params;
        const { limit } = req.query;

        // Check access permissions
        if (req.user.role === 'patient' && req.user._id.toString() !== userId) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. You can only view your own conversations.'
            });
        }

        const conversations = await messageService.getUserConversationsStandalone(userId, limit);

        res.json({
            success: true,
            data: {
                conversations,
                pagination: {
                    currentPage: 1, // This route doesn't paginate traditionally, it limits.
                    totalConversations: conversations.length,
                    hasNextPage: conversations.length === parseInt(limit),
                    hasPrevPage: false // Not applicable for this endpoint's pagination
                }
            }
        });
    }),

    getMessagesByConversationId: asyncHandler(async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const { conversationId } = req.params;
        const { page, limit } = req.query;

        // Check access permissions (redundant with service, but good for early exit)
        const [user1Id, user2Id] = conversationId.split('_');
        if (req.user.role === 'patient' &&
            req.user._id.toString() !== user1Id &&
            req.user._id.toString() !== user2Id) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. You can only view your own conversations.'
            });
        }

        try {
            const { messages, pagination } = await messageService.getConversationMessagesStandalone(conversationId, page, limit);

            res.json({
                success: true,
                data: {
                    messages,
                    pagination
                }
            });
        } catch (error) {
            if (error.message.includes('Invalid conversation ID')) {
                return res.status(400).json({
                    success: false,
                    message: error.message
                });
            }
            throw error;
        }
    }),

    sendMessageGeneral: asyncHandler(async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const { receiverId, message, messageType, fileData, appointmentId, replyTo } = req.body;

        try {
            const newMessage = await messageService.sendMessageGeneral({
                senderId: req.user._id,
                receiverId,
                message,
                messageType,
                fileData,
                appointmentId,
                replyTo
            });

            res.status(201).json({
                success: true,
                message: 'Message sent successfully',
                data: newMessage
            });
        } catch (error) {
            if (error.message === 'Receiver not found') {
                return res.status(404).json({
                    success: false,
                    message: error.message
                });
            }
            throw error;
        }
    }),

    sendMessageToAppointment: asyncHandler(async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const { appointmentId, message, messageType, fileUrl } = req.body;

        try {
            const sentMessage = await messageService.sendMessageToAppointment(
                appointmentId,
                req.user._id.toString(),
                message,
                messageType,
                fileUrl
            );

            // Emit message to socket (handled by socket.io)
            const io = req.app.get('io');
            const roomName = `appointment_${appointmentId}`;

            io.to(roomName).emit('new_message', {
                appointmentId,
                message: sentMessage,
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
                    message: sentMessage
                }
            });
        } catch (error) {
            if (error.message === 'Appointment not found') {
                return res.status(404).json({
                    success: false,
                    message: error.message
                });
            }
            if (error.message === 'Access denied') {
                return res.status(403).json({
                    success: false,
                    message: error.message
                });
            }
            throw error;
        }
    }),

    markMessagesAsRead: asyncHandler(async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const { appointmentId, messageIds } = req.body;

        try {
            await messageService.markMessagesAsRead(appointmentId, req.user._id.toString(), messageIds);
            res.json({
                success: true,
                message: 'Messages marked as read'
            });
        } catch (error) {
            if (error.message === 'Appointment not found') {
                return res.status(404).json({
                    success: false,
                    message: error.message
                });
            }
            if (error.message === 'Access denied') {
                return res.status(403).json({
                    success: false,
                    message: error.message
                });
            }
            throw error;
        }
    }),

    deleteMessage: asyncHandler(async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const { appointmentId, messageId } = req.body;

        try {
            await messageService.deleteMessage(appointmentId, messageId, req.user._id.toString());

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
        } catch (error) {
            if (error.message === 'Appointment not found' || error.message === 'Message not found') {
                return res.status(404).json({
                    success: false,
                    message: error.message
                });
            }
            if (error.message === 'Access denied' || error.message === 'You can only delete your own messages') {
                return res.status(403).json({
                    success: false,
                    message: error.message
                });
            }
            throw error;
        }
    }),

    getUnreadCount: asyncHandler(async (req, res) => {
        const unreadCount = await messageService.getTotalUnreadCount(req.user._id.toString());
        res.json({
            success: true,
            data: {
                unreadCount
            }
        });
    }),

    sendTypingIndicator: asyncHandler(async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const { appointmentId, isTyping } = req.body;

        try {
            await messageService.sendTypingIndicator(appointmentId, req.user._id.toString()); // Service only checks access

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
        } catch (error) {
            if (error.message === 'Appointment not found') {
                return res.status(404).json({
                    success: false,
                    message: error.message
                });
            }
            if (error.message === 'Access denied') {
                return res.status(403).json({
                    success: false,
                    message: error.message
                });
            }
            throw error;
        }
    }),

    searchMessages: asyncHandler(async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const { query, page, limit } = req.query;

        const { results, pagination } = await messageService.searchAppointmentMessages(req.user._id.toString(), query, page, limit);

        res.json({
            success: true,
            data: {
                results,
                pagination
            }
        });
    })
};

module.exports = messageController;