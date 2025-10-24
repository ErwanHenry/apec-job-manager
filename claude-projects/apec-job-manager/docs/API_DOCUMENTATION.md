# Documentation API - APEC Job Manager

API RESTful complète pour la gestion d'annonces d'emploi APEC.

## Base URL

```
Production: https://api.votredomaine.com/api
Development: http://localhost:3000/api
```

## Authentication

Actuellement l'API n'utilise pas d'authentification. Pour la production, implémenter JWT via les routes `/api/auth`.

---

## Endpoints

### Health Check

#### GET /api/health

Vérification de l'état du serveur.

**Réponse 200 OK:**
```json
{
  "status": "OK",
  "timestamp": "2025-01-15T10:30:00.000Z",
  "uptime": 3600,
  "environment": "production"
}
```

---

## Jobs (Annonces)

### GET /api/jobs

Liste toutes les annonces d'emploi.

**Query Parameters:**
- `status` (string, optionnel) - Filtrer par statut: `PUBLISHED`, `DRAFT`, `PAUSED`, `EXPIRED`, `DELETED`
- `limit` (number, optionnel, default: 50) - Nombre d'éléments par page
- `offset` (number, optionnel, default: 0) - Pagination offset

**Exemple:**
```bash
curl "http://localhost:3000/api/jobs?status=PUBLISHED&limit=10&offset=0"
```

**Réponse 200 OK:**
```json
{
  "status": "success",
  "data": {
    "jobs": [
      {
        "id": "abc123",
        "apecId": "12345",
        "title": "Développeur Full Stack",
        "description": "Nous recherchons un développeur...",
        "location": "Paris",
        "contractType": "CDI",
        "salary": "45-55K€",
        "status": "PUBLISHED",
        "views": 150,
        "applications": 12,
        "publishedAt": "2025-01-10T09:00:00.000Z",
        "updatedAt": "2025-01-15T14:30:00.000Z",
        "createdAt": "2025-01-10T08:00:00.000Z"
      }
    ],
    "pagination": {
      "total": 25,
      "limit": 10,
      "offset": 0,
      "hasMore": true
    }
  }
}
```

---

### GET /api/jobs/:id

Récupère les détails d'une annonce spécifique.

**Path Parameters:**
- `id` (string, requis) - ID de l'annonce

**Exemple:**
```bash
curl "http://localhost:3000/api/jobs/abc123"
```

**Réponse 200 OK:**
```json
{
  "status": "success",
  "data": {
    "job": {
      "id": "abc123",
      "apecId": "12345",
      "title": "Développeur Full Stack",
      "description": "Description complète...",
      "location": "Paris",
      "contractType": "CDI",
      "salary": "45-55K€",
      "requirements": "- 5 ans d'expérience\n- Maîtrise React/Node",
      "benefits": "RTT, télétravail, tickets resto",
      "status": "PUBLISHED",
      "views": 150,
      "applications": 12,
      "publishedAt": "2025-01-10T09:00:00.000Z",
      "updatedAt": "2025-01-15T14:30:00.000Z",
      "createdAt": "2025-01-10T08:00:00.000Z",
      "deletedAt": null,
      "lastSyncAt": "2025-01-15T12:00:00.000Z"
    }
  }
}
```

**Réponse 404 Not Found:**
```json
{
  "status": "fail",
  "message": "Job not found"
}
```

---

### POST /api/jobs

Crée une nouvelle annonce sur APEC.

**Body (JSON):**
```json
{
  "title": "Développeur Full Stack",
  "description": "Nous recherchons un développeur passionné...",
  "location": "Paris",
  "contractType": "CDI",
  "salary": "45-55K€",
  "requirements": "- 5 ans d'expérience\n- React, Node.js",
  "benefits": "RTT, télétravail, tickets restaurant"
}
```

**Champs requis:**
- `title` (string) - Titre de l'annonce
- `description` (string) - Description du poste

