# Revue de la mission « ELGANYA DEFY v1 — OSS Intelligence »

Verdict court : **excellent document de recherche, dangereux comme plan de
build.** La méthode (explorer → comprendre → comparer → sélectionner →
adapter → intégrer → tester) est la bonne. Le périmètre, lui, est
irréalisable tel quel, et une partie de la liste ne correspond à aucun dépôt
réel. Voici la revue, point par point, puis la version que je recommande.

---

## 1. Ce qui est solide dans la mission

- La **séparation exploration / modification** et l'interdiction des commandes
  destructrices (`reset --hard`, `clean`, force-push) : à garder tel quel.
- La règle « **ne jamais annoncer une compilation réussie sans preuve du
  workflow réel** » : c'est exactement le standard appliqué ici.
- L'idée d'un **Model Gateway interne** (fournisseurs multiples, quotas,
  failover, sélection par tâche) : c'est la brique qui apporte le plus de
  valeur immédiate, et elle ne demande aucune dépendance externe.
- L'idée d'un **Skills Engine** (registre + activation + injection dans le
  contexte) plutôt que d'importer des environnements complets.
- La cible matérielle annoncée honnêtement (8 Go RAM, ARM64, pas de PC,
  Actions pour compiler) : ça élimine d'office la moitié de la liste.

## 2. Ce qui ne tient pas

**a) Le volume.** ~130 dépôts, dont beaucoup sont des plateformes complètes
(Dify, Flowise, Langflow, n8n, Ray, Milvus, Weaviate, Grafana, Prometheus,
OpenHands, LibreChat, Open WebUI). Chacune coûte des semaines d'intégration et
plusieurs Go de RAM. Sur un téléphone de 8 Go, en intégrer trois suffit à
étouffer Termux. Un audit sérieux conclut : **six briques maximum en v1**.

**b) Les entrées fantômes.** Une dizaine de noms de la liste ne pointent vers
aucun dépôt identifiable : « Agent Memory », « Scientific Agent Skills »,
« Learn Harness Engineering », « Graphify », « Turbo-fieldfare », « ESP32-AI »,
« The Hugging Bay », « MCPHub » (nom trop générique), « GODMODE3 » (c'est un
prompt de jailbreak diffusé en capture, pas un projet), « Kimi K3 » (Kimi K2
existe ; K3 n'est pas confirmé). Règle : **phase 0 = vérifier l'existence, la
licence et la dernière activité avant toute fiche**. Pas de fiche sur un nom
non résolu.

**c) Les agrégateurs d'API « gratuites ».** FreeLLMAPI et consorts sont à
traiter comme **non fiables par défaut** : quotas qui changent sans préavis,
clés partagées, disparition du service. Un gateway interne qui pointe vers des
fournisseurs que l'utilisateur contrôle (Ollama local, une clé Groq/OpenRouter
personnelle) vaut dix agrégateurs. Et un quota gratuit ne doit jamais être
présenté comme illimité — c'est écrit dans l'interface.

**d) Les frameworks d'orchestration.** LangGraph, CrewAI, Agno, AutoGen,
LlamaIndex : tous supposent Python + un runtime serveur. Les embarquer dans
l'APK est irréaliste ; les faire tourner dans Termux ajoute 1 Go de
dépendances pour des graphes que l'application fait déjà en 80 lignes de JS
(agents + file de tâches + failover). **Décision : inspiration architecturale
seulement, aucun import.**

**e) Les bases vectorielles serveur.** Milvus, Weaviate, Qdrant, Chroma en
mode serveur : hors sujet sur mobile. Si un jour il faut de la recherche
sémantique : **SQLite + embeddings** (ou `sqlite-vec`), pas un cluster.

## 3. Catalogue resserré (ce que je garde, et pourquoi)

