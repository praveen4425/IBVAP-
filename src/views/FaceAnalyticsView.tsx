import React, { useState } from 'react';
import { FaceScreeningSubject, CameraData } from '../types';

interface FaceAnalyticsViewProps {
  subjects: FaceScreeningSubject[];
  camera: CameraData;
  onOpenDetail: (cameraId: string) => void;
}

export const FaceAnalyticsView: React.FC<FaceAnalyticsViewProps> = ({
  subjects,
  camera,
  onOpenDetail
}) => {
  const [activeSubject, setActiveSubject] = useState<FaceScreeningSubject>(subjects[0]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleAction = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <div className="space-y-5 pb-10">
      {/* Toast message */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-[#0f172a] text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-[13px] font-semibold border border-slate-700 animate-in fade-in slide-in-from-top-2">
          <span className="material-symbols-outlined text-[18px] text-emerald-400">verified_user</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-[#0f172a] tracking-tight">
              Face Analytics &amp; Pedestrian Screening
            </h1>
            <span className="px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200/60 text-[#0052ff] text-[11px] font-bold">
              RetinaFace + 5-Point
            </span>
          </div>
          <p className="text-sm text-[#64748b] mt-0.5">
            Real-Time 5-Point Landmark Extraction, Alignment &amp; Watchlist Comparison
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onOpenDetail(camera.id)}
            className="px-3.5 py-1.5 bg-[#0052ff] hover:bg-blue-600 text-white rounded-xl text-[12px] font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">open_in_full</span>
            <span>Inspect {camera.id} Feed</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Live Pedestrian Feed + Subject Biometric Profile */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left 2-cols: Walkthrough Lane Video Stream */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden space-y-4">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex justify-between items-center">
            <div className="flex items-center gap-2.5">
              <span className="font-mono text-[11px] font-bold bg-[#0052ff] text-white px-2.5 py-1 rounded-lg">
                CAM-01
              </span>
              <span className="font-bold text-[15px] text-[#0f172a]">
                BOP Alpha — Pedestrian Walkthrough Lane
              </span>
            </div>
            <div className="font-mono text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse"></span>
              BIOMETRIC INGEST ACTIVE
            </div>
          </div>

          <div className="px-4 pb-4 sm:px-5 sm:pb-5 space-y-3">
            <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-950 border border-slate-200">
              <img
                src={camera.imageUrl}
                alt="Pedestrian Stream"
                className="w-full h-full object-cover"
              />

              {/* Facial Mesh Landmark Overlay Simulation */}
              <div
                className="absolute border-2 border-emerald-400 rounded-xs"
                style={{
                  top: '38%',
                  left: '30%',
                  width: '14%',
                  height: '18%'
                }}
              >
                {/* 5-point landmark dots */}
                <div className="absolute top-[28%] left-[28%] w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_4px_#34d399]"></div>
                <div className="absolute top-[28%] right-[28%] w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_4px_#34d399]"></div>
                <div className="absolute top-[52%] left-[46%] w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_4px_#34d399]"></div>
                <div className="absolute bottom-[22%] left-[34%] w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_4px_#34d399]"></div>
                <div className="absolute bottom-[22%] right-[34%] w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_4px_#34d399]"></div>

                <div className="absolute -top-5 left-0 bg-emerald-600 text-white font-mono text-[8px] font-bold px-1.5 py-0.5 whitespace-nowrap rounded-xs">
                  FACE 5-PT [QUALITY: {activeSubject.quality}%]
                </div>
              </div>

              {/* OSD */}
              <div className="absolute top-3 left-3 bg-black/75 backdrop-blur-xs text-white font-mono text-[11px] px-2.5 py-1 rounded-lg border border-white/10">
                YOLOv8-Face • RETINAFACE ALIGN • INFER: 22ms
              </div>
            </div>

            <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/80 flex flex-wrap items-center justify-between gap-2 text-[12px]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-[#0052ff]">memory</span>
                <span className="font-mono text-slate-800">
                  Pipeline: FastAPI /api/v2/face/detect_and_verify
                </span>
              </div>
              <span className="font-mono text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded font-semibold">
                DATABASE: Regional Watchlist v4
              </span>
            </div>
          </div>
        </div>

        {/* Right 1-col: Active Subject Biometric Profile */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <span className="text-[11px] font-mono font-bold text-[#0052ff] uppercase tracking-wider">
              Biometric Profile Inspection
            </span>
            <h2 className="text-[16px] font-bold text-[#0f172a] mt-0.5">{activeSubject.id}</h2>
          </div>

          {/* Subject Crop & Score */}
          <div className="flex items-center gap-3.5 bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/80">
            <img
              src={activeSubject.cropUrl}
              alt={activeSubject.id}
              className="w-18 h-18 rounded-xl object-cover border-2 border-[#0052ff] shadow-xs shrink-0"
            />
            <div className="space-y-1 min-w-0">
              <div className="font-mono text-[11px] font-semibold text-slate-400">
                TIME: {activeSubject.captureTime} IST
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[12px] font-medium text-slate-600">Quality:</span>
                <span className="font-mono text-[13px] font-bold text-emerald-600">
                  {activeSubject.quality} / 100
                </span>
              </div>
              <div
                className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded-md inline-block uppercase ${
                  activeSubject.status === 'manual_inspection'
                    ? 'bg-red-50 text-[#ef4444] border border-red-200/60'
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                }`}
              >
                {activeSubject.watchlistMatch}
              </div>
            </div>
          </div>

          {/* Facial Landmark Metrics */}
          <div className="space-y-2 text-[12px] bg-slate-50/60 p-3.5 rounded-xl border border-slate-200/80">
            <div className="flex justify-between items-center py-1 border-b border-slate-100">
              <span className="text-[#64748b]">Alignment Pose:</span>
              <span className="font-semibold text-[#0f172a]">{activeSubject.pose}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-100">
              <span className="text-[#64748b]">Lighting Lux:</span>
              <span className="text-slate-800">{activeSubject.lighting}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-100">
              <span className="text-[#64748b]">Occlusion / Mask:</span>
              <span className="text-slate-800">{activeSubject.occlusion}</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-[#64748b]">Classification:</span>
              <span className="font-semibold text-[#0f172a]">{activeSubject.classification}</span>
            </div>
          </div>

          {/* Verification Actions */}
          <div className="space-y-2.5 pt-1">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Verification Action
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => handleAction(`Transit Logged & Verified: ${activeSubject.id}`)}
                className="py-2.5 px-3 bg-[#0052ff] hover:bg-blue-600 text-white rounded-xl text-[12px] font-semibold flex items-center justify-center gap-1.5 shadow-xs transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">verified</span>
                <span>Log Verified</span>
              </button>
              <button
                onClick={() => handleAction(`Manual ID Check Requested: ${activeSubject.id}`)}
                className="py-2.5 px-3 bg-red-50 hover:bg-red-100 text-[#ef4444] border border-red-200/80 rounded-xl text-[12px] font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">badge</span>
                <span>Manual Check</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Screening Queue Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex justify-between items-center flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <h2 className="text-[15px] font-bold text-[#0f172a]">
              Recent Pedestrian Screening Queue
            </h2>
            <span className="font-mono text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-lg font-bold">
              {subjects.length}
            </span>
          </div>
          <span className="text-[12px] text-[#64748b]">
            Walkthrough lane automated biometric log
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 text-slate-500 text-[11px] uppercase tracking-wider font-bold border-b border-slate-100">
                <th className="py-3 px-4">Subject ID</th>
                <th className="py-3 px-4">Time</th>
                <th className="py-3 px-4">Quality</th>
                <th className="py-3 px-4">Pose</th>
                <th className="py-3 px-4">Occlusion</th>
                <th className="py-3 px-4">Watchlist Match</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[13px]">
              {subjects.map((item) => (
                <tr
                  key={item.id}
                  onClick={() => setActiveSubject(item)}
                  className={`cursor-pointer transition-colors ${
                    activeSubject.id === item.id ? 'bg-blue-50/60 font-medium' : 'hover:bg-slate-50/80'
                  }`}
                >
                  <td className="py-3.5 px-4 font-mono font-bold text-[#0f172a]">{item.id}</td>
                  <td className="py-3.5 px-4 font-mono text-[12px] text-slate-500">
                    {item.captureTime}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-[12px] text-emerald-600 font-semibold">
                    {item.quality}%
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 text-[12px]">{item.pose}</td>
                  <td className="py-3.5 px-4 text-slate-600 text-[12px]">{item.occlusion}</td>
                  <td className="py-3.5 px-4 text-[#0f172a] font-semibold">{item.watchlistMatch}</td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded-md uppercase ${
                        item.status === 'manual_inspection'
                          ? 'bg-red-50 text-[#ef4444] border border-red-200/60'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                      }`}
                    >
                      {item.statusLabel}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveSubject(item);
                      }}
                      className="px-3 py-1 bg-white border border-slate-200 hover:bg-slate-50 text-[#0052ff] rounded-xl text-[12px] font-semibold shadow-xs"
                    >
                      Inspect
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
