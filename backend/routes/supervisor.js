import express from 'express';
import { getDB } from '../db/db.js';
import { publishAnswerToLiveKit } from '../agent/agent.js';

const router = express.Router();

router.get('/requests', async (req, res) => {
  try {
    const { status } = req.query;
    const db = getDB();

    let query = `
      SELECT hr.*, c.phone, c.name as caller_name,
             CAST((julianday(hr.timeout_at) - julianday('now')) * 24 * 60 AS INTEGER) as ttl_minutes
      FROM help_requests hr
      JOIN callers c ON hr.caller_id = c.id
    `;

    const params = [];
    if (status) {
      query += ' WHERE hr.status = ?';
      params.push(status.toUpperCase());
    }

    query += ' ORDER BY hr.created_at DESC';

    const requests = await db.all(query, params);

    res.json(requests);
  } catch (error) {
    console.error('Error fetching requests:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/requests/:id/answer', async (req, res) => {
  try {
    const { id } = req.params;
    const { supervisor_id, answer_text, add_to_kb } = req.body;

    if (!supervisor_id || !answer_text) {
      return res.status(400).json({ error: 'supervisor_id and answer_text are required' });
    }

    console.log(`Supervisor ${supervisor_id} answering request ${id}`);

    const db = getDB();
    const now = new Date().toISOString();

    await db.run(
      `UPDATE help_requests
       SET status = 'RESOLVED',
           resolution_text = ?,
           supervisor_id = ?,
           updated_at = ?
       WHERE id = ?`,
      [answer_text, supervisor_id, now, id]
    );

    if (add_to_kb) {
      const request = await db.get('SELECT * FROM help_requests WHERE id = ?', [id]);
      await db.run(
        `INSERT INTO knowledge_base (question_pattern, answer_text, created_from_request_id)
         VALUES (?, ?, ?)`,
        [request.question_text, answer_text, id]
      );
      console.log('Added to knowledge base');
    }

    const livekitUrl = process.env.LIVEKIT_URL || 'ws://localhost:7880';
    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;

    if (apiKey && apiSecret) {
      await publishAnswerToLiveKit(parseInt(id), answer_text, livekitUrl, apiKey, apiSecret);
    }

    res.json({ success: true, message: 'Request resolved' });

  } catch (error) {
    console.error('Error answering request:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
