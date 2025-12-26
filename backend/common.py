
####################....... common.py
import modal

# 👇 V8: The Final "Golden" Version
APP_NAME = "chronosearch-v8-golden"
TABLE_NAME = "video_vectors_v8_golden"

image = (
    modal.Image.debian_slim()
    .apt_install("ffmpeg")
    .pip_install(
        "torch", 
        "torchvision", 
        "transformers", 
        "pillow", 
        "lancedb==0.5.7",
        "numpy", 
        "pandas",
        "opencv-python-headless", 
        "sentencepiece",
        "fastapi", 
        "python-multipart",
        "bcrypt",
        "python-jose[cryptography]",
        "google-auth", 
        "requests==2.31.0"
    )
)

# Persistent storage
vol = modal.Volume.from_name("chrono-storage-v8", create_if_missing=True)

app = modal.App(APP_NAME, image=image)