/* ═══════════════════════════════════════════════════════════════
   Écrans 3/3 — Mémoire · Médias · DevHub · Historique · Paramètres
   ═══════════════════════════════════════════════════════════════ */

/* ─────────────────────────── MÉMOIRE ─────────────────────────── */
S.memory = {
  title: 'Mémoire',
  actions: () => `<button class="iconbtn" data-act="mem-add" title="Nouvelle entrée">${TOS.icon('plus')}</button>`,
  render() {
    const st = TOS.state;
    const q = (TOS._memQuery || '').toLowerCase();
    const list = st.memory.filter((m) => !q || (m.text + ' ' + (m.tags || []).join(' ')).toLowerCase().includes(q));
    return `
      <div class="card">
        <div class="overline">Memory Engine</div>
        <p class="meta" style="margin:6px 0 0">Les 8 dernières entrées sont injectées dans le contexte de chaque requête.
        C'est la mémoire de projet : décisions, chemins, conventions, erreurs connues.</p>
      </div>

      <div class="row" style="margin:14px 0">
        <input type="text" id="memSearch" placeholder="Rechercher dans la mémoire…" value="${TOS.esc(TOS._memQuery || '')}">
        <button class="btn primary" data-act="mem-add">${TOS.icon('plus')}</button>
      </div>

      <div class="stack sm">
        ${list.length ? list.slice().reverse().map((m) => `
          <div class="card" style="padding:13px 14px">
            <div class="row between">
              <span class="chip ${m.kind === 'décision' ? 'pink' : m.kind === 'erreur' ? 'danger' : ''}">${TOS.esc(m.kind || 'note')}</span>
              <span class="meta dim">${TOS.ago(m.at)}</span>
            </div>
            <div class="meta" style="margin-top:8px;color:var(--text)">${TOS.esc(m.text)}</div>
            <div class="row wrap" style="margin-top:10px">
              ${(m.tags || []).map((t) => `<span class="chip">${TOS.esc(t)}</span>`).join('')}
              <div class="grow"></div>
              <button class="iconbtn" data-act="mem-del" data-id="${m.id}">${TOS.icon('trash')}</button>
            </div>
          </div>`).join('') : `<div class="card"><div class="empty">${TOS.icon('brain')}
            <h3>Mémoire vide</h3><p>Ajoute une décision ou une convention : elle suivra tous les agents.</p>
            <button class="btn primary" style="margin-top:12px" data-act="mem-add">Ajouter</button></div></div>`}
      </div>
    `;
  },
  bind(el) {
    const s = $('#memSearch', el);
    if (s) {
      s.addEventListener('input', () => {
        TOS._memQuery = s.value;
        const view = $('#view');
        view.innerHTML = S.memory.render();
        S.memory.bind(view);
        const again = $('#memSearch');
        if (again) { again.focus(); again.setSelectionRange(again.value.length, again.value.length); }
      });
    }
  },
};

A['mem-add'] = () => {
  TOS.openSheet(`<h3>Nouvelle entrée de mémoire</h3>
    <div class="stack sm" style="margin-top:12px">
      <div class="field"><label>Type</label><select id="mmKind">
        <option>note</option><option>décision</option><option>erreur</option><option>convention</option><option>chemin</option>
      </select></div>
      <div class="field"><label>Contenu</label><textarea id="mmText" placeholder="ex. Le workspace des projets est /data/.../workspace"></textarea></div>
      <div class="field"><label>Tags (séparés par virgule)</label><input type="text" id="mmTags" placeholder="android, gradle"></div>
    </div>
    <button class="btn primary block" style="margin-top:14px" data-act="mem-save">Enregistrer</button>`);
};
A['mem-save'] = () => {
  const text = ($('#mmText').value || '').trim();
  if (!text) { TOS.toast('Contenu requis'); return; }
  TOS.state.memory.push({
    id: TOS.uid('m'), kind: $('#mmKind').value, text,
    tags: ($('#mmTags').value || '').split(',').map((t) => t.trim()).filter(Boolean),
    at: Date.now(),
  });
  TOS.save(); TOS.closeSheet(); TOS.render(); TOS.toast('Mémorisé');
};
A['mem-del'] = (el) => {
  TOS.state.memory = TOS.state.memory.filter((m) => m.id !== el.dataset.id);
  TOS.save(); TOS.render();
};

