def handler(request):
    import json
    
    headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
    }
    
    # Réponse BlablaKAS démo
    response_data = {
        "topic": "support_blablakas",
        "faqs": [
            {
                "question": "Comment annuler un trajet BlablaKAS ?",
                "answer": "Vous pouvez annuler votre trajet jusqu'à 1h avant le départ dans l'application mobile. Au-delà, contactez le support."
            },
            {
                "question": "Que faire si le conducteur annule ?", 
                "answer": "Vous recevrez un remboursement automatique + 5€ de crédit. Notre équipe vous aidera à trouver une alternative."
            },
            {
                "question": "Comment contacter un conducteur ?",
                "answer": "Utilisez la messagerie intégrée dans l'app BlablaKAS pour communiquer avec votre conducteur."
            }
        ],
        "macros": [
            {
                "name": "annulation_standard",
                "audience": "frontline", 
                "text": "Votre annulation a été traitée. Remboursement sous 3-5 jours ouvrés + 5€ de crédit compensatoire.",
                "requires_approval": False
            },
            {
                "name": "probleme_conducteur",
                "audience": "frontline",
                "text": "Nous prenons ce signalement très au sérieux. Une enquête va être ouverte et vous serez recontacté sous 24h.",
                "requires_approval": True
            }
        ],
        "runbook": [
            {
                "step": 1,
                "title": "Vérifier l'identité",
                "instruction": "Demander email + numéro de téléphone",
                "expected_result": "Confirmation identité utilisateur"
            },
            {
                "step": 2, 
                "title": "Analyser le problème",
                "instruction": "Identifier la catégorie: annulation, incident, remboursement",
                "expected_result": "Classification correcte du problème"
            }
        ],
        "escalation": [
            {
                "condition": "probleme_securite",
                "to": "equipe_securite",
                "sla_minutes": 30
            },
            {
                "condition": "incident_grave",
                "to": "responsable_operations", 
                "sla_minutes": 60
            }
        ]
    }
    
    return {
        'statusCode': 200,
        'headers': headers,
        'body': json.dumps(response_data, ensure_ascii=False)
    }