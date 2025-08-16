from http.server import BaseHTTPRequestHandler
import json

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        
        response = {
            "topic": "support_blablakas",
            "faqs": [
                {
                    "question": "Comment annuler un trajet BlablaKAS ?",
                    "answer": "Vous pouvez annuler votre trajet jusqu'à 1h avant le départ via l'application mobile. Après ce délai, contactez notre support."
                },
                {
                    "question": "Que faire si le conducteur annule ?",
                    "answer": "En cas d'annulation du conducteur, vous recevez un remboursement automatique + 5€ de crédit. Notre équipe vous aide à trouver une alternative."
                },
                {
                    "question": "Comment contacter mon conducteur ?",
                    "answer": "Utilisez la messagerie sécurisée intégrée dans l'app BlablaKAS pour communiquer avec votre conducteur."
                }
            ],
            "macros": [
                {
                    "name": "annulation_standard",
                    "audience": "frontline",
                    "text": "Votre annulation a été traitée avec succès. Le remboursement sera effectué sous 3-5 jours ouvrés, plus un crédit de 5€ ajouté à votre compte.",
                    "requires_approval": False
                },
                {
                    "name": "incident_conducteur",
                    "audience": "frontline", 
                    "text": "Nous prenons ce signalement très au sérieux. Une enquête sera ouverte et vous serez recontacté sous 24h maximum.",
                    "requires_approval": True
                }
            ],
            "runbook": [
                {
                    "step": 1,
                    "title": "Vérification identité",
                    "instruction": "Demander email et numéro de téléphone associés au compte",
                    "expected_result": "Confirmation de l'identité utilisateur"
                },
                {
                    "step": 2,
                    "title": "Classification problème",
                    "instruction": "Identifier: annulation, incident, remboursement, technique",
                    "expected_result": "Catégorie correcte du problème"
                }
            ],
            "escalation": [
                {
                    "condition": "probleme_securite",
                    "to": "equipe_securite",
                    "sla_minutes": 30
                },
                {
                    "condition": "incident_grave",
                    "to": "responsable_operations",
                    "sla_minutes": 60
                }
            ]
        }
        
        self.wfile.write(json.dumps(response, ensure_ascii=False).encode('utf-8'))
    
    def do_POST(self):
        self.do_GET()