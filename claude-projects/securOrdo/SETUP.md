# 🚀 Quick Start Guide - MUSIC Project

## Démarrage en 5 minutes

### Prérequis
- Node.js 18+ (Recommandé: 20 LTS)
- npm ou yarn

### Installation

```bash
# 1. Entrer dans le projet
cd /Users/erwanhenry/claude-projects/securOrdo

# 2. (Optionnel) Réinstaller les dépendances
npm install

# 3. Démarrer le serveur développement
npm run dev
```

Accédez à http://localhost:3000

## 📝 Comprendre la structure

```
src/
├── app/            # Pages Next.js
├── components/     # Composants React (à venir)
├── lib/            # Utilitaires et logique
└── types/          # Types TypeScript
```

## 🔄 Git Workflow

```bash
# Créer une feature
git checkout develop
git pull origin develop
git checkout -b feature/ma-feature
git add .
git commit -m "feat(scope): description"
git push origin feature/ma-feature

# → Créer PR sur GitHub
```

## 📚 Documentation importante

1. **README.md** - Vue d'ensemble complet
2. **GIT_FLOW.md** - Comment contribuer
3. **HEXAGONAL_ARCHITECTURE.md** - Architecture technique
4. **PROJECT_INITIALIZATION.md** - État du projet

## 🧪 Build & Tests

```bash
npm run build         # Build production
npm run lint          # ESLint check
npm run type-check    # TypeScript validation
npm run test          # Jest tests (coming soon)
```

## 📊 Architecture

Le projet utilise l'**Architecture Hexagonale** (Ports & Adapters):
- **Domain Layer**: Logique métier (100% testable)
- **Application Layer**: Use cases et orchestration
- **Infrastructure Layer**: Adaptateurs (DB, API, etc.)

Voir `HEXAGONAL_ARCHITECTURE.md` pour détails.

## 🔐 Variables d'environnement

```bash
# Créer un fichier .env.local (jamais committer)
cp .env.example .env.local

# Éditer avec vos valeurs
```

**Ne jamais committer** `.env.local` ou crypto keys!

## 💡 Tips

### Linter automatiquement avant commit
```bash
npm run lint:fix
```

### Vérifier les types TypeScript
```bash
npm run type-check
```

### Explorer la structure
```bash
tree -L 3 -I 'node_modules'
```

## 🚨 Problèmes courants

### "Module not found"
```bash
npm install
```

### "Port 3000 already in use"
```bash
# Trouver le processus
lsof -i :3000
# Tuer le processus
kill -9 <PID>
```

### TypeScript errors
```bash
npm run type-check
```

## 🎯 Prochaines étapes

1. **Lire la doc architecture** → `HEXAGONAL_ARCHITECTURE.md`
2. **Comprendre le Git Flow** → `GIT_FLOW.md`
3. **Attendre Sprint 2** → Database setup
4. **Rester actif** → Proposer des PRs!

## 📞 Questions?

- Consulter la documentation
- Lire les fichiers MDextant
- Créer une issue si blocker

---

**Prêt à développer?** 🚀

```bash
npm run dev
```

Bienvenue dans le projet MUSIC!
