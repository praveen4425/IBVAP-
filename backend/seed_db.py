import requests

CAMERAS = [
    {
        "camera_id": "CAM-01",
        "name": "CAM-01: BOP Main Entry Gate",
        "stream_url": "rtsp://192.168.10.41:554/ch1/main"
    },
    {
        "camera_id": "CAM-02",
        "name": "CAM-02: Border Road North",
        "stream_url": "rtsp://192.168.10.42:554/ch2/main"
    },
    {
        "camera_id": "CAM-03",
        "name": "CAM-03: Perimeter Zone East",
        "stream_url": "rtsp://192.168.10.43:554/ch3/main"
    },
    {
        "camera_id": "CAM-04",
        "name": "CAM-04: Observation Tower Charlie",
        "stream_url": "rtsp://192.168.10.44:554/ch4/main"
    }
]

for cam in CAMERAS:
    try:
        r = requests.post("http://127.0.0.1:8000/api/cameras", json=cam)
        print(f"Added {cam['camera_id']}: {r.status_code}")
    except Exception as e:
        print(f"Failed to add {cam['camera_id']}: {e}")
