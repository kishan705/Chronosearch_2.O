def search_global_unified(query, db_path, frame_table_name):
    import lancedb
    import torch
    from transformers import AutoProcessor, AutoModel
    import pandas as pd

    """
    Hybrid Search Strategy:
    1. Search Metadata (Titles/Tags)
    2. Search Visual Content (Frames)
    3. Merge and Rank results
    """
    META_TABLE = "video_metadata_index"
    
    # --- 1. LOAD MODEL ---
    device = "cuda" if torch.cuda.is_available() else "cpu"
    # We load the model once to vectorise the query
    model = AutoModel.from_pretrained("google/siglip-so400m-patch14-384").to(device)
    processor = AutoProcessor.from_pretrained("google/siglip-so400m-patch14-384")

    # --- 2. VECTORIZE QUERY ---
    print(f"🌍 Hybrid Search for: '{query}'")
    with torch.no_grad():
        inputs = processor(text=[query], return_tensors="pt", padding="max_length").to(device)
        text_outputs = model.get_text_features(**inputs)
        text_outputs = text_outputs / text_outputs.norm(p=2, dim=-1, keepdim=True)
        query_vector = text_outputs[0].cpu().numpy()

    # --- 3. CONNECT DB ---
    db = lancedb.connect(db_path)
    final_candidates = {} # Map: video_id -> {score, reason, timestamp}

    # ==========================================
    # 🕵️ STRATEGY A: METADATA SEARCH (Titles)
    # ==========================================
    if META_TABLE in db.table_names():
        tbl_meta = db.open_table(META_TABLE)
        meta_hits = tbl_meta.search(query_vector).metric("cosine").limit(20).to_pandas()
        
        for _, row in meta_hits.iterrows():
            score = 1 - row['_distance']
            if score < 0.10: continue # Skip strict garbage
            
            # Boost Title Matches (Titles are strong signals)
            # We multiply by 1.2 to give preference to metadata matches
            boosted_score = score * 1.2 
            
            final_candidates[row['video_id']] = {
                "video_id": row['video_id'],
                "title": row['title'],
                "score": boosted_score,
                "match_type": "Title Match",
                "timestamp": None, # Jump to start
                "preview_url": f"/data/videos/{row['video_id']}.mp4"
            }

    # ==========================================
    # 👁️ STRATEGY B: VISUAL SEARCH (Frames)
    # ==========================================
    if frame_table_name in db.table_names():
        tbl_frames = db.open_table(frame_table_name)
        
        # Search across ALL frames of ALL videos
        frame_hits = tbl_frames.search(query_vector).metric("cosine").limit(50).to_pandas()
        
        for _, row in frame_hits.iterrows():
            vid_id = row['video_id']
            raw_score = 1 - row['_distance']
            
            # Use your Honest Threshold (0.15)
            if raw_score < 0.15: continue
            
            # Check if we already found this video via Title
            if vid_id in final_candidates:
                # If visual score is SUPER high, maybe update the snippet?
                # But generally, keep the Title match as primary.
                # We slightly boost the existing score because it matched BOTH.
                final_candidates[vid_id]['score'] += 0.05
                final_candidates[vid_id]['match_type'] += " + Visuals"
            else:
                # New candidate found ONLY via visual
                # We only keep the BEST frame for this video (Deduplication)
                if vid_id not in final_candidates or raw_score > final_candidates[vid_id]['score']:
                    final_candidates[vid_id] = {
                        "video_id": vid_id,
                        "title": "Untitled (Visual Match)", # We might not have title here easily
                        "score": raw_score,
                        "match_type": "Visual Match",
                        "timestamp": row['timestamp'], # Jump to this moment
                        "preview_url": f"/data/videos/{vid_id}.mp4"
                    }

    # --- 4. FORMAT & SORT ---
    results_list = list(final_candidates.values())
    
    # Normalize scores for display (0.0 - 100.0)
    for res in results_list:
        # Cap at 100, make small scores look readable
        res['score_display'] = min(100, round(res['score'] * 100, 1))
        
    # Sort by Score (Highest First)
    results_list.sort(key=lambda x: x['score'], reverse=True)
    
    return results_list