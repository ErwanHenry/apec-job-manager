from http.server import BaseHTTPRequestHandler
import json

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        
        response = {
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
                },
                "docs": "Visit GitHub for full documentation"
            }
        }
        
        self.wfile.write(json.dumps(response, ensure_ascii=False).encode('utf-8'))
    
    def do_POST(self):
        self.do_GET()