/* ═══════════════════════════════════════════════════════════════
   Écrans 2/3 — Terminal · Fichiers · Skills · Plugins/MCP
   ═══════════════════════════════════════════════════════════════ */

/* ─────────────────────────── TERMINAL ─────────────────────────── */
TOS._termBuf = [];
TOS._termReady = false;
TOS._cmdHistory = TOS._cmdHistory || [];

TOS.onShellOut = (text) => {
  TOS._termBuf.push(text);
  const t = document.getElementById('term');
  if (!t) return;
  const atBottom = t.scrollHeight - t.scrollTop - t.clientHeight < 60;
  t.insertAdjacentHTML('beforeend', TOS.esc(text));
  if (atBottom) t.scrollTop = t.scrollHeight;
};
TOS.onShellExit = () => {
  TOS._termReady = false;
  TOS.onShellOut('\n[session terminée]\n');
};

S.terminal = {
  title: 'Terminal',
  actions: () => `
    <button class="iconbtn" data-act="term-restart" title="Redémarrer le shell">${TOS.icon('refresh')}</button>
    <button class="iconbtn" data-act="term-clear" title="Effacer">${TOS.icon('trash')}</button>`,
  render() {
    const d = B.device();
    return `
      <div class="row wrap" style="margin-bottom:10px">
        <span class="chip ${B.nativeShell ? 'ok' : 'warn'}"><span class="dot"></span>${B.nativeShell ? 'shell Android natif' : 'shell indisponible'}</span>
        <span class="chip">${TOS.esc(d.abi || '—')}</span>
        <span class="chip">uid app · sans root</span>
      </div>
      <div class="term" id="term">${TOS.esc(TOS._termBuf.join('')) || `<span class="sys">Terminal OS · shell toybox (/system/bin/sh)\nTape « aide » pour les commandes de base.\n\n</span>`}</div>
      <form class="termform" id="termForm">
        <span class="ps">tos $</span>
        <input type="text" id="termIn" placeholder="ls -la" autocomplete="off" autocapitalize="off" spellcheck="false">
        <button class="btn primary" type="submit">${TOS.icon('play')}</button>
      </form>
      <div class="quickcmds">
        ${['ls -la', 'pwd', 'df -h', 'uname -a', 'getprop ro.product.model', 'ps -A | head', 'aide'].map((c) => `<button class="chip" data-act="term-quick" data-cmd="${TOS.esc(c)}">${TOS.esc(c)}</button>`).join('')}
        <button class="chip" data-act="term-beam">Tester beam (sans curl)</button>
        <button class="chip" data-act="term-linux">Installer environnement Linux complet</button>
        <button class="chip" data-act="media-allow">Autoriser médias/stockage</button>
      </div>
      <div class="card" style="margin-top:14px">
        <div class="overline">Terminal complet</div>
        <p class="meta" style="margin:8px 0 0">En mode Linux, le shell utilise un prefix Termux embarqué (targetSdk 28) : <code>bash</code>, <code>pkg</code>, <code>apt</code>, <code>python</code>, <code>node</code>, <code>git</code>, <code>curl</code>, <code>ssh</code>. Commandes systeme Android restent disponibles. Media et storage sont accessibles après allow.</p>
      </div>
    `;
  },
  bind(el) {
    const form = $('#termForm', el);
    const input = $('#termIn', el);
    const t = $('#term', el);
    if (t) t.scrollTop = t.scrollHeight;
    if (B.nativeShell && !TOS._termReady) {
      try { ELGSH.start(); TOS._termReady = true; } catch (e) {}
    }
    if (input) {
      input.focus();
      input.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          const h = TOS._cmdHistory;
          if (h.length) { TOS._histIdx = Math.max(0, (TOS._histIdx == null ? h.length : TOS._histIdx) - 1); input.value = h[TOS._histIdx] || ''; }
        }
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          const h = TOS._cmdHistory;
          if (h.length) { TOS._histIdx = Math.min(h.length, (TOS._histIdx == null ? h.length : TOS._histIdx) + 1); input.value = h[TOS._histIdx] || ''; }
        }
      });
    }
    if (form) form.addEventListener('submit', (e) => {
      e.preventDefault();
      const cmd = (input.value || '').trim();
      if (!cmd) return;
      input.value = '';
      TOS._cmdHistory.push(cmd);
      TOS._histIdx = null;
      if (cmd === 'aide' || cmd === 'help') {
        TOS.onShellOut('Commandes utiles :\n  ls -la            lister le workspace\n  pwd               dossier courant\n  cat fichier.txt   afficher un fichier\n  df -h             espace disque\n  getprop | head    propriétés Android\n  echo $PATH        chemins exécutables\n\n');
        return;
      }
      if (B.nativeShell) {
        TOS.onShellOut('tos $ ' + cmd + '\n');
        ELGSH.write(cmd + '\n');
      } else {
        TOS.onShellOut('tos $ ' + cmd + '\n[shell non disponible dans ce contexte]\n');
      }
    });
  },
};

