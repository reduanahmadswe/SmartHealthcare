const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    receiver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    appointmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Appointment'
    },
    message: {
        type: String,
        required: true,
        trim: true
    },
    messageType: {
        type: String,
        enum: ['text', 'image', 'file', 'prescription', 'system'],
        default: 'text'
    },
    fileData: {
        fileName: String,
        fileUrl: String,
        fileSize: Number,
        mimeType: String
    },
    isRead: { // This field seems to be less used due to 'readBy' array, but kept for original structure
        type: Boolean,
        default: false
    },
    readBy: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        readAt: {
            type: Date,
            default: Date.now
        }
    }],
    isEdited: {
        type: Boolean,
        default: false
    },
    editedAt: Date,
    isDeleted: {
        type: Boolean,
        default: false
    },
    deletedAt: Date,
    deletedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    replyTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message'
    },
    reactions: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        reaction: {
            type: String,
            enum: ['like', 'love', 'laugh', 'wow', 'sad', 'angry']
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }]
}, {
    timestamps: true
});

// Indexes for better performance
messageSchema.index({
    sender: 1,
    receiver: 1,
    createdAt: -1
});
messageSchema.index({
    appointmentId: 1,
    createdAt: -1
});
messageSchema.index({
    isRead: 1
});
messageSchema.index({
    'readBy.user': 1
});

// Virtual for conversation ID (unique identifier for a conversation between two users)
messageSchema.virtual('conversationId').get(function() {
    if (!this.sender || !this.receiver) return null;
    const users = [this.sender.toString(), this.receiver.toString()].sort();
    return `${users[0]}_${users[1]}`;
});

// Method to mark message as read
messageSchema.methods.markAsRead = function(userId) {
    if (!this.readBy.some(read => read.user && read.user.toString() === userId.toString())) {
        this.readBy.push({
            user: userId,
            readAt: new Date()
        });
        this.isRead = true;
    }
    return this.save();
};

// Method to add reaction
messageSchema.methods.addReaction = function(userId, reaction) {
    const existingReactionIndex = this.reactions.findIndex(
        r => r.user && r.user.toString() === userId.toString()
    );

    if (existingReactionIndex !== -1) {
        this.reactions[existingReactionIndex].reaction = reaction;
        this.reactions[existingReactionIndex].createdAt = new Date();
    } else {
        this.reactions.push({
            user: userId,
            reaction,
            createdAt: new Date()
        });
    }

    return this.save();
};

// Method to remove reaction
messageSchema.methods.removeReaction = function(userId) {
    this.reactions = this.reactions.filter(
        r => r.user && r.user.toString() !== userId.toString()
    );
    return this.save();
};

// Static method to get conversation between two users
messageSchema.statics.getConversation = function(user1Id, user2Id, limit = 50, skip = 0) {
    return this.find({
            $or: [{
                sender: user1Id,
                receiver: user2Id
            }, {
                sender: user2Id,
                receiver: user1Id
            }],
            isDeleted: false
        })
        .populate('sender', 'firstName lastName email profilePicture')
        .populate('receiver', 'firstName lastName email profilePicture')
        .populate('replyTo', 'message sender')
        .sort({
            createdAt: -1
        })
        .limit(limit)
        .skip(skip);
};

// Static method to get unread message count for a user
messageSchema.statics.getUnreadCount = function(userId) {
    return this.countDocuments({
        receiver: userId,
        isRead: false,
        isDeleted: false
    });
};

// Static method to get recent conversations for a user (from standalone Message model)
messageSchema.statics.getRecentConversations = function(userId, limit = 10) {
    return this.aggregate([
        {
            $match: {
                $or: [{
                    sender: mongoose.Types.ObjectId(userId)
                }, {
                    receiver: mongoose.Types.ObjectId(userId)
                }],
                isDeleted: false
            }
        },
        {
            $addFields: {
                conversationId: {
                    $cond: {
                        if: {
                            $eq: ['$sender', mongoose.Types.ObjectId(userId)]
                        },
                        then: {
                            $concat: [mongoose.Types.ObjectId(userId).toString(), '_', {
                                $toString: '$receiver'
                            }]
                        }, // Ensure receiver is string
                        else: {
                            $concat: [{
                                $toString: '$sender'
                            }, '_', mongoose.Types.ObjectId(userId).toString()]
                        } // Ensure sender is string
                    }
                },
                otherUser: {
                    $cond: {
                        if: {
                            $eq: ['$sender', mongoose.Types.ObjectId(userId)]
                        },
                        then: '$receiver',
                        else: '$sender'
                    }
                }
            }
        },
        {
            $sort: {
                createdAt: -1
            }
        }, // Sort by createdAt within each conversation group to get the latest message first
        {
            $group: {
                _id: '$conversationId',
                lastMessage: {
                    $first: '$$ROOT'
                }, // Get the very last message in the conversation
                unreadCount: {
                    $sum: {
                        $cond: [
                            {
                                $and: [
                                    {
                                        $eq: ['$receiver', mongoose.Types.ObjectId(userId)]
                                    },
                                    {
                                        $not: {
                                            $in: [mongoose.Types.ObjectId(userId), '$readBy.user']
                                        }
                                    } // Check if userId is NOT in readBy
                                ]
                            },
                            1,
                            0
                        ]
                    }
                }
            }
        },
        {
            $sort: {
                'lastMessage.createdAt': -1
            }
        }, // Sort conversations by their last message's createdAt
        {
            $limit: limit
        },
        {
            $lookup: {
                from: 'users',
                localField: 'lastMessage.otherUser',
                foreignField: '_id',
                as: 'otherUser'
            }
        },
        {
            $unwind: '$otherUser'
        },
        {
            $project: {
                conversationId: '$_id',
                lastMessage: {
                    _id: '$lastMessage._id',
                    sender: '$lastMessage.sender',
                    receiver: '$lastMessage.receiver',
                    message: '$lastMessage.message',
                    messageType: '$lastMessage.messageType',
                    fileData: '$lastMessage.fileData',
                    createdAt: '$lastMessage.createdAt',
                    readBy: '$lastMessage.readBy' // Include readBy to calculate unread status on frontend if needed
                },
                unreadCount: 1,
                otherUser: {
                    _id: '$otherUser._id',
                    firstName: '$otherUser.firstName',
                    lastName: '$otherUser.lastName',
                    email: '$otherUser.email',
                    profilePicture: '$otherUser.profilePicture'
                }
            }
        }
    ]);
};


module.exports = mongoose.model('Message', messageSchema);