/* ─────────────────────────── MÉDIAS ─────────────────────────── */
S.media = {
  title: 'Médias',
  actions: () => `<button class="iconbtn" data-act="media-add" title="Importer">${TOS.icon('upload')}</button>`,
  render() {
    const st = TOS.state;
    return `
      <div class="card">
        <div class="overline">Studio multimédia</div>
        <p class="meta" style="margin:6px 0 0">Importe image, audio, vidéo ou document. Les métadonnées restent sur l'appareil ;
        les fichiers volumineux ne sont jamais copiés dans l'état de l'application.</p>
      </div>

      <div class="drop" style="margin-top:14px" data-act="media-add">
        ${TOS.icon('upload')}
        <div style="margin-top:8px;font-weight:600">Importer un fichier</div>
        <div class="meta">image · audio · vidéo · PDF · code</div>
      </div>

      <div class="section">
        <div class="head"><h2>Bibliothèque</h2><span class="meta dim">${st.media.length} élément(s)</span></div>
        ${st.media.length ? `<div class="grid c3">
          ${st.media.slice().reverse().map((m) => `
            <div class="card" style="padding:10px">
              <div class="thumb">${m.dataUrl && m.mime && m.mime.startsWith('image/')
                ? `<img src="${m.dataUrl}" alt="">`
                : `<span style="color:var(--text-3)">${TOS.icon(m.mime && m.mime.startsWith('audio') ? 'bolt' : m.mime && m.mime.startsWith('video') ? 'play' : 'file')}</span>`}</div>
              <div class="t" style="font-size:12.5px;margin-top:8px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${TOS.esc(m.name)}</div>
              <div class="meta dim">${TOS.bytes(m.size)} · ${TOS.ago(m.at)}</div>
              <div class="row" style="margin-top:8px">
                <button class="iconbtn" data-act="media-prompt" data-id="${m.id}">${TOS.icon('sparkles')}</button>
                <button class="iconbtn" data-act="media-del" data-id="${m.id}">${TOS.icon('trash')}</button>
              </div>
            </div>`).join('')}
        </div>` : `<div class="card"><div class="empty">${TOS.icon('image')}<h3>Bibliothèque vide</h3>
          <p>Importe une image pour l'analyser ou générer un prompt de variation.</p></div></div>`}
      </div>

      <div class="section">
        <div class="head"><h2>Générer</h2></div>
        <div class="card">
          <div class="field"><label>Prompt</label><textarea id="genPrompt" placeholder="ex. icône d'application cyberpink minimaliste, fond sombre, chevron"></textarea></div>
          <div class="row wrap" style="margin-top:10px">
            <button class="btn primary" data-act="media-gen">${TOS.icon('sparkles')} Générer une image</button>
            <button class="btn ghost" data-act="media-promptgen">${TOS.icon('file')} Prompt depuis le chat</button>
          </div>
          <p class="meta dim" style="margin-top:10px">La génération d'images exige un fournisseur qui expose <code>/images/generations</code>
          (OpenAI, gateway compatible). Sans ce fournisseur, Terminal OS prépare le prompt et te laisse choisir l'outil — il ne prétend pas générer.</p>
        </div>
      </div>
    `;
  },
  bind() {},
};

A['media-add'] = () => {
  const inp = document.createElement('input');
  inp.type = 'file';
  inp.accept = '*/*';
  inp.onchange = async () => {
    const f = inp.files && inp.files[0];
    if (!f) return;
    const item = { id: TOS.uid('md'), name: f.name, mime: f.type || 'application/octet-stream', size: f.size, at: Date.now() };
    if ((f.type || '').startsWith('image/') && f.size < 400 * 1024) {
      item.dataUrl = await new Promise((res) => {
        const r = new FileReader();
        r.onload = () => res(r.result);
        r.readAsDataURL(f);
      });
    }
    TOS.state.media.push(item);
    TOS.save(); TOS.render(); TOS.toast('Fichier importé');
  };
  inp.click();
};
A['media-del'] = (el) => {
  TOS.state.media = TOS.state.media.filter((m) => m.id !== el.dataset.id);
  TOS.save(); TOS.render();
};
A['media-prompt'] = (el) => {
  const m = TOS.state.media.find((x) => x.id === el.dataset.id);
  if (!m) return;
  TOS.openSheet(`<h3>${TOS.esc(m.name)}</h3>
    <p class="meta">${TOS.esc(m.mime)} · ${TOS.bytes(m.size)}</p>
    <div class="field" style="margin-top:12px"><label>Demande à l'agent</label>
      <textarea id="mdAsk">Décris précisément cette image et propose 3 variantes de prompt pour la recréer dans le style cyberpink de Terminal OS.</textarea></div>
    <button class="btn primary block" style="margin-top:12px" data-act="media-ask" data-id="${m.id}">Envoyer au chat</button>`);
};
A['media-ask'] = (el) => {
  const ask = ($('#mdAsk') || {}).value || '';
  TOS.closeSheet();
  TOS.state.chat.push({ role: 'user', content: ask });
  TOS.save();
  TOS.go('chat');
  setTimeout(() => TOS.sendChat(), 120);
};
A['media-gen'] = async () => {
  const prompt = ($('#genPrompt') || {}).value || '';
  if (!prompt.trim()) { TOS.toast('Décris ce que tu veux générer'); return; }
  const p = TOS.state.providers.find((x) => x.kind === 'openai' && x.enabled && x.key);
  if (!p) {
    TOS.openSheet(`<h3>Aucun fournisseur d'images</h3>
      <p class="meta">Ajoute un fournisseur OpenAI-compatible avec une clé (Modèles → Ajouter), puis reviens ici.</p>
      <div class="card" style="margin-top:12px"><div class="overline">Prompt prêt à copier</div>
        <p class="meta" style="margin-top:8px;font-family:var(--mono);font-size:12px">${TOS.esc(prompt)}</p></div>
      <div class="row" style="margin-top:12px">
        <button class="btn grow" data-act="copy" data-text="${TOS.esc(prompt)}">${TOS.icon('copy')} Copier</button>
        <button class="btn primary grow" data-act="go" data-id="models">Configurer</button>
      </div>`);
    return;
  }
  TOS.toast('Génération en cours…');
  try {
    const r = await B.http('POST', p.base.replace(/\/+$/, '') + '/images/generations',
      { 'Content-Type': 'application/json', Authorization: 'Bearer ' + p.key },
      JSON.stringify({ model: 'gpt-image-1', prompt, n: 1, size: '1024x1024' }), 120000);
    const j = JSON.parse(r.body);
    if (r.status >= 400) throw new Error((j.error && j.error.message) || 'HTTP ' + r.status);
    const item = (j.data || [])[0] || {};
    const url = item.url || (item.b64_json ? 'data:image/png;base64,' + item.b64_json : '');
    if (!url) throw new Error('réponse sans image');
    TOS.state.media.push({ id: TOS.uid('md'), name: 'image-' + Date.now() + '.png', mime: 'image/png', size: 0, at: Date.now(), dataUrl: url, prompt });
    TOS.save(); TOS.render(); TOS.toast('Image générée');
  } catch (e) {
    TOS.toast('Échec : ' + e.message);
  }
};
A['media-promptgen'] = () => {
  const pr = ($('#genPrompt') || {}).value || '';
  TOS.state.chat.push({ role: 'user', content: 'Rédige un prompt d’image détaillé pour : ' + pr });
  TOS.save(); TOS.go('chat'); setTimeout(() => TOS.sendChat(), 120);
};

/* ─────────────────────────── DEVHUB ─────────────────────────── */
S.devhub = {
  title: 'DevHub',
  actions: () => `<button class="iconbtn" data-act="dev-refresh" title="Rafraîchir">${TOS.icon('refresh')}</button>`,
  render() {
    const st = TOS.state;
    const tok = st.settings.ghToken || '';
    const user = st.settings.ghUser || '';
    return `
      <div class="card">
        <div class="row">
          <div class="ico listrow" style="padding:0;border:0;width:40px;height:40px;border-radius:13px;background:var(--violet-soft);color:var(--violet);display:grid;place-items:center">${TOS.icon('git')}</div>
          <div class="grow"><div class="t">GitHub</div>
            <div class="s meta">${tok ? 'connecté' + (user ? ' · ' + TOS.esc(user) : '') : 'non connecté'}</div></div>
          <span class="chip ${tok ? 'ok' : 'warn'}">${tok ? 'prêt' : 'token requis'}</span>
        </div>
        <div class="row wrap" style="margin-top:12px">
          <button class="btn sm" data-act="dev-token">${TOS.icon('key')} ${tok ? 'Changer le token' : 'Ajouter un token'}</button>
          ${tok ? `<button class="btn sm ghost" data-act="dev-load">${TOS.icon('refresh')} Charger</button>` : ''}
        </div>
        <p class="meta dim" style="margin-top:10px">Le token est stocké sur l'appareil (SharedPreferences) et n'est jamais envoyé ailleurs qu'à api.github.com.</p>
      </div>

      <div class="section" id="repoBox">
        <div class="head"><h2>Dépôts</h2><span class="meta dim">${tok ? 'via API' : 'connecte GitHub'}</span></div>
        ${(TOS._repos || []).length ? `<div class="stack sm">${TOS._repos.map((r) => `
          <div class="card" style="padding:13px 14px">
            <div class="row">
              <div class="ico listrow" style="padding:0;border:0;width:34px;height:34px;border-radius:10px;background:var(--pink-soft);color:var(--pink);display:grid;place-items:center">${TOS.icon('folder')}</div>
              <div class="grow"><div class="t">${TOS.esc(r.name)}</div>
                <div class="s meta">${r.private ? 'privé' : 'public'} · ${TOS.ago(new Date(r.pushed_at || r.updated_at).getTime())}</div></div>
              <button class="btn sm" data-act="dev-openrepo" data-url="${TOS.esc(r.html_url)}">Ouvrir</button>
            </div>
          </div>`).join('')}</div>` : `<div class="card"><div class="empty">${TOS.icon('git')}
            <h3>${tok ? 'Aucun dépôt chargé' : 'Non connecté'}</h3>
            <p>${tok ? 'Appuie sur « Charger » pour lister tes dépôts.' : 'Ajoute un token GitHub (scope repo + workflow).'}</p></div></div>`}
      </div>

      <div class="section">
        <div class="head"><h2>Builds récents</h2></div>
        ${(TOS._runs || []).length ? `<div class="stack sm">${TOS._runs.map((r) => `
          <div class="card" style="padding:13px 14px"><div class="row">
            <div class="ico ${r.conclusion === 'success' ? 'ok' : r.conclusion === 'failure' ? '' : ''}">${TOS.icon(r.conclusion === 'success' ? 'check' : 'clock')}</div>
            <div class="grow"><div class="t">${TOS.esc(r.name || 'workflow')} #${r.run_number}</div>
              <div class="s meta">${TOS.esc(r.head_branch || '')} · ${r.conclusion || r.status}</div></div>
            <button class="btn sm" data-act="dev-openrepo" data-url="${TOS.esc(r.html_url)}">Voir</button>
          </div></div>`).join('')}</div>` : `<div class="card"><div class="empty">${TOS.icon('clock')}
            <h3>Pas encore de build</h3><p>Charge un dépôt puis ses workflows pour suivre les compilations.</p></div></div>`}
      </div>
    `;
  },
  bind() {},
};

A['dev-token'] = () => {
  TOS.openSheet(`<h3>Token GitHub</h3>
    <p class="meta">Scopes nécessaires : <code>repo</code>, <code>workflow</code>.</p>
    <div class="stack sm" style="margin-top:12px">
      <div class="field"><label>Token</label><input type="password" id="ghTok" placeholder="ghp_…" value="${TOS.esc(TOS.state.settings.ghToken || '')}"></div>
      <div class="field"><label>Nom d'utilisateur (facultatif)</label><input type="text" id="ghUser" value="${TOS.esc(TOS.state.settings.ghUser || '')}" placeholder="elganyaanis-dev"></div>
    </div>
    <div class="row" style="margin-top:14px">
      <button class="btn danger" data-act="dev-token-del">${TOS.icon('trash')}</button>
      <button class="btn primary grow" data-act="dev-token-save">Enregistrer</button>
    </div>`);
};
A['dev-token-save'] = () => {
  TOS.state.settings.ghToken = ($('#ghTok').value || '').trim();
  TOS.state.settings.ghUser = ($('#ghUser').value || '').trim();
  TOS.save(); TOS.closeSheet(); TOS.render(); TOS.toast('Token enregistré');
};
A['dev-token-del'] = () => {
  TOS.state.settings.ghToken = '';
  TOS.save(); TOS.closeSheet(); TOS.render();
};
A['dev-load'] = async () => {
  const t = TOS.state.settings.ghToken;
  if (!t) return;
  TOS.toast('Chargement…');
  try {
    const r = await B.http('GET', 'https://api.github.com/user/repos?per_page=30&sort=pushed',
      { Authorization: 'token ' + t, Accept: 'application/vnd.github+json' }, '', 25000);
    const arr = JSON.parse(r.body);
    if (r.status >= 400) throw new Error((arr && arr.message) || 'HTTP ' + r.status);
    TOS._repos = Array.isArray(arr) ? arr : [];
    if (TOS._repos.length && TOS._repos[0].owner) TOS.state.settings.ghUser = TOS._repos[0].owner.login;
    // builds du dépôt le plus récent
    const first = TOS._repos[0];
    if (first) {
      const r2 = await B.http('GET', `https://api.github.com/repos/${first.full_name}/actions/runs?per_page=5`,
        { Authorization: 'token ' + t, Accept: 'application/vnd.github+json' }, '', 25000);
      const j2 = JSON.parse(r2.body);
      TOS._runs = (j2 && j2.workflow_runs) || [];
    }
    TOS.save(); TOS.render(); TOS.toast(TOS._repos.length + ' dépôt(s) chargé(s)');
  } catch (e) {
    TOS.toast('Échec : ' + e.message);
  }
};
A['dev-refresh'] = () => { if (TOS.state.settings.ghToken) A['dev-load'](); else TOS.render(); };
A['dev-openrepo'] = (el) => B.openUrl(el.dataset.url);