A['term-clear'] = () => { TOS._termBuf = []; TOS.render(); };
A['term-restart'] = () => {
  try { if (B.nativeShell) ELGSH.stop(); } catch (e) {}
  TOS._termReady = false;
  TOS.onShellOut('\n[session redémarrée]\n');
  if (B.nativeShell) { ELGSH.start(); TOS._termReady = true; }
};
A['term-quick'] = (el) => {
  const i = $('#termIn');
  if (i) { i.value = el.dataset.cmd; i.focus(); }
};
A['term-linux'] = () => {
  if (B.nativeShell) {
    TOS.onShellOut('tos $ installation environnement Linux\n');
    ELGSH.write('pkg update && pkg install -y curl git zyvo 2>/dev/null; echo "Termux-compatible prefix prêt"\n');
  } else {
    TOS.onShellOut('shell natif indisponible\n');
  }
  TOS.toast('lancement installation Linux');
};
A['media-allow'] = () => {
  if (B.nativeShell && B.allowStorage) { B.allowStorage(); TOS.toast('Ouvert la conf stockage'); }
  else TOS.toast('allow demandé');
};
A['term-beam'] = () => { TOS.go('models'); setTimeout(() => A['test-beam'] && A['test-beam'](), 120); };
A['term-open-termux'] = () => {
  try { B.openUrl('https://f-droid.org/packages/com.termux/'); } catch (e) {}
  TOS.toast('Ouvre Termux depuis F-Droid si non installé');
};

/* ─────────────────────────── FICHIERS ─────────────────────────── */
TOS._path = null;

