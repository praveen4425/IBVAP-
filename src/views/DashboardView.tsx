import React, { useState } from 'react';
import { CameraData, IncidentRecord, NavigationPage } from '../types';

interface DashboardViewProps {
  cameras: CameraData[];
  incidents: IncidentRecord[];
  onSelectCamera: (cameraId: string) => void;
  onNavigateIncidents: (incidentId?: string) => void;
  onOpenDispatch: (incident: IncidentRecord) => void;
  onNavigatePage?: (page: NavigationPage) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  cameras,
  incidents,
  onSelectCamera,
  onNavigateIncidents,
  onOpenDispatch,
  onNavigatePage
}) => {
  // Live running timestamp simulation
  const [selectedMapNode, setSelectedMapNode] = useState<string | null>(null);

  // Filter helper or find cameras by id
  const cam1 = cameras.find((c) => c.id === 'CAM-01') || cameras[0];
  const cam2 = cameras.find((c) => c.id === 'CAM-02') || cameras[1] || cameras[0];
  const cam3 = cameras.find((c) => c.id === 'CAM-03') || cameras[2] || cameras[0];
  const cam4 = cameras.find((c) => c.id === 'CAM-04') || cameras[3] || cameras[0];

  const handleQuickNav = (page: NavigationPage) => {
    if (onNavigatePage) {
      onNavigatePage(page);
    } else if (page === 'incidents') {
      onNavigateIncidents();
    } else if (page === 'live-cameras') {
      onSelectCamera('CAM-01');
    }
  };

  return (
    <div className="space-y-5 pb-10">
      {/* 1. Dashboard Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-[#0f172a] tracking-tight">
            Dashboard
          </h1>
          <p className="text-sm text-[#64748b] mt-0.5">
            Real-time monitoring &amp; AI-powered threat detection
          </p>
        </div>
      </div>

      {/* 2. Top Statistics Cards (4 Cards in a Row) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Active Cameras */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex items-center justify-between">
          <div className="flex flex-col justify-between h-full">
            <span className="text-[13px] font-medium text-[#64748b]">Active Cameras</span>
            <div className="my-1.5">
              <span className="text-2xl font-bold text-[#0f172a] font-mono tracking-tight">
                04
              </span>
              <span className="text-lg font-medium text-slate-400 font-mono"> / 04</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#10b981]">
              <span className="w-2 h-2 rounded-full bg-[#10b981]"></span>
              <span>Online</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#0052ff] flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[24px]">videocam</span>
          </div>
        </div>

        {/* Card 2: Persons Detected */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex items-center justify-between">
          <div className="flex flex-col justify-between h-full">
            <span className="text-[13px] font-medium text-[#64748b]">Persons Detected</span>
            <div className="my-1.5">
              <span className="text-2xl font-bold text-[#0f172a] font-mono tracking-tight">
                12
              </span>
            </div>
            <div className="flex items-center gap-1 text-xs font-semibold text-[#10b981]">
              <span className="material-symbols-outlined text-[14px]">arrow_upward</span>
              <span>20% vs. last hour</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#0052ff] flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[24px]">person</span>
          </div>
        </div>

        {/* Card 3: Vehicles Detected */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex items-center justify-between">
          <div className="flex flex-col justify-between h-full">
            <span className="text-[13px] font-medium text-[#64748b]">Vehicles Detected</span>
            <div className="my-1.5">
              <span className="text-2xl font-bold text-[#0f172a] font-mono tracking-tight">
                07
              </span>
            </div>
            <div className="flex items-center gap-1 text-xs font-semibold text-[#10b981]">
              <span className="material-symbols-outlined text-[14px]">arrow_upward</span>
              <span>15% vs. last hour</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#0052ff] flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[24px]">directions_car</span>
          </div>
        </div>

        {/* Card 4: Active Incidents */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex items-center justify-between">
          <div className="flex flex-col justify-between h-full">
            <span className="text-[13px] font-medium text-[#64748b]">Active Incidents</span>
            <div className="my-1.5">
              <span className="text-2xl font-bold text-[#0f172a] font-mono tracking-tight">
                03
              </span>
            </div>
            <div className="flex items-center gap-1 text-xs font-semibold text-[#ef4444]">
              <span className="material-symbols-outlined text-[14px]">arrow_upward</span>
              <span>50% vs. last hour</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-red-50 text-[#ef4444] flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[24px]">warning</span>
          </div>
        </div>
      </div>

      {/* 3. Main Dashboard Body: 2 Columns (Feeds/Timeline Left + Incidents/Map/Status Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* ================= LEFT COLUMN (8 of 12 cols) ================= */}
        <div className="lg:col-span-8 space-y-5">
          {/* Live CCTV Feeds Container */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <h2 className="text-[17px] font-bold text-[#0f172a] tracking-tight">
                  Live CCTV Feeds
                </h2>
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-50 border border-red-200/60">
                  <span className="w-2 h-2 rounded-full bg-[#ef4444] animate-pulse"></span>
                  <span className="text-[11px] font-bold text-[#ef4444] uppercase tracking-wider">
                    Live
                  </span>
                </div>
              </div>
              <button
                onClick={() => handleQuickNav('live-cameras')}
                className="text-[13px] font-semibold text-[#0052ff] hover:text-blue-700 flex items-center gap-1 transition-colors"
              >
                <span>View All Cameras</span>
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </button>
            </div>

            {/* 2x2 CCTV Feeds Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Feed 1: CAM-01 (BOP Main Entry Gate) */}
              <div
                onClick={() => onSelectCamera(cam1.id)}
                className="group relative rounded-xl overflow-hidden bg-slate-900 border border-slate-200/90 aspect-[16/10] cursor-pointer shadow-xs transition-all hover:shadow-md"
              >
                <img
                  src={cam1.imageUrl}
                  alt={cam1.name}
                  className="w-full h-full object-cover group-hover:scale-[1.01] transition-transform duration-300"
                />

                {/* Top Overlay HUD */}
                <div className="absolute top-0 left-0 right-0 p-2.5 flex items-center justify-between text-white text-[11px] font-medium bg-gradient-to-b from-black/80 via-black/40 to-transparent pointer-events-none">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#10b981]"></span>
                    <span className="font-bold font-mono">CAM-01</span>
                    <span className="text-white/60">•</span>
                    <span className="truncate">BOP Main Entry Gate</span>
                  </div>
                  <div className="flex items-center gap-1 font-mono text-[10px] text-white/80">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]"></span>
                    <span>25 FPS</span>
                  </div>
                </div>

                {/* AI Overlays: Person 94%, Vehicle 91%, Restricted Zone */}
                {/* Person 94% Bounding Box */}
                <div
                  className="absolute border-2 border-[#ef4444] pointer-events-none rounded-xs"
                  style={{ top: '36%', left: '23%', width: '18%', height: '52%' }}
                >
                  <span className="absolute -top-5 left-0 bg-[#ef4444] text-white font-mono text-[9px] font-bold px-1 py-0.5 rounded-xs tracking-wider">
                    PERSON 94%
                  </span>
                </div>

                {/* Vehicle 91% Bounding Box */}
                <div
                  className="absolute border-2 border-[#0052ff] pointer-events-none rounded-xs"
                  style={{ top: '35%', left: '46%', width: '36%', height: '42%' }}
                >
                  <span className="absolute -top-5 left-0 bg-[#0052ff] text-white font-mono text-[9px] font-bold px-1 py-0.5 rounded-xs tracking-wider">
                    VEHICLE 91%
                  </span>
                </div>

                {/* Restricted Zone Tripwire Line */}
                <div
                  className="absolute left-0 right-0 border-b-2 border-dashed border-[#ef4444] flex items-center justify-center pointer-events-none"
                  style={{ top: '65%' }}
                >
                  <span className="bg-[#ef4444] text-white font-mono text-[9px] font-bold px-2 py-0.5 rounded-xs uppercase tracking-wider shadow-sm -mt-2.5">
                    RESTRICTED ZONE
                  </span>
                </div>

                {/* Bottom Overlay HUD */}
                <div className="absolute bottom-0 left-0 right-0 px-2.5 py-1.5 flex items-center justify-between text-white/90 text-[10px] font-mono bg-black/75 backdrop-blur-xs border-t border-white/10 pointer-events-none">
                  <span>3 Objects Detected</span>
                  <span>2026-09-17 13:42:18</span>
                </div>
              </div>

              {/* Feed 2: CAM-02 (Patrol Strip) */}
              <div
                onClick={() => onSelectCamera(cam2.id)}
                className="group relative rounded-xl overflow-hidden bg-slate-900 border border-slate-200/90 aspect-[16/10] cursor-pointer shadow-xs transition-all hover:shadow-md"
              >
                <img
                  src={cam2.imageUrl}
                  alt={cam2.name}
                  className="w-full h-full object-cover group-hover:scale-[1.01] transition-transform duration-300"
                />

                {/* Top Overlay HUD */}
                <div className="absolute top-0 left-0 right-0 p-2.5 flex items-center justify-between text-white text-[11px] font-medium bg-gradient-to-b from-black/80 via-black/40 to-transparent pointer-events-none">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#10b981]"></span>
                    <span className="font-bold font-mono">CAM-02</span>
                    <span className="text-white/60">•</span>
                    <span className="truncate">Patrol Strip</span>
                  </div>
                  <div className="flex items-center gap-1 font-mono text-[10px] text-white/80">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]"></span>
                    <span>24 FPS</span>
                  </div>
                </div>

                {/* Vehicle 89% Bounding Box */}
                <div
                  className="absolute border-2 border-[#0052ff] pointer-events-none rounded-xs"
                  style={{ top: '38%', left: '44%', width: '18%', height: '24%' }}
                >
                  <span className="absolute -top-5 left-0 bg-[#0052ff] text-white font-mono text-[9px] font-bold px-1 py-0.5 rounded-xs tracking-wider">
                    VEHICLE 89%
                  </span>
                </div>

                {/* Person 87% Bounding Box */}
                <div
                  className="absolute border-2 border-[#16a34a] pointer-events-none rounded-xs"
                  style={{ top: '48%', left: '72%', width: '16%', height: '36%' }}
                >
                  <span className="absolute -top-5 left-0 bg-[#16a34a] text-white font-mono text-[9px] font-bold px-1 py-0.5 rounded-xs tracking-wider">
                    PERSON 87%
                  </span>
                </div>

                {/* Bottom Overlay HUD */}
                <div className="absolute bottom-0 left-0 right-0 px-2.5 py-1.5 flex items-center justify-between text-white/90 text-[10px] font-mono bg-black/75 backdrop-blur-xs border-t border-white/10 pointer-events-none">
                  <span>2 Objects Detected</span>
                  <span>2026-09-17 13:36:05</span>
                </div>
              </div>

              {/* Feed 3: CAM-03 (Checkpost / Perimeter East) */}
              <div
                onClick={() => onSelectCamera(cam3.id)}
                className="group relative rounded-xl overflow-hidden bg-slate-900 border border-slate-200/90 aspect-[16/10] cursor-pointer shadow-xs transition-all hover:shadow-md"
              >
                <img
                  src={cam3.imageUrl}
                  alt={cam3.name}
                  className="w-full h-full object-cover group-hover:scale-[1.01] transition-transform duration-300 filter contrast-110"
                />

                {/* Top Overlay HUD */}
                <div className="absolute top-0 left-0 right-0 p-2.5 flex items-center justify-between text-white text-[11px] font-medium bg-gradient-to-b from-black/80 via-black/40 to-transparent pointer-events-none">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#10b981]"></span>
                    <span className="font-bold font-mono">CAM-03</span>
                    <span className="text-white/60">•</span>
                    <span className="truncate">Checkpost</span>
                  </div>
                  <div className="flex items-center gap-1 font-mono text-[10px] text-white/80">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]"></span>
                    <span>22 FPS</span>
                  </div>
                </div>

                {/* Person 92% Bounding Box */}
                <div
                  className="absolute border-2 border-[#16a34a] pointer-events-none rounded-xs"
                  style={{ top: '38%', left: '38%', width: '16%', height: '48%' }}
                >
                  <span className="absolute -top-5 left-0 bg-[#16a34a] text-white font-mono text-[9px] font-bold px-1 py-0.5 rounded-xs tracking-wider">
                    PERSON 92%
                  </span>
                </div>

                {/* Bottom Overlay HUD */}
                <div className="absolute bottom-0 left-0 right-0 px-2.5 py-1.5 flex items-center justify-between text-white/90 text-[10px] font-mono bg-black/75 backdrop-blur-xs border-t border-white/10 pointer-events-none">
                  <span>1 Object Detected</span>
                  <span>2026-09-17 02:18:27</span>
                </div>
              </div>

              {/* Feed 4: CAM-04 (Sector North) */}
              <div
                onClick={() => onSelectCamera(cam4.id)}
                className="group relative rounded-xl overflow-hidden bg-slate-900 border border-slate-200/90 aspect-[16/10] cursor-pointer shadow-xs transition-all hover:shadow-md"
              >
                <img
                  src={cam4.imageUrl}
                  alt={cam4.name}
                  className="w-full h-full object-cover group-hover:scale-[1.01] transition-transform duration-300"
                />

                {/* Top Overlay HUD */}
                <div className="absolute top-0 left-0 right-0 p-2.5 flex items-center justify-between text-white text-[11px] font-medium bg-gradient-to-b from-black/80 via-black/40 to-transparent pointer-events-none">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#10b981]"></span>
                    <span className="font-bold font-mono">CAM-04</span>
                    <span className="text-white/60">•</span>
                    <span className="truncate">Sector North</span>
                  </div>
                  <div className="flex items-center gap-1 font-mono text-[10px] text-white/80">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]"></span>
                    <span>20 FPS</span>
                  </div>
                </div>

                {/* Vehicle 85% Bounding Box */}
                <div
                  className="absolute border-2 border-[#0052ff] pointer-events-none rounded-xs"
                  style={{ top: '44%', left: '46%', width: '28%', height: '36%' }}
                >
                  <span className="absolute -top-5 left-0 bg-[#0052ff] text-white font-mono text-[9px] font-bold px-1 py-0.5 rounded-xs tracking-wider">
                    VEHICLE 85%
                  </span>
                </div>

                {/* Bottom Overlay HUD */}
                <div className="absolute bottom-0 left-0 right-0 px-2.5 py-1.5 flex items-center justify-between text-white/90 text-[10px] font-mono bg-black/75 backdrop-blur-xs border-t border-white/10 pointer-events-none">
                  <span>1 Object Detected</span>
                  <span>2026-09-17 13:28:46</span>
                </div>
              </div>
            </div>
          </div>

          {/* AI Activity Timeline & Quick Actions (Side by Side) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* AI Activity Timeline Card */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3.5">
                <h3 className="text-[16px] font-bold text-[#0f172a] tracking-tight">
                  AI Activity Timeline
                </h3>
                <button
                  onClick={() => handleQuickNav('incidents')}
                  className="text-[12px] font-semibold text-[#0052ff] hover:text-blue-700 flex items-center gap-0.5 transition-colors"
                >
                  <span>View All</span>
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </button>
              </div>

              {/* Timeline Items */}
              <div className="space-y-3">
                {/* 13:45 Vehicle detected - CAM-02 */}
                <div
                  onClick={() => onSelectCamera('CAM-02')}
                  className="flex items-center justify-between text-[13px] py-1 cursor-pointer hover:bg-slate-50 px-2 -mx-2 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-2 h-2 rounded-full bg-[#ef4444]"></span>
                    <span className="font-mono text-slate-500 text-[12px] font-medium">13:45</span>
                    <span className="material-symbols-outlined text-[17px] text-[#0052ff]">
                      directions_car
                    </span>
                    <span className="font-medium text-slate-800">Vehicle detected</span>
                  </div>
                  <span className="font-mono text-[12px] text-slate-500 font-medium">
                    — CAM-02
                  </span>
                </div>

                {/* 13:42 Intrusion detected - CAM-01 */}
                <div
                  onClick={() => onSelectCamera('CAM-01')}
                  className="flex items-center justify-between text-[13px] py-1 cursor-pointer hover:bg-slate-50 px-2 -mx-2 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-2 h-2 rounded-full bg-[#ef4444]"></span>
                    <span className="font-mono text-slate-500 text-[12px] font-medium">13:42</span>
                    <span className="material-symbols-outlined text-[17px] text-[#ef4444]">
                      warning
                    </span>
                    <span className="font-medium text-slate-800">Intrusion detected</span>
                  </div>
                  <span className="font-mono text-[12px] text-slate-500 font-medium">
                    — CAM-01
                  </span>
                </div>

                {/* 13:39 Person detected - CAM-01 */}
                <div
                  onClick={() => onSelectCamera('CAM-01')}
                  className="flex items-center justify-between text-[13px] py-1 cursor-pointer hover:bg-slate-50 px-2 -mx-2 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-2 h-2 rounded-full bg-[#0052ff]"></span>
                    <span className="font-mono text-slate-500 text-[12px] font-medium">13:39</span>
                    <span className="material-symbols-outlined text-[17px] text-[#0052ff]">
                      person
                    </span>
                    <span className="font-medium text-slate-800">Person detected</span>
                  </div>
                  <span className="font-mono text-[12px] text-slate-500 font-medium">
                    — CAM-01
                  </span>
                </div>

                {/* 13:35 Vehicle detected - CAM-03 */}
                <div
                  onClick={() => onSelectCamera('CAM-03')}
                  className="flex items-center justify-between text-[13px] py-1 cursor-pointer hover:bg-slate-50 px-2 -mx-2 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-2 h-2 rounded-full bg-[#0052ff]"></span>
                    <span className="font-mono text-slate-500 text-[12px] font-medium">13:35</span>
                    <span className="material-symbols-outlined text-[17px] text-[#0052ff]">
                      directions_car
                    </span>
                    <span className="font-medium text-slate-800">Vehicle detected</span>
                  </div>
                  <span className="font-mono text-[12px] text-slate-500 font-medium">
                    — CAM-03
                  </span>
                </div>

                {/* 13:31 Person detected - CAM-04 */}
                <div
                  onClick={() => onSelectCamera('CAM-04')}
                  className="flex items-center justify-between text-[13px] py-1 cursor-pointer hover:bg-slate-50 px-2 -mx-2 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-2 h-2 rounded-full bg-[#0052ff]"></span>
                    <span className="font-mono text-slate-500 text-[12px] font-medium">13:31</span>
                    <span className="material-symbols-outlined text-[17px] text-[#0052ff]">
                      person
                    </span>
                    <span className="font-medium text-slate-800">Person detected</span>
                  </div>
                  <span className="font-mono text-[12px] text-slate-500 font-medium">
                    — CAM-04
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions Card */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs flex flex-col justify-between">
              <h3 className="text-[16px] font-bold text-[#0f172a] tracking-tight mb-3.5">
                Quick Actions
              </h3>

              <div className="grid grid-cols-2 gap-3 h-full">
                {/* Action 1: View All Cameras */}
                <button
                  onClick={() => handleQuickNav('live-cameras')}
                  className="flex flex-col items-center justify-center p-3 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-blue-50/60 hover:border-blue-200 transition-all text-center group"
                >
                  <span className="material-symbols-outlined text-[24px] text-[#0052ff] mb-2 group-hover:scale-110 transition-transform">
                    videocam
                  </span>
                  <span className="text-[12px] font-semibold text-slate-800 leading-tight">
                    View All Cameras
                  </span>
                </button>

                {/* Action 2: Check Incidents */}
                <button
                  onClick={() => handleQuickNav('incidents')}
                  className="flex flex-col items-center justify-center p-3 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-blue-50/60 hover:border-blue-200 transition-all text-center group"
                >
                  <span className="material-symbols-outlined text-[24px] text-[#0052ff] mb-2 group-hover:scale-110 transition-transform">
                    warning
                  </span>
                  <span className="text-[12px] font-semibold text-slate-800 leading-tight">
                    Check Incidents
                  </span>
                </button>

                {/* Action 3: Open Evidence */}
                <button
                  onClick={() => handleQuickNav('evidence')}
                  className="flex flex-col items-center justify-center p-3 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-blue-50/60 hover:border-blue-200 transition-all text-center group"
                >
                  <span className="material-symbols-outlined text-[24px] text-[#0052ff] mb-2 group-hover:scale-110 transition-transform">
                    folder
                  </span>
                  <span className="text-[12px] font-semibold text-slate-800 leading-tight">
                    Open Evidence
                  </span>
                </button>

                {/* Action 4: ANPR Search */}
                <button
                  onClick={() => handleQuickNav('anpr')}
                  className="flex flex-col items-center justify-center p-3 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-blue-50/60 hover:border-blue-200 transition-all text-center group"
                >
                  <span className="material-symbols-outlined text-[24px] text-[#0052ff] mb-2 group-hover:scale-110 transition-transform">
                    badge
                  </span>
                  <span className="text-[12px] font-semibold text-slate-800 leading-tight">
                    ANPR Search
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ================= RIGHT COLUMN (4 of 12 cols) ================= */}
        <div className="lg:col-span-4 space-y-5">
          {/* 1. Recent Incidents Panel */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3.5">
              <h3 className="text-[16px] font-bold text-[#0f172a] tracking-tight">
                Recent Incidents
              </h3>
              <button
                onClick={() => handleQuickNav('incidents')}
                className="text-[12px] font-semibold text-[#0052ff] hover:text-blue-700 flex items-center gap-0.5 transition-colors"
              >
                <span>View All</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </button>
            </div>

            {/* List of 4 Incidents matching reference image */}
            <div className="space-y-3">
              {/* Incident 1: Restricted Area Intrusion */}
              <div
                onClick={() => onNavigateIncidents('INC-2026-084')}
                className="flex items-center justify-between gap-3 p-2.5 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50/80 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-[#ef4444] text-white flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[18px]">warning</span>
                  </div>
                  <div className="min-w-0">
                    <div className="text-[13px] font-bold text-[#0f172a] truncate group-hover:text-[#0052ff] transition-colors">
                      Restricted Area Intrusion
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-mono mt-0.5">
                      <span>CAM-01</span>
                      <span>•</span>
                      <span>13:42</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200/60">
                    New
                  </span>
                  <div className="w-10 h-10 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 shrink-0">
                    <img
                      src={cam1.imageUrl}
                      alt="CAM-01"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </div>

              {/* Incident 2: Vehicle Detected */}
              <div
                onClick={() => onNavigateIncidents('INC-2026-082')}
                className="flex items-center justify-between gap-3 p-2.5 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50/80 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-[#f97316] text-white flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[18px]">directions_car</span>
                  </div>
                  <div className="min-w-0">
                    <div className="text-[13px] font-bold text-[#0f172a] truncate group-hover:text-[#0052ff] transition-colors">
                      Vehicle Detected
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-mono mt-0.5">
                      <span>CAM-02</span>
                      <span>•</span>
                      <span>13:36</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200/60">
                    New
                  </span>
                  <div className="w-10 h-10 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 shrink-0">
                    <img
                      src={cam2.imageUrl}
                      alt="CAM-02"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </div>

              {/* Incident 3: Night Movement Detected */}
              <div
                onClick={() => onNavigateIncidents('INC-2026-083')}
                className="flex items-center justify-between gap-3 p-2.5 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50/80 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-[#eab308] text-white flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[18px]">warning</span>
                  </div>
                  <div className="min-w-0">
                    <div className="text-[13px] font-bold text-[#0f172a] truncate group-hover:text-[#0052ff] transition-colors">
                      Night Movement Detected
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-mono mt-0.5">
                      <span>CAM-03</span>
                      <span>•</span>
                      <span>02:18</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200/60">
                    Reviewed
                  </span>
                  <div className="w-10 h-10 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 shrink-0">
                    <img
                      src={cam3.imageUrl}
                      alt="CAM-03"
                      className="w-full h-full object-cover filter contrast-110"
                    />
                  </div>
                </div>
              </div>

              {/* Incident 4: Person Detected */}
              <div
                onClick={() => onNavigateIncidents('INC-2026-080')}
                className="flex items-center justify-between gap-3 p-2.5 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50/80 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-[#0052ff] text-white flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[18px]">info</span>
                  </div>
                  <div className="min-w-0">
                    <div className="text-[13px] font-bold text-[#0f172a] truncate group-hover:text-[#0052ff] transition-colors">
                      Person Detected
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-mono mt-0.5">
                      <span>CAM-04</span>
                      <span>•</span>
                      <span>13:28</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                    Resolved
                  </span>
                  <div className="w-10 h-10 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 shrink-0">
                    <img
                      src={cam4.imageUrl}
                      alt="CAM-04"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Border Sector Map */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3.5">
              <h3 className="text-[16px] font-bold text-[#0f172a] tracking-tight">
                Border Sector Map
              </h3>
              <button
                onClick={() => handleQuickNav('live-cameras')}
                className="text-[12px] font-semibold text-[#0052ff] hover:text-blue-700 flex items-center gap-0.5 transition-colors"
              >
                <span>View Full Map</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </button>
            </div>

            {/* Vector Map Canvas */}
            <div className="relative w-full rounded-xl overflow-hidden bg-[#f0fdf4]/50 border border-slate-200/90 aspect-[16/10] select-none">
              <svg viewBox="0 0 400 240" className="w-full h-full">
                {/* Background terrain patterns */}
                <rect width="400" height="240" fill="#f8fafc" />
                
                {/* Subtle Topographic Terrain contours */}
                <path
                  d="M -20 180 Q 80 120 180 160 T 420 140"
                  fill="none"
                  stroke="#e2e8f0"
                  strokeWidth="1.5"
                />
                <path
                  d="M -20 80 Q 120 140 220 70 T 420 100"
                  fill="none"
                  stroke="#e2e8f0"
                  strokeWidth="1.5"
                />

                {/* Border Roadways / Pathways */}
                <path
                  d="M 30 20 Q 90 80 150 120 T 360 220"
                  fill="none"
                  stroke="#cbd5e1"
                  strokeWidth="6"
                  strokeLinecap="round"
                />
                <path
                  d="M 30 20 Q 90 80 150 120 T 360 220"
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth="2"
                  strokeDasharray="6,6"
                  strokeLinecap="round"
                />

                <path
                  d="M 220 20 L 250 120 L 370 120"
                  fill="none"
                  stroke="#e2e8f0"
                  strokeWidth="3"
                />

                {/* Tree and Landmark dots */}
                <circle cx="90" cy="50" r="8" fill="#dcfce7" />
                <circle cx="88" cy="48" r="5" fill="#86efac" />
                <circle cx="160" cy="180" r="10" fill="#dcfce7" />
                <circle cx="158" cy="178" r="6" fill="#86efac" />
                <circle cx="340" cy="60" r="8" fill="#dcfce7" />
                <circle cx="338" cy="58" r="5" fill="#86efac" />

                {/* Translucent Red Polygon: RESTRICTED ZONE */}
                <polygon
                  points="180,100 290,70 340,140 270,200 160,180"
                  fill="#ef4444"
                  fillOpacity="0.12"
                  stroke="#ef4444"
                  strokeWidth="1.5"
                  strokeDasharray="4,3"
                />

                {/* Restricted Zone Centered Label */}
                <text
                  x="248"
                  y="135"
                  textAnchor="middle"
                  fill="#ef4444"
                  fontSize="9"
                  fontWeight="bold"
                  fontFamily="monospace"
                  letterSpacing="0.05em"
                >
                  RESTRICTED
                </text>
                <text
                  x="248"
                  y="147"
                  textAnchor="middle"
                  fill="#ef4444"
                  fontSize="9"
                  fontWeight="bold"
                  fontFamily="monospace"
                  letterSpacing="0.05em"
                >
                  ZONE
                </text>

                {/* Watchtower Icon in Sector */}
                <g transform="translate(230, 80)">
                  <circle cx="8" cy="8" r="12" fill="#ffffff" stroke="#94a3b8" strokeWidth="1" />
                  <path
                    d="M 5 13 L 8 4 L 11 13 Z M 6 9 L 10 9"
                    stroke="#0052ff"
                    strokeWidth="1.2"
                    fill="none"
                  />
                </g>

                {/* Camera 01 Node Marker (ALERT - RED) */}
                <g
                  className="cursor-pointer"
                  onClick={() => onSelectCamera('CAM-01')}
                  transform="translate(145, 175)"
                >
                  <circle cx="12" cy="12" r="12" fill="#fee2e2" />
                  <circle cx="12" cy="12" r="7" fill="#ef4444" className="animate-pulse" />
                  <path
                    d="M 8 10 L 14 10 L 16 8 L 16 16 L 14 14 L 8 14 Z"
                    fill="#ffffff"
                    transform="scale(0.8) translate(3,3)"
                  />
                  <text
                    x="12"
                    y="32"
                    textAnchor="middle"
                    fill="#0f172a"
                    fontSize="10"
                    fontWeight="bold"
                    fontFamily="sans-serif"
                  >
                    CAM-01
                  </text>
                </g>

                {/* Camera 02 Node Marker (ONLINE - GREEN) */}
                <g
                  className="cursor-pointer"
                  onClick={() => onSelectCamera('CAM-02')}
                  transform="translate(110, 45)"
                >
                  <circle cx="10" cy="10" r="10" fill="#dcfce7" />
                  <circle cx="10" cy="10" r="6" fill="#16a34a" />
                  <text
                    x="10"
                    y="27"
                    textAnchor="middle"
                    fill="#0f172a"
                    fontSize="10"
                    fontWeight="bold"
                    fontFamily="sans-serif"
                  >
                    CAM-02
                  </text>
                </g>

                {/* Camera 03 Node Marker (ONLINE - GREEN) */}
                <g
                  className="cursor-pointer"
                  onClick={() => onSelectCamera('CAM-03')}
                  transform="translate(325, 45)"
                >
                  <circle cx="10" cy="10" r="10" fill="#dcfce7" />
                  <circle cx="10" cy="10" r="6" fill="#16a34a" />
                  <text
                    x="10"
                    y="27"
                    textAnchor="middle"
                    fill="#0f172a"
                    fontSize="10"
                    fontWeight="bold"
                    fontFamily="sans-serif"
                  >
                    CAM-03
                  </text>
                </g>

                {/* Camera 04 Node Marker (ONLINE - GREEN) */}
                <g
                  className="cursor-pointer"
                  onClick={() => onSelectCamera('CAM-04')}
                  transform="translate(325, 175)"
                >
                  <circle cx="10" cy="10" r="10" fill="#dcfce7" />
                  <circle cx="10" cy="10" r="6" fill="#16a34a" />
                  <text
                    x="10"
                    y="27"
                    textAnchor="middle"
                    fill="#0f172a"
                    fontSize="10"
                    fontWeight="bold"
                    fontFamily="sans-serif"
                  >
                    CAM-04
                  </text>
                </g>
              </svg>
            </div>

            {/* Map Legend at Bottom */}
            <div className="flex items-center justify-between text-[11px] font-medium text-slate-600 mt-3 pt-2.5 border-t border-slate-100">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#10b981]"></span>
                <span>Online</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#f59e0b]"></span>
                <span>Alert</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#ef4444]"></span>
                <span>Offline</span>
              </div>
            </div>
          </div>

          {/* 3. System Status Panel */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs">
            <h3 className="text-[16px] font-bold text-[#0f172a] tracking-tight mb-3.5">
              System Status
            </h3>

            <div className="space-y-2.5 text-[13px]">
              {/* AI Analytics */}
              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#10b981]"></span>
                  <span className="text-slate-700 font-medium">AI Analytics</span>
                </div>
                <span className="text-[12px] font-bold text-[#10b981] flex items-center gap-1">
                  Online
                </span>
              </div>

              {/* CCTV Network */}
              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#10b981]"></span>
                  <span className="text-slate-700 font-medium">CCTV Network</span>
                </div>
                <span className="text-[12px] font-bold text-[#10b981] flex items-center gap-1">
                  Online
                </span>
              </div>

              {/* Database */}
              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#10b981]"></span>
                  <span className="text-slate-700 font-medium">Database</span>
                </div>
                <span className="text-[12px] font-bold text-[#10b981] flex items-center gap-1">
                  Online
                </span>
              </div>

              {/* Storage */}
              <div className="flex items-center justify-between py-1">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#10b981]"></span>
                  <span className="text-slate-700 font-medium">Storage</span>
                </div>
                <span className="text-[12px] font-bold text-[#10b981] flex items-center gap-1">
                  Online
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
