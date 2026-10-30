/* ═══════════════════════════════════════════════════════════════
   Écrans 1/3 — Cockpit · Chat IA · Modèles · Orchestrateur
   ═══════════════════════════════════════════════════════════════ */

const S = TOS.screens;
const A = TOS.actions;

/* ─────────────────────────── COCKPIT ─────────────────────────── */
S.cockpit = {
  title: 'Cockpit',
  actions: () => `<button class="iconbtn" data-act="cockpit-refresh" title="Rafraîchir">${TOS.icon('refresh')}</button>`,
  render() {
    const d = B.device();
    const st = TOS.state;
    const p = TOS.provider();
    const chatCount = (st.chat || []).length;
    const ramPct = d.ramTotal ? Math.round(((d.ramTotal - d.ramFree) / d.ramTotal) * 100) : 0;
    const stoPct = d.storageTotal ? Math.round(((d.storageTotal - d.storageFree) / d.storageTotal) * 100) : 0;
    return `
      <section class="hero">
        <div class="overline">Environnement agentique · Android</div>
        <h2>Bonjour. Le système est prêt.</h2>
        <p>${TOS.esc(d.model || 'Appareil')} · Android ${TOS.esc(d.android || '—')} · ${TOS.esc(d.abi || '—')} ·
           ${d.cores || '—'} cœurs. Moteur actif : <b>${TOS.esc(p ? p.name : 'aucun')}</b>.</p>
        <div class="row wrap">
          <button class="btn primary" data-act="go" data-id="chat">${TOS.icon('chat')} Ouvrir le chat</button>
          <button class="btn" data-act="go" data-id="terminal">${TOS.icon('terminal')} Terminal</button>
          <button class="btn ghost" data-act="go" data-id="models">${TOS.icon('cpu')} Moteurs</button>
        </div>
      </section>

      <div class="grid c4 section">
        <div class="stat">
          <div class="k">Moteur</div>
          <div class="v">${p && p.enabled ? 'En ligne' : 'Hors ligne'}</div>
          <div class="u">${TOS.esc(p ? (p.kind === 'ollama' ? 'Ollama local' : 'Cloud') : '—')}</div>
        </div>
        <div class="stat">
          <div class="k">Agents actifs</div>
          <div class="v">${st.agents.filter((a) => a.on).length}/${st.agents.length}</div>
          <div class="u">chef : ${TOS.esc((st.agents.find((a) => a.id === st.leadAgent) || {}).name || '—')}</div>
        </div>
        <div class="stat">
          <div class="k">Mémoire</div>
          <div class="v">${st.memory.length}</div>
          <div class="u">entrées conservées</div>
        </div>
        <div class="stat">
          <div class="k">Skills</div>
          <div class="v">${st.skills.filter((s) => s.on).length}</div>
          <div class="u">activées</div>
        </div>
      </div>

      <div class="grid c2 section">
        <div class="card">
          <div class="row between"><span class="overline">Ressources</span><span class="chip">${TOS.esc(d.abi || '—')}</span></div>
          <div class="stack sm" style="margin-top:12px">
            <div>
              <div class="row between"><span class="meta">RAM utilisée</span><span class="meta">${ramPct}%</span></div>
              <div class="meter"><i style="width:${ramPct}%"></i></div>
              <div class="meta dim" style="margin-top:4px">${TOS.bytes(d.ramFree)} libres sur ${TOS.bytes(d.ramTotal)}</div>
            </div>
            <div>
              <div class="row between"><span class="meta">Stockage</span><span class="meta">${stoPct}%</span></div>
              <div class="meter"><i style="width:${stoPct}%"></i></div>
              <div class="meta dim" style="margin-top:4px">${TOS.bytes(d.storageFree)} libres</div>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="row between"><span class="overline">Diagnostic</span>
            <button class="btn sm" data-act="cockpit-diag">${TOS.icon('bolt')} Tester</button></div>
          <div class="stack sm" style="margin-top:10px" id="diagList">
            <div class="listrow"><div class="ico ${B.native ? 'ok' : ''}">${TOS.icon(B.native ? 'check' : 'alert')}</div>
              <div class="grow"><div class="t">Pont natif</div><div class="s">${B.native ? 'réseau + stockage disponibles' : 'mode navigateur (limité)'}</div></div></div>
            <div class="listrow"><div class="ico ${B.nativeShell ? 'ok' : ''}">${TOS.icon(B.nativeShell ? 'check' : 'alert')}</div>
              <div class="grow"><div class="t">Shell Android</div><div class="s">${B.nativeShell ? '/system/bin/sh prêt' : 'indisponible dans ce contexte'}</div></div></div>
            <div class="listrow"><div class="ico violet">${TOS.icon('folder')}</div>
              <div class="grow"><div class="t">Workspace</div><div class="s">${TOS.esc(d.workspace || '—')}</div></div></div>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="head"><h2>Reprendre</h2><button class="btn sm ghost" data-act="go" data-id="history">Tout voir</button></div>
        ${chatCount ? `
          <div class="card">
            <div class="row"><div class="ico">${TOS.icon('chat')}</div>
              <div class="grow"><div class="t">${TOS.esc(st.chat[0] ? st.chat[0].content.slice(0, 60) : 'Conversation')}</div>
              <div class="s">${chatCount} messages · ${TOS.esc(p ? p.name : '')}</div></div>
              <button class="btn sm" data-act="go" data-id="chat">Continuer</button></div>
          </div>` : `
          <div class="card"><div class="empty">${TOS.icon('chat')}<h3>Aucune conversation</h3>
            <p>Ouvre le chat : l'orchestrateur choisit le moteur et les skills tout seul.</p>
            <button class="btn primary" style="margin-top:12px" data-act="go" data-id="chat">Démarrer</button></div></div>`}
      </div>

      <div class="section">
        <div class="head"><h2>Raccourcis</h2></div>
        <div class="grid c3">
          ${[
            ['terminal', 'Terminal', 'commandes Android', 'terminal'],
            ['files', 'Fichiers', 'workspace + projets', 'folder'],
            ['skills', 'Skills', 'capacités des agents', 'sparkles'],
            ['mcp', 'MCP', 'outils externes', 'plug'],
            ['media', 'Médias', 'upload & génération', 'image'],
            ['devhub', 'DevHub', 'Git · GitHub · builds', 'git'],
          ].map(([id, t, s, ic]) => `
            <button class="card" style="text-align:left" data-act="go" data-id="${id}">
              <div class="row"><div class="ico listrow" style="padding:0;border:0;width:34px;height:34px;border-radius:10px;background:var(--pink-soft);color:var(--pink);display:grid;place-items:center">${TOS.icon(ic)}</div>
              <div class="grow"><div class="t">${t}</div><div class="s meta">${s}</div></div></div>
            </button>`).join('')}
        </div>
      </div>
    `;
  },
  bind() {},
};