S.files = {
  title: 'Fichiers & projets',
  actions: () => `
    <button class="iconbtn" data-act="file-new" title="Nouveau fichier">${TOS.icon('plus')}</button>
    <button class="iconbtn" data-act="file-refresh" title="Rafraîchir">${TOS.icon('refresh')}</button>`,
  render() {
    if (!TOS._path) TOS._path = B.fsHome();
    const items = B.fsList(TOS._path);
    const list = Array.isArray(items) ? items : [];
    const parts = String(TOS._path).split('/').filter(Boolean);
    return `
      <div class="card" style="padding:12px 14px">
        <div class="pathbar">
          <button class="btn sm ghost" data-act="file-up">▲</button>
          <span class="seg">/</span>
          ${parts.map((p, i) => `<span class="seg"><a href="#" data-act="file-jump" data-path="/${parts.slice(0, i + 1).join('/')}">${TOS.esc(p)}</a> /</span>`).join('')}
        </div>
      </div>
      <div class="card" style="margin-top:12px">
        ${list.length ? list.map((f) => `
          <div class="file" data-act="${f.dir ? 'file-open' : 'file-edit'}" data-path="${TOS.esc(f.path)}">
            <div class="ico ${f.dir ? 'dir' : ''}">${TOS.icon(f.dir ? 'folder' : 'file')}</div>
            <div class="grow"><div class="t">${TOS.esc(f.name)}</div>
              <div class="s">${f.dir ? 'dossier' : TOS.bytes(f.size)} · ${TOS.ago(f.mtime)}</div></div>
            ${TOS.icon('chevron')}
          </div>`).join('') : `<div class="empty">${TOS.icon('folder')}<h3>Dossier vide</h3>
            <p>Crée un fichier ou dépose un projet ici. Chemin : ${TOS.esc(TOS._path)}</p>
            <button class="btn primary" style="margin-top:12px" data-act="file-new">Nouveau fichier</button></div>`}
      </div>
      <div class="row wrap" style="margin-top:12px">
        <button class="btn" data-act="file-mkdir">${TOS.icon('folder')} Nouveau dossier</button>
        <button class="btn ghost" data-act="file-home">${TOS.icon('db')} Workspace</button>
        <button class="btn ghost" data-act="go" data-id="terminal">${TOS.icon('terminal')} Terminal ici</button>
      </div>
    `;
  },
  bind() {},
};

A['file-refresh'] = () => { TOS.render(); };
A['file-open'] = (el) => { TOS._path = el.dataset.path; TOS.render(); };
A['file-jump'] = (el) => { TOS._path = el.dataset.path; TOS.render(); };
A['file-up'] = () => {
  const parts = String(TOS._path || '').split('/').filter(Boolean);
  parts.pop();
  TOS._path = '/' + parts.join('/');
  if (!TOS._path || TOS._path === '/') TOS._path = B.fsHome();
  TOS.render();
};
A['file-home'] = () => { TOS._path = B.fsHome(); TOS.render(); };
A['file-new'] = () => {
  TOS.openSheet(`<h3>Nouveau fichier</h3>
    <p class="meta">Dans ${TOS.esc(TOS._path)}</p>
    <div class="field" style="margin-top:12px"><label>Nom</label><input type="text" id="fName" placeholder="notes.md"></div>
    <button class="btn primary block" style="margin-top:12px" data-act="file-create">Créer</button>`);
};
A['file-create'] = () => {
  const name = ($('#fName') || {}).value || '';
  if (!name.trim()) return;
  const p = (TOS._path || B.fsHome()).replace(/\/+$/, '') + '/' + name.trim();
  const r = B.fsWrite(p, '');
  TOS.closeSheet();
  if (r && r.ok) { TOS.toast('Fichier créé'); TOS._path = TOS._path; TOS.render(); }
  else TOS.toast('Création impossible');
};
A['file-mkdir'] = () => {
  TOS.openSheet(`<h3>Nouveau dossier</h3>
    <div class="field" style="margin-top:12px"><label>Nom</label><input type="text" id="dName" placeholder="mon-projet"></div>
    <button class="btn primary block" style="margin-top:12px" data-act="file-mkdir-go">Créer</button>`);
};
A['file-mkdir-go'] = () => {
  const name = ($('#dName') || {}).value || '';
  if (!name.trim()) return;
  B.fsMkdir((TOS._path || B.fsHome()).replace(/\/+$/, '') + '/' + name.trim());
  TOS.closeSheet(); TOS.render(); TOS.toast('Dossier créé');
};
A['file-edit'] = (el) => {
  const p = el.dataset.path;
  const r = B.fsRead(p);
  if (!r || r.error) { TOS.toast(r && r.error ? r.error : 'Lecture impossible'); return; }
  TOS.openSheet(`<h3>${TOS.esc(p.split('/').pop())}</h3>
    <p class="meta" style="font-family:var(--mono);font-size:11px">${TOS.esc(p)}</p>
    <div class="field editor" style="margin-top:10px"><textarea id="fContent" spellcheck="false">${TOS.esc(r.content || '')}</textarea></div>
    <div class="row" style="margin-top:12px">
      <button class="btn danger" data-act="file-del" data-path="${TOS.esc(p)}">${TOS.icon('trash')}</button>
      <button class="btn grow" data-act="file-share" data-path="${TOS.esc(p)}">${TOS.icon('upload')} Partager</button>
      <button class="btn primary grow" data-act="file-save" data-path="${TOS.esc(p)}">${TOS.icon('check')} Enregistrer</button>
    </div>`);
};
A['file-save'] = (el) => {
  const p = el.dataset.path;
  const c = ($('#fContent') || {}).value || '';
  const r = B.fsWrite(p, c);
  TOS.closeSheet();
  TOS.toast(r && r.ok ? 'Enregistré' : 'Écriture impossible');
  TOS.render();
};
A['file-del'] = (el) => {
  B.fsDelete(el.dataset.path);
  TOS.closeSheet(); TOS.render(); TOS.toast('Supprimé');
};
A['file-share'] = (el) => {
  const r = B.fsRead(el.dataset.path);
  if (r && !r.error) B.share(r.content || '');
};

