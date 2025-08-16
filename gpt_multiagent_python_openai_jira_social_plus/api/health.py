def handler(request):
    import json
    from datetime import datetime, timezone
    
    headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
    }
    
    response_data = {
        "status": "healthy",
        "service": "kaspa-community-tool", 
        "platform": "vercel",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "version": "0.3.0",
        "endpoints_available": [
            "/api/",
            "/api/health", 
            "/api/route",
            "/api/blablakas",
            "/api/kascomodation",
            "/api/social", 
            "/api/product"
        ]
    }
    
    return {
        'statusCode': 200,
        'headers': headers,
        'body': json.dumps(response_data, ensure_ascii=False)
    }