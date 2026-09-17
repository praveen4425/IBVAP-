import React, { useState } from 'react';
import { CameraData } from '../types';

interface LiveCamerasViewProps {
  cameras: CameraData[];
  selectedCameraId: string;
  onSelectCamera: (cameraId: string) => void;
  onOpenDetail: (cameraId: string) => void;
}

export const LiveCamerasView: React.FC<LiveCamerasViewProps> = ({
  cameras,
  selectedCameraId,
  onSelectCamera,
  onOpenDetail
}) => {
  const activeCamera = cameras.find((c) => c.id === selectedCameraId) || cameras[0];

  // Overlay toggles
  const [showBoxes, setShowBoxes] = useState(true);
  const [showTrackIds, setShowTrackIds] = useState(true);
  const [showTripwires, setShowTripwires] = useState(true);
  const [showConfidence, setShowConfidence] = useState(true);

  return (
    <div className="space-y-5 pb-10">
      {/* 1. Page Title & Camera Switcher Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-[#0f172a] tracking-tight">
              Tactical Live Stream Monitor
            </h1>
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 border border-red-200/60 text-red-600 text-[11px] font-bold uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-[#ef4444] animate-pulse"></span>
              Live Feed
            </span>
          </div>
          <p className="text-sm text-[#64748b] mt-0.5">
            RTSP Multi-Stream Ingestion &amp; Real-time AI Inference Engine
          </p>
        </div>

        {/* Camera Selector Pills */}
        <div className="flex items-center gap-2 flex-wrap">
          {cameras.map((cam) => {
            const isSelected = cam.id === activeCamera.id;
            const isAlert = cam.status === 'alert';
            return (
              <button
                key={cam.id}
                onClick={() => onSelectCamera(cam.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-[12px] font-semibold transition-all ${
                  isSelected
                    ? isAlert
                      ? 'bg-[#ef4444] text-white shadow-xs'
                      : 'bg-[#0052ff] text-white shadow-xs'
                    : isAlert
                    ? 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200/60'
                    : 'bg-white border border-slate-200/80 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    isAlert ? 'bg-white animate-pulse' : isSelected ? 'bg-white' : 'bg-[#10b981]'
                  }`}
                ></span>
                <span>{cam.id}</span>
                <span className="font-normal opacity-80 hidden sm:inline text-[11px]">
                  ({cam.shortName})
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Primary Selected Camera Feed Screen */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Stream Top Info Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span
              className={`font-mono text-[12px] font-bold px-2.5 py-1 rounded-lg text-white ${
                activeCamera.status === 'alert' ? 'bg-[#ef4444]' : 'bg-[#0052ff]'
              }`}
            >
              {activeCamera.id}
            </span>
            <div>
              <h2 className="text-[16px] font-bold text-[#0f172a]">{activeCamera.name}</h2>
              <div className="text-[12px] text-[#64748b] flex items-center gap-2 mt-0.5">
                <span>{activeCamera.location}</span>
                <span>•</span>
                <span className="font-mono text-[11px]">{activeCamera.geoCoordinates}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 font-mono text-[11px] text-slate-600 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200/80">
              <span className="text-emerald-600 font-semibold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse"></span>
                RTSP LIVE
              </span>
              <span>|</span>
              <span>{activeCamera.resolution}</span>
              <span>|</span>
              <span>{activeCamera.fps} FPS</span>
              <span>|</span>
              <span>LAT {activeCamera.latencyMs}ms</span>
            </div>

            <button
              onClick={() => onOpenDetail(activeCamera.id)}
              className="px-3.5 py-1.5 bg-[#0052ff] hover:bg-blue-700 text-white rounded-xl text-[12px] font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">open_in_full</span>
              <span>Full Camera Details</span>
            </button>
          </div>
        </div>

        {/* Video Canvas Container with AI Overlays */}
        <div className="relative aspect-video max-h-[600px] bg-slate-950 overflow-hidden select-none">
          <img
            src={activeCamera.imageUrl}
            alt={activeCamera.name}
            className="w-full h-full object-cover"
          />

          {/* Top-Left OSD Ingest Info */}
          <div className="absolute top-3 left-3 bg-black/75 backdrop-blur-xs text-white p-2.5 rounded-xl text-[11px] font-mono border border-white/10 space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[#ef4444] font-bold">REC ●</span>
              <span className="font-bold text-white">{activeCamera.id}</span>
              <span className="text-slate-300">GRID: {activeCamera.gridRef}</span>
            </div>
            <div className="text-slate-300">STREAM: {activeCamera.sourceUri}</div>
            <div className="text-slate-300">PRESET: {activeCamera.ptzPreset}</div>
          </div>

          {/* Top-Right Model Latency */}
          <div className="absolute top-3 right-3 bg-black/75 backdrop-blur-xs text-white p-2.5 rounded-xl text-[11px] font-mono border border-white/10 text-right">
            <div className="text-emerald-400 font-bold">YOLOv8x ACTIVE</div>
            <div>INFER: {activeCamera.yoloInferenceMs}ms</div>
            <div className="text-slate-300">TARGETS: {activeCamera.detections.length}</div>
          </div>

          {/* Tripwire boundary line */}
          {showTripwires && activeCamera.id === 'CAM-03' && (
            <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-[#ef4444] shadow-[0_0_12px_#ef4444] flex items-center justify-between px-6 pointer-events-none">
              <span className="bg-[#ef4444] text-white font-mono text-[10px] font-bold px-2 py-0.5 rounded shadow-xs">
                VIRTUAL FENCE TRIPWIRE (BOUNDARY PILLAR 114)
              </span>
              <span className="bg-[#ef4444] text-white font-mono text-[10px] font-bold px-2 py-0.5 rounded shadow-xs animate-pulse">
                STATUS: BREACH OCCURRED
              </span>
            </div>
          )}

          {showTripwires && activeCamera.id !== 'CAM-03' && (
            <div className="absolute bottom-1/3 left-0 right-0 border-b-2 border-dashed border-[#10b981] flex items-center justify-between px-6 pointer-events-none opacity-90">
              <span className="bg-emerald-800/90 text-white font-mono text-[9px] font-bold px-2 py-0.5 rounded shadow-xs">
                VIRTUAL TRIPWIRE CALIBRATED (NORMAL)
              </span>
            </div>
          )}

          {/* Dynamic YOLO Bounding Boxes */}
          {showBoxes &&
            activeCamera.detections.map((det) => (
              <div
                key={det.id}
                className="absolute border-2 pointer-events-none transition-all rounded-xs"
                style={{
                  top: det.bbox?.top,
                  left: det.bbox?.left,
                  width: det.bbox?.width,
                  height: det.bbox?.height,
                  borderColor: det.isAlert ? '#ef4444' : det.className.toLowerCase().includes('person') ? '#10b981' : '#0052ff',
                  backgroundColor: det.isAlert ? 'rgba(239, 68, 68, 0.16)' : 'rgba(0, 82, 255, 0.08)'
                }}
              >
                {/* Header Tag */}
                <div
                  className={`text-[9px] font-mono font-bold px-1.5 py-0.5 text-white inline-flex items-center gap-1 rounded-xs ${
                    det.isAlert ? 'bg-[#ef4444]' : det.className.toLowerCase().includes('person') ? 'bg-[#10b981]' : 'bg-[#0052ff]'
                  }`}
                >
                  <span>{det.className.toUpperCase()}</span>
                  {showTrackIds && det.trackId && <span>ID:{det.trackId}</span>}
                  {showConfidence && <span>{Math.round(det.confidence * 100)}%</span>}
                </div>

                {/* Sub-label info */}
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
        <div className="p-4 bg-slate-50/80 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          {/* Overlay Switches */}
          <div className="flex items-center gap-4 sm:gap-6 flex-wrap text-[13px] text-slate-800 font-medium">
            <span className="text-slate-500 text-[11px] font-bold uppercase tracking-wider">HUD Overlays:</span>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showBoxes}
                onChange={(e) => setShowBoxes(e.target.checked)}
                className="w-4 h-4 rounded text-[#0052ff] border-slate-300 focus:ring-0"
              />
              <span>Bounding Boxes</span>
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
              <span>Tripwires / Zones</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showConfidence}
                onChange={(e) => setShowConfidence(e.target.checked)}
                className="w-4 h-4 rounded text-[#0052ff] border-slate-300 focus:ring-0"
              />
              <span>Confidence</span>
            </label>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenDetail(activeCamera.id)}
              className="px-3.5 py-1.5 bg-white border border-slate-200/80 hover:bg-slate-50 text-slate-800 rounded-xl text-[12px] font-semibold flex items-center gap-1 shadow-xs transition-colors"
            >
              <span className="material-symbols-outlined text-[16px] text-[#0052ff]">visibility</span>
              <span>Open Dedicated Detail View</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Diagnostics and Directory Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left 1-col: CCTV Ingest & Model Pipeline Diagnostics */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-[15px] text-[#0f172a] flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px] text-[#0052ff]">tune</span>
              <span>Inference &amp; Stream Specs</span>
            </h3>
            <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60">
              HEALTHY
            </span>
          </div>

          <div className="space-y-3 text-[12px]">
            <div className="flex justify-between items-center py-0.5">
              <span className="text-[#64748b]">Backend Ingestion:</span>
              <span className="font-mono font-semibold text-slate-900">FastAPI / OpenCV RTSP</span>
            </div>
            <div className="flex justify-between items-center py-0.5">
              <span className="text-[#64748b]">Inference Route:</span>
              <span className="font-mono font-semibold text-[#0052ff] truncate max-w-[170px]">
                {activeCamera.inferenceEndpoint}
              </span>
            </div>
            <div className="flex justify-between items-center py-0.5">
              <span className="text-[#64748b]">Video Codec:</span>
              <span className="font-mono text-slate-900">H.264 / Baseline Main</span>
            </div>
            <div className="flex justify-between items-center py-0.5">
              <span className="text-[#64748b]">Ingest Framerate:</span>
              <span className="font-mono text-slate-900">{activeCamera.fps} fps (Real-Time)</span>
            </div>
            <div className="flex justify-between items-center py-0.5">
              <span className="text-[#64748b]">Dropped Frames:</span>
              <span className="font-mono text-emerald-600 font-semibold">0 (0.00%)</span>
            </div>
            <div className="flex justify-between items-center py-0.5">
              <span className="text-[#64748b]">Hardware Model:</span>
              <span className="font-semibold text-slate-900">{activeCamera.sensorType}</span>
            </div>
            <div className="flex justify-between items-center py-0.5">
              <span className="text-[#64748b]">IR Sensor Mode:</span>
              <span className="text-slate-900 font-medium">{activeCamera.irAssist}</span>
            </div>
            <div className="flex justify-between items-center py-0.5">
              <span className="text-[#64748b]">Tripwire State:</span>
              <span
                className={`font-semibold ${
                  activeCamera.virtualFenceStatus === 'breached'
                    ? 'text-[#ef4444]'
                    : 'text-emerald-600'
                }`}
              >
                {activeCamera.virtualFenceStatus.toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        {/* Right 2-col: Border CCTV Node Directory & Switcher */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-[15px] text-[#0f172a] flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-[#0052ff]">list</span>
                <span>Border CCTV Node Directory</span>
              </h3>
              <p className="text-[12px] text-[#64748b] mt-0.5">
                Switch active stream or jump directly to its complete telemetry page
              </p>
            </div>
            <span className="text-[12px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
              Total: {cameras.length} Nodes
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {cameras.map((cam) => {
              const isSelected = cam.id === activeCamera.id;
              const isAlert = cam.status === 'alert';
              return (
                <div
                  key={cam.id}
                  className={`p-3.5 rounded-xl border flex flex-col justify-between gap-3 transition-all ${
                    isSelected
                      ? 'bg-blue-50/40 border-[#0052ff]'
                      : 'bg-white border-slate-200/80 hover:border-slate-300 hover:bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={cam.imageUrl}
                      alt={cam.name}
                      className="w-16 h-12 object-cover rounded-lg border border-slate-200 shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded text-white ${
                            isAlert ? 'bg-[#ef4444]' : 'bg-[#0052ff]'
                          }`}
                        >
                          {cam.id}
                        </span>
                        <span className="font-bold text-[13px] text-slate-900 truncate">
                          {cam.name}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 truncate mt-0.5">
                        {cam.location}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <span className="flex items-center gap-1 text-[11px] font-mono text-slate-500">
                      <span className={`w-1.5 h-1.5 rounded-full ${isAlert ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`}></span>
                      <span>{cam.fps} FPS</span>
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => onSelectCamera(cam.id)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                          isSelected
                            ? 'bg-[#0052ff] text-white'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                      >
                        {isSelected ? 'Viewing' : 'Select'}
                      </button>
                      <button
                        onClick={() => onOpenDetail(cam.id)}
                        className="p-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-[#0052ff] transition-colors"
                        title="View Full Detail Page"
                      >
                        <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