/* ─────────────────────────── SKILLS ─────────────────────────── */
S.skills = {
  title: 'Skills',
  actions: () => `<button class="iconbtn" data-act="skill-add" title="Nouvelle skill">${TOS.icon('plus')}</button>`,
  render() {
    const st = TOS.state;
    const cats = [...new Set(st.skills.map((s) => s.cat || 'Général'))];
    return `
      <div class="card">
        <div class="overline">Skills Engine</div>
        <p class="meta" style="margin:6px 0 0">Une skill = une capacité nommée, activable, injectée dans le contexte des agents.
        Les skills actives sont transmises à chaque requête : c'est ce qui rend l'orchestrateur spécialisé sans réentraîner de modèle.</p>
      </div>
      ${cats.map((cat) => `
        <div class="section">
          <div class="head"><h2>${TOS.esc(cat)}</h2>
            <span class="meta dim">${st.skills.filter((s) => (s.cat || 'Général') === cat && s.on).length}/${st.skills.filter((s) => (s.cat || 'Général') === cat).length}</span></div>
          <div class="stack sm">
            ${st.skills.filter((s) => (s.cat || 'Général') === cat).map((s) => `
              <div class="card" style="padding:13px 14px">
                <div class="row">
                  <div class="ico listrow" style="padding:0;border:0;width:36px;height:36px;border-radius:11px;background:${s.on ? 'var(--pink-soft)' : 'rgba(255,255,255,.05)'};color:${s.on ? 'var(--pink)' : 'var(--text-3)'};display:grid;place-items:center">${TOS.icon('sparkles')}</div>
                  <div class="grow" data-act="skill-open" data-id="${s.id}">
                    <div class="t">${TOS.esc(s.name)}</div><div class="s meta">${TOS.esc(s.desc || '')}</div></div>
                  <div class="switch ${s.on ? 'on' : ''}" data-act="skill-toggle" data-id="${s.id}"><i></i></div>
                </div>
              </div>`).join('')}
          </div>
        </div>`).join('')}
      <div class="row" style="margin-top:16px">
        <button class="btn block" data-act="skill-export">${TOS.icon('upload')} Exporter le registre (JSON)</button>
      </div>
    `;
  },
  bind() {},
};