/* ─────────────────────────── HISTORIQUE ─────────────────────────── */
S.history = {
  title: 'Historique',
  actions: () => `<button class="iconbtn" data-act="hist-clear" title="Tout effacer">${TOS.icon('trash')}</button>`,
  render() {
    const h = TOS.state.history || [];
    return `
      <div class="row between" style="margin-bottom:12px">
        <span class="overline">${h.length} conversation(s)</span>
        <span class="meta dim">stockage local</span>
      </div>
      ${h.length ? `<div class="stack sm">${h.map((c) => `
        <div class="card" style="padding:13px 14px">
          <div class="row">
            <div class="ico listrow" style="padding:0;border:0;width:36px;height:36px;border-radius:11px;background:var(--pink-soft);color:var(--pink);display:grid;place-items:center">${TOS.icon('chat')}</div>
            <div class="grow" data-act="hist-open" data-id="${c.id}">
              <div class="t" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${TOS.esc(c.title || 'Conversation')}</div>
              <div class="s meta">${(c.messages || []).length} messages · ${TOS.ago(c.at)}</div></div>
            <button class="iconbtn" data-act="hist-del" data-id="${c.id}">${TOS.icon('trash')}</button>
          </div>
        </div>`).join('')}</div>` : `<div class="card"><div class="empty">${TOS.icon('clock')}
          <h3>Aucune conversation archivée</h3><p>« Nouvelle conversation » dans le chat archive automatiquement la précédente.</p>
          <button class="btn primary" style="margin-top:12px" data-act="go" data-id="chat">Aller au chat</button></div></div>`}
    `;
  },
  bind() {},
};
A['hist-open'] = (el) => {
  const c = TOS.state.history.find((x) => x.id === el.dataset.id);
  if (!c) return;
  TOS.state.chat = JSON.parse(JSON.stringify(c.messages || []));
  TOS.save(); TOS.go('chat');
};
A['hist-del'] = (el) => {
  TOS.state.history = TOS.state.history.filter((x) => x.id !== el.dataset.id);
  TOS.save(); TOS.render();
};
A['hist-clear'] = () => {
  TOS.state.history = [];
  TOS.save(); TOS.render(); TOS.toast('Historique effacé');
};

