def handler(request):
    import json
    from datetime import datetime, timezone, timedelta
    
    headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
    }
    
    # Timestamps pour scheduling
    now = datetime.now(timezone.utc)
    post1_time = now + timedelta(hours=2)
    post2_time = now + timedelta(hours=6) 
    post3_time = now + timedelta(days=1)
    
    response_data = {
        "campaign": "kaspa_community_showcase",
        "posts": [
            {
                "platform": "x",
                "text": "🚀 BlablaKAS révolutionne le covoiturage avec la blockchain #Kaspa ! Sécurité, transparence et communauté au cœur de chaque trajet. #BlablaKAS #KaspaCommunity #Web3",
                "media_urls": [],
                "scheduled_at": post1_time.isoformat(),
                "requires_approval": False
            },
            {
                "platform": "linkedin",
                "text": "KAScomodation transforme l'hébergement collaboratif grâce à la technologie Kaspa. Une nouvelle approche de l'économie du partage, basée sur la confiance et la décentralisation.",
                "media_urls": [],
                "scheduled_at": post2_time.isoformat(), 
                "requires_approval": False
            },
            {
                "platform": "x",
                "text": "🏠 Découvrez KAScomodation : l'hébergement entre particuliers réinventé ! Réservations sécurisées, paiements transparents, communauté Kaspa unie. #KAScomodation #Kaspa",
                "media_urls": [],
                "scheduled_at": post3_time.isoformat(),
                "requires_approval": False
            }
        ],
        "reports": [
            {
                "period": "7d",
                "kpis": ["impressions", "engagement", "ctr"]
            },
            {
                "period": "30d", 
                "kpis": ["impressions", "engagement", "subs"]
            }
        ]
    }
    
    return {
        'statusCode': 200,
        'headers': headers,
        'body': json.dumps(response_data, ensure_ascii=False)
    }