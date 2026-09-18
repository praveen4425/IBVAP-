# AI Work Log

## 2026-09-18

### Task completed
- Added the Upload Video flow to the existing FastAPI backend and Live Cameras UI.
- The backend now accepts uploaded local video files, creates a processing job, runs real frame-by-frame YOLO inference with the repository model, and returns an annotated processed MP4.
- The frontend now shows upload control, job state, progress, detection summary, and an output video player in the Live Cameras area.

### Files modified
- [backend/app/main.py](backend/app/main.py)
- [backend/requirements.txt](backend/requirements.txt)
- [src/views/LiveCamerasView.tsx](src/views/LiveCamerasView.tsx)

### Files created
- [backend/app/services/video_processing.py](backend/app/services/video_processing.py)
- [AI_WORK_LOG.md](AI_WORK_LOG.md)

### Files deleted
- None

### Important implementation details
- Used the existing YOLO implementation via `UltralyticsDetector` and the repo model at `backend/yolov8n.pt`.
- Added a minimal background job model in-process using a dictionary keyed by job ID.
- Uploaded files are validated by extension and size, saved to a separate upload directory, then processed in a background thread.
- Processed frames are annotated with OpenCV rectangles and class labels; a simple tracker is reused for IDs in the annotation text.
- The backend exposes:
  - `POST /api/video/upload`
  - `GET /api/video/jobs/{job_id}`
  - `GET /api/video/jobs/{job_id}/output`
- The UI polls the status endpoint and renders the output video once the job completes.

### Tests performed
- `python -m compileall -q backend/app`
- `python -c "... TestClient upload flow ..."` against the live FastAPI app object
- `npm run lint`
- `npm run build`

### Test results
- Real detections were verified with a local Ultralytics sample image converted into a short MP4: `BUS` and `PERSON` detections were returned by the backend.
- Upload returned `200` and the job completed successfully.
- Output endpoint returned `200 video/mp4` with non-zero output bytes.
- Annotated output frame was readable and had large pixel changes relative to the source frame.
- Frontend typecheck and production build passed with `npm run lint` and `npm run build`.

### Known issues / blockers
- The active editor/Pylance environment reported unresolved FastAPI imports even though the actual terminal Python environment successfully imported and ran FastAPI.
- There was no repo-local video asset available for a full UI browser test, so validation used a generated local MP4 built from a Ultralytics sample image.
- No live browser automation was executed in this validation pass; the check was backend-level and build-level.

### Remaining work
- Frontend browser verification using a real local video in the running app.
- Optionally align the editor interpreter/Pylance environment with the working backend environment.

### Recommended next step for the next AI agent
- Start the backend in the same Python environment that successfully imports FastAPI and run the React app, then upload a short local video through the UI and verify the job transitions from queued → processing → completed and the processed video is playable.

## 2026-09-18 (Upload stage clarification)

### What was changed
- Kept the existing upload processing pipeline intact.
- Updated the upload panel in [src/views/LiveCamerasView.tsx](src/views/LiveCamerasView.tsx) to clearly separate the upload phase from AI processing.
- The UI now shows an honest `Uploading video...` state while the file is being sent to the backend, and then switches to the existing AI-processing progress state once the backend job is live.
- The completed stage still uses the generated annotated output video and the existing detection summary.

### What tests already passed
- Backend route registration and upload/job/output flow were validated earlier with the FastAPI app object and a local sample video.
- The backend upload flow returned a job and the generated output endpoint returned a valid `video/mp4` response.
- Real YOLO inference produced actual detections in earlier validation.
- Frontend lint/build passed earlier with `npm run lint` and `npm run build`.

### What was not verified
- Browser playback in the running app was not manually verified in this final stop point.
- No live browser automation check was completed for the actual UI flow after the stage-label adjustment.
- A real `sample_video_2.mp4` browser upload was not manually confirmed in this final state.

### Remaining limitation
- Browser playback still needs manual verification in the running application because it was not directly observed in this final pass.
- Because of that, I am not claiming the browser playback is fixed or fully verified.

## 2026-09-18 (Upload Video diagnosis)

### Root cause
- The frontend sends upload, polling, and output requests to `http://127.0.0.1:8000`.
- The current source FastAPI app registers `/api/video/upload`, `/api/video/jobs/{job_id}`, and `/api/video/jobs/{job_id}/output`.
- No Python/Uvicorn process was running during diagnosis, so the browser frontend had no active backend owner for those routes.
- Existing generated MP4 files were readable by OpenCV and used the `FMP4` codec tag; browser playback was not verified.

### Files modified
- None during this diagnosis.

### Validation performed
- Confirmed the frontend URLs in [src/views/LiveCamerasView.tsx](src/views/LiveCamerasView.tsx).
- Confirmed FastAPI route registration from [backend/app/main.py](backend/app/main.py).
- FastAPI TestClient returned `400` for an invalid upload, proving the source upload route exists, and `404` only for an unknown job ID.
- Inspected existing output files: OpenCV opened them successfully; one output had 271 frames at 3840x2160 and the `FMP4` codec tag.
- Confirmed only Node/Vite processes were running; no Python/Uvicorn backend process was running.

### Known limitation
- No backend was started and no long YOLO/video test was run.
- Browser upload and browser playback remain unverified until the existing FastAPI app is running at `127.0.0.1:8000`.
- No codec-generation change was made because a browser-compatible H.264 encoder was not available for a safe targeted validation.

## 2026-09-18 (Browser playback encoding fix)

### Root cause
- Existing annotated outputs were MP4 containers using the `FMP4` codec tag, which is not a reliable Chrome playback codec.
- The output endpoint itself was correct: it returned HTTP 200, `video/mp4`, and real MP4 bytes for an existing generated file.
- OpenCV FFmpeg could not initialize H.264 because the required OpenH264 library was unavailable, but the already-installed Windows Media Foundation backend could create readable AVC MP4 output.

### Exact change
- Modified only [backend/app/services/video_processing.py](backend/app/services/video_processing.py).
- Changed the existing `VideoWriter` construction from `mp4v` to `cv2.CAP_MSMF` with the `avc1` codec.
- YOLO detection, tracking, progress, upload behavior, and output route were unchanged.

### Validation
- Created and decoded one synthetic frame with the new Media Foundation AVC writer: writer opened, output was readable, and codec was AVC-compatible.
- Existing output endpoint check: HTTP `200`, `Content-Type: video/mp4`, non-empty body beginning with MP4 `ftyp` bytes.
- `npm run lint` passed.
- Diagnostics reported no errors in the changed backend service or Live Cameras file.

### Codec status and limitation
- Existing generated files: `FMP4` in MP4 containers.
- Newly generated files: `avc1`/AVC MP4 through Media Foundation.
- Chrome browser playback was not directly verified in this pass; no claim of browser playback success is made until a newly generated AVC output is opened in Chrome.
