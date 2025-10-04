# Pan Bagnat Niçois - Site Web Officiel

Un site web dédié à la promotion des valeurs authentiques du Pan Bagnat Niçois, créé avec Next.js et configuré avec Claude Flow pour une gestion multi-agents.

## 🥪 À Propos

Ce site web célèbre et préserve la tradition du Pan Bagnat niçois, sandwich emblématique de Nice et de la Côte d'Azur. Il offre :

- **Tradition** : Histoire et techniques de préparation authentiques
- **Événements** : Calendrier des festivals, ateliers et dégustations
- **Blog** : Articles sur la culture et les secrets du Pan Bagnat
- **Chatbot** : Assistant interactif pour répondre aux questions
- **Interface Admin** : Gestion du contenu avec éditeur WYSIWYG

## 🚀 Technologies

- **Framework** : Next.js 14 avec TypeScript
- **Styling** : Tailwind CSS avec thème personnalisé
- **Éditeur** : React Quill pour l'interface WYSIWYG
- **Architecture** : Claude Flow pour l'orchestration multi-agents
- **Déploiement** : Vercel

## 🎨 Design

Le design s'inspire des couleurs méditerranéennes :
- **Bleu Nice** (#0066CC) - Couleur principale
- **Jaune Nice** (#FFD700) - Accents et CTA
- **Méditerranéen** (#4A90E2) - Dégradés
- **Olive** (#8FBC8F) - Éléments naturels

## 📁 Structure du Projet

```
pan-bagnat-website/
├── src/
│   ├── app/                    # Pages Next.js App Router
│   │   ├── page.tsx           # Page d'accueil
│   │   ├── tradition/         # Page tradition
│   │   ├── evenements/        # Calendrier événements
│   │   ├── blog/             # Blog et articles
│   │   ├── admin/            # Interface administration
│   │   └── contact/          # Page contact
│   └── components/            # Composants réutilisables
│       ├── Header.tsx        # Navigation principale
│       ├── Footer.tsx        # Pied de page
│       ├── Hero.tsx          # Section héro
│       └── Chatbot.tsx       # Assistant conversationnel
├── claude-flow-config.json    # Configuration agents Claude Flow
├── vercel.json               # Configuration déploiement
└── package.json              # Dépendances
```

## 🤖 Claude Flow Configuration

Le projet utilise Claude Flow pour orchestrer plusieurs agents spécialisés :

- **ContentCreator** : Gestion du contenu blog
- **EventManager** : Administration des événements
- **ChatbotOrchestrator** : Interactions utilisateur
- **QualityController** : Validation de l'authenticité culturelle
- **WebsiteOrchestrator** : Coordination générale

## 🛠️ Installation & Développement

```bash
# Installation des dépendances
npm install

# Lancement en développement
npm run dev

# Build de production
npm run build

# Lancement en production
npm start
```

## 📱 Fonctionnalités

### Frontend
- ✅ Design responsive adapté mobile/desktop
- ✅ Navigation intuitive avec menu burger
- ✅ Sections dédiées à la tradition et l'histoire
- ✅ Calendrier d'événements interactif
- ✅ Blog avec système de catégories
- ✅ Chatbot conversationnel intelligent
- ✅ Formulaire de contact complet

### Backend/Admin
- ✅ Interface d'administration sécurisée
- ✅ Éditeur WYSIWYG pour les articles
- ✅ Gestion des événements
- ✅ Système de tags et catégories
- ✅ Preview avant publication

### Chatbot
- ✅ Réponses contextualles sur le Pan Bagnat
- ✅ Base de connaissances authentiques
- ✅ Interface conversationnelle moderne
- ✅ Intégration harmonieuse au design

## 🌍 Déploiement

Le projet est configuré pour un déploiement automatique sur Vercel :

1. **Push sur GitHub** → Déploiement automatique
2. **Variables d'environnement** configurées via Vercel
3. **CDN global** pour performances optimales
4. **HTTPS automatique** et certificats SSL

### Configuration Vercel

```json
{
  "framework": "nextjs",
  "regions": ["cdg1"],
  "headers": [...],
  "redirects": [...],
  "rewrites": [...]
}
```

## 🔒 Sécurité

- Headers de sécurité configurés
- Protection XSS et CSRF
- Validation des données côté client/serveur
- Interface admin protégée

## 🎯 Objectifs du Projet

1. **Préservation culturelle** : Transmettre l'authenticité du Pan Bagnat niçois
2. **Engagement communautaire** : Créer une plateforme pour les passionnés
3. **Éducation** : Enseigner les traditions culinaires locales
4. **Événements** : Promouvoir les rencontres et ateliers

## 🚀 Prochaines Étapes

- [ ] Intégration système de réservation
- [ ] Module de newsletter automatisée
- [ ] Galerie photos événements
- [ ] API pour partenaires
- [ ] PWA (Progressive Web App)
- [ ] Multilingue (français/anglais)

## 🤝 Contribution

Ce projet célèbre le patrimoine culinaire niçois. Toute contribution respectant l'authenticité culturelle est bienvenue.

## 📞 Contact

Pour toute question sur ce projet ou le Pan Bagnat niçois :
- Email : contact@panbagnatnipois.com
- Site : [Pan Bagnat Niçois](https://pan-bagnat-nicois.vercel.app)

---

*Fait avec ❤️ pour préserver notre patrimoine culinaire niçois*