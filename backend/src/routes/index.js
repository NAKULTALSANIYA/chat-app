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
import {
  sendChatRequest,
  acceptChatRequest,
  rejectChatRequest,
  getIncomingRequests,
  getSentRequests,
  getAllRequests,
} from '../controllers/chatRequestController.js';

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

// Chat Request routes
router.post('/chat-requests', authMiddleware, sendChatRequest);
router.post('/chat-requests/:requestId/accept', authMiddleware, acceptChatRequest);
router.post('/chat-requests/:requestId/reject', authMiddleware, rejectChatRequest);
router.get('/chat-requests/incoming', authMiddleware, getIncomingRequests);
router.get('/chat-requests/sent', authMiddleware, getSentRequests);
router.get('/chat-requests', authMiddleware, getAllRequests);

export default router;
