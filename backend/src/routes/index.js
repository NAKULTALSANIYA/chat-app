import { Router } from 'express';
import {
  registerController,
  loginController,
  getMeController,
  searchUserByEmailController,
} from '../controllers/authController.js';
import {
  registerSchema,
  loginSchema,
  validateRequest,
  chatSchema,
} from '../middlewares/validationMiddleware.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import {
  createOrFetchChatController,
  getUserChatsController,
  getChatMessagesController,
  markMessagesAsReadController,
  getUnreadCountController,
} from '../controllers/chatController.js';
import {
  registerFcmToken,
  revokeFcmToken,
  sendTestNotification,
} from '../controllers/notificationController.js';

const router = Router();

// Auth routes
router.post('/auth/register', validateRequest(registerSchema), registerController);
router.post('/auth/login', validateRequest(loginSchema), loginController);
router.get('/auth/me', authMiddleware, getMeController);
router.get('/auth/search', authMiddleware, searchUserByEmailController);

// Chat routes
router.post('/chats', authMiddleware, validateRequest(chatSchema), createOrFetchChatController);
router.get('/chats', authMiddleware, getUserChatsController);
router.get('/messages/:chatId', authMiddleware, getChatMessagesController);
router.put('/chats/:chatId/read', authMiddleware, markMessagesAsReadController);
router.get('/unread', authMiddleware, getUnreadCountController);

// Notification routes
router.post('/notifications/register-token', authMiddleware, registerFcmToken);
router.post('/notifications/revoke-token', authMiddleware, revokeFcmToken);
router.post('/notifications/test', authMiddleware, sendTestNotification);

export default router;
