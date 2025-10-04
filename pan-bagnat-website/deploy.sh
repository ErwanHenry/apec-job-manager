#!/bin/bash

echo "🥪 Déploiement du site Pan Bagnat Niçois"
echo "========================================"

# Vérifier si nous sommes dans le bon répertoire
if [ ! -f "package.json" ]; then
    echo "❌ Erreur: package.json non trouvé. Veuillez exécuter ce script depuis le répertoire pan-bagnat-website"
    exit 1
fi

echo "📁 Répertoire de travail: $(pwd)"

# Initialiser Git si ce n'est pas déjà fait
if [ ! -d ".git" ]; then
    echo "🔧 Initialisation de Git..."
    git init
    echo "✅ Git initialisé"
else
    echo "✅ Repository Git déjà initialisé"
fi

# Ajouter tous les fichiers
echo "📋 Ajout des fichiers au staging..."
git add .

# Vérifier s'il y a des changements à commiter
if git diff --cached --quiet; then
    echo "ℹ️  Aucun changement à commiter"
else
    echo "💾 Création du commit initial..."
    git commit -m "🥪 Site Pan Bagnat Niçois - Version initiale complète

- Frontend complet avec design méditerranéen
- Calendrier d'événements interactif  
- Blog avec interface WYSIWYG
- Chatbot intelligent intégré
- Configuration Claude Flow pour multi-agents
- Prêt pour déploiement Vercel"
    echo "✅ Commit créé"
fi

# Ajouter le remote GitHub
echo "🔗 Configuration du remote GitHub..."
git remote remove origin 2>/dev/null || true
git remote add origin git@github.com:ErwanHenry/pan-bagnat-website.git
echo "✅ Remote GitHub configuré"

# Renommer la branche principale
echo "🌿 Configuration de la branche main..."
git branch -M main

# Pousser vers GitHub
echo "🚀 Push vers GitHub..."
git push -u origin main
if [ $? -eq 0 ]; then
    echo "✅ Code poussé vers GitHub avec succès!"
else
    echo "⚠️  Erreur lors du push. Vérifiez vos clés SSH GitHub."
    echo "💡 Vous pouvez pousser manuellement avec: git push -u origin main"
fi

echo ""
echo "🎯 Prochaines étapes pour Vercel:"
echo "================================"
echo "1. Allez sur https://vercel.com"
echo "2. Connectez-vous avec votre compte GitHub"
echo "3. Cliquez 'New Project'"
echo "4. Sélectionnez 'ErwanHenry/pan-bagnat-website'"
echo "5. Vercel détectera automatiquement Next.js"
echo "6. Cliquez 'Deploy'"
echo ""
echo "🌐 URL finale: https://pan-bagnat-website.vercel.app"
echo ""
echo "✨ Votre site Pan Bagnat Niçois sera en ligne en quelques minutes!"