# 🤖 Agents Documentation - Kaspa Community Tool

## Vue d'ensemble du Système Multi-Agents

Le Kaspa Community Tool repose sur une architecture multi-agents sophistiquée, où chaque agent est spécialisé dans un domaine spécifique de l'écosystème Kaspa. Cette approche permet une expertise approfondie et des réponses hautement contextualisées.

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Multi-Agent Architecture                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐  │
│  │  Input Layer    │    │  Routing Layer  │    │ Output Layer    │  │
│  │                 │    │                 │    │                 │  │
│  │ • Text Input    │───▶│ • Intent Detect │───▶│ • Structured    │  │
│  │ • Voice Input   │    │ • Agent Route   │    │   Response      │  │
│  │ • API Calls     │    │ • Context Load  │    │ • Action Items  │  │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘  │
│           │                       │                       │         │
│           └───────────────────────┼───────────────────────┘         │
│                                   │                                 │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    Agent Layer                              │   │
│  │                                                             │   │
│  │ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌───────── │   │
│  │ │Product      │ │BlablaKAS    │ │KAScomodation│ │Social   │ │   │
│  │ │Builder      │ │Ops          │ │Ops          │ │Manager  │ │   │
│  │ │             │ │             │ │             │ │         │ │   │
│  │ │🏗️ Tech     │ │🚗 Transport │ │🏠 Housing   │ │📱 Marketing│ │   │
│  │ │Specs        │ │Support      │ │Logistics    │ │Campaigns│ │   │
│  │ └─────────────┘ └─────────────┘ └─────────────┘ └─────────┘ │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                   │                                 │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                 Knowledge Layer                             │   │
│  │                                                             │   │
│  │ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────┐ │   │
│  │ │RAG System   │ │LLM Engine   │ │Validation   │ │Memory   │ │   │
│  │ │             │ │(OpenAI)     │ │Engine       │ │Store    │ │   │
│  │ │📚 Docs     │ │🧠 GPT-4     │ │✅ Pydantic │ │💾 Context│ │   │
│  │ │Retrieval    │ │Processing   │ │Schemas      │ │History  │ │   │
│  │ └─────────────┘ └─────────────┘ └─────────────┘ └─────────┘ │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

## 🧭 Système de Routage Intelligent

### Algorithme de Routage

Le routage intelligent utilise une combinaison de techniques NLP pour diriger automatiquement les requêtes vers l'agent approprié :

```python
def route_intent(text: str) -> str:
    """
    Route une requête vers l'agent approprié
    
    Args:
        text: Texte de la requête utilisateur
        
    Returns:
        Nom de l'agent le mieux adapté
    """
    
    # 1. Preprocessing
    cleaned_text = preprocess_text(text)
    
    # 2. Extraction de features TF-IDF
    features = vectorizer.transform([cleaned_text])
    
    # 3. Classification avec score de confiance
    predictions = []
    for agent_name, classifier in agent_classifiers.items():
        confidence = classifier.predict_proba(features)[0].max()
        predictions.append((agent_name, confidence))
    
    # 4. Sélection du meilleur agent
    best_agent, best_confidence = max(predictions, key=lambda x: x[1])
    
    # 5. Seuil de confiance
    if best_confidence < 0.7:
        return "general"  # Agent généraliste
    
    return best_agent
```

### Mots-clés par Agent

| Agent | Mots-clés Principaux | Domaines |
|-------|---------------------|-----------|
| **product_builder** | spécification, architecture, développement, feature, système, modèle, api | Technique, Architecture, Développement |
| **blablakas_ops** | covoiturage, trajet, conducteur, passager, annulation, réservation, support | Transport, Support Client, Opérations |
| **kascomodation_ops** | hébergement, logement, hôte, réservation, disponibilité, planning | Hébergement, Logistique, Planification |
| **social_manager** | campagne, social, média, contenu, publication, marketing, communication | Marketing, Communication, Réseaux Sociaux |

### Exemples de Routage

```python
# Exemples de routage automatique
test_cases = [
    {
        "input": "Comment créer une API pour gérer les utilisateurs ?",
        "expected_agent": "product_builder",
        "confidence": 0.92
    },
    {
        "input": "Un passager se plaint de l'état de la voiture",
        "expected_agent": "blablakas_ops", 
        "confidence": 0.89
    },
    {
        "input": "Besoin de 10 logements pour la conférence à Berlin",
        "expected_agent": "kascomodation_ops",
        "confidence": 0.95
    },
    {
        "input": "Lancer une campagne Twitter pour la nouvelle feature",
        "expected_agent": "social_manager",
        "confidence": 0.87
    }
]
```

## 🏗️ Product Builder Agent

### Vue d'ensemble

Le **Product Builder** est l'architecte technique du système. Il transforme les idées en spécifications détaillées, crée des user stories et planifie l'implémentation technique.

