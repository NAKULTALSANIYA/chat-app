# WhatsApp Notifications - Architecture & Data Flow

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         FLUTTER APP                             │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ Notification Service                                      │ │
│  │ • Initialize FCM                                          │ │
│  │ • Register/Revoke tokens                                  │ │
│  │ • Handle push messages                                    │ │
│  └───────────────────────────────────────────────────────────┘ │
│                            │                                    │
│                            ├─→ API Service (REST)              │
│                            ├─→ Socket Service (WebSocket)      │
│                            └─→ UI Widgets                      │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ UI Widgets                                                │ │
│  │ • TypingIndicator                                         │ │
│  │ • MessageStatusIndicator (✓ ✓✓ ✓✓)                       │ │
│  │ • UnreadBadge                                             │ │
│  │ • InlineTypingIndicator                                  │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
        ▲                                      ▲
        │ REST API (Token Mgmt)               │ WebSocket (Real-time)
        │                                      │
        │                                      │
┌───────┴──────────────────────────────────────┴──────────────────┐
│                      BACKEND (Node.js)                           │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ REST API Endpoints                                         │ │
│  │ POST /api/notifications/register-token                     │ │
│  │ POST /api/notifications/revoke-token                       │ │
│  │ POST /api/notifications/test                               │ │
│  └────────────────────────────────────────────────────────────┘ │
│                              ▲                                   │
│                              │                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ NotificationController                                     │ │
│  │ • registerFcmToken()                                       │ │
│  │ • revokeFcmToken()                                         │ │
│  │ • sendTestNotification()                                   │ │
│  └────────────────────────────────────────────────────────────┘ │
│                              │                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ NotificationService (Firebase Admin SDK)                   │ │
│  │ • initializeFirebase()                                     │ │
│  │ • sendPushNotification()                                   │ │
│  │ • sendMessageNotification()                                │ │
│  │ • sendTypingNotification()                                 │ │
│  │ • sendMulticastNotification()                              │ │
│  │ • updateFcmToken()                                         │ │
│  │ • revokeFcmToken()                                         │ │
│  └────────────────────────────────────────────────────────────┘ │
│         │                    │                    │              │
│         └────────────────────┼────────────────────┘              │
│                              │                                   │
│                              ▼                                   │
│                    Firebase Cloud Messaging                      │
│                              │                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Socket.IO Server (Real-time Events)                        │ │
│  │ Events:                                                    │ │
│  │ • user_typing / user_stop_typing                           │ │
│  │ • message_read                                             │ │
│  │ • message_status_update                                    │ │
│  │ • new_message (with status)                                │ │
│  │ • user_online / user_offline                               │ │
│  └────────────────────────────────────────────────────────────┘ │
│                              │                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ ChatService                                                │ │
│  │ • markMessageAsDelivered()                                 │ │
│  │ • markMessagesAsReadAdvanced()                             │ │
│  │ • getMessageStatus()                                       │ │
│  │ • saveMessage()                                            │ │
│  └────────────────────────────────────────────────────────────┘ │
│                              │                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Database (MongoDB)                                         │ │
│  │ • User (+ fcmToken)                                        │ │
│  │ • Message (+ status, deliveredTo)                          │ │
│  │ • Chat                                                     │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## 📊 Message Status Flow Diagram

```
┌─────────┐
│ User A  │
└────┬────┘
     │ send_message
     │ {chatId, text}
     ▼
┌─────────────────┐
│ Backend saves   │
│ status: 'sent'  │
└────┬────────────┘
     │
     │ new_message event (status: sent)
     ├──────────────────┐
     ▼                  ▼
┌─────────┐         ┌─────────┐
│ User A  │         │ User B  │
│ (emit)  │         │ (socket)│
└─────────┘         └────┬────┘
                         │
                    receive message
                         │
                    mark as delivered
                         │
                    update DB
                         │
                    emit status:delivered
                         │
                         ▼
                    ┌───────────────┐
                    │ User opens    │
                    │ chat screen   │
                    └───────┬───────┘
                            │
                       join_chat event
                            │
                     markMessagesAsRead()
                            │
                     status: read
                            │
                    emit message_read
                            │
                            ▼
                    ┌──────────────┐
                    │ Status ✓✓    │
                    │ (blue color) │
                    └──────────────┘
```

---

## ⌨️ Typing Indicator Flow

```
User types in message box
        │
        ▼
emit 'user_typing' (max once per second)
        │
        ▼
┌──────────────────┐
│ Server broadcasts│
│ to chat room     │
└────────┬─────────┘
         │
    ┌────┴────┐
    ▼         ▼
User B    Other users
receives  in room
'user_typing'
    │
    ▼
Show "User A is typing ●●●" in UI
    │
    (waits for message or timeout)
    │
    ▼
User stops typing (no more events)
    │
    ▼
emit 'user_stop_typing'
    │
    ▼
┌──────────────────┐
│ Server broadcasts│
└────────┬─────────┘
         │
    ┌────┴────┐
    ▼         ▼
User B    Other users
receives  in room
'user_stop_typing'
    │
    ▼
Hide "User A is typing..." from UI
```

---

## 🔔 Push Notification Flow

