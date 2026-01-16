# MUSIC - Medical Universal Secure Identification Code

Sécurisation d'ordonnances médicales par QR codes chiffrés autoporteurs.

## 🎯 Vue d'ensemble

MUSIC est une application web permettant de générer et vérifier des ordonnances médicales sécurisées via QR codes chiffrés autoporteurs. Le système garantit l'intégrité, la confidentialité et la traçabilité des ordonnances tout en respectant la réglementation française (INS, RPPS, BDPM, RGPD).

## ✨ Caractéristiques MVP

- **🔐 Cryptographie avancée**
  - Signature ECDSA P-256 des ordonnances
  - Chiffrement hybride ECIES avec AES-256-GCM
  - Nonces anti-rejeu (256 bits)
  - Sérialisation CBOR optimisée

- **💊 Interfaces métier**
  - **Prescripteur**: Création ordonnances, sélection patients et médicaments, génération QR
  - **Pharmacien**: Scan QR, vérification signature, enregistrement délivrance, historique
  - **Admin**: Dashboard métriques, gestion alertes anti-fraude

- **🚨 Anti-fraude**
  - Détection doctor shopping (3+ prescripteurs / médicament / 30 jours)
  - Détection rejeu d'ordonnance (nonce déjà utilisé)
  - Alertes automatiques avec sévérités
  - Investigation et résolution alertes

- **📋 Conformité**
  - Validation INS (NIR/NIA avec clé modulo 97)
  - Validation RPPS (11 chiffres)
  - Codes CIS BDPM (base ANSM)
  - Audit trail complet (qui, quoi, quand, où)
  - RGPD-compliant (consentement, droit accès, droit oubli)

## 🏗️ Architecture

```
Frontend (Next.js 14 + React 18 + TypeScript)
    ↓
Crypto Layer (@noble/curves, @noble/hashes, CBOR)
    ↓
API Backend (Hono)
    ↓
Database (PostgreSQL + Drizzle ORM)
    ↓
Redis (Nonces, Sessions)
```

## 🛠️ Stack technique

| Couche | Technology |
|--------|-----------|
| **Frontend** | Next.js 14, React 18, TypeScript |
| **UI Components** | Radix UI, Tailwind CSS, Lucide Icons |
| **Forms** | React Hook Form, Zod |
| **Cryptographie** | @noble/curves, @noble/hashes |
| **QR Code** | qrcode, html5-qrcode |
| **Backend** | Hono |
| **Database** | PostgreSQL, Drizzle ORM |
| **Authentication** | Next.js Auth (Phase 2: Pro Santé Connect) |
| **State Management** | Zustand |
| **Testing** | Jest, Playwright |

## 🚀 Démarrage rapide

### Prérequis

- Node.js 18+ (Recommandé: 20 LTS)
- npm ou yarn
- PostgreSQL 14+
- Redis (optionnel, pour caching)

### Installation

```bash
# 1. Cloner le repo
git clone <repo-url>
cd securOrdo

# 2. Installer les dépendances
npm install

# 3. Configuration environnement
cp .env.example .env.local
# Éditer .env.local avec vos identifiants PostgreSQL

# 4. Initialiser la base de données
npm run db:push

# 5. Seeder données de test
npm run db:seed

# 6. Générer clés de test
npm run keys:generate

# 7. Démarrer le serveur développement
npm run dev
```

L'application est accessible sur `http://localhost:3000`.

## 📝 Scripts disponibles

```bash
# Développement
npm run dev                 # Démarrer serveur développement
npm run build              # Build production
npm run start              # Démarrer serveur production

# Base de données
npm run db:generate        # Générer migrations Drizzle
npm run db:migrate         # Appliquer migrations
npm run db:push            # Push schema direct (dev)
npm run db:studio          # UI Drizzle Studio

# Crypto & Données
npm run keys:generate      # Générer paires de clés test
npm run bdpm:import        # Importer base BDPM
npm run db:seed            # Seeder données test

# Qualité code
npm run lint               # ESLint check
npm run type-check         # TypeScript check
npm run test               # Jest tests
npm run test:watch         # Jest watch mode
```

## 🔑 Identifiants de test

Après `npm run db:seed`, les identifiants suivants sont disponibles:

### Prescripteur
- **Email**: doctor@example.com
- **Password**: test123456
- **RPPS**: 12345678901

### Pharmacien
- **Email**: pharmacist@example.com
- **Password**: test123456
- **ADELI**: 123456789

### Admin
- **Email**: admin@example.com
- **Password**: test123456

**⚠️ IMPORTANT**: Ne jamais utiliser en production. Générer clés et identifiants sécurisés.

## 📚 Documentation

