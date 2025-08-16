from http.server import BaseHTTPRequestHandler
import json
from datetime import datetime, timedelta

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        
        # Generate example dates
        now = datetime.utcnow()
        checkin = now + timedelta(days=7)
        checkout = checkin + timedelta(days=3)
        
        response = {
            "topic": "hebergement_kascomodation",
            "reservations": [
                {
                    "client_ref": "kaspa_user_001",
                    "start": checkin.isoformat() + "Z",
                    "end": checkout.isoformat() + "Z",
                    "resource_id": "berlin_apt_zentrum_01",
                    "status": "tentative",
                    "notes": "Appartement centre Berlin, 2 personnes, proche transports"
                },
                {
                    "client_ref": "kaspa_user_002",
                    "start": (checkin + timedelta(days=10)).isoformat() + "Z",
                    "end": (checkout + timedelta(days=12)).isoformat() + "Z", 
                    "resource_id": "prague_house_02",
                    "status": "confirmed",
                    "notes": "Maison complète Prague, 4 personnes, jardin privé"
                }
            ],
            "maintenance": [
                {
                    "start": (now + timedelta(days=2)).isoformat() + "Z",
                    "end": (now + timedelta(days=2, hours=4)).isoformat() + "Z",
                    "resource_id": "berlin_apt_zentrum_01",
                    "description": "Nettoyage approfondi et vérification équipements"
                }
            ],
            "overbook_risk": "low"
        }
        
        self.wfile.write(json.dumps(response, ensure_ascii=False).encode('utf-8'))
    
    def do_POST(self):
        self.do_GET()