A['cockpit-refresh'] = () => { TOS.render(); TOS.toast('État actualisé'); };
A['cockpit-diag'] = async () => {
  const p = TOS.provider();
  TOS.toast('Test du moteur…');
  try {
    const models = await TOS.listModels(p);
    TOS.toast(`${p.name} : ${models.length} modèle(s) détecté(s)`);
  } catch (e) {
    TOS.toast(`${p.name} injoignable — ${e.message}`);
  }
};

/* ─────────────────────────── CHAT IA ─────────────────────────── */
TOS._models = TOS._models || {};
TOS._attach = null;
TOS._busy = false;

S.chat = {
  title: 'Chat IA',
  actions: () => `
    <button class="iconbtn" data-act="chat-models" title="Choisir le modèle">${TOS.icon('cpu')}</button>
    <button class="iconbtn" data-act="chat-new" title="Nouvelle conversation">${TOS.icon('plus')}</button>`,
  render() {
    const st = TOS.state;
    const p = TOS.provider();
    const agents = st.agents.filter((a) => a.on);
    return `
      <div class="row wrap" style="margin-bottom:14px">
        <span class="chip pink">${TOS.icon('network')} ${TOS.esc((st.agents.find((a) => a.id === st.leadAgent) || {}).name || 'Orchestrateur')}</span>
        <span class="chip">${TOS.icon('cpu')} ${TOS.esc(p ? (p.model || 'modèle auto') : '—')}</span>
        <span class="chip ${p && p.enabled ? 'ok' : 'warn'}"><span class="dot"></span>${TOS.esc(p ? p.name : 'aucun moteur')}</span>
        ${agents.length > 1 ? `<span class="chip">${agents.length} agents</span>` : ''}
      </div>
      <div class="chatwrap">
        <div class="thread" id="thread">${this.thread()}</div>
        <form class="composer" id="chatForm">
          <div id="attachRow"></div>
          <textarea id="chatInput" rows="1" placeholder="Décris ce que tu veux construire…"></textarea>
          <div class="row">
            <div class="tools grow">
              <button type="button" class="iconbtn" data-act="chat-attach" title="Joindre un fichier">${TOS.icon('upload')}</button>
              <button type="button" class="iconbtn" data-act="chat-models" title="Modèles">${TOS.icon('settings')}</button>
              <input type="file" id="chatFile" hidden>
            </div>
            <button class="btn primary" type="submit" id="sendBtn">${TOS.icon('send')} Envoyer</button>
          </div>
        </form>
      </div>
    `;
  },
  thread() {
    const st = TOS.state;
    if (!st.chat.length) {
      return `<div class="card"><div class="empty">${TOS.icon('sparkles')}
        <h3>L'orchestrateur écoute</h3>
        <p>Exemples : « installe ollama et teste un modèle », « crée un projet Android avec Gradle », « explique cette erreur de build ».</p>
      </div></div>`;
    }
    return st.chat.map((m) => {
      const mine = m.role === 'user';
      return `<div class="msg ${mine ? 'user' : 'ai'}">
        <div class="av">${mine ? 'VOUS' : 'IA'}</div>
        <div class="bubble">${mine ? TOS.esc(m.content).replace(/\n/g, '<br>') : TOS.md(m.content)}
        ${m.attach ? `<div class="meta dim" style="margin-top:6px">📎 ${TOS.esc(m.attach)}</div>` : ''}</div>
      </div>`;
    }).join('');
  },
  bind(el) {
    const form = $('#chatForm', el);
    const input = $('#chatInput', el);
    const file = $('#chatFile', el);
    if (file) file.addEventListener('change', async () => {
      const f = file.files && file.files[0];
      if (!f) return;
      TOS._attach = { name: f.name, mime: f.type || 'application/octet-stream' };
      $('#attachRow').innerHTML = `<div class="chip pink" style="margin-bottom:8px">📎 ${TOS.esc(f.name)}
        <button type="button" class="iconbtn" style="width:22px;height:22px" data-act="chat-unattach">${TOS.icon('close')}</button></div>`;
    });
    if (input) {
      input.addEventListener('input', () => {
        input.style.height = 'auto';
        input.style.height = Math.min(input.scrollHeight, 150) + 'px';
      });
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); form.requestSubmit(); }
      });
    }
    if (form) form.addEventListener('submit', (e) => { e.preventDefault(); TOS.sendChat(); });
    const th = $('#thread', el);
    if (th) th.scrollTop = th.scrollHeight;
  },
};