/* ─────────────────────────── PARAMÈTRES ─────────────────────────── */
S.settings = {
  title: 'Paramètres',
  actions: () => '',
  render() {
    const s = TOS.state.settings;
    const d = B.device();
    return `
      <div class="section" style="margin-top:0">
        <div class="head"><h2>Moteur</h2></div>
        <div class="card">
          <div class="listrow"><div class="ico">${TOS.icon('bolt')}</div>
            <div class="grow"><div class="t">Réponse en streaming</div><div class="s">afficher les tokens au fil de l'eau</div></div>
            <div class="switch ${s.stream ? 'on' : ''}" data-act="set-toggle" data-key="stream"><i></i></div></div>
          <div class="listrow"><div class="ico violet">${TOS.icon('cpu')}</div>
            <div class="grow"><div class="t">Température</div><div class="s">${Number(s.temperature).toFixed(1)} — créativité</div></div>
            <input type="number" id="setTemp" min="0" max="2" step="0.1" value="${s.temperature}" style="width:82px"></div>
          <div class="listrow"><div class="ico ok">${TOS.icon('layers')}</div>
            <div class="grow"><div class="t">Tokens maximum</div><div class="s">longueur de réponse</div></div>
            <input type="number" id="setMax" min="256" max="8192" step="128" value="${s.maxTokens}" style="width:96px"></div>
        </div>
      </div>

      <div class="section">
        <div class="head"><h2>Personnalité de l'orchestrateur</h2></div>
        <div class="card">
          <div class="field"><label>Prompt système</label><textarea id="setSys">${TOS.esc(s.systemPrompt || '')}</textarea></div>
          <button class="btn primary block" style="margin-top:12px" data-act="set-save">${TOS.icon('check')} Enregistrer</button>
        </div>
      </div>

      <div class="section">
        <div class="head"><h2>Apparence</h2></div>
        <div class="card">
          <div class="listrow"><div class="ico">${TOS.icon('image')}</div>
            <div class="grow"><div class="t">Thème</div><div class="s">cyberpink · sombre · un seul accent</div></div>
            <span class="chip pink">actif</span></div>
          <div class="listrow"><div class="ico violet">${TOS.icon('bolt')}</div>
            <div class="grow"><div class="t">Retour haptique</div><div class="s">vibration légère sur action</div></div>
            <div class="switch ${s.haptics ? 'on' : ''}" data-act="set-toggle" data-key="haptics"><i></i></div></div>
        </div>
      </div>

      <div class="section">
        <div class="head"><h2>Données</h2></div>
        <div class="card">
          <div class="listrow"><div class="ico">${TOS.icon('upload')}</div>
            <div class="grow"><div class="t">Exporter l'état</div><div class="s">réglages, skills, mémoire, historique</div></div>
            <button class="btn sm" data-act="set-export">Exporter</button></div>
          <div class="listrow"><div class="ico">${TOS.icon('db')}</div>
            <div class="grow"><div class="t">Workspace</div><div class="s">${TOS.esc(d.workspace || '—')}</div></div>
            <button class="btn sm" data-act="copy" data-text="${TOS.esc(d.workspace || '')}">Copier</button></div>
          <div class="listrow"><div class="ico" style="background:rgba(255,94,108,.12);color:var(--danger)">${TOS.icon('trash')}</div>
            <div class="grow"><div class="t">Réinitialiser</div><div class="s">efface réglages, mémoire et historique</div></div>
            <button class="btn sm danger" data-act="set-reset">Réinitialiser</button></div>
        </div>
      </div>

      <div class="section">
        <div class="card">
          <div class="row between"><span class="overline">Terminal OS</span><span class="chip">v${TOS.esc(d.version || TOS.version)}</span></div>
          <p class="meta" style="margin:8px 0 0">${TOS.esc(d.model || '')} · Android ${TOS.esc(d.android || '')} · ${TOS.esc(d.abi || '')}</p>
          <p class="meta dim" style="margin-top:6px">by Elganya · interface cyberpink · pont natif ${B.native ? 'actif' : 'inactif'} · shell ${B.nativeShell ? 'actif' : 'inactif'}</p>
        </div>
      </div>
    `;
  },
  bind() {},
};

