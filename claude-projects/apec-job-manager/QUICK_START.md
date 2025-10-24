# 🚀 Quick Start - APEC Job Manager

Guide de démarrage rapide en 5 minutes.

## Installation en 3 étapes

### 1. Installer les dépendances

```bash
cd apec-job-manager

# Backend
npm install

# Dashboard
cd dashboard
npm install
cd ..
```

### 2. Configurer l'environnement

```bash
# Copier le fichier d'exemple
cp .env.example .env

# Éditer avec vos identifiants
nano .env
```

**Remplir au minimum:**
```env
# Vos identifiants APEC
APEC_EMAIL=votre.email@entreprise.fr
APEC_PASSWORD=votre_mot_de_passe

# Base de données (PostgreSQL local ou distant)
DATABASE_URL=postgresql://user:password@localhost:5432/apec_manager
```

### 3. Initialiser la base de données

```bash
# Créer la base PostgreSQL (si locale)
createdb apec_manager

# Appliquer les migrations Prisma
npx prisma migrate dev
npx prisma generate
```

## Lancement rapide

### Mode développement (recommandé pour tester)

**Terminal 1 - Backend:**
```bash
npm run dev
```
→ API disponible sur http://localhost:3000

**Terminal 2 - Dashboard:**
```bash
npm run dashboard
```
→ Interface disponible sur http://localhost:3001

**OU tout en un:**
```bash
npm run dev:all
```

### Vérification

1. **Backend fonctionne?**
```bash
curl http://localhost:3000/api/health
```
Réponse attendue:
```json
{
  "status": "OK",
  "timestamp": "...",
  "uptime": ...,
  "environment": "development"
}
```

2. **Dashboard accessible?**
Ouvrir http://localhost:3001 dans le navigateur

3. **Base de données créée?**
```bash
npx prisma studio
```
→ Ouvre interface GUI pour voir les tables

## Premier test

### 1. Tester l'authentification APEC

L'authentification se fera automatiquement lors de la première action.

### 2. Créer une annonce de test

Via l'API:
```bash
curl -X POST http://localhost:3000/api/jobs \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test - Développeur Full Stack",
    "description": "Ceci est une annonce de test",
    "location": "Paris",
    "contractType": "CDI",
    "salary": "45-55K€"
  }'
```

Via le Dashboard:
1. Aller sur http://localhost:3001/jobs
2. Cliquer "Nouvelle annonce"
3. Remplir le formulaire

### 3. Synchroniser avec APEC

Via l'API:
```bash
curl -X POST http://localhost:3000/api/jobs/sync
```

Via le Dashboard:
1. Page "Annonces"
2. Cliquer "Synchroniser"

### 4. Générer un rapport

```bash
curl http://localhost:3000/api/reports/daily
```

## Troubleshooting rapide

### Erreur: "APEC authentication failed"
- Vérifiez `APEC_EMAIL` et `APEC_PASSWORD` dans `.env`
- Assurez-vous que votre compte APEC entreprise est actif
- Tentez une connexion manuelle sur https://entreprise.apec.fr pour vérifier

### Erreur: "Database connection failed"
- Vérifiez que PostgreSQL est démarré: `pg_isready`
- Vérifiez `DATABASE_URL` dans `.env`
- Créez la base si nécessaire: `createdb apec_manager`

### Erreur: "Port 3000 already in use"
- Un autre service utilise le port
- Tuez le processus: `lsof -ti:3000 | xargs kill -9`
- Ou changez `PORT=3001` dans `.env`

### Dashboard ne charge pas
- Vérifiez que le backend tourne sur port 3000
- Vérifiez les logs: `npm run dev` (dans terminal backend)
- Ouvrez la console navigateur (F12) pour voir les erreurs

### Puppeteer ne s'installe pas
Sur macOS/Linux:
```bash
# Installer Chromium manuellement
npx puppeteer browsers install chrome
```

## Prochaines étapes

1. **Tester toutes les fonctionnalités:**
   - Créer/modifier/supprimer des annonces
   - Synchroniser avec APEC
   - Générer des rapports

2. **Configurer la synchronisation automatique:**
   Éditer `.env`:
   ```env
   AUTO_SYNC_ENABLED=true
   AUTO_SYNC_CRON=0 */6 * * *  # Toutes les 6h
   ```

3. **Personnaliser le dashboard:**
   - Logo entreprise dans `dashboard/public/`
   - Couleurs dans `dashboard/tailwind.config.js`

4. **Préparer la production:**
   - Lire [DEPLOYMENT_GUIDE.md](docs/DEPLOYMENT_GUIDE.md)
   - Configurer SSL/HTTPS
   - Mettre en place backups BDD

## Commandes utiles

```bash
# Logs du backend
tail -f logs/combined.log

# Voir la base de données
npx prisma studio

# Linter le code
npm run lint
npm run lint:fix

# Tests (à implémenter)
npm test

# Health check
curl http://localhost:3000/api/health
```

## Support

- 📖 Documentation complète: [README.md](README.md)
- 🚀 Guide déploiement: [docs/DEPLOYMENT_GUIDE.md](docs/DEPLOYMENT_GUIDE.md)
- 📡 API Reference: [docs/API_DOCUMENTATION.md](docs/API_DOCUMENTATION.md)

---

**Bon développement! 🎉**