### Capacités Principales

```python
class ProductBuilderCapabilities:
    """Capacités du Product Builder Agent"""
    
    CORE_SKILLS = [
        "Architecture système et logicielle",
        "Spécifications techniques détaillées", 
        "User stories avec critères d'acceptation",
        "Modélisation de données",
        "Planification de développement",
        "Gestion des risques techniques",
        "Définition de métriques de succès"
    ]
    
    OUTPUT_FORMATS = [
        "ProductSpec",        # Spécification complète
        "TechnicalDesign",    # Design technique
        "UserStoryCollection", # Collection de user stories
        "RiskAssessment"     # Évaluation des risques
    ]
```

### Prompt Système

```python
KCT_PRODUCT_BUILDER = '''
Tu es le **Product Builder** pour les outils communautaires Kaspa.

## RÔLE ET EXPERTISE
- **Spécialité** : Architecture produit et spécifications techniques
- **Domaine** : Écosystème Kaspa (BlablaKAS, KAScomodation)
- **Mission** : Transformer les idées en spécifications implémentables

## COMPÉTENCES TECHNIQUES
- Architecture système et APIs
- Modélisation de données et bases de données
- UX/UI et expérience utilisateur
- Sécurité et performance
- Intégration blockchain Kaspa

## MÉTHODOLOGIE
1. **Analyse du besoin** : Comprendre l'objectif business
2. **Définition du scope** : Ce qui est inclus/exclu
3. **User stories** : Perspective utilisateur avec critères d'acceptation
4. **Architecture technique** : Composants et intégrations
5. **Risques et métriques** : Identification des challenges

## FORMAT DE SORTIE OBLIGATOIRE
{
  "feature_name": "nom_technique_de_la_feature",
  "problem_statement": "Problème business résolu",
  "scope_in": ["fonctionnalités incluses"],
  "scope_out": ["fonctionnalités exclues"],  
  "user_stories": [
    {
      "role": "utilisateur type",
      "need": "besoin utilisateur", 
      "goal": "objectif à atteindre"
    }
  ],
  "acceptance": [
    {
      "given": "contexte initial",
      "when": "action utilisateur",
      "then": "résultat attendu"
    }
  ],
  "risks": ["risques identifiés"],
  "metrics": ["métriques de succès"],
  "tickets": [
    {
      "title": "Titre du ticket",
      "description": "Description détaillée",
      "labels": ["backend", "frontend", "etc"]
    }
  ]
}

## CONTEXTE KASPA
- **BlablaKAS** : Covoiturage décentralisé avec paiements Kaspa
- **KAScomodation** : Hébergement P2P avec smart contracts
- **Communauté** : Écosystème autour de la blockchain Kaspa

Génère toujours des spécifications complètes, techniques et actionnables.
'''
```

### Exemples d'Utilisation

#### 1. Système de Notation

**Input** :
```json
{
  "input": "Créer un système de notation et d'évaluation pour les conducteurs BlablaKAS"
}
```