A['skill-toggle'] = (el) => {
  const s = TOS.state.skills.find((x) => x.id === el.dataset.id);
  if (s) { s.on = !s.on; TOS.save(); TOS.render(); }
};
A['skill-open'] = (el) => {
  const s = TOS.state.skills.find((x) => x.id === el.dataset.id);
  if (!s) return;
  TOS.openSheet(`<h3>${TOS.esc(s.name)}</h3>
    <div class="row" style="margin:6px 0 12px"><span class="chip pink">${TOS.esc(s.cat || 'Général')}</span>
      <span class="chip ${s.on ? 'ok' : ''}">${s.on ? 'active' : 'inactive'}</span></div>
    <p class="meta">${TOS.esc(s.desc || '')}</p>
    ${s.prompt ? `<div class="card" style="margin-top:12px"><div class="overline">Instructions injectées</div>
      <pre style="white-space:pre-wrap;font:12px var(--mono);color:var(--text-2);margin:8px 0 0">${TOS.esc(s.prompt)}</pre></div>` : ''}
    <div class="row" style="margin-top:14px">
      <button class="btn danger" data-act="skill-del" data-id="${s.id}">${TOS.icon('trash')} Supprimer</button>
      <button class="btn primary grow" data-act="skill-edit" data-id="${s.id}">Éditer</button>
    </div>`);
};
A['skill-add'] = () => A['skill-edit'](null);
A['skill-edit'] = (el) => {
  const s = el && el.dataset && el.dataset.id ? TOS.state.skills.find((x) => x.id === el.dataset.id) : null;
  TOS.openSheet(`<h3>${s ? 'Éditer la skill' : 'Nouvelle skill'}</h3>
    <div class="stack sm" style="margin-top:12px">
      <div class="field"><label>Nom</label><input type="text" id="skName" value="${TOS.esc(s ? s.name : '')}" placeholder="Audit de sécurité"></div>
      <div class="field"><label>Catégorie</label><input type="text" id="skCat" value="${TOS.esc(s ? s.cat || '' : '')}" placeholder="Sécurité"></div>
      <div class="field"><label>Description</label><input type="text" id="skDesc" value="${TOS.esc(s ? s.desc || '' : '')}" placeholder="Ce que la skill apporte"></div>
      <div class="field"><label>Instructions</label><textarea id="skPrompt" placeholder="Quand cette skill est active, l'agent doit…">${TOS.esc(s ? s.prompt || '' : '')}</textarea></div>
    </div>
    <button class="btn primary block" style="margin-top:14px" data-act="skill-save" data-id="${s ? s.id : ''}">Enregistrer</button>`);
};
A['skill-save'] = (el) => {
  const id = el.dataset.id;
  const name = ($('#skName').value || '').trim();
  if (!name) { TOS.toast('Nom requis'); return; }
  const data = {
    name,
    cat: ($('#skCat').value || 'Général').trim(),
    desc: ($('#skDesc').value || '').trim(),
    prompt: ($('#skPrompt').value || '').trim(),
  };
  if (id) {
    const s = TOS.state.skills.find((x) => x.id === id);
    Object.assign(s, data);
  } else {
    TOS.state.skills.push(Object.assign({ id: TOS.uid('sk'), on: true }, data));
  }
  TOS.save(); TOS.closeSheet(); TOS.render(); TOS.toast('Skill enregistrée');
};
A['skill-del'] = (el) => {
  TOS.state.skills = TOS.state.skills.filter((x) => x.id !== el.dataset.id);
  TOS.save(); TOS.closeSheet(); TOS.render();
};
A['skill-export'] = () => {
  B.share(JSON.stringify(TOS.state.skills, null, 2));
};

