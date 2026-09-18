import uvicorn
import threading
import time
from app.services.camera_manager import camera_manager
from app.services.ai_pipeline import ai_pipeline_manager
from app.services.ultralytics_detector import UltralyticsDetector
from app.services.sort_tracker import SortTracker

def seed_demo():
    print("Waiting for server to start...")
    time.sleep(3)
    
    cam_id = "CAM-01"
    try:
        # Use a local test video or webcam (0). Using a free test video stream if possible, otherwise webcam.
        camera_manager.add_camera(cam_id, "Main Entry Gate (Demo)", "0") 
        print(f"Added camera {cam_id}")
        
        detector = UltralyticsDetector("yolov8n.pt")
        tracker = SortTracker()
        
        ai_pipeline_manager.start_camera(cam_id, detector, tracker)
        print(f"AI Pipeline started for {cam_id}")
    except Exception as e:
        print(f"Error starting demo pipeline: {e}")

if __name__ == "__main__":
    t = threading.Thread(target=seed_demo, daemon=True)
    t.start()
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000)
