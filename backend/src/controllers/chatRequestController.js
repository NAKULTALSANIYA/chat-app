import { ChatRequest } from '../models/chatRequestModel.js';
import { User } from '../models/userModel.js';
import { Chat } from '../models/chatModel.js';
import { sendPushNotification } from '../services/notificationService.js';

export const sendChatRequest = async (req, res) => {
  try {
    const senderId = req.userId;
    const { receiverEmail } = req.body;

    if (!receiverEmail) {
      return res.status(400).json({ message: 'Receiver email is required' });
    }

    const receiver = await User.findOne({ email: receiverEmail.toLowerCase().trim() });
    if (!receiver) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (receiver._id.toString() === senderId) {
      return res.status(400).json({ message: 'Cannot send request to yourself' });
    }

    // Check if chat already exists
    const existingChat = await Chat.findOne({
      members: { $all: [senderId, receiver._id] },
    });

    if (existingChat) {
      return res.status(400).json({ message: 'Chat already exists with this user' });
    }

    // Check if request already exists
    const existingRequest = await ChatRequest.findOne({
      senderId,
      receiverId: receiver._id,
    });

    if (existingRequest) {
      if (existingRequest.status === 'pending') {
        return res.status(400).json({ message: 'Request already sent' });
      }
      // Update existing rejected request to pending
      existingRequest.status = 'pending';
      await existingRequest.save();
    } else {
      // Create new request
      await ChatRequest.create({
        senderId,
        receiverId: receiver._id,
        status: 'pending',
      });
    }

    const sender = await User.findById(senderId);

    // Send push notification to receiver
    if (receiver.fcmToken) {
      await sendPushNotification(receiver._id, {
        title: 'New chat request',
        body: `${sender.name} sent you a chat request`,
        data: {
          type: 'chat_request',
          senderId: senderId.toString(),
          senderName: sender.name,
        },
      });
    }

    // Emit socket event (handled by socket service)
    const io = req.app.get('io');
    if (io) {
      io.to(receiver._id.toString()).emit('new_chat_request', {
        requestId: existingRequest?._id.toString() || 'new',
        senderId: sender._id.toString(),
        senderName: sender.name,
        senderEmail: sender.email,
      });
    }

    res.status(201).json({
      message: 'Chat request sent successfully',
      request: {
        receiverId: receiver._id,
        receiverName: receiver.name,
        receiverEmail: receiver.email,
        status: 'pending',
      },
    });
  } catch (error) {
    console.error('Send chat request error:', error);
    res.status(500).json({ message: 'Failed to send chat request' });
  }
};

export const acceptChatRequest = async (req, res) => {
  try {
    const userId = req.userId;
    const { requestId } = req.params;

    const request = await ChatRequest.findById(requestId).populate('senderId', 'name email');

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    if (request.receiverId.toString() !== userId) {
      return res.status(403).json({ message: 'Not authorized to accept this request' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'Request already processed' });
    }

    // Update request status
    request.status = 'accepted';
    await request.save();

    // Create or fetch chat
    let chat = await Chat.findOne({
      members: { $all: [request.senderId._id, request.receiverId] },
    });

    if (!chat) {
      chat = await Chat.create({
        members: [request.senderId._id, request.receiverId],
      });
    }

    // Populate members
    chat = await Chat.findById(chat._id).populate('members', 'name email');

    // Notify sender that request was accepted
    const sender = await User.findById(request.senderId._id);
    const receiver = await User.findById(userId);

    if (sender.fcmToken) {
      await sendPushNotification(sender._id, {
        title: 'Request accepted',
        body: `${receiver.name} accepted your chat request`,
        data: {
          type: 'request_accepted',
          chatId: chat._id.toString(),
        },
      });
    }

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.to(sender._id.toString()).emit('request_accepted', {
        requestId: request._id.toString(),
        chatId: chat._id.toString(),
        acceptedBy: receiver.name,
      });
    }

    res.json({
      message: 'Request accepted',
      chat,
    });
  } catch (error) {
    console.error('Accept chat request error:', error);
    res.status(500).json({ message: 'Failed to accept request' });
  }
};

export const rejectChatRequest = async (req, res) => {
  try {
    const userId = req.userId;
    const { requestId } = req.params;

    const request = await ChatRequest.findById(requestId);

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    if (request.receiverId.toString() !== userId) {
      return res.status(403).json({ message: 'Not authorized to reject this request' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'Request already processed' });
    }

    request.status = 'rejected';
    await request.save();

    res.json({ message: 'Request rejected' });
  } catch (error) {
    console.error('Reject chat request error:', error);
    res.status(500).json({ message: 'Failed to reject request' });
  }
};

export const getIncomingRequests = async (req, res) => {
  try {
    const userId = req.userId;

    const requests = await ChatRequest.find({
      receiverId: userId,
      status: 'pending',
    })
      .populate('senderId', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      requests: requests.map((r) => ({
        id: r._id,
        senderId: r.senderId._id,
        senderName: r.senderId.name,
        senderEmail: r.senderId.email,
        status: r.status,
        createdAt: r.createdAt,
        isIncoming: true,
      })),
    });
  } catch (error) {
    console.error('Get incoming requests error:', error);
    res.status(500).json({ message: 'Failed to fetch requests' });
  }
};

export const getSentRequests = async (req, res) => {
  try {
    const userId = req.userId;

    const requests = await ChatRequest.find({
      senderId: userId,
    })
      .populate('receiverId', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      requests: requests.map((r) => ({
        id: r._id,
        targetUserId: r.receiverId._id,
        targetName: r.receiverId.name,
        targetEmail: r.receiverId.email,
        status: r.status,
        createdAt: r.createdAt,
        isIncoming: false,
      })),
    });
  } catch (error) {
    console.error('Get sent requests error:', error);
    res.status(500).json({ message: 'Failed to fetch sent requests' });
  }
};

export const getAllRequests = async (req, res) => {
  try {
    const userId = req.userId;

    const [incoming, sent] = await Promise.all([
      ChatRequest.find({ receiverId: userId, status: 'pending' })
        .populate('senderId', 'name email')
        .sort({ createdAt: -1 }),
      ChatRequest.find({ senderId: userId })
        .populate('receiverId', 'name email')
        .sort({ createdAt: -1 }),
    ]);

    const allRequests = [
      ...incoming.map((r) => ({
        id: r._id,
        targetUserId: r.senderId._id,
        targetName: r.senderId.name,
        targetEmail: r.senderId.email,
        status: r.status,
        createdAt: r.createdAt,
        isIncoming: true,
      })),
      ...sent.map((r) => ({
        id: r._id,
        targetUserId: r.receiverId._id,
        targetName: r.receiverId.name,
        targetEmail: r.receiverId.email,
        status: r.status,
        createdAt: r.createdAt,
        isIncoming: false,
      })),
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({ requests: allRequests });
  } catch (error) {
    console.error('Get all requests error:', error);
    res.status(500).json({ message: 'Failed to fetch requests' });
  }
};
