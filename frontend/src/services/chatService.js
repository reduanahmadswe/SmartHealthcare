import api from './api';

export const chatService = {
  // Get chat conversations
  getConversations: async () => {
    try {
      const response = await api.get('/chat/conversations');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get messages for a conversation
  getMessages: async (conversationId) => {
    try {
      const response = await api.get(`/chat/conversations/${conversationId}/messages`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Send a message
  sendMessage: async (conversationId, message) => {
    try {
      const response = await api.post(`/chat/conversations/${conversationId}/messages`, {
        content: message
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Create new conversation
  createConversation: async (participants) => {
    try {
      const response = await api.post('/chat/conversations', {
        participants
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Delete conversation
  deleteConversation: async (conversationId) => {
    try {
      const response = await api.delete(`/chat/conversations/${conversationId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Mark message as read
  markMessageAsRead: async (messageId) => {
    try {
      const response = await api.put(`/chat/messages/${messageId}/read`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get unread message count
  getUnreadCount: async () => {
    try {
      const response = await api.get('/chat/unread-count');
      return response.data;
    } catch (error) {
      throw error;
    }
  }
}; 