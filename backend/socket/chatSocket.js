const jwt = require('jsonwebtoken');
const User = require('../models/user/user.model');
const Appointment = require('../models/appointment/appointment.model');

module.exports = (io) => {
  // Store connected users
  const connectedUsers = new Map();
  const userSockets = new Map();

  // Authentication middleware for socket connections
  const authenticateSocket = async (token) => {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select('-password');
      return user;
    } catch (error) {
      return null;
    }
  };

  // Handle socket connections
  io.on('connection', async (socket) => {
    console.log('New socket connection:', socket.id);

    // Authenticate user
    const token = socket.handshake.auth.token;
    const user = await authenticateSocket(token);

    if (!user) {
      socket.emit('error', { message: 'Authentication failed' });
      socket.disconnect();
      return;
    }

    // Store user connection
    connectedUsers.set(socket.id, user);
    if (!userSockets.has(user._id.toString())) {
      userSockets.set(user._id.toString(), []);
    }
    userSockets.get(user._id.toString()).push(socket.id);

    console.log(`User ${user.fullName} (${user.role}) connected`);

    // Join user to their personal room
    socket.join(`user_${user._id}`);
    
    // Join user to role-based room
    socket.join(`role_${user.role}`);

    // Emit connection status
    socket.emit('connected', {
      userId: user._id,
      userRole: user.role,
      message: 'Successfully connected to chat server'
    });

    // Handle join appointment chat room
    socket.on('join_appointment', async (data) => {
      try {
        const { appointmentId } = data;
        
        // Verify user has access to this appointment
        const appointment = await Appointment.findById(appointmentId)
          .populate('patient', 'firstName lastName')
          .populate('doctor', 'firstName lastName');

        if (!appointment) {
          socket.emit('error', { message: 'Appointment not found' });
          return;
        }

        // Check if user is part of this appointment
        const isPatient = appointment.patient._id.toString() === user._id.toString();
        const isDoctor = appointment.doctor._id.toString() === user._id.toString();

        if (!isPatient && !isDoctor && user.role !== 'admin') {
          socket.emit('error', { message: 'Access denied to this appointment' });
          return;
        }

        // Join appointment room
        socket.join(`appointment_${appointmentId}`);
        
        socket.emit('joined_appointment', {
          appointmentId,
          appointment: {
            id: appointment._id,
            patient: appointment.patient,
            doctor: appointment.doctor,
            appointmentDate: appointment.appointmentDate,
            appointmentTime: appointment.appointmentTime,
            status: appointment.status
          }
        });

        // Notify other users in the room
        socket.to(`appointment_${appointmentId}`).emit('user_joined_appointment', {
          userId: user._id,
          userName: user.fullName,
          userRole: user.role
        });

        console.log(`User ${user.fullName} joined appointment ${appointmentId}`);

      } catch (error) {
        console.error('Error joining appointment:', error);
        socket.emit('error', { message: 'Failed to join appointment' });
      }
    });

    // Handle chat messages
    socket.on('send_message', async (data) => {
      try {
        const { appointmentId, message, messageType = 'text' } = data;

        // Validate appointment access
        const appointment = await Appointment.findById(appointmentId);
        if (!appointment) {
          socket.emit('error', { message: 'Appointment not found' });
          return;
        }

        const isPatient = appointment.patient.toString() === user._id.toString();
        const isDoctor = appointment.doctor.toString() === user._id.toString();

        if (!isPatient && !isDoctor && user.role !== 'admin') {
          socket.emit('error', { message: 'Access denied to this appointment' });
          return;
        }

        // Create message object
        const messageObj = {
          sender: user._id,
          message,
          messageType,
          timestamp: new Date(),
          isRead: false
        };

        // Save message to appointment
        appointment.chatMessages.push(messageObj);
        await appointment.save();

        // Emit message to all users in the appointment room
        io.to(`appointment_${appointmentId}`).emit('new_message', {
          appointmentId,
          message: {
            ...messageObj,
            sender: {
              _id: user._id,
              firstName: user.firstName,
              lastName: user.lastName,
              role: user.role
            }
          }
        });

        console.log(`Message sent in appointment ${appointmentId} by ${user.fullName}`);

      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Handle typing indicator
    socket.on('typing', (data) => {
      const { appointmentId, isTyping } = data;
      socket.to(`appointment_${appointmentId}`).emit('user_typing', {
        appointmentId,
        userId: user._id,
        userName: user.fullName,
        isTyping
      });
    });

    // Handle read receipts
    socket.on('mark_read', async (data) => {
      try {
        const { appointmentId, messageIds } = data;
        
        const appointment = await Appointment.findById(appointmentId);
        if (!appointment) return;

        // Mark messages as read
        appointment.chatMessages.forEach(msg => {
          if (messageIds.includes(msg._id.toString()) && msg.sender.toString() !== user._id.toString()) {
            msg.isRead = true;
          }
        });

        await appointment.save();

        // Notify message sender
        socket.to(`appointment_${appointmentId}`).emit('messages_read', {
          appointmentId,
          messageIds,
          readBy: user._id
        });

      } catch (error) {
        console.error('Error marking messages as read:', error);
      }
    });

    // Handle file uploads
    socket.on('upload_file', async (data) => {
      try {
        const { appointmentId, fileName, fileUrl, fileSize, mimeType } = data;

        const appointment = await Appointment.findById(appointmentId);
        if (!appointment) {
          socket.emit('error', { message: 'Appointment not found' });
          return;
        }

        // Create file message
        const fileMessage = {
          sender: user._id,
          message: `File: ${fileName}`,
          messageType: 'file',
          fileData: {
            fileName,
            fileUrl,
            fileSize,
            mimeType
          },
          timestamp: new Date(),
          isRead: false
        };

        // Save to appointment
        appointment.chatMessages.push(fileMessage);
        await appointment.save();

        // Emit to room
        io.to(`appointment_${appointmentId}`).emit('new_message', {
          appointmentId,
          message: {
            ...fileMessage,
            sender: {
              _id: user._id,
              firstName: user.firstName,
              lastName: user.lastName,
              role: user.role
            }
          }
        });

      } catch (error) {
        console.error('Error uploading file:', error);
        socket.emit('error', { message: 'Failed to upload file' });
      }
    });

    // Handle video call requests
    socket.on('video_call_request', async (data) => {
      try {
        const { appointmentId, callType = 'video' } = data;

        const appointment = await Appointment.findById(appointmentId);
        if (!appointment) {
          socket.emit('error', { message: 'Appointment not found' });
          return;
        }

        // Emit to other user in appointment
        socket.to(`appointment_${appointmentId}`).emit('video_call_requested', {
          appointmentId,
          requestedBy: {
            _id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role
          },
          callType
        });

      } catch (error) {
        console.error('Error requesting video call:', error);
        socket.emit('error', { message: 'Failed to request video call' });
      }
    });

    // Handle video call responses
    socket.on('video_call_response', (data) => {
      const { appointmentId, accepted, roomId } = data;
      
      socket.to(`appointment_${appointmentId}`).emit('video_call_response', {
        appointmentId,
        accepted,
        roomId,
        respondedBy: {
          _id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role
        }
      });
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      const disconnectedUser = connectedUsers.get(socket.id);
      
      if (disconnectedUser) {
        console.log(`User ${disconnectedUser.fullName} disconnected`);
        
        // Remove from connected users
        connectedUsers.delete(socket.id);
        
        // Remove from user sockets
        const userSocketIds = userSockets.get(disconnectedUser._id.toString());
        if (userSocketIds) {
          const updatedSockets = userSocketIds.filter(id => id !== socket.id);
          if (updatedSockets.length === 0) {
            userSockets.delete(disconnectedUser._id.toString());
          } else {
            userSockets.set(disconnectedUser._id.toString(), updatedSockets);
          }
        }

        // Emit user offline status
        io.emit('user_offline', {
          userId: disconnectedUser._id,
          userRole: disconnectedUser.role
        });
      }
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  });

  // Utility functions
  const getConnectedUsers = () => {
    return Array.from(connectedUsers.values());
  };

  const getUserSockets = (userId) => {
    return userSockets.get(userId.toString()) || [];
  };

  const sendToUser = (userId, event, data) => {
    const socketIds = getUserSockets(userId);
    socketIds.forEach(socketId => {
      io.to(socketId).emit(event, data);
    });
  };

  const sendToRole = (role, event, data) => {
    io.to(`role_${role}`).emit(event, data);
  };

  return {
    getConnectedUsers,
    getUserSockets,
    sendToUser,
    sendToRole
  };
}; 