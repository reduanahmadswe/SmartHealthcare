import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import React from 'react';

const Chat = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div className="flex items-center">
        <ChatBubbleLeftRightIcon className="h-8 w-8 text-primary-600 mr-3" />
        <h1 className="text-2xl font-bold text-gray-900">Chat with Doctor</h1>
      </div>
      
      <div className="card p-8 text-center">
        <ChatBubbleLeftRightIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Real-time Chat
        </h2>
        <p className="text-gray-600 mb-6">
          Communicate directly with your healthcare providers.
        </p>
        <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
          <p>Features to be implemented:</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Real-time messaging with Socket.io</li>
            <li>Doctor selection and availability</li>
            <li>File and image sharing</li>
            <li>Message history and search</li>
            <li>Voice and video call integration</li>
            <li>Chat notifications and alerts</li>
          </ul>
        </div>
      </div>
    </motion.div>
  );
};

export default Chat; 