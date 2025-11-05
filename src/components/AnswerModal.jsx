import { useState } from 'react';
import { X } from 'lucide-react';

export default function AnswerModal({ request, onClose, onSubmit }) {
  const [answerText, setAnswerText] = useState('');
  const [addToKb, setAddToKb] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!answerText.trim()) return;

    setSubmitting(true);
    try {
      await onSubmit(request.id, answerText, addToKb);
      onClose();
    } catch (error) {
      console.error('Error submitting answer:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-2xl font-bold">Answer Request #{request.id}</h2>
            <p className="text-gray-600 mt-1">
              From: {request.caller_name} ({request.phone})
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        <div className="bg-gray-50 p-4 rounded mb-4">
          <p className="font-semibold mb-1">Question:</p>
          <p className="text-gray-800">{request.question_text}</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block font-semibold mb-2">Your Answer:</label>
            <textarea
              value={answerText}
              onChange={(e) => setAnswerText(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-3 h-32 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Type your answer here..."
              required
            />
          </div>

          <div className="mb-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={addToKb}
                onChange={(e) => setAddToKb(e.target.checked)}
                className="w-4 h-4"
              />
              <span>Add to knowledge base for future auto-answers</span>
            </label>
          </div>

          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit Answer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
