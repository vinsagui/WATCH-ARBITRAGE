# Watch Arbitrage Agent — V1

Agent qui scanne Vinted en continu sur des marques/modèles ciblés (Casio,
Seiko, Citizen), compare chaque annonce à un prix médian de marché calculé
automatiquement, et envoie une alerte Telegram quand une annonce est
nettement sous le prix (et pas en panne).

## Étapes pour lancer ce soir

### 1. Créer le bot Telegram
1. Ouvre Telegram, cherche **@BotFather**.
2. Envoie `/newbot`, suis les instructions → tu obtiens un **token**.
3. Envoie n'importe quel message à ton nouveau bot (juste pour l'activer).
4. Va sur `https://api.telegram.org/bot<TON_TOKEN>/getUpdates` dans un
   navigateur → cherche `"chat":{"id":...}` → c'est ton `chat_id`.

### 2. Créer la base PostgreSQL sur Railway
1. Sur [railway.app](https://railway.app), nouveau projet → **+ New** →
   **Database** → **PostgreSQL**.
2. Onglet **Connect** → copie la `DATABASE_URL` (commence par
   `postgresql://...`).

### 3. Configurer le projet en local (ou directement sur Railway)
```bash
cd watch-arbitrage
npm install
cp .env.example .env
# édite .env avec ta DATABASE_URL, TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID
npm run init-db     # crée les tables
npm start           # lance le premier scan + la boucle
```

### 4. Déployer sur Railway (pour que ça tourne 24/7, pas juste sur ton PC)
1. Pousse ce dossier sur un repo GitHub (comme pour PicksAI).
2. Sur Railway : **+ New** → **GitHub Repo** → sélectionne le repo.
3. Ajoute les variables d'environnement du `.env` dans l'onglet **Variables**
   de Railway.
4. Railway détecte `npm start` automatiquement via `package.json`.

## Ce qui se passe à chaque scan
1. Pour chaque cible dans `config/targets.js`, l'agent interroge Vinted.
2. Chaque annonce est enregistrée en base (table `listings`).
3. Le titre est analysé pour détecter un problème d'état (mots-clés dans
   `config/targets.js` — `brokenKeywords` / `minorIssueKeywords`).
4. Le prix est comparé au prix médian connu pour ce modèle exact
   (table `reference_prices`, recalculée à chaque scan).
5. Si l'écart dépasse le seuil (`DISCOUNT_THRESHOLD`, 35% par défaut) et que
   l'état n'est pas dégradé → alerte Telegram avec le lien direct.

## Limites connues de cette V1 (assumées, à améliorer plus tard si besoin)
- **Détection de modèle par regex** : fonctionne bien pour Casio/Seiko/Citizen
  mais imparfaite — certaines annonces sans référence claire n'entreront pas
  dans le calcul de prix médian. C'est volontaire (mieux vaut ignorer que
  mal comparer).
- **Pas assez de données au début** : les premiers jours, peu d'alertes
  sortiront car il faut accumuler des annonces avant d'avoir un prix médian
  fiable (`minSampleSize = 3` dans `priceReference.js`). C'est normal.
- **Endpoint Vinted non officiel** : peut changer sans préavis. Si le
  scraper ne remonte plus rien, vérifier l'URL appelée par le site Vinted
  dans l'onglet réseau du navigateur.
- **Pas d'analyse d'image** : l'état visuel (rayures, usure) n'est pas
  vérifié automatiquement — à faire à l'œil avant d'acheter.
- **Pas d'achat automatique** : l'agent alerte, l'achat reste manuel (plus
  sûr pour démarrer).

## Prochaines pistes (V2, pas urgent)
- Ajouter Leboncoin comme deuxième source.
- Récupérer la description complète (pas juste le titre) pour affiner la
  détection d'état — la fonction `getListingDetail()` existe déjà dans
  `scraper.js`, il suffit de l'appeler dans `index.js`.
- Analyse photo par modèle vision pour repérer l'usure.
