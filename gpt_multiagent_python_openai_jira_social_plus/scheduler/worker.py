
from datetime import datetime, timezone
from apscheduler.schedulers.background import BackgroundScheduler
from .queue import due_posts, mark_post
from tools import SocialTool

scheduler = BackgroundScheduler(timezone="UTC")
social = SocialTool()

def tick():
    now = datetime.now(timezone.utc).isoformat()
    posts = due_posts(now)
    for p in posts:
        try:
            res = social.schedule([{"platform": p["platform"], "text": p["text"], "scheduled_at": p["scheduled_at"], "media_urls": []}])
            if res.get("ok"):
                mark_post(p["id"], "sent")
            else:
                mark_post(p["id"], "failed")
        except Exception:
            mark_post(p["id"], "failed")

def start():
    scheduler.add_job(tick, "interval", seconds=30, id="publisher", replace_existing=True)
    scheduler.start()
