#!/usr/bin/env python3
"""
Application de démo sans OpenAI - pour tester l'interface
"""

from fastapi import FastAPI
from pydantic import BaseModel
from typing import Any, Dict
from datetime import datetime, timezone

app = FastAPI(title="Kaspa Community Tool - DEMO", version="0.3.0-demo")

class RouteIn(BaseModel):
    text: str

class ActIn(BaseModel):
    input: str

class FeatureLaunchIn(BaseModel):
    idea: str

@app.get("/")
def root():
    return {
        "message": "🚀 Kaspa Community Tool - Mode Démo",
        "status": "running",
        "endpoints": [
            "/docs - Interface Swagger",
            "/route - Router les requêtes",
            "/agents/{name}/act - Exécuter un agent",
            "/workflow/feature_launch - Workflow complet"
        ]
    }

@app.post("/route")
def route(body: RouteIn) -> Dict[str, Any]:
    text = body.text.lower()
    
    # Simple routing logic
    if any(word in text for word in ["faq", "support", "incident", "blablakas"]):
        return {"agent": "blablakas_ops", "confidence": 0.95}
    elif any(word in text for word in ["réservation", "hébergement", "kascomodation"]):
        return {"agent": "kascomodation_ops", "confidence": 0.90}
    elif any(word in text for word in ["post", "social", "tweet", "campagne"]):
        return {"agent": "social_manager", "confidence": 0.88}
    else:
        return {"agent": "product_builder", "confidence": 0.75}

@app.post("/agents/blablakas_ops/act")
def blablakas_ops_demo(body: ActIn) -> Dict[str, Any]:
    return {
        "topic": "support_blablakas",
        "faqs": [
            {
                "question": "Comment annuler un trajet BlablaKAS ?",
                "answer": "Vous pouvez annuler votre trajet jusqu'à 1h avant le départ dans l'app. Au-delà, contactez le support."
            },
            {
                "question": "Que faire si le conducteur annule ?",
                "answer": "Vous recevrez un remboursement automatique + 5€ de crédit. Notre équipe vous aidera à trouver une alternative."
            }
        ],
        "macros": [
            {
                "name": "cancellation_response",
                "audience": "frontline",
                "text": "Nous comprenons votre frustration. Votre remboursement + crédit ont été traités. Puis-je vous aider à trouver un autre trajet ?",
                "requires_approval": False
            }
        ],
        "escalation": [
            {
                "condition": "safety_concern",
                "to": "safety_team",
                "sla_minutes": 30
            }
        ]
    }

@app.post("/agents/kascomodation_ops/act")
def kascomodation_ops_demo(body: ActIn) -> Dict[str, Any]:
    return {
        "topic": "accommodation_booking",
        "reservations": [
            {
                "client_ref": "demo_user_001",
                "start": datetime.now(timezone.utc).isoformat(),
                "end": datetime.now(timezone.utc).isoformat(),
                "resource_id": "berlin_apt_01",
                "status": "tentative",
                "notes": "Réservation générée en mode démo"
            }
        ],
        "overbook_risk": "low"
    }

@app.post("/agents/social_manager/act")
def social_manager_demo(body: ActIn) -> Dict[str, Any]:
    return {
        "campaign": "kaspa_community_demo",
        "posts": [
            {
                "platform": "x",
                "text": "🚀 Découvrez BlablaKAS : le covoiturage communautaire alimenté par #Kaspa ! Partagez vos trajets en toute sécurité. #BlablaKAS #KaspaCommunity",
                "scheduled_at": datetime.now(timezone.utc).isoformat(),
                "requires_approval": False
            },
            {
                "platform": "linkedin",
                "text": "KAScomodation révolutionne l'hébergement communautaire avec la blockchain Kaspa. Une nouvelle façon de voyager ensemble ! #Kaspa #KAScomodation",
                "scheduled_at": datetime.now(timezone.utc).isoformat(),
                "requires_approval": False
            }
        ]
    }

@app.post("/agents/product_builder/act")
def product_builder_demo(body: ActIn) -> Dict[str, Any]:
    return {
        "feature_name": "Système de notation communautaire",
        "problem_statement": "Les utilisateurs ont besoin d'évaluer la qualité des services pour maintenir la confiance",
        "scope_in": [
            "Notation 1-5 étoiles",
            "Commentaires textuels",
            "Modération automatique"
        ],
        "scope_out": [
            "Système de réclamations",
            "Remboursements automatiques"
        ],
        "user_stories": [
            {
                "role": "utilisateur BlablaKAS",
                "need": "noter mon trajet",
                "goal": "partager mon expérience avec la communauté"
            }
        ],
        "acceptance": [
            {
                "given": "un trajet terminé",
                "when": "l'utilisateur ouvre l'app",
                "then": "il voit une invitation à noter le trajet"
            }
        ],
        "metrics": [
            "Taux de participation aux notations",
            "Score moyen de satisfaction"
        ]
    }

@app.post("/workflow/feature_launch")
def workflow_demo(body: FeatureLaunchIn) -> Dict[str, Any]:
    return {
        "spec": {
            "feature_name": f"Fonctionnalité : {body.idea}",
            "status": "spec_generated"
        },
        "tickets": {
            "ok": True,
            "created": [
                {"key": "DEMO-1", "title": "Implémentation backend"},
                {"key": "DEMO-2", "title": "Interface utilisateur"}
            ]
        },
        "social": {
            "ok": True,
            "scheduled_posts": 2,
            "campaign": "feature_announcement"
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8001)