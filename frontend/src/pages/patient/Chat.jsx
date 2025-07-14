import React, { useEffect, useState } from "react";
import Button from "../../components/Button";
import Card from "../../components/Card";
import Input from "../../components/Input";
import LoadingSpinner from "../../components/LoadingSpinner";
import DashboardLayout from "../../layouts/DashboardLayout";
import { chatService } from "../../services/chatService";

const Chat = () => {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation._id);
    }
  }, [selectedConversation]);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const data = await chatService.getConversations();
      setConversations(data.conversations || []);
    } catch (error) {
      console.error("Error loading conversations:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (conversationId) => {
    try {
      setLoading(true);
      const data = await chatService.getMessages(conversationId);
      setMessages(data.messages || []);
    } catch (error) {
      console.error("Error loading messages:", error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      setSending(true);
      await chatService.sendMessage(selectedConversation._id, newMessage);
      setNewMessage("");
      // Reload messages to show the new message
      await loadMessages(selectedConversation._id);
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Chat with Doctor
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Communicate with your healthcare provider
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Conversations List */}
          <Card className="lg:col-span-1">
            <Card.Header>
              <h3 className="text-lg font-semibold">Conversations</h3>
            </Card.Header>
            <Card.Content>
              {loading ? (
                <LoadingSpinner />
              ) : conversations.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                  No conversations yet
                </p>
              ) : (
                <div className="space-y-2">
                  {conversations.map((conversation) => (
                    <div
                      key={conversation._id}
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedConversation?._id === conversation._id
                          ? "bg-primary-100 dark:bg-primary-900"
                          : "hover:bg-gray-100 dark:hover:bg-gray-700"
                      }`}
                      onClick={() => setSelectedConversation(conversation)}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center text-white font-semibold">
                          {conversation.participants
                            .find((p) => p.role === "doctor")
                            ?.name?.charAt(0) || "D"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                            {conversation.participants.find(
                              (p) => p.role === "doctor"
                            )?.name || "Doctor"}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                            {conversation.lastMessage || "No messages yet"}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card.Content>
          </Card>

          {/* Chat Messages */}
          <Card className="lg:col-span-2">
            <Card.Header>
              <h3 className="text-lg font-semibold">
                {selectedConversation
                  ? `Chat with ${
                      selectedConversation.participants.find(
                        (p) => p.role === "doctor"
                      )?.name || "Doctor"
                    }`
                  : "Select a conversation"}
              </h3>
            </Card.Header>
            <Card.Content>
              {!selectedConversation ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  Select a conversation to start chatting
                </div>
              ) : (
                <div className="flex flex-col h-96">
                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                    {loading ? (
                      <LoadingSpinner />
                    ) : messages.length === 0 ? (
                      <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                        No messages yet. Start the conversation!
                      </p>
                    ) : (
                      messages.map((message) => (
                        <div
                          key={message._id}
                          className={`flex ${
                            message.sender.role === "patient"
                              ? "justify-end"
                              : "justify-start"
                          }`}
                        >
                          <div
                            className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                              message.sender.role === "patient"
                                ? "bg-primary-600 text-white"
                                : "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                            }`}
                          >
                            <p className="text-sm">{message.content}</p>
                            <p
                              className={`text-xs mt-1 ${
                                message.sender.role === "patient"
                                  ? "text-primary-200"
                                  : "text-gray-500 dark:text-gray-400"
                              }`}
                            >
                              {formatTime(message.createdAt)}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Message Input */}
                  <div className="flex space-x-2">
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Type your message..."
                      className="flex-1"
                      disabled={sending}
                    />
                    <Button
                      onClick={sendMessage}
                      disabled={!newMessage.trim() || sending}
                      loading={sending}
                    >
                      Send
                    </Button>
                  </div>
                </div>
              )}
            </Card.Content>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Chat;
