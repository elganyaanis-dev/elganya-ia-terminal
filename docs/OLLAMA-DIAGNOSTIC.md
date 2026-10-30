# Pourquoi Ollama / l'API ne répondait pas — diagnostic et correctifs

## 1. Ce que j'ai trouvé dans les dépôts

| Dépôt | État réel au 30/10/2026 |
|---|---|
| `elganya-os-terminal` | **vide** : 0 Ko, aucun commit, aucune branche avec du code |
| `terminal-os` | **vide** (avant cette livraison) |
| `elganya-ia-v4` | squelette React Native ; `ollama` n'apparaît que dans le README, `App.tsx` et `docs/` — aucune requête réseau réelle vers un serveur Ollama |

Conséquence : il n'y avait rien à faire « fonctionner » dans
`elganya-os-terminal` — le dépôt ne contient aucun fichier. Le « ça marche
dans elganya-ia-v4 » correspond à l'application qui se lance (interface), pas
à une connexion Ollama vérifiée : le code d'appel n'y existe pas encore.

## 2. Les sept causes réelles d'un Ollama muet sur Android

C'est la liste que j'ai vérifiée une par une, et que Terminal OS traite par
construction.

| # | Cause | Symptôme | Correctif appliqué ici |
|---|---|---|---|
| 1 | **CORS** — un WebView en `file://` qui appelle `http://127.0.0.1:11434` est bloqué (origine `null`, Ollama n'autorise que certaines origines) | la requête part, rien ne revient, erreur `Failed to fetch` | **aucun `fetch` vers Ollama** : tout passe par le pont natif `ELG.http` / `ELG.httpStream` (HttpURLConnection, hors CORS) |
| 2 | **Cleartext HTTP bloqué** — Android 9+ refuse `http://` si `usesCleartextTraffic=false` | `CLEARTEXT communication not permitted` | `usesCleartextTraffic="true"` + `res/xml/network_security_config.xml` |
| 3 | **Permission INTERNET absente** | `UnknownHostException` / timeout | déclarée dans le manifest |
| 4 | **Mauvaise adresse** — `127.0.0.1` depuis le téléphone = le téléphone, pas le PC | « connection refused » alors que le PC répond | trois fournisseurs préconfigurés (local, LAN, cloud) + test intégré qui affiche l'URL exacte testée |
| 5 | **Ollama écoute seulement en local sur le PC** | le PC répond en `curl localhost`, le téléphone non | la fiche d'erreur rappelle `OLLAMA_HOST=0.0.0.0` + pare-feu 11434 |
| 6 | **Serveur non lancé / tué par Android** | ça marchait, puis plus rien | test de santé à la demande, message d'erreur explicite, bascule automatique vers le cloud |
| 7 | **Mauvais chemin ou mauvaise clé** — `/chat/completions` sans `/v1`, header `Authorization` oublié, 401 | « HTTP 401 » ou 404 | `base` normalisée (slash final retiré), `/v1` laissé à l'utilisateur, `Bearer` ajouté seulement si clé présente, code HTTP et message renvoyés tels quels |

Deux causes secondaires, aussi traitées : le **streaming mal parsé** (SSE
`data:` et NDJSON Ollama sont tous deux gérés) et le **modèle vide** (liste
`/api/tags` chargée automatiquement, premier modèle sélectionné).

## 3. Vérifier à la main, en 30 secondes

Dans Termux, sur le même téléphone :

```bash
# Ollama tourne-t-il ?
curl -s http://127.0.0.1:11434/api/tags | head -c 300

# Si vide : lancer le serveur (Termux, avec wake-lock)
termux-wake-lock
ollama serve &
```

Depuis un PC du même Wi-Fi :

```bash
OLLAMA_HOST=0.0.0.0 ollama serve     # Windows: set OLLAMA_HOST=0.0.0.0
# puis, depuis le téléphone :
curl -s http://IP-DU-PC:11434/api/tags
```

Dans Terminal OS : **Modèles → Tester** affiche soit la liste des modèles
(nom + taille), soit l'erreur exacte et les quatre points à vérifier.

## 4. Règle de conception retenue

> Une application Android qui parle à un moteur local ne doit jamais le faire
> depuis le JavaScript de la page.

Le JS n'a pas accès au réseau « brut » de façon fiable dans un WebView
(`file://`, CORS, cleartext, cookies, certificats). Le pont natif a tous les
droits du manifeste et aucune de ces limites. C'est la raison pour laquelle
la couche IA de Terminal OS est en Java, et l'interface en HTML.

## Cas Ollama Cloud (API key) — validé 2026-10-30
- Endpoint direct : `https://ollama.com/api` (natif) ou `https://ollama.com/v1` (OpenAI-compatible).
- Auth : header `Authorization: Bearer <OLLAMA_API_KEY>` — aucune installation requise.
- Nom du modèle côté API = celui de `https://ollama.com/api/tags` (ex. `beam`) ; le suffixe `:cloud`
  ne sert que dans le CLI/app Ollama local (`ollama run beam:cloud`).
- Dans l'app : type **OpenAI-compatible**, base `https://ollama.com/v1`, clé = API key, modèle `beam`.
- Le provider de type "ollama" n'envoie pas encore le header d'auth (à corriger en P1).
