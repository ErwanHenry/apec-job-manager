# Guide de Synchronisation Manuelle APEC

## Vue d'ensemble

En raison des limitations de l'automatisation serverless avec l'APEC, nous proposons une solution de synchronisation manuelle via un bookmarklet. Cette approche est :
- ✅ **Fiable** : Fonctionne dans votre navigateur déjà connecté
- ✅ **Rapide** : Extraction en quelques secondes
- ✅ **Sécurisée** : Aucune donnée d'authentification stockée
- ✅ **Simple** : Un clic suffit

## Méthode 1 : Bookmarklet (Recommandée)

### Installation

1. **Créer un nouveau favori** dans votre navigateur
2. **Nom du favori** : "Extraire APEC"
3. **URL** : Copier-coller ce code complet :

```javascript
javascript:(function(){var s=document.createElement('script');s.src='https://next-lmrcl0ank-erwan-henrys-projects.vercel.app/apec-extractor-bookmarklet.js';document.body.appendChild(s);})()
```

### Utilisation

1. **Connectez-vous** à l'APEC : https://www.apec.fr/recruteur.html
2. **Naviguez** vers vos offres : https://www.apec.fr/recruteur/mon-espace/mes-offres.html
3. **Cliquez** sur le bookmarklet "Extraire APEC"
4. **Attendez** quelques secondes - une fenêtre vous indiquera le statut
5. **Vérifiez** vos offres dans le dashboard

### Capture d'écran

```
┌────────────────────────────────────┐
│  Extraction des offres APEC        │
│                                    │
│  ✓ 15 offre(s) trouvée(s)         │
│  📤 Envoi vers le serveur...       │
│                                    │
│  ✓ Synchronisation réussie !       │
│  Créées: 3                         │
│  Mises à jour: 10                  │
│  Inchangées: 2                     │
│                                    │
│          [ Fermer ]                │
└────────────────────────────────────┘
```

## Méthode 2 : Script Console

Si vous préférez ne pas utiliser de bookmarklet, vous pouvez exécuter le script directement dans la console du navigateur :

1. **Ouvrez** la console développeur (F12)
2. **Naviguez** vers : https://www.apec.fr/recruteur/mon-espace/mes-offres.html
3. **Collez** ce code dans la console :

```javascript
(async function() {
  const response = await fetch('https://next-lmrcl0ank-erwan-henrys-projects.vercel.app/apec-extractor-bookmarklet.js');
  const code = await response.text();
  eval(code);
})();
```

4. **Appuyez** sur Entrée

## Méthode 3 : API REST (Développeurs)

Pour une intégration personnalisée, vous pouvez envoyer les données directement via l'API :

### Endpoint

```
POST https://next-lmrcl0ank-erwan-henrys-projects.vercel.app/api/jobs/manual-import
```

### Headers

```
Content-Type: application/json
```

### Body

```json
{
  "jobs": [
    {
      "id": "apec-12345",
      "title": "Développeur Full Stack Senior",
      "status": "published",
      "views": 42,
      "applications": 5,
      "publishedDate": "2025-10-27"
    }
  ]
}
```

### Response

```json
{
  "success": true,
  "message": "Jobs imported successfully",
  "created": 1,
  "updated": 0,
  "unchanged": 0,
  "errors": 0,
  "total": 1
}
```

### Exemple cURL

```bash
curl -X POST https://next-lmrcl0ank-erwan-henrys-projects.vercel.app/api/jobs/manual-import \
  -H "Content-Type: application/json" \
  -d '{
    "jobs": [
      {
        "id": "apec-001",
        "title": "Chef de Projet Digital",
        "status": "published",
        "views": 38,
        "applications": 3,
        "publishedDate": "2025-10-26"
      }
    ]
  }'
```

### Exemple JavaScript

```javascript
const jobs = [
  {
    id: 'apec-001',
    title: 'Data Scientist',
    status: 'published',
    views: 51,
    applications: 8,
    publishedDate: '2025-10-25'
  }
];

fetch('https://next-lmrcl0ank-erwan-henrys-projects.vercel.app/api/jobs/manual-import', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ jobs }),
})
  .then(response => response.json())
  .then(data => console.log('Success:', data))
  .catch(error => console.error('Error:', error));
```

## Méthode 4 : API Officielle APEC (Future)

L'APEC pourrait proposer une API officielle pour les recruteurs. Voici comment la demander :

### Contact APEC

1. **Email** : Contactez votre conseiller APEC
2. **Objet** : "Demande d'accès API pour intégration"
3. **Contenu** :
   - Expliquez votre besoin d'automatisation
   - Demandez s'ils proposent une API REST
   - Mentionnez que c'est pour gérer vos propres offres

### Documentation API (si disponible)

- URL de base : `https://api.apec.fr`
- Authentication : Probablement OAuth 2.0 ou API Key
- Endpoints attendus :
  - `GET /recruiter/jobs` - Liste des offres
  - `GET /recruiter/jobs/{id}` - Détails d'une offre
  - `GET /recruiter/jobs/{id}/applications` - Candidatures

Si l'API existe, contactez-moi pour l'intégrer !

## Dépannage

### Le bookmarklet ne fonctionne pas

**Problème** : Rien ne se passe quand je clique

**Solutions** :
1. Vérifiez que vous êtes bien sur la page des offres APEC
2. Actualisez la page et réessayez
3. Vérifiez la console développeur (F12) pour les erreurs
4. Assurez-vous que JavaScript n'est pas bloqué

### Aucune offre n'est détectée

**Problème** : Le bookmarklet indique "0 offres trouvées"

**Solutions** :
1. Vérifiez que vous avez bien des offres publiées
2. Attendez que la page soit complètement chargée
3. Essayez de scroller pour que toutes les offres se chargent
4. Utilisez la Méthode 3 (API REST) pour envoyer manuellement

### Erreur CORS

**Problème** : "Cross-Origin Request Blocked"

**Solution** : L'endpoint supporte CORS. Si l'erreur persiste :
1. Vérifiez que vous utilisez la bonne URL
2. Essayez depuis localhost en développement
3. Contactez le support

## Fréquence de Synchronisation

### Recommandations

- **Quotidienne** : Une fois par jour le matin
- **Hebdomadaire** : Tous les lundis si peu d'activité
- **On-demand** : Après publication d'une nouvelle offre

### Automatisation (Optionnel)

Vous pouvez configurer un rappel quotidien :
1. Créez une tâche dans votre gestionnaire de tâches
2. À 9h chaque matin : "Synchroniser APEC"
3. Cela prendra 30 secondes

## Support

Pour toute question ou problème :

1. **Vérifiez** ce guide en premier
2. **Consultez** les logs dans la console (F12)
3. **Testez** avec la Méthode 3 (API REST) pour isoler le problème
4. **Contactez** le support technique avec :
   - Navigateur utilisé
   - Capture d'écran de l'erreur
   - Message d'erreur dans la console

## Prochaines Améliorations

- [ ] Extension Chrome dédiée
- [ ] Synchronisation automatique (si API APEC disponible)
- [ ] Notifications en temps réel
- [ ] Export/Import CSV

---

**Dernière mise à jour** : 2025-10-27
