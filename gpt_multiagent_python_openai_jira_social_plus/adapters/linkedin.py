
import os, httpx
from dotenv import load_dotenv

load_dotenv()
DRY = os.getenv("DRY_RUN","true").lower() == "true"
TOKEN = os.getenv("LINKEDIN_ACCESS_TOKEN","")
ORG = os.getenv("LINKEDIN_ORGANIZATION_URN","")

def post_ugc(text: str):
    if DRY or not (TOKEN and ORG):
        return {"ok": True, "dry_run": True, "text": text, "org": ORG}
    headers = {
        "Authorization": f"Bearer {TOKEN}",
        "X-Restli-Protocol-Version": "2.0.0",
        "Content-Type": "application/json"
    }
    url = "https://api.linkedin.com/v2/ugcPosts"
    payload = {
        "author": ORG,
        "lifecycleState": "PUBLISHED",
        "specificContent": {
            "com.linkedin.ugc.ShareContent": {
                "shareCommentary": {"text": text},
                "shareMediaCategory": "NONE"
            }
        },
        "visibility": {"com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"}
    }
    with httpx.Client(timeout=30.0) as client:
        r = client.post(url, headers=headers, json=payload)
    r.raise_for_status()
    return {"ok": True, "post": r.json()}
