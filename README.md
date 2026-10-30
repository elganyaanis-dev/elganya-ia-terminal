# Terminal OS by Elganya

Environnement de développement agentique pour Android : interface moderne
multi-écrans, terminal réel, explorateur de fichiers, orchestrateur d'IA
locale (Ollama) et cloud (passerelles OpenAI-compatibles), skills, plugins MCP,
mémoire de projet, studio média et DevHub GitHub.

**Thème : cyberpink sombre — un seul accent rose, surfaces violettes, aucune
saturation agressive.**

## Installation

1. Ouvre les [releases](../../releases) du dépôt.
2. Télécharge `app-debug.apk` de la dernière release.
3. Autorise « installer des applications inconnues » pour ton navigateur, puis
   installe l'APK.
4. Au premier lancement : **Modèles → Ollama local → Tester**.

## Écrans

| Écran | Rôle |
|---|---|
| Cockpit | état du système, ressources, diagnostic, raccourcis |
| Chat IA | orchestration, streaming, pièces jointes, mémoire injectée |
| Orchestrateur | agents, chef de file, file de tâches |
| Modèles | moteurs locaux/cloud, chaîne de failover, test, sélection du modèle |
| Skills | registre de capacités activables, injection dans le contexte |
| Plugins · MCP | serveurs MCP, découverte d'outils (JSON-RPC HTTP) |
| Mémoire | décisions, conventions, erreurs connues — persistantes |
| Terminal | `/system/bin/sh` réel (toybox), interactif + commandes rapides |
| Fichiers | workspace, lecture/écriture, dossiers, partage |
| Médias | import image/audio/vidéo/document, génération d'images |
| DevHub | token GitHub, dépôts, builds Actions |
| Historique | conversations archivées, restauration |
| Paramètres | moteur, température, prompt système, export, reset |

## Architecture en une ligne

`WebView (UI HTML/CSS/JS)` ⇄ **pont natif Java** (`ELG` réseau/stockage/fichiers,
`ELGSH` terminal) — aucun framework lourd, build APK en 2-3 minutes.

Détail complet : [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).
Pourquoi Ollama échoue ailleurs et marche ici : [docs/OLLAMA-DIAGNOSTIC.md](docs/OLLAMA-DIAGNOSTIC.md).

## Build

Le build tourne sur GitHub Actions (`.github/workflows/build.yml`) :

```bash
gradle assembleDebug
```

Localement il faut JDK 17 + Android SDK. Sur téléphone, ne compile pas :
pousse sur `main`, l'APK sort dans les releases.

## Licence

Code applicatif : MIT. Les services tiers (Ollama, fournisseurs d'API) gardent
leurs propres licences et conditions.
