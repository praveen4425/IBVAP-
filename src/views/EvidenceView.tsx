import React, { useState } from 'react';
import { EvidenceRecord } from '../types';

interface EvidenceViewProps {
  evidence: EvidenceRecord[];
  selectedEvidenceId?: string;
  onSelectCamera: (cameraId: string) => void;
  onNavigateIncident: (incidentId: string) => void;
}

export const EvidenceView: React.FC<EvidenceViewProps> = ({
  evidence,
  selectedEvidenceId,
  onSelectCamera,
  onNavigateIncident
}) => {
  const [activeEvidenceId, setActiveEvidenceId] = useState<string>(
    selectedEvidenceId || evidence[0]?.id || ''
  );
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isPlaying, setIsPlaying] = useState(false);
  const [scrubPosition, setScrubPosition] = useState(45);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const activeRecord = evidence.find((e) => e.id === activeEvidenceId) || evidence[0];

  const filteredEvidence = evidence.filter((e) => {
    if (categoryFilter === 'all') return true;
    return e.category.toLowerCase().includes(categoryFilter.toLowerCase());
  });

  const handleExport = () => {
    setExportModalOpen(false);
    setToastMessage(`Export Package for ${activeRecord.id} generated with SHA-256 certificate.`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  return (
    <div className="space-y-5 pb-10">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-[#0f172a] text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-[13px] font-semibold border border-slate-700 animate-in fade-in slide-in-from-top-2">
          <span className="material-symbols-outlined text-[18px] text-emerald-400">verified</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-[#0f172a] tracking-tight">
              Forensic Evidence Repository
            </h1>
            <span className="px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200/60 text-[#0052ff] text-[11px] font-bold">
              Sec 65B Compliant
            </span>
          </div>
          <p className="text-sm text-[#64748b] mt-0.5">
            Cryptographically Signed CCTV Clips, Tamper-Evident Dossiers &amp; Chain of Custody
          </p>
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {['all', 'Intrusion', 'Vehicular', 'ANPR', 'Thermal'].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-[12px] font-semibold transition-all ${
                categoryFilter === cat
                  ? 'bg-[#0052ff] text-white shadow-xs'
                  : 'bg-white border border-slate-200/80 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {cat === 'all' ? 'All Records' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Active Evidence Inspection Screen */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left 2-cols: Forensic Player HUD */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden space-y-4">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex justify-between items-center">
            <div>
              <span className="font-mono text-[11px] font-bold text-[#0052ff]">
                {activeRecord.id}
              </span>
              <h2 className="text-[16px] font-bold text-[#0f172a]">{activeRecord.title}</h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onSelectCamera(activeRecord.cameraId)}
                className="text-[12px] font-semibold text-[#0052ff] hover:underline flex items-center gap-1"
              >
                <span>View {activeRecord.cameraId}</span>
                <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
              </button>
            </div>
          </div>

          <div className="px-4 pb-4 sm:px-5 sm:pb-5 space-y-3">
            <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-950 border border-slate-200">
              <img
                src={activeRecord.previewImageUrl}
                alt={activeRecord.title}
                className="w-full h-full object-cover"
              />

              {/* Video Player OSD Top */}
              <div className="absolute top-3 left-3 bg-black/75 backdrop-blur-xs text-white font-mono text-[10px] p-2 rounded-lg border border-white/10 space-y-0.5">
                <div className="font-bold text-[#ef4444]">SEC-65B FORENSIC ARCHIVE</div>
                <div className="text-slate-300">SRC: {activeRecord.cameraName}</div>
                <div className="text-slate-400">GEO: {activeRecord.gpsAnchor}</div>
              </div>

              {/* Center Play Button Overlay */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-14 h-14 rounded-full bg-black/60 text-white flex items-center justify-center border-2 border-white/40 shadow-lg">
                  <span className="material-symbols-outlined text-[32px]">
                    {isPlaying ? 'pause' : 'play_arrow'}
                  </span>
                </div>
              </div>

              {/* Player Scrub Bar & Control HUD */}
              <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/90 via-black/60 to-transparent text-white space-y-2">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="w-8 h-8 rounded-lg hover:bg-white/20 flex items-center justify-center transition-colors"
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {isPlaying ? 'pause' : 'play_arrow'}
                    </span>
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={scrubPosition}
                    onChange={(e) => setScrubPosition(Number(e.target.value))}
                    className="flex-1 h-1.5 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-[#0052ff]"
                  />
                  <span className="font-mono text-[11px] font-bold">
                    00:{scrubPosition < 10 ? `0${scrubPosition}` : scrubPosition} / {activeRecord.clipDuration}
                  </span>
                </div>
              </div>
            </div>

            {/* Legal Chain of Custody Metadata Card */}
            <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-bold text-[#0f172a] flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[18px] text-[#0052ff]">lock</span>
                  <span>Chain of Custody &amp; Hash Authentication</span>
                </span>
                <span className="font-mono text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200/60">
                  {activeRecord.tamperStatus}
                </span>
              </div>
              <div className="font-mono text-[11px] text-slate-600 break-all bg-white p-2.5 rounded-lg border border-slate-200">
                {activeRecord.cryptoHash}
              </div>
            </div>
          </div>
        </div>

        {/* Right 1-col: Case Dossier & Export Panel */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <span className="text-[11px] font-mono font-bold text-[#0052ff] uppercase tracking-wider">
              Case Dossier Details
            </span>
            <h3 className="text-[16px] font-bold text-[#0f172a] mt-0.5">
              Ref: {activeRecord.incidentId}
            </h3>
          </div>

          <div className="space-y-2.5 text-[12px] bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/80">
            <div className="flex justify-between items-center py-0.5">
              <span className="text-[#64748b]">Classification:</span>
              <span className="font-bold text-[#0f172a]">{activeRecord.category}</span>
            </div>
            <div className="flex justify-between items-center py-0.5">
              <span className="text-[#64748b]">Originating Node:</span>
              <span className="font-mono text-[#0052ff] font-semibold">
                {activeRecord.cameraId}
              </span>
            </div>
            <div className="flex justify-between items-center py-0.5">
              <span className="text-[#64748b]">Timestamp:</span>
              <span className="font-mono text-slate-800">{activeRecord.timestamp}</span>
            </div>
            <div className="flex justify-between items-center py-0.5">
              <span className="text-[#64748b]">Storage Size:</span>
              <span className="font-mono text-slate-800">{activeRecord.storageSize}</span>
            </div>
            <div className="flex justify-between items-center py-0.5">
              <span className="text-[#64748b]">Inference Model:</span>
              <span className="font-semibold text-[#0f172a]">{activeRecord.inferenceEngine}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2.5 pt-1">
            <button
              onClick={() => setExportModalOpen(true)}
              className="w-full py-2.5 px-3.5 bg-[#0052ff] hover:bg-blue-600 text-white rounded-xl text-[13px] font-semibold flex items-center justify-center gap-1.5 shadow-xs transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">download</span>
              <span>Export Evidence Package (.ZIP)</span>
            </button>
            <button
              onClick={() => onNavigateIncident(activeRecord.incidentId)}
              className="w-full py-2.5 px-3.5 bg-white border border-slate-200/80 hover:bg-slate-50 text-slate-700 rounded-xl text-[12px] font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">visibility</span>
              <span>View Full Incident Lifecycle</span>
            </button>
          </div>
        </div>
      </div>

      {/* Captured Queued Cases Grid */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex justify-between items-center flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <h2 className="text-[15px] font-bold text-[#0f172a]">
              Archived Case Evidence Records
            </h2>
            <span className="font-mono text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-lg font-bold">
              {filteredEvidence.length}
            </span>
          </div>
          <span className="text-[12px] text-[#64748b]">
            Click any clip to load into forensic video player
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 sm:p-5">
          {filteredEvidence.map((ev) => {
            const isSelected = ev.id === activeRecord.id;
            return (
              <div
                key={ev.id}
                onClick={() => setActiveEvidenceId(ev.id)}
                className={`cursor-pointer rounded-xl border overflow-hidden transition-all ${
                  isSelected
                    ? 'border-[#0052ff] ring-2 ring-[#0052ff]/20 bg-blue-50/20'
                    : 'border-slate-200/80 hover:border-slate-300 bg-white hover:shadow-xs'
                }`}
              >
                <div className="relative aspect-video bg-slate-950">
                  <img
                    src={ev.previewImageUrl}
                    alt={ev.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 left-2 bg-black/75 text-white font-mono text-[9px] px-1.5 py-0.5 rounded">
                    {ev.cameraId}
                  </div>
                  <div className="absolute bottom-2 right-2 bg-[#0052ff] text-white font-mono text-[9px] px-1.5 py-0.5 rounded font-bold">
                    {ev.clipDuration}
                  </div>
                </div>

                <div className="p-3.5 space-y-1">
                  <div className="font-mono text-[10px] font-bold text-[#0052ff]">{ev.id}</div>
                  <div className="text-[13px] font-bold text-[#0f172a] truncate">
                    {ev.title}
                  </div>
                  <div className="text-[11px] text-slate-400 truncate">{ev.timestamp}</div>
                  <div className="pt-2 flex items-center justify-between text-[11px] border-t border-slate-100">
                    <span className="font-mono text-slate-500">{ev.storageSize}</span>
                    <span className="text-[#0052ff] font-semibold flex items-center gap-0.5">
                      <span>Examine</span>
                      <span className="material-symbols-outlined text-[13px]">arrow_forward</span>
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Export Case Modal */}
      {exportModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="px-5 py-4 bg-[#0f172c] text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#0052ff] flex items-center justify-center text-white">
                  <span className="material-symbols-outlined text-[20px]">archive</span>
                </div>
                <div>
                  <h3 className="font-bold text-[15px] leading-tight text-white">
                    Export Evidence Package (.ZIP)
                  </h3>
                  <p className="text-[11px] text-slate-400">Sec 65B Digital Certificate &amp; Video Clip</p>
                </div>
              </div>
              <button
                onClick={() => setExportModalOpen(false)}
                className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="p-5 space-y-4 text-[13px]">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                <div>
                  <span className="text-slate-500">Case Identifier: </span>
                  <span className="font-mono font-bold text-[#0f172a]">{activeRecord.id}</span>
                </div>
                <div>
                  <span className="text-slate-500">SHA-256 Digest: </span>
                  <span className="font-mono text-[10px] text-slate-700 break-all">
                    {activeRecord.cryptoHash}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5 text-slate-600">
                <p className="font-semibold text-slate-900 text-[12px]">Package Manifest includes:</p>
                <ul className="list-disc pl-5 text-[12px] space-y-1 text-slate-600">
                  <li>Original H.264 Raw CCTV Clip ({activeRecord.storageSize})</li>
                  <li>YOLOv8 Detection Telemetry Bounding Box JSON</li>
                  <li>Cryptographic Verification Manifest &amp; Digital Signature</li>
                  <li>Chain of Custody Certificate (Form SSB-65B)</li>
                </ul>
              </div>

              <div className="flex items-center gap-2.5 pt-2">
                <button
                  onClick={() => setExportModalOpen(false)}
                  className="flex-1 py-2.5 px-3 border border-slate-200 text-slate-700 rounded-xl text-[12px] font-semibold hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleExport}
                  className="flex-1 py-2.5 px-3 bg-[#0052ff] text-white rounded-xl text-[12px] font-semibold hover:bg-blue-600 flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px]">file_download</span>
                  <span>Download Package</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
