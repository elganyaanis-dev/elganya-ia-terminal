# Roadmap Terminal OS

## v1.0 (livrée)
- Cockpit, Chat IA, Orchestrateur, Modèles, Skills, MCP, Mémoire, Terminal,
  Fichiers, Médias, DevHub, Historique, Paramètres.
- Pont natif : HTTP/stream sans CORS, shell toybox, SharedPreferences, FS.
- Gateway : providers multiples, chaîne de failover, test de santé, sélection
  de modèle, streaming SSE + NDJSON.
- APK signée en debug via GitHub Actions, publiée en release.

## v1.1 — continuité
- [ ] Reprise de session : le shell et la conversation survivent au redémarrage.
- [ ] Export/import complet de l'état (JSON) depuis l'écran Paramètres.
- [ ] Recherche globale (mémoire + historique + fichiers).
- [ ] Pièces jointes : envoi d'images à Ollama (champ `images`) et aux
      fournisseurs vision (contenu multimodal).

## v1.2 — serveur MCP local
- [ ] Serveur MCP embarqué (fichiers, git, build) exposé en HTTP sur
      `127.0.0.1:8765`, visible depuis l'écran MCP.
- [ ] Permissions par outil (lecture / écriture / exécution) avec confirmation.
- [ ] Journal d'appels d'outils (audit).

## v1.3 — moteur local embarqué
- [ ] llama.cpp en JNI, chargement d'un GGUF ≤ 1,5 Go (Qwen 2.5 1.5B Q4_K_M).
- [ ] Téléchargement de modèle avec contrôle de taille et de hash.
- [ ] Mesure RAM/latence affichée dans le Cockpit, avertissement avant
      chargement si la mémoire libre est insuffisante.

## v1.4 — index de code
- [ ] Index SQLite FTS du workspace (ripgrep côté natif).
- [ ] Outils agents : « où est défini X », « qui appelle Y », résumé de fichier.
- [ ] Graphe de dépendances simple (imports/requires).

## v2 — distribution
- [ ] Build release signée (keystore hors dépôt, secrets Actions).
- [ ] Mise à jour in-app (vérification de la dernière release GitHub).
- [ ] Thèmes supplémentaires (le cyberpink reste le défaut).

## Non-objectifs assumés
- Pas de cluster vectoriel, pas de plateforme de workflow visuelle, pas de
  framework d'orchestration Python embarqué : ces besoins sont couverts par
  le gateway + les agents + MCP, ou restent côté serveur.
