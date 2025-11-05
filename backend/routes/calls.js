import express from 'express';
import { getDB } from '../db/db.js';
import { matchKnowledgeBase, createEscalation, publishEscalationToLiveKit } from '../agent/agent.js';

const router = express.Router();

router.post('/inbound', async (req, res) => {
  try {
    const { caller, utterance } = req.body;

    if (!caller || !utterance) {
      return res.status(400).json({ error: 'caller and utterance are required' });
    }

    console.log('Inbound call from:', caller.phone, caller.name, '- Question:', utterance);

    const db = getDB();

    let callerRecord = await db.get('SELECT * FROM callers WHERE phone = ?', [caller.phone]);

    if (!callerRecord) {
      const result = await db.run(
        'INSERT INTO callers (phone, name, metadata) VALUES (?, ?, ?)',
        [caller.phone, caller.name, JSON.stringify({})]
      );
      callerRecord = { id: result.lastID, phone: caller.phone, name: caller.name };
    }

    const kbMatch = await matchKnowledgeBase(utterance);

    if (kbMatch) {
      console.log('Knowledge base match found:', kbMatch.id);
      return res.json({
        status: 'answered',
        answer: kbMatch.answer_text
      });
    }

    console.log('No knowledge base match, escalating to supervisor');
    const requestId = await createEscalation(callerRecord.id, utterance);

    const request = await db.get(`
      SELECT hr.*, c.phone, c.name as caller_name
      FROM help_requests hr
      JOIN callers c ON hr.caller_id = c.id
      WHERE hr.id = ?
    `, [requestId]);

    const livekitUrl = process.env.LIVEKIT_URL || 'ws://localhost:7880';
    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;

    if (apiKey && apiSecret) {
      await publishEscalationToLiveKit(request, livekitUrl, apiKey, apiSecret);
    }

    res.json({
      status: 'escalated',
      requestId
    });

  } catch (error) {
    console.error('Error handling inbound call:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
