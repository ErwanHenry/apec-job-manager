from http.server import BaseHTTPRequestHandler
import json
import urllib.parse

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        # Parse the URL path
        parsed_path = urllib.parse.urlparse(self.path)
        path = parsed_path.path
        
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        
        # Route based on path
        if path == '/' or path == '/api/main':
            response = {
                "message": "🚀 Kaspa Community Tool API",
                "version": "0.3.0",
                "status": "operational",
                "platform": "vercel",
                "services": ["BlablaKAS", "KAScomodation"],
                "github": "https://github.com/ErwanHenry/kaspa-community-tool",
                "endpoints": {
                    "health": "/api/health",
                    "route": "/api/route",
                    "social": "/api/social",
                    "product": "/api/product"
                }
            }
        elif path == '/health' or path == '/api/health':
            response = {
                "status": "healthy",
                "service": "kaspa-community-tool",
                "platform": "vercel"
            }
        else:
            response = {
                "error": "Not found",
                "available_endpoints": ["/", "/health", "/api/main", "/api/health"]
            }
        
        self.wfile.write(json.dumps(response, ensure_ascii=False).encode('utf-8'))
    
    def do_POST(self):
        self.do_GET()