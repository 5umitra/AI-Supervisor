# Quick Start Guide

## 1. Install Dependencies

```bash
npm install
```

## 2. Seed the Database

```bash
npm run seed
```

This creates the SQLite database and adds two sample knowledge base entries related to the salon:
- Business hours question
- Appointment booking question

## 3. Start the Application

```bash
npm run dev
```

This starts:
- Backend server on http://localhost:3000
- Frontend dev server on http://localhost:5173

## 4. Open the UI

Navigate to http://localhost:5173 in your browser.

## 5. Test the Flow

### Test 1: Question answered from Knowledge Base

1. In the "Simulate Inbound Call" form, use the pre-filled values:
   - Name: Emily Parker
   - Phone: 555-1200
   - Question: "What are your salon hours?"

2. Click "Simulate Call"

3. You should see:
   ```json
   {
     "status": "answered",
     "answer": "Glamour Studio Salon is open Monday–Saturday, 10 AM–7 PM."
   }
   ```

### Test 2: Question escalated to supervisor

1. Change the question to: "Do you offer bridal makeup packages?"

2. Click "Simulate Call"

3. You should see:
   ```json
   {
     "status": "escalated",
     "requestId": 1
   }
   ```

4. Check the "Pending Requests" tab — the request should appear there.

5. Click "Answer" on the request.

6. Enter an answer like: "Yes, we offer customizable bridal makeup packages starting from ₹3,000."

7. Check "Add to knowledge base."

8. Click "Submit Answer."

9. Switch to the "Knowledge Base" tab — your new bridal makeup entry should now appear there.

### Test 3: Auto-answer from newly added KB entry

1. Simulate another call with the same question: "Do you offer bridal makeup packages?"

2. This time it should be automatically answered from the knowledge base!

## Using curl (Alternative)

### Simulate a call:
```bash
curl -X POST http://localhost:3000/api/calls/inbound \
  -H "Content-Type: application/json" \
  -d '{
    "caller": {"phone": "555-1200", "name": "Emily Parker"},
    "utterance": "What are your salon hours?"
  }'
```

### Get pending requests:
```bash
curl http://localhost:3000/api/supervisor/requests?status=pending
```

### Answer a request:
```bash
curl -X POST http://localhost:3000/api/supervisor/requests/1/answer \
  -H "Content-Type: application/json" \
  -d '{
    "supervisor_id": "supervisor-1",
    "answer_text": "Yes, we offer bridal makeup packages starting from ₹3,000.",
    "add_to_kb": true
  }'
```

## LiveKit Configuration (Optional)

For real-time notifications, you need a LiveKit server. If not configured, the app works in polling mode.

1. Install LiveKit locally or use LiveKit Cloud
2. Update `.env` with your credentials:
   ```
   LIVEKIT_API_KEY=your_key
   LIVEKIT_API_SECRET=your_secret
   LIVEKIT_URL=ws://your_livekit_url
   ```
3. Restart the application

When LiveKit is connected, new escalations and supervisor answers appear instantly in the UI without refreshing.

## Troubleshooting

**Port already in use:** Change `PORT` in `.env`

**Database errors:** Delete `data.db` and run `npm run seed` again

**LiveKit not connecting:** This is expected if you don't have LiveKit configured. The app still works!

## Next Steps

- Add more salon-related FAQs (pricing, services, appointment policies)
- Test the 10-minute timeout (unanswered requests become UNRESOLVED)
- Explore the database with `sqlite3 data.db`
- Customize the UI styling for salon branding (colors, logo, name)