/* ─────────────────────────── MCP / PLUGINS ─────────────────────────── */
S.mcp = {
  title: 'Plugins · MCP',
  actions: () => `<button class="iconbtn" data-act="mcp-curate" title="Importer bases courantes">${TOS.icon('download')}</button><button class="iconbtn" data-act="mcp-add" title="Ajouter un serveur MCP">${TOS.icon('plus')}</button>`,
  render() {
    const st = TOS.state;
    return `
      <div class="card">
        <div class="overline">Model Context Protocol</div>
        <p class="meta" style="margin:6px 0 0">Un serveur MCP expose des outils que les agents peuvent appeler sans toucher au noyau de l'application.
        Terminal OS parle JSON-RPC 2.0 en HTTP : <code>initialize</code> puis <code>tools/list</code>.</p>
      </div>

      <div class="section">
        <div class="head"><h2>Serveurs</h2><button class="btn sm" data-act="mcp-add">${TOS.icon('plus')} Ajouter</button></div>
        ${st.mcp.length ? st.mcp.map((m) => `
          <div class="card">
            <div class="row">
              <div class="ico listrow" style="padding:0;border:0;width:38px;height:38px;border-radius:12px;background:var(--violet-soft);color:var(--violet);display:grid;place-items:center">${TOS.icon('plug')}</div>
              <div class="grow"><div class="t">${TOS.esc(m.name)}</div>
                <div class="s meta">${TOS.esc(m.url || m.transport || '—')}</div></div>
              <span class="chip ${(m.tools || []).length ? 'ok' : ''}">${(m.tools || []).length} outils</span>
            </div>
            <div class="row wrap" style="margin-top:10px">
              <button class="btn sm" data-act="mcp-discover" data-id="${m.id}">${TOS.icon('search')} Découvrir</button>
              <button class="btn sm ghost" data-act="mcp-del" data-id="${m.id}">${TOS.icon('trash')}</button>
            </div>
            ${(m.tools || []).length ? `<div style="margin-top:10px">${m.tools.map((t) => `<span class="chip" style="margin:0 6px 6px 0">${TOS.esc(t)}</span>`).join('')}</div>` : ''}
          </div>`).join('') : `<div class="card"><div class="empty">${TOS.icon('plug')}
            <h3>Aucun serveur MCP</h3><p>Ajoute l'URL d'un serveur (ex. un FastMCP exposé en HTTP) et lance « Découvrir ».</p>
            <button class="btn primary" style="margin-top:12px" data-act="mcp-add">Ajouter un serveur</button></div></div>`}
      </div>

      <div class="section">
        <div class="head"><h2>Exemples prêts à brancher</h2></div>
        <div class="card">
          <div class="listrow"><div class="ico">${TOS.icon('folder')}</div>
            <div class="grow"><div class="t">Filesystem MCP</div><div class="s">accès fichiers contrôlé par permissions</div></div></div>
          <div class="listrow"><div class="ico violet">${TOS.icon('git')}</div>
            <div class="grow"><div class="t">GitHub MCP</div><div class="s">issues, PR, actions — avec ton token</div></div></div>
          <div class="listrow"><div class="ico ok">${TOS.icon('db')}</div>
            <div class="grow"><div class="t">Docs MCP (Context7)</div><div class="s">documentation à jour des bibliothèques</div></div></div>
        </div>
      </div>
    `;
  },
  bind() {},
};

