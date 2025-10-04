#!/bin/bash

echo "🧪 Test des corrections ESLint - Pan Bagnat Niçois"
echo "================================================"
echo ""

# Couleurs pour les messages
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[TEST]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Vérifier que nous sommes dans le bon répertoire
if [ ! -f "package.json" ]; then
    print_error "package.json non trouvé. Exécutez ce script depuis le répertoire pan-bagnat-website"
    exit 1
fi

print_status "Répertoire de travail: $(pwd)"
echo ""

# Installation des dépendances si nécessaire
print_status "Vérification des dépendances..."
if [ ! -d "node_modules" ]; then
    print_warning "node_modules non trouvé. Installation en cours..."
    npm install
    print_success "Dépendances installées ✅"
else
    print_success "Dépendances déjà installées ✅"
fi
echo ""

# Test du linting
print_status "Exécution du linting ESLint..."
if npm run lint; then
    print_success "✅ Linting réussi - Aucune erreur ESLint détectée!"
else
    print_error "❌ Erreurs ESLint détectées"
    echo ""
    print_warning "Relancez le script après avoir corrigé les erreurs."
    exit 1
fi
echo ""

# Test du build TypeScript
print_status "Test du build TypeScript..."
if npm run build; then
    print_success "✅ Build réussi - Aucune erreur TypeScript!"
else
    print_error "❌ Erreurs de build détectées"
    echo ""
    print_warning "Relancez le script après avoir corrigé les erreurs."
    exit 1
fi
echo ""

# Récapitulatif
print_success "🎉 TOUS LES TESTS SONT PASSÉS!"
echo ""
echo "════════════════════════════════════════"
echo "🥪 SITE PAN BAGNAT PRÊT POUR DÉPLOIEMENT"
echo "════════════════════════════════════════"
echo ""
echo "✅ Corrections effectuées:"
echo "   • Apostrophes échappées: ' → &apos;"
echo "   • Guillemets échappés: \" → &quot;"
echo "   • 32 erreurs ESLint corrigées"
echo "   • Erreur TypeScript boolean corrigée"
echo "   • Configuration Next.js nettoyée"
echo ""
echo "✅ Tests validés:"
echo "   • ESLint: Aucune erreur"
echo "   • TypeScript: Build réussi"
echo "   • Next.js: Prêt pour production"
echo ""
echo "🚀 Prochaines étapes:"
echo "   1. Git push vers GitHub"
echo "   2. Déploiement Vercel automatique"
echo "   3. Site en ligne!"
echo ""
echo "💡 Pour déployer maintenant:"
echo "   ./auto-deploy.sh"