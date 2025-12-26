def extract_frames(video_path, output_folder):
    """
    Exact logic provided by user:
    - 1 Frame Per Second
    - Resize to width 640 (Maintain Aspect Ratio)
    """
    import cv2
    import os
    # 1. Create output folder if missing
    if not os.path.exists(output_folder):
        os.makedirs(output_folder, exist_ok=True)
        print(f"Created folder: {output_folder}")
    
    # 2. Open Video
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        print("Error: Could not open video.")
        return 0

    original_fps = cap.get(cv2.CAP_PROP_FPS) or 24
    print(f"Processing video at {original_fps} FPS...")
    
    frame_count = 0
    saved_count = 0

    while True:
        success, frame = cap.read()
        if not success:
            break # End of video
        
        # Calculate current timestamp
        current_time_sec = frame_count / original_fps
        
        # Simpler Logic: Just save exactly on the integer second mark
        # (Your requested logic)
        if frame_count % int(original_fps) == 0:
            
            # --- THE 4K FIX START (Your Logic) ---
            height, width = frame.shape[:2]
            new_width = 640
            new_height = int(height * (new_width / width)) # Keep aspect ratio
            resized_frame = cv2.resize(frame, (new_width, new_height))
            # --- THE 4K FIX END ---

            # Save the file
            filename = f"frame_{int(current_time_sec):04d}.jpg"
            filepath = os.path.join(output_folder, filename)
            cv2.imwrite(filepath, resized_frame)
            
            # print(f"Saved {filename} (Resized to {new_width}x{new_height})")
            saved_count += 1

        frame_count += 1

    cap.release()
    print(f"🎉 Done! Extracted {saved_count} frames.")
    return saved_count