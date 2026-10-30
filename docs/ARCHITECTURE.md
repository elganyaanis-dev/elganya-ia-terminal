# Terminal OS — étude conceptuelle et architecture

## 1. Intention

Terminal OS n'est pas « un chat avec un modèle ». C'est un **système
d'exploitation applicatif** posé sur Android : il héberge des agents, un
terminal, un explorateur, une mémoire et un routeur de modèles, et il accepte
de nouveaux moteurs **sans rebuild**.

Trois principes non négociables :

1. **Zéro dépendance lourde.** Pas de Node, pas de Python, pas de Compose
   pour l'UI : WebView + pont natif Java. L'APK reste petit et le build reste
   fiable sur GitHub Actions.
2. **Le réseau passe par le natif.** Aucun `fetch()` direct vers Ollama :
   le pont Java contourne CORS, l'origine `file://` et les restrictions
   cleartext. C'est ce qui fait la différence entre « ne répond pas » et
   « ça marche ».
3. **Tout est remplaçable.** Moteur, agents, skills, serveurs MCP, thème :
   chaque couche a une interface stable et une implémentation par défaut.

## 2. Arborescence

```
terminal-os/
├── .github/workflows/build.yml     # build APK + release automatique
├── app/
│   ├── build.gradle                # AGP 8.5.2 · compileSdk 34 · minSdk 26
│   ├── proguard-rules.pro
│   └── src/main/
│       ├── AndroidManifest.xml     # INTERNET, cleartext, network security config
│       ├── java/com/elganya/terminalos/
│       │   ├── TerminalOsApp.java      # Application (point d'entrée)
│       │   ├── MainActivity.java       # hôte WebView, file chooser, bouton retour
│       │   ├── WebBridge.java          # ELG : http, stream, store, fs, device, ui
│       │   └── ShellBridge.java        # ELGSH : /system/bin/sh interactif + exec
│       ├── assets/
│       │   ├── index.html              # coquille : rail, topbar, tabbar, sheet
│       │   ├── css/theme.css           # design system cyberpink (tokens)
│       │   └── js/
│       │       ├── core.js             # état, pont, routeur, UI, moteur IA
│       │       ├── screens1.js         # cockpit · chat · modèles · orchestre
│       │       ├── screens2.js         # terminal · fichiers · skills · mcp
│       │       ├── screens3.js         # mémoire · médias · devhub · histo · réglages
│       │       └── app.js              # démarrage, haptique, hash routing
│       └── res/
│           ├── values/{colors,themes,strings}.xml
│           ├── values-night/colors.xml
│           ├── drawable/ic_launcher_foreground.xml
│           ├── mipmap-anydpi-v26/ic_launcher.xml
│           └── xml/network_security_config.xml
└── docs/
```

## 3. Les six couches

```
┌──────────────────────────────────────────────────────────────┐
│ 1. PRÉSENTATION   index.html + theme.css + screens*.js        │
│    routeur · composants · états (loading / vide / erreur)     │
├──────────────────────────────────────────────────────────────┤
│ 2. ORCHESTRATION  core.js : agents, skills, mémoire, tâches   │
│    buildMessages() · failover · sélection du chef de file     │
├──────────────────────────────────────────────────────────────┤
│ 3. MOTEURS IA     callProvider() : ollama | openai-compatible │
│    streaming SSE/NDJSON · liste des modèles · test de santé   │
├──────────────────────────────────────────────────────────────┤
│ 4. PONT NATIF     ELG (http/stream/store/fs/device/ui)        │
│                   ELGSH (shell)                                │
├──────────────────────────────────────────────────────────────┤
│ 5. PLATEFORME     Android 26+ · WebView · SharedPreferences   │
│                   /system/bin/sh · content:// · filesDir       │
├──────────────────────────────────────────────────────────────┤
│ 6. DISTRIBUTION   GitHub Actions → APK → releases              │
└──────────────────────────────────────────────────────────────┘
```

## 4. Modules et variables

### 4.1 État persistant (`state.v1`, JSON dans SharedPreferences)

```js
{
  settings: {
    stream: bool, temperature: 0..2, maxTokens: 256..8192,
    systemPrompt: string, haptics: bool,
    ghToken: string, ghUser: string, lastProvider: id
  },
  providers: [{
    id, name,
    kind: 'ollama' | 'openai',
    base: 'http://127.0.0.1:11434' | 'https://api.x/v1',
    key: string, model: string, enabled: bool
  }],
  chain: [providerId, ...],        // ordre de failover
  activeProvider: providerId,
  agents: [{ id, name, role, desc, icon, on }],
  leadAgent: agentId,
  skills: [{ id, name, cat, desc, prompt, on }],
  mcp:    [{ id, name, url, tools: [string] }],
  memory: [{ id, kind, text, tags: [string], at }],
  history:[{ id, title, at, messages: [{role, content}] }],
  media:  [{ id, name, mime, size, at, dataUrl?, prompt? }],
  chat:   [{ role, content, attach? }],
  tasks:  [{ id, text, at, done, agent }]
}
```

