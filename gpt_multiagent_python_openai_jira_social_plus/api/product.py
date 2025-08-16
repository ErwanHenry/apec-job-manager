from http.server import BaseHTTPRequestHandler
import json

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        
        response = {
            "feature_name": "systeme_reputation_communautaire",
            "problem_statement": "Les utilisateurs ont besoin d'un système de réputation fiable pour évaluer la qualité des services BlablaKAS et KAScomodation et faire des choix éclairés",
            "scope_in": [
                "Système de notation 1-5 étoiles",
                "Commentaires textuels avec modération",
                "Badges de confiance communautaire",
                "Historique complet des évaluations",
                "Algorithme de réputation pondérée",
                "Interface mobile intuitive"
            ],
            "scope_out": [
                "Système de paiement intégré",
                "Résolution automatique des litiges",
                "Intégration réseaux sociaux externes",
                "Géolocalisation des évaluations"
            ],
            "user_stories": [
                {
                    "role": "utilisateur BlablaKAS",
                    "need": "évaluer mon conducteur après le trajet",
                    "goal": "partager mon expérience et aider la communauté à faire de meilleurs choix"
                },
                {
                    "role": "hôte KAScomodation",
                    "need": "consulter les évaluations de mes invités potentiels", 
                    "goal": "prendre des décisions éclairées sur les demandes de réservation"
                },
                {
                    "role": "nouveau membre de la communauté",
                    "need": "comprendre la réputation des autres utilisateurs",
                    "goal": "faire confiance à la plateforme rapidement et en sécurité"
                }
            ],
            "acceptance": [
                {
                    "given": "un trajet BlablaKAS terminé avec succès",
                    "when": "l'utilisateur ouvre l'application dans les 24h",
                    "then": "une invitation à évaluer le trajet apparaît avec un formulaire simple"
                },
                {
                    "given": "une évaluation soumise par un utilisateur",
                    "when": "le système traite et valide la note",
                    "then": "la réputation de l'utilisateur évalué se met à jour en temps réel"
                },
                {
                    "given": "un utilisateur consulte le profil d'un autre membre",
                    "when": "il accède à la section évaluations",
                    "then": "il voit la note moyenne, le nombre total d'avis et les 3 commentaires les plus récents"
                }
            ],
            "risks": [
                "Manipulation des évaluations via de faux comptes",
                "Commentaires inappropriés ou diffamatoires",
                "Biais discriminatoires dans les évaluations",
                "Impact sur les performances avec un grand volume",
                "Pression sociale négative sur les utilisateurs"
            ],
            "metrics": [
                "Taux de participation aux évaluations (objectif: >70%)",
                "Score moyen de satisfaction (objectif: >4.2/5)",
                "Temps de modération des commentaires (objectif: <2h)",
                "Réduction du nombre de litiges (objectif: -30%)",
                "Taux de rétention utilisateurs (objectif: +15%)"
            ],
            "tickets": [
                {
                    "title": "Créer le modèle de données réputation",
                    "description": "Conception et implémentation de la base de données pour stocker notes, commentaires et historique complet",
                    "labels": ["backend", "database", "kaspa"]
                },
                {
                    "title": "Interface d'évaluation mobile",
                    "description": "Conception et développement des écrans de notation après trajet/séjour avec UX optimisée",
                    "labels": ["frontend", "mobile", "ux"]
                },
                {
                    "title": "Algorithme de réputation pondérée",
                    "description": "Développement d'un algorithme intelligent tenant compte de l'ancienneté et de la fiabilité des évaluateurs",
                    "labels": ["algorithm", "backend", "kaspa"]
                },
                {
                    "title": "Système de modération automatique",
                    "description": "IA de détection de contenu inapproprié et workflow de validation manuelle",
                    "labels": ["ai", "moderation", "backend"]
                }
            ]
        }
        
        self.wfile.write(json.dumps(response, ensure_ascii=False).encode('utf-8'))
    
    def do_POST(self):
        self.do_GET()