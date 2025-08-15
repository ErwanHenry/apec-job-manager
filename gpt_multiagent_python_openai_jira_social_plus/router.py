
from typing import Literal
import re

AgentName = Literal["product_builder","blablakas_ops","kascomodation_ops","social_manager"]

KEYWORDS = {
    "product_builder": ["spec","user story","acceptation","feature","backlog","ticket"],
    "blablakas_ops": ["faq","macro","support","incident","runbook","escalade"],
    "kascomodation_ops": ["réservation","planning","hébergement","logistique","maintenance"],
    "social_manager": ["post","linkedin","x ","tweet","calendrier éditorial","campagne"],
}

def route_intent(text: str) -> AgentName:
    lower = text.lower()
    for agent, kws in KEYWORDS.items():
        if any(re.search(rf"\b{re.escape(k)}\b", lower) for k in kws):
            return agent  # type: ignore
    # défaut: product builder
    return "product_builder"
