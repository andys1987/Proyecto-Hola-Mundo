import { HologramAvatar } from './hologram.js';
import { VoiceEngine } from './voice.js';

const storageKey = 'holotrader-workspace-v1';
const $ = (id) => document.getElementById(id);

class ChatPanel {
  constructor(state, onPrompt) { this.state = state; this.onPrompt = onPrompt; }
  render() {
    return `<section class="panel glass chat-panel"><h2>Conversación con CEO AI</h2><div id="chatLog" class="chat-log"></div><form id="chatForm" class="chat-form"><input id="chatInput" required placeholder="Escribe o dicta instrucciones..."/><button>Enviar</button></form></section>`;
  }
  bind() { $('chatForm').addEventListener('submit', (e) => { e.preventDefault(); const v = $('chatInput').value.trim(); if (!v) return; this.onPrompt(v, 'Usuario'); $('chatInput').value=''; }); this.refresh(); }
  refresh() {
    const log = $('chatLog'); log.innerHTML = '';
    this.state.chat.slice(-30).forEach((m)=>{ const n=$('chatItemTemplate').content.cloneNode(true); n.querySelector('.meta').textContent=`${m.role} · ${new Date(m.ts).toLocaleString()}`; n.querySelector('.text').textContent=m.text; log.appendChild(n); });
    log.scrollTop=log.scrollHeight;
  }
}

class SystemStatusPanel {
  render() {
    return `<section class="panel glass status-panel"><h3>Estado del sistema</h3><p><strong>Voz:</strong> <span id="voiceStatus">desactivada</span></p><p><strong>Micrófono:</strong> <span id="micStatus">No escuchando</span></p><p><strong>Última instrucción:</strong> <span id="lastHeard">—</span></p><div class="inline"><button id="toggleVoiceBtn">Activar voz</button><button id="toggleListenBtn">Iniciar escucha</button></div><p class="muted">MQL5 · Institucional · Algorítmico</p></section>`;
  }
}

class ProjectTabs {
  constructor(state, persist, addChat) { this.state=state; this.persist=persist; this.addChat=addChat; }
  render() {
    return `<section class="panel glass"><h3>Proyectos</h3><div class="board"><div><h4>Diseño</h4><ul id="col-design"></ul></div><div><h4>Desarrollo</h4><ul id="col-dev"></ul></div><div><h4>Terminado</h4><ul id="col-done"></ul></div></div><form id="projectForm" class="inline"><input id="projectName" placeholder="Nuevo proyecto EA" required/><select id="projectState"><option value="design">Diseño</option><option value="dev">Desarrollo</option><option value="done">Terminado</option></select><button>Agregar</button></form></section>`;
  }
  bind() { $('projectForm').addEventListener('submit', (e)=>{e.preventDefault();const n=$('projectName').value.trim(); if(!n)return; this.state.projects.push({name:n,state:$('projectState').value}); this.persist(); this.refresh(); e.target.reset();}); this.refresh(); }
  refresh() {
    const map={design:$('col-design'),dev:$('col-dev'),done:$('col-done')}; Object.values(map).forEach(u=>u.innerHTML='');
    this.state.projects.forEach((p,i)=>{const li=document.createElement('li'); li.textContent=p.name; ['design','dev','done'].forEach(s=>{if(s===p.state)return; const b=document.createElement('button'); b.textContent=s; b.onclick=()=>{this.state.projects[i].state=s; this.persist(); this.refresh();}; li.appendChild(b);}); map[p.state].appendChild(li);});
  }
}

