
from typing import Any, Dict, Literal
from pydantic import ValidationError
from schemas import ProductSpec, OpsPackage, AccommodationPlan, SocialPlan, ErrorEnvelope
from prompts import KCT_PRODUCT_BUILDER, BLABLAKAS_OPS, KASCOMODATION_OPS, KCT_SOCIAL_MANAGER
from openai_llm import generate_and_validate

AgentName = Literal["product_builder","blablakas_ops","kascomodation_ops","social_manager"]

MODEL_MAPPING = {
    "product_builder": (KCT_PRODUCT_BUILDER, ProductSpec),
    "blablakas_ops": (BLABLAKAS_OPS, OpsPackage),
    "kascomodation_ops": (KASCOMODATION_OPS, AccommodationPlan),
    "social_manager": (KCT_SOCIAL_MANAGER, SocialPlan),
}

class Agent:
    def __init__(self, name: AgentName):
        self.name = name
        self.system_prompt, self.schema = MODEL_MAPPING[name]

    def act(self, user_input: str) -> Dict[str, Any]:
        try:
            out = generate_and_validate(self.system_prompt, user_input, self.schema, self.name)
            return out
        except ValidationError as ve:
            return ErrorEnvelope(error="validation_error", reason=str(ve)).model_dump()
        except Exception as e:
            return ErrorEnvelope(error="llm_error", reason=str(e)).model_dump()

AGENTS: Dict[AgentName, Agent] = {
    "product_builder": Agent("product_builder"),
    "blablakas_ops": Agent("blablakas_ops"),
    "kascomodation_ops": Agent("kascomodation_ops"),
    "social_manager": Agent("social_manager"),
}
