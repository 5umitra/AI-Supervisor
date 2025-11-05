import dotenv from 'dotenv';
dotenv.config();
//dotenv.config({ path: './backend/.env' });  // Load environment variables

import express from 'express';
import cors from 'cors';
import { initDB } from './db/db.js';
import callsRouter from './routes/calls.js';
import supervisorRouter from './routes/supervisor.js';
import kbRouter from './routes/kb.js';
import tokenRouter from './livekit/token.js';
import { startTimeoutWorker } from './worker/timeoutWorker.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/api/calls', callsRouter);
app.use('/api/supervisor', supervisorRouter);
app.use('/api/kb', kbRouter);
app.use('/api/token', tokenRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

async function start() {
  try {
    await initDB();
    startTimeoutWorker();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`API endpoints:`);
      console.log(`  POST http://localhost:${PORT}/api/calls/inbound`);
      console.log(`  GET  http://localhost:${PORT}/api/supervisor/requests?status=pending`);
      console.log(`  POST http://localhost:${PORT}/api/supervisor/requests/:id/answer`);
      console.log(`  GET  http://localhost:${PORT}/api/kb`);
      console.log(`  GET  http://localhost:${PORT}/api/token?identity=<>&room=<>`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();
