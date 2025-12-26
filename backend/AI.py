import modal
from .common import app, image, vol, TABLE_NAME 
from .database import Database
import os
import shutil
from . import search_global

# Import modules
from . import extract, index, search, search_global # Added search_global

# Paths
VOLUME_DB_PATH = "/data/lancedb_stable"
TEMP_DB_PATH = "/tmp/lancedb_workpad"
TEMP_FRAMES_DIR = "/tmp/frames_buffer"

@app.cls(image=image, gpu="T4", volumes={"/data": vol}, scaledown_window=300)
class VideoIndexer:
    @modal.method()
    def process_video(self, video_path: str, video_id: str, title: str = "Untitled", tags: str = ""):
        print(f"🎬 [MODULAR] Starting processing for {video_id}")
        
        if os.path.exists(TEMP_DB_PATH): shutil.rmtree(TEMP_DB_PATH)
        if os.path.exists(TEMP_FRAMES_DIR): shutil.rmtree(TEMP_FRAMES_DIR)
        
        if os.path.exists(VOLUME_DB_PATH): 
            shutil.copytree(VOLUME_DB_PATH, TEMP_DB_PATH, dirs_exist_ok=True)
        else: 
            os.makedirs(TEMP_DB_PATH)

        try:
            # 1. EXTRACT (Your Logic)
            extract.extract_frames(video_path, TEMP_FRAMES_DIR)
            
            # 2. INDEX (Frames + New Metadata)
            # 👇 We now pass title and tags here!
            index.index_frames(TEMP_FRAMES_DIR, TEMP_DB_PATH, video_id, TABLE_NAME, title, tags)
            
            # 3. SYNC
            shutil.copytree(TEMP_DB_PATH, VOLUME_DB_PATH, dirs_exist_ok=True)
            vol.commit()
            
            Database().update_processing_status.remote(video_id, "completed")
            print("✅ Workflow Complete!")
            
        except Exception as e:
            print(f"❌ Workflow Failed: {e}")
            Database().update_processing_status.remote(video_id, "failed")

@app.cls(image=image, gpu="T4", volumes={"/data": vol}, scaledown_window=300)
class VideoSearcher:
    @modal.method()
    def search(self, query: str, filter_video_id: str = None):
        # Local Search (Inside a specific video or all frames)
        # Uses search.py (Your existing logic)
        return search.search_index(query, VOLUME_DB_PATH, TABLE_NAME, filter_video_id)

    @modal.method()
    def search_global(self, query: str):
        # Calls the new Hybrid Logic
        # It needs the Frame Table name to scan frames
        return search_global.search_global_unified(query, VOLUME_DB_PATH, TABLE_NAME)

@app.cls(image=image, volumes={"/data": vol})
class FileHelper:
    @modal.method()
    def list_files(self):
        return os.listdir("/data/videos")