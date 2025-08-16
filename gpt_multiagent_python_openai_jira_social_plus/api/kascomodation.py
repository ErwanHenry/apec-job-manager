def handler(request):
    import json
    from datetime import datetime, timezone, timedelta
    
    headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
    }
    
    # Dates d'exemple
    now = datetime.now(timezone.utc)
    checkin = now + timedelta(days=7)
    checkout = checkin + timedelta(days=3)
    
    response_data = {
        "topic": "hebergement_kascomodation",
        "reservations": [
            {
                "client_ref": "kaspa_user_001",
                "start": checkin.isoformat(),
                "end": checkout.isoformat(), 
                "resource_id": "berlin_apt_zentrum_01",
                "status": "tentative",
                "notes": "Appartement centre Berlin, 2 personnes, proche transport"
            },
            {
                "client_ref": "kaspa_user_002", 
                "start": (checkin + timedelta(days=10)).isoformat(),
                "end": (checkout + timedelta(days=12)).isoformat(),
                "resource_id": "prague_house_02",
                "status": "confirmed",
                "notes": "Maison complète Prague, 4 personnes, jardin"
            }
        ],
        "maintenance": [
            {
                "start": (now + timedelta(days=2)).isoformat(),
                "end": (now + timedelta(days=2, hours=4)).isoformat(),
                "resource_id": "berlin_apt_zentrum_01", 
                "description": "Nettoyage approfondi et vérification équipements"
            }
        ],
        "overbook_risk": "low"
    }
    
    return {
        'statusCode': 200,
        'headers': headers,
        'body': json.dumps(response_data, ensure_ascii=False)
    }