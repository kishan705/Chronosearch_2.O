import sqlite3
import modal
from .common import app, vol

DB_PATH = "/data/metadata.db"

@app.cls(volumes={"/data": vol})
class Database:
    
    @modal.method()
    def init_db(self):
        with sqlite3.connect(DB_PATH) as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    user_id TEXT PRIMARY KEY,
                    username TEXT UNIQUE NOT NULL,
                    password_hash TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            conn.execute("""
                CREATE TABLE IF NOT EXISTS videos (
                    video_id TEXT PRIMARY KEY,
                    user_id TEXT NOT NULL,
                    filename TEXT NOT NULL,
                    title TEXT,
                    tags TEXT,
                    visibility TEXT DEFAULT 'public',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    status TEXT DEFAULT 'processing',
                    FOREIGN KEY(user_id) REFERENCES users(user_id)
                )
            """)
            try:
                conn.execute("ALTER TABLE videos ADD COLUMN status TEXT DEFAULT 'processing'")
                conn.commit()
            except sqlite3.OperationalError:
                pass 

    @modal.method()
    def create_user(self, user_id, username, password_hash):
        try:
            with sqlite3.connect(DB_PATH) as conn:
                conn.execute("INSERT INTO users (user_id, username, password_hash) VALUES (?, ?, ?)", 
                             (user_id, username, password_hash))
                conn.commit()
            return True
        except sqlite3.IntegrityError:
            return False

    @modal.method()
    def get_user_by_username(self, username):
        with sqlite3.connect(DB_PATH) as conn:
            conn.row_factory = sqlite3.Row
            try:
                cur = conn.execute("SELECT * FROM users WHERE username = ?", (username,))
                row = cur.fetchone()
                return dict(row) if row else None
            except: return None

    @modal.method()
    def add_video(self, video_id, user_id, filename, title, tags, visibility):
        with sqlite3.connect(DB_PATH) as conn:
            conn.execute("""
                INSERT INTO videos (video_id, user_id, filename, title, tags, visibility, status) 
                VALUES (?, ?, ?, ?, ?, ?, 'processing')
            """, (video_id, user_id, filename, title, tags, visibility))
            conn.commit()

    @modal.method()
    def update_processing_status(self, video_id, status):
        with sqlite3.connect(DB_PATH) as conn:
            conn.execute("UPDATE videos SET status = ? WHERE video_id = ?", (status, video_id))
            conn.commit()

    @modal.method()
    def get_video_metadata(self, video_id):
        with sqlite3.connect(DB_PATH) as conn:
            conn.row_factory = sqlite3.Row
            try:
                # 👇 FIX: Changed "SELECT status" to "SELECT *"
                row = conn.execute("SELECT * FROM videos WHERE video_id = ?", (video_id,)).fetchone()
                return dict(row) if row else None
            except: return None

    @modal.method()
    def get_public_feed(self):
        with sqlite3.connect(DB_PATH) as conn:
            conn.row_factory = sqlite3.Row
            try:
                res = conn.execute("SELECT * FROM videos WHERE visibility = 'public' ORDER BY created_at DESC LIMIT 50")
                return [dict(row) for row in res.fetchall()]
            except: return []

    @modal.method()
    def get_user_videos(self, user_id):
        with sqlite3.connect(DB_PATH) as conn:
            conn.row_factory = sqlite3.Row
            try:
                res = conn.execute("SELECT * FROM videos WHERE user_id = ? ORDER BY created_at DESC", (user_id,))
                return [dict(row) for row in res.fetchall()]
            except: return []
        
    @modal.method()
    def update_visibility(self, video_id, user_id, new_visibility):
        with sqlite3.connect(DB_PATH) as conn:
            conn.execute("UPDATE videos SET visibility = ? WHERE video_id = ? AND user_id = ?", (new_visibility, video_id, user_id))
            conn.commit()
        return True
        
    @modal.method()
    def delete_video(self, video_id, user_id):
        with sqlite3.connect(DB_PATH) as conn:
            conn.execute("DELETE FROM videos WHERE video_id = ? AND user_id = ?", (video_id, user_id))
            conn.commit()
        return True