class AgentCenter { constructor(state,persist){this.state=state;this.persist=persist;} render(){return `<section class="panel glass"><h3>Centro de agentes</h3><form id="agentForm" class="inline"><input id="agentName" required placeholder="Nombre del agente"/><select id="agentRole"><option value="research">Research índices</option><option value="coder">Programador</option><option value="integrator">Integrador</option><option value="qa">QA</option></select><button>Crear</button></form><ul id="agentList" class="list"></ul></section>`;} bind(){ $('agentForm').addEventListener('submit',(e)=>{e.preventDefault();const n=$('agentName').value.trim();if(!n)return;this.state.agents.push({name:n,role:$('agentRole').value});this.persist();this.refresh();e.target.reset();}); this.refresh();} refresh(){const ul=$('agentList'); ul.innerHTML=''; this.state.agents.forEach(a=>{const li=document.createElement('li'); li.textContent=`${a.name} — ${a.role}`; ul.appendChild(li);});}}
class BotFactory { constructor(state,persist){this.state=state;this.persist=persist;} render(){return `<section class="panel glass"><h3>Fábrica de bots</h3><form id="botForm" class="inline"><input id="botName" required placeholder="EA"/><input id="botVersion" required placeholder="v1.0.0"/><input id="botFocus" required placeholder="Objetivo"/><button>Registrar</button></form><ul id="botTimeline" class="timeline"></ul><div class="inline"><button id="downloadMql5">Descargar .mq5</button><button id="downloadEx5">Descargar .ex5</button></div></section>`;} bind(){ $('botForm').addEventListener('submit',(e)=>{e.preventDefault();this.state.bots.push({name:$('botName').value.trim(),version:$('botVersion').value.trim(),focus:$('botFocus').value.trim(),ts:new Date().toISOString()});this.persist();this.refresh();e.target.reset();}); $('downloadMql5').onclick=()=>this.download('ea_template.mq5','// plantilla\n#property strict\nvoid OnTick(){}','text/plain'); $('downloadEx5').onclick=()=>this.download('ea_placeholder.ex5','Compilar en MetaEditor','application/octet-stream'); this.refresh();} refresh(){const ul=$('botTimeline'); ul.innerHTML=''; this.state.bots.slice().reverse().forEach(b=>{const li=document.createElement('li'); li.innerHTML=`<strong>${b.name} ${b.version}</strong><br>${b.focus}`; ul.appendChild(li);});} download(name,content,type){const blob=new Blob([content],{type});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;a.click();}}
class KnowledgeRepository { constructor(state,persist){this.state=state;this.persist=persist;} render(){return `<section class="panel glass"><h3>Repositorio de conocimiento</h3><form id="uploadForm" class="inline"><input id="knowledgeFile" type="file" multiple required/><button>Cargar</button></form><p class="muted">Indexado local para contexto.</p><ul id="knowledgeList" class="list"></ul></section>`;} bind(){ $('uploadForm').addEventListener('submit', async (e)=>{e.preventDefault(); const files=$('knowledgeFile').files; for(const f of files){const t=await f.text().catch(()=> ''); this.state.knowledge.push({name:f.name,preview:t.slice(0,110)});} this.persist(); this.refresh(); e.target.reset();}); this.refresh();} refresh(){const ul=$('knowledgeList'); ul.innerHTML=''; this.state.knowledge.forEach(k=>{const li=document.createElement('li'); li.innerHTML=`<strong>${k.name}</strong><br><small>${k.preview}</small>`; ul.appendChild(li);});}}

class CommandCenterLayout {
  constructor() {
    this.state = this.loadState();
    this.voiceEngine = new VoiceEngine();
    this.voiceEnabled = false;
    this.listening = false;
    this.avatar = null;
    this.recognizer = null;
  }
  loadState(){ try{const r=localStorage.getItem(storageKey); return r?JSON.parse(r):{chat:[],projects:[],bots:[],agents:[{name:'Scout-Synth',role:'Research índices'},{name:'MQL5-Forge',role:'Programador'},{name:'Merge-Core',role:'Integrador'}],knowledge:[]};}catch{return {chat:[],projects:[],bots:[],agents:[],knowledge:[]};}}
  persist(){ localStorage.setItem(storageKey, JSON.stringify(this.state)); }
  addChat(role,text){ this.state.chat.push({role,text,ts:new Date().toISOString()}); this.persist(); this.chat.refresh(); }
  aiResponse(prompt){ if(/mql5|ea|bot/i.test(prompt)) return 'Perfecto. Armemos arquitectura por módulos: señales, riesgo, ejecución y validación walk-forward.'; if(/agente/i.test(prompt)) return 'Puedo crear agentes Research, Coder, Integrator y QA para este proyecto.'; return 'Recibido. Lo convierto en backlog técnico y versión de implementación.'; }
  speak(text){ if(!this.voiceEnabled) return; this.avatar?.setSpeaking(true); this.voiceEngine.speakCEO(text,{onStart:()=>this.avatar?.setSpeaking(true),onViseme:(v)=>this.avatar?.setViseme(v),onEnd:()=>this.avatar?.setSpeaking(false)}); }
  processPrompt(text,source='Usuario'){ this.addChat(source,text); const answer=this.aiResponse(text); this.addChat('CEO AI',answer); this.speak(answer); }
  render() {
    const html = `
      <aside class="panel glass"><div id="leftStatus"></div></aside>
      <section class="avatar-stage"><p class="avatar-caption">HOLO CORE / REAL-TIME AVATAR</p><div id="holoViewport" class="holo-viewport"></div></section>
      <section id="rightChat"></section>
      <section class="modules panel glass">
        <div class="tabs">
          <button class="tab-btn active" data-tab="projects">Proyectos</button>
          <button class="tab-btn" data-tab="agents">Agentes</button>
          <button class="tab-btn" data-tab="bots">Bots</button>
          <button class="tab-btn" data-tab="knowledge">Repositorio</button>
        </div>
        <div id="projects" class="tab-content active"></div>
        <div id="agents" class="tab-content"></div>
        <div id="bots" class="tab-content"></div>
        <div id="knowledge" class="tab-content"></div>
      </section>`;
    $('commandCenter').innerHTML = html;

    $('leftStatus').innerHTML = new SystemStatusPanel().render();
    this.chat = new ChatPanel(this.state, (p,s)=>this.processPrompt(p,s));
    $('rightChat').innerHTML = this.chat.render();
    this.projects = new ProjectTabs(this.state, ()=>this.persist(), (r,t)=>this.addChat(r,t));
    this.agents = new AgentCenter(this.state, ()=>this.persist());
    this.bots = new BotFactory(this.state, ()=>this.persist());
    this.knowledge = new KnowledgeRepository(this.state, ()=>this.persist());
    $('projects').innerHTML = this.projects.render(); $('agents').innerHTML = this.agents.render(); $('bots').innerHTML = this.bots.render(); $('knowledge').innerHTML = this.knowledge.render();

    this.bind();
  }

