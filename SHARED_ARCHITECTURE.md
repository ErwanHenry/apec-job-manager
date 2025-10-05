# 🏗️ Shared Architecture - Graixl Ecosystem

## Overview

Le code de prospection a été refactoré en une **architecture partagée** basée sur les principes de l'**Architecture Hexagonale** (Ports & Adapters).

## Structure

```
/Users/erwanhenry/
├── shared/                           # Packages partagés
│   └── prospection-core/             # Core prospection abstractions
│       ├── package.json
│       ├── README.md
│       └── src/
│           ├── index.js              # Export principal
│           ├── ports/                # Interfaces (contrats)
│           │   └── ILinkedInScraperPort.js
│           ├── entities/             # Entités métier
│           │   └── Prospect.js
│           └── types/                # Définitions de types
│
├── graixl-public/                    # Projet AI Ecosystem
│   ├── package.json                  # Dépendance: @graixl/prospection-core
│   ├── src/
│   │   ├── core/
│   │   │   └── ports/               # Ports étendus (graixl-specific)
│   │   └── adapters/                # Implémentations
│   │       └── ClaudeFlowProspectionAdapter.js
│   └── ...
│
├── prospection-system/               # Projet LinkedIn CRM
│   ├── package.json                  # Dépendance: @graixl/prospection-core
│   ├── backend/
│   │   └── services/                # Implémentations
│   │       ├── ApolloLinkedInAdapter.js (à créer)
│   │       ├── linkedinApollo.js
│   │       └── googleSheets.js
│   ├── api/                         # API REST moderne
│   │   ├── campaigns.js
│   │   ├── prospects.js
│   │   └── messages.js
│   └── ...
│
├── olive-tree-ecommerce/
├── pan-bagnat-website/
└── business-plan/
```

## Principes de l'Architecture Hexagonale

### 1. **Ports (Interfaces)**

Les **ports** sont des **interfaces** qui définissent le contrat entre le domaine métier et le monde extérieur.

```javascript
// shared/prospection-core/src/ports/ILinkedInScraperPort.js

class ILinkedInScraperPort {
  async searchProspects(criteria, options) {
    throw new Error('Must be implemented')
  }

  async extractProfile(profileUrl, options) {
    throw new Error('Must be implemented')
  }

  // ... autres méthodes
}
```

### 2. **Adapters (Implémentations)**

Les **adapters** sont des **implémentations concrètes** des ports.

```javascript
// prospection-system/backend/services/ApolloLinkedInAdapter.js

const { ILinkedInScraperPort } = require('@graixl/prospection-core');

class ApolloLinkedInAdapter extends ILinkedInScraperPort {
  async searchProspects(criteria, options) {
    // Implémentation avec Apollo.io API
    const response = await fetch('https://api.apollo.io/v1/mixed_people/search', {
      // ... API call
    });

    return {
      success: true,
      profiles: response.people,
      total: response.pagination.total
    };
  }

  // ... implémentations des autres méthodes
}
```

### 3. **Entities (Entités Métier)**

Les **entités** sont des objets métier riches avec logique embarquée.

```javascript
// shared/prospection-core/src/entities/Prospect.js

class Prospect {
  constructor(data) {
    this.firstName = data.firstName;
    this.email = data.email;
    // ...
  }

  // Logique métier
  calculateQualityScore() {
    let score = 0;
    if (this.email) score += 20;
    if (this.emailVerified) score += 10;
    // ... calculs
    return score;
  }

  isDecisionMaker() {
    const decisionMakerTitles = ['ceo', 'cto', 'cfo'];
    return decisionMakerTitles.some(title =>
      this.jobTitle?.toLowerCase().includes(title)
    );
  }
}
```

## Utilisation

### Dans graixl-public

```javascript
// src/adapters/ClaudeFlowProspectionAdapter.js

const { ILinkedInScraperPort, Prospect } = require('@graixl/prospection-core');

class ClaudeFlowProspectionAdapter extends ILinkedInScraperPort {
  async searchProspects(criteria, options) {
    // Utilisation de l'équipe d'agents AI
    const result = await this.teamSimulation.executeTeamWorkflow(
      'intelligent_prospection',
      criteria
    );

    // Transformation en entités Prospect
    const prospects = result.prospects.map(p =>
      Prospect.fromLinkedInProfile(p)
    );

    return { success: true, prospects };
  }
}
```

### Dans prospection-system

```javascript
// backend/services/ApolloLinkedInAdapter.js

const { ILinkedInScraperPort, Prospect } = require('@graixl/prospection-core');

class ApolloLinkedInAdapter extends ILinkedInScraperPort {
  async searchProspects(criteria, options) {
    // Appel à l'API Apollo
    const response = await this.apolloClient.search({
      q_organization_domains: criteria.companies,
      person_titles: criteria.jobTitles,
      // ...
    });

    // Transformation en entités Prospect
    const prospects = response.people.map(person =>
      Prospect.fromLinkedInProfile({
        firstName: person.first_name,
        lastName: person.last_name,
        company: person.organization_name,
        jobTitle: person.title,
        profileUrl: person.linkedin_url
      })
    );

    return { success: true, prospects };
  }
}
```

### Dans l'API REST

```javascript
// api/prospects.js

const { Prospect } = require('@graixl/prospection-core');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createProspect(req, res) {
  // Créer entité Prospect
  const prospect = new Prospect(req.body);

  // Calculer le score
  prospect.calculateQualityScore();
  prospect.determineSeniority();

  // Sauvegarder avec Prisma
  const saved = await prisma.prospect.create({
    data: prospect.toPrisma()
  });

  res.status(201).json(saved);
}
```

