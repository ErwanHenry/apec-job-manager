# 🔄 Guide de Configuration - Synchronisation APEC

## 📋 Prérequis

1. **Compte APEC Entreprise**: Vous devez avoir un compte sur [entreprise.apec.fr](https://entreprise.apec.fr)
2. **Vercel KV (Redis)**: Base de données clé-valeur pour stocker les cookies de session
3. **Variables d'environnement**: Configurées dans Vercel Dashboard

---

## 🔐 Configuration des Variables d'Environnement

### Sur Vercel Dashboard

1. Allez sur https://vercel.com/erwan-henrys-projects/next-app/settings/environment-variables

2. Ajoutez les variables suivantes:

#### Credentials APEC (OBLIGATOIRE)
```
APEC_EMAIL=votre-email@example.com
APEC_PASSWORD=votre-mot-de-passe-apec
```

#### Encryption Key (OBLIGATOIRE)
Générez une clé de 64 caractères hex:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
Ajoutez-la à Vercel:
```
ENCRYPTION_KEY=votre-cle-generee-64-caracteres
```

#### Vercel KV (Normalement auto-configuré)
Si vous avez créé le Vercel KV Storage, ces variables devraient déjà être présentes:
```
KV_URL=redis://...
KV_REST_API_URL=https://...
KV_REST_API_TOKEN=...
KV_REST_API_READ_ONLY_TOKEN=...
```

---

## 🚀 Utilisation

### 1. Déclencher une Synchronisation

Une fois connecté en tant qu'admin, vous pouvez appeler:

```bash
POST https://next-o4177rczz-erwan-henrys-projects.vercel.app/api/jobs/sync
Content-Type: application/json
Cookie: auth-token=YOUR_JWT_TOKEN

{
  "type": "full"
}
```

Types de synchronisation:
- `"full"` - Synchronisation complète (tous les jobs)
- `"incremental"` - Synchronisation incrémentale (mises à jour uniquement)

### 2. Vérifier le Statut de Synchronisation

```bash
GET https://next-o4177rczz-erwan-henrys-projects.vercel.app/api/jobs/sync
Cookie: auth-token=YOUR_JWT_TOKEN
```

Réponse:
```json
{
  "data": {
    "lastSync": {
      "id": "...",
      "syncType": "full",
      "status": "success",
      "jobsCreated": 10,
      "jobsUpdated": 5,
      "jobsDeleted": 0,
      "jobsUnchanged": 20,
      "errors": [],
      "startedAt": "2025-10-25T...",
      "completedAt": "2025-10-25T...",
      "duration": 15230
    },
    "autoSyncEnabled": false,
    "cronSchedule": "0 */6 * * *"
  }
}
```

---

## 🏗️ Architecture Technique

### Service Serverless
- **@sparticuz/chromium**: Chromium optimisé pour Vercel (60MB au lieu de 300MB+)
- **puppeteer-core**: Puppeteer sans Chromium intégré
- **Vercel KV**: Stockage des cookies de session APEC (évite de se reconnecter à chaque fois)
- **Encryption AES-256**: Les cookies sont chiffrés avant stockage

### Flux de Synchronisation
1. **Initialisation**: Lance Chromium via @sparticuz/chromium
2. **Authentification**: 
   - Essaie de restaurer les cookies depuis Vercel KV
   - Si expirés/absents, se connecte à APEC avec email/password
   - Sauvegarde les nouveaux cookies (chiffrés) dans KV (TTL 24h)
3. **Scraping**: Navigue sur `https://entreprise.apec.fr/mes-offres`
4. **Extraction**: Parse les données des annonces
5. **Synchronisation DB**: 
   - Compare avec les jobs existants en base
   - Crée les nouveaux
   - Met à jour les modifiés
   - Marque les stats (created/updated/unchanged)
6. **Nettoyage**: Ferme le browser (CRITIQUE pour Vercel serverless)

### Limites Vercel
- **Timeout**: 60s (Pro plan) - le code est optimisé pour s'arrêter à 55s
- **Mémoire**: 3 GB - Chromium optimisé pour tenir dans cette limite
- **Aucune persistance**: Cookies stockés dans KV, pas sur le filesystem

---

## 🧪 Test en Local

1. Copiez `.env.example` vers `.env.local`:
```bash
cp .env.example .env.local
```

2. Remplissez vos credentials APEC:
```env
APEC_EMAIL="votre-email@example.com"
APEC_PASSWORD="votre-mot-de-passe"
ENCRYPTION_KEY="$(node -e 'console.log(require("crypto").randomBytes(32).toString("hex"))')"
```

3. Installez Chromium (Mac):
```bash
brew install chromium
```

4. Lancez le dev server:
```bash
npm run dev
```

5. Connectez-vous et testez:
```bash
# Se connecter
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}'

# Copier le cookie auth-token de la réponse, puis:
curl -X POST http://localhost:3000/api/jobs/sync \
  -H "Content-Type: application/json" \
  -H "Cookie: auth-token=VOTRE_TOKEN" \
  -d '{"type":"full"}'
```

---

## 📊 Logs et Debugging

### Logs Vercel
```bash
vercel logs next-o4177rczz-erwan-henrys-projects.vercel.app
```

### Logs de Synchronisation
Les logs incluent:
- `[ApecService] Initializing Chromium browser...`
- `[ApecService] Authenticated using cached cookies`
- `[ApecService] Found X job postings`
- `[ApecSyncService] Found X jobs on APEC`
- `[ApecSyncService] Created: X, Updated: Y, Unchanged: Z`

### Erreurs Courantes

**1. "APEC_EMAIL and APEC_PASSWORD environment variables are required"**
- Solution: Ajoutez les variables d'environnement sur Vercel

**2. "Browser initialization failed"**
- Solution: Vérifiez que @sparticuz/chromium est installé
- Vérifiez les logs pour voir l'erreur exacte

**3. "Authentication failed"**
- Solution: Vérifiez vos credentials APEC
- Les cookies peuvent être expirés, la prochaine sync va se reconnecter

**4. "Timeout approaching"**
- Normal: Le code s'arrête gracefully à 55s
- Les jobs partiellement scrapés sont quand même sauvegardés

---

## 🔄 Automatisation (Futur)

Pour automatiser les synchronisations, vous pouvez:

1. **Vercel Cron Jobs** (recommandé):
```json
// vercel.json
{
  "crons": [{
    "path": "/api/jobs/sync",
    "schedule": "0 */6 * * *"
  }]
}
```

2. **Webhook externe** (GitHub Actions, n8n, etc.):
```yaml
# .github/workflows/sync-apec.yml
on:
  schedule:
    - cron: '0 */6 * * *'
jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - name: Sync APEC
        run: |
          curl -X POST https://next-o4177rczz-erwan-henrys-projects.vercel.app/api/jobs/sync \
            -H "Authorization: Bearer ${{ secrets.ADMIN_TOKEN }}"
```

---

## 📝 Notes Importantes

- ⚠️ **Sécurité**: Ne commitez JAMAIS vos credentials APEC dans le code
- 🔐 **Cookies**: Les cookies sont chiffrés (AES-256) avant stockage dans KV
- ⏱️ **TTL**: Les cookies expirent après 24h et sont automatiquement renouvelés
- 🚀 **Performance**: La première sync prend ~30-40s (login + scraping), les suivantes ~10-15s (cookies restaurés)
- 📦 **Vercel KV**: Gratuit jusqu'à 256 MB de données

---

**Date de création**: 2025-10-25
**Version**: 1.0.0
