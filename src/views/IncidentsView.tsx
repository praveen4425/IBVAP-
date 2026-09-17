import React, { useState } from 'react';
import { IncidentRecord } from '../types';

interface IncidentsViewProps {
  incidents: IncidentRecord[];
  selectedIncidentId?: string;
  onSelectCamera: (cameraId: string) => void;
  onOpenDispatch: (incident: IncidentRecord) => void;
  onUpdateStatus: (incidentId: string, newStatus: IncidentRecord['status']) => void;
}

export const IncidentsView: React.FC<IncidentsViewProps> = ({
  incidents,
  selectedIncidentId,
  onSelectCamera,
  onOpenDispatch,
  onUpdateStatus
}) => {
  const [activeId, setActiveId] = useState<string>(selectedIncidentId || incidents[0]?.id || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState<'all' | 'critical' | 'high' | 'medium' | 'low'>('all');
  const [cameraFilter, setCameraFilter] = useState<string>('all');

  const selectedIncident = incidents.find((inc) => inc.id === activeId) || incidents[0];

  const filteredIncidents = incidents.filter((inc) => {
    if (severityFilter !== 'all' && inc.severity !== severityFilter) return false;
    if (cameraFilter !== 'all' && inc.cameraId !== cameraFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        inc.id.toLowerCase().includes(q) ||
        inc.classification.toLowerCase().includes(q) ||
        inc.description.toLowerCase().includes(q) ||
        inc.zone.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-5 pb-10">
      {/* Top Title & Quick Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-[#0f172a] tracking-tight">
              Border Security Incidents &amp; Alerts
            </h1>
            <span className="px-2 py-0.5 rounded-full bg-red-50 border border-red-200/60 text-red-600 text-[11px] font-bold">
              Active Monitoring
            </span>
          </div>
          <p className="text-sm text-[#64748b] mt-0.5">
            Tripwire Violations, Zero-Line Breaches &amp; Computer Vision Event Timeline
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-mono text-[12px] font-bold bg-red-50 text-[#ef4444] border border-red-200/60 px-3 py-1 rounded-xl">
            1 CRITICAL OPEN
          </span>
          <span className="font-mono text-[12px] font-semibold bg-white border border-slate-200/80 text-slate-700 px-3 py-1 rounded-xl shadow-xs">
            {incidents.length} TOTAL LOGGED
          </span>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[240px] bg-slate-50/80 px-3 py-2 rounded-xl border border-slate-200">
          <span className="material-symbols-outlined text-slate-400 text-[20px]">search</span>
          <input
            type="text"
            placeholder="Search incident ID, classification, or sector..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-[13px] bg-transparent focus:outline-none text-slate-900 placeholder:text-slate-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-slate-400 hover:text-slate-700"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Camera Filter */}
          <select
            value={cameraFilter}
            onChange={(e) => setCameraFilter(e.target.value)}
            className="bg-slate-50/80 border border-slate-200 text-[12px] font-medium text-slate-700 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0052ff]/20"
          >
            <option value="all">All Cameras</option>
            <option value="CAM-01">CAM-01 (Gate)</option>
            <option value="CAM-02">CAM-02 (Road N)</option>
            <option value="CAM-03">CAM-03 (Perimeter E)</option>
            <option value="CAM-04">CAM-04 (Tower C)</option>
          </select>

          {/* Severity Filter Pills */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            {(['all', 'critical', 'high', 'medium', 'low'] as const).map((sev) => (
              <button
                key={sev}
                onClick={() => setSeverityFilter(sev)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold uppercase transition-all ${
                  severityFilter === sev
                    ? 'bg-[#0052ff] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {sev}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Incidents Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex justify-between items-center flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <h2 className="text-[15px] font-bold text-[#0f172a]">
              Telemetry Alert Stream
            </h2>
            <span className="font-mono text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-lg font-bold">
              {filteredIncidents.length}
            </span>
          </div>
          <span className="text-[12px] text-[#64748b]">
            Click any row to inspect captured frame &amp; detection lifecycle
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 text-slate-500 text-[11px] uppercase tracking-wider font-bold border-b border-slate-100">
                <th className="py-3 px-4">Case ID</th>
                <th className="py-3 px-4">Time</th>
                <th className="py-3 px-4">Camera Node</th>
                <th className="py-3 px-4">Zone / Sector</th>
                <th className="py-3 px-4">Classification</th>
                <th className="py-3 px-4">Target &amp; Conf</th>
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[13px]">
              {filteredIncidents.map((inc) => {
                const isSelected = inc.id === selectedIncident?.id;
                return (
                  <tr
                    key={inc.id}
                    onClick={() => setActiveId(inc.id)}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-blue-50/60 font-medium'
                        : inc.severity === 'critical'
                        ? 'bg-red-50/20 hover:bg-red-50/40'
                        : 'hover:bg-slate-50/80'
                    }`}
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-[#0f172a]">
                      {inc.id}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[12px] text-slate-500">
                      {inc.timestamp}
                    </td>
                    <td className="py-3.5 px-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectCamera(inc.cameraId);
                        }}
                        className="font-mono text-[#0052ff] hover:underline flex items-center gap-1 font-semibold text-[12px]"
                        title="Jump to camera"
                      >
                        <span className="material-symbols-outlined text-[16px]">videocam</span>
                        <span>{inc.cameraId}</span>
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 text-[12px] truncate max-w-[150px]">
                      {inc.zone}
                    </td>
                    <td className="py-3.5 px-4 text-[#0f172a] font-semibold">
                      {inc.classification}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[12px] text-slate-700">
                      {inc.targetClass} ({Math.round(inc.confidence * 100)}%)
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded-md uppercase ${
                          inc.severity === 'critical'
                            ? 'bg-red-50 text-[#ef4444] border border-red-200/60'
                            : inc.severity === 'high'
                            ? 'bg-amber-50 text-[#f59e0b] border border-amber-200/60'
                            : inc.severity === 'medium'
                            ? 'bg-blue-50 text-[#0052ff] border border-blue-200/60'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {inc.severity}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-[12px]">
                      <span className="font-semibold text-slate-800">{inc.status}</span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveId(inc.id);
                        }}
                        className="px-3 py-1 bg-white border border-slate-200 hover:bg-slate-50 text-[#0052ff] rounded-xl text-[12px] font-semibold shadow-xs"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Active Incident Inspection Panel */}
      {selectedIncident && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Left Column: Captured Trigger Frame & Video Metadata */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden space-y-4">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex justify-between items-center">
              <div>
                <span className="font-mono text-[11px] font-bold text-[#0052ff]">
                  {selectedIncident.id}
                </span>
                <h3 className="font-bold text-[15px] text-[#0f172a]">
                  Captured Trigger Frame &amp; OSD
                </h3>
              </div>
              <button
                onClick={() => onSelectCamera(selectedIncident.cameraId)}
                className="text-[12px] font-semibold text-[#0052ff] hover:underline flex items-center gap-1"
              >
                <span>View {selectedIncident.cameraId}</span>
                <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
              </button>
            </div>

            <div className="px-4 pb-4 sm:px-5 sm:pb-5 space-y-3">
              <div className="relative aspect-video rounded-xl overflow-hidden bg-black border border-slate-200">
                <img
                  src={selectedIncident.triggerFrameUrl}
                  alt={selectedIncident.classification}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 left-2 bg-black/75 backdrop-blur-xs text-white font-mono text-[10px] px-2 py-0.5 rounded-md border border-white/10">
                  OSD: {selectedIncident.timestamp} | {selectedIncident.cameraId}
                </div>
                <div className="absolute bottom-2 right-2 bg-[#ef4444] text-white font-mono text-[10px] font-bold px-2 py-0.5 rounded-md shadow-xs">
                  {selectedIncident.classification}
                </div>
              </div>

              <div className="space-y-2 text-[12px]">
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-[#64748b]">Location / Zone:</span>
                  <span className="font-semibold text-[#0f172a]">{selectedIncident.zone}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-[#64748b]">Coordinates:</span>
                  <span className="font-mono text-slate-800">{selectedIncident.coordinates}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-[#64748b]">Ingest Stream:</span>
                  <span className="font-mono text-slate-800">{selectedIncident.ingestStream}</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-[#64748b]">Detection Pipeline:</span>
                  <span className="font-mono text-[#0052ff] font-semibold">
                    {selectedIncident.activePipeline}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right 2-cols: Intelligent Detection Lifecycle & Operational Actions */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
              <div>
                <h3 className="font-bold text-[15px] text-[#0f172a]">
                  Computer Vision &amp; Patrol Intercept Lifecycle
                </h3>
                <p className="text-[12px] text-[#64748b] mt-0.5">{selectedIncident.description}</p>
              </div>
              <div className="flex items-center gap-2">
                {selectedIncident.severity === 'critical' && (
                  <button
                    onClick={() => onOpenDispatch(selectedIncident)}
                    className="px-3.5 py-1.5 bg-[#ef4444] hover:bg-red-600 text-white rounded-xl text-[12px] font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
                  >
                    <span className="material-symbols-outlined text-[16px]">emergency</span>
                    <span>Dispatch QRT Intercept</span>
                  </button>
                )}
              </div>
            </div>

            {/* 6-step lifecycle timeline */}
            <div className="space-y-3.5">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-[#0052ff] text-white text-[11px] font-bold flex items-center justify-center shrink-0 shadow-xs">
                  1
                </div>
                <div>
                  <div className="font-semibold text-[13px] text-[#0f172a]">
                    YOLOv8 Edge Target Detection Confirmed
                  </div>
                  <div className="text-[12px] text-[#64748b] mt-0.5">
                    Bounding box anchored with confidence {Math.round(selectedIncident.confidence * 100)}%. Target classified as {selectedIncident.targetClass}.
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-[#0052ff] text-white text-[11px] font-bold flex items-center justify-center shrink-0 shadow-xs">
                  2
                </div>
                <div>
                  <div className="font-semibold text-[13px] text-[#0f172a]">
                    Virtual Boundary Tripwire Evaluated
                  </div>
                  <div className="text-[12px] text-[#64748b] mt-0.5">
                    Trajectory vector intersected 5m Indo-Nepal zero-line prohibition buffer.
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-[#0052ff] text-white text-[11px] font-bold flex items-center justify-center shrink-0 shadow-xs">
                  3
                </div>
                <div>
                  <div className="font-semibold text-[13px] text-[#0f172a]">
                    ANPR &amp; Biometric Correlation Engine
                  </div>
                  <div className="text-[12px] text-[#64748b] mt-0.5">
                    Queried local border pass database and vehicle registry. Cross-referenced with sentry checkpost records.
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-[#0052ff] text-white text-[11px] font-bold flex items-center justify-center shrink-0 shadow-xs">
                  4
                </div>
                <div>
                  <div className="font-semibold text-[13px] text-[#0f172a]">
                    Duty Officer Console Alert Dispatched
                  </div>
                  <div className="text-[12px] text-[#64748b] mt-0.5">
                    Real-time alert &amp; high-priority telemetry card surfaced at BOP Alpha console.
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-[#ef4444] text-white text-[11px] font-bold flex items-center justify-center shrink-0 shadow-xs">
                  5
                </div>
                <div>
                  <div className="font-semibold text-[13px] text-[#ef4444]">
                    Patrol Intercept &amp; Response: {selectedIncident.qrtUnit}
                  </div>
                  <div className="text-[12px] text-[#64748b] mt-0.5">
                    Estimated Intercept Velocity / Arrival: {selectedIncident.eta}.
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-slate-400 text-white text-[11px] font-bold flex items-center justify-center shrink-0 shadow-xs">
                  6
                </div>
                <div>
                  <div className="font-semibold text-[13px] text-[#0f172a]">
                    Formal Disposition &amp; General Diary (GD) Remark
                  </div>
                  <div className="text-[12px] text-[#64748b] mt-0.5">
                    {selectedIncident.operatorNotes}
                  </div>
                </div>
              </div>
            </div>

            {/* Status Update Quick Buttons */}
            <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <span className="text-[12px] font-semibold text-[#64748b]">
                Update Case Status:
              </span>
              <div className="flex items-center gap-2">
                {(['Under Verification', 'Acknowledged', 'Resolved'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => onUpdateStatus(selectedIncident.id, st)}
                    className={`px-3 py-1.5 text-[12px] font-semibold rounded-xl border transition-all ${
                      selectedIncident.status === st
                        ? 'bg-[#0052ff] text-white border-[#0052ff] shadow-xs'
                        : 'bg-slate-50 border-slate-200/80 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
