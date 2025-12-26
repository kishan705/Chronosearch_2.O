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

@router.get("/debug_files")
def list_files():
    import os
    try:
        files = os.listdir("/data/videos")
        return {"count": len(files), "files": files}
    except Exception as e:
        return {"error": str(e)}