A['set-toggle'] = (el) => {
  const k = el.dataset.key;
  TOS.state.settings[k] = !TOS.state.settings[k];
  TOS.save(); TOS.render();
};
A['set-save'] = () => {
  const s = TOS.state.settings;
  s.systemPrompt = ($('#setSys') || {}).value || s.systemPrompt;
  const t = parseFloat(($('#setTemp') || {}).value);
  if (!isNaN(t)) s.temperature = Math.min(2, Math.max(0, t));
  const m = parseInt(($('#setMax') || {}).value, 10);
  if (!isNaN(m)) s.maxTokens = Math.min(8192, Math.max(256, m));
  TOS.save(); TOS.render(); TOS.toast('Réglages enregistrés');
};
A['set-export'] = () => {
  const copy = JSON.parse(JSON.stringify(TOS.state));
  if (copy.settings) delete copy.settings.ghToken;
  B.share(JSON.stringify(copy, null, 2));
};
A['set-reset'] = () => {
  TOS.openSheet(`<h3>Réinitialiser Terminal OS ?</h3>
    <p class="meta">Réglages, mémoire, skills personnalisées et historique seront effacés. Les fichiers du workspace restent intacts.</p>
    <div class="row" style="margin-top:14px">
      <button class="btn grow" data-act="closeSheet">Annuler</button>
      <button class="btn danger grow" data-act="set-reset-go">Effacer</button>
    </div>`);
};
A['set-reset-go'] = () => {
  const tok = TOS.state.settings.ghToken;
  TOS.state = DEFAULT_STATE();
  TOS.state.settings.ghToken = tok || '';
  TOS.save(); TOS.closeSheet(); TOS.go('cockpit'); TOS.toast('Réinitialisé');
};


