####################....... api.py
from fastapi import APIRouter, UploadFile, File, Form
from pydantic import BaseModel
import os
import shutil
import uuid

from .auth import get_password_hash, verify_password, create_access_token
from .database import Database
from .AI import VideoIndexer, VideoSearcher
from .common import vol

router = APIRouter()

class UserAuth(BaseModel):
    username: str
    password: str

class GoogleAuthRequest(BaseModel):
    token: str

class VideoUpdate(BaseModel):
    video_id: str
    user_id: str
    action: str
    new_visibility: str = None

# --- AUTH ---
@router.post("/register")
async def register(user: UserAuth):
    db = Database()
    db.init_db.remote()
    if db.create_user.remote(uuid.uuid4().hex, user.username, get_password_hash(user.password)):
        return {"status": "created"}
    return {"error": "Taken"}

@router.post("/login") 
async def login(auth_data: UserAuth):
    db = Database()
    db.init_db.remote()
    user = db.get_user_by_username.remote(auth_data.username)
    if not user or not verify_password(auth_data.password, user['password_hash']):
        return {"error": "Invalid"}
    token = create_access_token({"sub": user['user_id'], "name": user['username']})
    return {"access_token": token, "user_id": user['user_id'], "username": user['username']}

# --- VIDEO ---
@router.post("/upload")
async def upload_video(
    file: UploadFile = File(...), 
    user_id: str = Form(...), 
    title: str = Form(...),
    tags: str = Form(""),
    visibility: str = Form("public")
):
    Database().init_db.remote()
    save_dir = "/data/videos"
    os.makedirs(save_dir, exist_ok=True) # Cloud only

    video_id = f"{user_id}_{uuid.uuid4().hex[:6]}"
    save_path = f"{save_dir}/{video_id}.mp4"
    
    with open(save_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    vol.commit() 
    
    Database().add_video.remote(video_id, user_id, file.filename, title, tags, visibility)
    
    # 🚀 SPAWN AI (Background)
    VideoIndexer().process_video.spawn(save_path, video_id, title)
    
    return {"status": "success", "video_id": video_id}

@router.get("/feed")
async def get_home_feed():
    return Database().get_public_feed.remote()

@router.get("/my_videos")
async def get_my_videos(user_id: str):
    return Database().get_user_videos.remote(user_id)

@router.get("/search")
def search_video(query: str, video_id: str = None):
    return {"results": VideoSearcher().search.remote(query, video_id)}

@router.get("/status")
def get_video_status(video_id: str):
    meta = Database().get_video_metadata.remote(video_id)
    if not meta: return {"status": "not_found", "indexed": False}
    return {"status": meta.get("status", "processing"), "indexed": (meta.get("status") == "completed")}

@router.get("/search_global")
def search_global(query: str):
    return {"results": VideoSearcher().search_global.remote(query)}
# backend/api.py

@router.get("/stream/{video_id}")
async def stream_video(video_id: str):
    import os
    from fastapi.responses import FileResponse
    from .common import vol

    file_path = f"/data/videos/{video_id}.mp4"
    
    # 1. Force Refresh
    if not os.path.exists(file_path):
        print(f"🔄 Refreshing Volume for {video_id}...")
        vol.reload()
        
    # 2. Return File
    if os.path.exists(file_path):
        return FileResponse(file_path, media_type="video/mp4")
    
    return {"error": "File not found"}


@router.post("/google_login")
async def google_login(request: GoogleAuthRequest):
    from google.oauth2 import id_token
    from google.auth.transport import requests
    import uuid
    
    # 1. Verify Token (In production, use real Client ID)
    try:
        # For testing, we are trusting the token content. 
        # IN PROD: Use id_token.verify_oauth2_token(request.token, requests.Request(), YOUR_CLIENT_ID)
        # Here we just decode unverified to get the email for the prototype
        from jose import jwt
        # Decode without verification just to get the email (Prototype Only!)
        # Google tokens are JWTs.
        decoded = jwt.get_unverified_claims(request.token)
        email = decoded.get("email")
        if not email: raise ValueError("No email in token")
        
    except Exception as e:
        print(f"Google Token Error: {e}")
        return {"error": "Invalid Google Token"}

    # 2. Check DB
    db = Database()
    db.init_db.remote()
    user = db.get_user_by_username.remote(email)
    
    user_id = None
    if not user:
        # Create User
        user_id = uuid.uuid4().hex
        db.create_user.remote(user_id, email, "GOOGLE_AUTH_PLACEHOLDER")
    else:
        user_id = user['user_id']

    # 3. Generate Token
    token = create_access_token({"sub": user_id, "name": email})
    return {"access_token": token, "user_id": user_id, "username": email}


@router.post("/reindex")
async def reindex_video(video_id: str, user_id: str = Form(None)): # Allow None
    import os
    import time
    from .common import vol
    
    # 🕵️‍♂️ CHECK 1: Existence
    db = Database()
    meta = db.get_video_metadata.remote(video_id)
    if not meta:
        return {"error": "Video not found"}

    # ❌ REMOVED THE OWNER CHECK
    # We allow anyone to help "fix" the community index.
    # if meta['user_id'] != user_id: return {"error": "Unauthorized"}

    # 🕵️‍♂️ CHECK 2: Processing Lock
    if meta.get("status") == "processing":
        return {"error": "Already processing! Please wait."}

    # 🕵️‍♂️ CHECK 3: File Existence
    vol.reload()
    if not os.path.exists(f"/data/videos/{video_id}.mp4"):
        db.update_processing_status.remote(video_id, "failed_missing_file")
        return {"error": "CRITICAL: Video file missing from disk."}

    # 🕵️‍♂️ CHECK 4: COOL-DOWN TIMER (The Spam Protection) ❄️
    cooldown_dir = "/data/repair_logs"
    os.makedirs(cooldown_dir, exist_ok=True)
    timestamp_file = f"{cooldown_dir}/{video_id}.last_run"

    if os.path.exists(timestamp_file):
        with open(timestamp_file, 'r') as f:
            last_run = float(f.read().strip())
        
        # 300 seconds = 5 Minutes
        if (time.time() - last_run) < 300: 
            remaining = int(300 - (time.time() - last_run))
            return {"error": f"Cooldown active. Please wait {remaining} seconds."}

    # ✅ START
    print(f"🔧 Starting Public Re-index for {video_id}")
    
    with open(timestamp_file, 'w') as f:
        f.write(str(time.time()))
    
    db.update_processing_status.remote(video_id, "processing")
    
    VideoIndexer().process_video.spawn(
        f"/data/videos/{video_id}.mp4", 
        video_id, 
        meta['title'], 
        meta['tags']
    )

    return {"status": "reindexing_started"}

@router.get("/debug_files")
def list_files():
    import os
    try:
        files = os.listdir("/data/videos")
        return {"count": len(files), "files": files}
    except Exception as e:
        return {"error": str(e)}