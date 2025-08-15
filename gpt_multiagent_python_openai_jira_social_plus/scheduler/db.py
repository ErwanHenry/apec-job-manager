
import sqlite3, os
from contextlib import contextmanager

DB_PATH = os.getenv("SCHEDULE_DB_PATH","schedule.db")

def init_db():
    with sqlite3.connect(DB_PATH) as con:
        cur = con.cursor()
        cur.execute(
            "CREATE TABLE IF NOT EXISTS scheduled_posts ("
            "id INTEGER PRIMARY KEY AUTOINCREMENT,"
            "platform TEXT NOT NULL,"
            "text TEXT NOT NULL,"
            "scheduled_at TEXT NOT NULL,"
            "status TEXT NOT NULL DEFAULT 'queued'"
            ")"
        )
        con.commit()

@contextmanager
def get_conn():
    con = sqlite3.connect(DB_PATH)
    try:
        yield con
    finally:
        con.close()
