import React, { useState } from 'react';

interface DispatchModalProps {
  isOpen: boolean;
  incidentId: string;
  cameraName: string;
  defaultUnit: string;
  eta: string;
  onClose: () => void;
  onConfirmDispatch: (unit: string, remark: string) => void;
}

export const DispatchModal: React.FC<DispatchModalProps> = ({
  isOpen,
  incidentId,
  cameraName,
  defaultUnit,
  eta,
  onClose,
  onConfirmDispatch
}) => {
  const [selectedUnit, setSelectedUnit] = useState(defaultUnit);
  const [remarks, setRemarks] = useState('Intercept intruder breaching Sector IV buffer zone. Verify identity & detain if non-compliant.');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-150">
        <div className="px-5 py-4 bg-[#0f172c] text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center text-white">
              <span className="material-symbols-outlined text-[20px]">emergency</span>
            </div>
            <div>
              <h3 className="font-bold text-[15px] leading-tight text-white">
                Authorize QRT Tactical Intercept
              </h3>
              <p className="text-[11px] text-slate-400">Dispatch Quick Reaction Team to border incident</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1.5">
            <div className="flex justify-between text-[12px]">
              <span className="text-slate-500">Incident Reference:</span>
              <span className="font-mono font-bold text-[#0f172a]">{incidentId}</span>
            </div>
            <div className="flex justify-between text-[12px]">
              <span className="text-slate-500">Originating CCTV:</span>
              <span className="font-medium text-[#0f172a]">{cameraName}</span>
            </div>
            <div className="flex justify-between text-[12px]">
              <span className="text-slate-500">Est. Intercept Velocity / ETA:</span>
              <span className="font-mono font-bold text-[#ef4444]">{eta}</span>
            </div>
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">
              Select Intercept Platoon / Unit
            </label>
            <select
              value={selectedUnit}
              onChange={(e) => setSelectedUnit(e.target.value)}
              className="w-full bg-slate-50/80 border border-slate-200 rounded-xl px-3 py-2 text-[13px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0052ff]/20 focus:border-[#0052ff]"
            >
              <option value="SSB 2nd Platoon Bravo (Sub. B. S. Rawat)">
                SSB 2nd Platoon Bravo (Sub. B. S. Rawat) — Primary Sector IV
              </option>
              <option value="SSB QRT Alpha Mobile (Hawaldar Manhas)">
                SSB QRT Alpha Mobile (Hawaldar Manhas) — Patrol Strips
              </option>
              <option value="Observation Tower QRT Sentry (Naik D. Singh)">
                Observation Tower QRT Sentry (Naik D. Singh) — Observation Base
              </option>
            </select>
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">
              GD Entry / Tactical Radio Directives
            </label>
            <textarea
              rows={3}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="w-full bg-slate-50/80 border border-slate-200 rounded-xl p-3 text-[12px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0052ff]/20 focus:border-[#0052ff] resize-none"
            />
          </div>

          <div className="flex items-center gap-2.5 pt-2">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 px-3 border border-slate-200 text-slate-700 rounded-xl text-[12px] font-semibold hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onConfirmDispatch(selectedUnit, remarks);
                onClose();
              }}
              className="flex-1 py-2.5 px-3 bg-[#ef4444] text-white rounded-xl text-[12px] font-semibold hover:bg-red-600 flex items-center justify-center gap-1.5 shadow-xs transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">near_me</span>
              <span>Transmit Dispatch</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
