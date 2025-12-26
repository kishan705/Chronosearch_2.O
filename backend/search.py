def search_index(query, db_path, table_name, filter_video_id=None):
    import lancedb
    import torch
    from transformers import AutoProcessor, AutoModel
    """
    Exact logic provided by user:
    - Encode Text
    - Normalize
    - Cosine Search
    """
    # --- 1. LOAD THE BRAIN ---
    device = "cuda" if torch.cuda.is_available() else "cpu"
    
    model = AutoModel.from_pretrained("google/siglip-so400m-patch14-384").to(device)
    processor = AutoProcessor.from_pretrained("google/siglip-so400m-patch14-384")

    # --- 2. CONNECT TO DB ---
    db = lancedb.connect(db_path)
    if table_name not in db.table_names():
        return []
        
    tbl = db.open_table(table_name)

    # --- 3. THE SEARCH LOGIC ---
    print(f"🔎 Searching for: '{query}'")

    with torch.no_grad():
        inputs = processor(text=[query], return_tensors="pt", padding="max_length").to(device)
        text_outputs = model.get_text_features(**inputs)
        # Normalize (CRITICAL per your code)
        text_outputs = text_outputs / text_outputs.norm(p=2, dim=-1, keepdim=True)
        query_vector = text_outputs[0].cpu().numpy()

    # B. Search
    search_job = tbl.search(query_vector).metric("cosine")
    
    if filter_video_id:
        search_job = search_job.where(f"video_id = '{filter_video_id}'")
        
    # Get top 10 matches
    results = search_job.limit(10).to_pandas()

    # --- 4. FORMAT RESULTS ---
    final_results = []
    for index, row in results.iterrows():
        # Your Score Logic: 1 - distance
        score = 1 - row['_distance'] 
        
        # Convert to % for UI display
        display_score = score * 100 
        
        final_results.append({
            "video_id": row['video_id'],
            "score": round(display_score, 1),
            "timestamp": row['timestamp'],
            "match_type": "Visual Match"
        })
        
    return sorted(final_results, key=lambda x: x['score'], reverse=True)