**Output** :
```json
{
  "feature_name": "systeme_evaluation_conducteurs",
  "problem_statement": "Les utilisateurs BlablaKAS ont besoin d'un système fiable pour évaluer et choisir leurs conducteurs, renforçant la confiance et la sécurité dans la communauté.",
  "scope_in": [
    "Système de notation 1-5 étoiles",
    "Commentaires textuels avec modération",
    "Historique complet des évaluations",
    "Calcul de score de réputation pondéré",
    "Interface mobile intuitive",
    "API d'évaluation pour les partenaires"
  ],
  "scope_out": [
    "Système de paiement de compensation",
    "Résolution automatique des litiges",
    "Intégration avec réseaux sociaux externes",
    "Géolocalisation des évaluations",
    "Système de badges gamifiés"
  ],
  "user_stories": [
    {
      "role": "passager BlablaKAS", 
      "need": "évaluer mon conducteur après le trajet",
      "goal": "partager mon expérience et aider la communauté à faire de meilleurs choix"
    },
    {
      "role": "conducteur BlablaKAS",
      "need": "consulter les évaluations que j'ai reçues", 
      "goal": "améliorer mon service et construire ma réputation"
    },
    {
      "role": "nouveau utilisateur",
      "need": "voir la réputation d'un conducteur avant de réserver",
      "goal": "faire un choix éclairé et sécurisé"
    }
  ],
  "acceptance": [
    {
      "given": "un trajet BlablaKAS terminé avec succès",
      "when": "l'utilisateur ouvre l'application dans les 24h",
      "then": "une notification d'évaluation apparaît avec un formulaire simple"
    },
    {
      "given": "une évaluation soumise par un utilisateur",
      "when": "le système traite et valide la note",
      "then": "le score de réputation du conducteur se met à jour en temps réel"
    },
    {
      "given": "un utilisateur consulte le profil d'un conducteur",
      "when": "il accède à la section évaluations",
      "then": "il voit la note moyenne, le nombre total d'avis et les 3 commentaires les plus récents"
    }
  ],
  "risks": [
    "Manipulation des évaluations via de faux comptes",
    "Commentaires inappropriés ou diffamatoires",
    "Biais discriminatoires dans les évaluations",
    "Impact performance avec grand volume de données",
    "Pression sociale négative sur les conducteurs"
  ],
  "metrics": [
    "Taux de participation aux évaluations (objectif: >70%)",
    "Score moyen de satisfaction (objectif: >4.2/5)",
    "Temps de modération des commentaires (objectif: <2h)",
    "Réduction du nombre de litiges (objectif: -30%)",
    "Taux de rétention conducteurs (objectif: maintenir >95%)"
  ],
  "tickets": [
    {
      "title": "Modèle de données système d'évaluation",
      "description": "Conception et implémentation de la base de données pour stocker les évaluations, notes et historique complet. Inclut les relations entre utilisateurs, trajets et évaluations.",
      "labels": ["backend", "database", "kaspa"]
    },
    {
      "title": "API REST évaluations",
      "description": "Endpoints pour créer, lire, modifier les évaluations. Inclut validation, authentification et rate limiting.",
      "labels": ["backend", "api", "security"]
    },
    {
      "title": "Interface mobile d'évaluation",
      "description": "Écrans d'évaluation post-trajet avec UX optimisée, gestion offline et synchronisation.",
      "labels": ["frontend", "mobile", "ux"]
    },
    {
      "title": "Algorithme de score de réputation",
      "description": "Développement d'un algorithme pondéré tenant compte de l'ancienneté, fiabilité des évaluateurs et récence des notes.",
      "labels": ["algorithm", "backend", "kaspa"]
    },
    {
      "title": "Système de modération automatique",
      "description": "IA de détection de contenu inapproprié et workflow de validation manuelle pour les commentaires.",
      "labels": ["ai", "moderation", "backend"]
    }
  ]
}
```

### Intégrations Techniques

```python
class ProductBuilderIntegrations:
    """Intégrations du Product Builder avec le système"""
    
    @staticmethod
    def create_jira_tickets(product_spec: ProductSpec):
        """Crée automatiquement les tickets Jira"""
        for ticket in product_spec.tickets:
            jira_client.create_issue(
                project="KASPA",
                summary=ticket.title,
                description=ticket.description,
                labels=ticket.labels,
                issue_type="Story"
            )
    
    @staticmethod
    def generate_technical_documentation(product_spec: ProductSpec):
        """Génère la documentation technique"""
        doc_generator.create_spec_document(
            template="technical_spec",
            data=product_spec.dict(),
            output_path=f"docs/specs/{product_spec.feature_name}.md"
        )
    
    @staticmethod
    def estimate_development_effort(product_spec: ProductSpec):
        """Estime l'effort de développement"""
        complexity_factors = {
            "database": 0.3,
            "api": 0.2, 
            "frontend": 0.25,
            "ai": 0.4,
            "security": 0.3
        }
        
        total_effort = 0
        for ticket in product_spec.tickets:
            ticket_effort = sum(complexity_factors.get(label, 0.1) 
                              for label in ticket.labels)
            total_effort += ticket_effort
        
        return {
            "total_story_points": int(total_effort * 10),
            "estimated_sprint_count": max(1, int(total_effort / 2)),
            "team_size_recommendation": min(5, max(2, int(total_effort / 1.5)))
        }
```

## 🚗 BlablaKAS Ops Agent

### Vue d'ensemble

Le **BlablaKAS Ops** est l'expert opérationnel du covoiturage Kaspa. Il gère le support client, crée des procédures et optimise l'expérience des conducteurs et passagers.

### Domaines d'Expertise

```python
class BlablaKASOpsExpertise:
    """Domaines d'expertise BlablaKAS Ops"""
    
    TRANSPORT_OPERATIONS = [
        "Réservation et annulation de trajets",
        "Gestion des conducteurs et passagers", 
        "Sécurité et vérifications",
        "Paiements et remboursements Kaspa",
        "Résolution de litiges",
        "Optimisation des trajets"
    ]
    
    SUPPORT_AREAS = [
        "FAQ dynamiques contextuelles",
        "Scripts de support client (macros)",
        "Escalades et processus d'urgence",
        "Formation des équipes support",
        "Métriques de satisfaction client"
    ]
    
    OPERATIONAL_PROCESSES = [
        "Runbooks pour incidents",
        "Procédures de vérification",
        "Workflows d'approbation",
        "Automatisation des tâches répétitives"
    ]
```

### Architecture des Réponses

