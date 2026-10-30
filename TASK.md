# TASK — Terminal OS by Elganya (v1)

GOAL: transformer le dépôt vide `elganyaanis-dev/terminal-os` en application Android
« Terminal OS by Elganya » : un OS-shell agentique, interface moderne multi-écrans
(thème cyberpink sombre, classe), orchestrateur d'IA locale (Ollama) + cloud
(fournisseurs OpenAI-compatibles, chaîne de failover), terminal réel, explorateur
de fichiers/projets, skills, plugins/MCP, mémoire, médias, DevHub, cockpit.
Build APK par GitHub Actions. Aucune dépendance à Termux pour fonctionner.

## Décisions prises
- Stack : Android natif minimal (Java, Activity + WebView) + UI HTML/CSS/JS dans
  `app/src/main/assets/`. Zéro dépendance Gradle hors androidx-core → build fiable.
- Pourquoi WebView : 12+ écrans, design libre, itération rapide sans rebuild lourd.
- Réseau IA passe par le **bridge natif** (`ELG.http`) et non par `fetch()` :
  évite CORS, `file://` origin, et les blocages cleartext — cause n°1 des échecs
  « ollama ne répond pas » dans les apps WebView.
- Shell : `/system/bin/sh` (toybox) via `ProcessBuilder`, interactif + one-shot.
  Honnête : ce n'est pas Termux (uid différent, pas d'exécution de ses binaires).
- Stockage : SharedPreferences via `ELG.store` (clés API, réglages, chaîne modèles).
- Un seul accent : rose cyber `#FF4D9D`, surfaces violettes sombres, pas de néon agressif.

## Étapes
- [x] Recon : `terminal-os` et `elganya-os-terminal` sont VIDES sur GitHub (0 KB).
- [x] Diagnostic ollama/API (voir docs/OLLAMA-DIAGNOSTIC.md).
- [x] Scaffold Gradle + manifest + workflow APK + icône adaptative.
- [x] Bridge natif Java : http, shell, store, fs, device, media, share.
- [x] UI core : tokens CSS cyberpink, router, state, ui helpers, icônes SVG.
- [x] Écrans : Cockpit, Chat IA, Modèles, Orchestrateur, Terminal, Fichiers,
      Skills, MCP/Plugins, Mémoire, Médias, DevHub, Historique, Paramètres.
- [x] Docs : ARCHITECTURE (arborescence, modules, variables, couches),
      DEFY-REVIEW (verdict mission), ROADMAP.
- [x] Push GitHub + build Actions vert + APK.

## NOW
Livraison : lien APK + verdict mission ELGANYA DEFY.
