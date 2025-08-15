
from pydantic import BaseModel, HttpUrl, Field, EmailStr, AwareDatetime, ValidationError
from typing import List, Optional, Literal, Dict

# ----- Product -----

class AcceptanceCriterion(BaseModel):
    given: str
    when: str
    then: str

class UserStory(BaseModel):
    role: str
    need: str
    goal: str

class TicketSpec(BaseModel):
    title: str
    description: str
    labels: List[str] = []

class ProductSpec(BaseModel):
    feature_name: str
    problem_statement: str
    scope_in: List[str]
    scope_out: List[str] = []
    user_stories: List[UserStory]
    acceptance: List[AcceptanceCriterion]
    risks: List[str] = []
    metrics: List[str] = []
    tickets: List[TicketSpec] = []

# ----- Ops -----

class Macro(BaseModel):
    name: str
    audience: Literal["frontline","backline"]
    text: str
    requires_approval: bool = False

class RunbookStep(BaseModel):
    step: int
    title: str
    instruction: str
    expected_result: str

class EscalationRule(BaseModel):
    condition: str
    to: str
    sla_minutes: int

class OpsPackage(BaseModel):
    topic: str
    faqs: List[Dict[str,str]] = []
    macros: List[Macro] = []
    runbook: List[RunbookStep] = []
    escalation: List[EscalationRule] = []

# ----- Accommodation -----

class ReservationDraft(BaseModel):
    client_ref: str
    start: AwareDatetime
    end: AwareDatetime
    resource_id: str
    status: Literal["tentative","confirmed","cancelled"] = "tentative"
    notes: Optional[str] = None

class MaintenanceWindow(BaseModel):
    start: AwareDatetime
    end: AwareDatetime
    resource_id: str
    description: str

class AccommodationPlan(BaseModel):
    topic: str
    reservations: List[ReservationDraft] = []
    maintenance: List[MaintenanceWindow] = []
    overbook_risk: Literal["low","medium","high"] = "low"

# ----- Social -----

class SocialPost(BaseModel):
    platform: Literal["x","linkedin"]
    text: str = Field(min_length=1, max_length=5000)
    media_urls: List[HttpUrl] = []
    scheduled_at: AwareDatetime
    requires_approval: bool = False

class SocialReport(BaseModel):
    period: Literal["7d","30d"]
    kpis: List[Literal["impressions","engagement","ctr","subs"]] = ["impressions","engagement"]

class SocialPlan(BaseModel):
    campaign: str
    posts: List[SocialPost]
    reports: List[SocialReport] = []

# ----- Common error envelope -----
class ErrorEnvelope(BaseModel):
    error: str
    reason: str