```python
class OpsPackage(BaseModel):
    """Structure de réponse BlablaKAS Ops"""
    
    topic: str = Field(description="Sujet principal traité")
    
    faqs: List[FAQ] = Field(description="Questions fréquemment posées")
    
    macros: List[SupportMacro] = Field(description="Scripts de support")
    
    runbook: List[OperationalStep] = Field(description="Procédures opérationnelles")
    
    escalation: List[EscalationRule] = Field(description="Règles d'escalade")

class FAQ(BaseModel):
    question: str
    answer: str
    category: str
    keywords: List[str]
    last_updated: Optional[str] = None

class SupportMacro(BaseModel):
    trigger: str = Field(description="Déclencheur du macro")
    response: str = Field(description="Réponse prédéfinie") 
    escalation_level: int = Field(description="Niveau d'escalade")
    tags: List[str] = []

class OperationalStep(BaseModel):
    scenario: str
    steps: List[str]
    sla: str = Field(description="Service Level Agreement")
    responsible_team: str = "support"
```

### Exemples Spécialisés

#### 1. Gestion des Annulations

**Input** :
```json
{
  "input": "Comment gérer les annulations de dernière minute pour BlablaKAS ?"
}
```

**Output** :
```json
{
  "topic": "annulations_derniere_minute",
  "faqs": [
    {
      "question": "Puis-je annuler mon trajet moins de 2h avant le départ ?",
      "answer": "Oui, mais des frais d'annulation de 20% du montant total s'appliquent pour protéger les autres participants. Le conducteur est notifié immédiatement.",
      "category": "annulation",
      "keywords": ["annuler", "dernière minute", "frais", "2h"]
    },
    {
      "question": "Que se passe-t-il si le conducteur annule au dernier moment ?",
      "answer": "Le conducteur qui annule moins de 4h avant le départ perd son score de fiabilité et peut être facturé des frais de dérangement. Nous vous trouvons une alternative automatiquement.",
      "category": "annulation_conducteur", 
      "keywords": ["conducteur annule", "alternative", "fiabilité"]
    }
  ],
  "macros": [
    {
      "trigger": "annulation_tardive_passager",
      "response": "Je comprends que les imprévus arrivent. Votre annulation est confirmée avec des frais de 20% selon nos conditions. Le montant restant sera remboursé sur votre wallet Kaspa dans 24h. Puis-je vous aider à trouver un autre trajet ?",
      "escalation_level": 1,
      "tags": ["annulation", "remboursement"]
    },
    {
      "trigger": "annulation_tardive_conducteur", 
      "response": "Cette annulation de dernière minute impacte négativement votre score de fiabilité. Nous contactons immédiatement les passagers pour leur proposer des alternatives. Veuillez expliquer la raison de cette annulation.",
      "escalation_level": 2,
      "tags": ["conducteur", "fiabilité", "urgence"]
    }
  ],
  "runbook": [
    {
      "scenario": "Annulation conducteur < 4h avant départ",
      "steps": [
        "Vérifier la raison de l'annulation (urgence médicale = exception)",
        "Notifier tous les passagers par push notification",
        "Lancer l'algorithme de recherche de trajets alternatifs",
        "Si aucune alternative: proposer remboursement intégral + compensation 10%",
        "Réduire le score fiabilité du conducteur (-15 points)",
        "Si récidive (3x en 30j): suspension temporaire 7 jours"
      ],
      "sla": "15 minutes max pour traitement complet",
      "responsible_team": "ops_urgent"
    }
  ],
  "escalation": [
    {
      "level": 3,
      "trigger": "Passager bloqué sans solution après annulation conducteur",
      "action": "Activation du plan d'urgence: VTC payé par BlablaKAS",
      "notify": ["ops-manager@blablakas.com", "emergency@kaspa.com"],
      "sla": "5 minutes"
    }
  ]
}
```

#### 2. Incidents de Sécurité

**Input** :
```json
{
  "input": "Procédure à suivre en cas d'incident de sécurité signalé par un passager"
}
```