**Champs optionnels:**
- `location` (string) - Localisation
- `contractType` (string) - Type de contrat (CDI, CDD, Stage, etc.)
- `salary` (string) - Fourchette de salaire
- `requirements` (string) - Prérequis du poste
- `benefits` (string) - Avantages

**Exemple:**
```bash
curl -X POST "http://localhost:3000/api/jobs" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Développeur Full Stack",
    "description": "Nous recherchons...",
    "location": "Paris",
    "contractType": "CDI",
    "salary": "45-55K€"
  }'
```

**Réponse 201 Created:**
```json
{
  "status": "success",
  "data": {
    "job": {
      "id": "xyz789",
      "apecId": "67890",
      "title": "Développeur Full Stack",
      "description": "Nous recherchons...",
      "location": "Paris",
      "contractType": "CDI",
      "salary": "45-55K€",
      "status": "PUBLISHED",
      "views": 0,
      "applications": 0,
      "publishedAt": "2025-01-15T15:00:00.000Z",
      "createdAt": "2025-01-15T15:00:00.000Z"
    }
  }
}
```

---

### PUT /api/jobs/:id

Met à jour une annonce existante.

**Path Parameters:**
- `id` (string, requis) - ID de l'annonce

**Body (JSON) - tous les champs sont optionnels:**
```json
{
  "title": "Senior Développeur Full Stack",
  "salary": "55-65K€",
  "requirements": "- 7 ans d'expérience minimum"
}
```

**Exemple:**
```bash
curl -X PUT "http://localhost:3000/api/jobs/abc123" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Senior Développeur Full Stack",
    "salary": "55-65K€"
  }'
```

**Réponse 200 OK:**
```json
{
  "status": "success",
  "data": {
    "job": {
      "id": "abc123",
      "apecId": "12345",
      "title": "Senior Développeur Full Stack",
      "salary": "55-65K€",
      "updatedAt": "2025-01-15T16:00:00.000Z"
    }
  }
}
```

---

### DELETE /api/jobs/:id

Supprime une annonce d'emploi.

**Path Parameters:**
- `id` (string, requis) - ID de l'annonce

**Exemple:**
```bash
curl -X DELETE "http://localhost:3000/api/jobs/abc123"
```

**Réponse 200 OK:**
```json
{
  "status": "success",
  "message": "Job deleted successfully"
}
```

---

### POST /api/jobs/sync

Lance une synchronisation manuelle avec APEC.

Récupère toutes les annonces depuis APEC, compare avec la base locale, et synchronise les différences.

**Exemple:**
```bash
curl -X POST "http://localhost:3000/api/jobs/sync"
```

**Réponse 200 OK:**
```json
{
  "status": "success",
  "data": {
    "syncReport": {
      "created": 3,
      "updated": 12,
      "deleted": 1,
      "unchanged": 8,
      "errors": []
    }
  }
}
```

**Note:** Cette opération peut prendre plusieurs secondes selon le nombre d'annonces.

---

## Dashboard

### GET /api/dashboard/stats

Statistiques globales du compte.

**Exemple:**
```bash
curl "http://localhost:3000/api/dashboard/stats"
```

**Réponse 200 OK:**
```json
{
  "status": "success",
  "data": {
    "stats": {
      "totalJobs": 25,
      "publishedJobs": 18,
      "draftJobs": 5,
      "totalViews": 3250,
      "totalApplications": 187,
      "jobsLast30Days": 8,
      "avgViewsPerJob": 130,
      "avgApplicationsPerJob": 7
    },
    "dailyStats": [
      {
        "date": "2025-01-01",
        "count": 2
      },
      {
        "date": "2025-01-02",
        "count": 1
      }
      // ... 30 jours
    ]
  }
}
```

---

### GET /api/dashboard/recent-activity

Activité récente (annonces, syncs, audits).

**Query Parameters:**
- `limit` (number, optionnel, default: 10) - Nombre d'éléments

**Exemple:**
```bash
curl "http://localhost:3000/api/dashboard/recent-activity?limit=5"
```

