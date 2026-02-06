const API_BASE = location.origin.includes(':5000')
  ? location.origin // served by Flask during dev
  : 'http://localhost:5000'; // adjust if you host separately

const chatEl = document.getElementById('chat');
const formEl = document.getElementById('chatForm');
const promptEl = document.getElementById('prompt');
const modelSelect = document.getElementById('modelSelect');
const refreshBtn = document.getElementById('refreshModels');

// Persist minimal history in memory (you can persist in localStorage if you want)
let history = []; // each item: {role:"user"|"assistant", content:"..."}

function addMessage(role, content) {
  const bubble = document.createElement('div');
  bubble.className = `bubble ${role}`;
  bubble.textContent = content;
  chatEl.appendChild(bubble);
  chatEl.scrollTop = chatEl.scrollHeight;
}

async function fetchModels() {
  try {
    const r = await fetch(`${API_BASE}/api/models`);
    const data = await r.json();
    if (data.models && Array.isArray(data.models)) {
      modelSelect.innerHTML = '';
      for (const m of data.models) {
        const opt = document.createElement('option');
        opt.value = m.name;
        opt.textContent = m.name;
        modelSelect.appendChild(opt);
      }
    }
  } catch (e) {
    console.warn('Could not fetch models:', e);
  }
}

refreshBtn.addEventListener('click', (e) => {
  e.preventDefault();
  fetchModels();
});

formEl.addEventListener('submit', async (e) => {
  e.preventDefault();
  const text = promptEl.value.trim();
  if (!text) return;

  // Render user message
  addMessage('user', text);

  // Send to backend
  const model = modelSelect.value || 'llama3.1:8b-instruct-q4_0';
  try {
    const r = await fetch(`${API_BASE}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        message: text,
        history
      })
    });

    const data = await r.json();
    if (r.ok) {
      const reply = data.reply || '(no reply)';
      addMessage('assistant', reply);

      // Update history after successful turn
      history.push({ role: 'user', content: text });
      history.push({ role: 'assistant', content: reply });
    } else {
      addMessage('assistant', `Error: ${data.error || r.statusText}`);
    }
  } catch (err) {
    addMessage('assistant', `Network error: ${err.message}`);
  } finally {
    promptEl.value = '';
    promptEl.focus();
  }
});

// Initial UI
addMessage('assistant', 'Hi! Ask me anything.');
// Optional: auto-load model list
// fetchModels();