A['chat-new'] = () => {
  if (TOS.state.chat.length) {
    TOS.state.history.unshift({
      id: TOS.uid('h'),
      title: TOS.state.chat[0].content.slice(0, 70),
      at: Date.now(),
      messages: JSON.parse(JSON.stringify(TOS.state.chat)),
    });
    TOS.state.history = TOS.state.history.slice(0, 40);
  }
  TOS.state.chat = [];
  TOS.save();
  TOS.render();
  TOS.toast('Nouvelle conversation');
};
A['chat-attach'] = () => { const f = $('#chatFile'); if (f) f.click(); };
A['chat-unattach'] = () => { TOS._attach = null; const r = $('#attachRow'); if (r) r.innerHTML = ''; };
A['chat-models'] = () => TOS.go('models');

TOS.sendChat = async () => {
  if (TOS._busy) return;
  const input = $('#chatInput');
  const text = (input.value || '').trim();
  if (!text) return;
  const st = TOS.state;
  const msg = { role: 'user', content: text };
  if (TOS._attach) msg.attach = TOS._attach.name;
  st.chat.push(msg);
  input.value = '';
  input.style.height = 'auto';
  TOS._attach = null;
  TOS.save();

  const thread = $('#thread');
  const userHtml = `<div class="msg user"><div class="av">VOUS</div><div class="bubble">${TOS.esc(text).replace(/\n/g, '<br>')}</div></div>`;
  thread.insertAdjacentHTML('beforeend', userHtml);

  const aiId = 'ai-' + Date.now();
  thread.insertAdjacentHTML('beforeend', `<div class="msg ai" id="${aiId}">
    <div class="av">IA</div>
    <div class="bubble"><span class="typing"><i></i><i></i><i></i></span></div></div>`);
  const bubble = document.querySelector(`#${aiId} .bubble`);
  thread.parentElement.scrollTop = thread.scrollHeight;

  TOS._busy = true;
  const btn = $('#sendBtn');
  if (btn) btn.disabled = true;
  let acc = '';
  try {
    const res = await TOS.ask(st.chat.map((m) => ({ role: m.role, content: m.content })), {
      onChunk: (d, all) => { acc = all; bubble.innerHTML = TOS.md(all); },
    });
    acc = res.text || acc;
    bubble.innerHTML = TOS.md(acc);
    st.chat.push({ role: 'assistant', content: acc });
    st.settings.lastProvider = res.provider.id;
    TOS.save();
  } catch (e) {
    bubble.innerHTML = `<span style="color:var(--danger)">⚠ ${TOS.esc(e.message)}</span>
      <div class="meta dim" style="margin-top:8px">Vérifie l'adresse du moteur dans Modèles, puis « Tester ».</div>`;
  } finally {
    TOS._busy = false;
    if (btn) btn.disabled = false;
    const th = $('#thread');
    if (th) th.scrollTop = th.scrollHeight;
  }
};

