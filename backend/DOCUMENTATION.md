# FCM Backend - Comprehensive Documentation

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Technology Stack](#technology-stack)
4. [Installation & Setup](#installation--setup)
5. [Configuration](#configuration)
6. [API Endpoints](#api-endpoints)
7. [Core Components](#core-components)
8. [Data Models](#data-models)
9. [Service Layer](#service-layer)
10. [Error Handling & Validation](#error-handling--validation)
11. [Firebase Integration](#firebase-integration)
12. [Database Integration](#database-integration)
13. [How It Works](#how-it-works)
14. [Usage Examples](#usage-examples)
15. [Deployment](#deployment)

---

## Project Overview

**FCM Backend** is a **Firebase Cloud Messaging (FCM)** backend service built with Express.js and MongoDB. It enables sending push notifications to mobile and web applications across multiple platforms (iOS, Android, Web, Flutter).

### Key Features

- **Multi-Platform Support**: Supports iOS, Android, Web, and Flutter platforms
- **Flexible Notification Delivery**: Send notifications to:
  - Individual users (all their devices)
  - Specific device tokens
  - Topic-based subscribers
- **Token Management**: Automatic registration and cleanup of invalid FCM tokens
- **Database Persistence**: Stores user tokens in MongoDB for managing device registrations
- **Request Validation**: Uses Joi schema validation for all incoming requests
- **Error Handling**: Centralized error handling with logging
- **Firebase Admin SDK**: Leverages Google Firebase for reliable message delivery

---

## Architecture

The application follows a **layered architecture** pattern:

```
┌─────────────────────────────────────────┐
│         Express Server (index.js)       │
│  ├─ Middleware (morgan, json parser)   │
│  └─ Error Handler                       │
└──────────────────┬──────────────────────┘
                   │
┌──────────────────┴──────────────────────┐
│         Routes Layer (router)            │
│  ├─ POST /api/tokens                    │
│  ├─ POST /api/notify/user               │
│  ├─ POST /api/notify/tokens             │
│  └─ POST /api/notify/topic              │
└──────────────────┬──────────────────────┘
                   │
┌──────────────────┴──────────────────────┐
│      Controllers (validation)            │
│  ├─ registerTokenHandler                │
│  ├─ sendUserHandler                     │
│  ├─ sendTokensHandler                   │
│  └─ sendTopicHandler                    │
└──────────────────┬──────────────────────┘
                   │
┌──────────────────┴──────────────────────┐
│    Services (business logic)             │
│  ├─ registerToken()                     │
│  ├─ sendToUser()                        │
│  ├─ sendToTokens()                      │
│  ├─ sendToTopic()                       │
│  └─ sendAndClean()                      │
└──────────────────┬──────────────────────┘
                   │
          ┌────────┴────────┐
          │                 │
    ┌─────▼──────┐    ┌─────▼──────────┐
    │  MongoDB   │    │  Firebase      │
    │  (Tokens)  │    │  (Messaging)   │
    └────────────┘    └────────────────┘
```

---

## Technology Stack

### Core Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| **express** | ^4.19.2 | Web framework for routing and middleware |
| **mongoose** | ^8.6.0 | MongoDB object modeling and database connection |
| **firebase-admin** | ^12.6.0 | Firebase Admin SDK for FCM messaging |
| **joi** | ^17.12.3 | Schema validation for request data |
| **dotenv** | ^16.4.5 | Environment variable management |
| **morgan** | ^1.10.0 | HTTP request logging middleware |

### Development Dependencies

| Package | Purpose |
|---------|---------|
| **nodemon** | Auto-restart server on file changes during development |

### External Services

- **Firebase Cloud Messaging (FCM)**: Push notification delivery
- **MongoDB**: Token storage and user device management
- **Google Cloud**: Firebase project hosting

---

## Installation & Setup

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- Firebase Project with Admin SDK credentials
- npm or yarn package manager

### Step 1: Clone and Install Dependencies

```bash
cd backend
npm install
```

### Step 2: Configure Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/fcm_demo
FIREBASE_SERVICE_ACCOUNT_BASE64=<base64-encoded-service-account-key>
FIREBASE_PROJECT_ID=<your-firebase-project-id>
```

### Step 3: Set Up MongoDB

Ensure MongoDB is running locally or provide a cloud MongoDB URI:

```bash
# For local MongoDB
mongod
```

### Step 4: Run the Application

**Development Mode** (with auto-reload):

```bash
npm run dev
```

**Production Mode**:

```bash
npm start
```

The server will start on `http://localhost:5000` (or the configured PORT).

---

## Configuration

### Environment Variables

#### **PORT**
- **Type**: Number
- **Default**: 5000
- **Description**: Port on which the server listens

#### **MONGODB_URI**
- **Type**: String
- **Example**: `mongodb://localhost:27017/fcm_demo`
- **Description**: MongoDB connection string
- **Required**: Yes

#### **FIREBASE_SERVICE_ACCOUNT_BASE64**
- **Type**: String (Base64 encoded)
- **Description**: Firebase service account credentials encoded in Base64
- **How to Get**:
  1. Go to Firebase Console
  2. Project Settings → Service Accounts
  3. Download private key (JSON)
  4. Convert to Base64: `cat key.json | base64`
- **Required**: Yes

#### **FIREBASE_PROJECT_ID**
- **Type**: String
- **Description**: Firebase project ID (can also be extracted from service account)
- **Example**: `flutter-notification-523c5`
- **Required**: No (fallback to service account)

### Configuration Files

#### Database Configuration (`src/config/db.js`)

```javascript
export const connectDb = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI missing');
  await mongoose.connect(uri, { dbName: 'fcm_demo' });
  logger.info('MongoDB connected');
};
```

- Establishes connection to MongoDB
- Uses database name: `fcm_demo`
- Throws error if MONGODB_URI is missing

#### Firebase Configuration (`src/config/firebase.js`)

```javascript
export const initFirebase = async () => {
  const svcBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  if (!svcBase64) throw new Error('FIREBASE_SERVICE_ACCOUNT_BASE64 missing');
  
  const svcJson = JSON.parse(Buffer.from(svcBase64, 'base64').toString('utf-8'));
  
  firebaseApp = admin.initializeApp({
    credential: admin.credential.cert(svcJson),
    projectId: process.env.FIREBASE_PROJECT_ID || svcJson.project_id,
  });
  
  messaging = admin.messaging();
};
```

- Decodes Base64 Firebase credentials
- Initializes Firebase Admin SDK
- Sets up FCM messaging service

---

## API Endpoints

### 1. Register Device Token

**Endpoint**: `POST /api/tokens`

**Purpose**: Register or update a user's device FCM token

**Request Body**:

```json
{
  "userId": "user123",
  "token": "exO_K-y1IkM:APA91bF...",
  "platform": "android"
}
```

**Parameters**:

| Field | Type | Required | Enum | Default | Description |
|-------|------|----------|------|---------|-------------|
| `userId` | String | Yes | — | — | Unique user identifier |
| `token` | String | Yes | — | — | FCM registration token from client |
| `platform` | String | No | ios, android, web, flutter | flutter | Device platform |

**Response** (Success):

```json
{
  "success": true,
  "tokenId": "507f1f77bcf86cd799439011"
}
```

**Response** (Error):

```json
{
  "message": "Validation error",
  "details": [
    {
      "message": "\"userId\" is required",
      "path": ["userId"],
      "type": "any.required"
    }
  ]
}
```

**Use Cases**:
- Initial device registration
- Token refresh after expiration
- Device platform update
- Multi-device management for same user

---

### 2. Send Notification to User

**Endpoint**: `POST /api/notify/user`

**Purpose**: Send push notification to all devices registered for a specific user

**Request Body**:

```json
{
  "userId": "user123",
  "title": "New Message",
  "body": "You have a new message from John",
  "image": "https://example.com/image.png",
  "data": {
    "chatId": "chat_456",
    "senderId": "user_789",
    "messageId": "msg_001"
  }
}
```

**Parameters**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `userId` | String | Yes | Target user ID |
| `title` | String | Yes | Notification title (max 60 chars recommended) |
| `body` | String | Yes | Notification body/message |
| `image` | String | No | Image URL (must be valid URI) |
| `data` | Object | No | Custom data payload (string/number/boolean values) |

**Response** (Success):

```json
{
  "success": true,
  "result": {
    "sent": 2,
    "response": {
      "successCount": 2,
      "failureCount": 0,
      "responses": [...]
    }
  }
}
```

**Response** (No Tokens):

```json
{
  "success": true,
  "result": {
    "sent": 0,
    "message": "No tokens for user"
  }
}
```

**Use Cases**:
- Send notification to all user devices
- Chat messages
- Friend requests
- System alerts
- Push to all user's registered devices

---

### 3. Send Notification to Specific Tokens

**Endpoint**: `POST /api/notify/tokens`

**Purpose**: Send push notification to a list of specific device tokens

**Request Body**:

```json
{
  "tokens": [
    "exO_K-y1IkM:APA91bF...",
    "dXrP_L-z2jkN:APA91bF..."
  ],
  "title": "Event Update",
  "body": "The event you're attending starts in 1 hour",
  "image": "https://example.com/event.png",
  "data": {
    "eventId": "evt_123",
    "eventTime": "2024-01-15T18:00:00Z"
  }
}
```

**Parameters**:

| Field | Type | Required | Constraints | Description |
|-------|------|----------|-------------|-------------|
| `tokens` | Array[String] | Yes | Min 1 item | List of FCM tokens |
| `title` | String | Yes | — | Notification title |
| `body` | String | Yes | — | Notification body |
| `image` | String | No | Valid URI | Image URL |
| `data` | Object | No | — | Custom key-value data |

**Response** (Success):

```json
{
  "success": true,
  "result": {
    "sent": 2,
    "response": {
      "successCount": 2,
      "failureCount": 0,
      "responses": [...]
    }
  }
}
```

**Use Cases**:
- Broadcast to specific device group
- Multi-device notification
- Targeted user segments
- Cross-platform messaging

---

### 4. Send Notification to Topic

**Endpoint**: `POST /api/notify/topic`

**Purpose**: Send push notification to all devices subscribed to a topic

**Request Body**:

```json
{
  "topic": "sports_news",
  "title": "Live Score Update",
  "body": "Team A scored! Current score: 2-1",
  "image": "https://example.com/score.png",
  "data": {
    "matchId": "match_789",
    "teamA": "Team A",
    "teamB": "Team B",
    "score": "2-1"
  }
}
```

**Parameters**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `topic` | String | Yes | Topic name for subscribers |
| `title` | String | Yes | Notification title |
| `body` | String | Yes | Notification body |
| `image` | String | No | Image URL |
| `data` | Object | No | Custom data payload |

**Response** (Success):

```json
{
  "success": true,
  "result": "projects/flutter-notification-523c5/messages/2891234567890123456"
}
```

**Use Cases**:
- Broadcast to topic subscribers
- News updates
- Global announcements
- Group notifications
- Category-based messaging (sports, weather, etc.)

---

## Core Components

### Main Entry Point (`src/index.js`)

```javascript
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import morgan from 'morgan';
import router from './routes/index.js';
import { connectDb } from './config/db.js';
import { initFirebase } from './config/firebase.js';
import { logger } from './utils/logger.js';

const app = express();
app.use(express.json());
app.use(morgan('dev'));

app.use('/api', router);

app.use((err, req, res, _next) => {
  logger.error(err);
  res.status(500).json({ message: 'Internal error', error: err.message });
});

const port = process.env.PORT;

Promise.all([initFirebase(), connectDb()])
  .then(() => {
    app.listen(port, () => logger.info(`API listening on ${port}`));
  })
  .catch((err) => {
    logger.error('Startup error', err);
    process.exit(1);
  });
```

**Key Features**:

- **Environment Loading**: Loads `.env` variables at startup
- **Middleware Stack**:
  - `express.json()`: Parse JSON request bodies
  - `morgan('dev')`: Log HTTP requests
- **Routing**: Mounts `/api` routes
- **Error Handling**: Global error handler that logs and responds with 500 status
- **Startup Sequence**:
  - Initializes Firebase and MongoDB in parallel using `Promise.all()`
  - Starts server only when both connections succeed
  - Exits if initialization fails

---

### Routes (`src/routes/index.js`)

```javascript
import { Router } from 'express';
import { validate } from '../middlewares/validate.js';
import {
  registerTokenHandler,
  sendTokensHandler,
  sendTopicHandler,
  sendUserHandler,
  sendTopicSchema,
  sendTokensSchema,
  sendUserSchema,
  tokenSchema,
} from '../controllers/notificationController.js';

const router = Router();

router.post('/tokens', validate(tokenSchema), registerTokenHandler);
router.post('/notify/user', validate(sendUserSchema), sendUserHandler);
router.post('/notify/tokens', validate(sendTokensSchema), sendTokensHandler);
router.post('/notify/topic', validate(sendTopicSchema), sendTopicHandler);

export default router;
```

**Structure**:

- **Route Definitions**: 4 POST endpoints
- **Validation Middleware**: Each route has schema validation via `validate()` middleware
- **Handler Functions**: Each route maps to a corresponding handler in controller
- **Separation of Concerns**: Routes only define structure, controllers handle business logic

---

## Data Models

### Token Model (`src/models/tokenModel.js`)

Represents a user's device FCM token in MongoDB.

```javascript
const tokenSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    token: { type: String, required: true, unique: true },
    platform: { type: String, enum: ['ios', 'android', 'web', 'flutter'], default: 'flutter' },
    lastSeenAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

tokenSchema.index({ userId: 1, token: 1 }, { unique: true });
```

**Schema Fields**:

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `userId` | String | Required, Indexed | User identifier |
| `token` | String | Required, Unique | FCM registration token |
| `platform` | String | Enum, Default: 'flutter' | Device platform type |
| `lastSeenAt` | Date | Default: now | Last activity timestamp |
| `createdAt` | Date | Auto | Document creation timestamp |
| `updatedAt` | Date | Auto | Last update timestamp |

**Indexes**:

1. `userId` (Single Index): Fast lookup by user
2. `token` (Unique Index): Prevent duplicate tokens
3. `{ userId: 1, token: 1 }` (Compound Unique Index): Ensure one token per user per device

**Typical Document**:

```json
{
  "_id": "507f1f77bcf86cd799439011",
  "userId": "user123",
  "token": "exO_K-y1IkM:APA91bF...",
  "platform": "android",
  "lastSeenAt": "2024-01-15T10:30:00.000Z",
  "createdAt": "2024-01-10T08:00:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

---

## Service Layer

### Notification Service (`src/services/notificationService.js`)

Contains all business logic for token management and notification delivery.

#### **1. Register Token**

```javascript
export const registerToken = async ({ userId, token, platform }) => {
  const doc = await Token.findOneAndUpdate(
    { token },
    { userId, platform, lastSeenAt: new Date() },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
  return doc;
};
```

**Logic**:
- Searches for existing token
- Updates user association and platform if exists
- Creates new token document if doesn't exist (upsert)
- Updates `lastSeenAt` timestamp
- Returns updated/created document

**Why upsert?**:
- Handles re-registration gracefully
- Single operation for both create and update
- Prevents duplicate tokens

**Return Value**: Token document with `_id`

---

#### **2. Send and Clean**

```javascript
const sendAndClean = async ({ tokens, send }) => {
  const res = await send();
  if (res.responses && Array.isArray(res.responses)) {
    const badTokens = [];
    res.responses.forEach((r, idx) => {
      const code = r.error?.code;
      if (
        code === 'messaging/invalid-registration-token' ||
        code === 'messaging/registration-token-not-registered'
      ) {
        badTokens.push(tokens[idx]);
      }
    });
    if (badTokens.length) {
      await Token.deleteMany({ token: { $in: badTokens } });
      logger.info('Removed invalid tokens', badTokens.length);
    }
  }
  return res;
};
```

**Purpose**: Automatically clean invalid tokens from database

**Logic**:
1. Executes the send function (passed as callback)
2. Checks Firebase response for errors
3. Identifies invalid tokens (error codes):
   - `messaging/invalid-registration-token`
   - `messaging/registration-token-not-registered`
4. Deletes invalid tokens from MongoDB
5. Logs cleanup action
6. Returns Firebase response

**Benefits**:
- Maintains clean database
- Removes stale tokens automatically
- Improves future send success rates

---

#### **3. Data Normalization**

```javascript
const normalizeData = (data) => {
  if (!data) return {};
  return Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)]));
};
```

**Purpose**: Convert all data values to strings (FCM requirement)

**Why?**: Firebase only accepts string values in data payload

**Example**:
```
Input:  { eventId: 123, active: true, score: 45.5 }
Output: { eventId: '123', active: 'true', score: '45.5' }
```

---

#### **4. Base Payload Creation**

```javascript
const basePayload = ({ title, body, image, data }) => ({
  notification: { title, body, image },
  data: normalizeData(data),
});
```

**Purpose**: Creates consistent FCM message structure

**Returns**: Object with:
- `notification`: Display fields (title, body, image)
- `data`: Custom key-value pairs (all strings)

---

#### **5. Send to User**

```javascript
export const sendToUser = async ({ userId, title, body, image, data }) => {
  const tokens = await Token.find({ userId }).distinct('token');
  if (!tokens.length) return { sent: 0, message: 'No tokens for user' };
  const payload = basePayload({ title, body, image, data });
  const response = await sendAndClean({
    tokens,
    send: () => getMessaging().sendEachForMulticast({ tokens, ...payload }),
  });
  return { sent: tokens.length, response };
};
```

**Workflow**:
1. Query database for all tokens belonging to `userId`
2. If no tokens found, return early with 0 sent
3. Create base payload
4. Send via FCM multicast (one message to multiple tokens)
5. Automatically clean invalid tokens
6. Return count and Firebase response

**Use Case**: Send notification to all user devices

---

#### **6. Send to Tokens**

```javascript
export const sendToTokens = async ({ tokens, title, body, image, data }) => {
  if (!tokens.length) return { sent: 0, message: 'No tokens provided' };
  const payload = basePayload({ title, body, image, data });
  const response = await sendAndClean({
    tokens,
    send: () => getMessaging().sendEachForMulticast({ tokens, ...payload }),
  });
  return { sent: tokens.length, response };
};
```

**Workflow**:
1. Validates tokens array is not empty
2. Creates base payload
3. Sends via FCM multicast to provided tokens
4. Cleans invalid tokens
5. Returns count and response

**Difference from sendToUser**:
- Accepts explicit tokens list instead of querying database
- More direct control over recipients
- No database query needed

---

#### **7. Send to Topic**

```javascript
export const sendToTopic = async ({ topic, title, body, image, data }) => {
  const payload = basePayload({ title, body, image, data });
  return getMessaging().send({ topic, ...payload });
};
```

**Workflow**:
1. Creates base payload
2. Sends to FCM topic (not individual tokens)
3. Returns Firebase message ID

**Differences**:
- Uses `send()` instead of `sendEachForMulticast()`
- No token cleanup needed (topic-based)
- Simpler response structure
- Devices must be subscribed to topic on client

**Use Case**: Broadcast to topic subscribers without managing individual tokens

---

## Error Handling & Validation

### Validation Middleware (`src/middlewares/validate.js`)

```javascript
export const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, { abortEarly: false, allowUnknown: false });
  if (error) {
    return res.status(400).json({ message: 'Validation error', details: error.details });
  }
  req.body = value;
  next();
};
```

**Features**:

- **Schema Validation**: Uses Joi for schema validation
- **Abort Early**: `false` - validates all fields and returns all errors
- **Allow Unknown**: `false` - rejects fields not defined in schema
- **Error Response**: Returns 400 status with detailed error information
- **Body Sanitization**: Replaces `req.body` with validated/coerced values

**Error Response Format**:

```json
{
  "message": "Validation error",
  "details": [
    {
      "message": "\"userId\" is required",
      "path": ["userId"],
      "type": "any.required"
    },
    {
      "message": "\"platform\" must be one of [ios, android, web, flutter]",
      "path": ["platform"],
      "type": "any.only"
    }
  ]
}
```

---

### Validation Schemas

#### Token Registration Schema

```javascript
export const tokenSchema = Joi.object({
  userId: Joi.string().required(),
  token: Joi.string().required(),
  platform: Joi.string().valid('ios', 'android', 'web', 'flutter').default('flutter'),
});
```

---

#### Send User Notification Schema

```javascript
export const sendUserSchema = Joi.object({
  userId: Joi.string().required(),
  title: Joi.string().required(),
  body: Joi.string().required(),
  image: Joi.string().uri().optional(),
  data: Joi.object()
    .pattern(Joi.string(), Joi.alternatives(Joi.string(), Joi.number(), Joi.boolean()))
    .optional(),
});
```

---

#### Send Tokens Notification Schema

```javascript
export const sendTokensSchema = Joi.object({
  tokens: Joi.array().items(Joi.string()).min(1).required(),
  title: Joi.string().required(),
  body: Joi.string().required(),
  image: Joi.string().uri().optional(),
  data: Joi.object()
    .pattern(Joi.string(), Joi.alternatives(Joi.string(), Joi.number(), Joi.boolean()))
    .optional(),
});
```

---

#### Send Topic Notification Schema

```javascript
export const sendTopicSchema = Joi.object({
  topic: Joi.string().required(),
  title: Joi.string().required(),
  body: Joi.string().required(),
  image: Joi.string().uri().optional(),
  data: Joi.object()
    .pattern(Joi.string(), Joi.alternatives(Joi.string(), Joi.number(), Joi.boolean()))
    .optional(),
});
```

---

### Global Error Handler

```javascript
app.use((err, req, res, _next) => {
  logger.error(err);
  res.status(500).json({ message: 'Internal error', error: err.message });
});
```

**Features**:

- **Catches All Errors**: Express error middleware (4 parameters)
- **Logging**: Logs error to console
- **Consistent Response**: Returns 500 with error message
- **Stack Trace**: Available in server logs for debugging

**When Triggered**:
- Uncaught exceptions in handlers
- Database errors
- Firebase API errors
- Any error passed to `next(err)`

---

## Firebase Integration

### Firebase Configuration

**File**: `src/config/firebase.js`

```javascript
import admin from 'firebase-admin';

let firebaseApp;
let messaging;

export const initFirebase = async () => {
  const svcBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  if (!svcBase64) throw new Error('FIREBASE_SERVICE_ACCOUNT_BASE64 missing');

  const svcJson = JSON.parse(Buffer.from(svcBase64, 'base64').toString('utf-8'));

  firebaseApp = admin.initializeApp({
    credential: admin.credential.cert(svcJson),
    projectId: process.env.FIREBASE_PROJECT_ID || svcJson.project_id,
  });

  messaging = admin.messaging();
};

export const getMessaging = () => messaging;
export const getFirebaseApp = () => firebaseApp;
```

**Initialization Flow**:

1. **Retrieve Credentials**: Reads Base64-encoded service account from env
2. **Decode**: Converts Base64 to JSON object
3. **Initialize App**: Creates Firebase app instance with credentials
4. **Get Messaging**: Retrieves FCM messaging service
5. **Export**: Makes messaging available to services

**Why Base64?**:
- Safely store credentials in environment variables
- Avoid JSON parsing issues in shell environment
- Security: credentials not readable as plain text

---

### Firebase Messaging Methods

#### Send to Multiple Tokens

```javascript
getMessaging().sendEachForMulticast({
  tokens: ['token1', 'token2', ...],
  notification: { title, body, image },
  data: { key: value, ... }
})
```

**Returns**:
```javascript
{
  successCount: 2,
  failureCount: 0,
  responses: [
    { success: true, messageId: '...' },
    { success: true, messageId: '...' }
  ]
}
```

---

#### Send to Topic

```javascript
getMessaging().send({
  topic: 'sports_news',
  notification: { title, body, image },
  data: { key: value, ... }
})
```

**Returns**: Message ID string

---

### Error Codes

| Error Code | Meaning | Action |
|------------|---------|--------|
| `messaging/invalid-registration-token` | Token format invalid | Delete from DB |
| `messaging/registration-token-not-registered` | Token expired/revoked | Delete from DB |
| `messaging/third-party-auth-error` | Firebase auth failed | Check credentials |
| `messaging/invalid-argument` | Invalid message format | Check schema |

---

## Database Integration

### MongoDB Connection

**File**: `src/config/db.js`

```javascript
import mongoose from 'mongoose';
import { logger } from '../utils/logger.js';

export const connectDb = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI missing');
  await mongoose.connect(uri, { dbName: 'fcm_demo' });
  logger.info('MongoDB connected');
};
```

**Features**:
- Validates URI exists
- Connects to `fcm_demo` database
- Logs successful connection
- Throws error if URI missing (startup failure)

---

### Mongoose Operations

#### Upsert Token

```javascript
const doc = await Token.findOneAndUpdate(
  { token },
  { userId, platform, lastSeenAt: new Date() },
  { new: true, upsert: true, setDefaultsOnInsert: true }
);
```

**Options**:
- `new: true`: Returns updated document
- `upsert: true`: Creates if not found
- `setDefaultsOnInsert: true`: Applies schema defaults on insert

---

#### Find Tokens by User

```javascript
const tokens = await Token.find({ userId }).distinct('token');
```

**Result**: Array of token strings for user (e.g., `['token1', 'token2']`)

---

#### Delete Invalid Tokens

```javascript
await Token.deleteMany({ token: { $in: badTokens } });
```

**Removes**: Multiple tokens in one operation

---

## How It Works

### Request Flow: Sending to User

```
Client Request
     ↓
POST /api/notify/user
     ↓
Validation Middleware
  ├─ Check required fields
  ├─ Validate data types
  └─ Return 400 if invalid
     ↓
Controller Handler (sendUserHandler)
  ├─ Call service function
  └─ Catch errors
     ↓
Service (sendToUser)
  ├─ Query MongoDB for user tokens
  ├─ Check if tokens exist
  ├─ Create payload
  ├─ Send via FCM
  ├─ Clean invalid tokens
  └─ Return result
     ↓
Firebase API
  ├─ Validate message
  ├─ Route to each device
  └─ Return success/error status
     ↓
Controller Response
  └─ Send JSON with result
     ↓
Client Response (200 OK)
```

---

### Database Operations

#### Register Token

```
Input: { userId: "user1", token: "abc123", platform: "ios" }

MongoDB Query:
  ├─ Find token "abc123"
  │  └─ If exists: Update userId and platform
  │  └─ If not exists: Insert new document
  └─ Return updated/new document

Indexes Help:
  ├─ Unique index on token: Prevents duplicates
  └─ Index on userId: Fast user lookups
```

#### Lookup Tokens

```
Input: userId = "user1"

MongoDB Query:
  └─ Find all documents with userId = "user1"
  └─ Extract only token field
  └─ Return array of tokens

Fast because:
  └─ Index on userId makes lookup O(log n)
```

---

### Token Cleanup Flow

```
Send Request
     ↓
Firebase API Response
     ↓
Check for Errors
  ├─ invalid-registration-token
  ├─ registration-token-not-registered
  └─ Other errors
     ↓
Collect Bad Tokens
  └─ tokens[idx] for each error
     ↓
Delete from MongoDB
  └─ Token.deleteMany({ token: { $in: badTokens } })
     ↓
Log Cleanup
  └─ "Removed invalid tokens, 2"
     ↓
Return Response
```

---

## Usage Examples

### Example 1: Register Device Token

**Client Implementation** (Flutter):

```dart
// Get FCM token from Firebase Messaging
FirebaseMessaging messaging = FirebaseMessaging.instance;
String? token = await messaging.getToken();

// Register with backend
var response = await http.post(
  Uri.parse('http://localhost:5000/api/tokens'),
  headers: {'Content-Type': 'application/json'},
  body: jsonEncode({
    'userId': 'user123',
    'token': token,
    'platform': 'flutter'
  }),
);
```

**API Request**:

```bash
curl -X POST http://localhost:5000/api/tokens \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123",
    "token": "exO_K-y1IkM:APA91bF...",
    "platform": "flutter"
  }'
```

**Response**:

```json
{
  "success": true,
  "tokenId": "507f1f77bcf86cd799439011"
}
```

---

### Example 2: Send Chat Message Notification

**Backend Server Logic**:

```javascript
const notificationResult = await fetch('http://localhost:5000/api/notify/user', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: 'user123',
    title: 'New Message from John',
    body: 'Hey, how are you?',
    image: 'https://example.com/john-avatar.jpg',
    data: {
      chatId: 'chat_456',
      senderId: 'user_789',
      messageId: 'msg_001',
      messageText: 'Hey, how are you?'
    }
  })
});
```

**Response**:

```json
{
  "success": true,
  "result": {
    "sent": 2,
    "response": {
      "successCount": 2,
      "failureCount": 0,
      "responses": [
        {
          "success": true,
          "messageId": "0:1234567890123456789"
        },
        {
          "success": true,
          "messageId": "0:1234567890123456790"
        }
      ]
    }
  }
}
```

---

### Example 3: Broadcast to Specific Devices

**API Request**:

```bash
curl -X POST http://localhost:5000/api/notify/tokens \
  -H "Content-Type: application/json" \
  -d '{
    "tokens": [
      "exO_K-y1IkM:APA91bF1...",
      "dXrP_L-z2jkN:APA91bF2..."
    ],
    "title": "Event Starting Soon",
    "body": "Your reserved event starts in 30 minutes",
    "image": "https://example.com/event-banner.jpg",
    "data": {
      "eventId": "evt_123",
      "eventTime": "2024-01-15T18:00:00Z",
      "location": "Main Hall"
    }
  }'
```

---

### Example 4: Topic-Based Broadcasting

**Step 1: Client Subscribes** (in app):

```dart
// Subscribe to topic
FirebaseMessaging.instance.subscribeToTopic('sports_news');
```

**Step 2: Send to Topic**:

```bash
curl -X POST http://localhost:5000/api/notify/topic \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "sports_news",
    "title": "Live Score Update",
    "body": "Arsenal 2 - 1 Chelsea (Final)",
    "image": "https://example.com/score.png",
    "data": {
      "matchId": "match_789",
      "teamA": "Arsenal",
      "teamB": "Chelsea",
      "score": "2-1"
    }
  }'
```

**Response**:

```json
{
  "success": true,
  "result": "projects/flutter-notification-523c5/messages/2891234567890123456"
}
```

---

## Deployment

### Environment Setup

1. **Set Environment Variables**:

```bash
export PORT=5000
export MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/fcm_demo
export FIREBASE_SERVICE_ACCOUNT_BASE64=<base64-credentials>
export FIREBASE_PROJECT_ID=flutter-notification-523c5
```

2. **Install Dependencies**:

```bash
npm install
```

3. **Start Server**:

```bash
npm start
```

---

### Production Considerations

#### 1. Database

- **MongoDB Cloud**: Use MongoDB Atlas for managed database
- **Connection Pooling**: Mongoose handles connection pooling
- **Backups**: Enable automated backups in MongoDB Atlas

#### 2. Firebase

- **Service Account**: Store credentials securely
- **Rate Limiting**: Firebase has default rate limits per project
- **Monitoring**: Use Firebase Console for message delivery stats

#### 3. Server

- **Process Manager**: Use `pm2` for process management

```bash
npm install -g pm2
pm2 start src/index.js --name "fcm-backend"
pm2 startup
pm2 save
```

#### 4. Logging

- **Structured Logging**: Replace console logs with Winston/Bunyan
- **Log Aggregation**: Use ELK stack or Datadog
- **Error Tracking**: Integrate Sentry for error monitoring

#### 5. Monitoring

- **Health Check Endpoint**: Add `/health` endpoint
- **Metrics**: Monitor CPU, memory, database connections
- **Alerts**: Set up alerts for failures

---

### Scaling Strategies

1. **Horizontal Scaling**:
   - Run multiple instances behind load balancer
   - Use Redis for session management (if needed)

2. **Database Optimization**:
   - Add indexes for common queries
   - Archive old tokens periodically
   - Use TTL indexes for automatic cleanup

3. **Firebase Optimization**:
   - Batch messages when possible
   - Use topic-based messaging for broadcasts
   - Monitor Firebase quota usage

---

## Summary

This FCM backend provides a complete solution for:

✅ Managing device tokens across multiple platforms
✅ Sending targeted notifications to users, devices, or topics
✅ Automatic cleanup of invalid tokens
✅ Robust validation and error handling
✅ Scalable architecture with separation of concerns
✅ Firebase integration for reliable delivery
✅ MongoDB persistence for token management

The modular design allows easy extension for features like:
- Message scheduling
- A/B testing notifications
- Advanced analytics
- User preferences/notification settings
- Multi-language support