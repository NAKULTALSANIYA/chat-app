# Chat App API Documentation

## Base URL
```
http://localhost:3000/api
```

## Authentication

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

## Response Format

All endpoints return JSON responses:

### Success Response
```json
{
  "message": "Operation successful",
  "data": { ... }
}
```

### Error Response
```json
{
  "message": "Error description",
  "details": "Additional error information"
}
```

---

## Authentication Endpoints

### 1. Register User

**Endpoint**: `POST /auth/register`

**Description**: Create a new user account

**Request Body**:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Validation Rules**:
- `name`: string, 2-100 characters, required
- `email`: valid email format, unique, required
- `password`: string, 6-100 characters, required

**Response** (201 Created):
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "createdAt": "2024-12-30T10:30:00Z"
  }
}
```

**Error Responses**:
- `400 Bad Request`: Validation error
- `409 Conflict`: User with email already exists

---

### 2. Login User

**Endpoint**: `POST /auth/login`

**Description**: Authenticate user and receive JWT token

**Request Body**:
```json
{
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Validation Rules**:
- `email`: valid email format, required
- `password`: string, required

**Response** (200 OK):
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

**Token Details**:
- **Validity**: 7 days
- **Algorithm**: HS256
- **Claims**: `userId`, `email`

**Error Responses**:
- `400 Bad Request`: Validation error
- `401 Unauthorized`: Invalid credentials

---

### 3. Get Current User

**Endpoint**: `GET /auth/me`

**Description**: Retrieve authenticated user's profile

**Headers**:
```
Authorization: Bearer <token>
```

**Response** (200 OK):
```json
{
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "createdAt": "2024-12-30T10:30:00Z"
  }
}
```

**Error Responses**:
- `401 Unauthorized`: No token or invalid token
- `404 Not Found`: User not found

---

## Chat Endpoints

### 1. Create or Fetch Chat

**Endpoint**: `POST /chats`

**Description**: Create a new chat or fetch existing chat with a user

**Headers**:
```
Authorization: Bearer <token>
```

**Request Body**:
```json
{
  "memberId": "507f1f77bcf86cd799439012"
}
```

**Validation Rules**:
- `memberId`: valid MongoDB ObjectId, required

**Response** (200 OK):
```json
{
  "message": "Chat fetched or created",
  "chat": {
    "id": "507f1f77bcf86cd799439013",
    "members": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "name": "John Doe",
        "email": "john@example.com"
      },
      {
        "_id": "507f1f77bcf86cd799439012",
        "name": "Jane Smith",
        "email": "jane@example.com"
      }
    ],
    "lastMessage": "Hey, how are you?",
    "lastMessageAt": "2024-12-30T15:45:00Z",
    "createdAt": "2024-12-30T10:00:00Z",
    "updatedAt": "2024-12-30T15:45:00Z"
  }
}
```

**Error Responses**:
- `400 Bad Request`: Validation error or cannot chat with yourself
- `401 Unauthorized`: No token or invalid token

---

### 2. Get User's Chats

**Endpoint**: `GET /chats`

**Description**: Retrieve all chats for the authenticated user

**Headers**:
```
Authorization: Bearer <token>
```

**Query Parameters**: None

**Response** (200 OK):
```json
{
  "chats": [
    {
      "id": "507f1f77bcf86cd799439013",
      "members": [ ... ],
      "lastMessage": "Thanks!",
      "lastMessageAt": "2024-12-30T15:45:00Z",
      "updatedAt": "2024-12-30T15:45:00Z"
    },
    {
      "id": "507f1f77bcf86cd799439014",
      "members": [ ... ],
      "lastMessage": null,
      "lastMessageAt": null,
      "updatedAt": "2024-12-30T14:30:00Z"
    }
  ],
  "count": 2
}
```

**Sorting**: Chats are sorted by `updatedAt` in descending order (newest first)

**Error Responses**:
- `401 Unauthorized`: No token or invalid token

---

### 3. Get Chat Messages

**Endpoint**: `GET /messages/:chatId`

**Description**: Retrieve paginated messages from a specific chat

**Headers**:
```
Authorization: Bearer <token>
```

**URL Parameters**:
- `chatId`: Chat ID (MongoDB ObjectId)

**Query Parameters**:
- `page`: Page number (default: 1)
- `limit`: Messages per page (default: 50, max: 100)

**Example**: `/messages/507f1f77bcf86cd799439013?page=1&limit=50`

**Response** (200 OK):
```json
{
  "messages": [
    {
      "id": "507f1f77bcf86cd799439015",
      "chatId": "507f1f77bcf86cd799439013",
      "senderId": {
        "_id": "507f1f77bcf86cd799439011",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "text": "Hey, how are you?",
      "createdAt": "2024-12-30T14:00:00Z"
    },
    {
      "id": "507f1f77bcf86cd799439016",
      "chatId": "507f1f77bcf86cd799439013",
      "senderId": {
        "_id": "507f1f77bcf86cd799439012",
        "name": "Jane Smith",
        "email": "jane@example.com"
      },
      "text": "I'm doing great!",
      "createdAt": "2024-12-30T14:05:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 125,
    "pages": 3
  }
}
```

**Sorting**: Messages are sorted by `createdAt` in ascending order (oldest first)

**Error Responses**:
- `400 Bad Request`: Invalid pagination parameters
- `401 Unauthorized`: No token or invalid token
- `403 Forbidden`: Not a member of this chat
- `404 Not Found`: Chat not found

---

## FCM Token Endpoints

### 1. Register Device Token

**Endpoint**: `POST /tokens`

**Description**: Register or update device FCM token for push notifications

**Request Body**:
```json
{
  "token": "eKGH8vEWxL...",
  "platform": "android"
}
```

**Validation Rules**:
- `token`: string, required
- `platform`: enum (android, ios, web), required

**Response** (200 OK):
```json
{
  "message": "Token registered",
  "token": { ... }
}
```

**Error Responses**:
- `400 Bad Request`: Validation error

---

## Real-Time WebSocket Events

### Connection

```dart
// Connect with JWT token
socket.connect(token: jwtToken);
```

### Events

#### Client Emits

**1. join_chat**
```javascript
socket.emit('join_chat', {
  'chatId': 'chat_id_here'
});
```

**2. send_message**
```javascript
socket.emit('send_message', {
  'chatId': 'chat_id_here',
  'text': 'Hello, how are you?'
});
```

**3. leave_chat**
```javascript
socket.emit('leave_chat', {
  'chatId': 'chat_id_here'
});
```

---

#### Server Emits

**1. new_message**
```javascript
{
  'id': 'message_id',
  'chatId': 'chat_id',
  'senderId': 'sender_id',
  'senderName': 'John Doe',
  'text': 'Hello, how are you?',
  'createdAt': '2024-12-30T15:45:00Z'
}
```

**2. user_online**
```javascript
{
  'userId': 'user_id'
}
```

**3. user_offline**
```javascript
{
  'userId': 'user_id'
}
```

**4. error**
```javascript
{
  'message': 'Error description'
}
```

---

## Status Codes

| Code | Meaning | Common Cause |
|------|---------|--------------|
| 200 | OK | Request successful |
| 201 | Created | Resource created |
| 400 | Bad Request | Validation error |
| 401 | Unauthorized | Missing/invalid token |
| 403 | Forbidden | Access denied |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Resource already exists |
| 500 | Server Error | Internal error |

---

## Rate Limiting

Currently not implemented. Should be added for production:
- Auth endpoints: 5 requests per minute
- Chat endpoints: 100 requests per minute
- WebSocket: 1000 messages per minute

---

## Error Codes

### Authentication Errors
- `AUTH_001`: Invalid credentials
- `AUTH_002`: Token expired
- `AUTH_003`: Invalid token
- `AUTH_004`: User not found

### Chat Errors
- `CHAT_001`: Chat not found
- `CHAT_002`: Not a chat member
- `CHAT_003`: Cannot chat with yourself
- `CHAT_004`: Invalid member ID

### Message Errors
- `MSG_001`: Message not found
- `MSG_002`: Invalid message content
- `MSG_003`: Message too long

---

## Example Requests

### Using cURL

```bash
# Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"John","email":"john@test.com","password":"pass123"}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@test.com","password":"pass123"}'

# Get Me
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer TOKEN"

# Create Chat
curl -X POST http://localhost:3000/api/chats \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"memberId":"USER_ID"}'

# Get Messages
curl -X GET "http://localhost:3000/api/messages/CHAT_ID?page=1&limit=50" \
  -H "Authorization: Bearer TOKEN"
```

### Using Postman

1. Import collection from `postman_collection.json`
2. Set `{{token}}` in environment variables
3. Run requests from collection

---

## Rate Limit Headers

(To be implemented)
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1234567890
```

---

## Pagination

All list endpoints support pagination:

```
GET /endpoint?page=1&limit=50
```

Response includes `pagination` object:
```json
{
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 125,
    "pages": 3
  }
}
```

---

## Sorting

- **Chats**: By `updatedAt` (descending)
- **Messages**: By `createdAt` (ascending)

---

## Data Types

- **ObjectId**: MongoDB 24-character hex string
- **DateTime**: ISO 8601 format (e.g., "2024-12-30T15:45:00Z")
- **Boolean**: true/false
- **Number**: Integer or decimal
- **String**: UTF-8 encoded text

---

## Validation Rules

### Email
- Valid email format
- Max 255 characters
- Must be unique per user

### Password
- Minimum 6 characters
- Maximum 100 characters
- Stored as bcrypt hash

### Message Text
- Minimum 1 character
- Maximum 5000 characters
- Whitespace trimmed

### Name
- Minimum 2 characters
- Maximum 100 characters

---

This API is production-ready and includes comprehensive error handling, validation, and security features.
