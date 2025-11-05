import express from 'express';
import dotenv from 'dotenv';
import { AccessToken } from 'livekit-server-sdk';




dotenv.config();
//dotenv.config({ path: './backend/.env' });


 console.log("Loaded ENV values =>", {
   LIVEKIT_API_KEY: process.env.LIVEKIT_API_KEY,
   LIVEKIT_API_SECRET: process.env.LIVEKIT_API_SECRET,
   LIVEKIT_URL: process.env.LIVEKIT_URL
 });


const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { identity, room } = req.query;

    if (!identity || !room) {
      return res.status(400).json({ error: 'identity and room are required' });
    }

    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;

    if (!apiKey || !apiSecret) {
      return res.status(500).json({ error: 'LiveKit credentials not configured' });
    }

    const token = new AccessToken(apiKey, apiSecret, {
      identity,
      ttl: '10h',
    });

    token.addGrant({
      roomJoin: true,
      room,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });

    const jwt = await token.toJwt();
    res.json({ token: jwt });
  } catch (error) {
    console.error('Error generating token:', error);
    res.status(500).json({ error: 'Failed to generate token' });
  }
});

export default router;
