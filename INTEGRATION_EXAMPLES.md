// Example: How to integrate notifications in your existing chat UI

// ============================================================================
// BACKEND EXAMPLE - Socket Service Usage
// ============================================================================

// In your socketService.js (already updated), the flow is:
// 1. User sends message → message saved with status: 'sent'
// 2. Socket emits 'new_message' with status
// 3. Recipient's socket updates status to 'delivered'
// 4. Push notification sent if recipient is offline
// 5. Typing indicators tracked in real-time

// Example usage in chat controller:
async function sendMessage(req, res) {
  const { chatId, text } = req.body;
  const userId = req.user.id;

  // Message saved with status: 'sent'
  const message = await chatService.saveMessage({
    chatId,
    senderId: userId,
    text,
  });

  // Socket service handles:
  // - Broadcasting to chat room
  // - Updating status to 'delivered'
  // - Sending push notification if offline

  res.json(message);
}

// ============================================================================
// FLUTTER EXAMPLE - Complete Chat Screen Integration
// ============================================================================

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:chat_app/services/socket_service.dart';
import 'package:chat_app/services/notification_service.dart';
import 'package:chat_app/widgets/notification_widgets.dart';

class ChatScreen extends ConsumerStatefulWidget {
  final String chatId;

  const ChatScreen({required this.chatId});

  @override
  ConsumerState<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends ConsumerState<ChatScreen> {
  final TextEditingController _messageController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  
  // Track typing state
  final Set<String> _typingUsers = {};
  bool _isUserTyping = false;
  DateTime? _lastTypingEvent;

  @override
  void initState() {
    super.initState();
    _setupSocketListeners();
    // Join chat room
    ref.read(socketServiceProvider).emit('join_chat', {'chatId': widget.chatId});
  }

  void _setupSocketListeners() {
    final socket = ref.read(socketServiceProvider);

    // Listen for new messages
    socket.on('new_message', (data) {
      // Message received with status: 'sent'
      setState(() {
        // Add message to list
        // Message status will be updated when delivered/read
      });
      _scrollToBottom();
    });

    // Listen for typing indicators
    socket.on('user_typing', (data) {
      setState(() {
        _typingUsers.add(data['userId']);
      });
    });

    socket.on('user_stop_typing', (data) {
      setState(() {
        _typingUsers.remove(data['userId']);
      });
    });

    // Listen for message status updates
    socket.on('message_status_update', (data) {
      setState(() {
        // Update message status in your message list
        // data['status']: 'delivered' or 'read'
        // data['messageId']: the message to update
      });
    });
  }

  void _handleTyping() {
    // Emit typing event only once per second
    final now = DateTime.now();
    if (_lastTypingEvent == null ||
        now.difference(_lastTypingEvent!) > Duration(seconds: 1)) {
      ref.read(socketServiceProvider).emit('user_typing', {
        'chatId': widget.chatId,
      });
      _lastTypingEvent = now;
    }

    // Mark that user was typing (for auto-stop-typing)
    _isUserTyping = true;
  }

  void _sendMessage() {
    final text = _messageController.text.trim();
    if (text.isEmpty) return;

    // Stop typing indicator before sending
    ref.read(socketServiceProvider).emit('user_stop_typing', {
      'chatId': widget.chatId,
    });
    _isUserTyping = false;

    // Send message via socket
    ref.read(socketServiceProvider).emit('send_message', {
      'chatId': widget.chatId,
      'text': text,
    });

    _messageController.clear();
  }

  void _scrollToBottom() {
    if (_scrollController.hasClients) {
      _scrollController.animateTo(
        _scrollController.position.maxScrollExtent,
        duration: Duration(milliseconds: 300),
        curve: Curves.easeOut,
      );
    }
  }

  @override
  void dispose() {
    ref.read(socketServiceProvider).emit('leave_chat', {
      'chatId': widget.chatId,
    });
    _messageController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Chat'),
      ),
      body: Column(
        children: [
          // Messages list
          Expanded(
            child: ListView.builder(
              controller: _scrollController,
              itemBuilder: (context, index) {
                // Your message widget with status indicator
                return _buildMessageBubble(
                  message: messages[index],
                );
              },
            ),
          ),

          // Typing indicator
          if (_typingUsers.isNotEmpty)
            InlineTypingIndicator(
              typingUsers: _typingUsers.toList(),
            ),

          // Message input
          Padding(
            padding: EdgeInsets.all(8.0),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _messageController,
                    onChanged: (_) => _handleTyping(),
                    decoration: InputDecoration(
                      hintText: 'Type a message...',
                      border: OutlineInputBorder(),
                    ),
                  ),
                ),
                SizedBox(width: 8),
                FloatingActionButton(
                  onPressed: _sendMessage,
                  child: Icon(Icons.send),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMessageBubble({required Map<String, dynamic> message}) {
    final isSentByMe = message['senderId'] == currentUserId;

    return Align(
      alignment: isSentByMe ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: EdgeInsets.all(8),
        padding: EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: isSentByMe ? Colors.blue : Colors.grey[300],
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Flexible(
              child: Text(
                message['text'],
                style: TextStyle(
                  color: isSentByMe ? Colors.white : Colors.black,
                ),
              ),
            ),
            if (isSentByMe) ...[
              SizedBox(width: 4),
              MessageStatusIndicator(
                status: message['status'], // 'sent', 'delivered', 'read'
                readColor: Colors.blue,
              ),
            ],
          ],
        ),
      );
    );
  }
}

