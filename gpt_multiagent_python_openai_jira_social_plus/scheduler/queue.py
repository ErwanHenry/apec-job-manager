
from .db import get_conn, init_db
from typing import List, Dict

init_db()

def enqueue_posts(posts: List[dict]):
    with get_conn() as con:
        cur = con.cursor()
        for p in posts:
            cur.execute(
                "INSERT INTO scheduled_posts(platform,text,scheduled_at,status) VALUES(?,?,?,?)",
                (p.get("platform"), p.get("text"), p.get("scheduled_at"), "queued")
            )
        con.commit()

def due_posts(now_iso: str):
    with get_conn() as con:
        cur = con.cursor()
        cur.execute(
            "SELECT id, platform, text, scheduled_at FROM scheduled_posts WHERE status='queued' AND scheduled_at <= ?",
            (now_iso,)
        )
        return [{"id": r[0], "platform": r[1], "text": r[2], "scheduled_at": r[3]} for r in cur.fetchall()]

def mark_post(id: int, status: str):
    with get_conn() as con:
        cur = con.cursor()
        cur.execute("UPDATE scheduled_posts SET status=? WHERE id=?", (status, id))
        con.commit()
