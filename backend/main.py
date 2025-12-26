import modal
from .common import app, image, vol
from .api import router as api_router
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import os

web_app = FastAPI(title="ChronoSearch V8 API")

web_app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# 🛑 FIX: check_dir=False prevents Local Crash
web_app.mount("/data/videos", StaticFiles(directory="/data/videos", check_dir=False), name="videos")

web_app.include_router(api_router, prefix="/api")

@app.function(
    image=image, 
    volumes={"/data": vol},
    # 🛑 FIX: New Modal Parameter Names
    scaledown_window=300, 
    max_containers=10, 
    timeout=600
)
@modal.asgi_app()
def chrono_api():
    # 🛑 FIX: Create folder only in Cloud
    os.makedirs("/data/videos", exist_ok=True)
    return web_app