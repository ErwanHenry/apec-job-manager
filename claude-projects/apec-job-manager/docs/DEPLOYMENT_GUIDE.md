# Guide de déploiement - APEC Job Manager

Guide complet pour déployer APEC Job Manager en production.

## Options de déploiement

1. **VPS/Serveur dédié** (recommandé pour production)
2. **Docker** (portabilité maximale)
3. **Vercel** (dashboard uniquement - frontend statique)
4. **Heroku** (backend + base de données)

---

## Déploiement sur VPS (Ubuntu 22.04)

### 1. Prérequis serveur

```bash
# Mise à jour système
sudo apt update && sudo apt upgrade -y

# Installation Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Installation PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Installation Nginx (reverse proxy)
sudo apt install -y nginx

# Installation PM2 (process manager)
sudo npm install -g pm2
```

### 2. Configuration PostgreSQL

```bash
# Se connecter à PostgreSQL
sudo -u postgres psql

# Créer base de données et utilisateur
CREATE DATABASE apec_job_manager;
CREATE USER apec_user WITH ENCRYPTED PASSWORD 'votre_mot_de_passe_fort';
GRANT ALL PRIVILEGES ON DATABASE apec_job_manager TO apec_user;
\q
```

### 3. Déploiement de l'application

```bash
# Cloner le repo (ou uploader via FTP/SFTP)
cd /var/www
git clone https://github.com/votre-repo/apec-job-manager.git
cd apec-job-manager

# Installer dépendances
npm install --production

# Dashboard
cd dashboard
npm install
npm run build
cd ..

# Configurer .env
nano .env
```

Exemple `.env` production:
```env
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://apec_user:votre_mot_de_passe@localhost:5432/apec_job_manager

APEC_EMAIL=votre.email@entreprise.fr
APEC_PASSWORD=votre_mot_de_passe_apec

JWT_SECRET=generez_une_cle_secrete_longue_et_aleatoire
AUTO_SYNC_ENABLED=true
AUTO_SYNC_CRON=0 */6 * * *

LOG_LEVEL=info
```

```bash
# Générer JWT secret fort
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

```bash
# Migration base de données
npx prisma migrate deploy
npx prisma generate
```

### 4. Configuration PM2

```bash
# Créer fichier ecosystem
nano ecosystem.config.js
```

```javascript
module.exports = {
  apps: [{
    name: 'apec-job-manager',
    script: 'src/server.js',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    merge_logs: true,
    autorestart: true,
    max_memory_restart: '1G',
    watch: false
  }]
}
```

```bash
# Lancer l'application
pm2 start ecosystem.config.js

# Vérifier le statut
pm2 status

# Logs en temps réel
pm2 logs apec-job-manager

# Sauvegarder config PM2
pm2 save

