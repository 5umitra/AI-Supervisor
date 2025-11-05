import { useState } from 'react';
import { Phone } from 'lucide-react';
import { simulateInboundCall } from '../utils/api';

export default function SimulateCall() {
  const [phone, setPhone] = useState('+91 7346078555');
  const [name, setName] = useState('Sumit Gaud');
  const [utterance, setUtterance] = useState('Who is your best barber?');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSimulate() {
    setLoading(true);
    setResult(null);

    try {
      const response = await simulateInboundCall(
        { phone, name },
        utterance
      );
      setResult(response);
    } catch (error) {
      console.error('Error simulating call:', error);
      setResult({ error: 'Failed to simulate call' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
      <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
        <Phone size={20} />
        Simulate Inbound Call
      </h3>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-semibold mb-1">Name:</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1">Phone:</label>
          <input
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2"
          />
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-semibold mb-1">Question:</label>
        <input
          type="text"
          value={utterance}
          onChange={(e) => setUtterance(e.target.value)}
          className="w-full border border-gray-300 rounded px-3 py-2"
        />
      </div>

      <button
        onClick={handleSimulate}
        disabled={loading}
        className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
      >
        {loading ? 'Simulating...' : 'Simulate Call'}
      </button>

      {result && (
        <div className={`mt-4 p-4 rounded ${result.error ? 'bg-red-50' : 'bg-blue-50'}`}>
          <pre className="text-sm overflow-auto">{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
