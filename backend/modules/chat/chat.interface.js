// D:\SmartHealthcare\backend\interfaces\chat\message.interface.js

/**
 * @typedef {'text' | 'image' | 'file' | 'prescription' | 'system'} MessageType
 */

/**
 * @typedef {'like' | 'love' | 'laugh' | 'wow' | 'sad' | 'angry'} ReactionType
 */

/**
 * @typedef {object} FileData
 * @property {string} fileName
 * @property {string} fileUrl
 * @property {number} fileSize
 * @property {string} mimeType
 */

/**
 * @typedef {object} ReadByEntry
 * @property {string} user - User ID who read the message.
 * @property {Date} readAt - Timestamp when the message was read.
 */

/**
 * @typedef {object} MessageReaction
 * @property {string} user - User ID who added the reaction.
 * @property {ReactionType} reaction - Type of reaction.
 * @property {Date} createdAt - Timestamp when the reaction was added.
 */

/**
 * @typedef {object} MessageBody
 * @property {string} sender - User ID of the sender.
 * @property {string} receiver - User ID of the receiver.
 * @property {string} message - The message content.
 * @property {MessageType} [messageType='text'] - Type of message.
 * @property {FileData} [fileData] - Data for file attachments.
 * @property {string} [appointmentId] - Optional: If message is part of an appointment chat.
 * @property {string} [replyTo] - Optional: ID of the message this one is replying to.
 * @property {ReadByEntry[]} [readBy] - Array of users who have read the message.
 * @property {boolean} [isEdited=false] - True if the message has been edited.
 * @property {Date} [editedAt] - Timestamp of the last edit.
 * @property {boolean} [isDeleted=false] - True if the message has been soft-deleted.
 * @property {Date} [deletedAt] - Timestamp of deletion.
 * @property {string} [deletedBy] - User ID who deleted the message.
 * @property {MessageReaction[]} [reactions] - Array of reactions to the message.
 * @property {Date} createdAt
 * @property {Date} updatedAt
 */

/**
 * @typedef {object} PopulatedUser
 * @property {string} _id
 * @property {string} firstName
 * @property {string} lastName
 * @property {string} email
 * @property {string} [profilePicture]
 */

/**
 * @typedef {object} AppointmentChatPopulatedMessage
 * @property {string} _id
 * @property {string} sender - User ID of the sender.
 * @property {string} message - The message content.
 * @property {MessageType} [messageType='text'] - Type of message.
 * @property {string} [fileUrl] - URL for file attachments (if applicable for embedded messages).
 * @property {Date} timestamp - Timestamp of the message.
 * @property {string[]} [readBy] - Array of user IDs who have read the message.
 */


/**
 * @typedef {object} PaginatedResponse
 * @property {number} currentPage
 * @property {number} totalPages
 * @property {number} totalItems // totalMessages or totalConversations etc.
 * @property {boolean} hasNextPage
 * @property {boolean} hasPrevPage
 */

/**
 * @typedef {object} ConversationSummaryAppointmentBased
 * @property {string} appointmentId
 * @property {PopulatedUser} otherUser
 * @property {string} appointmentDate
 * @property {string} appointmentTime
 * @property {string} status - Appointment status.
 * @property {AppointmentChatPopulatedMessage} [lastMessage]
 * @property {number} unreadCount
 */

/**
 * @typedef {object} ConversationSummaryMessageModelBased
 * @property {string} conversationId
 * @property {MessageBody} lastMessage
 * @property {number} unreadCount
 * @property {PopulatedUser} otherUser
 */

/**
 * @typedef {object} MessageSearchResult
 * @property {string} appointmentId
 * @property {string} messageId
 * @property {string} message
 * @property {Date} timestamp
 * @property {object} sender
 * @property {string} sender.id
 * @property {string} sender.name
 * @property {object} appointment
 * @property {string} appointment.date
 * @property {string} appointment.time
 * @property {string} appointment.status
 */