**Réponse 200 OK:**
```json
{
  "status": "success",
  "data": {
    "recentJobs": [
      {
        "id": "abc123",
        "title": "Développeur Full Stack",
        "status": "PUBLISHED",
        "createdAt": "2025-01-15T10:00:00.000Z",
        "updatedAt": "2025-01-15T14:30:00.000Z"
      }
    ],
    "recentSyncs": [
      {
        "id": "sync123",
        "syncType": "AUTOMATIC",
        "status": "SUCCESS",
        "jobsCreated": 2,
        "jobsUpdated": 5,
        "startedAt": "2025-01-15T12:00:00.000Z"
      }
    ],
    "recentAudits": [
      {
        "id": "audit123",
        "action": "CREATE_JOB",
        "entity": "Job",
        "entityId": "abc123",
        "createdAt": "2025-01-15T10:00:00.000Z"
      }
    ]
  }
}
```

---

### GET /api/dashboard/performance

Annonces les plus performantes (top 10).

**Exemple:**
```bash
curl "http://localhost:3000/api/dashboard/performance"
```

**Réponse 200 OK:**
```json
{
  "status": "success",
  "data": {
    "topJobs": [
      {
        "id": "abc123",
        "title": "Développeur Full Stack",
        "views": 250,
        "applications": 25,
        "publishedAt": "2025-01-01T09:00:00.000Z"
      }
    ],
    "avgConversionRate": "10.5"
  }
}
```

---

## Reports (Rapports)

### GET /api/reports

Liste tous les rapports générés.

**Query Parameters:**
- `type` (string, optionnel) - Filtrer par type: `DAILY`, `WEEKLY`, `MONTHLY`, `CUSTOM`
- `limit` (number, optionnel, default: 20)
- `offset` (number, optionnel, default: 0)

**Exemple:**
```bash
curl "http://localhost:3000/api/reports?type=WEEKLY&limit=5"
```

**Réponse 200 OK:**
```json
{
  "status": "success",
  "data": {
    "reports": [
      {
        "id": "report123",
        "type": "WEEKLY",
        "period": "weekly-2025-01-08",
        "startDate": "2025-01-08T00:00:00.000Z",
        "endDate": "2025-01-15T00:00:00.000Z",
        "data": {
          "summary": {
            "jobsCreated": 5,
            "jobsUpdated": 12,
            "totalViews": 450,
            "totalApplications": 38
          }
        },
        "generatedAt": "2025-01-15T18:00:00.000Z"
      }
    ]
  }
}
```

---

### GET /api/reports/daily

Génère un rapport quotidien.

**Exemple:**
```bash
curl "http://localhost:3000/api/reports/daily"
```

**Réponse 200 OK:**
```json
{
  "status": "success",
  "data": {
    "report": {
      "id": "report456",
      "type": "DAILY",
      "period": "daily-2025-01-15",
      "data": {
        "period": {
          "type": "DAILY",
          "startDate": "2025-01-15T00:00:00.000Z",
          "endDate": "2025-01-16T00:00:00.000Z"
        },
        "summary": {
          "jobsCreated": 2,
          "jobsUpdated": 5,
          "jobsDeleted": 0,
          "totalViews": 87,
          "totalApplications": 6,
          "avgViewsPerJob": 43,
          "avgApplicationsPerJob": 3
        },
        "syncHistory": {
          "total": 4,
          "successful": 4,
          "failed": 0
        },
        "topPerformingJobs": [
          {
            "id": "abc123",
            "title": "Développeur Full Stack",
            "views": 50,
            "applications": 4,
            "conversionRate": "8.00"
          }
        ]
      }
    }
  }
}
```

---

### GET /api/reports/weekly

Génère un rapport hebdomadaire (7 derniers jours).

**Exemple:**
```bash
curl "http://localhost:3000/api/reports/weekly"
```

**Réponse:** Même format que `/api/reports/daily` avec `type: "WEEKLY"`

---

### GET /api/reports/monthly

Génère un rapport mensuel (30 derniers jours).

**Exemple:**
```bash
curl "http://localhost:3000/api/reports/monthly"
```

