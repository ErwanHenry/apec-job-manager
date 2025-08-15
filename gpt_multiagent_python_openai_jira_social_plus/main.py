
from fastapi import FastAPI
from pydantic import BaseModel
from typing import Any, Dict
from agents import AGENTS
from router import route_intent
from workflows import feature_launch_workflow
from scheduler.worker import start as start_worker
import os

app = FastAPI(title="Kaspa Community Tool", version="0.3.0")

# Only start scheduler in local development (not on Vercel)
if os.getenv("VERCEL") != "1":
    @app.on_event("startup")
    def _startup():
        start_worker()

@app.get("/")
def root():
    return {
        "message": "🚀 Kaspa Community Tool API",
        "version": "0.3.0", 
        "services": ["BlablaKAS", "KAScomodation"],
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

@app.post("/route")
def route(body: RouteIn) -> Dict[str, Any]:
    agent = route_intent(body.text)
    return {"agent": agent}

@app.post("/agents/{name}/act")
def act(name: str, body: ActIn) -> Dict[str, Any]:
    return AGENTS[name].act(body.input)

class FeatureLaunchIn(BaseModel):
    idea: str

@app.post("/workflow/feature_launch")
def workflow_feature_launch(body: FeatureLaunchIn) -> Dict[str, Any]:
    return feature_launch_workflow(body.idea)
