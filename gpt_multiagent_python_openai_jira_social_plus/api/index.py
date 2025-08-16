def handler(request):
    import json
    
    # Headers pour CORS
    headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
    }
    
    # Données de base
    response_data = {
        "message": "🚀 Kaspa Community Tool API",
        "version": "0.3.0",
        "status": "operational",
        "platform": "vercel",
        "services": ["BlablaKAS", "KAScomodation"],
        "endpoints": {
            "health": "/api/health",
            "route": "/api/route", 
            "agents": {
                "blablakas": "/api/blablakas",
                "kascomodation": "/api/kascomodation", 
                "social": "/api/social",
                "product": "/api/product"
            }
        }
    }
    
    return {
        'statusCode': 200,
        'headers': headers,
        'body': json.dumps(response_data, ensure_ascii=False)
    }