**Output** :
```json
{
  "topic": "incident_securite_passager",
  "faqs": [
    {
      "question": "Comment signaler un comportement inapproprié du conducteur ?",
      "answer": "Utilisez le bouton 'Signaler un incident' dans l'app pendant ou après le trajet. Nous traitons tous les signalements dans l'heure. En urgence, contactez directement les autorités (112).",
      "category": "securite",
      "keywords": ["signaler", "comportement", "urgence", "112"]
    }
  ],
  "macros": [
    {
      "trigger": "incident_securite_grave",
      "response": "Votre sécurité est notre priorité absolue. J'ai immédiatement alerté notre équipe de sécurité et le conducteur concerné est suspendu pendant l'enquête. Nous vous contacterons dans l'heure pour un suivi. Si vous êtes en danger immédiat, contactez le 112.",
      "escalation_level": 4,
      "tags": ["securite", "urgence", "suspension"]
    }
  ],
  "runbook": [
    {
      "scenario": "Signalement d'incident de sécurité",
      "steps": [
        "IMMÉDIAT: Suspendre le conducteur concerné (compte gelé)",
        "Contacter le passager dans les 30 minutes maximum",
        "Documenter tous les détails dans le système de tickets sécurité",
        "Si incident grave: alerter les autorités compétentes",
        "Lancer enquête interne avec équipe juridique",
        "Suivi quotidien avec le passager jusqu'à résolution"
      ],
      "sla": "30 minutes pour premier contact",
      "responsible_team": "security_team"
    }
  ],
  "escalation": [
    {
      "level": 5,
      "trigger": "Incident avec menace physique ou agression",
      "action": "Alerte immédiate police + suspension définitive conducteur + support psychologique passager",
      "notify": ["security-chief@blablakas.com", "legal@kaspa.com", "ceo@kaspa.com"],
      "sla": "Immédiat"
    }
  ]
}
```

## 🏠 KAScomodation Ops Agent

### Vue d'ensemble

Le **KAScomodation Ops** optimise la logistique d'hébergement peer-to-peer. Il planifie, organise et résout les défis liés aux réservations de logements communautaires.

### Compétences Logistiques

```python
class KAScomodationCapabilities:
    """Capacités logistiques KAScomodation"""
    
    PLANNING_SKILLS = [
        "Optimisation des capacités d'hébergement",
        "Gestion des conflits de planning", 
        "Calcul de tarification dynamique",
        "Coordination multi-hôtes",
        "Backup et alternatives automatiques"
    ]
    
    HOST_MANAGEMENT = [
        "Onboarding des nouveaux hôtes",
        "Qualité et standards d'hébergement",
        "Résolution de problèmes hôte-invité",
        "Optimisation des revenus hôtes"
    ]
    
    GUEST_SERVICES = [
        "Expérience d'arrivée et départ",
        "Support pendant le séjour",
        "Gestion des demandes spéciales",
        "Satisfaction et feedback"
    ]
```

### Architecture des Plans

```python
class AccommodationPlan(BaseModel):
    """Plan d'hébergement optimisé"""
    
    event_details: EventInfo
    booking_recommendations: List[AccommodationOption]
    optimization_metrics: OptimizationResult
    alternatives: List[BackupPlan]
    logistics: List[LogisticalInfo]

class AccommodationOption(BaseModel):
    host_name: str
    location: str
    capacity: int
    price_per_night: float
    amenities: List[str]
    rating: float
    availability_confirmed: bool
    special_notes: Optional[str]

class OptimizationResult(BaseModel):
    total_cost: float
    average_rating: float
    coverage_percentage: float
    geographic_spread: str
    cost_efficiency_score: float
```

### Exemples de Planification

#### 1. Événement Berlin - 25 Personnes

**Input** :
```json
{
  "input": "Organiser l'hébergement pour 25 participants au Kaspa Summit à Berlin du 15 au 18 septembre"
}
```

**Output** :
```json
{
  "event_details": {
    "name": "Kaspa Summit Berlin",
    "dates": "2025-09-15 to 2025-09-18", 
    "participant_count": 25,
    "location": "Berlin, Germany",
    "duration_nights": 3
  },
  "booking_recommendations": [
    {
      "host_name": "Klaus Mueller",
      "location": "Mitte - 15min du venue",
      "capacity": 8,
      "price_per_night": 45.00,
      "amenities": ["WiFi", "Kitchen", "Laundry", "Parking"],
      "rating": 4.8,
      "availability_confirmed": true,
      "special_notes": "Hôte parle anglais/allemand, expérience événements crypto"
    },
    {
      "host_name": "Sarah Wagner",
      "location": "Prenzlauer Berg - 20min du venue", 
      "capacity": 6,
      "price_per_night": 40.00,
      "amenities": ["WiFi", "Kitchen", "Balcony"],
      "rating": 4.9,
      "availability_confirmed": true,
      "special_notes": "Appartement rénové 2024, très calme"
    },
    {
      "host_name": "tech House Collective",
      "location": "Kreuzberg - 25min du venue",
      "capacity": 12,
      "price_per_night": 35.00,
      "amenities": ["WiFi", "Co-working space", "Kitchen", "Roof terrace"],
      "rating": 4.6, 
      "availability_confirmed": true,
      "special_notes": "Espace dédié aux professionnels tech, parfait pour networking"
    }
  ],
  "optimization_metrics": {
    "total_cost": 3150.00,
    "average_rating": 4.77,
    "coverage_percentage": 104.0,
    "geographic_spread": "Optimal - tous à <25min du venue",
    "cost_efficiency_score": 0.89
  },
  "alternatives": [
    {
      "scenario": "Si Klaus Mueller annule",
      "backup_option": {
        "host_name": "Maria Santos",
        "capacity": 7,
        "additional_cost": 120.00,
        "availability_window": "48h pour confirmer"
      }
    },
    {
      "scenario": "Budget serré (-20%)",
      "alternative_mix": [
        "Réduire Klaus à 6 personnes (-90€)",
        "Ajouter 2 personnes chez Collective (+70€)",
        "Économie nette: 420€"
      ]
    }
  ],
  "logistics": [
    {
      "checkin_process": "Codes d'accès numériques envoyés 24h avant arrivée",
      "key_contact": "Sarah Kowalski - Community Manager (+49 xxx xxx xxx)",
      "emergency_backup": "Hotel Partner Adina (last resort - 89€/nuit)",
      "group_coordination": "WhatsApp group créé avec tous les hôtes",
      "payment_schedule": "50% à la réservation, 50% 7 jours avant événement"
    },
    {
      "local_recommendations": [
        "Transport: Berlin WelcomeCard pour groupe (réduction 25%)",
        "Restaurants: Liste de 5 restaurants crypto-friendly à proximité",
        "Networking: Café communautaire 'Blockchain Hub' - 10min à pied"
      ]
    }
  ]
}
```

