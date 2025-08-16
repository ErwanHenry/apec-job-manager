"""
Vercel-compatible FastAPI app for Kaspa Community Tool
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any
import json
from datetime import datetime, timezone, timedelta

# Create FastAPI app
app = FastAPI(
    title="Kaspa Community Tool",
    version="0.3.0",
    description="Multi-agent AI orchestrator for Kaspa community (BlablaKAS + KAScomodation)"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request models
class RouteRequest(BaseModel):
    text: str

class AgentRequest(BaseModel):
    input: str

class FeatureLaunchRequest(BaseModel):
    idea: str

# Root endpoint
@app.get("/")
def root():
    return {
        "message": "🚀 Kaspa Community Tool API",
        "version": "0.3.0",
        "status": "operational",
        "platform": "vercel",
        "services": ["BlablaKAS", "KAScomodation"],
        "endpoints": {
            "docs": "/docs",
            "health": "/health",
            "route": "/route",
            "agents": {
                "blablakas": "/agents/blablakas_ops/act",
                "kascomodation": "/agents/kascomodation_ops/act",
                "social": "/agents/social_manager/act",
                "product": "/agents/product_builder/act"
            },
            "workflow": "/workflow/feature_launch"
        }
    }

@app.get("/health")
def health():
    return {
        "status": "healthy",
        "service": "kaspa-community-tool",
        "platform": "vercel",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "version": "0.3.0"
    }

# Routing endpoint
@app.post("/route")
def route_request(request: RouteRequest):
    text = request.text.lower()
    
    # Simple keyword-based routing
    if any(keyword in text for keyword in ["faq", "support", "incident", "blablakas", "covoiturage"]):
        return {"agent": "blablakas_ops", "confidence": 0.95}
    elif any(keyword in text for keyword in ["réservation", "hébergement", "kascomodation", "logement"]):
        return {"agent": "kascomodation_ops", "confidence": 0.90}
    elif any(keyword in text for keyword in ["post", "social", "tweet", "campagne", "linkedin"]):
        return {"agent": "social_manager", "confidence": 0.88}
    else:
        return {"agent": "product_builder", "confidence": 0.75}

# BlablaKAS Agent
@app.post("/agents/blablakas_ops/act")
def blablakas_agent(request: AgentRequest):
    return {
        "topic": "support_blablakas",
        "faqs": [
            {
                "question": "Comment annuler un trajet BlablaKAS ?",
                "answer": "Vous pouvez annuler jusqu'à 1h avant le départ dans l'app mobile."
            },
            {
                "question": "Que faire si le conducteur annule ?",
                "answer": "Remboursement automatique + 5€ de crédit compensatoire."
            }
        ],
        "macros": [
            {
                "name": "annulation_standard",
                "audience": "frontline",
                "text": "Votre annulation a été traitée. Remboursement sous 3-5 jours.",
                "requires_approval": False
            }
        ],
        "runbook": [
            {
                "step": 1,
                "title": "Vérifier identité",
                "instruction": "Demander email + téléphone",
                "expected_result": "Confirmation utilisateur"
            }
        ],
        "escalation": [
            {
                "condition": "probleme_securite",
                "to": "equipe_securite", 
                "sla_minutes": 30
            }
        ]
    }

# KAScomodation Agent
@app.post("/agents/kascomodation_ops/act")
def kascomodation_agent(request: AgentRequest):
    now = datetime.now(timezone.utc)
    checkin = now + timedelta(days=7)
    checkout = checkin + timedelta(days=3)
    
    return {
        "topic": "hebergement_kascomodation",
        "reservations": [
            {
                "client_ref": "kaspa_user_001",
                "start": checkin.isoformat(),
                "end": checkout.isoformat(),
                "resource_id": "berlin_apt_01",
                "status": "tentative",
                "notes": "Appartement centre Berlin, 2 personnes"
            }
        ],
        "maintenance": [
            {
                "start": (now + timedelta(days=2)).isoformat(),
                "end": (now + timedelta(days=2, hours=4)).isoformat(),
                "resource_id": "berlin_apt_01",
                "description": "Nettoyage et vérification équipements"
            }
        ],
        "overbook_risk": "low"
    }

# Social Manager Agent
@app.post("/agents/social_manager/act")
def social_agent(request: AgentRequest):
    now = datetime.now(timezone.utc)
    
    return {
        "campaign": "kaspa_community_showcase",
        "posts": [
            {
                "platform": "x",
                "text": "🚀 BlablaKAS révolutionne le covoiturage avec #Kaspa ! #BlablaKAS #KaspaCommunity",
                "scheduled_at": (now + timedelta(hours=2)).isoformat(),
                "requires_approval": False
            },
            {
                "platform": "linkedin", 
                "text": "KAScomodation transforme l'hébergement collaboratif avec Kaspa blockchain.",
                "scheduled_at": (now + timedelta(hours=6)).isoformat(),
                "requires_approval": False
            }
        ],
        "reports": [
            {
                "period": "7d",
                "kpis": ["impressions", "engagement"]
            }
        ]
    }

# Product Builder Agent
@app.post("/agents/product_builder/act")  
def product_agent(request: AgentRequest):
    return {
        "feature_name": "systeme_reputation_communautaire",
        "problem_statement": "Les utilisateurs ont besoin d'un système de réputation fiable",
        "scope_in": [
            "Notation 1-5 étoiles",
            "Commentaires modérés",
            "Badges de confiance"
        ],
        "scope_out": [
            "Paiement intégré",
            "Résolution automatique litiges"
        ],
        "user_stories": [
            {
                "role": "utilisateur BlablaKAS",
                "need": "évaluer mon conducteur",
                "goal": "partager mon expérience"
            }
        ],
        "acceptance": [
            {
                "given": "un trajet terminé",
                "when": "l'utilisateur ouvre l'app", 
                "then": "invitation à évaluer apparaît"
            }
        ],
        "risks": ["Manipulation évaluations", "Commentaires inappropriés"],
        "metrics": ["Taux participation >70%", "Score satisfaction >4.2/5"],
        "tickets": [
            {
                "title": "Créer modèle réputation",
                "description": "Base de données notes et commentaires",
                "labels": ["backend", "database", "kaspa"]
            }
        ]
    }

# Feature Launch Workflow
@app.post("/workflow/feature_launch")
def feature_launch_workflow(request: FeatureLaunchRequest):
    return {
        "spec": {
            "feature_name": f"feature_{request.idea}",
            "status": "spec_generated"
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
            "campaign": "feature_announcement"
        }
    }

# Error handler
@app.exception_handler(404)
def not_found_handler(request, exc):
    return {
        "error": "endpoint_not_found",
        "message": "Endpoint not found",
        "available_endpoints": ["/", "/health", "/docs", "/route", "/agents/{agent}/act"]
    }

# Vercel handler
def handler(event, context):
    """
    AWS Lambda/Vercel handler
    """
    import uvicorn
    return app

# Alternative handler format
app_handler = app