# Démarrage automatique au boot
pm2 startup
# Suivre les instructions affichées
```

### 5. Configuration Nginx

```bash
sudo nano /etc/nginx/sites-available/apec-job-manager
```

```nginx
# Backend API
server {
    listen 80;
    server_name api.votredomaine.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# Dashboard frontend
server {
    listen 80;
    server_name dashboard.votredomaine.com;

    root /var/www/apec-job-manager/dashboard/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache des assets statiques
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

```bash
# Activer la configuration
sudo ln -s /etc/nginx/sites-available/apec-job-manager /etc/nginx/sites-enabled/

# Tester la config
sudo nginx -t

# Redémarrer Nginx
sudo systemctl restart nginx
```

### 6. SSL/HTTPS avec Certbot (Let's Encrypt)

```bash
# Installation Certbot
sudo apt install -y certbot python3-certbot-nginx

# Générer certificats SSL
sudo certbot --nginx -d api.votredomaine.com -d dashboard.votredomaine.com

# Renouvellement automatique (testé)
sudo certbot renew --dry-run
```

### 7. Monitoring et maintenance

```bash
# Voir les logs
pm2 logs apec-job-manager --lines 100

# Redémarrer l'app
pm2 restart apec-job-manager

# Monitorer les ressources
pm2 monit

# Backup base de données (cron quotidien)
crontab -e
# Ajouter:
0 2 * * * pg_dump -U apec_user apec_job_manager > /backup/apec_$(date +\%Y\%m\%d).sql
```

---

## Déploiement avec Docker

### 1. Créer Dockerfile

```bash
nano Dockerfile
```

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build dashboard
WORKDIR /app/dashboard
RUN npm ci && npm run build

WORKDIR /app

EXPOSE 3000

CMD ["node", "src/server.js"]
```

### 2. Docker Compose

```bash
nano docker-compose.yml
```

```yaml
version: '3.8'

services:
  app:
    build: .
    container_name: apec-job-manager
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://postgres:password@db:5432/apec_job_manager
    env_file:
      - .env
    depends_on:
      - db
    volumes:
      - ./logs:/app/logs
      - ./exports:/app/exports

  db:
    image: postgres:14-alpine
    container_name: apec-postgres
    restart: unless-stopped
    environment:
      - POSTGRES_DB=apec_job_manager
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  nginx:
    image: nginx:alpine
    container_name: apec-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/conf.d/default.conf
      - ./dashboard/dist:/usr/share/nginx/html
      - ./certs:/etc/nginx/certs
    depends_on:
      - app

volumes:
  postgres_data:
```

### 3. Commandes Docker

```bash
# Build et lancer
docker-compose up -d

# Voir les logs
docker-compose logs -f app

# Redémarrer
docker-compose restart app

# Arrêter
docker-compose down

# Backup base de données
docker exec apec-postgres pg_dump -U postgres apec_job_manager > backup.sql
```

---

## Déploiement Vercel (Dashboard uniquement)

```bash
cd dashboard

# Installer Vercel CLI
npm i -g vercel

# Login
vercel login

# Déployer
vercel --prod
```

Configuration `vercel.json`:
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "env": {
    "VITE_API_URL": "https://api.votredomaine.com"
  }
}
```

---

## Déploiement Heroku (Backend)

```bash
# Login Heroku
heroku login

# Créer app
heroku create apec-job-manager

# Ajouter PostgreSQL
heroku addons:create heroku-postgresql:hobby-dev

# Configuration
heroku config:set NODE_ENV=production
heroku config:set APEC_EMAIL=votre.email@entreprise.fr
heroku config:set APEC_PASSWORD=votre_password
heroku config:set JWT_SECRET=votre_secret

# Déployer
git push heroku main

# Migrations
heroku run npx prisma migrate deploy

# Logs
heroku logs --tail
```

---

## Checklist de déploiement

### Avant le déploiement

- [ ] Tester en local en mode production (`NODE_ENV=production`)
- [ ] Vérifier toutes les variables d'environnement
- [ ] Générer un JWT_SECRET fort
- [ ] Tester les migrations Prisma
- [ ] Créer backups de la base de données
- [ ] Configurer le firewall (UFW sur Ubuntu)

### Après le déploiement

- [ ] Vérifier l'API health check: `curl https://api.votredomaine.com/api/health`
- [ ] Tester la connexion APEC
- [ ] Tester une création/mise à jour/suppression d'annonce
- [ ] Vérifier la synchronisation automatique (cron)
- [ ] Tester la génération de rapports
- [ ] Configurer les backups automatiques
- [ ] Installer un monitoring (Uptime Robot, DataDog, etc.)
- [ ] Configurer les alertes email
- [ ] Documenter les procédures de rollback

### Sécurité

- [ ] SSL/HTTPS activé (Certbot/Let's Encrypt)
- [ ] Firewall configuré (ports 80, 443, 22 uniquement)
- [ ] Mots de passe forts partout
- [ ] Rate limiting activé
- [ ] Headers de sécurité (Helmet)
- [ ] Logs d'audit actifs
- [ ] Mises à jour système automatiques (`unattended-upgrades`)

---

## Maintenance

### Mise à jour de l'application

```bash
# Pull dernières modifications
git pull origin main

# Installer nouvelles dépendances
npm install --production

# Migrations si nécessaire
npx prisma migrate deploy

# Rebuild dashboard
cd dashboard
npm run build
cd ..

# Redémarrer avec PM2
pm2 restart apec-job-manager
```

### Monitoring

Outils recommandés:
- **PM2 Plus** - Monitoring Node.js en temps réel
- **Uptime Robot** - Surveillance de disponibilité
- **Sentry** - Tracking d'erreurs
- **LogRocket** - Session replay
- **Grafana + Prometheus** - Métriques avancées

---

## Support

En cas de problème lors du déploiement, vérifier:
1. Les logs de l'application: `pm2 logs` ou `docker-compose logs`
2. Les logs Nginx: `sudo tail -f /var/log/nginx/error.log`
3. Les logs PostgreSQL: `sudo tail -f /var/log/postgresql/postgresql-14-main.log`
4. La configuration `.env` (identifiants corrects?)
5. Les migrations Prisma (base à jour?)

---

**Bonne chance pour votre déploiement! 🚀**
