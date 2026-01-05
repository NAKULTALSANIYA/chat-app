import { chatService } from '../services/chatService.js';
import { logger } from '../utils/logger.js';

export const createOrFetchChatController = async (req, res) => {
  try {
    const { memberId } = req.validatedData;
    const userId = req.userId;

    const chat = await chatService.getOrCreateChat({ userId, memberId });

    res.status(200).json({
      message: 'Chat fetched or created',
      chat,
    });
  } catch (error) {
    logger.error('Create/fetch chat error', error);
    if (error.message.includes('yourself')) {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Failed to create/fetch chat' });
  }
};

export const getUserChatsController = async (req, res) => {
  try {
    const userId = req.userId;

    const chats = await chatService.getUserChats(userId);

    res.status(200).json({
      chats,
      count: chats.length,
    });
  } catch (error) {
    logger.error('Get chats error', error);
    res.status(500).json({ message: 'Failed to fetch chats' });
  }
};
export const markMessagesAsReadController = async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.userId;

    const result = await chatService.markMessagesAsRead({ chatId, userId });

    res.status(200).json({
      message: 'Messages marked as read',
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    logger.error('Mark as read error', error);
    res.status(500).json({ message: 'Failed to mark messages as read' });
  }
};

export const getUnreadCountController = async (req, res) => {
  try {
    const userId = req.userId;

    const unreadData = await chatService.getUnreadCount(userId);

    res.status(200).json(unreadData);
  } catch (error) {
    logger.error('Get unread count error', error);
    res.status(500).json({ message: 'Failed to get unread count' });
  }
};
export const getChatMessagesController = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const userId = req.userId;

    const result = await chatService.getChatMessages(chatId, userId, parseInt(page), parseInt(limit));

    res.status(200).json(result);
  } catch (error) {
    logger.error('Get messages error', error);
    if (error.message.includes('Unauthorized')) {
      return res.status(403).json({ message: error.message });
    }
    if (error.message.includes('not found')) {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: 'Failed to fetch messages' });
  }
};