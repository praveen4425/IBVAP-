import React, { useState } from 'react';
import { AnprScan, CameraData } from '../types';

interface AnprViewProps {
  scans: AnprScan[];
  cameras: CameraData[];
  onSelectCamera: (cameraId: string) => void;
  onOpenDetail: (cameraId: string) => void;
}

export const AnprView: React.FC<AnprViewProps> = ({
  scans,
  cameras,
  onSelectCamera,
  onOpenDetail
}) => {
  const [selectedCamId, setSelectedCamId] = useState<'CAM-01' | 'CAM-02'>('CAM-01');
  const [activeScan, setActiveScan] = useState<AnprScan>(scans[0]);
  const [operatorActionToast, setOperatorActionToast] = useState<string | null>(null);

  const activeCam = cameras.find((c) => c.id === selectedCamId) || cameras[0];

  const handleAction = (msg: string) => {
    setOperatorActionToast(msg);
    setTimeout(() => setOperatorActionToast(null), 3000);
  };

  return (
    <div className="space-y-5 pb-10">
      {/* Toast notification */}
      {operatorActionToast && (
        <div className="fixed top-20 right-6 z-50 bg-[#0f172a] text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-[13px] font-semibold border border-slate-700 animate-in fade-in slide-in-from-top-2">
          <span className="material-symbols-outlined text-[18px] text-emerald-400">check_circle</span>
          <span>{operatorActionToast}</span>
        </div>
      )}

      {/* Title & Stream Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-[#0f172a] tracking-tight">
              ANPR &amp; Vehicle License Recognition
            </h1>
            <span className="px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200/60 text-[#0052ff] text-[11px] font-bold">
              CRNN Deep OCR
            </span>
          </div>
          <p className="text-sm text-[#64748b] mt-0.5">
            Automated Plate Localization &amp; Border Checkpost Permit Verification
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setSelectedCamId('CAM-01')}
            className={`px-3.5 py-1.5 rounded-xl text-[12px] font-semibold transition-all ${
              selectedCamId === 'CAM-01'
                ? 'bg-[#0052ff] text-white shadow-xs'
                : 'bg-white border border-slate-200/80 text-slate-700 hover:bg-slate-50'
            }`}
          >
            CAM-01: Main Gate Lane
          </button>
          <button
            onClick={() => setSelectedCamId('CAM-02')}
            className={`px-3.5 py-1.5 rounded-xl text-[12px] font-semibold transition-all ${
              selectedCamId === 'CAM-02'
                ? 'bg-[#0052ff] text-white shadow-xs'
                : 'bg-white border border-slate-200/80 text-slate-700 hover:bg-slate-50'
            }`}
          >
            CAM-02: Road North
          </button>
        </div>
      </div>

      {/* Main Grid: Feed + Plate Extraction & Permit Verification */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left 2-cols: Live ANPR Video Feed */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden space-y-4">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex justify-between items-center">
            <div className="flex items-center gap-2.5">
              <span className="font-mono text-[11px] font-bold bg-[#0052ff] text-white px-2.5 py-1 rounded-lg">
                {activeCam.id}
              </span>
              <span className="font-bold text-[15px] text-[#0f172a]">{activeCam.name}</span>
            </div>
            <button
              onClick={() => onOpenDetail(activeCam.id)}
              className="text-[12px] font-semibold text-[#0052ff] hover:underline flex items-center gap-1"
            >
              <span>Full Camera Detail</span>
              <span className="material-symbols-outlined text-[15px]">open_in_full</span>
            </button>
          </div>

          <div className="px-4 pb-4 sm:px-5 sm:pb-5 space-y-3">
            <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-950 border border-slate-200">
              <img
                src={activeCam.imageUrl}
                alt={activeCam.name}
                className="w-full h-full object-cover"
              />

              {/* Plate Bounding Box simulation */}
              <div
                className="absolute border-2 border-emerald-400 bg-emerald-500/20 rounded-xs"
                style={{
                  top: '54%',
                  left: '48%',
                  width: '18%',
                  height: '10%'
                }}
              >
                <div className="bg-emerald-600 text-white font-mono text-[9px] font-bold px-1.5 py-0.5 inline-block rounded-xs">
                  PLATE: {activeScan.plate} [92%]
                </div>
              </div>

              {/* OSD Bar */}
              <div className="absolute top-3 left-3 bg-black/75 backdrop-blur-xs text-white font-mono text-[11px] px-2.5 py-1 rounded-lg border border-white/10">
                RADAR SPEED: {activeScan.radarSpeed} | LAT: {activeCam.latencyMs}ms
              </div>
            </div>

            {/* Ingest Spec Bar */}
            <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/80 flex flex-wrap items-center justify-between gap-2 text-[12px]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-[#0052ff]">api</span>
                <span className="font-mono text-slate-800">
                  Endpoint: FastAPI /api/v2/anpr/detect
                </span>
              </div>
              <span className="font-mono text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded font-semibold">
                MODEL: CRNN-Plate-v3
              </span>
            </div>
          </div>
        </div>

        {/* Right 1-col: Target Extraction & Vahan / Permit Verification */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <span className="text-[11px] font-mono font-bold text-[#0052ff] uppercase tracking-wider">
              Target Extraction HUD
            </span>
            <h2 className="text-[16px] font-bold text-[#0f172a] mt-0.5">
              Localized License Plate
            </h2>
          </div>

          {/* Authentic Indian High Security Registration Plate (HSRP) style badge */}
          <div className="p-4 bg-slate-900 rounded-xl flex flex-col items-center justify-center space-y-2.5">
            <div className="bg-[#facc15] border-[3px] border-black rounded-lg px-4 py-2 text-black font-mono font-black text-[20px] tracking-widest flex items-center gap-3 shadow-md">
              <div className="flex flex-col items-center border-r-2 border-black pr-2 leading-none">
                <span className="text-[10px] text-blue-900 font-extrabold">IND</span>
                <span className="material-symbols-outlined text-[12px] text-blue-900">verified</span>
              </div>
              <span>{activeScan.plate}</span>
            </div>
            <div className="text-[11px] font-mono text-slate-300 text-center">
              CRNN OCR: {activeScan.ocrConf}% | YOLO Box: {activeScan.plateConf}%
            </div>
          </div>

          {/* Permit & Vahan Database Details */}
          <div className="space-y-2.5 text-[12px] bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/80">
            <div className="flex justify-between items-center py-0.5">
              <span className="text-[#64748b]">Vehicle Classification:</span>
              <span className="font-bold text-[#0f172a]">{activeScan.vehicleClass}</span>
            </div>
            <div className="flex justify-between items-center py-0.5">
              <span className="text-[#64748b]">Permit Status:</span>
              <span
                className={`font-bold font-mono text-[10px] px-2 py-0.5 rounded-md ${
                  activeScan.status === 'expired'
                    ? 'bg-red-50 text-[#ef4444] border border-red-200/60'
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                }`}
              >
                {activeScan.statusLabel.toUpperCase()}
              </span>
            </div>
            <div className="flex justify-between items-center py-0.5">
              <span className="text-[#64748b]">Permit Reference:</span>
              <span className="font-mono text-slate-900 font-semibold">{activeScan.permitId}</span>
            </div>
            <div className="flex justify-between items-center py-0.5">
              <span className="text-[#64748b]">Valid Until:</span>
              <span className="font-mono text-slate-900">{activeScan.validTill}</span>
            </div>
            <div className="pt-2 text-[11px] text-[#64748b] border-t border-slate-200">
              {activeScan.permitDetails}
            </div>
          </div>

          {/* Operator Checkpost Actions */}
          <div className="space-y-2.5 pt-1">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Sentry Checkpost Action
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => handleAction(`Cleared & Logged: ${activeScan.plate}`)}
                className="py-2.5 px-3 bg-[#0052ff] hover:bg-blue-600 text-white rounded-xl text-[12px] font-semibold flex items-center justify-center gap-1.5 shadow-xs transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">check_circle</span>
                <span>Clear Vehicle</span>
              </button>
              <button
                onClick={() => handleAction(`Secondary Inspection Flagged: ${activeScan.plate}`)}
                className="py-2.5 px-3 bg-red-50 hover:bg-red-100 text-[#ef4444] border border-red-200/80 rounded-xl text-[12px] font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">search_check</span>
                <span>Flag for Search</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Checkpoint Scans Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex justify-between items-center flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <h2 className="text-[15px] font-bold text-[#0f172a]">
              Recent Border Checkpoint Scans
            </h2>
            <span className="font-mono text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-lg font-bold">
              {scans.length}
            </span>
          </div>
          <span className="text-[12px] text-[#64748b]">
            Synchronized with Regional Transport Registry
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 text-slate-500 text-[11px] uppercase tracking-wider font-bold border-b border-slate-100">
                <th className="py-3 px-4">Time</th>
                <th className="py-3 px-4">Plate Number</th>
                <th className="py-3 px-4">Vehicle Class</th>
                <th className="py-3 px-4">Camera Node</th>
                <th className="py-3 px-4">Radar Speed</th>
                <th className="py-3 px-4">OCR Conf</th>
                <th className="py-3 px-4">Permit Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[13px]">
              {scans.map((item) => (
                <tr
                  key={item.id}
                  onClick={() => setActiveScan(item)}
                  className={`cursor-pointer transition-colors ${
                    activeScan.id === item.id ? 'bg-blue-50/60 font-medium' : 'hover:bg-slate-50/80'
                  }`}
                >
                  <td className="py-3.5 px-4 font-mono text-[12px] text-slate-500">{item.time}</td>
                  <td className="py-3.5 px-4 font-mono font-extrabold text-[#0f172a]">
                    {item.plate}
                  </td>
                  <td className="py-3.5 px-4 text-slate-700">{item.vehicleClass}</td>
                  <td className="py-3.5 px-4 font-mono text-[12px] text-[#0052ff]">
                    {item.cameraId}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-[12px] text-slate-700">{item.radarSpeed}</td>
                  <td className="py-3.5 px-4 font-mono text-[12px] text-emerald-600 font-semibold">
                    {item.ocrConf}%
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded-md uppercase ${
                        item.status === 'expired'
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
                        setActiveScan(item);
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
