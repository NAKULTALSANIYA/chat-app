import mongoose from 'mongoose';
import { Chat } from '../models/chatModel.js';
import { Message } from '../models/messageModel.js';
import { logger } from '../utils/logger.js';

export const chatService = {
  async getOrCreateChat({ userId, memberId }) {
    if (userId === memberId) {
      throw new Error('Cannot create chat with yourself');
    }

    // Check if chat already exists between these two users
    let chat = await Chat.findOne({
      members: { $all: [userId, memberId] },
    })
      .populate('members', 'name email')
      .lean();

    if (!chat) {
      // Create new chat
      chat = new Chat({
        members: [userId, memberId],
      });
      await chat.save();
      await chat.populate('members', 'name email');
    }

    return chat;
  },

  async getUserChats(userId) {
    const chats = await Chat.find({ members: userId })
      .populate('members', 'name email')
      .sort({ updatedAt: -1 });

    // Get unread counts for each chat
    const chatsWithUnread = await Promise.all(
      chats.map(async (chat) => {
        const unreadCount = await Message.countDocuments({
          chatId: chat._id,
          senderId: { $ne: userId },
          readBy: { $ne: userId },
        });

        return {
          ...chat.toObject(),
          unreadCount,
        };
      })
    );

    return chatsWithUnread;
  },

  async getChatMessages(chatId, userId, page = 1, limit = 50) {
    // Verify user is a member of the chat
    const chat = await Chat.findById(chatId);

    if (!chat) {
      throw new Error('Chat not found');
    }

    const isMember = chat.members.some((id) => id.toString() === userId.toString());

    if (!isMember) {
      throw new Error('Unauthorized: Not a member of this chat');
    }

    const skip = (page - 1) * limit;

    const messages = await Message.find({ chatId })
      .populate('senderId', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Message.countDocuments({ chatId });

    return {
      messages: messages.reverse(), // Reverse to get chronological order
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  },

  async saveMessage({ chatId, senderId, text }) {
    // Verify chat and user membership
    const chat = await Chat.findById(chatId);

    if (!chat) {
      throw new Error('Chat not found');
    }

    const isMember = chat.members.some((id) => id.toString() === senderId.toString());

    if (!isMember) {
      throw new Error('Unauthorized: Not a member of this chat');
    }

    // Create message (sender auto-marked as read)
    const message = new Message({
      chatId,
      senderId,
      text: text.trim(),
      readBy: [senderId],
    });

    await message.save();

    // Update chat's last message
    await Chat.findByIdAndUpdate(chatId, {
      lastMessage: text.trim(),
      lastMessageAt: new Date(),
    });

    // Populate and return
    await message.populate('senderId', 'name email');

    return message;
  },

  async markMessagesAsRead({ chatId, userId }) {
    const result = await Message.updateMany(
      {
        chatId,
        senderId: { $ne: userId },
        readBy: { $ne: userId },
      },
      {
        $addToSet: { readBy: userId },
      }
    );

    return result;
  },

  async getUnreadCount(userId) {
    const count = await Message.countDocuments({
      senderId: { $ne: userId },
      readBy: { $ne: userId },
    });

    // Also get chat IDs with unread messages
    const chats = await Chat.find({ members: userId });
    const unreadByChat = await Promise.all(
      chats.map(async (chat) => {
        const unreadCount = await Message.countDocuments({
          chatId: chat._id,
          senderId: { $ne: userId },
          readBy: { $ne: userId },
        });
        return { chatId: chat._id, unreadCount };
      })
    );

    return {
      total: count,
      byChat: unreadByChat.filter((c) => c.unreadCount > 0),
    };
  },

  async getOtherMember(chatId, userId) {
    const chat = await Chat.findById(chatId).populate('members', 'name email _id');

    if (!chat) {
      throw new Error('Chat not found');
    }

    const otherMember = chat.members.find((m) => m._id.toString() !== userId.toString());

    if (!otherMember) {
      throw new Error('Other member not found');
    }

    return otherMember;
  },

  async markMessageAsDelivered(messageId, userId) {
    const result = await Message.findByIdAndUpdate(
      messageId,
      {
        $addToSet: { deliveredTo: userId },
        $set: { status: 'delivered' },
      },
      { new: true }
    );
    return result;
  },

  async markMessagesAsReadAdvanced({ chatId, userId, messageIds }) {
    let query = {
      chatId,
      senderId: { $ne: userId },
      readBy: { $ne: userId },
    };

    // If specific message IDs provided, filter by them
    if (messageIds && messageIds.length > 0) {
      query._id = { $in: messageIds };
    }

    const result = await Message.updateMany(query, {
      $addToSet: { readBy: userId },
      $set: { status: 'read' },
    });

    return result;
  },

  async getMessageStatus(messageId) {
    const message = await Message.findById(messageId)
      .populate('deliveredTo', 'name _id')
      .populate('readBy', 'name _id');

    if (!message) {
      throw new Error('Message not found');
    }

    return {
      id: message._id,
      status: message.status,
      deliveredTo: message.deliveredTo,
      readBy: message.readBy,
      createdAt: message.createdAt,
    };
  },
};