/* ─────────────────────────── MODÈLES ─────────────────────────── */
S.models = {
  title: 'Modèles & moteurs',
  actions: () => `<button class="iconbtn" data-act="provider-add" title="Ajouter un moteur">${TOS.icon('plus')}</button>`,
  render() {
    const st = TOS.state;
    return `
      <div class="card">
        <div class="overline">Model Gateway</div>
        <p class="meta" style="margin:6px 0 0">Ordre d'essai : le premier moteur disponible répond. En cas d'échec, Terminal OS bascule automatiquement sur le suivant.
        Un quota gratuit n'est jamais illimité — l'interface l'affiche comme « quota », pas comme « gratuit à vie ».</p>
      </div>

      <div class="section">
        <div class="head"><h2>Chaîne de failover</h2><span class="meta dim">${st.chain.length} étapes</span></div>
        <div class="chain">
          ${st.chain.map((id, i) => {
            const p = st.providers.find((x) => x.id === id);
            if (!p) return '';
            return `<div class="item">
              <div class="grow"><div class="t">${TOS.esc(p.name)}</div>
                <div class="s meta">${TOS.esc(p.base)}${p.model ? ' · ' + TOS.esc(p.model) : ''}</div></div>
              <span class="chip ${p.enabled ? 'ok' : 'warn'}">${p.enabled ? 'actif' : 'désactivé'}</span>
              <button class="iconbtn" data-act="chain-up" data-i="${i}" title="Monter">▲</button>
              <button class="iconbtn" data-act="chain-down" data-i="${i}" title="Descendre">▼</button>
            </div>`;
          }).join('') || `<div class="empty">${TOS.icon('layers')}<h3>Chaîne vide</h3><p>Ajoute un moteur et place-le dans la chaîne.</p></div>`}
        </div>
      </div>

      <div class="section">
        <div class="head"><h2>Moteurs</h2><button class="btn sm" data-act="provider-add">${TOS.icon('plus')} Ajouter</button></div>
        <div class="stack">
          ${st.providers.map((p) => `
            <div class="card">
              <div class="provider">
                <div class="logo ${p.kind === 'ollama' ? 'local' : ''}">${p.kind === 'ollama' ? 'LOC' : 'API'}</div>
                <div class="grow">
                  <div class="row between">
                    <div class="t" style="font-weight:600">${TOS.esc(p.name)}</div>
                    <span class="chip ${p.enabled ? 'ok' : ''}">${p.enabled ? 'activé' : 'off'}</span>
                  </div>
                  <div class="s meta">${TOS.esc(p.base)}</div>
                  <div class="s meta dim">modèle : ${TOS.esc(p.model || 'auto')} ${p.key ? '· clé enregistrée' : ''}</div>
                  <div class="row wrap" style="margin-top:10px">
                    <button class="btn sm" data-act="provider-test" data-id="${p.id}">${TOS.icon('bolt')} Tester</button>
                    <button class="btn sm" data-act="provider-models" data-id="${p.id}">${TOS.icon('db')} Modèles</button>
                    <button class="btn sm ghost" data-act="provider-edit" data-id="${p.id}">${TOS.icon('settings')} Éditer</button>
                    <button class="btn sm ghost" data-act="provider-use" data-id="${p.id}">Utiliser</button>
                  </div>
                </div>
              </div>
            </div>`).join('')}
        </div>
      </div>

      <div class="section">
        <div class="card">
          <div class="overline">Ollama sur le téléphone</div>
          <p class="meta" style="margin:8px 0 0">Terminal OS n'embarque pas encore de runtime GGUF : il pilote un serveur Ollama.
          Deux cas marchent : Ollama lancé dans Termux (<code>ollama serve</code>, adresse <code>http://127.0.0.1:11434</code>)
          ou Ollama installé sur un PC du même Wi-Fi (<code>http://IP-du-PC:11434</code>, avec <code>OLLAMA_HOST=0.0.0.0</code>).
          Sans moteur local, la chaîne bascule sur un fournisseur cloud.</p>
        </div>
      </div>
    `;
  },
  bind() {},
};

