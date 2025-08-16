from http.server import BaseHTTPRequestHandler
import json
import urllib.parse as urlparse

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        # Parse the URL
        url_parts = urlparse.urlparse(self.path)
        path = url_parts.path
        
        # Set response headers
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        
        # Route handling
        if path == '/':
            response = {
                "message": "🚀 Kaspa Community Tool API",
                "version": "0.3.0",
                "services": ["BlablaKAS", "KAScomodation"],
                "environment": "Vercel",
                "status": "operational",
                "endpoints": {
                    "route": "/api/route",
                    "blablakas": "/api/blablakas",
                    "kascomodation": "/api/kascomodation",
                    "social": "/api/social",
                    "product": "/api/product"
                }
            }
        elif path == '/api/health':
            response = {"status": "healthy", "platform": "vercel"}
        elif path == '/api/route':
            response = {"agent": "product_builder", "confidence": 0.75}
        elif path == '/api/blablakas':
            response = {
                "topic": "support_blablakas",
                "faqs": [
                    {
                        "question": "Comment annuler un trajet BlablaKAS ?",
                        "answer": "Annulation possible jusqu'à 1h avant le départ"
                    }
                ],
                "macros": [],
                "runbook": [],
                "escalation": []
            }
        elif path == '/api/kascomodation':
            response = {
                "topic": "hebergement",
                "reservations": [],
                "maintenance": [],
                "overbook_risk": "low"
            }
        elif path == '/api/social':
            response = {
                "campaign": "kaspa_demo",
                "posts": [
                    {
                        "platform": "x",
                        "text": "🚀 BlablaKAS - Covoiturage Kaspa",
                        "scheduled_at": "2024-03-20T14:00:00Z"
                    }
                ],
                "reports": []
            }
        elif path == '/api/product':
            response = {
                "feature_name": "demo_feature",
                "problem_statement": "Améliorer l'expérience utilisateur",
                "scope_in": ["Interface", "Performance"],
                "scope_out": [],
                "user_stories": [],
                "acceptance": [],
                "risks": [],
                "metrics": [],
                "tickets": []
            }
        else:
            response = {"error": "endpoint_not_found", "path": path}
        
        # Send response
        self.wfile.write(json.dumps(response, ensure_ascii=False).encode('utf-8'))
        
    def do_POST(self):
        # Handle POST requests
        self.do_GET()