## 📱 Social Manager Agent

### Vue d'ensemble

Le **Social Manager** orchestre la présence digitale de l'écosystème Kaspa. Il crée des campagnes engageantes, planifie le contenu et optimise la portée sur les réseaux sociaux.

### Expertise Marketing

```python
class SocialManagerExpertise:
    """Expertise du Social Manager"""
    
    CONTENT_CREATION = [
        "Rédaction persuasive et engageante",
        "Adaptation du tone of voice par plateforme",
        "Storytelling communautaire",
        "Création de visuels conceptuels",
        "Hashtags et SEO social"
    ]
    
    CAMPAIGN_MANAGEMENT = [
        "Planification de campagnes multi-plateformes",
        "A/B testing de contenu", 
        "Optimisation des horaires de publication",
        "Gestion de communauté",
        "Analyse de performance et ROI"
    ]
    
    PLATFORMS = [
        "Twitter/X - Actualités et engagement rapide",
        "LinkedIn - Contenu professionnel et B2B", 
        "Instagram - Visuels et behind-the-scenes",
        "TikTok - Contenu viral et jeune audience",
        "Discord - Engagement communautaire profond"
    ]
```

### Architecture des Campagnes

```python
class SocialPlan(BaseModel):
    """Plan de campagne social media"""
    
    campaign_name: str
    posts: List[SocialPost]
    reports: List[AnalyticsReport]
    budget: Optional[CampaignBudget]
    
class SocialPost(BaseModel):
    platform: str
    text: str
    media_urls: List[str] = []
    hashtags: List[str] = []
    scheduled_at: str
    target_audience: Optional[str]
    requires_approval: bool = False
    
class AnalyticsReport(BaseModel):
    period: str
    kpis: List[str]
    target_metrics: Optional[Dict[str, float]]
```

### Campagnes Spécialisées

#### 1. Lancement Feature Géolocalisation

**Input** :
```json
{
  "input": "Créer une campagne social media pour le lancement de la géolocalisation temps réel sur BlablaKAS"
}
```

