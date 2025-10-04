# 🚀 Instructions de Déploiement - Pan Bagnat Niçois

## Méthode 1: Script Automatique (Recommandé)

Exécutez simplement cette commande dans le Terminal :

```bash
cd /Users/erwanhenry/pan-bagnat-website
chmod +x auto-deploy.sh
./auto-deploy.sh
```

Le script va automatiquement :
- ✅ Vérifier les prérequis (Git, Node.js, npm)
- ✅ Installer les dépendances
- ✅ Builder le projet
- ✅ Configurer Git
- ✅ Faire le commit et push vers GitHub
- ✅ Installer et configurer Vercel CLI
- ✅ Déployer sur Vercel

## Méthode 2: Étapes Manuelles

Si vous préférez contrôler chaque étape :

### 1. Installation et Build
```bash
cd /Users/erwanhenry/pan-bagnat-website
npm install
npm run build
```

### 2. Configuration Git
```bash
git init
git add .
git commit -m "🥪 Site Pan Bagnat Niçois - Version initiale"
git remote add origin git@github.com:ErwanHenry/pan-bagnat-website.git
git branch -M main
git push -u origin main
```

### 3. Déploiement Vercel
```bash
npm install -g vercel
vercel login
vercel --prod
```

## Prérequis

Assurez-vous d'avoir :
- [ ] **Git** installé et configuré
- [ ] **Node.js** (version 18+)
- [ ] **npm** ou **yarn**
- [ ] **Clés SSH GitHub** configurées
- [ ] **Compte Vercel** (gratuit)

## Vérification des Clés SSH GitHub

Si vous avez des problèmes avec GitHub :

```bash
# Tester la connexion SSH
ssh -T git@github.com

# Si ça ne marche pas, générer une nouvelle clé
ssh-keygen -t ed25519 -C "votre-email@exemple.com"
cat ~/.ssh/id_ed25519.pub
```

Puis ajoutez la clé publique dans GitHub Settings > SSH and GPG keys.

## Résultats Attendus

Une fois déployé, vous aurez :

### 🌐 URLs
- **Site principal :** https://pan-bagnat-website.vercel.app
- **GitHub :** https://github.com/ErwanHenry/pan-bagnat-website
- **Admin :** https://pan-bagnat-website.vercel.app/admin

### ✨ Fonctionnalités Actives
- Page d'accueil avec hero et sections
- Section Tradition (histoire, recette)
- Calendrier d'événements interactif
- Blog avec système de catégories
- Interface admin avec éditeur WYSIWYG
- Chatbot intelligent
- Page de contact avec formulaire
- Design responsive complet

### 🎨 Design
- Thème méditerranéen authentique
- Couleurs : Bleu Nice (#0066CC), Jaune Nice (#FFD700)
- Typography : Inter + Georgia
- Responsive mobile/desktop

## Dépannage

### Erreur Git Push
```bash
# Reconfigurer le remote
git remote set-url origin git@github.com:ErwanHenry/pan-bagnat-website.git
git push -u origin main --force
```

### Erreur Vercel Build
```bash
# Nettoyer et rebuilder
rm -rf .next node_modules
npm install
npm run build
vercel --prod
```

### Erreur de Permissions
```bash
# Donner les permissions au script
chmod +x auto-deploy.sh
```

## Support

Si vous rencontrez des problèmes :
1. Vérifiez que toutes les dépendances sont installées
2. Assurez-vous que vos clés SSH GitHub fonctionnent
3. Vérifiez que vous êtes connecté à Vercel
4. Consultez les logs d'erreur pour plus de détails

---

**Temps estimé :** 5-10 minutes pour un déploiement complet 🚀