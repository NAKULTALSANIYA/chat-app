import { Server } from 'socket.io';
import { socketAuthMiddleware } from '../middlewares/authMiddleware.js';
import { chatService } from '../services/chatService.js';
import { notificationService } from '../services/notificationService.js';
import { logger } from '../utils/logger.js';

// Store online users: { userId: socketId }
const onlineUsers = new Map();
// Store typing users: { chatId: Set of userIds }
const typingUsers = new Map();

export const initializeSocketIO = (server) => {
  const io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  // Apply JWT authentication middleware
  io.use((socket, next) => {
    socketAuthMiddleware(socket, next);
  });

  io.on('connection', (socket) => {
    const userId = socket.userId;

    // Mark user as online
    onlineUsers.set(userId, socket.id);
    logger.info(`User ${userId} connected. Online users: ${onlineUsers.size}`);

    // Broadcast user is online
    socket.broadcast.emit('user_online', { userId });

    // Handle join_chat event
    socket.on('join_chat', async ({ chatId }) => {
      socket.join(`chat_${chatId}`);
      logger.info(`User ${userId} joined chat ${chatId}`);

      // Mark all messages in this chat as read for this user
      try {
        await chatService.markMessagesAsRead({ chatId, userId });
        
        // Emit read status update to sender
        io.to(`chat_${chatId}`).emit('message_status_update', {
          userId,
          status: 'read',
          chatId,
        });
      } catch (error) {
        logger.error('Error marking messages as read', error);
      }
    });

    // Handle send_message event
    socket.on('send_message', async ({ chatId, text }) => {
      try {
        // Validate and save message
        if (!text || text.trim().length === 0) {
          socket.emit('error', { message: 'Message cannot be empty' });
          return;
        }

        if (text.length > 5000) {
          socket.emit('error', { message: 'Message too long' });
          return;
        }

        const message = await chatService.saveMessage({
          chatId,
          senderId: userId,
          text,
        });

        // Emit message with status
        io.to(`chat_${chatId}`).emit('new_message', {
          id: message._id,
          chatId,
          senderId: message.senderId._id,
          senderName: message.senderId.name,
          text: message.text,
          status: message.status,
          createdAt: message.createdAt,
        });

        // Get the other member
        const otherMember = await chatService.getOtherMember(chatId, userId);
        const otherMemberId = otherMember._id.toString();
        
        // Update message status to delivered
        await chatService.markMessageAsDelivered(message._id, otherMemberId);
        
        // Emit delivered status
        io.to(`chat_${chatId}`).emit('message_status_update', {
          messageId: message._id,
          status: 'delivered',
          userId: otherMemberId,
        });

        // If other user is online, send instant notification
        if (onlineUsers.has(otherMemberId)) {
          // Send via socket for real-time updates
        } else {
          // Send push notification if offline
          await notificationService.sendMessageNotification(otherMemberId, {
            senderName: message.senderId.name,
            text: message.text,
            chatId: chatId,
            senderId: userId,
          });
        }

        // If other user is online and in the chat room, mark as read automatically
        if (onlineUsers.has(otherMemberId)) {
          await chatService.markMessagesAsRead({ 
            chatId, 
            userId: otherMemberId 
          });
          
          io.to(`chat_${chatId}`).emit('message_status_update', {
            userId: otherMemberId,
            status: 'read',
            chatId,
          });
        }
      } catch (error) {
        logger.error('Send message error', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Handle typing indicator
    socket.on('user_typing', async ({ chatId }) => {
      try {
        // Add user to typing set for this chat
        if (!typingUsers.has(chatId)) {
          typingUsers.set(chatId, new Set());
        }
        typingUsers.get(chatId).add(userId);

        // Broadcast typing status
        socket.broadcast.to(`chat_${chatId}`).emit('user_typing', {
          userId,
          chatId,
          isTyping: true,
        });

        logger.info(`User ${userId} is typing in chat ${chatId}`);
      } catch (error) {
        logger.error('Typing indicator error', error);
      }
    });

    // Handle stop typing
    socket.on('user_stop_typing', async ({ chatId }) => {
      try {
        // Remove user from typing set
        if (typingUsers.has(chatId)) {
          typingUsers.get(chatId).delete(userId);
          
          if (typingUsers.get(chatId).size === 0) {
            typingUsers.delete(chatId);
          }
        }

        // Broadcast stop typing status
        socket.broadcast.to(`chat_${chatId}`).emit('user_stop_typing', {
          userId,
          chatId,
          isTyping: false,
        });

        logger.info(`User ${userId} stopped typing in chat ${chatId}`);
      } catch (error) {
        logger.error('Stop typing error', error);
      }
    });

    // Handle message read receipt
    socket.on('message_read', async ({ chatId, messageIds }) => {
      try {
        await chatService.markMessagesAsRead({ 
          chatId, 
          userId,
          messageIds 
        });

        io.to(`chat_${chatId}`).emit('message_status_update', {
          userId,
          status: 'read',
          messageIds,
          chatId,
        });

        logger.info(`Messages marked as read by user ${userId} in chat ${chatId}`);
      } catch (error) {
        logger.error('Message read error', error);
      }
    });

    // Handle leave_chat event
    socket.on('leave_chat', ({ chatId }) => {
      socket.leave(`chat_${chatId}`);
      
      // Remove from typing users
      if (typingUsers.has(chatId)) {
        typingUsers.get(chatId).delete(userId);
        if (typingUsers.get(chatId).size === 0) {
          typingUsers.delete(chatId);
        }
      }
      
      logger.info(`User ${userId} left chat ${chatId}`);
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      onlineUsers.delete(userId);
      
      // Clean up typing users across all chats
      for (const [chatId, typingSet] of typingUsers.entries()) {
        if (typingSet.has(userId)) {
          typingSet.delete(userId);
          if (typingSet.size === 0) {
            typingUsers.delete(chatId);
          }
        }
      }
      
      logger.info(`User ${userId} disconnected. Online users: ${onlineUsers.size}`);
      socket.broadcast.emit('user_offline', { userId });
    });

    // Handle reconnection
    socket.on('reconnect', () => {
      onlineUsers.set(userId, socket.id);
      logger.info(`User ${userId} reconnected. Online users: ${onlineUsers.size}`);
      socket.broadcast.emit('user_online', { userId });
    });
  });

  return io;
};

export const getOnlineUsers = () => {
  return Array.from(onlineUsers.keys());
};

export const isUserOnline = (userId) => {
  return onlineUsers.has(userId);
};

export const getTypingUsers = (chatId) => {
  return typingUsers.has(chatId) ? Array.from(typingUsers.get(chatId)) : [];
};