  bind() {
    this.avatar = new HologramAvatar($('holoViewport'));
    this.chat.bind(); this.projects.bind(); this.agents.bind(); this.bots.bind(); this.knowledge.bind();
    this.bindTabs();
    this.bindVoice();
    $('saveSnapshotBtn').onclick = ()=>this.addChat('Sistema','Snapshot guardado.');

    if (!this.state.chat.length) {
      const msg = 'Hola Andrés. Soy HoloTrader CEO AI. Estoy listo para ayudarte a diseñar, mejorar y gobernar tus Expert Advisors en MQL5.';
      this.processPrompt(msg, 'CEO AI');
    }
  }
  bindTabs(){ document.querySelectorAll('.tab-btn').forEach((b)=>b.onclick=()=>{document.querySelectorAll('.tab-btn').forEach(x=>x.classList.remove('active')); b.classList.add('active'); document.querySelectorAll('.tab-content').forEach(c=>c.classList.remove('active')); $(b.dataset.tab).classList.add('active');}); }
  bindVoice(){
    const status=$('voiceStatus'); const mic=$('micStatus');
    $('toggleVoiceBtn').onclick=()=>{this.voiceEnabled=!this.voiceEnabled; status.textContent=this.voiceEnabled?'activa':'desactivada'; status.classList.toggle('voice-on',this.voiceEnabled); if(this.voiceEnabled){this.speak('Hola Andrés. Modo de voz ejecutiva activado.');}};

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SR) {
      this.recognizer = new SR(); this.recognizer.lang='es-AR'; this.recognizer.interimResults=true; this.recognizer.continuous=true;
      this.recognizer.onstart=()=>{this.listening=true; mic.textContent='Escuchando...'; mic.classList.add('listening-on');};
      this.recognizer.onend=()=>{this.listening=false; mic.textContent='No escuchando'; mic.classList.remove('listening-on');};
      this.recognizer.onresult=(e)=>{let final=''; let inter=''; for(let i=e.resultIndex;i<e.results.length;i++){const t=e.results[i][0].transcript; if(e.results[i].isFinal) final+=t; else inter+=t;} if(inter) $('lastHeard').textContent=`Escuchando: ${inter}`; if(final.trim()){ $('lastHeard').textContent=final.trim(); this.addChat('Sistema',`✅ Te escuché: "${final.trim()}"`); this.processPrompt(final.trim(),'Usuario (voz)'); }};
      this.recognizer.onerror=(e)=>this.addChat('Sistema',`Error de micrófono: ${e.error}`);
    }

    $('toggleListenBtn').onclick=()=>{ if(!this.recognizer){this.addChat('Sistema','Reconocimiento de voz no soportado en este navegador.');return;} if(this.listening) this.recognizer.stop(); else this.recognizer.start(); };
  }
}

new CommandCenterLayout().render();
