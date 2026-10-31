/* ═══════════════════════════════════════════════════════════════
   Elganya Orchestrator — noyau (core.js)
   État persistant · pont natif · routeur · UI · moteur de chat
   Aucune dépendance externe : fonctionne hors ligne dans le WebView.
   ═══════════════════════════════════════════════════════════════ */

const TOS = (window.TOS = {
  version: '1.0.0',
  state: null,
  screens: {},
  actions: {},
  icons: {},
  nav: [],
  route: 'cockpit',
  stack: [],
});

/* ────────────────────────── ICÔNES ────────────────────────── */
const P = (d, extra) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"
        stroke-linecap="round" stroke-linejoin="round" ${extra || ''}>${d}</svg>`;

TOS.icons = {
  grid: P('<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>'),
  chat: P('<path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 9.9 9.9 0 0 1-4-.8L3 21l1.9-4.9A8.4 8.4 0 0 1 12 3a8.4 8.4 0 0 1 9 8.5z"/>'),
  network: P('<circle cx="12" cy="5" r="2.6"/><circle cx="5" cy="19" r="2.6"/><circle cx="19" cy="19" r="2.6"/><path d="M12 7.6v4.4M12 12l-5.4 4.6M12 12l5.4 4.6"/>'),
  cpu: P('<rect x="7" y="7" width="10" height="10" rx="2.5"/><path d="M4 10h3M4 14h3M17 10h3M17 14h3M10 4v3M14 4v3M10 17v3M14 17v3"/>'),
  terminal: P('<path d="M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z"/><path d="M7 10l2.5 2L7 14M12.5 14H17"/>'),
  folder: P('<path d="M3 7.5A2.5 2.5 0 0 1 5.5 5h3.2l1.8 2.2h8A2.5 2.5 0 0 1 21 9.7v7.8A2.5 2.5 0 0 1 18.5 20h-13A2.5 2.5 0 0 1 3 17.5z"/>'),
  sparkles: P('<path d="M12 3l1.7 4.6L18 9.3l-4.3 1.7L12 15.6l-1.7-4.6L6 9.3l4.3-1.7z"/><path d="M18.5 15l.9 2.2 2.1.8-2.1.8-.9 2.2-.9-2.2-2.1-.8 2.1-.8z"/>'),
  plug: P('<path d="M9 3v5M15 3v5M6 8h12v3a6 6 0 0 1-12 0z"/><path d="M12 17v4"/>'),
  brain: P('<path d="M9.5 4A3.5 3.5 0 0 0 6 7.5v.6A3 3 0 0 0 4 11a3 3 0 0 0 1.2 2.4A3 3 0 0 0 6 19a3 3 0 0 0 3.5 1.9V4z"/><path d="M14.5 4A3.5 3.5 0 0 1 18 7.5v.6A3 3 0 0 1 20 11a3 3 0 0 1-1.2 2.4A3 3 0 0 1 18 19a3 3 0 0 1-3.5 1.9V4z"/>'),
  image: P('<rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="8.5" cy="9.5" r="1.6"/><path d="M21 16l-4.5-4.5L8 20"/>'),
  git: P('<circle cx="6" cy="6" r="2.4"/><circle cx="6" cy="18" r="2.4"/><circle cx="18" cy="12" r="2.4"/><path d="M6 8.4v7.2M8.4 6H14a4 4 0 0 1 4 4v.2"/>'),
  clock: P('<circle cx="12" cy="12" r="9"/><path d="M12 7.5V12l3 2"/>'),
  settings: P('<circle cx="12" cy="12" r="3.2"/><path d="M12 2.5v2.2M12 19.3v2.2M4.2 4.2l1.6 1.6M18.2 18.2l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.2 19.8l1.6-1.6M18.2 5.8l1.6-1.6"/>'),
  plus: P('<path d="M12 5v14M5 12h14"/>'),
  send: P('<path d="M21 3L10.5 13.5M21 3l-6.5 18-4-8.5L2 8.5z"/>'),
  play: P('<path d="M7 4.5l12 7.5-12 7.5z"/>'),
  trash: P('<path d="M4 7h16M9 7V4.8A1.8 1.8 0 0 1 10.8 3h2.4A1.8 1.8 0 0 1 15 4.8V7M6.5 7l.8 12.2A1.8 1.8 0 0 0 9.1 21h5.8a1.8 1.8 0 0 0 1.8-1.8L17.5 7"/>'),
  refresh: P('<path d="M20 11a8 8 0 1 0-2.6 6M20 5v6h-6"/>'),
  copy: P('<rect x="9" y="9" width="11" height="11" rx="2.5"/><path d="M15 6.5V5.5A2.5 2.5 0 0 0 12.5 3h-7A2.5 2.5 0 0 0 3 5.5v7A2.5 2.5 0 0 0 5.5 15h1"/>'),
  close: P('<path d="M6 6l12 12M18 6L6 18"/>'),
  check: P('<path d="M4.5 12.5l5 5 10-11"/>'),
  alert: P('<path d="M12 3.5l9 16H3z"/><path d="M12 9.5v4.5M12 17h.01"/>'),
  chevron: P('<path d="M9 6l6 6-6 6"/>'),
  upload: P('<path d="M12 16V4M7.5 8.5L12 4l4.5 4.5"/><path d="M4 15v3.5A2.5 2.5 0 0 0 6.5 21h11A2.5 2.5 0 0 0 20 18.5V15"/>'),
  key: P('<circle cx="8" cy="15" r="4"/><path d="M11 12l8-8M16 4h4v4"/>'),
  wifi: P('<path d="M3 9a15 15 0 0 1 18 0M6.5 12.5a10 10 0 0 1 11 0M10 16a5 5 0 0 1 4 0"/><circle cx="12" cy="19.5" r="1"/>'),
  search: P('<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/>'),
  file: P('<path d="M13 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9z"/><path d="M13 3v6h6"/>'),
  menu: P('<path d="M4 7h16M4 12h16M4 17h16"/>'),
  bolt: P('<path d="M13 2.5L5 13.5h5.5L10 21.5l8-11h-5.5z"/>'),
  layers: P('<path d="M12 3l9 5-9 5-9-5z"/><path d="M3 13l9 5 9-5"/>'),
  db: P('<ellipse cx="12" cy="6" rx="8" ry="3"/><path d="M4 6v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"/>'),
};

TOS.icon = (n) => TOS.icons[n] || TOS.icons.grid;

/* ────────────────────────── NAVIGATION ────────────────────────── */
TOS.nav = [
  { group: 'Pilotage', items: [
    { id: 'cockpit', label: 'Cockpit', icon: 'grid' },
    { id: 'chat', label: 'Chat IA', icon: 'chat' },
    { id: 'agents', label: 'Orchestrateur', icon: 'network' },
    { id: 'fabric', label: 'LUMEN Fabric', icon: 'network' },
    { id: 'cipher', label: 'Chiffre Lab', icon: 'key' },
  ]},
  { group: 'Moteurs', items: [
    { id: 'models', label: 'Modèles', icon: 'cpu' },
    { id: 'skills', label: 'Skills', icon: 'sparkles' },
    { id: 'mcp', label: 'Plugins · MCP', icon: 'plug' },
    { id: 'memory', label: 'Mémoire', icon: 'brain' },
  ]},
  { group: 'Atelier', items: [
    { id: 'terminal', label: 'Terminal', icon: 'terminal' },
    { id: 'files', label: 'Fichiers', icon: 'folder' },
    { id: 'media', label: 'Médias', icon: 'image' },
    { id: 'devhub', label: 'DevHub', icon: 'git' },
  ]},
  { group: 'Système', items: [
    { id: 'history', label: 'Historique', icon: 'clock' },
    { id: 'settings', label: 'Paramètres', icon: 'settings' },
  ]},
];
TOS.tabs = ['cockpit', 'chat', 'terminal', 'models'];

/* ────────────────────────── PONT NATIF ────────────────────────── */
const NATIVE = typeof ELG !== 'undefined' && !!ELG;
const NATIVE_SH = typeof ELGSH !== 'undefined' && !!ELGSH;

const safeJson = (s, fallback) => {
  try { return JSON.parse(s); } catch (e) { return fallback; }
};

const B = (TOS.bridge = {
  native: NATIVE,
  nativeShell: NATIVE_SH,

  storeGet(key, def) {
    if (NATIVE) { try { const v = ELG.storeGet(key, def); return v === null ? def : v; } catch (e) { return def; } }
    try { const v = localStorage.getItem('tos:' + key); return v === null ? def : v; } catch (e) { return def; }
  },
  storeSet(key, val) {
    if (NATIVE) { try { ELG.storeSet(key, val); } catch (e) {} return; }
    try { localStorage.setItem('tos:' + key, val); } catch (e) {}
  },
  storeRemove(key) {
    if (NATIVE) { try { ELG.storeRemove(key); } catch (e) {} return; }
    try { localStorage.removeItem('tos:' + key); } catch (e) {}
  },

  device() {
    if (NATIVE) { try { return safeJson(ELG.device(), {}); } catch (e) { return {}; } }
    return { model: 'Navigateur', android: navigator.platform || 'web', sdk: 0, abi: 'js',
      cores: navigator.hardwareConcurrency || 4, ramTotal: 0, ramFree: 0, storageFree: 0, storageTotal: 0, workspace: '~/terminal-os' };
  },

  async http(method, url, headers, body, timeout) {
    const h = headers || {};
    if (NATIVE) {
      const raw = ELG.http(method, url, JSON.stringify(h), body || '', timeout || 60000);
      const r = safeJson(raw, { status: 0, body: '', error: 'réponse illisible' });
      if (r.status === 0) throw new Error(r.error || 'réseau indisponible');
      return r;
    }
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), timeout || 60000);
    try {
      const res = await fetch(url, { method, headers: h, body: body || undefined, signal: ctl.signal });
      const text = await res.text();
      return { status: res.status, body: text };
    } finally { clearTimeout(t); }
  },

  /** Streaming : renvoie une promesse résolue à la fin. */
  stream(method, url, headers, body, onChunk) {
    if (NATIVE) {
      const id = 's' + Date.now() + Math.random().toString(16).slice(2, 6);
      return new Promise((resolve, reject) => {
        TOS._streams = TOS._streams || {};
        TOS._streams[id] = { onChunk, resolve, reject };
        ELG.httpStream(id, method, url, JSON.stringify(headers || {}), body || '');
      });
    }
    // Fallback navigateur
    return (async () => {
      const res = await fetch(url, { method, headers: headers || {}, body: body || undefined });
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        onChunk(buf); buf = '';
      }
    })();
  },

  toast(msg) { if (NATIVE) { try { ELG.toast(msg); return; } catch (e) {} } TOS.toast(msg); },
  copy(t) { if (NATIVE) { try { ELG.copy(t); return; } catch (e) {} } try { navigator.clipboard.writeText(t); } catch (e) {} },
  share(t) { if (NATIVE) { try { ELG.share(t); return; } catch (e) {} } },
  openUrl(u) { if (NATIVE) { try { ELG.openUrl(u); return; } catch (e) {} } window.open(u, '_blank'); },
  allowStorage() { if (NATIVE) { try { ELG.allowStorage(); return; } catch (e) {} } },
  storageStatus() { if (NATIVE) { try { return ELG.storageStatus(); } catch (e) {} } return 'sim'; },
  exitApp() { if (NATIVE) { try { ELG.exitApp(); } catch (e) {} } },
  fsHome() { if (NATIVE) { try { return ELG.fsHome(); } catch (e) {} } return '~/terminal-os'; },
  fsList(p) { if (NATIVE) { try { return safeJson(ELG.fsList(p), { error: 'lecture impossible' }); } catch (e) { return { error: String(e) }; } } return []; },
  fsRead(p) { if (NATIVE) { try { return safeJson(ELG.fsRead(p), { error: 'lecture impossible' }); } catch (e) { return { error: String(e) }; } } return { error: 'non natif' }; },
  fsWrite(p, c) { if (NATIVE) { try { return safeJson(ELG.fsWrite(p, c), { ok: false }); } catch (e) { return { ok: false, error: String(e) }; } } return { ok: false }; },
  fsMkdir(p) { if (NATIVE) { try { return safeJson(ELG.fsMkdir(p), {}); } catch (e) { return {}; } } return {}; },
  fsDelete(p) { if (NATIVE) { try { return safeJson(ELG.fsDelete(p), {}); } catch (e) { return {}; } } return {}; },
  readUri(u) { if (NATIVE) { try { return safeJson(ELG.readUri(u), { error: 'lecture impossible' }); } catch (e) { return { error: String(e) }; } } return { error: 'non natif' }; },
});

/* Rappels envoyés par la couche Java */
TOS.onStreamMeta = (id, status) => {
  const s = (TOS._streams || {})[id];
  if (s && status >= 400) s.status = status;
};
TOS.onStreamChunk = (id, text) => {
  const s = (TOS._streams || {})[id];
  if (s) { try { s.onChunk(text); } catch (e) {} }
};
TOS.onStreamEnd = (id, err) => {
  const s = (TOS._streams || {})[id];
  if (!s) return;
  delete TOS._streams[id];
  if (err) s.reject(new Error(err)); else s.resolve();
};

/* ────────────────────────── ÉTAT ────────────────────────── */
const STATE_KEY = 'state.v1';

const DEFAULT_STATE = () => ({
  auth: { user: null, role: 'guest', name: '' },
  settings: {
    stream: true,
    temperature: 0.7,
    maxTokens: 2048,
    haptics: true,
    systemPrompt:
      "Tu es l'orchestrateur de Elganya Orchestrator, un environnement de développement agentique sur Android. " +
      "Tu réponds en français, tu es concis, tu proposes des commandes concrètes et tu signales clairement toute action risquée.",
  },
  providers: [
    { id: 'ollama-local', name: 'Ollama local', kind: 'ollama', base: 'http://127.0.0.1:11434', key: '', model: '', enabled: true },
    { id: 'ollama-lan', name: 'Ollama (PC via Wi-Fi)', kind: 'ollama', base: 'http://192.168.1.10:11434', key: '', model: '', enabled: false },
    { id: 'openai-compat', name: 'Passerelle cloud (OpenAI-compatible)', kind: 'openai', base: 'https://api.openai.com/v1', key: '', model: 'gpt-4o-mini', enabled: false },
    { id: 'ollama-cloud', name: 'Ollama Cloud (beam)', kind: 'openai', base: 'https://ollama.com/v1', key: '', model: 'beam', enabled: false },
  ],
  chain: ['ollama-local', 'openai-compat'],
  agents: [
    { id: 'orchestrator', name: 'Orchestrateur', role: 'chef de file', icon: 'network', desc: 'Découpe la demande, choisit les agents et les skills, valide les résultats.', on: true },
    { id: 'developer', name: 'Développeur', role: 'code', icon: 'terminal', desc: 'Écrit, refactorise et corrige le code, propose les commandes de build.', on: true },
    { id: 'android', name: 'Android', role: 'mobile', icon: 'cpu', desc: 'Gradle, manifest, permissions, APK, Termux et ARM64.', on: true },
    { id: 'devops', name: 'DevOps', role: 'infra', icon: 'git', desc: 'GitHub Actions, releases, déploiement, secrets.', on: true },
    { id: 'research', name: 'Recherche', role: 'web', icon: 'search', desc: 'Documentation à jour, comparaison de bibliothèques, veille.', on: false },
    { id: 'security', name: 'Sécurité', role: 'audit', icon: 'key', desc: 'Revue des secrets, permissions, dépendances vulnérables.', on: false },
    { id: 'docs', name: 'Documentation', role: 'docs', icon: 'file', desc: 'README, architecture, guides d’utilisation.', on: true },
    { id: 'quality', name: 'Qualité', role: 'tests', icon: 'check', desc: 'Vérifie les builds, les tests et les régressions.', on: true },
  ],
  leadAgent: 'orchestrator',
  skills: [
    { id: 'sk-android', name: 'Build APK Android', cat: 'Mobile', on: true, desc: 'Scaffold Gradle, manifest, workflow GitHub Actions et signature.' },
    { id: 'sk-ollama', name: 'Moteur local Ollama', cat: 'IA', on: true, desc: 'Détection, liste des modèles, pull, chat en streaming.' },
    { id: 'sk-gateway', name: 'Model Gateway', cat: 'IA', on: true, desc: 'Chaîne de fournisseurs, failover, gestion des quotas.' },
    { id: 'sk-git', name: 'Git & GitHub', cat: 'DevOps', on: true, desc: 'Clone, commit, push, releases et suivi des workflows.' },
    { id: 'sk-termux', name: 'Termux & ARM64', cat: 'Système', on: true, desc: 'Paquets, proot, chemins, limites d’exécution Android.' },
    { id: 'sk-mcp', name: 'Client MCP', cat: 'Extensibilité', on: true, desc: 'Découverte d’outils, appels JSON-RPC, transport HTTP.' },
    { id: 'sk-media', name: 'Médias & multimodal', cat: 'Création', on: false, desc: 'Upload image/audio/vidéo/document, prompts de génération.' },
  ],
  mcp: [],
  memory: [],
  history: [],
  media: [],
  chat: [],
  activeProvider: 'ollama-local',
});

TOS.save = () => {
  try {
    const s = JSON.parse(JSON.stringify(TOS.state));
    B.storeSet(STATE_KEY, JSON.stringify(s));
  } catch (e) {}
};

TOS.load = () => {
  const raw = B.storeGet(STATE_KEY, '');
  const base = DEFAULT_STATE();
  if (!raw) { TOS.state = base; return; }
  const saved = safeJson(raw, null);
  if (!saved) { TOS.state = base; return; }
  // fusion défensive : les nouvelles clés apparaissent sans casser l'existant
  TOS.state = Object.assign(base, saved);
  TOS.state.settings = Object.assign(base.settings, saved.settings || {});
  TOS.state.auth = Object.assign(base.auth, saved.auth || {});
  ['providers', 'agents', 'skills', 'mcp', 'memory', 'history', 'media', 'chat', 'chain'].forEach((k) => {
    if (!Array.isArray(TOS.state[k])) TOS.state[k] = base[k];
  });
};

TOS.provider = (id) => TOS.state.providers.find((p) => p.id === (id || TOS.state.activeProvider)) || TOS.state.providers[0];
TOS.enabledChain = () =>
  TOS.state.chain
    .map((id) => TOS.state.providers.find((p) => p.id === id))
    .filter((p) => p && p.enabled && p.base);

/* ────────────────────────── MOTEUR IA ────────────────────────── */
const trimSlash = (u) => (u || '').replace(/\/+$/, '');

function parseSSELine(line) {
  let t = line.trim();
  if (!t) return null;
  if (t.startsWith('data:')) t = t.slice(5).trim();
  if (t === '[DONE]') return { done: true };
  try { return JSON.parse(t); } catch (e) { return null; }
}

/** Un tour de chat sur un fournisseur donné. */
async function callProvider(provider, messages, opts) {
  const p = provider;
  const stream = opts.stream !== false && TOS.state.settings.stream;
  const temp = opts.temperature != null ? opts.temperature : TOS.state.settings.temperature;
  const maxTok = opts.maxTokens || TOS.state.settings.maxTokens;

  if (p.kind === 'ollama') {
    const base = trimSlash(p.base.endsWith('/api') || p.base.endsWith('/v1') ? p.base : p.base + '/api');
    const url = base.endsWith('/api') ? base + '/chat' : base + '/chat/completions';
    const h = { 'Content-Type': 'application/json' };
    if (p.key) h['Authorization'] = 'Bearer ' + p.key;
    const body = JSON.stringify({
      model: opts.model || p.model || '',
      messages,
      stream,
      options: { temperature: temp, num_predict: maxTok },
    });
    if (!stream) {
      const r = await B.http('POST', url, h, body, 180000);
      const j = safeJson(r.body, {});
      if (r.status >= 400) throw new Error(j.error || 'HTTP ' + r.status);
      return (j.message && j.message.content) || '';
    }
    let acc = '';
    await B.stream('POST', url, h, body, (chunk) => {
      chunk.split('\n').forEach((line) => {
        const j = parseSSELine(line);
        if (!j) return;
        const d = (j.message && j.message.content) || j.response || '';
        if (d) { acc += d; opts.onChunk && opts.onChunk(d, acc); }
      });
    });
    return acc;
  }

  // OpenAI-compatible (OpenAI, Groq, OpenRouter, LiteLLM, gateway maison…)
  const url = trimSlash(p.base) + '/chat/completions';
  const headers = { 'Content-Type': 'application/json' };
  if (p.key) headers['Authorization'] = 'Bearer ' + p.key;
  const body = JSON.stringify({
    model: opts.model || p.model || '',
    messages,
    stream,
    temperature: temp,
    max_tokens: maxTok,
  });
  if (!stream) {
    const r = await B.http('POST', url, headers, body, 180000);
    const j = safeJson(r.body, {});
    if (r.status >= 400) throw new Error((j.error && (j.error.message || j.error)) || 'HTTP ' + r.status);
    return (((j.choices || [])[0] || {}).message || {}).content || '';
  }
  let acc = '';
  await B.stream('POST', url, headers, body, (chunk) => {
    chunk.split('\n').forEach((line) => {
      const j = parseSSELine(line);
      if (!j || j.done) return;
      const d = ((((j.choices || [])[0] || {}).delta || {}).content) || '';
      if (d) { acc += d; opts.onChunk && opts.onChunk(d, acc); }
    });
  });
  return acc;
}

/** Messages système : prompt + mémoire + skills actives. */
function buildMessages(userMessages) {
  const s = TOS.state;
  const mem = (s.memory || []).slice(-8).map((m) => '• ' + m.text).join('\n');
  const skills = (s.skills || []).filter((k) => k.on).map((k) => k.name).join(', ');
  const lead = (s.agents || []).find((a) => a.id === s.leadAgent);
  const sys = [
    s.settings.systemPrompt,
    lead ? `Agent chef de file : ${lead.name} (${lead.role}).` : '',
    skills ? `Skills actives : ${skills}.` : '',
    mem ? `Mémoire du projet :\n${mem}` : '',
  ].filter(Boolean).join('\n\n');
  return [{ role: 'system', content: sys }].concat(userMessages);
}

/** Envoi avec failover sur la chaîne de fournisseurs. */
TOS.ask = async (userMessages, opts = {}) => {
  const chain = opts.providerId
    ? [TOS.provider(opts.providerId)].filter(Boolean)
    : (TOS.enabledChain().length ? TOS.enabledChain() : [TOS.provider()]);
  const errors = [];
  for (const p of chain) {
    let committed = false;
    try {
      const text = await callProvider(p, buildMessages(userMessages), {
        ...opts,
        onChunk: (d, acc) => {
          committed = true;
          opts.onChunk && opts.onChunk(d, acc);
        },
      });
      if (!text && !committed) throw new Error('réponse vide');
      return { text, provider: p };
    } catch (e) {
      errors.push(`${p.name} → ${e.message}`);
      if (committed) throw e; // déjà du texte affiché : on ne bascule plus
    }
  }
  throw new Error(errors.join(' · ') || 'Aucun fournisseur configuré');
};

TOS.listModels = async (provider) => {
  const p = provider;
  if (p.kind === 'ollama') {
    const base = trimSlash(p.base.endsWith('/api') || p.base.endsWith('/v1') ? p.base : p.base + '/api');
    const tagsUrl = (base.endsWith('/api') ? base + '/tags' : trimSlash(p.base) + '/tags');
    const h = {};
    if (p.key) h['Authorization'] = 'Bearer ' + p.key;
    const r = await B.http('GET', tagsUrl, h, '', 20000);
    if (r.status >= 400) throw new Error('HTTP ' + r.status);
    const j = safeJson(r.body, {});
    return (j.models || []).map((m) => ({ id: m.name, size: m.size, at: m.modified_at }));
  }
  const headers = {};
  if (p.key) headers['Authorization'] = 'Bearer ' + p.key;
  const r = await B.http('GET', trimSlash(p.base) + '/models', headers, '', 20000);
  if (r.status >= 400) throw new Error('HTTP ' + r.status);
  const j = safeJson(r.body, {});
  return (j.data || []).map((m) => ({ id: m.id }));
};

/* ────────────────────────── UI ────────────────────────── */
const $ = (sel, root) => (root || document).querySelector(sel);
const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
TOS.$ = $; TOS.$$ = $$;

TOS.esc = (s) =>
  String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

/** Markdown minimal : blocs de code, gras, code inline, titres, listes, liens. */
TOS.md = (src) => {
  let s = TOS.esc(src || '');
  const blocks = [];
  s = s.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
    blocks.push(`<pre><code>${code.replace(/\n$/, '')}</code></pre>`);
    return `\u0000${blocks.length - 1}\u0000`;
  });
  s = s.replace(/`([^`\n]+)`/g, '<code>$1</code>');
  s = s.replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/^### (.*)$/gm, '<strong>$1</strong>');
  s = s.replace(/^## (.*)$/gm, '<strong>$1</strong>');
  s = s.replace(/^# (.*)$/gm, '<strong>$1</strong>');
  s = s.replace(/^\s*[-*] (.*)$/gm, '• $1');
  s = s.replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" data-act="openlink">$1</a>');
  s = s.split(/\n{2,}/).map((p) => (/^<(pre|strong|ul|div)/.test(p.trim()) ? p : `<p>${p.replace(/\n/g, '<br>')}</p>`)).join('');
  s = s.replace(/\u0000(\d+)\u0000/g, (_, i) => blocks[+i]);
  return s;
};

TOS.toast = (msg) => {
  const el = $('#toast');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(TOS._toastT);
  TOS._toastT = setTimeout(() => el.classList.remove('show'), 2400);
};

TOS.openSheet = (html) => {
  const sheet = $('#sheet');
  $('#sheetPanel').innerHTML = '<div class="grab"></div>' + html;
  sheet.classList.add('open');
  TOS._sheetOpen = true;
};
TOS.closeSheet = () => {
  $('#sheet').classList.remove('open');
  TOS._sheetOpen = false;
};
TOS.onSheet = (fn) => { TOS._sheetHandler = fn; };

TOS.bytes = (n) => {
  if (!n || n < 0) return '—';
  const u = ['o', 'Ko', 'Mo', 'Go', 'To'];
  let i = 0; let v = n;
  while (v >= 1024 && i < u.length - 1) { v /= 1024; i++; }
  return (v >= 10 || i === 0 ? Math.round(v) : v.toFixed(1)) + ' ' + u[i];
};
TOS.ago = (t) => {
  const d = Math.max(0, Date.now() - (t || 0)) / 1000;
  if (d < 60) return "à l'instant";
  if (d < 3600) return Math.floor(d / 60) + ' min';
  if (d < 86400) return Math.floor(d / 3600) + ' h';
  return Math.floor(d / 86400) + ' j';
};
TOS.uid = (p) => (p || 'id') + '-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

/* ────────────────────────── ROUTEUR ────────────────────────── */
TOS.go = (id, opts = {}) => {
  if (!TOS.screens[id]) return;
  if (TOS.route !== id && !opts.replace) TOS.stack.push(TOS.route);
  TOS.route = id;
  document.body.classList.remove('drawer');
  try { history.replaceState(null, '', '#' + id); } catch (e) {}
  TOS.render();
};

TOS.render = () => {
  const screen = TOS.screens[TOS.route];
  const view = $('#view');
  if (!screen || !view) return;
  const nav = TOS.nav.flatMap((g) => g.items).find((i) => i.id === TOS.route);
  $('#pageTitle').textContent = screen.title || (nav && nav.label) || 'Terminal OS';
  $('#crumb').textContent = (nav && nav.group) || 'Terminal OS';
  $('#pageActions').innerHTML = screen.actions ? screen.actions() : '';
  view.innerHTML = screen.render ? screen.render() : '';
  if (screen.bind) screen.bind(view);
  TOS.paintNav();
  const eng = $('#footEngine');
  if (eng) {
    const p = TOS.provider();
    eng.textContent = p ? p.name.replace('Ollama (PC via Wi-Fi)', 'Ollama LAN') : '—';
  }
  view.scrollTop = 0;
};

TOS.paintNav = () => {
  const nav = $('#nav');
  if (nav) {
    nav.innerHTML = TOS.nav.map((g) => `
      <div class="navgroup">${g.group}</div>
      ${g.items.map((i) => `
        <button class="navitem ${TOS.route === i.id ? 'active' : ''}" data-act="go" data-id="${i.id}">
          ${TOS.icon(i.icon)}<span>${i.label}</span>
        </button>`).join('')}
    `).join('');
  }
  const tb = $('#tabbar');
  if (tb) {
    tb.innerHTML = TOS.tabs.map((id) => {
      const item = TOS.nav.flatMap((g) => g.items).find((x) => x.id === id);
      return `<button class="t ${TOS.route === id ? 'active' : ''}" data-act="go" data-id="${id}">
        ${TOS.icon(item.icon)}<span>${item.label}</span></button>`;
    }).join('') + `<button class="t plus" data-act="openDrawer">${TOS.icon('menu')}<span>Plus</span></button>`;
  }
};

TOS.handleBack = () => {
  if (TOS._sheetOpen) { TOS.closeSheet(); return true; }
  if (document.body.classList.contains('drawer')) { document.body.classList.remove('drawer'); return true; }
  if (TOS.route !== 'cockpit') { TOS.go('cockpit', { replace: true }); return true; }
  return false;
};

/* ────────────────────────── ACTIONS GLOBALES ────────────────────────── */
TOS.actions.go = (el) => TOS.go(el.dataset.id);
TOS.actions.openDrawer = () => document.body.classList.toggle('drawer');
TOS.actions.closeSheet = () => TOS.closeSheet();
TOS.actions.openlink = (el) => { if (el.href) B.openUrl(el.href); };
TOS.actions.copy = (el) => { B.copy(el.dataset.text || ''); TOS.toast('Copié'); };

document.addEventListener('click', (ev) => {
  const t = ev.target.closest('[data-act]');
  if (!t) return;
  const act = TOS.actions[t.dataset.act];
  if (!act) return;
  ev.preventDefault();
  act(t, ev);
});
