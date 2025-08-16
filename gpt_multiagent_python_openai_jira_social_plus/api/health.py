from http.server import BaseHTTPRequestHandler
import json

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        
        response = {
            "status": "healthy",
            "service": "kaspa-community-tool",
            "platform": "vercel",
            "timestamp": "2024-03-20T10:00:00Z"
        }
        
        self.wfile.write(json.dumps(response).encode('utf-8'))