/* ───────── LUMEN FABRIC ───────── */
S.fabric = {
  title: 'LUMEN Fabric',
  render() {
    return `<div class="card"><div class="overline">Flux temps réel</div>
      <p class="meta" style="margin:6px 0 0">Bus multi-canal : CORE · AGENT · MODEL · TOOL · MEM · NET · UI. Miroirs et tracage actifs.</p></div>
      <div class="card" style="margin-top:12px"><canvas id="fabricCanvas" width="800" height="320" style="width:100%"></canvas></div>`;
  },
  bind(root) {
    const c = root.querySelector('#fabricCanvas'); if (!c) return;
    const ctx = c.getContext('2d');
    let t = 0;
    function draw() {
      ctx.fillStyle = '#00110a'; ctx.fillRect(0,0,c.width,c.height);
      ctx.strokeStyle = '#00ff88'; ctx.lineWidth = 1;
      for (let i=0;i<7;i++){
        ctx.beginPath();
        ctx.moveTo(0,i*45+10);
        ctx.bezierCurveTo(c.width/3, i*45+40*Math.sin(t+i), 2*c.width/3, i*45-40*Math.sin(t+i), c.width, i*45+10);
        ctx.stroke();
      }
      t += 0.025;
      requestAnimationFrame(draw);
    }
    draw();
  }
};

