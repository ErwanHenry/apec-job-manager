from http.server import BaseHTTPRequestHandler
import json
from datetime import datetime, timedelta

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        
        # Generate scheduled times
        now = datetime.utcnow()
        
        response = {
            "campaign": "kaspa_community_showcase",
            "posts": [
                {
                    "platform": "x",
                    "text": "🚀 BlablaKAS révolutionne le covoiturage avec la blockchain #Kaspa ! Sécurité, transparence et communauté au cœur de chaque trajet. #BlablaKAS #KaspaCommunity #Web3",
                    "media_urls": [],
                    "scheduled_at": (now + timedelta(hours=2)).isoformat() + "Z",
                    "requires_approval": False
                },
                {
                    "platform": "linkedin",
                    "text": "KAScomodation transforme l'hébergement collaboratif grâce à la technologie Kaspa. Une nouvelle approche de l'économie du partage, basée sur la confiance et la décentralisation.",
                    "media_urls": [],
                    "scheduled_at": (now + timedelta(hours=6)).isoformat() + "Z",
                    "requires_approval": False
                },
                {
                    "platform": "x", 
                    "text": "🏠 Découvrez KAScomodation : l'hébergement entre particuliers réinventé ! Réservations sécurisées, paiements transparents, communauté Kaspa unie. #KAScomodation #Kaspa",
                    "media_urls": [],
                    "scheduled_at": (now + timedelta(days=1)).isoformat() + "Z",
                    "requires_approval": False
                }
            ],
            "reports": [
                {
                    "period": "7d",
                    "kpis": ["impressions", "engagement", "ctr"]
                },
                {
                    "period": "30d",
                    "kpis": ["impressions", "engagement", "subs"]
                }
            ]
        }
        
        self.wfile.write(json.dumps(response, ensure_ascii=False).encode('utf-8'))
    
    def do_POST(self):
        self.do_GET()