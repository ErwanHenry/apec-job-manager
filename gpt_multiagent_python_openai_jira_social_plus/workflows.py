
from typing import Dict, Any
from agents import AGENTS
from tools import TicketsTool, SocialTool

tickets = TicketsTool()
social = SocialTool()

def feature_launch_workflow(idea: str) -> Dict[str, Any]:
    # 1) Product spec
    spec = AGENTS["product_builder"].act(idea)

    # 2) Créer tickets (Jira) à partir de la spec
    tickets_created = tickets.create(spec.get("tickets", []))

    # 3) Social plan (annonce)
    social_plan = AGENTS["social_manager"].act(f"Annonce: {spec.get('feature_name')}")
    published = social.schedule(social_plan.get("posts", []))

    return {
        "spec": spec,
        "tickets": tickets_created,
        "social": published,
    }
