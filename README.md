# Elganya Orchestrator

Surcouche agentic **Android** : tableau de bord multi-modèles (local + LAN + cloud),
orchestrateur IA, terminal, fichiers, skills, MCP, mémoire, médias, DevHub.
Style : cyberpunk moderne · matrice verte · lignes fines.

## Points forts
- Login email/Google (démo) + compte admin `elganya / elganya`.
- Gateway IA avec failover : Ollama local, Ollama LAN, Ollama Cloud (beam).
- Auth directe vers Ollama Cloud (`https://ollama.com/v1`, Bearer token) — pas de curl requis.
- Build APK via GitHub Actions, déploiement release automatique.

## Build
Push sur `main` déclenche `.github/workflows/build.yml` → APK release `apk-<run>`.