| Projet | Rôle | Décision | Stratégie |
|---|---|---|---|
| **Ollama** (serveur) | moteur local GGUF | **P0** | F — service local/LAN, déjà branché |
| **llama.cpp** | runtime GGUF embarquable | **P1** | B/C — JNI plus tard, pas en v1 |
| **LiteLLM** | modèle mental du gateway | **P0** | G — réimplémenté (chaîne + failover + quotas) |
| **FastMCP** | serveurs MCP simples | **P1** | E — client MCP HTTP déjà présent |
| **mcp-use / MCP SDK** | sémantique du protocole | **P1** | G — `initialize` + `tools/list` implémentés |
| **Context7** | doc à jour des libs | **P1** | E — via MCP, pas d'import de code |
| **ECC (everything-claude-code)** | format skills/commandes | **P1** | B — **format**, pas l'environnement |
| **addyosmani/agent-skills** | exemples de skills | **P2** | B — inspiration de contenu |
| **Mem0** | idées de mémoire | **P1** | G — mémoire clé/valeur + injection, déjà en place |
| **Letta / Zep** | mémoire évolutive | **P2** | G — concepts seulement |
| **browser-use** | navigation agentique | **P2** | F — service distant si besoin |
| **OpenHands / Aider / Cline / Roo / Goose** | agents de dev | **P2** | G — le terminal + le chat couvrent 80 % |
| **Continue** | assistant IDE | **P3** | G |
| **Perplexica** | recherche citée | **P2** | F — auto-hébergé côté PC |
| **ripgrep / fd / fzf / bat / tmux** | outils CLI | **P2** | C — paquets Termux, pas dans l'APK |
| **Monaco** | éditeur | **P2** | B — remplace l'éditeur maison si besoin |
| **Hoppscotch / Bruno** | test d'API | **P3** | H — le terminal + curl suffisent |
| **Trivy / Syft / Grype / CodeQL** | sécurité | **P3** | F — en CI, pas sur le téléphone |
| **promptfoo / DeepEval / Ragas** | éval | **P3** | F — en CI |
| **Langfuse / Phoenix / Opik / AgentOps** | observabilité | **P3** | G — logs locaux suffisent en v1 |
| **Dify / Flowise / Langflow / n8n** | plateformes | **REJET** | H — redondant, lourd |
| **Ray / Milvus / Weaviate / Qdrant / Chroma** | infra | **REJET** | H — serveur, hors mobile |
| **Grafana / Prometheus / Uptime Kuma** | monitoring | **REJET** | H |
| **ComfyUI / diffusers / RVC / OpenVoice / Piper** | multimodal local | **P3** | F — côté PC, jamais dans l'APK |
| **Open WebUI / LibreChat** | UI multi-modèles | **REJET** | H — Terminal OS **est** l'UI |
| **LangChain / AutoGen / CrewAI / Agno / LlamaIndex** | frameworks | **REJET (import)** | G |
| **AirLLM** | gros modèles en RAM faible | **P3** | G — intéressant, mais lent sur mobile |
| **MLC LLM / MNN / ONNX Runtime / ExecuTorch / NCNN** | runtimes mobiles | **P2** | C — un seul sera choisi, après benchmark |

## 4. Les six briques de la v1 (ce que je construis réellement)

1. **Model Gateway** — providers, clés, chaîne, failover, test de santé,
   sélection du modèle. *Déjà livré dans Terminal OS.*
2. **Skills Engine** — registre nommé, activable, injecté dans le contexte.
   *Déjà livré.*
3. **Memory Engine** — décisions/conventions/erreurs, 8 dernières injectées,
   recherche. *Déjà livré.*
4. **MCP Client** — `initialize` + `tools/list` en JSON-RPC HTTP, découverte
   d'outils par serveur. *Déjà livré (client), serveur local à venir.*
5. **Terminal + Fichiers** — shell Android réel, workspace, éditeur.
   *Déjà livré.*
6. **Moteur local** — Ollama d'abord (serveur), llama.cpp JNI ensuite.
   *Ollama livré, JNI en roadmap.*

Tout le reste de la liste est soit **externe** (services à héberger), soit
**inutile** pour la v1.

## 5. Plan par phases (remplace les phases 1-8 du document)

| Phase | Contenu | Sortie vérifiable |
|---|---|---|
| 0 | Vérifier existence/licence/activité des dépôts cités | tableau rempli, zéros fantômes retirés |
| 1 | Gateway + skills + mémoire + MCP (fait) | APK installée, 3 moteurs testés |
| 2 | Serveur MCP local (FastMCP) exposant fichiers + git | `tools/list` non vide depuis l'app |
| 3 | llama.cpp JNI, un modèle ≤ 1,5 Go (Qwen 2.5 1.5B Q4) | réponse hors ligne, RAM mesurée |
| 4 | Index de code (ripgrep + SQLite FTS) pour les agents | « où est défini X ? » répond sans réseau |
| 5 | Éval + CI (promptfoo, Trivy) côté GitHub Actions | rapport automatique par release |

Chaque phase se termine par une **preuve** (capture, log, APK), jamais par une
annonce.

## 6. Trois corrections à apporter au document de mission

1. **Ajouter une phase 0 de vérification** et interdire toute fiche sur un
   dépôt non résolu (aujourd'hui ~10 entrées ne pointent nulle part).
2. **Plafonner le périmètre** : « six briques maximum par version, chacune
   avec une preuve de fonctionnement ». Sans plafond, la mission produit un
   catalogue, pas un produit.
3. **Séparer explicitement** « ce qui tourne sur le téléphone » de « ce qui
   tourne sur un serveur/Actions » : la moitié de la liste est dans la
   seconde catégorie et ne doit jamais entrer dans l'APK.
