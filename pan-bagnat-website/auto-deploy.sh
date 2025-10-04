#!/bin/bash

# Script de déploiement automatique Pan Bagnat Niçois
# Exécuter avec: ./auto-deploy.sh

set -e  # Arrêter en cas d'erreur

echo "🥪 DÉPLOIEMENT AUTOMATIQUE PAN BAGNAT NIÇOIS"
echo "=============================================="
echo ""

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction pour afficher les messages colorés
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Vérifier les prérequis
print_status "Vérification des prérequis..."

# Vérifier Git
if ! command -v git &> /dev/null; then
    print_error "Git n'est pas installé. Installez Git d'abord."
    exit 1
fi

# Vérifier Node.js
if ! command -v node &> /dev/null; then
    print_error "Node.js n'est pas installé. Installez Node.js d'abord."
    exit 1
fi

# Vérifier npm
if ! command -v npm &> /dev/null; then
    print_error "npm n'est pas installé. Installez npm d'abord."
    exit 1
fi

print_success "Tous les prérequis sont installés ✅"
echo ""

# Vérifier le répertoire
if [ ! -f "package.json" ]; then
    print_error "package.json non trouvé. Exécutez ce script depuis le répertoire pan-bagnat-website"
    exit 1
fi

print_status "Répertoire de travail: $(pwd)"
echo ""

# Installation des dépendances
print_status "Installation des dépendances..."
npm install
print_success "Dépendances installées ✅"
echo ""

# Build du projet pour vérifier qu'il n'y a pas d'erreurs
print_status "Build du projet (vérification)..."
npm run build
print_success "Build réussi ✅"
echo ""

# Configuration Git
print_status "Configuration Git..."

# Initialiser Git si nécessaire
if [ ! -d ".git" ]; then
    git init
    print_success "Repository Git initialisé ✅"
else
    print_success "Repository Git déjà présent ✅"
fi

# Configuration utilisateur Git (si pas déjà configuré)
if [ -z "$(git config user.name)" ]; then
    print_warning "Configuration utilisateur Git manquante"
    read -p "Entrez votre nom Git: " git_name
    git config user.name "$git_name"
fi

if [ -z "$(git config user.email)" ]; then
    print_warning "Configuration email Git manquante"
    read -p "Entrez votre email Git: " git_email
    git config user.email "$git_email"
fi

print_success "Configuration Git OK ✅"
echo ""

# Ajout des fichiers
print_status "Ajout des fichiers..."
git add .

# Commit
if git diff --cached --quiet; then
    print_warning "Aucun changement à commiter"
else
    print_status "Création du commit..."
    git commit -m "🥪 Site Pan Bagnat Niçois - Déploiement automatique

✨ Fonctionnalités:
- Frontend complet avec design méditerranéen authentique
- Calendrier d'événements interactif avec filtres
- Blog avec interface WYSIWYG pour l'administration
- Chatbot intelligent avec base de connaissances
- Configuration Claude Flow pour orchestration multi-agents
- Design responsive optimisé mobile/desktop
- Intégration Vercel prête pour déploiement

🎯 Stack technique:
- Next.js 14 + TypeScript
- Tailwind CSS avec thème personnalisé
- React Quill pour l'édition
- Lucide React pour les icônes
- Configuration Vercel optimisée"
    
    print_success "Commit créé ✅"
fi
echo ""

# Configuration du remote GitHub
print_status "Configuration du remote GitHub..."
git remote remove origin 2>/dev/null || true
git remote add origin git@github.com:ErwanHenry/pan-bagnat-website.git
git branch -M main
print_success "Remote GitHub configuré ✅"
echo ""

# Push vers GitHub
print_status "Push vers GitHub..."
echo ""
print_warning "⚠️  ATTENTION: Assurez-vous que vos clés SSH GitHub sont configurées"
echo ""
read -p "Appuyez sur Entrée pour continuer avec le push vers GitHub..."

if git push -u origin main; then
    print_success "✅ Code poussé vers GitHub avec succès!"
    echo ""
    echo "🌐 Repository GitHub: https://github.com/ErwanHenry/pan-bagnat-website"
else
    print_error "❌ Erreur lors du push GitHub"
    print_warning "Vérifiez vos clés SSH avec: ssh -T git@github.com"
    echo ""
    echo "Pour configurer les clés SSH GitHub:"
    echo "1. ssh-keygen -t ed25519 -C \"votre-email@exemple.com\""
    echo "2. cat ~/.ssh/id_ed25519.pub"
    echo "3. Ajoutez la clé publique dans GitHub Settings > SSH Keys"
    echo ""
    read -p "Voulez-vous continuer sans GitHub push ? (y/N): " continue_without_github
    if [[ ! $continue_without_github =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Déploiement Vercel
echo ""
print_status "🚀 DÉPLOIEMENT VERCEL"
echo "===================="

# Vérifier si Vercel CLI est installé
if ! command -v vercel &> /dev/null; then
    print_warning "Vercel CLI non installé. Installation..."
    npm install -g vercel
    print_success "Vercel CLI installé ✅"
fi

# Login Vercel
print_status "Connexion à Vercel..."
print_warning "⚠️  Une page web va s'ouvrir pour l'authentification Vercel"
echo ""
read -p "Appuyez sur Entrée pour ouvrir l'authentification Vercel..."

vercel login

# Déploiement
print_status "Déploiement en production..."
vercel --prod --yes

print_success "🎉 DÉPLOIEMENT TERMINÉ AVEC SUCCÈS!"
echo ""
echo "════════════════════════════════════════"
echo "🥪 SITE PAN BAGNAT NIÇOIS DÉPLOYÉ"
echo "════════════════════════════════════════"
echo ""
echo "📍 Liens importants:"
echo "   • GitHub: https://github.com/ErwanHenry/pan-bagnat-website"
echo "   • Site web: https://pan-bagnat-website.vercel.app"
echo "   • Dashboard Vercel: https://vercel.com/dashboard"
echo ""
echo "✨ Fonctionnalités déployées:"
echo "   ✅ Page d'accueil avec hero attractif"
echo "   ✅ Section Tradition (histoire, recette)"
echo "   ✅ Calendrier d'événements interactif"
echo "   ✅ Blog avec catégories"
echo "   ✅ Interface admin avec éditeur WYSIWYG"
echo "   ✅ Chatbot intelligent"
echo "   ✅ Page de contact avec formulaire"
echo "   ✅ Design responsive"
echo ""
echo "🎯 Prochaines étapes:"
echo "   • Testez votre site sur l'URL Vercel"
echo "   • Configurez un domaine personnalisé si souhaité"
echo "   • Ajoutez du contenu via l'interface admin (/admin)"
echo ""
echo "🚀 Votre site est maintenant en ligne!"