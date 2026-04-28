const storageKey = 'holotrader-workspace-v1';

const initialState = {
  chat: [
    {
      role: 'CEO AI',
      text: 'Bienvenido. Soy tu CEO de agentes para trading. Puedo ayudarte a definir EAs, módulos y planes de mejora.',
      ts: new Date().toISOString()
    }
  ],
  projects: [],
  bots: [],
  agents: [
    { name: 'Scout-Synth', role: 'Investigación de índices sintéticos' },
    { name: 'MQL5-Forge', role: 'Programación de módulos' },
    { name: 'Merge-Core', role: 'Integración de módulos' }
  ],
  knowledge: []
};

const state = loadState();
const $ = (id) => document.getElementById(id);

function loadState() {
  try {
    const raw = localStorage.getItem(storageKey);
    return raw ? JSON.parse(raw) : structuredClone(initialState);
  } catch {
    return structuredClone(initialState);
  }
}

function persist() {
  localStorage.setItem(storageKey, JSON.stringify(state));
}

function addChat(role, text) {
  state.chat.push({ role, text, ts: new Date().toISOString() });
  persist();
  renderChat();
}

function renderChat() {
  const log = $('chatLog');
  log.innerHTML = '';
  const tpl = $('chatItemTemplate');

  state.chat.slice(-30).forEach((msg) => {
    const node = tpl.content.cloneNode(true);
    node.querySelector('.meta').textContent = `${msg.role} · ${new Date(msg.ts).toLocaleString()}`;
    node.querySelector('.text').textContent = msg.text;
    log.appendChild(node);
  });

  log.scrollTop = log.scrollHeight;
}

function renderProjects() {
  const map = {
    design: $('col-design'),
    dev: $('col-dev'),
    done: $('col-done')
  };

  Object.values(map).forEach((ul) => (ul.innerHTML = ''));
  state.projects.forEach((p, index) => {
    const li = document.createElement('li');
    li.textContent = `${p.name}`;

    const controls = document.createElement('div');
    controls.style.marginTop = '.4rem';

    ['design', 'dev', 'done'].forEach((next) => {
      if (next === p.state) return;
      const btn = document.createElement('button');
      btn.textContent = next;
      btn.addEventListener('click', () => {
        state.projects[index].state = next;
        persist();
        renderProjects();
      });
      controls.appendChild(btn);
    });

    li.appendChild(controls);
    map[p.state].appendChild(li);
  });
}

function renderBots() {
  const ul = $('botTimeline');
  ul.innerHTML = '';
  state.bots
    .slice()
    .reverse()
    .forEach((bot) => {
      const li = document.createElement('li');
      li.innerHTML = `<strong>${bot.name} ${bot.version}</strong><br>${bot.focus}<br><small>${new Date(bot.ts).toLocaleString()}</small>`;
      ul.appendChild(li);
    });
}

function renderAgents() {
  const ul = $('agentList');
  ul.innerHTML = '';
  state.agents.forEach((agent) => {
    const li = document.createElement('li');
    li.textContent = `${agent.name} — ${agent.role}`;
    ul.appendChild(li);
  });
}

function renderKnowledge() {
  const ul = $('knowledgeList');
  ul.innerHTML = '';
  state.knowledge.forEach((item) => {
    const li = document.createElement('li');
    li.innerHTML = `<strong>${item.name}</strong><br><small>${item.preview}</small>`;
    ul.appendChild(li);
  });
}

function aiResponse(prompt) {
  const lower = prompt.toLowerCase();
  const indexedDocs = state.knowledge.map((k) => k.name).join(', ') || 'sin documentos aún';

  if (lower.includes('mql5') || lower.includes('ea') || lower.includes('bot')) {
    return `Plan sugerido: (1) especificación del EA, (2) módulos de entrada/salida/riesgo, (3) pruebas forward y walk-forward, (4) versión incremental. Documentos indexados: ${indexedDocs}.`;
  }

  if (lower.includes('agente')) {
    return 'Puedo crear agentes de Research, Coder, Integrator y QA. Indícame nombre + misión y lo registro en el Centro de agentes.';
  }

  if (lower.includes('deriv') || lower.includes('weltrade') || lower.includes('vt')) {
    return 'Te recomiendo definir primero: instrumento, horario, spread promedio, comisión, slippage y reglas de ejecución por broker para luego adaptar el EA por entorno.';
  }

  return 'Recibido. Te propongo convertir tu idea en backlog técnico: objetivo, señales, gestión monetaria, validación y despliegue con control de versiones.';
}

