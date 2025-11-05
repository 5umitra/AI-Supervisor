const API_BASE = '/api';

export async function simulateInboundCall(caller, utterance) {
  const response = await fetch(`${API_BASE}/calls/inbound`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ caller, utterance })
  });
  return response.json();
}

export async function getPendingRequests() {
  const response = await fetch(`${API_BASE}/supervisor/requests?status=pending`);
  return response.json();
}

export async function answerRequest(id, supervisorId, answerText, addToKb) {
  const response = await fetch(`${API_BASE}/supervisor/requests/${id}/answer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      supervisor_id: supervisorId,
      answer_text: answerText,
      add_to_kb: addToKb
    })
  });
  return response.json();
}

export async function getKnowledgeBase() {
  const response = await fetch(`${API_BASE}/kb`);
  return response.json();
}

export async function getLivekitToken(identity, room) {
  const response = await fetch(`${API_BASE}/token?identity=${identity}&room=${room}`);
  return response.json();
}
