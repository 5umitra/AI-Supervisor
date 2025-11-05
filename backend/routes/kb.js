import express from 'express';
import { getDB } from '../db/db.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const db = getDB();
    const kb = await db.all('SELECT * FROM knowledge_base ORDER BY created_at DESC');
    res.json(kb);
  } catch (error) {
    console.error('Error fetching knowledge base:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
