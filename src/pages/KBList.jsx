import { useState, useEffect } from 'react';
import { Book } from 'lucide-react';
import { getKnowledgeBase } from '../utils/api';

export default function KBList({ refreshTrigger }) {
  const [kb, setKb] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadKB();
  }, [refreshTrigger]);

  async function loadKB() {
    try {
      const data = await getKnowledgeBase();
      setKb(data);
    } catch (error) {
      console.error('Error loading knowledge base:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Knowledge Base</h2>

      {kb.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Book size={48} className="mx-auto mb-4 opacity-50" />
          <p>No knowledge base entries yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {kb.map(entry => (
            <div
              key={entry.id}
              className="border border-gray-200 rounded-lg p-4"
            >
              <div className="mb-2">
                <span className="text-sm text-gray-500">Question Pattern:</span>
                <p className="font-semibold text-gray-800">{entry.question_pattern}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Answer:</span>
                <p className="text-gray-700">{entry.answer_text}</p>
              </div>
              {entry.created_from_request_id && (
                <div className="mt-2 text-xs text-gray-500">
                  Created from request #{entry.created_from_request_id}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
