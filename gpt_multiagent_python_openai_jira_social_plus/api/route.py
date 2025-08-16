def handler(request):
    import json
    import urllib.parse
    
    headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
    }
    
    # Simuler routage intelligent basé sur mots-clés
    # En production, on analyserait le body de la requête POST
    
    # Mots-clés pour chaque agent
    keywords = {
        "blablakas_ops": ["faq", "support", "incident", "blablakas", "covoiturage", "trajet", "conducteur"],
        "kascomodation_ops": ["réservation", "hébergement", "kascomodation", "logement", "appartement", "maison"],
        "social_manager": ["post", "social", "tweet", "campagne", "linkedin", "communication", "marketing"],
        "product_builder": ["feature", "fonctionnalité", "développement", "spécification", "produit", "amélioration"]
    }
    
    # Exemple de routage (normalement basé sur l'input utilisateur)
    example_routes = [
        {
            "input_example": "Créer une FAQ pour les annulations BlablaKAS",
            "agent": "blablakas_ops",
            "confidence": 0.95,
            "reasoning": "Mots-clés détectés: FAQ, annulations, BlablaKAS"
        },
        {
            "input_example": "Planifier des réservations pour Berlin",
            "agent": "kascomodation_ops", 
            "confidence": 0.92,
            "reasoning": "Mots-clés détectés: planifier, réservations, hébergement"
        },
        {
            "input_example": "Campagne social media pour nouveau feature",
            "agent": "social_manager",
            "confidence": 0.88,
            "reasoning": "Mots-clés détectés: campagne, social media, communication"
        },
        {
            "input_example": "Spécifier un système de notation",
            "agent": "product_builder",
            "confidence": 0.90,
            "reasoning": "Mots-clés détectés: spécifier, système, développement"
        }
    ]
    
    response_data = {
        "service": "intelligent_routing",
        "status": "operational",
        "available_agents": list(keywords.keys()),
        "routing_examples": example_routes,
        "usage": {
            "method": "POST",
            "endpoint": "/api/route",
            "body": {"text": "votre demande ici"},
            "response": {"agent": "nom_agent", "confidence": 0.95}
        }
    }
    
    return {
        'statusCode': 200,
        'headers': headers,
        'body': json.dumps(response_data, ensure_ascii=False)
    }