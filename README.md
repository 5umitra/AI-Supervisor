# Human-in-the-Loop AI Supervisor

A full-stack application implementing an AI supervisor system with real-time escalation using LiveKit for data messaging. When the AI agent cannot answer a customer inquiry, it escalates to human supervisors who can respond and add answers to the knowledge base.

## Tech Stack

- **Backend**: Node.js + Express (plain JavaScript)
- **Database**: SQLite with `sqlite3` and `sqlite` drivers
- **Real-time**: LiveKit (server SDK for tokens, client SDK for data messaging)
- **Frontend**: React + Vite + Tailwind CSS

## Features

- **Inbound Call Simulation**: Simulate customer calls with questions
- **Knowledge Base Matching**: Automatic answers from KB when patterns match
- **Real-time Escalation**: LiveKit data messages notify supervisors instantly
- **Supervisor UI**: Answer pending requests and manage knowledge base
- **Timeout Worker**: Auto-expire requests after 10 minutes
- **KB Management**: Add answers to knowledge base for future auto-responses

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Edit `.env`:

```
LIVEKIT_API_KEY=your_api_key_here
LIVEKIT_API_SECRET=your_api_secret_here
LIVEKIT_URL=ws://localhost:7880
PORT=3000
```

**Note**: If you don't have a LiveKit server running, the application will still work but real-time notifications won't function. You can:
- Install LiveKit locally: https://docs.livekit.io/home/self-hosting/local/
- Use LiveKit Cloud: https://livekit.io/cloud
- Or continue without LiveKit (polling-only mode)

### 3. Run the Application

**Development mode** (starts both backend and frontend):

```bash
npm run dev
```

**Production mode** (backend only):

```bash
npm start
```

The backend runs on `http://localhost:3000`
The frontend runs on `http://localhost:5173` (Vite default)

## Database Schema

The SQLite database (`data.db`) is created automatically on first run with three tables:

### `callers`
- `id` - INTEGER PRIMARY KEY AUTOINCREMENT
- `phone` - TEXT
- `name` - TEXT
- `metadata` - JSON

### `help_requests`
- `id` - INTEGER PRIMARY KEY AUTOINCREMENT
- `caller_id` - INTEGER (FK to callers)
- `question_text` - TEXT
- `status` - TEXT (PENDING, RESOLVED, UNRESOLVED)
- `created_at` - DATETIME
- `updated_at` - DATETIME
- `timeout_at` - DATETIME (10 minutes from creation)
- `supervisor_id` - TEXT
- `resolution_text` - TEXT

### `knowledge_base`
- `id` - INTEGER PRIMARY KEY AUTOINCREMENT
- `question_pattern` - TEXT
- `answer_text` - TEXT
- `created_from_request_id` - INTEGER (FK to help_requests)
- `created_at` - DATETIME

## API Endpoints

### POST `/api/calls/inbound`

Simulate an inbound call. The agent attempts to match the question against the knowledge base.

**Request:**
```json
{
  "caller": {
    "phone": "555-0100",
    "name": "John Doe"
  },
  "utterance": "What are your business hours?"
}
```

**Response (answered from KB):**
```json
{
  "status": "answered",
  "answer": "We are open Monday-Friday 9am-5pm EST"
}
```

**Response (escalated to supervisor):**
```json
{
  "status": "escalated",
  "requestId": 1
}
```

**Example curl:**
```bash
curl -X POST http://localhost:3000/api/calls/inbound \
  -H "Content-Type: application/json" \
  -d '{
    "caller": {"phone": "555-0100", "name": "John Doe"},
    "utterance": "What are your business hours?"
  }'
```

### GET `/api/supervisor/requests?status=pending`

List help requests filtered by status.

**Response:**
```json
[
  {
    "id": 1,
    "caller_id": 1,
    "question_text": "What are your business hours?",
    "status": "PENDING",
    "created_at": "2025-10-30T10:00:00.000Z",
    "timeout_at": "2025-10-30T10:10:00.000Z",
    "phone": "555-0100",
    "caller_name": "John Doe",
    "ttl_minutes": 8
  }
]
```

**Example curl:**
```bash
curl http://localhost:3000/api/supervisor/requests?status=pending
```

### POST `/api/supervisor/requests/:id/answer`

Submit an answer to a help request.

**Request:**
```json
{
  "supervisor_id": "supervisor-1",
  "answer_text": "We are open Monday-Friday 9am-5pm EST",
  "add_to_kb": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Request resolved"
}
```

**Example curl:**
```bash
curl -X POST http://localhost:3000/api/supervisor/requests/1/answer \
  -H "Content-Type: application/json" \
  -d '{
    "supervisor_id": "supervisor-1",
    "answer_text": "We are open Monday-Friday 9am-5pm EST",
    "add_to_kb": true
  }'
```

### GET `/api/kb`

List all knowledge base entries.

**Response:**
```json
[
  {
    "id": 1,
    "question_pattern": "What are your business hours?",
    "answer_text": "We are open Monday-Friday 9am-5pm EST",
    "created_from_request_id": 1,
    "created_at": "2025-10-30T10:05:00.000Z"
  }
]
```

