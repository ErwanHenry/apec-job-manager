
from typing import List, Dict, Any
from adapters import jira, twitter_x, linkedin
from datetime import datetime, timezone
from scheduler.queue import enqueue_posts

class ToolResult(dict):
    pass

class TicketsTool:
    name = "tickets"
    def create(self, tickets: List[Dict[str, Any]]) -> ToolResult:
        created = []
        for t in tickets:
            res = jira.create_issue(
                summary=t.get("title","(no title)"),
                description=t.get("description",""),
                issue_type=None,
                labels=t.get("labels", [])
            )
            created.append(res)
        return ToolResult({"ok": True, "created": created})

class SocialTool:
    name = "social"
    def schedule(self, posts: List[Dict[str, Any]]) -> ToolResult:
        outputs = []
        to_enqueue = []
        now = datetime.now(timezone.utc)
        for p in posts:
            platform = p.get("platform")
            text = p.get("text","")
            scheduled_at = p.get("scheduled_at")
            try:
                dt = datetime.fromisoformat(scheduled_at.replace("Z","+00:00")) if isinstance(scheduled_at, str) else now
            except Exception:
                dt = now
            if dt > now:
                to_enqueue.append({"platform": platform, "text": text, "scheduled_at": dt.isoformat()})
                outputs.append({"platform": platform, "queued_for": dt.isoformat()})
            else:
                if platform == "x":
                    outputs.append({"platform":"x", **twitter_x.post_tweet(text)})
                elif platform == "linkedin":
                    outputs.append({"platform":"linkedin", **linkedin.post_ugc(text)})
                else:
                    outputs.append({"platform":platform, "ok": False, "reason":"Unsupported platform"})
        if to_enqueue:
            enqueue_posts(to_enqueue)
        return ToolResult({"ok": True, "results": outputs, "enqueued": len(to_enqueue)})