**Réponse:** Même format que `/api/reports/daily` avec `type: "MONTHLY"`

---

### GET /api/reports/custom

Génère un rapport pour une période personnalisée.

**Query Parameters:**
- `startDate` (string, requis) - Date de début (ISO 8601)
- `endDate` (string, requis) - Date de fin (ISO 8601)

**Exemple:**
```bash
curl "http://localhost:3000/api/reports/custom?startDate=2025-01-01&endDate=2025-01-15"
```

**Réponse 200 OK:**
Même format que `/api/reports/daily` avec `type: "CUSTOM"`

**Réponse 400 Bad Request:**
```json
{
  "status": "fail",
  "message": "Start date and end date are required"
}
```

---

### GET /api/reports/:id/export

Exporte un rapport dans un format spécifique.

**Path Parameters:**
- `id` (string, requis) - ID du rapport

**Query Parameters:**
- `format` (string, optionnel, default: pdf) - Format d'export: `pdf`, `csv`, `json`

**Exemple:**
```bash
curl "http://localhost:3000/api/reports/report123/export?format=pdf" -o report.pdf
```

**Réponse 200 OK:**
Fichier téléchargé au format demandé.

**Réponse 404 Not Found:**
```json
{
  "status": "fail",
  "message": "Report not found"
}
```

---

## Codes d'erreur

### Codes HTTP standard

- `200 OK` - Requête réussie
- `201 Created` - Ressource créée avec succès
- `400 Bad Request` - Paramètres invalides
- `404 Not Found` - Ressource introuvable
- `429 Too Many Requests` - Rate limit dépassé
- `500 Internal Server Error` - Erreur serveur

### Format de réponse d'erreur

**Développement:**
```json
{
  "status": "error",
  "error": {
    "name": "ValidationError",
    "message": "Invalid input"
  },
  "message": "Invalid input",
  "stack": "Error: Invalid input\n    at ..."
}
```

**Production:**
```json
{
  "status": "error",
  "message": "Something went wrong"
}
```

---

## Rate Limiting

L'API applique un rate limiting de **100 requêtes par 15 minutes** par adresse IP.

Si vous dépassez la limite:
```json
{
  "status": "error",
  "message": "Too many requests, please try again later"
}
```

---

## Exemples complets

### Workflow complet: Créer → Modifier → Supprimer

```bash
# 1. Créer une annonce
RESPONSE=$(curl -s -X POST "http://localhost:3000/api/jobs" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "DevOps Engineer",
    "description": "We are looking for...",
    "location": "Lyon",
    "contractType": "CDI",
    "salary": "50-60K€"
  }')

# Extraire l'ID
JOB_ID=$(echo $RESPONSE | jq -r '.data.job.id')

# 2. Modifier l'annonce
curl -X PUT "http://localhost:3000/api/jobs/$JOB_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Senior DevOps Engineer",
    "salary": "60-70K€"
  }'

# 3. Synchroniser
curl -X POST "http://localhost:3000/api/jobs/sync"

# 4. Générer un rapport
curl "http://localhost:3000/api/reports/daily" > report.json

# 5. Supprimer l'annonce
curl -X DELETE "http://localhost:3000/api/jobs/$JOB_ID"
```

---

## Postman Collection

Importez cette collection Postman pour tester l'API:

```json
{
  "info": {
    "name": "APEC Job Manager API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Health Check",
      "request": {
        "method": "GET",
        "url": "{{baseUrl}}/api/health"
      }
    },
    {
      "name": "Get All Jobs",
      "request": {
        "method": "GET",
        "url": {
          "raw": "{{baseUrl}}/api/jobs?limit=10",
          "host": ["{{baseUrl}}"],
          "path": ["api", "jobs"],
          "query": [{"key": "limit", "value": "10"}]
        }
      }
    }
  ],
  "variable": [
    {
      "key": "baseUrl",
      "value": "http://localhost:3000"
    }
  ]
}
```

---

Pour plus d'informations, consultez le [README.md](../README.md) principal.
