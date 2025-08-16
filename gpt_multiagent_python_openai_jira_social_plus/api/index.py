"""
Version optimisée pour Vercel - sans scheduler et avec dépendances allégées
"""
from fastapi import FastAPI
from pydantic import BaseModel
from typing import Any, Dict
import os

# Import avec path parent pour Vercel
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import conditionnel pour éviter les erreurs de dépendances
try:
    from agents import AGENTS
    from router import route_intent
    from workflows import feature_launch_workflow
except ImportError as e:
    # Version de fallback si certaines dépendances manquent
    print(f"Warning: {e}")
    AGENTS = {}
    def route_intent(text: str) -> str:
        return "product_builder"
    def feature_launch_workflow(idea: str) -> Dict[str, Any]:
        return {"error": "workflow_unavailable", "reason": "Dependencies missing on Vercel"}

app = FastAPI(title="Kaspa Community Tool", version="0.3.0")

@app.get("/")
def root():
    return {
        "message": "🚀 Kaspa Community Tool API",
        "version": "0.3.0", 
        "services": ["BlablaKAS", "KAScomodation"],
        "environment": "Vercel",
        "endpoints": {
            "docs": "/docs",
            "route": "/route",
            "agents": "/agents/{agent_name}/act",
            "workflow": "/workflow/feature_launch"
        }
    }

class RouteIn(BaseModel):
    text: str

class ActIn(BaseModel):
    input: str

class FeatureLaunchIn(BaseModel):
    idea: str

@app.post("/route")
def route(body: RouteIn) -> Dict[str, Any]:
    try:
        agent = route_intent(body.text)
        return {"agent": agent}
    except Exception as e:
        return {"error": "routing_error", "reason": str(e)}

@app.post("/agents/{name}/act")
def act(name: str, body: ActIn) -> Dict[str, Any]:
    try:
        if name not in AGENTS:
            return {"error": "agent_not_found", "reason": f"Agent '{name}' not available"}
        return AGENTS[name].act(body.input)
    except Exception as e:
        return {"error": "agent_error", "reason": str(e)}

@app.post("/workflow/feature_launch")
def workflow_feature_launch(body: FeatureLaunchIn) -> Dict[str, Any]:
    try:
        return feature_launch_workflow(body.idea)
    except Exception as e:
        return {"error": "workflow_error", "reason": str(e)}

# Vercel handler - must be named 'app' for @vercel/python
# Export the app for Vercel