Règles : fusion défensive au chargement (`Object.assign` + contrôle de type par
tableau), donc une nouvelle clé n'efface jamais les données existantes.

### 4.2 Pont `ELG`

| Méthode | Retour | Note |
|---|---|---|
| `http(method, url, headersJson, body, timeout)` | `{status, body}` / `{status:0,error}` | bloquant, exécuté hors UI thread |
| `httpStream(cbId, method, url, headers, body)` | rappels `TOS.onStream*` | lignes SSE/NDJSON, flush ~60 ms |
| `storeGet / storeSet / storeRemove / storeAll` | string | SharedPreferences `terminal_os` |
| `fsHome / fsList / fsRead / fsWrite / fsMkdir / fsDelete` | JSON | workspace `filesDir/workspace` |
| `readUri(uri)` | `{name, mime, size, base64}` | plafond 12 Mo |
| `device()` | modèle, Android, ABI, cœurs, RAM, stockage | — |
| `toast / copy / share / openUrl / exitApp` | — | UI système |

### 4.3 Pont `ELGSH`

| Méthode | Comportement |
|---|---|
| `start()` | `ProcessBuilder("/system/bin/sh")` + thread lecteur → `TOS.onShellOut` |
| `write(data)` | écrit dans stdin (session persistante, `cd` conservé) |
| `exec(cmd)` | one-shot, timeout 25 s, retourne `{out, code}` |
| `stop()` | détruit le process |

Environnement : `PATH=/system/bin:/system/xbin:/vendor/bin`, `HOME=<workspace>`,
`TERM=xterm-256color`. Pas de root, pas de binaires Termux (UID différent) —
limite assumée et affichée dans l'écran Terminal.

### 4.4 Moteur IA

```
TOS.ask(messages, opts)
  └─ pour chaque provider de enabledChain() :
       callProvider()
         ├─ kind=ollama  → POST {base}/api/chat      (stream NDJSON, images ok)
         └─ kind=openai  → POST {base}/chat/completions (SSE, Bearer key)
       succès → retour {text, provider}
       échec  → erreur mémorisée, provider suivant
```

Le failover ne bascule **que si aucun token n'a encore été affiché** : on ne
mélange jamais deux réponses dans une même bulle.

`buildMessages()` empile : prompt système → chef de file → skills actives →
8 dernières entrées de mémoire → conversation.

## 5. Flux d'une requête

```
tap Envoyer
 → state.chat.push(user)
 → TOS.ask()
   → buildMessages()           (prompt + agents + skills + mémoire)
   → ELG.httpStream()          (thread Java)
     → HttpURLConnection
       → TOS.onStreamChunk()   (≈60 ms par lot)
         → TOS.md()            (rendu markdown minimal)
 → state.chat.push(assistant) → TOS.save()
```

## 6. Extension : installer un nouveau moteur « par commande »

Trois chemins, du plus simple au plus profond :

1. **Données** — Modèles → Ajouter : nom, type, URL, clé, modèle. Aucun
   rebuild. Persisté, immédiatement disponible dans la chaîne.
2. **Skill** — Skills → Nouvelle : nom, catégorie, instructions. Injectée
   dans le contexte de tous les agents.
3. **Code** — ajouter un `kind` dans `callProvider()` et un formulaire dans
   l'écran Modèles. C'est le seul cas qui demande un nouveau build APK.

Un serveur MCP s'ajoute par URL (JSON-RPC `initialize` → `tools/list`), sans
toucher au noyau.

## 7. Sécurité

- Aucune clé API dans le code : uniquement SharedPreferences, jamais
  exportée (`set-export` supprime `ghToken`).
- `usesCleartextTraffic` autorisé **pour le réseau local** ; les domaines
  publics restent en HTTPS par défaut.
- Actions destructrices (suppression, reset, envoi de commande) toujours
  derrière un tap explicite ; pas d'exécution automatique de commande générée
  par le modèle.
- Le shell tourne sous l'UID de l'application : il ne peut pas lire les
  données d'une autre application.

## 8. Ce qui manque encore (honnête)

- Pas de runtime GGUF embarqué (llama.cpp JNI) : le local passe par un serveur
  Ollama. C'est un choix de v1, pas un oubli.
- Pas de PTY complet : le shell est un pipe (pas de `top`, pas de curses).
- MCP : transport HTTP uniquement (pas encore stdio/spawn).
- Pas de git natif : DevHub lit l'API GitHub, il ne clone pas encore.

Voir `docs/ROADMAP.md` pour l'ordre prévu.
