####################.......extract.py
def extract_frames(video_path, output_folder):
    """
    Exact logic provided by user:
    - 2 Frames Per Second (Fixed Math)
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

    # Capture 2 frames per second
    capture_interval = int(original_fps / 2)
    if capture_interval < 1: capture_interval = 1

    frame_count = 0
    saved_count = 0

    while True:
        success, frame = cap.read()
        if not success:
            break # End of video
        
        # Only save every Nth frame (e.g., every 15th frame for 30fps video)
        if frame_count % int(capture_interval) == 0:
            
            current_time_sec = saved_count * 0.5

            # --- THE 4K FIX START ---
            height, width = frame.shape[:2]
            new_width = 640
            new_height = int(height * (new_width / width)) # Keep aspect ratio
            resized_frame = cv2.resize(frame, (new_width, new_height))
            # --- THE 4K FIX END ---

            # Save the file (Double format: frame_1.50.jpg)
            filename = f"frame_{current_time_sec:.2f}.jpg"
            filepath = os.path.join(output_folder, filename)
            cv2.imwrite(filepath, resized_frame)
            
            saved_count += 1

        frame_count += 1

    cap.release()
    print(f"🎉 Done! Extracted {saved_count} frames.")
    return saved_count