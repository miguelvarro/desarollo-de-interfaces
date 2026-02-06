
const API_BASE = location.origin.includes(':5000')
  ? location.origin // served by Flask
  : 'http://localhost:5000';


// DOM

const chatEl = document.getElementById('chat');
const formEl = document.getElementById('chatForm');
const promptEl = document.getElementById('prompt');
const modelSelect = document.getElementById('modelSelect');
const refreshBtn = document.getElementById('refreshModels');


// State

let history = []; // { role: "user" | "assistant", content: string }


// Helpers

function addMessage(role, content) {
  const bubble = document.createElement('div');
  bubble.className = `bubble ${role}`;
  bubble.textContent = content;
  chatEl.appendChild(bubble);
  chatEl.scrollTop = chatEl.scrollHeight;
}

async function safeJson(response) {
  const ct = response.headers.get('content-type') || '';
  if (ct.includes('application/json')) {
    return await response.json();
  }
  const text = await response.text();
  return { error: text.slice(0, 300) || 'Non-JSON response' };
}


// Models

async function fetchModels() {
  try {
    const r = await fetch(`${API_BASE}/api/models`);
    const data = await safeJson(r);

    if (!r.ok) {
      console.warn('Model fetch failed:', data.error || r.statusText);
      return;
    }

    if (!data.models || !Array.isArray(data.models)) {
      console.warn('Unexpected models payload:', data);
      return;
    }

    // Limpia selector
    modelSelect.innerHTML = '';

    // Filtra modelos de chat 
    const chatModels = data.models.filter(m =>
      !m.name.toLowerCase().includes('embed')
    );

    // Ordena por tamaño
    chatModels.sort((a, b) => {
      const pa = parseFloat(a.details?.parameter_size) || 0;
      const pb = parseFloat(b.details?.parameter_size) || 0;
      return pb - pa;
    });

    for (const m of chatModels) {
      const opt = document.createElement('option');
      opt.value = m.name;

      const size = m.details?.parameter_size
        ? ` · ${m.details.parameter_size}`
        : '';

      opt.textContent = m.name + size;

      // Marca modelo recomendado
      if (m.name.includes('llama3.1')) {
        opt.textContent += ' ⭐';
        opt.selected = true;
      }

      modelSelect.appendChild(opt);
    }
  } catch (e) {
    console.warn('Could not fetch models:', e);
  }
}

refreshBtn.addEventListener('click', (e) => {
  e.preventDefault();
  fetchModels();
});


// Chat submit

formEl.addEventListener('submit', async (e) => {
  e.preventDefault();
  const text = promptEl.value.trim();
  if (!text) return;

  
  addMessage('user', text);

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

    const data = await safeJson(r);

    if (r.ok) {
      const reply = data.reply || '(no reply)';
      addMessage('assistant', reply);

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


// Init

addMessage('assistant', 'Hi! Ask me anything.');
fetchModels();

