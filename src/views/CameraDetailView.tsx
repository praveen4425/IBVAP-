import React, { useState } from 'react';
import { CameraData, IncidentRecord, EvidenceRecord, AnprScan, FaceScreeningSubject } from '../types';

interface CameraDetailViewProps {
  camera: CameraData;
  allCameras: CameraData[];
  incidents: IncidentRecord[];
  evidence: EvidenceRecord[];
  anprScans: AnprScan[];
  faceSubjects: FaceScreeningSubject[];
  onBack: () => void;
  onSelectCamera: (cameraId: string) => void;
  onNavigateIncidents: (incidentId: string) => void;
  onNavigateEvidence: (evidenceId: string) => void;
  onOpenDispatch: (incident: IncidentRecord) => void;
}

export const CameraDetailView: React.FC<CameraDetailViewProps> = ({
  camera,
  allCameras,
  incidents,
  evidence,
  anprScans,
  faceSubjects,
  onBack,
  onSelectCamera,
  onNavigateIncidents,
  onNavigateEvidence,
  onOpenDispatch
}) => {
  // Overlay display states
  const [showBoxes, setShowBoxes] = useState(true);
  const [showTrackIds, setShowTrackIds] = useState(true);
  const [showTripwires, setShowTripwires] = useState(true);
  const [showConfidence, setShowConfidence] = useState(true);

  // Filter camera-specific items
  const cameraIncidents = incidents.filter((inc) => inc.cameraId === camera.id);
  const cameraEvidence = evidence.filter((ev) => ev.cameraId === camera.id);
  const cameraAnpr = anprScans.filter((an) => an.cameraId === camera.id);
  const cameraFaces = faceSubjects.filter((f) => f.cameraId === camera.id);

  const isAlert = camera.status === 'alert';

  return (
    <div className="space-y-5 pb-10">
      {/* Top Breadcrumb & Switcher Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[13px] font-semibold flex items-center gap-1.5 transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            <span>Back to Live Cameras</span>
          </button>
          <div className="h-5 w-[1px] bg-slate-200 hidden sm:block"></div>
          <div>
            <div className="flex items-center gap-2">
              <span
                className={`font-mono text-[11px] font-bold px-2 py-0.5 rounded-lg text-white ${
                  isAlert ? 'bg-[#ef4444]' : 'bg-[#0052ff]'
                }`}
              >
                {camera.id}
              </span>
              <h1 className="text-lg font-bold text-[#0f172a]">{camera.name}</h1>
            </div>
            <div className="text-xs text-[#64748b] mt-0.5">
              {camera.location} • Sector IV Indo-Nepal Frontier
            </div>
          </div>
        </div>

        {/* Quick Camera Switcher Buttons */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mr-1 hidden md:inline">
            Switch:
          </span>
          {allCameras.map((c) => (
            <button
              key={c.id}
              onClick={() => onSelectCamera(c.id)}
              className={`px-3 py-1.5 rounded-xl text-[12px] font-semibold transition-all ${
                c.id === camera.id
                  ? c.status === 'alert'
                    ? 'bg-[#ef4444] text-white shadow-xs'
                    : 'bg-[#0052ff] text-white shadow-xs'
                  : c.status === 'alert'
                  ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200/60'
                  : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200/80'
              }`}
            >
              {c.id}
            </button>
          ))}
        </div>
      </div>

      {/* 1. Large Dedicated Camera Video Feed */}
      <section className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Stream Banner */}
        <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 font-mono text-[12px] flex-wrap">
            <span
              className={`flex items-center gap-1.5 font-bold px-2.5 py-1 rounded-lg text-[11px] ${
                isAlert
                  ? 'bg-red-50 text-[#ef4444] border border-red-200/60'
                  : 'bg-emerald-50 text-[#10b981] border border-emerald-200/60'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isAlert ? 'bg-[#ef4444] animate-ping' : 'bg-[#10b981]'
                }`}
              ></span>
              {isAlert ? 'CRITICAL BREACH DETECTED' : 'RTSP LIVE STREAM'}
            </span>
            <span className="text-slate-500">{camera.ipAddress}</span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-500">{camera.resolution}</span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-500">{camera.fps} FPS</span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-500">{camera.bitrate}</span>
          </div>

          <div className="flex items-center gap-3 font-mono text-[11px] text-slate-500 bg-slate-50 px-3 py-1 rounded-xl border border-slate-200/80">
            <span>LAT: {camera.latencyMs}ms</span>
            <span>|</span>
            <span className="text-emerald-600 font-semibold">YOLOv8x: {camera.yoloInferenceMs}ms</span>
          </div>
        </div>

        {/* Video Canvas Container with Overlays */}
        <div className="relative aspect-video max-h-[640px] bg-slate-950 overflow-hidden select-none">
          <img
            src={camera.imageUrl}
            alt={camera.name}
            className="w-full h-full object-cover"
          />

          {/* OSD Stamp Overlay */}
          <div className="absolute top-4 left-4 bg-black/75 backdrop-blur-xs text-white p-3 rounded-xl text-[11px] font-mono border border-white/10 space-y-1">
            <div className="flex items-center gap-2 font-bold">
              <span className="text-[#ef4444]">LIVE ●</span>
              <span>{camera.id}</span>
              <span className="text-slate-300">[{camera.gridRef}]</span>
            </div>
            <div className="text-slate-300">{camera.geoCoordinates}</div>
            <div className="text-slate-400 truncate max-w-[260px]">URI: {camera.sourceUri}</div>
          </div>

          {/* Tripwire Graphic */}
          {showTripwires && camera.id === 'CAM-03' && (
            <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-[#ef4444] shadow-[0_0_12px_#ef4444] flex items-center justify-between px-6 pointer-events-none">
              <span className="bg-[#ef4444] text-white font-mono text-[10px] font-bold px-2 py-0.5 rounded shadow-xs">
                VIRTUAL TRIPWIRE ZERO-LINE ALPHA
              </span>
              <span className="bg-[#ef4444] text-white font-mono text-[10px] font-bold px-2 py-0.5 rounded shadow-xs animate-pulse">
                BREACH TRIGGERED (0.8m BUFFER)
              </span>
            </div>
          )}

          {showTripwires && camera.id !== 'CAM-03' && (
            <div className="absolute bottom-1/3 left-0 right-0 border-b-2 border-dashed border-[#10b981] flex items-center justify-between px-6 pointer-events-none opacity-90">
              <span className="bg-emerald-800/90 text-white font-mono text-[9px] font-bold px-2 py-0.5 rounded shadow-xs">
                VIRTUAL TRIPWIRE BOUNDARY (INTACT)
              </span>
            </div>
          )}

          {/* Bounding Boxes */}
          {showBoxes &&
            camera.detections.map((det) => (
              <div
                key={det.id}
                className="absolute border-2 pointer-events-none transition-all rounded-xs"
                style={{
                  top: det.bbox?.top,
                  left: det.bbox?.left,
                  width: det.bbox?.width,
                  height: det.bbox?.height,
                  borderColor: det.isAlert ? '#ef4444' : det.className.toLowerCase().includes('person') ? '#10b981' : '#0052ff',
                  backgroundColor: det.isAlert ? 'rgba(239, 68, 68, 0.18)' : 'rgba(0, 82, 255, 0.08)'
                }}
              >
                <div
                  className={`text-[9px] font-mono font-bold px-1.5 py-0.5 text-white inline-flex items-center gap-1 rounded-xs ${
                    det.isAlert ? 'bg-[#ef4444]' : det.className.toLowerCase().includes('person') ? 'bg-[#10b981]' : 'bg-[#0052ff]'
                  }`}
                >
                  <span>{det.className.toUpperCase()}</span>
                  {showTrackIds && det.trackId && <span>[ID:{det.trackId}]</span>}
                  {showConfidence && <span>{Math.round(det.confidence * 100)}%</span>}
                </div>

                {det.subLabel && (
                  <div className="mt-0.5 bg-black/85 text-slate-200 text-[9px] font-mono px-1.5 py-0.5 max-w-xs truncate rounded-xs">
                    {det.subLabel}
                  </div>
                )}

                {det.isAlert && (
                  <div className="mt-1 bg-[#ef4444] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-xs animate-pulse">
                    {det.alertText}
                  </div>
                )}
              </div>
            ))}
        </div>

        {/* Video HUD Control Bar */}
        <div className="p-4 bg-slate-50/80 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-[13px]">
          <div className="flex items-center gap-4 sm:gap-6 flex-wrap font-medium text-slate-800">
            <span className="text-slate-500 text-[11px] font-bold uppercase tracking-wider">Display Overlays:</span>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showBoxes}
                onChange={(e) => setShowBoxes(e.target.checked)}
                className="w-4 h-4 rounded text-[#0052ff] border-slate-300 focus:ring-0"
              />
              <span>YOLO Boxes</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showTrackIds}
                onChange={(e) => setShowTrackIds(e.target.checked)}
                className="w-4 h-4 rounded text-[#0052ff] border-slate-300 focus:ring-0"
              />
              <span>Track IDs</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showTripwires}
                onChange={(e) => setShowTripwires(e.target.checked)}
                className="w-4 h-4 rounded text-[#0052ff] border-slate-300 focus:ring-0"
              />
              <span>Virtual Fence / Tripwires</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showConfidence}
                onChange={(e) => setShowConfidence(e.target.checked)}
                className="w-4 h-4 rounded text-[#0052ff] border-slate-300 focus:ring-0"
              />
              <span>Confidence %</span>
            </label>
          </div>

          <div className="font-mono text-[11px] text-slate-500 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
            PTZ PRESET: {camera.ptzPreset}
          </div>
        </div>
      </section>

      {/* 2. Camera Identification & Hardware Specifications (Clean 4 Metric Cards) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#64748b]">
            BOP &amp; Location
          </div>
          <div className="font-bold text-[16px] text-[#0f172a] mt-1.5">{camera.location}</div>
          <div className="text-[12px] text-[#64748b] mt-0.5">{camera.sector}</div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#64748b]">
            Geo Anchor / Grid
          </div>
          <div className="font-mono font-bold text-[14px] text-[#0f172a] mt-1.5 truncate">
            {camera.geoCoordinates}
          </div>
          <div className="text-[12px] font-mono text-[#64748b] mt-0.5">
            GRID: {camera.gridRef}
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#64748b]">
            Stream Source
          </div>
          <div className="font-semibold text-[14px] text-[#0f172a] mt-1.5">{camera.sensorType}</div>
          <div className="text-[12px] text-[#64748b] mt-0.5">{camera.deployment}</div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#64748b]">
            Stream Profile
          </div>
          <div className="font-semibold text-[14px] text-[#0f172a] mt-1.5">{camera.coverageFov}</div>
          <div className="text-[12px] text-[#64748b] mt-0.5">{camera.irAssist}</div>
        </div>
      </section>

      {/* 3. Current Detections & Track IDs & Virtual Fence Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left 2-col: Current Detections & Track IDs */}
        <section className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-[15px] font-bold text-[#0f172a] flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-[#0052ff]">filter_center_focus</span>
                <span>Current Live Detections &amp; Track IDs</span>
              </h2>
              <p className="text-[12px] text-[#64748b] mt-0.5">
                Real-time YOLOv8 bounding tracking on {camera.id}
              </p>
            </div>
            <span className="font-mono text-[11px] font-bold bg-blue-50 text-[#0052ff] border border-blue-200/60 px-2.5 py-1 rounded-lg">
              {camera.detections.length} Target(s) In Frame
            </span>
          </div>

          <div className="space-y-2.5">
            {camera.detections.map((det) => (
              <div
                key={det.id}
                className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  det.isAlert
                    ? 'bg-red-50/40 border-red-200/80'
                    : 'bg-slate-50/70 border-slate-200/80'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded text-white ${
                        det.isAlert ? 'bg-[#ef4444]' : 'bg-[#0052ff]'
                      }`}
                    >
                      TRACK ID #{det.trackId || 'N/A'}
                    </span>
                    <span className="font-bold text-[13px] text-[#0f172a]">{det.className}</span>
                    <span className="font-mono text-[11px] text-emerald-600 font-semibold bg-white px-2 py-0.5 rounded border border-slate-200">
                      {Math.round(det.confidence * 100)}% Conf
                    </span>
                    {det.isAlert && (
                      <span className="bg-[#ef4444] text-white text-[10px] font-bold px-2 py-0.5 rounded animate-pulse">
                        BREACH
                      </span>
                    )}
                  </div>
                  {det.subLabel && (
                    <div className="text-[12px] text-[#64748b]">{det.subLabel}</div>
                  )}
                </div>

                <div className="flex items-center gap-4 text-[11px] font-mono text-slate-500">
                  <div>
                    <span className="text-slate-400">Dwell:</span>{' '}
                    <span className="font-bold text-[#0f172a]">{det.dwellTime || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Velocity:</span>{' '}
                    <span className="font-bold text-[#0f172a]">{det.speed || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Buffer:</span>{' '}
                    <span
                      className={`font-bold ${
                        det.isAlert ? 'text-[#ef4444]' : 'text-emerald-600'
                      }`}
                    >
                      {det.bufferDist || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Right 1-col: Virtual Fence Status */}
        <section className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-[15px] font-bold text-[#0f172a] flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px] text-[#0052ff]">fence</span>
              <span>Virtual Fence Status</span>
            </h2>
            <span
              className={`font-mono text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase ${
                camera.virtualFenceStatus === 'breached'
                  ? 'bg-red-50 text-[#ef4444] border border-red-200/60'
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
              }`}
            >
              {camera.virtualFenceStatus}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
            <div className="text-[13px] font-semibold text-[#0f172a]">
              {camera.tripwireStatus}
            </div>
            <div className="text-[12px] text-[#64748b]">
              Virtual tripwire line dynamically mapped to 5m prohibited Indo-Nepal border strip.
            </div>
          </div>

          <div className="space-y-2.5 text-[12px]">
            <div className="flex justify-between items-center py-1 border-b border-slate-100">
              <span className="text-[#64748b]">Tripwire Rule:</span>
              <span className="font-semibold text-[#0f172a]">Zero-Line Inbound Vector</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-100">
              <span className="text-[#64748b]">Sensitivity:</span>
              <span className="font-mono text-[#0f172a]">High (Min 3 frames loiter)</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-[#64748b]">Last Calibrated:</span>
              <span className="font-mono text-[#64748b]">Today, 06:00 IST</span>
            </div>
          </div>
        </section>
      </div>

      {/* 4. ANPR / Face Data when available for this camera */}
      {(camera.hasAnprData || camera.hasFaceData) && (
        <section className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-[15px] font-bold text-[#0f172a] flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px] text-[#0052ff]">
                document_scanner
              </span>
              <span>Associated ANPR &amp; Face Analytics Data</span>
            </h2>
            <p className="text-[12px] text-[#64748b] mt-0.5">
              Integrated license plate recognition &amp; biometric pedestrian stream on {camera.id}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* ANPR Card if available */}
            {camera.hasAnprData && cameraAnpr.length > 0 && (
              <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#0052ff] flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px]">directions_car</span>
                    <span>Active ANPR Detection</span>
                  </span>
                  <span className="font-mono text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded">
                    OCR {cameraAnpr[0].ocrConf}%
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  {/* Indian HSRP License Plate Mock */}
                  <div className="bg-[#facc15] border-2 border-black rounded-lg px-3 py-1 font-mono font-extrabold text-[15px] tracking-wider text-black flex items-center gap-2 shadow-xs">
                    <span className="text-[10px] text-blue-900 border-r border-black pr-1 font-bold">IND</span>
                    <span>{cameraAnpr[0].plate}</span>
                  </div>
                  <div>
                    <div className="text-[13px] font-bold text-[#0f172a]">
                      {cameraAnpr[0].vehicleClass}
                    </div>
                    <div className="text-[11px] text-[#64748b]">
                      Radar Speed: {cameraAnpr[0].radarSpeed}
                    </div>
                  </div>
                </div>

                <div className="text-[12px] text-[#64748b] bg-white p-2.5 rounded-lg border border-slate-200">
                  <span className="font-semibold text-[#0f172a]">Permit ID: </span>
                  {cameraAnpr[0].permitId} — {cameraAnpr[0].permitDetails}
                </div>
              </div>
            )}

            {/* Face Screening Card if available */}
            {camera.hasFaceData && cameraFaces.length > 0 && (
              <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#0052ff] flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px]">face</span>
                    <span>Walkthrough Pedestrian Face Stream</span>
                  </span>
                  <span className="font-mono text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded">
                    Quality {cameraFaces[0].quality}/100
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <img
                    src={cameraFaces[0].cropUrl}
                    alt="Face Crop"
                    className="w-12 h-12 rounded-xl object-cover border-2 border-[#0052ff] shrink-0"
                  />
                  <div>
                    <div className="text-[13px] font-bold text-[#0f172a]">{cameraFaces[0].id}</div>
                    <div className="text-[11px] text-emerald-700 font-semibold">
                      {cameraFaces[0].watchlistMatch}
                    </div>
                    <div className="text-[11px] text-[#64748b]">{cameraFaces[0].classification}</div>
                  </div>
                </div>

                <div className="text-[12px] text-[#64748b] bg-white p-2.5 rounded-lg border border-slate-200 flex justify-between">
                  <span>Pose: {cameraFaces[0].pose}</span>
                  <span>Lighting: {cameraFaces[0].lighting}</span>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* 5. Recent Incidents for this Camera */}
      <section className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-[15px] font-bold text-[#0f172a] flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px] text-[#0052ff]">warning</span>
              <span>Recent Incidents on {camera.id}</span>
            </h2>
            <p className="text-[12px] text-[#64748b] mt-0.5">
              Historical breach triggers and security alerts generated by this camera
            </p>
          </div>
          <span className="font-mono text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
            {cameraIncidents.length} Records Found
          </span>
        </div>

        {cameraIncidents.length === 0 ? (
          <div className="text-center py-6 text-[#64748b] text-[13px]">
            No recent security alerts recorded on this camera.
          </div>
        ) : (
          <div className="space-y-2.5">
            {cameraIncidents.map((inc) => (
              <div
                key={inc.id}
                className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-bold text-[12px] text-[#0f172a]">{inc.id}</span>
                    <span className="font-mono text-[11px] text-slate-400">[{inc.timestamp}]</span>
                    <span
                      className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                        inc.severity === 'critical'
                          ? 'bg-red-50 text-[#ef4444] border border-red-200'
                          : 'bg-amber-50 text-[#f59e0b] border border-amber-200'
                      }`}
                    >
                      {inc.severity}
                    </span>
                    <span className="text-[13px] font-semibold text-[#0f172a]">
                      {inc.classification}
                    </span>
                  </div>
                  <div className="text-[12px] text-[#64748b]">{inc.description}</div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => onNavigateIncidents(inc.id)}
                    className="px-3 py-1.5 bg-white border border-slate-200/80 hover:bg-slate-100 text-slate-700 rounded-xl text-[12px] font-semibold transition-colors"
                  >
                    View Lifecycle
                  </button>
                  {inc.severity === 'critical' && (
                    <button
                      onClick={() => onOpenDispatch(inc)}
                      className="px-3 py-1.5 bg-[#ef4444] hover:bg-red-600 text-white rounded-xl text-[12px] font-semibold transition-colors shadow-xs"
                    >
                      Dispatch QRT
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 6. Related Evidence for this Camera */}
      <section className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-[15px] font-bold text-[#0f172a] flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px] text-[#0052ff]">folder_open</span>
              <span>Forensic Evidence Captured by {camera.id}</span>
            </h2>
            <p className="text-[12px] text-[#64748b] mt-0.5">
              Tamper-evident video clips and signed telemetry records
            </p>
          </div>
          <span className="font-mono text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
            {cameraEvidence.length} Saved Files
          </span>
        </div>

        {cameraEvidence.length === 0 ? (
          <div className="text-center py-6 text-[#64748b] text-[13px]">
            No archived forensic clips stored for this camera node.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {cameraEvidence.map((ev) => (
              <div
                key={ev.id}
                className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-slate-50 flex items-center gap-3 transition-colors"
              >
                <img
                  src={ev.previewImageUrl}
                  alt={ev.title}
                  className="w-20 h-14 object-cover rounded-lg border border-slate-200 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-[11px] text-[#0052ff]">{ev.id}</span>
                    <span className="font-mono text-[11px] text-slate-400">({ev.clipDuration})</span>
                  </div>
                  <div className="text-[13px] font-bold text-[#0f172a] truncate mt-0.5">{ev.title}</div>
                  <div className="text-[10px] font-mono text-slate-400 truncate mt-0.5">{ev.cryptoHash}</div>
                </div>
                <button
                  onClick={() => onNavigateEvidence(ev.id)}
                  className="px-3 py-1.5 bg-white border border-slate-200/80 hover:bg-slate-100 text-slate-800 rounded-xl text-[12px] font-semibold shrink-0 transition-colors"
                >
                  Examine
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
