
import os, httpx, json
from dotenv import load_dotenv

load_dotenv()
DRY = os.getenv("DRY_RUN","true").lower() == "true"

BASE = os.getenv("JIRA_BASE_URL","")
EMAIL = os.getenv("JIRA_EMAIL","")
TOKEN = os.getenv("JIRA_API_TOKEN","")

PROJECT_KEY = os.getenv("JIRA_PROJECT_KEY","PROJ")

# Load mapping
try:
    with open("config/jira_mapping.json","r", encoding="utf-8") as f:
        MAPPING = json.load(f)
except Exception:
    MAPPING = {"default_issue_type":"Task","label_to_issue_type":{}, "components":{}}

def map_issue_type(labels):
    labels = labels or []
    for lb in labels:
        t = MAPPING.get("label_to_issue_type",{}).get(lb)
        if t: return t
    return MAPPING.get("default_issue_type","Task")

def map_components(labels):
    labels = labels or []
    comps = []
    for lb in labels:
        c = MAPPING.get("components",{}).get(lb)
        if c: comps.append({"name": c})
    return comps or None

def create_issue(summary: str, description: str, issue_type: str = None, labels=None):
    labels = labels or []
    issue_type = issue_type or map_issue_type(labels)
    components = map_components(labels)

    if DRY or not (BASE and EMAIL and TOKEN):
        return {"ok": True, "dry_run": True, "summary": summary, "description": description, "type": issue_type, "labels": labels, "components": components}

    auth = (EMAIL, TOKEN)
    payload = {
        "fields": {
            "project": {"key": PROJECT_KEY},
            "summary": summary,
            "description": description,
            "issuetype": {"name": issue_type},
            "labels": labels
        }
    }
    if components:
        payload["fields"]["components"] = components
    url = f"{BASE}/rest/api/3/issue"
    with httpx.Client(timeout=30.0) as client:
        r = client.post(url, json=payload, auth=auth)
    r.raise_for_status()
    return {"ok": True, "issue": r.json()}
