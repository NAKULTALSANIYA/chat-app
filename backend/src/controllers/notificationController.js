import { notificationService } from '../services/notificationService.js';
import { logger } from '../utils/logger.js';

/**
 * Register FCM token for push notifications
 * POST /api/notifications/register-token
 */
export const registerFcmToken = async (req, res) => {
  try {
    const { fcmToken } = req.body;
    const userId = req.user.id;

    if (!fcmToken) {
      return res.status(400).json({ message: 'FCM token is required' });
    }

    const user = await notificationService.updateFcmToken(userId, fcmToken);

    res.status(200).json({
      message: 'FCM token registered successfully',
      user,
    });
  } catch (error) {
    logger.error('Error registering FCM token', error);
    res.status(500).json({ message: 'Failed to register FCM token' });
  }
};

/**
 * Revoke FCM token (logout)
 * POST /api/notifications/revoke-token
 */
export const revokeFcmToken = async (req, res) => {
  try {
    const userId = req.user.id;

    await notificationService.revokeFcmToken(userId);

    res.status(200).json({ message: 'FCM token revoked successfully' });
  } catch (error) {
    logger.error('Error revoking FCM token', error);
    res.status(500).json({ message: 'Failed to revoke FCM token' });
  }
};

/**
 * Test notification
 * POST /api/notifications/test
 */
export const sendTestNotification = async (req, res) => {
  try {
    const userId = req.user.id;
    const { title, body } = req.body;

    if (!title || !body) {
      return res.status(400).json({ message: 'Title and body are required' });
    }

    const response = await notificationService.sendPushNotification(userId, {
      title,
      body,
      data: { type: 'test' },
    });

    res.status(200).json({
      message: 'Test notification sent successfully',
      response,
    });
  } catch (error) {
    logger.error('Error sending test notification', error);
    res.status(500).json({ message: 'Failed to send test notification' });
  }
};

export const notificationController = {
  registerFcmToken,
  revokeFcmToken,
  sendTestNotification,
};