A['mcp-curate'] = () => {
  const defs = [
    {name:'Filesystem MCP', url:'https://github.com/modelcontextprotocol/servers/tree/main/src/filesystem', note:'fichiers controles par permission'},
    {name:'GitHub MCP', url:'https://github.com/modelcontextprotocol/servers/tree/main/src/github', note:'issues/PR/actions (token)'},
    {name:'Fetch MCP', url:'https://github.com/modelcontextprotocol/servers/tree/main/src/fetch', note:'HTTP fetch et fetch Markdown'},
    {name:'SQLite MCP', url:'https://github.com/modelcontextprotocol/servers/tree/main/src/sqlite', note:'SQL sur base SQLite'},
    {name:'Brave Search MCP', url:'https://github.com/modelcontextprotocol/servers/tree/main/src/brave-search', note:'recherche web'},
    {name:'Puppeteer MCP', url:'https://github.com/modelcontextprotocol/servers/tree/main/src/puppeteer', note:'automatisation navigateur'},
    {name:'Memory MCP', url:'https://github.com/modelcontextprotocol/servers/tree/main/src/memory', note:'graphe de memoire'},
    {name:'Sequential Thinking MCP', url:'https://github.com/modelcontextprotocol/servers/tree/main/src/sequentialthinking', note:'raisonnement etape par etape'},
    {name:'Git MCP', url:'https://github.com/modelcontextprotocol/servers/tree/main/src/git', note:'historique et diff Git'},
    {name:'Postgres MCP', url:'https://github.com/modelcontextprotocol/servers/tree/main/src/postgres', note:' acces Postgres read-only'},
  ];
  const html = `<h3>Bases MCP connues</h3>
    <div class="stack sm" style="margin-top:12px">
      ${defs.map((d) =>
        `<div class="listrow">
          <div class="grow"><div class="t">${TOS.esc(d.name)}</div><div class="s meta">${TOS.esc(d.note)}</div><div class="s meta">${TOS.esc(d.url)}</div></div>
          <button class="btn sm" data-act="mcp-add-url" data-url="${TOS.esc(d.url)}" data-name="${TOS.esc(d.name)}">Ajouter</button>
        </div>`).join('')}
    </div>
    <div class="meta" style="margin-top:10px">Ces serveurs sont des definitions GitHub; configure l'URL locale/HTTP puis Discover.</div>`;
  TOS.openSheet(html);
};
A['mcp-add-url'] = (el) => {
  const name = el.dataset.name || 'MCP';
  const url = el.dataset.url || '';
  TOS.state.mcp.push({ id: TOS.uid('mcp'), name, url, tools: [], enabled: true });
  TOS.save(); TOS.closeSheet(); TOS.render(); TOS.toast(name + ' ajoute');
};
A['mcp-add'] = () => {
  TOS.openSheet(`<h3>Serveur MCP</h3>
    <div class="stack sm" style="margin-top:12px">
      <div class="field"><label>Nom</label><input type="text" id="mName" placeholder="Filesystem"></div>
      <div class="field"><label>URL HTTP (JSON-RPC)</label><input type="text" id="mUrl" placeholder="http://127.0.0.1:8000/mcp"></div>
    </div>
    <button class="btn primary block" style="margin-top:14px" data-act="mcp-create">Ajouter</button>`);
};
A['mcp-create'] = () => {
  const name = ($('#mName').value || 'Serveur MCP').trim();
  const url = ($('#mUrl').value || '').trim();
  if (!url) { TOS.toast('URL requise'); return; }
  TOS.state.mcp.push({ id: TOS.uid('mcp'), name, url, tools: [] });
  TOS.save(); TOS.closeSheet(); TOS.render(); TOS.toast('Serveur ajouté');
};
A['mcp-del'] = (el) => {
  TOS.state.mcp = TOS.state.mcp.filter((m) => m.id !== el.dataset.id);
  TOS.save(); TOS.render();
};
A['mcp-discover'] = async (el) => {
  const m = TOS.state.mcp.find((x) => x.id === el.dataset.id);
  if (!m) return;
  TOS.toast('Découverte en cours…');
  try {
    const init = {
      jsonrpc: '2.0', id: 1, method: 'initialize',
      params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'TerminalOS', version: TOS.version } },
    };
    const r1 = await B.http('POST', m.url, { 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream' }, JSON.stringify(init), 20000);
    if (r1.status >= 400) throw new Error('initialize → HTTP ' + r1.status);
    const list = { jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} };
    const r2 = await B.http('POST', m.url, { 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream' }, JSON.stringify(list), 20000);
    const body = (r2.body || '').replace(/^data:\s*/gm, '');
    const j = JSON.parse(body.split('\n').filter((l) => l.trim().startsWith('{')).pop() || body);
    const tools = ((j.result && j.result.tools) || []).map((t) => t.name);
    m.tools = tools;
    TOS.save(); TOS.render();
    TOS.toast(tools.length ? `${tools.length} outil(s) découvert(s)` : 'Serveur joignable, aucun outil');
  } catch (e) {
    TOS.toast('Échec : ' + e.message);
  }
};