**Output** :
```json
{
  "campaign_name": "blablakas_geoloc_launch",
  "posts": [
    {
      "platform": "x",
      "text": "🛣️ NOUVELLE FONCTIONNALITÉ : Géolocalisation temps réel sur BlablaKAS !\n\n✅ Suivez votre trajet en direct\n✅ Partagez votre position avec vos proches  \n✅ Sécurité renforcée pour tous\n\nLa transparence blockchain s'étend maintenant à vos déplacements ! 🚗⚡\n\n#BlablaKAS #Kaspa #GeolocTempsReel #SecurityFirst",
      "media_urls": ["https://cdn.kaspa.com/geoloc-feature-demo.mp4"],
      "hashtags": ["#BlablaKAS", "#Kaspa", "#GeolocTempsReel", "#SecurityFirst", "#InnovationTransport"],
      "scheduled_at": "2025-08-25T10:00:00Z",
      "target_audience": "kaspa_community",
      "requires_approval": false
    },
    {
      "platform": "linkedin",
      "text": "BlablaKAS révolutionne une fois de plus le covoiturage avec sa nouvelle fonctionnalité de géolocalisation temps réel.\n\nCette innovation renforce la sécurité et la transparence, valeurs fondamentales de l'écosystème Kaspa :\n\n🔍 Suivi en temps réel des trajets\n🛡️ Sécurité accrue pour conducteurs et passagers\n📱 Interface intuitive et respectueuse de la vie privée\n🌐 Intégration native avec la blockchain Kaspa\n\nUn pas de plus vers un transport décentralisé et sécurisé.\n\n#Innovation #Transport #Blockchain #Kaspa #Sécurité",
      "media_urls": ["https://cdn.kaspa.com/geoloc-infographic.jpg"],
      "hashtags": ["#Innovation", "#Transport", "#Blockchain", "#Kaspa", "#Sécurité"],
      "scheduled_at": "2025-08-25T14:30:00Z", 
      "target_audience": "blockchain_professionals",
      "requires_approval": false
    },
    {
      "platform": "x",
      "text": "🎯 THREAD : Pourquoi la géolocalisation BlablaKAS change la donne ?\n\n1/5 🧵 La sécurité d'abord : Plus jamais d'inquiétude pour vos proches. Ils savent exactement où vous êtes. #BlablaKAS",
      "scheduled_at": "2025-08-26T16:00:00Z",
      "target_audience": "safety_conscious_users",
      "requires_approval": false
    },
    {
      "platform": "instagram",
      "text": "🚗✨ Découvrez la géolocalisation temps réel BlablaKAS !\n\nVotre sécurité, notre priorité. Vos trajets, transparents et sereins.\n\n#BlablaKAS #KaspaCommunity #InnovationTransport #GeolocTempsReel",
      "media_urls": ["https://cdn.kaspa.com/geoloc-carousel-instagram.jpg"],
      "scheduled_at": "2025-08-25T18:00:00Z",
      "target_audience": "general_public",
      "requires_approval": true
    }
  ],
  "reports": [
    {
      "period": "48h_post_launch",
      "kpis": ["impressions", "engagement_rate", "click_through_rate", "app_downloads"],
      "target_metrics": {
        "total_impressions": 100000,
        "engagement_rate": 0.08,
        "ctr": 0.03,
        "app_downloads": 500
      }
    },
    {
      "period": "7d_campaign",
      "kpis": ["reach", "brand_mentions", "feature_adoption", "user_feedback_sentiment"],
      "target_metrics": {
        "unique_reach": 250000,
        "brand_mentions": 150,
        "feature_adoption": 0.15,
        "sentiment_score": 0.75
      }
    }
  ],
  "budget": {
    "total_budget": 1500,
    "allocation": {
      "x_promoted_tweets": 600,
      "linkedin_sponsored_content": 400, 
      "instagram_reels_boost": 300,
      "influencer_partnerships": 200
    },
    "expected_roi": {
      "cost_per_impression": 0.015,
      "cost_per_app_install": 3.00,
      "lifetime_value_multiplier": 8.5
    }
  },
  "content_calendar": {
    "pre_launch": {
      "teaser_posts": 3,
      "behind_scenes_content": 2,
      "community_polls": 1
    },
    "launch_day": {
      "announcement_posts": 4,
      "live_demo": 1,
      "user_testimonials": 2
    },
    "post_launch": {
      "success_metrics": 1,
      "user_generated_content": "ongoing",
      "feedback_collection": "daily"
    }
  }
}
```

## 🔄 Workflows et Orchestration

### Workflow Feature Launch

Le workflow **Feature Launch** coordonne les 4 agents pour un développement complet :

```python
async def feature_launch_workflow(idea: str) -> Dict[str, Any]:
    """
    Workflow complet de lancement de fonctionnalité
    
    Étapes:
    1. Product Builder -> Spécifications techniques
    2. Ops Agents -> Procédures et support
    3. Social Manager -> Plan marketing
    4. Intégrations -> Tickets Jira + Documentation
    """
    
    # Phase 1: Product Specification
    product_spec = await agents.product_builder.act(
        f"Créer les spécifications pour: {idea}"
    )
    
    # Phase 2: Operational Procedures (parallèle)
    ops_tasks = [
        agents.blablakas_ops.act(
            f"Créer les procédures de support pour: {idea}"
        ),
        agents.kascomodation_ops.act(
            f"Adapter les processus logistiques pour: {idea}"  
        )
    ]
    ops_results = await asyncio.gather(*ops_tasks)
    
    # Phase 3: Marketing Campaign
    social_plan = await agents.social_manager.act(
        f"Créer une campagne de lancement pour: {idea}"
    )
    
    # Phase 4: Integration & Tickets
    jira_tickets = create_jira_tickets(product_spec)
    documentation = generate_documentation(
        product_spec, ops_results, social_plan
    )
    
    return {
        "workflow_id": f"wf_{uuid4().hex[:8]}",
        "status": "completed",
        "results": {
            "product_spec": product_spec,
            "ops_package": ops_results[0],  # BlablaKAS
            "logistics_plan": ops_results[1],  # KAScomodation  
            "social_plan": social_plan
        },
        "integrations": {
            "jira_tickets": jira_tickets,
            "documentation": documentation
        }
    }
```

