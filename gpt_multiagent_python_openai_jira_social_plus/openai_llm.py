
import json, os
from typing import Type, Any, Dict, List
from pydantic import BaseModel, ValidationError
from dotenv import load_dotenv
from openai import OpenAI
from rag import RETRIEVER

load_dotenv()
MODEL = os.getenv("OPENAI_MODEL","gpt-4o-mini")

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def call_json_model(system_prompt: str, user_input: str, extra_context: List[str] = None, model: str = MODEL) -> Dict[str, Any]:
    extra_context = extra_context or []
    messages = [{"role":"system","content": system_prompt}]
    if extra_context:
        messages.append({"role":"system","content": "Références internes (RAG):\n" + "\n---\n".join(extra_context[:3])})
    messages.append({"role":"user","content": user_input})
    resp = client.chat.completions.create(
        model=model,
        response_format={ "type": "json_object" },
        messages=messages,
        temperature=0.2,
    )
    content = resp.choices[0].message.content or "{}"
    try:
        return json.loads(content)
    except json.JSONDecodeError as e:
        raise RuntimeError(f"Invalid JSON from model: {e}\nRaw: {content[:4000]}")

def generate_and_validate(system_prompt: str, user_input: str, model: Type[BaseModel], agent_name: str = "") -> Dict[str, Any]:
    ctx = RETRIEVER.retrieve(agent_name or "", user_input, k=3) if agent_name else []
    raw = call_json_model(system_prompt, user_input, ctx)
    try:
        validated = model.model_validate(raw)
    except ValidationError as ve:
        fix_prompt = f"""Le JSON ci-dessous ne valide pas le schéma. Corrige et renvoie UNIQUEMENT un JSON.
Erreurs: {ve}
JSON: {json.dumps(raw, ensure_ascii=False)}"""
        raw2 = call_json_model(system_prompt, fix_prompt, ctx)
        validated = model.model_validate(raw2)
    return validated.model_dump()