A['chain-up'] = (el) => {
  const i = +el.dataset.i;
  if (i <= 0) return;
  const c = TOS.state.chain;
  [c[i - 1], c[i]] = [c[i], c[i - 1]];
  TOS.save(); TOS.render();
};
A['chain-down'] = (el) => {
  const i = +el.dataset.i;
  const c = TOS.state.chain;
  if (i >= c.length - 1) return;
  [c[i + 1], c[i]] = [c[i], c[i + 1]];
  TOS.save(); TOS.render();
};
A['provider-use'] = (el) => {
  TOS.state.activeProvider = el.dataset.id;
  const p = TOS.provider();
  if (p) p.enabled = true;
  if (!TOS.state.chain.includes(el.dataset.id)) TOS.state.chain.unshift(el.dataset.id);
  TOS.save(); TOS.render(); TOS.toast('Moteur actif : ' + (p ? p.name : ''));
};
A['provider-test'] = async (el) => {
  const p = TOS.provider(el.dataset.id);
  TOS.toast('Test de ' + p.name + '…');
  try {
    const models = await TOS.listModels(p);
    TOS.openSheet(`<h3>${TOS.esc(p.name)}</h3>
      <p class="meta">${models.length} modèle(s) disponible(s) sur ${TOS.esc(p.base)}</p>
      <div class="stack sm" style="margin-top:12px;max-height:50vh;overflow:auto">
        ${models.map((m) => `<div class="listrow"><div class="ico ok">${TOS.icon('cpu')}</div>
          <div class="grow"><div class="t">${TOS.esc(m.id)}</div>
          <div class="s">${m.size ? TOS.bytes(m.size) : 'taille inconnue'}</div></div>
          <button class="btn sm" data-act="provider-setmodel" data-id="${p.id}" data-model="${TOS.esc(m.id)}">Choisir</button></div>`).join('')
          || `<div class="empty">${TOS.icon('alert')}<h3>Serveur joignable, aucun modèle</h3><p>Lance <code>ollama pull qwen2.5:1.5b</code>.</p></div>`}
      </div>`);
  } catch (e) {
    TOS.openSheet(`<h3>${TOS.esc(p.name)} injoignable</h3>
      <p class="meta" style="color:var(--danger)">${TOS.esc(e.message)}</p>
      <div class="card" style="margin-top:12px">
        <div class="overline">À vérifier</div>
        <p class="meta" style="margin-top:8px">1. Le serveur tourne : <code>ollama serve</code><br>
        2. L'adresse est exacte : <code>${TOS.esc(p.base)}</code><br>
        3. Même Wi-Fi si c'est un PC (pas 127.0.0.1 depuis le téléphone)<br>
        4. Sur PC : <code>OLLAMA_HOST=0.0.0.0</code> et le pare-feu ouvert sur 11434</p>
      </div>
      <button class="btn block" style="margin-top:14px" data-act="closeSheet">Fermer</button>`);
  }
};
A['provider-setmodel'] = (el) => {
  const p = TOS.provider(el.dataset.id);
  if (p) { p.model = el.dataset.model; p.enabled = true; TOS.state.activeProvider = p.id; }
  TOS.save(); TOS.closeSheet(); TOS.render(); TOS.toast('Modèle : ' + el.dataset.model);
};
A['provider-models'] = async (el) => {
  const p = TOS.provider(el.dataset.id);
  if (!p) return;
  TOS.openSheet(`<h3>Modèle de ${TOS.esc(p.name)}</h3>
    <div class="field" style="margin-top:12px"><label>Identifiant du modèle</label>
      <input type="text" id="pm" value="${TOS.esc(p.model || '')}" placeholder="ex. qwen2.5:1.5b"></div>
    <div class="row" style="margin-top:12px">
      <button class="btn grow" data-act="provider-fetch" data-id="${p.id}">${TOS.icon('refresh')} Charger la liste</button>
      <button class="btn primary grow" data-act="provider-savemodel" data-id="${p.id}">Enregistrer</button>
    </div>
    <div id="pmList" style="margin-top:12px;max-height:46vh;overflow:auto"></div>`);
};
A['provider-fetch'] = async (el) => {
  const p = TOS.provider(el.dataset.id);
  const box = $('#pmList');
  box.innerHTML = `<div class="skel" style="margin-bottom:8px"></div><div class="skel"></div>`;
  try {
    const models = await TOS.listModels(p);
    box.innerHTML = models.map((m) => `<div class="listrow"><div class="ico ok">${TOS.icon('cpu')}</div>
      <div class="grow"><div class="t">${TOS.esc(m.id)}</div><div class="s">${m.size ? TOS.bytes(m.size) : ''}</div></div>
      <button class="btn sm" data-act="provider-setmodel" data-id="${p.id}" data-model="${TOS.esc(m.id)}">Choisir</button></div>`).join('')
      || `<div class="empty">${TOS.icon('alert')}<h3>Aucun modèle</h3><p>Le serveur répond mais la liste est vide.</p></div>`;
  } catch (e) {
    box.innerHTML = `<div class="empty">${TOS.icon('alert')}<h3>Échec</h3><p>${TOS.esc(e.message)}</p></div>`;
  }
};
A['provider-savemodel'] = (el) => {
  const p = TOS.provider(el.dataset.id);
  const v = ($('#pm') || {}).value || '';
  if (p) { p.model = v.trim(); p.enabled = true; }
  TOS.save(); TOS.closeSheet(); TOS.render(); TOS.toast('Modèle enregistré');
};
A['provider-edit'] = (el) => {
  const p = TOS.provider(el.dataset.id);
  if (!p) return;
  TOS.openSheet(`<h3>Éditer le moteur</h3>
    <div class="stack sm" style="margin-top:12px">
      <div class="field"><label>Nom</label><input type="text" id="pName" value="${TOS.esc(p.name)}"></div>
      <div class="field"><label>Type</label><select id="pKind">
        <option value="ollama" ${p.kind === 'ollama' ? 'selected' : ''}>Ollama (local / LAN)</option>
        <option value="openai" ${p.kind === 'openai' ? 'selected' : ''}>OpenAI-compatible (cloud)</option></select></div>
      <div class="field"><label>URL de base</label><input type="text" id="pBase" value="${TOS.esc(p.base)}"></div>
      <div class="field"><label>Clé API (stockée sur l'appareil)</label>
        <input type="password" id="pKey" value="${TOS.esc(p.key || '')}" placeholder="sk-…"></div>
      <div class="field"><label>Modèle par défaut</label><input type="text" id="pModel" value="${TOS.esc(p.model || '')}"></div>
      <div class="row between"><span class="meta">Activer ce moteur</span>
        <div class="switch ${p.enabled ? 'on' : ''}" id="pOn"><i></i></div></div>
    </div>
    <div class="row" style="margin-top:14px">
      <button class="btn danger" data-act="provider-del" data-id="${p.id}">${TOS.icon('trash')}</button>
      <button class="btn primary grow" data-act="provider-save" data-id="${p.id}">Enregistrer</button>
    </div>`);
  const sw = $('#pOn');
  if (sw) sw.addEventListener('click', () => sw.classList.toggle('on'));
};
A['provider-save'] = (el) => {
  const p = TOS.provider(el.dataset.id);
  if (!p) return;
  p.name = $('#pName').value.trim() || p.name;
  p.kind = $('#pKind').value;
  p.base = $('#pBase').value.trim();
  p.key = $('#pKey').value;
  p.model = $('#pModel').value.trim();
  p.enabled = $('#pOn').classList.contains('on');
  TOS.save(); TOS.closeSheet(); TOS.render(); TOS.toast('Moteur enregistré');
};
A['provider-del'] = (el) => {
  const id = el.dataset.id;
  TOS.state.providers = TOS.state.providers.filter((p) => p.id !== id);
  TOS.state.chain = TOS.state.chain.filter((c) => c !== id);
  if (TOS.state.activeProvider === id) TOS.state.activeProvider = (TOS.state.providers[0] || {}).id;
  TOS.save(); TOS.closeSheet(); TOS.render();
};
A['provider-add'] = () => {
  TOS.openSheet(`<h3>Nouveau moteur</h3>
    <div class="stack sm" style="margin-top:12px">
      <div class="field"><label>Nom</label><input type="text" id="nName" placeholder="Groq · Llama 3.3"></div>
      <div class="field"><label>Type</label><select id="nKind">
        <option value="ollama">Ollama (local / LAN)</option>
        <option value="openai">OpenAI-compatible (cloud)</option></select></div>
      <div class="field"><label>URL de base</label><input type="text" id="nBase" placeholder="https://api.groq.com/openai/v1"></div>
      <div class="field"><label>Clé API</label><input type="password" id="nKey" placeholder="facultatif pour Ollama"></div>
      <div class="field"><label>Modèle</label><input type="text" id="nModel" placeholder="llama-3.3-70b-versatile"></div>
    </div>
    <button class="btn primary block" style="margin-top:14px" data-act="provider-create">Créer</button>`);
};
A['provider-create'] = () => {
  const name = ($('#nName').value || 'Moteur').trim();
  const kind = $('#nKind').value;
  const base = ($('#nBase').value || '').trim();
  if (!base) { TOS.toast('URL de base requise'); return; }
  const p = { id: TOS.uid('p'), name, kind, base, key: $('#nKey').value || '', model: ($('#nModel').value || '').trim(), enabled: true };
  TOS.state.providers.push(p);
  TOS.state.chain.push(p.id);
  TOS.save(); TOS.closeSheet(); TOS.render(); TOS.toast('Moteur ajouté');
};

