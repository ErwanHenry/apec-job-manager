"""
Point d'entrée principal pour Vercel - Version simplifiée
"""
from fastapi import FastAPI
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Any, Dict
import os
import json

# Configuration pour Vercel
app = FastAPI(
    title="Kaspa Community Tool", 
    version="0.3.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Modèles Pydantic simples
class RouteRequest(BaseModel):
    text: str

class AgentRequest(BaseModel):
    input: str

# Routes de base
@app.get("/")
def root():
    return {
        "message": "🚀 Kaspa Community Tool API",
        "version": "0.3.0",
        "services": ["BlablaKAS", "KAScomodation"],
        "environment": "Vercel",
        "status": "operational",
        "endpoints": {
            "docs": "/docs",
            "route": "/route",
            "agents": "/agents/{agent_name}/act",
            "health": "/health"
        }
    }

@app.get("/health")
def health():
    return {"status": "healthy", "platform": "vercel"}

# Routage intelligent simple
@app.post("/route")
def route_request(request: RouteRequest):
    text = request.text.lower()
    
    # Logique de routage simple
    if any(keyword in text for keyword in ["faq", "support", "incident", "blablakas", "covoiturage"]):
        return {"agent": "blablakas_ops", "confidence": 0.95}
    elif any(keyword in text for keyword in ["réservation", "hébergement", "kascomodation", "logement"]):
        return {"agent": "kascomodation_ops", "confidence": 0.90}
    elif any(keyword in text for keyword in ["post", "social", "tweet", "campagne", "linkedin"]):
        return {"agent": "social_manager", "confidence": 0.88}
    else:
        return {"agent": "product_builder", "confidence": 0.75}

# Agent BlablaKAS (version démo)
@app.post("/agents/blablakas_ops/act")
def blablakas_demo(request: AgentRequest):
    return {
        "topic": "support_blablakas_demo",
        "faqs": [
            {
                "question": "Comment annuler un trajet BlablaKAS ?",
                "answer": "Vous pouvez annuler jusqu'à 1h avant le départ dans l'application mobile ou web."
            },
            {
                "question": "Que faire si le conducteur annule ?",
                "answer": "Vous recevrez un remboursement automatique + 5€ de crédit compensatoire."
            }
        ],
        "macros": [
            {
                "name": "annulation_standard",
                "audience": "frontline",
                "text": "Votre annulation a été traitée. Remboursement sous 3-5 jours ouvrés.",
                "requires_approval": False
            }
        ],
        "runbook": [],
        "escalation": [
            {
                "condition": "probleme_securite",
                "to": "equipe_securite",
                "sla_minutes": 30
            }
        ]
    }

# Agent KAScomodation (version démo)
@app.post("/agents/kascomodation_ops/act")
def kascomodation_demo(request: AgentRequest):
    return {
        "topic": "hebergement_demo",
        "reservations": [
            {
                "client_ref": "demo_001",
                "start": "2024-03-20T15:00:00Z",
                "end": "2024-03-23T11:00:00Z",
                "resource_id": "berlin_apt_01",
                "status": "tentative",
                "notes": "Réservation générée en mode démo"
            }
        ],
        "maintenance": [],
        "overbook_risk": "low"
    }

# Agent Social Manager (version démo)
@app.post("/agents/social_manager/act")
def social_demo(request: AgentRequest):
    return {
        "campaign": "kaspa_community_demo",
        "posts": [
            {
                "platform": "x",
                "text": "🚀 Nouvelle mise à jour BlablaKAS ! Covoiturage sécurisé avec la blockchain #Kaspa. #BlablaKAS #KaspaCommunity",
                "scheduled_at": "2024-03-20T14:00:00Z",
                "requires_approval": False
            },
            {
                "platform": "linkedin",
                "text": "KAScomodation révolutionne l'hébergement communautaire. Découvrez comment la blockchain Kaspa facilite les séjours entre particuliers.",
                "scheduled_at": "2024-03-20T16:00:00Z",
                "requires_approval": False
            }
        ],
        "reports": []
    }

# Agent Product Builder (version démo)
@app.post("/agents/product_builder/act")
def product_demo(request: AgentRequest):
    return {
        "feature_name": "systeme_notation_demo",
        "problem_statement": "Les utilisateurs ont besoin d'évaluer leurs expériences pour maintenir la qualité du service",
        "scope_in": [
            "Notation 1-5 étoiles",
            "Commentaires textuels",
            "Modération automatique"
        ],
        "scope_out": [
            "Système de réclamations",
            "Intégration paiements"
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
                "then": "une invitation à noter apparaît"
            }
        ],
        "risks": ["Fausses évaluations", "Spam de commentaires"],
        "metrics": ["Taux de participation", "Score moyen satisfaction"],
        "tickets": []
    }

# Workflow complet (version démo)
@app.post("/workflow/feature_launch")
def workflow_demo(request: dict):
    return {
        "spec": {
            "feature_name": f"feature_{request.get('idea', 'demo')}",
            "status": "spec_generated_demo"
        },
        "tickets": {
            "ok": True,
            "created": [
                {"key": "DEMO-1", "title": "Backend implementation"},
                {"key": "DEMO-2", "title": "Frontend interface"}
            ]
        },
        "social": {
            "ok": True,
            "scheduled_posts": 2,
            "campaign": "feature_announcement_demo"
        }
    }

# Handler pour les erreurs
@app.exception_handler(404)
def not_found_handler(request, exc):
    return JSONResponse(
        status_code=404,
        content={"error": "endpoint_not_found", "message": "Endpoint non trouvé", "available_endpoints": ["/", "/docs", "/route", "/agents/{agent}/act"]}
    )

# Export pour Vercel
handler = app