// ============================================================================
// FLUTTER EXAMPLE - Chat List with Unread Badges
// ============================================================================

class ChatListScreen extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final chats = ref.watch(userChatsProvider);

    return Scaffold(
      appBar: AppBar(title: Text('Chats')),
      body: chats.when(
        data: (chatList) => ListView.builder(
          itemCount: chatList.length,
          itemBuilder: (context, index) {
            final chat = chatList[index];
            return ListTile(
              title: Text(chat['members'][0]['name']),
              subtitle: Text(chat['lastMessage'] ?? 'No messages'),
              trailing: UnreadBadge(
                count: chat['unreadCount'] ?? 0,
              ),
              onTap: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (_) => ChatScreen(chatId: chat['id']),
                  ),
                );
              },
            );
          },
        ),
        loading: () => Center(child: CircularProgressIndicator()),
        error: (err, stack) => Center(child: Text('Error: $err')),
      ),
    );
  }
}

// ============================================================================
// FLUTTER EXAMPLE - Initialize Notifications in main.dart
// ============================================================================

import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:chat_app/services/notification_service.dart';
import 'firebase_options.dart'; // Auto-generated by Firebase CLI

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Initialize Firebase
  await Firebase.initializeApp(
    options: DefaultFirebaseOptions.currentPlatform,
  );

  // Initialize notifications
  final notificationService = NotificationService();
  await notificationService.initialize();

  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Chat App',
      theme: ThemeData(primarySwatch: Colors.blue),
      home: ChatListScreen(),
    );
  }
}

// ============================================================================
// BACKEND EXAMPLE - Update User Model (Add fcmToken)
// ============================================================================

// In src/models/userModel.js, add to schema:
const userSchema = new mongoose.Schema(
  {
    // ... existing fields ...
    fcmToken: {
      type: String,
      default: null,
      index: true,
    },
  },
  { timestamps: true }
);

// ============================================================================
// BACKEND EXAMPLE - .env Configuration
// ============================================================================

/*
# Firebase Cloud Messaging
FIREBASE_SERVICE_ACCOUNT_KEY='{"type":"service_account","project_id":"your-project","private_key":"-----BEGIN PRIVATE KEY-----\n...","client_email":"firebase-adminsdk-...@your-project.iam.gserviceaccount.com"}'

# Or use file path:
FIREBASE_SERVICE_ACCOUNT_PATH=/path/to/service-account-key.json
*/

// ============================================================================
// TESTING - Curl Commands
// ============================================================================

/*
# 1. Register FCM Token
curl -X POST http://localhost:3000/api/notifications/register-token \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"fcmToken":"eGt......"}'

# 2. Send Test Notification
curl -X POST http://localhost:3000/api/notifications/test \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","body":"This is a test notification"}'

# 3. Revoke Token (Logout)
curl -X POST http://localhost:3000/api/notifications/revoke-token \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
*/