## 🧠 Système RAG (Retrieval-Augmented Generation)

### Architecture RAG

Chaque agent est enrichi par un système RAG qui injecte des connaissances spécialisées :

```python
class RAGSystem:
    """Système de récupération de connaissances"""
    
    def __init__(self):
        self.retrievers = {
            "product_builder": TFIDFRetriever("rag/product_builder/"),
            "blablakas_ops": TFIDFRetriever("rag/blablakas_ops/"),
            "kascomodation_ops": TFIDFRetriever("rag/kascomodation_ops/"),
            "social_manager": TFIDFRetriever("rag/social_manager/")
        }
    
    async def enhance_prompt(self, agent_name: str, query: str, system_prompt: str) -> str:
        """Enrichit le prompt avec des connaissances contextuelles"""
        
        # 1. Récupération de documents pertinents
        relevant_docs = self.retrievers[agent_name].retrieve(query, top_k=3)
        
        # 2. Construction du contexte
        context = "\n\n".join([
            f"## Document : {doc.title}\n{doc.content}"
            for doc in relevant_docs
        ])
        
        # 3. Injection dans le prompt
        enhanced_prompt = f"""
{system_prompt}

## CONTEXTE ADDITIONNEL
Utilise ces informations pour enrichir ta réponse :

{context}

## REQUÊTE UTILISATEUR
{query}
"""
        
        return enhanced_prompt
```

### Base de Connaissances

```
rag/
├── product_builder/
│   ├── kaspa_architecture.md      # Architecture blockchain Kaspa
│   ├── development_standards.md   # Standards de développement
│   ├── security_guidelines.md     # Guidelines de sécurité
│   └── api_design_patterns.md     # Patterns d'API
│
├── blablakas_ops/
│   ├── transport_regulations.md   # Régulations transport
│   ├── safety_procedures.md       # Procédures de sécurité
│   ├── payment_flows.md           # Flux de paiement Kaspa
│   └── dispute_resolution.md      # Résolution de litiges
│
├── kascomodation_ops/
│   ├── accommodation_standards.md # Standards d'hébergement
│   ├── booking_optimization.md    # Optimisation réservations
│   ├── host_guidelines.md         # Guide pour hôtes
│   └── pricing_strategies.md      # Stratégies de prix
│
└── social_manager/
    ├── kaspa_brand_guidelines.md  # Guidelines de marque
    ├── content_calendar_2025.md   # Calendrier de contenu
    ├── community_engagement.md    # Engagement communautaire
    └── crisis_communication.md    # Communication de crise
```

## 🔧 Configuration et Personnalisation

### Personnalisation des Agents

```python
# config/agent_config.yaml
agents:
  product_builder:
    temperature: 0.3  # Plus déterministe pour les specs
    max_tokens: 2000
    model: "gpt-4"
    specialized_prompts:
      - "Toujours inclure des métriques de succès"
      - "Considérer l'impact sur la blockchain Kaspa"
    
  social_manager:
    temperature: 0.7  # Plus créatif pour le contenu
    max_tokens: 1500
    model: "gpt-4"
    specialized_prompts:
      - "Maintenir le ton de la marque Kaspa"
      - "Optimiser pour l'engagement communautaire"

# Chargement de la configuration
def load_agent_config(agent_name: str) -> Dict:
    with open("config/agent_config.yaml") as f:
        config = yaml.safe_load(f)
    return config["agents"].get(agent_name, {})
```

### Extensions et Plugins

```python
class AgentExtension:
    """Système d'extension pour agents"""
    
    def __init__(self, agent_name: str):
        self.agent_name = agent_name
        self.plugins = self.load_plugins()
    
    def load_plugins(self) -> List[Plugin]:
        """Charge les plugins spécialisés"""
        plugin_dir = f"plugins/{self.agent_name}/"
        return [
            import_module(f"plugins.{self.agent_name}.{plugin}")
            for plugin in os.listdir(plugin_dir)
            if plugin.endswith(".py")
        ]
    
    async def process_with_plugins(self, input_data: str) -> str:
        """Traite l'entrée avec tous les plugins"""
        for plugin in self.plugins:
            if hasattr(plugin, "pre_process"):
                input_data = await plugin.pre_process(input_data)
        
        # Traitement principal de l'agent...
        result = await self.main_processing(input_data)
        
        for plugin in self.plugins:
            if hasattr(plugin, "post_process"):
                result = await plugin.post_process(result)
        
        return result
```

---

**Documentation complète des agents Kaspa Community Tool**  
**Version** : 1.0  
**Dernière mise à jour** : 17 août 2025  
**Support technique** : agents@kaspa-community-tool.com