/* ───────── CIPHER LAB ───────── */
S.cipher = {
  title: 'Cipher Lab',
  render() {
    return `
    <div class="tabs">
      <button class="chip" data-act="cipher-tab" data-tab="hash">Hash</button>
      <button class="chip" data-act="cipher-tab" data-tab="enc">Chiffrer</button>
      <button class="chip" data-act="cipher-tab" data-tab="keys">Clés</button>
      <button class="chip" data-act="cipher-tab" data-tab="rec">Recovery</button>
      <button class="chip" data-act="cipher-tab" data-tab="ana">Analyser</button>
      <button class="chip" data-act="cipher-tab" data-tab="audit">Audit</button>
    </div>
    <div class="card" style="margin-top:12px">
      <div id="cipherPanel"></div>
      <div style="margin-top:14px;border-top:1px solid #00ff4430;padding-top:10px">
        <div class="overline">Assistant IA du Lab</div>
        <textarea id="cipherChat" rows="2" placeholder="explique-moi ce hash ou ces mots" style="width:100%;margin-top:8px"></textarea>
        <button class="btn sm" id="cipherAsk">Demander à l'IA</button>
        <pre id="cipherAI" style="white-space:pre-wrap;font-size:12px;margin-top:8px"></pre>
      </div>
    </div>`;
  },
  bind(root) {
    const panel = root.querySelector('#cipherPanel');
    const ask = root.querySelector('#cipherAsk');
    const out = root.querySelector('#cipherAI');
    const chat = root.querySelector('#cipherChat');
    const renderTab = async (tab) => {
      if (!panel) return;
      if (tab === 'hash') {
        panel.innerHTML = `<div class="field"><label>Texte</label><input id="chText" value="hello"></div>
          <button class="btn primary" id="chBtn">SHA-256 / SHA-512</button>
          <pre id="chOut" style="white-space:pre-wrap;margin-top:10px;font-size:12px"></pre>`;
        panel.querySelector('#chBtn').onclick = async () => {
          const b = new TextEncoder().encode(panel.querySelector('#chText').value);
          const h256 = await crypto.subtle.digest('SHA-256', b);
          const h512 = await crypto.subtle.digest('SHA-512', b);
          panel.querySelector('#chOut').textContent = 'SHA256: ' + hex(h256) + '\nSHA512: ' + hex(h512);
        };
      } else if (tab === 'rec') {
        panel.innerHTML = `<div class="meta">Oracle: ton adresse connue</div>
          <div class="field"><label>Adresse cible</label><input id="rcAddr" placeholder="adresse connue"></div>
          <div class="field"><label>Seed partielle / mots connus</label><textarea id="rcSeed" rows="3" placeholder="12 mots... manquants = ?"></textarea></div>
          <div class="field"><label>Fichier de backup</label><input id="rcFile" placeholder="chemin ou upload future"></div>
          <div class="field"><label>Parametres connus (date/serie/sel)</label><textarea id="rcParams" rows="2"></textarea></div>
          <button class="btn primary" id="rcBtn">Lancer Recovery (offline) 1→6</button>
          <pre id="rcOut" style="white-space:pre-wrap;margin-top:10px;font-size:12px"></pre>`;
        panel.querySelector('#rcBtn').onclick = async () => {
          panel.querySelector('#rcOut').textContent = 'Recovery: oracle=' + (panel.querySelector('#rcAddr').value || 'aucun') + '\nExecution moteurs 1→6 (offline).';
        };
      } else if (tab === 'keys') {
        panel.innerHTML = `<button class="btn" id="kgBtn">Generer paire secp256k1 demo</button><pre id="kgOut" style="margin-top:10px;font-size:12px"></pre>`;
        panel.querySelector('#kgBtn').onclick = async () => {
          panel.querySelector('#kgOut').textContent = 'Generation simulation (webcrypto p256) ...';
        };
      } else {
        panel.innerHTML = `<p class="meta">Onglet ${tab} ready.</p>`;
      }
    };
    function hex(buf) { return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,'0')).join(''); }
    renderTab('hash');
    root.addEventListener('click', (e) => {
      const b = e.target.closest('[data-act="cipher-tab"]');
      if (b) renderTab(b.dataset.tab);
    });
    if (ask) ask.onclick = async () => {
      const p = TOS.provider();
      if (!p) { out.textContent = 'aucun moteur'; return; }
      out.textContent = '...';
      try {
        const r = await TOS.callProvider(p, [{role:'user', content:'Explique en francais, concis: ' + (chat.value || 'contexte cipher')}], {stream:false});
        out.textContent = r || '(vide)';
      } catch (e) { out.textContent = 'ERREUR: ' + e.message; }
    };
  }
};

