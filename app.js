import { HologramAvatar } from './hologram.js';
import { HoloVoice } from './voice.js';

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

let voiceEnabled = false;
let recognizer;
let listening = false;
let avatar;
const holoVoice = new HoloVoice();

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

function speak(text) {
  if (!voiceEnabled) return;
  avatar?.setSpeaking(true);
  holoVoice.speak(text, {
    onStart: () => avatar?.setSpeaking(true),
    onViseme: (viseme) => avatar?.setViseme(viseme),
    onEnd: () => avatar?.setSpeaking(false)
  });
}

function processPrompt(prompt, source = 'Usuario') {
  const cleanPrompt = prompt.trim();
  if (!cleanPrompt) return;

  addChat(source, cleanPrompt);
  const answer = aiResponse(cleanPrompt);
  addChat('CEO AI', answer);
  speak(answer);
}

function setMicStatus(text, active = false) {
  const mic = $('micStatus');
  mic.textContent = text;
  mic.classList.toggle('listening-on', active);
}

function maybeInitRecognizer() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition || recognizer) return;

  recognizer = new SpeechRecognition();
  recognizer.lang = 'es-ES';
  recognizer.interimResults = true;
  recognizer.continuous = true;
  recognizer.maxAlternatives = 1;

  recognizer.onstart = () => {
    listening = true;
    setMicStatus('Escuchando...', true);
    $('toggleListenBtn').textContent = 'Detener escucha';
    addChat('Sistema', '🎤 Escucha activada. Habla cuando quieras y te confirmaré lo que recibí.');
  };

  recognizer.onend = () => {
    listening = false;
    setMicStatus('No escuchando', false);
    $('toggleListenBtn').textContent = 'Iniciar escucha';
  };

  recognizer.onerror = (event) => {
    setMicStatus(`Error de micrófono: ${event.error}`, false);
    addChat('Sistema', `No pude usar el micrófono (${event.error}). Revisa permisos del navegador.`);
  };

  recognizer.onresult = (event) => {
    let finalTranscript = '';
    let interim = '';

    for (let i = event.resultIndex; i < event.results.length; i += 1) {
      const transcript = event.results[i][0].transcript;
      if (event.results[i].isFinal) finalTranscript += transcript;
      else interim += transcript;
    }

    if (interim) {
      $('lastHeard').textContent = `Escuchando: ${interim}`;
    }

    if (finalTranscript.trim()) {
      $('lastHeard').textContent = finalTranscript.trim();
      addChat('Sistema', `✅ Te escuché: "${finalTranscript.trim()}"`);
      processPrompt(finalTranscript, 'Usuario (voz)');
    }
  };
}

function setupVoice() {
  const status = $('voiceStatus');
  const toggleVoiceBtn = $('toggleVoiceBtn');
  const toggleListenBtn = $('toggleListenBtn');

  maybeInitRecognizer();

  toggleVoiceBtn.addEventListener('click', () => {
    voiceEnabled = !voiceEnabled;
    status.textContent = voiceEnabled ? 'Voz activada' : 'Voz desactivada';
    status.classList.toggle('voice-on', voiceEnabled);
    toggleVoiceBtn.textContent = voiceEnabled ? 'Desactivar voz' : 'Activar voz';

    if (voiceEnabled) addChat('Sistema', 'Voz de respuesta activada.');
    else window.speechSynthesis.cancel();
  });

  toggleListenBtn.addEventListener('click', () => {
    if (!recognizer) {
      addChat('Sistema', 'Este navegador no soporta reconocimiento de voz. Usa chat escrito.');
      return;
    }

    if (!listening) recognizer.start();
    else {
      recognizer.stop();
      addChat('Sistema', '🎤 Escucha detenida.');
    }
  });
}

function setupForms() {
  $('chatForm').addEventListener('submit', (ev) => {
    ev.preventDefault();
    const input = $('chatInput');
    processPrompt(input.value, 'Usuario');
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
  avatar = new HologramAvatar($('holoViewport'));
  setupVoice();
  setupForms();
  renderChat();
  renderProjects();
  renderBots();
  renderAgents();
  renderKnowledge();
}

init();
