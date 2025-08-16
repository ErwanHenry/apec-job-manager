def handler(request):
    import json
    
    headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
    }
    
    response_data = {
        "feature_name": "systeme_reputation_communautaire",
        "problem_statement": "Les utilisateurs ont besoin d'un système de réputation fiable pour évaluer la qualité des services BlablaKAS et KAScomodation",
        "scope_in": [
            "Système de notation 1-5 étoiles",
            "Commentaires textuels modérés", 
            "Badges de confiance communautaire",
            "Historique des évaluations",
            "Algorithme de réputation pondérée"
        ],
        "scope_out": [
            "Système de paiement intégré",
            "Résolution automatique des litiges",
            "Intégration réseaux sociaux externes"
        ],
        "user_stories": [
            {
                "role": "utilisateur BlablaKAS",
                "need": "évaluer mon conducteur après le trajet",
                "goal": "partager mon expérience et aider la communauté"
            },
            {
                "role": "hôte KAScomodation", 
                "need": "voir les évaluations de mes invités potentiels",
                "goal": "prendre des décisions éclairées sur les réservations"
            },
            {
                "role": "nouveau membre",
                "need": "comprendre la réputation des autres utilisateurs",
                "goal": "faire confiance à la plateforme rapidement"
            }
        ],
        "acceptance": [
            {
                "given": "un trajet BlablaKAS terminé",
                "when": "l'utilisateur ouvre l'application",
                "then": "une invitation à évaluer apparaît avec formulaire simple"
            },
            {
                "given": "une évaluation soumise",
                "when": "le système traite la note",
                "then": "la réputation de l'utilisateur évalué se met à jour instantanément"
            },
            {
                "given": "un utilisateur consulte un profil",
                "when": "il regarde les évaluations", 
                "then": "il voit la note moyenne et les 3 derniers commentaires"
            }
        ],
        "risks": [
            "Manipulation des évaluations (faux comptes)",
            "Commentaires inappropriés ou diffamatoires",
            "Biais dans les évaluations (discrimination)",
            "Performance système avec volume important"
        ],
        "metrics": [
            "Taux de participation aux évaluations (>70%)",
            "Score moyen de satisfaction (>4.2/5)",
            "Temps de modération des commentaires (<2h)",
            "Réduction des litiges (-30%)"
        ],
        "tickets": [
            {
                "title": "Créer le modèle de données réputation",
                "description": "Base de données pour stocker notes, commentaires et historique",
                "labels": ["backend", "database", "kaspa"]
            },
            {
                "title": "Interface d'évaluation mobile",
                "description": "Écrans de notation après trajet/séjour", 
                "labels": ["frontend", "mobile", "ux"]
            },
            {
                "title": "Algorithme de réputation pondérée",
                "description": "Calcul intelligent tenant compte de l'ancienneté et fiabilité",
                "labels": ["algorithm", "backend", "kaspa"]
            }
        ]
    }
    
    return {
        'statusCode': 200,
        'headers': headers,
        'body': json.dumps(response_data, ensure_ascii=False)
    }