let voiceEnabled = false;
let recognizer;

function speak(text) {
  if (!voiceEnabled || !window.speechSynthesis) return;
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = 'es-ES';
  utter.rate = 1;
  speechSynthesis.speak(utter);
}

function setupVoice() {
  const status = $('voiceStatus');
  const button = $('toggleVoiceBtn');
  const face = $('hologramFace');

  button.addEventListener('click', () => {
    voiceEnabled = !voiceEnabled;
    status.textContent = voiceEnabled ? 'Voz activada' : 'Voz desactivada';
    status.classList.toggle('voice-on', voiceEnabled);
    button.textContent = voiceEnabled ? 'Desactivar voz' : 'Activar voz';
    face.style.boxShadow = voiceEnabled ? '0 0 18px #6cffdf' : 'none';

    if (voiceEnabled) {
      addChat('Sistema', 'Voz activada. Puedes usar chat escrito o reconocimiento de voz si el navegador lo soporta.');
      maybeInitRecognizer();
    }
  });
}

function maybeInitRecognizer() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition || recognizer) return;

  recognizer = new SpeechRecognition();
  recognizer.lang = 'es-ES';
  recognizer.interimResults = false;
  recognizer.maxAlternatives = 1;

  recognizer.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    $('chatInput').value = transcript;
  };
}

function setupForms() {
  $('chatForm').addEventListener('submit', (ev) => {
    ev.preventDefault();
    const input = $('chatInput');
    const prompt = input.value.trim();
    if (!prompt) return;

    addChat('Usuario', prompt);
    const answer = aiResponse(prompt);
    addChat('CEO AI', answer);
    speak(answer);
    input.value = '';
  });

  $('projectForm').addEventListener('submit', (ev) => {
    ev.preventDefault();
    const name = $('projectName').value.trim();
    const stateValue = $('projectState').value;
    if (!name) return;
    state.projects.push({ name, state: stateValue });
    persist();
    renderProjects();
    ev.target.reset();
  });

  $('botForm').addEventListener('submit', (ev) => {
    ev.preventDefault();
    const name = $('botName').value.trim();
    const version = $('botVersion').value.trim();
    const focus = $('botFocus').value.trim();
    state.bots.push({ name, version, focus, ts: new Date().toISOString() });
    persist();
    renderBots();
    addChat('CEO AI', `Versión ${version} de ${name} registrada. Queda disponible para mejoras y releases futuras.`);
    ev.target.reset();
  });

  $('agentForm').addEventListener('submit', (ev) => {
    ev.preventDefault();
    const name = $('agentName').value.trim();
    const role = $('agentRole').value;
    if (!name) return;
    state.agents.push({ name, role });
    persist();
    renderAgents();
    addChat('CEO AI', `Agente ${name} creado con rol: ${role}.`);
    ev.target.reset();
  });

  $('uploadForm').addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const files = $('knowledgeFile').files;
    if (!files.length) return;

    for (const file of files) {
      const text = await file.text().catch(() => '');
      const preview = text.slice(0, 120).replace(/\s+/g, ' ') || 'Archivo binario o sin texto previsualizable';
      state.knowledge.push({ name: file.name, preview });
    }

    persist();
    renderKnowledge();
    addChat('CEO AI', `Se indexaron ${files.length} archivo(s). Los usaré como contexto operativo en próximos prompts.`);
    ev.target.reset();
  });

  $('saveSnapshotBtn').addEventListener('click', () => {
    persist();
    addChat('Sistema', 'Snapshot guardado en LocalStorage.');
  });

  $('downloadMql5').addEventListener('click', () => {
    const code = `// Plantilla base EA\n#property strict\ninput double Risk = 1.0;\nint OnInit(){ return(INIT_SUCCEEDED); }\nvoid OnTick(){ /* TODO: agregar señales y gestión */ }`;
    downloadFile('ea_template.mq5', code, 'text/plain');
  });

  $('downloadEx5').addEventListener('click', () => {
    const text = 'Placeholder EX5: compilar el .mq5 dentro de MetaEditor para generar el ejecutable real.';
    downloadFile('ea_build_placeholder.ex5', text, 'application/octet-stream');
  });
}

function downloadFile(name, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

function init() {
  setupVoice();
  setupForms();
  renderChat();
  renderProjects();
  renderBots();
  renderAgents();
  renderKnowledge();
}

init();