- [`docs/API.md`](./docs/API.md) - Endpoints API complets
- [`docs/CRYPTO.md`](./docs/CRYPTO.md) - Architecture cryptographique
- [`docs/SECURITY.md`](./docs/SECURITY.md) - Modèle menace et mesures de sécurité
- [`docs/DEPLOYMENT.md`](./docs/DEPLOYMENT.md) - Guide déploiement production

## 🧪 Testing

```bash
# Tests unitaires
npm run test

# Tests avec couverture
npm run test:coverage

# Tests E2E
npx playwright test

# Vérification santé système
npm run health
```

## 🔐 Sécurité

### Algorithmes cryptographiques

- **Signature**: ECDSA P-256 (secp256r1), SHA-256
- **Chiffrement**: ECIES hybrid (ECDH + HKDF + AES-256-GCM)
- **Nonces**: CSPRNG 256-bit, vérification anti-rejeu
- **Encoding**: Base45 (RFC 9285), CBOR (RFC 8949)

### Mesures implémentées

- Chiffrement end-to-end (client + serveur)
- Rate limiting (API endpoints)
- HTTPS TLS 1.3+ obligatoire
- CSRF protection
- Input validation (Zod schemas)
- Audit trail complet
- Nettoyage données sensibles

### Conformité

- ✅ RGPD (consentement, droit accès, droit oubli)
- ✅ CNIL (recommandations sécurité)
- ✅ ANSSI (niveau 2)
- 🔄 HDS (hébergement certifié - phase pré-production)
- 🔄 eIDAS (conformité signaturees électroniques - phase 2)

## 🗂️ Structure projet

```
securOrdo/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/            # Routes authentification
│   │   ├── (prescriber)/       # Module prescripteur
│   │   ├── (pharmacist)/       # Module pharmacien
│   │   ├── (admin)/            # Module admin
│   │   ├── api/                # API Routes
│   │   └── layout.tsx
│   ├── components/             # Composants React
│   │   ├── prescriptions/      # Composants prescription
│   │   ├── pharmacy/           # Composants pharmacien
│   │   ├── fraud/              # Composants anti-fraude
│   │   └── shared/             # Composants partagés
│   ├── lib/
│   │   ├── crypto/             # Cryptographie
│   │   ├── db/                 # Database (Drizzle)
│   │   ├── validators/         # Schémas Zod
│   │   ├── services/           # Business logic
│   │   └── utils.ts
│   └── types/                  # Types TypeScript
├── docs/                       # Documentation
├── scripts/                    # Scripts utilitaires
├── tests/                      # Suites de tests
└── public/                     # Assets statiques
```

## 🎯 Roadmap

### Phase 1 (MVP - En cours)
- [x] Infrastructure (Next.js, Drizzle, Tailwind)
- [x] Cryptographie (ECDSA + ECIES)
- [x] Base de données (schéma complet)
- [ ] Interfaces (prescripteur, pharmacien)
- [ ] API Backend (Hono endpoints)
- [ ] Anti-fraude (doctor shopping)
- [ ] Tests & Documentation

### Phase 2 (Authentification forte)
- [ ] Pro Santé Connect (OIDC)
- [ ] CPS/e-CPS (signature certificat)
- [ ] 2FA (TOTP)

### Phase 3 (Fonctionnalités avancées)
- [ ] Ordonnances ALD bi-zone
- [ ] Médicaments stupéfiants
- [ ] Renouvellements automatiques
- [ ] Historique médicamenteux

### Phase 4 (Intégrations)
- [ ] LGO (API officines)
- [ ] SESAM-Vitale (facturation)
- [ ] DMP/DMPx (Dossier médical)

### Phase 5+ (Mobile, Analytics, Certifications)
- [ ] App mobile (React Native)
- [ ] Analytics & Predictions (ML)
- [ ] Certification ISO 27001
- [ ] Audit pénétration

## 👥 Contribution

Les contributions sont bienvenues! Veuillez:

1. Forker le repo
2. Créer une branche (`git checkout -b feature/AmazingFeature`)
3. Commit vos changements (`git commit -m 'Add AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📄 License

MIT License - voir [`LICENSE`](./LICENSE) pour détails.

## 📞 Support

Pour questions, bugs, ou suggestions:
- 📧 Email: contact@music-health.fr
- 🐛 Issues: https://github.com/yourrepo/issues
- 💬 Discussions: https://github.com/yourrepo/discussions

## 🙏 Remerciements

- ANSM (Base de Données Publique des Médicaments)
- CNAM (Caisse Nationale de l'Assurance Maladie)
- Ministère de la Santé (e-prescription)
- Communauté @noble/crypto pour les libs exceptionnelles

---

**⚠️ AVIS LEGAL**: MUSIC est fourni à titre informatif. En production, une certification HDS et un audit sécurité externe sont obligatoires. Consultez un expert légal pour conformité réglementaire.

**Démarrage du projet**: 15 Janvier 2026
