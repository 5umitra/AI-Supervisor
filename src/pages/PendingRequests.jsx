import { useState, useEffect } from 'react';
import { Clock, User, Phone } from 'lucide-react';
import { getPendingRequests, answerRequest } from '../utils/api';
import AnswerModal from '../components/AnswerModal';

export default function PendingRequests({ realtimeRequests, onRequestAnswered }) {
  const [requests, setRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRequests();
  }, []);

  useEffect(() => {
    if (realtimeRequests.length > 0) {
      const newRequests = realtimeRequests.filter(
        rt => !requests.some(r => r.id === rt.id)
      );
      if (newRequests.length > 0) {
        setRequests(prev => [...newRequests, ...prev]);
      }
    }
  }, [realtimeRequests]);

  async function loadRequests() {
    try {
      const data = await getPendingRequests();
      setRequests(data);
    } catch (error) {
      console.error('Error loading requests:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleAnswer(id, answerText, addToKb) {
    await answerRequest(id, 'supervisor-1', answerText, addToKb);
    setRequests(prev => prev.filter(r => r.id !== id));
    onRequestAnswered();
  }

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Pending Requests</h2>

      {requests.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p>No pending requests</p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map(request => (
            <div
              key={request.id}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <User size={16} className="text-gray-500" />
                    <span className="font-semibold">{request.caller_name}</span>
                    <Phone size={14} className="text-gray-500" />
                    <span className="text-sm text-gray-600">{request.phone}</span>
                  </div>
                  <p className="text-gray-800 mb-2">{request.question_text}</p>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock size={14} />
                    <span>
                      TTL: {request.ttl_minutes > 0 ? `${request.ttl_minutes} min` : 'Expired'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedRequest(request)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Answer
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedRequest && (
        <AnswerModal
          request={selectedRequest}
          onClose={() => setSelectedRequest(null)}
          onSubmit={handleAnswer}
        />
      )}
    </div>
  );
}
