
import os, httpx, time, json
from dotenv import load_dotenv

load_dotenv()
DRY = os.getenv("DRY_RUN","true").lower() == "true"
BEARER = os.getenv("X_BEARER_TOKEN","")

def post_tweet(text: str):
    if DRY or not BEARER:
        return {"ok": True, "dry_run": True, "text": text}
    headers = {"Authorization": f"Bearer {BEARER}", "Content-Type":"application/json"}
    url = "https://api.twitter.com/2/tweets"
    payload = {"text": text}
    with httpx.Client(timeout=30.0) as client:
        r = client.post(url, headers=headers, json=payload)
    r.raise_for_status()
    return {"ok": True, "tweet": r.json()}
