# backend/reset.py
import modal
import os
import shutil
import sqlite3

# Import your cloud volume
from .common import app, vol

@app.function(volumes={"/data": vol})
def nuke_system():
    print("☢️  INITIATING SYSTEM WIPE... ☢️")
    
    # --- 1. DELETE VIDEO FILES ---
    video_dir = "/data/videos"
    if os.path.exists(video_dir):
        try:
            shutil.rmtree(video_dir)
            print("✅ Deleted all video files.")
        except Exception as e:
            print(f"❌ Error deleting videos: {e}")
    else:
        print("🤷 No videos found.")

    # --- 2. DELETE VECTOR DATABASE (LanceDB) ---
    vector_db_path = "/data/lancedb_store"
    if os.path.exists(vector_db_path):
        try:
            shutil.rmtree(vector_db_path)
            print("✅ Deleted Vector Index.")
        except Exception as e:
            print(f"❌ Error deleting Vector DB: {e}")
    else:
        print("🤷 No Vector DB found.")

    # --- 3. DELETE SQL DATABASE (Users & Metadata) ---
    # We delete the actual .db file to drop all tables
    sql_db_path = "/data/chronosearch.db" 
    if os.path.exists(sql_db_path):
        try:
            os.remove(sql_db_path)
            print("✅ Deleted SQL Database (Users & Metadata).")
        except Exception as e:
            print(f"❌ Error deleting SQL DB: {e}")
    else:
        print("🤷 No SQL DB found.")

    # --- 4. RE-CREATE EMPTY FOLDERS ---
    os.makedirs(video_dir, exist_ok=True)
    os.makedirs(vector_db_path, exist_ok=True)
    
    # Commit changes to the volume
    vol.commit()
    
    print("\n✨ SYSTEM IS 100% CLEAN. READY FOR FRESH UPLOAD. ✨")