```
Message sent
    │
    ▼
Check: Is recipient online?
    │
 Yes│  No
    │   │
    ▼   ▼
Socket   Firebase
emit     Cloud
update   Messaging
    │   │
    │   ├─→ Check: Has FCM token?
    │   │        │
    │   │    Yes│ No
    │   │        │  │
    │   │        │  └─→ Log: No token
    │   │        │
    │   │        ▼
    │   │   Send Push to Device
    │   │        │
    │   │        ├─→ App foreground?
    │   │        │   yes └─→ Handle in-app
    │   │        │   no  └─→ Show notification
    │   │        │
    │   │        ▼
    │   │   User receives notification
    │   │
    └───┴──→ UI Updates (real-time)
```

---

## 🗄️ Database Schema Relationships

```
┌──────────────┐
│    Users     │
├──────────────┤
│ _id (PK)     │
│ name         │
│ email        │
│ passwordHash │
│ fcmToken     │◄─── Notification token
│ createdAt    │
│ updatedAt    │
└──────┬───────┘
       │
       │ references
       │
┌──────┴──────────────┐
│      Chats          │
├─────────────────────┤
│ _id (PK)            │
│ members[] (FK User) │
│ lastMessage         │
│ lastMessageAt       │
│ createdAt           │
│ updatedAt           │
└──────┬──────────────┘
       │
       │ references
       │
┌──────┴────────────────────┐
│       Messages             │
├────────────────────────────┤
│ _id (PK)                   │
│ chatId (FK Chat)           │
│ senderId (FK User)         │
│ text                       │
│ status (sent/delivered/    │◄─── NEW
│         read)              │
│ deliveredTo[] (FK User)    │◄─── NEW
│ readBy[] (FK User)         │
│ createdAt                  │
│ updatedAt                  │
└────────────────────────────┘
```

---

## 🔐 Authentication & Authorization Flow

```
┌─────────────────────────────┐
│ User Login/Registration     │
└────────────┬────────────────┘
             │
             ▼
    ┌─────────────────┐
    │ Get JWT Token   │
    │ + Request perms │
    └────────┬────────┘
             │
             ▼
    ┌─────────────────┐
    │ Get FCM Token   │
    │ from Firebase   │
    └────────┬────────┘
             │
             ▼
    ┌─────────────────┐
    │ POST /register- │
    │ token (with JWT)│
    └────────┬────────┘
             │
             ▼
    ┌─────────────────┐
    │ Server validates│
    │ JWT, stores     │
    │ fcmToken in DB  │
    └────────┬────────┘
             │
             ▼
    ┌─────────────────┐
    │ Now ready for   │
    │ push notifs     │
    └─────────────────┘
```

---

## 📱 Widget Hierarchy

```
ChatScreen
├── AppBar
├── MessagesList
│   └── MessageBubble
│       ├── MessageText
│       └── MessageStatusIndicator
│           ├── Spinner (sending)
│           ├── ✓ (sent)
│           ├── ✓✓ (delivered)
│           └── ✓✓ blue (read)
├── TypingIndicator (if users typing)
│   └── AnimatedDots
├── ChatInputSection
│   ├── TextField
│   └── SendButton
└── UnreadBadge (on list)
    └── RedCircle with count
```

---

## 🔄 Event Sequence Diagram

```
Timeline: User A → Backend → User B

Time 0:
  User A: "Hi" (sends message)
  Backend: save message (status: sent)
  User B: --

Time 1:
  User A: [sees "✓"]
  Backend: broadcast new_message (status: sent)
  User B: receive new_message event
           [sees "Hi" with status: sent]

Time 2:
  User A: --
  Backend: check User B online?
           YES → emit via socket
           NO → send via FCM
  User B: mark as delivered

Time 3:
  User A: [sees "✓✓"]
  Backend: emit status_update (delivered)
  User B: --

Time 4:
  User A: --
  Backend: --
  User B: open chat screen → join_chat

Time 5:
  User A: --
  Backend: markAsRead for User B
           emit status_update (read)
  User B: --

Time 6:
  User A: [sees "✓✓" in blue]
  Backend: --
  User B: --
```

---

## 🎯 Feature Integration Points

```
┌─────────────────────────────────────────────────────────┐
│          Chat Screen Component                          │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Messages List                                          │
│  ├─ Listen: message_status_update                       │
│  ├─ Display: MessageStatusIndicator widget              │
│  └─ Update: message.status property                     │
│                                                         │
│  Input Section                                          │
│  ├─ Listen: textfield onChange                          │
│  ├─ Emit: user_typing event (throttled)                 │
│  └─ Emit: user_stop_typing on send                      │
│                                                         │
│  Typing Indicator Area                                  │
│  ├─ Listen: user_typing event                           │
│  ├─ Display: TypingIndicator widget                     │
│  └─ Auto-hide: on user_stop_typing                      │
│                                                         │
│  Unread Badge (List Item)                               │
│  ├─ Listen: new_message event                           │
│  ├─ Display: UnreadBadge widget                         │
│  └─ Update: unread count                                │
│                                                         │
└─────────────────────────────────────────────────────────┘
         │                                          │
         │ Socket Events                REST API Calls
         │                                          │
    ┌────┴──────────────────────────────┴────┐    │
    │                                         │    │
    ▼                                         ▼    ▼
Socket Service                         API Service
```

---

**Complete system architecture for WhatsApp-like notifications!** ✨
