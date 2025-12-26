####################....... index.py

def index_frames(frames_folder, db_path, video_id, table_name, title="", tags=""):
    import os
    import lancedb
    import torch
    import pyarrow as pa
    from PIL import Image
    from transformers import AutoProcessor, AutoModel
    import shutil
    """
    1. Indexes Visual Frames (Your Logic)
    2. Indexes Title & Tags (New Logic)
    """
    # --- 1. LOAD THE BRAIN ---
    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"🚀 Loading Model on {device.upper()}...")

    model = AutoModel.from_pretrained("google/siglip-so400m-patch14-384").to(device)
    processor = AutoProcessor.from_pretrained("google/siglip-so400m-patch14-384")

    # --- 2. PREPARE THE DATABASE ---
    print(f"📂 Setting up LanceDB at {db_path}...")
    db = lancedb.connect(db_path)

    # A. FRAME TABLE (For "Deep Search")
    schema_frames = pa.schema([
        pa.field("vector", pa.list_(pa.float32(), 1152)),
        pa.field("video_id", pa.string()),
        pa.field("timestamp", pa.float64()),
        pa.field("metadata", pa.string()),
    ])
    try: tbl_frames = db.open_table(table_name)
    except: tbl_frames = db.create_table(table_name, schema=schema_frames)

    # B. METADATA TABLE (For "Global Search") - NEW 🌟
    metadata_table_name = "video_metadata_index"
    schema_meta = pa.schema([
        pa.field("vector", pa.list_(pa.float32(), 1152)),
        pa.field("video_id", pa.string()),
        pa.field("title", pa.string()),
        pa.field("tags", pa.string()),
    ])
    try: tbl_meta = db.open_table(metadata_table_name)
    except: tbl_meta = db.create_table(metadata_table_name, schema=schema_meta)

    # --- 3. INDEX TITLE & TAGS (NEW STEP) ---
    print(f"📝 Indexing Metadata: '{title}' + '{tags}'")
    text_content = f"{title} {tags}"
    
    with torch.no_grad():
        # Turn Title+Tags into a Vector
        inputs = processor(text=[text_content], return_tensors="pt", padding="max_length").to(device)
        outputs = model.get_text_features(**inputs)
        outputs = outputs / outputs.norm(p=2, dim=-1, keepdim=True)
        meta_vector = outputs[0].cpu().tolist()

    # Save to Metadata Table (Remove old entry for this video first if exists)
    try: tbl_meta.delete(f"video_id = '{video_id}'")
    except: pass
    
    tbl_meta.add([{
        "vector": meta_vector,
        "video_id": video_id,
        "title": title,
        "tags": tags
    }])

    # --- 4. INDEX FRAMES (YOUR EXISTING LOGIC) ---
    print(f"📸 Scanning frames in '{frames_folder}'...")

    # 👇 CRITICAL FIX: Delete old frame data to prevent "Ghost Results" (3 min timestamp in 2 min video)
    try: 
        tbl_frames.delete(f"video_id = '{video_id}'")
        print(f"🧹 Cleaned up old data for {video_id}")
    except: 
        pass


    files = [f for f in os.listdir(frames_folder) if f.endswith(".jpg")]
    if not files:
        print("⚠️ No frames found.")
        return

    files.sort(key=lambda x: int(x.split("_")[1].split(".")[0]))
    buffer = [] 

    for file in files:
        timestamp = float(file.split("_")[1].split(".")[0])
        path = os.path.join(frames_folder, file)
        image = Image.open(path)
        
        with torch.no_grad():
            inputs = processor(images=image, return_tensors="pt").to(device)
            outputs = model.get_image_features(**inputs)
            # Your normalization
            outputs = outputs / outputs.norm(p=2, dim=-1, keepdim=True)
            vector = outputs[0].cpu().tolist()
            
        buffer.append({
            "vector": vector,
            "video_id": video_id, 
            "timestamp": timestamp,
            "metadata": f"Frame at {timestamp}s"
        })
        
    if buffer:
        print(f"💾 Dumping {len(buffer)} frame vectors...")
        tbl_frames.add(buffer)
        print("🎉 Indexing Complete.")