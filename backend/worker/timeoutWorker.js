import { getDB } from '../db/db.js';
import { Room } from 'livekit-client';

export function startTimeoutWorker() {
  setInterval(async () => {
    try {
      const db = getDB();
      const now = new Date().toISOString();

      const timedOutRequests = await db.all(
        `SELECT * FROM help_requests
         WHERE status = 'PENDING' AND timeout_at < ?`,
        [now]
      );

      if (timedOutRequests.length > 0) {
        console.log(`Found ${timedOutRequests.length} timed out requests`);

        for (const request of timedOutRequests) {
          await db.run(
            'UPDATE help_requests SET status = ?, updated_at = ? WHERE id = ?',
            ['UNRESOLVED', now, request.id]
          );

          const livekitUrl = process.env.LIVEKIT_URL || 'ws://localhost:7880';
          const apiKey = process.env.LIVEKIT_API_KEY;
          const apiSecret = process.env.LIVEKIT_API_SECRET;

          if (apiKey && apiSecret) {
            try {
              const { AccessToken } = await import('livekit-server-sdk');

              const token = new AccessToken(apiKey, apiSecret, {
                identity: 'timeout-worker',
                ttl: '5m'
              });
              token.addGrant({ roomJoin: true, room: 'supervisor-room' });
              const jwt = await token.toJwt();

              const room = new Room();
              await room.connect(livekitUrl, jwt);

              const encoder = new TextEncoder();
              const data = encoder.encode(JSON.stringify({
                type: 'timeout',
                requestId: request.id
              }));

              await room.localParticipant.publishData(data, { reliable: true });
              await room.disconnect();

              console.log('Published timeout notification for request:', request.id);
            } catch (error) {
              console.error('Failed to publish timeout to LiveKit:', error);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error in timeout worker:', error);
    }
  }, 60 * 1000);

  console.log('Timeout worker started (checks every 60 seconds)');
}