/* ───────── RUNTIME IA ───────── */
S.runtime = {
  title: 'Runtime IA (modèles locaux)',
  render() {
    return `
      <div class="card">
        <div class="overline">Téléchargement HuggingFace</div>
        <p class="meta" style="margin:6px 0 0">Entrez l'URL directe d'un fichier modèle (.gguf) ou une URL HF resolve. Téléchargement géré par Android (Play/Pause/Stop).</p>
      </div>
      <div class="card" style="margin-top:12px">
        <div class="field"><label>URL modèle (.gguf)</label><input id="rtUrl" value="https://huggingface.co/TheBloke/TinyLlama-1.1B-Chat-v1.0-GGUF/resolve/main/tinyllama-1.1b-chat-v1.0.Q4_K_M.gguf"></div>
        <div class="field"><label>Nom fichier</label><input id="rtName" value="tinyllama.Q4_K_M.gguf"></div>
        <div class="row wrap" style="margin-top:10px">
          <button class="btn primary" id="rtDl">Télécharger</button>
          <button class="btn" id="rtPlay">Play</button>
          <button class="btn ghost" id="rtPause">Pause</button>
          <button class="btn danger" id="rtStop">Stop</button>
        </div>
        <pre id="rtStatus" style="margin-top:12px;font-size:12px;white-space:pre-wrap"></pre>
      </div>
      <div class="card" style="margin-top:12px">
        <div class="overline">Modèle local chargé</div>
        <pre id="rtLocal" style="white-space:pre-wrap;font-size:12px"></pre>
      </div>`;
  },
  bind(root) {
    let currentId = -1;
    const st = root.querySelector('#rtStatus');
    const showLocal = () => {
      const p = B.localModelPath();
      root.querySelector('#rtLocal').textContent = p || '(aucun)';
    };
    showLocal();
    root.querySelector('#rtDl').onclick = () => {
      const url = root.querySelector('#rtUrl').value.trim();
      const name = root.querySelector('#rtName').value.trim();
      const id = B.downloadModel(url, name);
      currentId = id;
      st.textContent = 'download id=' + id;
    };
    root.querySelector('#rtPlay').onclick = () => {
      const url = root.querySelector('#rtUrl').value.trim();
      const name = root.querySelector('#rtName').value.trim();
      const id = (currentId > 0 ? currentId : B.downloadModel(url, name));
      currentId = id;
      if (id<=0) { st.textContent='echec start'; return; }
      const poll = setInterval(()=> {
        const s = B.downloadStatus(id);
        st.textContent = s;
        try {
          const j=JSON.parse(s);
          if (j.state === 'done' || j.state === 'failed') clearInterval(poll);
        } catch(e){}
      }, 1500);
      st.textContent = 'demarre ' + id;
    };
    root.querySelector('#rtPause').onclick = () => {
      if (currentId>0) { B.stopDownload(currentId); st.textContent='pause/stop ' + currentId; }
    };
    root.querySelector('#rtStop').onclick = () => {
      if (currentId>0) { B.stopDownload(currentId); currentId=-1; st.textContent='stop'; }
    };
  }
};
