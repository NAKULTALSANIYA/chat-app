import admin from 'firebase-admin';
import { User } from '../models/userModel.js';
import { logger } from '../utils/logger.js';

// Initialize Firebase Admin (requires FIREBASE_SERVICE_ACCOUNT_KEY env variable)
let isFirebaseInitialized = false;

export const initializeFirebase = () => {
  if (isFirebaseInitialized) return;

  try {
    if (!process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      logger.warn('Firebase service account key not configured. Push notifications disabled.');
      return;
    }

    const rawKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY.trim();
    let serviceAccount;

    // Support either plain JSON string or base64-encoded JSON in env
    try {
      serviceAccount = JSON.parse(rawKey);
    } catch (jsonErr) {
      try {
        const decoded = Buffer.from(rawKey, 'base64').toString('utf-8');
        serviceAccount = JSON.parse(decoded);
      } catch (decodeErr) {
        logger.error('Invalid FIREBASE_SERVICE_ACCOUNT_KEY format. Provide JSON or base64-encoded JSON.');
        return;
      }
    }

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });

    isFirebaseInitialized = true;
    logger.info('Firebase Admin initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize Firebase Admin', error);
  }
};

/**
 * Send push notification to a user
 * @param {string} userId - The user to notify
 * @param {object} notification - { title, body, data }
 */
export const sendPushNotification = async (userId, notification) => {
  if (!isFirebaseInitialized) {
    logger.warn('Firebase not initialized. Skipping notification.');
    return;
  }

  try {
    const user = await User.findById(userId);
    if (!user || !user.fcmToken) {
      logger.warn(`No FCM token found for user ${userId}`);
      return;
    }

    const message = {
      notification: {
        title: notification.title,
        body: notification.body,
      },
      data: {
        ...notification.data,
        timestamp: new Date().toISOString(),
      },
      token: user.fcmToken,
    };

    const response = await admin.messaging().send(message);
    logger.info(`Push notification sent to ${userId}: ${response}`);
    return response;
  } catch (error) {
    logger.error(`Failed to send notification to ${userId}`, error);
  }
};

/**
 * Send message notification
 * @param {string} recipientId - User receiving the message
 * @param {object} messageData - { senderName, text, chatId }
 */
export const sendMessageNotification = async (recipientId, messageData) => {
  const notification = {
    title: messageData.senderName,
    body: messageData.text.substring(0, 100),
    data: {
      type: 'new_message',
      chatId: messageData.chatId,
      senderId: messageData.senderId,
    },
  };

  return await sendPushNotification(recipientId, notification);
};

/**
 * Send typing indicator notification
 * @param {string} recipientId - User who should be notified
 * @param {object} typingData - { senderName, isTyping, chatId }
 */
export const sendTypingNotification = async (recipientId, typingData) => {
  if (!isFirebaseInitialized) return;

  try {
    const user = await User.findById(recipientId);
    if (!user || !user.fcmToken) return;

    const message = {
      data: {
        type: 'typing',
        senderName: typingData.senderName,
        isTyping: typingData.isTyping.toString(),
        chatId: typingData.chatId,
        timestamp: new Date().toISOString(),
      },
      token: user.fcmToken,
    };

    await admin.messaging().send(message);
  } catch (error) {
    logger.error(`Failed to send typing notification to ${recipientId}`, error);
  }
};

/**
 * Multicast: Send notification to multiple users
 * @param {array} userIds - Array of user IDs
 * @param {object} notification - Notification object
 */
export const sendMulticastNotification = async (userIds, notification) => {
  if (!isFirebaseInitialized) return;

  try {
    const users = await User.find({ _id: { $in: userIds } });
    const tokens = users
      .filter((user) => user.fcmToken)
      .map((user) => user.fcmToken);

    if (tokens.length === 0) {
      logger.warn('No FCM tokens found for users');
      return;
    }

    const message = {
      notification: {
        title: notification.title,
        body: notification.body,
      },
      data: {
        ...notification.data,
        timestamp: new Date().toISOString(),
      },
    };

    const response = await admin.messaging().sendMulticast({
      ...message,
      tokens,
    });

    logger.info(`Multicast notification sent to ${response.successCount} users`);
    return response;
  } catch (error) {
    logger.error('Failed to send multicast notification', error);
  }
};

/**
 * Update FCM token for a user
 * @param {string} userId - User ID
 * @param {string} fcmToken - New FCM token
 */
export const updateFcmToken = async (userId, fcmToken) => {
  try {
    const user = await User.findByIdAndUpdate(
      userId,
      { fcmToken },
      { new: true }
    );
    logger.info(`FCM token updated for user ${userId}`);
    return user;
  } catch (error) {
    logger.error(`Failed to update FCM token for ${userId}`, error);
    throw error;
  }
};

/**
 * Revoke FCM token (user logged out)
 * @param {string} userId - User ID
 */
export const revokeFcmToken = async (userId) => {
  try {
    await User.findByIdAndUpdate(userId, { $unset: { fcmToken: 1 } });
    logger.info(`FCM token revoked for user ${userId}`);
  } catch (error) {
    logger.error(`Failed to revoke FCM token for ${userId}`, error);
  }
};

export const notificationService = {
  sendPushNotification,
  sendMessageNotification,
  sendTypingNotification,
  sendMulticastNotification,
  updateFcmToken,
  revokeFcmToken,
  initializeFirebase,
};
