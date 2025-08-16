def app(environ, start_response):
    """Simple WSGI application for Vercel"""
    import json
    
    # Response data
    data = {
        "message": "🚀 Kaspa Community Tool API",
        "version": "0.3.0",
        "status": "working",
        "platform": "vercel",
        "services": ["BlablaKAS", "KAScomodation"],
        "endpoints": {
            "health": "/api/health",
            "blablakas": "/api/blablakas",
            "kascomodation": "/api/kascomodation", 
            "social": "/api/social",
            "product": "/api/product"
        }
    }
    
    response_body = json.dumps(data, ensure_ascii=False).encode('utf-8')
    
    status = '200 OK'
    headers = [
        ('Content-Type', 'application/json'),
        ('Content-Length', str(len(response_body))),
        ('Access-Control-Allow-Origin', '*')
    ]
    
    start_response(status, headers)
    return [response_body]