**Example curl:**
```bash
curl http://localhost:3000/api/kb
```

### GET `/api/token?identity=<identity>&room=<room>`

Generate a LiveKit access token for joining a room.

**Example:**
```bash
curl "http://localhost:3000/api/token?identity=supervisor-1&room=supervisor-room"
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

## Demo Flow

### Step 1: Start the application

```bash
npm run dev
```

### Step 2: Simulate an inbound call (no KB match)

Using the UI:
1. Open http://localhost:5173
2. Use the "Simulate Inbound Call" form
3. Enter a question like "What are your refund policies?"
4. Click "Simulate Call"

Using curl:
```bash
curl -X POST http://localhost:3000/api/calls/inbound \
  -H "Content-Type: application/json" \
  -d '{
    "caller": {"phone": "555-0200", "name": "Jane Smith"},
    "utterance": "What are your refund policies?"
  }'
```

**Expected response:**
```json
{
  "status": "escalated",
  "requestId": 1
}
```

### Step 3: Check the Supervisor UI

1. The request should appear in the "Pending Requests" tab (if LiveKit is connected, it appears instantly via real-time data message)
2. You'll see the caller info, question, and time-to-live (TTL)

### Step 4: Answer the request

1. Click the "Answer" button on the request
2. Enter your answer: "We offer 30-day refunds on all products"
3. Check "Add to knowledge base"
4. Click "Submit Answer"

### Step 5: View Knowledge Base

1. Switch to the "Knowledge Base" tab
2. You'll see the newly added entry

### Step 6: Test KB auto-answer

Simulate another call with the same or similar question:

```bash
curl -X POST http://localhost:3000/api/calls/inbound \
  -H "Content-Type: application/json" \
  -d '{
    "caller": {"phone": "555-0300", "name": "Bob Johnson"},
    "utterance": "What are your refund policies?"
  }'
```

**Expected response:**
```json
{
  "status": "answered",
  "answer": "We offer 30-day refunds on all products"
}
```

The question was answered automatically from the knowledge base!

## Architecture

### Backend Structure

```
backend/
├── server.js           # Express app setup & initialization
├── db/
│   └── db.js          # SQLite database initialization
├── routes/
│   ├── calls.js       # Inbound call handling
│   ├── supervisor.js  # Supervisor request management
│   └── kb.js          # Knowledge base queries
├── agent/
│   └── agent.js       # KB matching & LiveKit publishing
├── livekit/
│   └── token.js       # LiveKit token generation
└── worker/
    └── timeoutWorker.js # Background timeout checker
```

### Frontend Structure

```
src/
├── main.jsx           # React entry point
├── App.jsx            # Main app with LiveKit connection
├── pages/
│   ├── PendingRequests.jsx  # Pending requests view
│   └── KBList.jsx           # Knowledge base view
├── components/
│   ├── AnswerModal.jsx      # Answer submission modal
│   └── SimulateCall.jsx     # Call simulation form
└── utils/
    └── api.js         # API wrapper functions
```

## LiveKit Integration

### Server-side Publishing

When a request is escalated or answered, the backend:
1. Generates a short-lived token
2. Connects to the LiveKit room as `agent-publisher`
3. Publishes a reliable data message
4. Disconnects

### Client-side Subscription

The supervisor UI:
1. Connects to the LiveKit room on load
2. Listens for `dataReceived` events
3. Updates the UI when escalations arrive
4. Remains connected for real-time updates

### Data Message Format

**Escalation:**
```json
{
  "type": "escalate",
  "request": {
    "id": 1,
    "question_text": "What are your refund policies?",
    "caller_name": "Jane Smith",
    "phone": "555-0200",
    "ttl_minutes": 10
  }
}
```

**Answer:**
```json
{
  "type": "answer",
  "requestId": 1,
  "answer_text": "We offer 30-day refunds on all products"
}
```

**Timeout:**
```json
{
  "type": "timeout",
  "requestId": 1
}
```

## Timeout Worker

A background worker runs every 60 seconds checking for:
- Requests with `status = 'PENDING'`
- Where `timeout_at < now()`

These are moved to `UNRESOLVED` status and a timeout notification is published to LiveKit.

## Notes

- The database file `data.db` is created automatically and should not be committed to version control
- If LiveKit is not configured, the app works in polling mode (UI manually refreshes)
- The knowledge base uses simple case-insensitive substring matching
- Timeout is set to 10 minutes from request creation
- All timestamps are stored in ISO 8601 format

## Troubleshooting

### LiveKit not connecting

1. Verify LiveKit server is running
2. Check `.env` has correct credentials
3. Ensure `LIVEKIT_URL` is accessible

### Database errors

1. Delete `data.db` and restart the server to recreate
2. Check file permissions

### Port conflicts

Change `PORT` in `.env` if 3000 is in use

## Future Enhancements

- Authentication for supervisors
- Advanced KB matching (embeddings/vector search)
- Audio/video call support via LiveKit
- Analytics dashboard
- Multiple supervisor rooms
- Webhook notifications
