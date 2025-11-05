import { getDB } from '../db/db.js';
import { Room } from 'livekit-client';

export async function matchKnowledgeBase(questionText) {
  const db = getDB();
  const kb = await db.all('SELECT * FROM knowledge_base');

  const lowerQuestion = questionText.toLowerCase();

  for (const entry of kb) {
    const pattern = entry.question_pattern.toLowerCase();
    if (lowerQuestion.includes(pattern) || pattern.includes(lowerQuestion)) {
      return entry;
    }
  }

  return null;
}

export async function createEscalation(callerId, questionText) {
  const db = getDB();
  const timeoutAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  const result = await db.run(
    `INSERT INTO help_requests (caller_id, question_text, status, timeout_at)
     VALUES (?, ?, 'PENDING', ?)`,
    [callerId, questionText, timeoutAt]
  );

  return result.lastID;
}

export async function publishEscalationToLiveKit(requestData, livekitUrl, apiKey, apiSecret) {
  try {
    const { AccessToken } = await import('livekit-server-sdk');

    const token = new AccessToken(apiKey, apiSecret, {
      identity: 'agent-publisher',
      ttl: '5m'
    });
    token.addGrant({ roomJoin: true, room: 'supervisor-room' });
    const jwt = await token.toJwt();

    const room = new Room();
    await room.connect(livekitUrl, jwt);

    const encoder = new TextEncoder();
    const data = encoder.encode(JSON.stringify({
      type: 'escalate',
      request: requestData
    }));

    await room.localParticipant.publishData(data, { reliable: true });

    console.log('Published escalation to LiveKit:', requestData.id);

    await room.disconnect();
  } catch (error) {
    console.error('Failed to publish to LiveKit:', error);
  }
}

export async function publishAnswerToLiveKit(requestId, answerText, livekitUrl, apiKey, apiSecret) {
  try {
    const { AccessToken } = await import('livekit-server-sdk');

    const token = new AccessToken(apiKey, apiSecret, {
      identity: 'agent-publisher',
      ttl: '5m'
    });
    token.addGrant({ roomJoin: true, room: 'supervisor-room' });
    const jwt = await token.toJwt();

    const room = new Room();
    await room.connect(livekitUrl, jwt);

    const encoder = new TextEncoder();
    const data = encoder.encode(JSON.stringify({
      type: 'answer',
      requestId,
      answer_text: answerText
    }));

    await room.localParticipant.publishData(data, { reliable: true });

    console.log('Published answer to LiveKit for request:', requestId);

    await room.disconnect();
  } catch (error) {
    console.error('Failed to publish answer to LiveKit:', error);
  }
}
