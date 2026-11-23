
####################....... search.py
MIN_CONFIDENCE = 0.0


def match_confidence(similarity, logit_scale, logit_bias):
    """
    SigLIP's match probability for one text-frame pair, between 0 and 1.

        confidence = sigmoid( exp(logit_scale) * similarity + logit_bias )

    similarity  : cosine similarity of the normalised text and frame vectors
    logit_scale : the model's learned scale, stored as a log (model.logit_scale)
    logit_bias  : the model's learned bias (model.logit_bias)

    Written in plain Python (numerically stable sigmoid) so it can be tested without a GPU.
    """
    import math
    z = math.exp(logit_scale) * similarity + logit_bias
    if z >= 0:
        return 1.0 / (1.0 + math.exp(-z))
    e = math.exp(z)
    return e / (1.0 + e)


def search_index(query, db_path, table_name, filter_video_id=None):
    import lancedb
    import torch
    from transformers import AutoProcessor, AutoModel
    """
    - Encode Text
    - Normalize
    - Cosine Search (find the closest frames)
    - Sigmoid Confidence (turn each similarity into a match probability)
    """
    # --- 1. LOAD THE BRAIN ---
    device = "cuda" if torch.cuda.is_available() else "cpu"

    model = AutoModel.from_pretrained("google/siglip-so400m-patch14-384").to(device)
    processor = AutoProcessor.from_pretrained("google/siglip-so400m-patch14-384")

    # SigLIP's two learned numbers that turn a similarity into a probability
    logit_scale = model.logit_scale.item()
    logit_bias = model.logit_bias.item()

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
        # Normalize
        text_outputs = text_outputs / text_outputs.norm(p=2, dim=-1, keepdim=True)
        query_vector = text_outputs[0].cpu().numpy()

    # B. Search
    search_job = tbl.search(query_vector).metric("cosine")

    if filter_video_id:
        search_job = search_job.where(f"video_id = '{filter_video_id}'")

    results = search_job.limit(10).to_pandas()

    # --- 4. FORMAT RESULTS ---
    final_results = []
    for index, row in results.iterrows():
        # Cosine similarity: LanceDB's cosine distance is 1 - similarity
        similarity = 1 - row['_distance']

        # Sigmoid confidence: SigLIP's probability that this frame matches the text
        confidence = match_confidence(similarity, logit_scale, logit_bias)
        if confidence < MIN_CONFIDENCE:
            continue

        final_results.append({
            "video_id": row['video_id'],
            "score": round(confidence * 100, 1),   # confidence in %, used for the score bar
            "confidence": round(confidence, 4),
            "similarity": round(similarity, 4),
            "timestamp": row['timestamp'],
            "match_type": "Visual Match"
        })

    return sorted(final_results, key=lambda x: x['confidence'], reverse=True)