/* ─────────────────────── ORCHESTRATEUR ─────────────────────── */
S.agents = {
  title: 'Orchestrateur',
  actions: () => `<button class="iconbtn" data-act="agent-add" title="Nouvel agent">${TOS.icon('plus')}</button>`,
  render() {
    const st = TOS.state;
    const lead = st.agents.find((a) => a.id === st.leadAgent) || st.agents[0];
    return `
      <div class="hero">
        <div class="overline">ELGANYA IA · coordination</div>
        <h2>${TOS.esc(lead ? lead.name : 'Orchestrateur')} mène la mission</h2>
        <p>Le chef de file reçoit la demande, choisit les agents et les skills actives, puis assemble le résultat.
        Chaque agent hérite du même moteur et de la même mémoire de projet.</p>
        <div class="row wrap">
          <select id="leadSel" style="max-width:260px">
            ${st.agents.map((a) => `<option value="${a.id}" ${a.id === st.leadAgent ? 'selected' : ''}>${TOS.esc(a.name)} — ${TOS.esc(a.role)}</option>`).join('')}
          </select>
          <button class="btn" data-act="agent-savelead">${TOS.icon('check')} Définir</button>
        </div>
      </div>

      <div class="section">
        <div class="head"><h2>Équipe</h2><span class="meta dim">${st.agents.filter((a) => a.on).length} actifs</span></div>
        <div class="stack">
          ${st.agents.map((a) => `
            <div class="card">
              <div class="row">
                <div class="ico listrow" style="padding:0;border:0;width:38px;height:38px;border-radius:12px;background:${a.on ? 'var(--pink-soft)' : 'rgba(255,255,255,.05)'};color:${a.on ? 'var(--pink)' : 'var(--text-3)'};display:grid;place-items:center">${TOS.icon(a.icon || 'network')}</div>
                <div class="grow"><div class="t">${TOS.esc(a.name)} <span class="chip" style="margin-left:6px">${TOS.esc(a.role)}</span></div>
                  <div class="s meta">${TOS.esc(a.desc || '')}</div></div>
                <div class="switch ${a.on ? 'on' : ''}" data-act="agent-toggle" data-id="${a.id}"><i></i></div>
              </div>
            </div>`).join('')}
        </div>
      </div>

      <div class="section">
        <div class="head"><h2>File de tâches</h2><span class="meta dim">${(st.tasks || []).length}</span></div>
        <div class="card">
          <div class="row" style="margin-bottom:10px">
            <input type="text" id="taskInput" placeholder="ex. Générer le workflow APK puis vérifier le build">
            <button class="btn primary" data-act="task-add">${TOS.icon('plus')}</button>
          </div>
          ${(st.tasks || []).length ? (st.tasks).map((t) => `
            <div class="listrow">
              <div class="ico ${t.done ? 'ok' : ''}">${TOS.icon(t.done ? 'check' : 'clock')}</div>
              <div class="grow"><div class="t" style="${t.done ? 'text-decoration:line-through;opacity:.6' : ''}">${TOS.esc(t.text)}</div>
                <div class="s">${TOS.esc(t.agent || 'orchestrateur')} · ${TOS.ago(t.at)}</div></div>
              <button class="iconbtn" data-act="task-done" data-id="${t.id}">${TOS.icon('check')}</button>
              <button class="iconbtn" data-act="task-del" data-id="${t.id}">${TOS.icon('trash')}</button>
            </div>`).join('') : `<div class="empty">${TOS.icon('layers')}<h3>File vide</h3><p>Ajoute une tâche : l'orchestrateur la découpera entre les agents.</p></div>`}
        </div>
      </div>
    `;
  },
  bind() {},
};

A['agent-savelead'] = () => {
  const v = ($('#leadSel') || {}).value;
  if (v) { TOS.state.leadAgent = v; TOS.save(); TOS.render(); TOS.toast('Chef de file mis à jour'); }
};
A['agent-toggle'] = (el) => {
  const a = TOS.state.agents.find((x) => x.id === el.dataset.id);
  if (!a) return;
  a.on = !a.on;
  if (!a.on && TOS.state.leadAgent === a.id) {
    const next = TOS.state.agents.find((x) => x.on);
    if (next) TOS.state.leadAgent = next.id;
  }
  TOS.save(); TOS.render();
};
A['agent-add'] = () => {
  TOS.openSheet(`<h3>Nouvel agent</h3>
    <div class="stack sm" style="margin-top:12px">
      <div class="field"><label>Nom</label><input type="text" id="agName" placeholder="Agent Réseau"></div>
      <div class="field"><label>Rôle</label><input type="text" id="agRole" placeholder="infra"></div>
      <div class="field"><label>Mission</label><textarea id="agDesc" placeholder="Ce que cet agent sait faire…"></textarea></div>
    </div>
    <button class="btn primary block" style="margin-top:14px" data-act="agent-create">Créer l'agent</button>`);
};
A['agent-create'] = () => {
  const name = ($('#agName').value || '').trim();
  if (!name) { TOS.toast('Nom requis'); return; }
  TOS.state.agents.push({
    id: TOS.uid('ag'), name, role: ($('#agRole').value || 'agent').trim(),
    desc: ($('#agDesc').value || '').trim(), icon: 'network', on: true,
  });
  TOS.save(); TOS.closeSheet(); TOS.render(); TOS.toast('Agent créé');
};
A['task-add'] = () => {
  const v = ($('#taskInput') || {}).value || '';
  if (!v.trim()) return;
  TOS.state.tasks = TOS.state.tasks || [];
  TOS.state.tasks.unshift({ id: TOS.uid('t'), text: v.trim(), at: Date.now(), done: false, agent: (TOS.state.agents.find((a) => a.id === TOS.state.leadAgent) || {}).name });
  TOS.save(); TOS.render();
};
A['task-done'] = (el) => {
  const t = (TOS.state.tasks || []).find((x) => x.id === el.dataset.id);
  if (t) { t.done = !t.done; TOS.save(); TOS.render(); }
};
A['task-del'] = (el) => {
  TOS.state.tasks = (TOS.state.tasks || []).filter((x) => x.id !== el.dataset.id);
  TOS.save(); TOS.render();
};