## Avantages

### ✅ Séparation des Préoccupations
- **Domaine métier** indépendant de l'infrastructure
- **Logique métier** dans les entités, pas dans les controllers/services

### ✅ Testabilité
```javascript
// Tests unitaires avec mocks
const mockScraper = {
  searchProspects: jest.fn().mockResolvedValue({
    success: true,
    prospects: [/* ... */]
  })
};

// Test du domaine isolé
const prospect = new Prospect({ jobTitle: 'CTO' });
expect(prospect.isDecisionMaker()).toBe(true);
```

### ✅ Flexibilité
Changer d'implémentation sans toucher à la logique métier :

```javascript
// Avant : Apollo
const scraper = new ApolloLinkedInAdapter();

// Après : Puppeteer (ou autre)
const scraper = new PuppeteerLinkedInAdapter();

// Le reste du code ne change pas !
const results = await scraper.searchProspects(criteria);
```

### ✅ Réutilisabilité
Partager le code entre projets :
- `graixl-public` → AI multi-agents
- `prospection-system` → LinkedIn CRM
- Futurs projets → même foundation

### ✅ Type Safety
Définitions JSDoc complètes :
```javascript
/**
 * @typedef {Object} LinkedInSearchCriteria
 * @property {string[]} locations
 * @property {string[]} industries
 * @property {string[]} jobTitles
 */
```

## Migration Guide

### Étape 1 : Installer le package partagé

```bash
cd graixl-public
npm install file:../shared/prospection-core

cd ../prospection-system
npm install file:../shared/prospection-core
```

### Étape 2 : Remplacer les imports

```javascript
// Avant
const Prospect = require('./entities/Prospect');

// Après
const { Prospect } = require('@graixl/prospection-core');
```

### Étape 3 : Implémenter les interfaces

```javascript
const { ILinkedInScraperPort } = require('@graixl/prospection-core');

class MyAdapter extends ILinkedInScraperPort {
  // Implémenter toutes les méthodes obligatoires
}
```

## Exemples Concrets

### Exemple 1 : Recherche de prospects avec Apollo

```javascript
const { ILinkedInScraperPort, Prospect } = require('@graixl/prospection-core');

class ApolloAdapter extends ILinkedInScraperPort {
  async searchProspects(criteria) {
    const apolloResults = await this.apolloAPI.search({
      person_titles: criteria.jobTitles,
      q_organization_locations: criteria.locations
    });

    return {
      success: true,
      profiles: apolloResults.people.map(p =>
        Prospect.fromLinkedInProfile({
          firstName: p.first_name,
          lastName: p.last_name,
          company: p.organization_name,
          jobTitle: p.title,
          profileUrl: p.linkedin_url,
          email: p.email
        })
      )
    };
  }
}
```

### Exemple 2 : Gestion de campagne avec Prisma

```javascript
const { ICampaignPort, Prospect } = require('@graixl/prospection-core');

class PrismaCampaignAdapter extends ICampaignPort {
  async createCampaign(config) {
    const campaign = await prisma.campaign.create({
      data: {
        name: config.name,
        status: 'DRAFT',
        filters: config.targetCriteria
      }
    });

    return campaign;
  }

  async getCampaignStats(campaignId) {
    const prospects = await prisma.prospect.findMany({
      where: { campaignId }
    });

    const entities = prospects.map(p => Prospect.fromPrisma(p));

    return {
      totalProspects: entities.length,
      qualified: entities.filter(p => p.isQualified()).length,
      decisionMakers: entities.filter(p => p.isDecisionMaker()).length,
      avgQuality: entities.reduce((sum, p) =>
        sum + p.calculateQualityScore(), 0) / entities.length
    };
  }
}
```

## Tests

### Test d'entité

```javascript
const { Prospect } = require('@graixl/prospection-core');

describe('Prospect', () => {
  it('should identify decision makers', () => {
    const prospect = new Prospect({ jobTitle: 'CTO' });
    expect(prospect.isDecisionMaker()).toBe(true);
  });

  it('should calculate quality score', () => {
    const prospect = new Prospect({
      email: 'john@acme.com',
      emailVerified: true,
      linkedinUrl: 'https://linkedin.com/in/johndoe'
    });

    const score = prospect.calculateQualityScore();
    expect(score).toBeGreaterThan(40);
  });
});
```

### Test d'adapter avec mock

```javascript
const { ILinkedInScraperPort } = require('@graixl/prospection-core');

class MockScraper extends ILinkedInScraperPort {
  async searchProspects() {
    return {
      success: true,
      profiles: [/* fixtures */]
    };
  }
}

// Utiliser le mock dans les tests
const scraper = new MockScraper();
const results = await scraper.searchProspects({ jobTitles: ['CTO'] });
```

## Roadmap

- [x] Créer package `@graixl/prospection-core`
- [x] Définir ports (ILinkedInScraperPort, IEmailEnrichmentPort, ICampaignPort)
- [x] Créer entité Prospect avec logique métier
- [ ] Migrer graixl-public vers package partagé
- [ ] Migrer prospection-system vers package partagé
- [ ] Créer ApolloLinkedInAdapter dans prospection-system
- [ ] Créer tests unitaires pour entités
- [ ] Créer tests d'intégration pour adapters
- [ ] Documentation API complète

## Conclusion

Cette architecture permet de :
1. **Partager le code** entre projets
2. **Tester facilement** avec des mocks
3. **Changer d'implémentation** sans casse
4. **Maintenir** un code propre et organisé
5. **Évoluer** sans dette technique

**Architecture Hexagonale = Code flexible, testable, et maintenable** ✨
