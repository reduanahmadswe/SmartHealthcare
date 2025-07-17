
const Appointment = require('../appointment/appointment.model');
const Message = require('../chat/chat.model');
const User = require('../user/user.model'); 
const mongoose = require('mongoose');

const messageService = {

    /**
     * Gets a user's chat conversations based on appointments.
     * @param {string} userId - ID of the current user.
     * @param {number} page - Page number for pagination.
     * @param {number} limit - Number of conversations per page.
     * @returns {Promise<object>} - Object containing conversations and pagination info.
     */
    getAppointmentConversations: async (userId, page = 1, limit = 10) => {
        const query = {
            $or: [{
                patient: userId
            }, {
                doctor: userId
            }],
            status: {
                $in: ['confirmed', 'in_progress', 'completed']
            }
        };

        const appointments = await Appointment.find(query)
            .populate('patient', 'firstName lastName email profilePicture')
            .populate('doctor', 'firstName lastName email profilePicture')
            .sort({
                updatedAt: -1
            })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Appointment.countDocuments(query);

        const conversations = appointments.map(appointment => {
            const otherUser = appointment.patient._id.toString() === userId ?
                appointment.doctor :
                appointment.patient;

            // Filter for only relevant unread messages (sent by other user, not read by current user)
            const unreadCount = appointment.chatMessages ?
                appointment.chatMessages.filter(msg =>
                    msg.sender.toString() === otherUser._id.toString() &&
                    !msg.readBy.includes(userId.toString())
                ).length : 0;

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
                lastMessage: appointment.chatMessages && appointment.chatMessages.length > 0 ?
                    appointment.chatMessages[appointment.chatMessages.length - 1] :
                    null,
                unreadCount: unreadCount
            };
        });

        return {
            conversations,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                totalConversations: total,
                hasNextPage: page * limit < total,
                hasPrevPage: page > 1
            }
        };
    },

    /**
     * Gets chat messages for a specific appointment.
     * @param {string} appointmentId - ID of the appointment.
     * @param {string} userId - ID of the current user (for access check and marking read).
     * @param {number} page - Page number for pagination.
     * @param {number} limit - Number of messages per page.
     * @returns {Promise<object>} - Object containing appointment details, messages, and pagination info.
     * @throws {Error} If appointment not found or access denied.
     */
    getAppointmentMessages: async (appointmentId, userId, page = 1, limit = 50) => {
        const appointment = await Appointment.findById(appointmentId)
            .populate('patient', 'firstName lastName email profilePicture')
            .populate('doctor', 'firstName lastName email profilePicture');

        if (!appointment) {
            throw new Error('Appointment not found');
        }

        const isPatient = appointment.patient._id.toString() === userId;
        const isDoctor = appointment.doctor._id.toString() === userId;

        if (!isPatient && !isDoctor) {
            throw new Error('Access denied');
        }

        const messages = appointment.chatMessages || [];
        const totalMessages = messages.length;
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedMessages = messages.slice(startIndex, endIndex).reverse(); // Reverse to get most recent first on fetch

        // Mark messages as read by the current user
        const unreadMessagesSentByOther = messages.filter(msg =>
            msg.sender.toString() !== userId && // Message not sent by current user
            !msg.readBy.includes(userId.toString()) // Current user has not read it
        );

        if (unreadMessagesSentByOther.length > 0) {
            // Use bulk update for better performance if many messages
            const bulkOps = unreadMessagesSentByOther.map(msg => ({
                updateOne: {
                    filter: {
                        _id: appointmentId,
                        'chatMessages._id': msg._id
                    },
                    update: {
                        $addToSet: {
                            'chatMessages.$.readBy': userId
                        }
                    }
                }
            }));
            await Appointment.bulkWrite(bulkOps);

            // Re-fetch appointment or update in-memory object to reflect read status
            // For simplicity, we just assume the update was successful for the current response.
            // A real-time system would re-emit updated messages.
        }

        return {
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
                    email: `${appointment.doctor.email}`,
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
        };
    },

    /**
     * Gets recent conversations for a user using the standalone Message model.
     * @param {string} userId - ID of the user.
     * @param {number} limit - Limit for conversations.
     * @returns {Promise<Array<object>>} Array of conversation summaries.
     */
    getUserConversationsStandalone: async (userId, limit = 10) => {
        const conversations = await Message.getRecentConversations(userId, limit);
        return conversations;
    },

    /**
     * Gets messages for a conversation ID using the standalone Message model.
     * @param {string} conversationId - The conversation ID (e.g., user1Id_user2Id).
     * @param {number} page - Page number.
     * @param {number} limit - Messages per page.
     * @returns {Promise<object>} Object containing messages and pagination.
     * @throws {Error} If conversation ID is invalid.
     */
    getConversationMessagesStandalone: async (conversationId, page = 1, limit = 50) => {
        const [user1Id, user2Id] = conversationId.split('_');

        if (!mongoose.Types.ObjectId.isValid(user1Id) || !mongoose.Types.ObjectId.isValid(user2Id)) {
            throw new Error('Invalid conversation ID format');
        }

        const messages = await Message.getConversation(user1Id, user2Id, limit, (page - 1) * limit);
        const total = await Message.countDocuments({
            $or: [{
                sender: user1Id,
                receiver: user2Id
            }, {
                sender: user2Id,
                receiver: user1Id
            }],
            isDeleted: false
        });

        return {
            messages,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                totalMessages: total,
                hasNextPage: page * limit < total,
                hasPrevPage: page > 1
            }
        };
    },

    /**
     * Sends a message using the standalone Message model.
     * @param {object} messageData - Data for the new message.
     * @returns {Promise<object>} The new message document.
     * @throws {Error} If receiver not found.
     */
    sendMessageGeneral: async (messageData) => {
        const {
            senderId,
            receiverId,
            message,
            messageType,
            fileData,
            appointmentId,
            replyTo
        } = messageData;

        const receiver = await User.findById(receiverId);
        if (!receiver) {
            throw new Error('Receiver not found');
        }

        const newMessage = new Message({
            sender: senderId,
            receiver: receiverId,
            message,
            messageType,
            fileData,
            appointmentId,
            replyTo
        });

        await newMessage.save();
        await newMessage.populate('sender', 'firstName lastName email profilePicture');
        return newMessage;
    },

    /**
     * Sends a message within an appointment chat.
     * @param {string} appointmentId - ID of the appointment.
     * @param {string} senderId - ID of the sender.
     * @param {string} message - Message content.
     * @param {string} messageType - Type of message.
     * @param {string} [fileUrl] - URL for file messages.
     * @returns {Promise<object>} The updated appointment chat message.
     * @throws {Error} If appointment not found or access denied.
     */
    sendMessageToAppointment: async (appointmentId, senderId, message, messageType = 'text', fileUrl) => {
        const appointment = await Appointment.findById(appointmentId)
            .populate('patient', 'firstName lastName email')
            .populate('doctor', 'firstName lastName email');

        if (!appointment) {
            throw new Error('Appointment not found');
        }

        const isPatient = appointment.patient._id.toString() === senderId;
        const isDoctor = appointment.doctor._id.toString() === senderId;

        if (!isPatient && !isDoctor) {
            throw new Error('Access denied');
        }

        const newMessage = {
            sender: senderId,
            message,
            messageType,
            fileUrl: fileUrl || null,
            timestamp: new Date(),
            readBy: [senderId.toString()] // Sender automatically reads their own message
        };

        appointment.chatMessages = appointment.chatMessages || [];
        appointment.chatMessages.push(newMessage);
        await appointment.save();

        // Return the added message (it will have an _id generated by Mongoose subdocument)
        return appointment.chatMessages[appointment.chatMessages.length - 1];
    },

    /**
     * Marks messages in an appointment chat as read.
     * @param {string} appointmentId - ID of the appointment.
     * @param {string} userId - ID of the user marking messages as read.
     * @param {string[]} [messageIds] - Optional array of specific message IDs to mark as read. If not provided, all unread messages from the other party will be marked.
     * @returns {Promise<void>}
     * @throws {Error} If appointment not found or access denied.
     */
    markMessagesAsRead: async (appointmentId, userId, messageIds) => {
        const appointment = await Appointment.findById(appointmentId);

        if (!appointment) {
            throw new Error('Appointment not found');
        }

        const isPatient = appointment.patient.toString() === userId;
        const isDoctor = appointment.doctor.toString() === userId;

        if (!isPatient && !isDoctor) {
            throw new Error('Access denied');
        }

        if (messageIds && messageIds.length > 0) {
            // Mark specific messages as read
            await Appointment.updateMany(
                {
                    _id: appointmentId,
                    'chatMessages._id': {
                        $in: messageIds
                    }
                }, {
                    $addToSet: {
                        'chatMessages.$.readBy': userId
                    }
                }
            );
        } else {
            // Mark all unread messages from the OTHER user as read
            const unreadMessages = appointment.chatMessages.filter(msg =>
                msg.sender.toString() !== userId && // Not sent by current user
                !msg.readBy.includes(userId.toString()) // Not yet read by current user
            );

            if (unreadMessages.length > 0) {
                const unreadMessageIds = unreadMessages.map(msg => msg._id);
                // Cannot update multiple subdocuments in a single `updateOne` operation with `$addToSet` efficiently this way.
                // It requires iterating or using `bulkWrite` with multiple operations.
                // For simplicity and adherence to original logic, we will use a loop or re-find.
                // The original code used `updateOne` which would only update the first match.
                // Let's emulate the effect of marking *all* relevant messages as read.
                // A better approach would be to use arrayFilters or bulkWrite for efficiency.
                // Given the original code's single `updateOne`, let's stick to that for now,
                // but note it only marks the FIRST matched message as read if multiple are present.
                // For marking *all*, we would ideally iterate or use $[] operator if MongoDB version allows
                // and it matches the use case, or `bulkWrite`.
                await Appointment.updateOne(
                    {
                        _id: appointmentId,
                        'chatMessages.sender': { $ne: userId }, // Sent by other user
                        'chatMessages.readBy': { $ne: userId } // Not read by current user
                    },
                    {
                        $addToSet: { 'chatMessages.$[elem].readBy': userId }
                    },
                    {
                        arrayFilters: [ { 'elem.sender': { $ne: userId }, 'elem.readBy': { $ne: userId } } ]
                    }
                );
            }
        }
    },

    /**
     * Deletes a message from an appointment chat.
     * @param {string} appointmentId - ID of the appointment.
     * @param {string} messageId - ID of the message to delete.
     * @param {string} userId - ID of the user requesting deletion.
     * @returns {Promise<void>}
     * @throws {Error} If appointment/message not found, or access denied.
     */
    deleteMessage: async (appointmentId, messageId, userId) => {
        const appointment = await Appointment.findById(appointmentId);

        if (!appointment) {
            throw new Error('Appointment not found');
        }

        const isPatient = appointment.patient.toString() === userId;
        const isDoctor = appointment.doctor.toString() === userId;

        if (!isPatient && !isDoctor) {
            throw new Error('Access denied');
        }

        const messageIndex = appointment.chatMessages.findIndex(msg =>
            msg._id && msg._id.toString() === messageId
        );

        if (messageIndex === -1) {
            throw new Error('Message not found');
        }

        const message = appointment.chatMessages[messageIndex];

        if (message.sender.toString() !== userId) {
            throw new Error('You can only delete your own messages');
        }

        // Remove message by filtering out
        appointment.chatMessages.splice(messageIndex, 1); // Remove at index
        await appointment.save();
    },

    /**
     * Calculates the total unread message count for a user across all relevant appointments.
     * @param {string} userId - ID of the user.
     * @returns {Promise<number>} Total unread count.
     */
    getTotalUnreadCount: async (userId) => {
        const appointments = await Appointment.find({
            $or: [{
                patient: userId
            }, {
                doctor: userId
            }],
            'chatMessages.0': {
                $exists: true
            } // Ensure there are chat messages
        });

        let totalUnread = 0;

        appointments.forEach(appointment => {
            const unreadMessages = appointment.chatMessages.filter(msg =>
                msg.sender.toString() !== userId && // Not sent by current user
                !msg.readBy.includes(userId.toString()) // Not yet read by current user
            );
            totalUnread += unreadMessages.length;
        });

        return totalUnread;
    },

    /**
     * Handles sending typing indicators.
     * @param {string} appointmentId - ID of the appointment.
     * @param {string} userId - ID of the user typing.
     * @returns {Promise<void>}
     * @throws {Error} If appointment not found or access denied.
     */
    sendTypingIndicator: async (appointmentId, userId) => {
        const appointment = await Appointment.findById(appointmentId);

        if (!appointment) {
            throw new Error('Appointment not found');
        }

        const isPatient = appointment.patient.toString() === userId;
        const isDoctor = appointment.doctor.toString() === userId;

        if (!isPatient && !isDoctor) {
            throw new Error('Access denied');
        }
        // No DB operation here, just a check for access. Socket emission is handled by controller.
    },

    /**
     * Searches messages within a user's appointment conversations.
     * @param {string} userId - ID of the current user.
     * @param {string} query - Search query string.
     * @param {number} page - Page number for pagination.
     * @param {number} limit - Number of results per page.
     * @returns {Promise<object>} Object containing search results and pagination.
     */
    searchAppointmentMessages: async (userId, query, page = 1, limit = 20) => {
        // Get user's appointments that have chat messages
        const appointments = await Appointment.find({
                $or: [{
                    patient: userId
                }, {
                    doctor: userId
                }],
                'chatMessages.0': {
                    $exists: true
                }
            })
            .populate('patient', 'firstName lastName')
            .populate('doctor', 'firstName lastName');

        const searchResults = [];

        appointments.forEach(appointment => {
            const matchingMessages = appointment.chatMessages.filter(msg =>
                msg.message && typeof msg.message === 'string' &&
                msg.message.toLowerCase().includes(query.toLowerCase())
            );

            matchingMessages.forEach(message => {
                const otherUser = userId === appointment.patient._id.toString() ?
                    appointment.doctor :
                    appointment.patient;

                searchResults.push({
                    appointmentId: appointment._id,
                    messageId: message._id,
                    message: message.message,
                    timestamp: message.timestamp,
                    sender: {
                        id: message.sender,
                        name: message.sender.toString() === userId ?
                            `${appointment.patient.firstName} ${appointment.patient.lastName}` : // Assuming current user is patient here for name
                            `${otherUser.firstName} ${otherUser.lastName}`
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

        return {
            results: paginatedResults,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalResults / limit),
                totalResults,
                hasNextPage: page * limit < totalResults,
                hasPrevPage: page > 1
            }
        };
    },
};

module.exports = messageService;