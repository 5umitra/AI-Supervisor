import { useState, useEffect, useCallback } from 'react';
import { Room } from 'livekit-client';
import { HeadphonesIcon, BookOpen, AlertCircle } from 'lucide-react';
import PendingRequests from './pages/PendingRequests';
import KBList from './pages/KBList';
import SimulateCall from './components/SimulateCall';
import { getLivekitToken } from './utils/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('pending');
  const [realtimeRequests, setRealtimeRequests] = useState([]);
  const [kbRefreshTrigger, setKbRefreshTrigger] = useState(0);
  const [livekitConnected, setLivekitConnected] = useState(false);
  const [room, setRoom] = useState(null);

  useEffect(() => {
    connectToLiveKit();
    return () => {
      if (room) {
        room.disconnect();
      }
    };
  }, []);

  async function connectToLiveKit() {
    try {
      const { token } = await getLivekitToken('supervisor-ui', 'supervisor-room');

      const newRoom = new Room();

      newRoom.on('dataReceived', (payload) => {
        const decoder = new TextDecoder();
        const text = decoder.decode(payload);
        const data = JSON.parse(text);

        console.log('LiveKit data received:', data);

        if (data.type === 'escalate') {
          setRealtimeRequests(prev => [data.request, ...prev]);
        } else if (data.type === 'timeout') {
          console.log('Request timed out:', data.requestId);
        } else if (data.type === 'answer') {
          console.log('Answer published:', data.requestId);
        }
      });

      await newRoom.connect('wss://superman-x4c0ol7b.livekit.cloud', token);
      setRoom(newRoom);
      setLivekitConnected(true);
      console.log('Connected to LiveKit');
    } catch (error) {
      console.error('Failed to connect to LiveKit:', error);             
      setLivekitConnected(false);
    }
  }

  function handleRequestAnswered() {
    setKbRefreshTrigger(prev => prev + 1);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <HeadphonesIcon size={32} className="text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">
                AI Receptionist
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <div
                className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
                  livekitConnected
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                }`}
              >
                <div
                  className={`w-2 h-2 rounded-full ${
                    livekitConnected ? 'bg-green-500' : 'bg-red-500'
                  }`}
                />
                {livekitConnected ? 'LiveKit Connected' : 'LiveKit Disconnected'}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <SimulateCall />

        {!livekitConnected && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 flex items-start gap-3">
            <AlertCircle size={20} className="text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-800">
              <p className="font-semibold mb-1">LiveKit Not Connected</p>
              <p>Real-time escalations may not appear. Check that LiveKit server is running and environment variables are configured.</p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-gray-200">
            <nav className="flex">
              <button
                onClick={() => setActiveTab('pending')}
                className={`px-6 py-3 font-semibold border-b-2 transition-colors ${
                  activeTab === 'pending'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                Pending Requests
              </button>
              <button
                onClick={() => setActiveTab('kb')}
                className={`px-6 py-3 font-semibold border-b-2 transition-colors flex items-center gap-2 ${
                  activeTab === 'kb'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <BookOpen size={18} />
                Knowledge Base
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'pending' && (
              <PendingRequests
                realtimeRequests={realtimeRequests}
                onRequestAnswered={handleRequestAnswered}
              />
            )}
            {activeTab === 'kb' && (
              <KBList refreshTrigger={kbRefreshTrigger} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
