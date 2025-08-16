def app(environ, start_response):
    """Health check endpoint"""
    import json
    from datetime import datetime, timezone
    
    data = {
        "status": "healthy",
        "service": "kaspa-community-tool",
        "platform": "vercel", 
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "version": "0.3.0"
    }
    
    response_body = json.dumps(data).encode('utf-8')
    
    status = '200 OK'
    headers = [
        ('Content-Type', 'application/json'),
        ('Access-Control-Allow-Origin', '*')
    ]
    
    start_response(status, headers)
    return [response_body]