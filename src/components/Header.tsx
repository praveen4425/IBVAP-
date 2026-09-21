import React, { useState } from 'react';

interface HeaderProps {
  onToggleMobileMenu?: () => void;
  onNavigateNotifications?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleMobileMenu,
  onNavigateNotifications
}) => {
  const [isOperatorMenuOpen, setIsOperatorMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 md:left-64 right-0 h-16 z-40 bg-white border-b border-slate-200/90 px-4 md:px-6 flex items-center justify-between shadow-xs">
      {/* Left: Platform Title & Subtitle */}
      <div className="flex items-center gap-3">
        {onToggleMobileMenu && (
          <button
            onClick={onToggleMobileMenu}
            className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
            aria-label="Toggle Navigation Menu"
          >
            <span className="material-symbols-outlined text-[24px]">menu</span>
          </button>
        )}

        <div className="flex flex-col justify-center">
          <h1 className="text-[15px] sm:text-[16px] font-bold text-[#0f172a] tracking-tight leading-tight">
            Intelligent Border Video Analytics Platform
          </h1>
          <p className="text-[12px] text-[#64748b] font-normal leading-tight">
            for Border Surveillance
          </p>
        </div>
      </div>

      {/* Right: System Telemetry & Operator Controls */}
      <div className="flex items-center gap-4 sm:gap-6">
        {/* System Online Status */}
        <div className="hidden sm:flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#10b981] shadow-[0_0_6px_rgba(16,185,129,0.5)] animate-pulse"></span>
          <span className="text-[13px] font-medium text-slate-700">System Online</span>
        </div>

        {/* Sector Indicator */}
        <div className="hidden lg:flex items-center gap-1.5 text-[13px] font-medium text-slate-700">
          <span className="material-symbols-outlined text-[18px] text-[#0052ff]">location_on</span>
          <span>Sector : BOP Alpha</span>
        </div>

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => {
              setIsNotificationsOpen(!isNotificationsOpen);
              setIsOperatorMenuOpen(false);
            }}
            className="relative p-2 rounded-full text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
            title="3 Active System Alerts"
          >
            <span className="material-symbols-outlined text-[22px]">notifications</span>
            <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-[#ef4444] text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-xs">
              3
            </span>
          </button>

          {/* Notifications Dropdown */}
          {isNotificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200/90 py-2 z-50 text-slate-800 animate-in fade-in zoom-in-95">
              <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                <span className="font-bold text-[13px] text-slate-900">Recent Alerts</span>
                <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-full bg-red-100 text-red-700">
                  3 Critical
                </span>
              </div>
              <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
                <div
                  onClick={() => {
                    setIsNotificationsOpen(false);
                    if (onNavigateNotifications) onNavigateNotifications();
                  }}
                  className="px-4 py-2.5 hover:bg-slate-50 cursor-pointer flex gap-2.5 items-start"
                >
                  <span className="material-symbols-outlined text-red-500 text-[18px] mt-0.5">warning</span>
                  <div>
                    <div className="text-[12px] font-semibold text-slate-900">
                      Restricted Area Intrusion — CAM-01
                    </div>
                    <div className="text-[11px] text-slate-500">13:42 • Perimeter Breach Detected</div>
                  </div>
                </div>
                <div
                  onClick={() => {
                    setIsNotificationsOpen(false);
                    if (onNavigateNotifications) onNavigateNotifications();
                  }}
                  className="px-4 py-2.5 hover:bg-slate-50 cursor-pointer flex gap-2.5 items-start"
                >
                  <span className="material-symbols-outlined text-amber-500 text-[18px] mt-0.5">directions_car</span>
                  <div>
                    <div className="text-[12px] font-semibold text-slate-900">
                      Vehicle Detected — CAM-02
                    </div>
                    <div className="text-[11px] text-slate-500">13:36 • Commercial Class Moving</div>
                  </div>
                </div>
                <div
                  onClick={() => {
                    setIsNotificationsOpen(false);
                    if (onNavigateNotifications) onNavigateNotifications();
                  }}
                  className="px-4 py-2.5 hover:bg-slate-50 cursor-pointer flex gap-2.5 items-start"
                >
                  <span className="material-symbols-outlined text-blue-500 text-[18px] mt-0.5">person</span>
                  <div>
                    <div className="text-[12px] font-semibold text-slate-900">
                      Person Detected — CAM-04
                    </div>
                    <div className="text-[11px] text-slate-500">13:28 • Sentry Sector North</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Operator Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setIsOperatorMenuOpen(!isOperatorMenuOpen);
              setIsNotificationsOpen(false);
            }}
            className="flex items-center gap-2 p-1.5 pr-2.5 rounded-full hover:bg-slate-100 transition-colors text-slate-800"
          >
            <div className="w-8 h-8 rounded-full bg-[#07162c] text-white flex items-center justify-center font-bold text-sm shadow-xs">
              <span className="material-symbols-outlined text-[18px]">person</span>
            </div>
            <span className="text-[13px] font-medium text-slate-800 hidden sm:inline">
              Operator
            </span>
            <span className="material-symbols-outlined text-[18px] text-slate-500">
              keyboard_arrow_down
            </span>
          </button>

          {/* Operator Dropdown Menu */}
          {isOperatorMenuOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200/90 py-2 z-50 text-slate-800 animate-in fade-in zoom-in-95">
              <div className="px-4 py-2.5 border-b border-slate-100">
                <div className="font-bold text-[13px] text-slate-900">Insp. R. K. Verma</div>
                <div className="text-[11px] text-slate-500">SSB Duty Officer • Node IND-NPL-04</div>
                <div className="text-[10px] font-mono text-emerald-600 font-semibold mt-1">
                  Active Shift: 08:00 - 16:00 IST
                </div>
              </div>
              <div className="py-1">
                <div className="px-4 py-2 text-[12px] text-slate-700 hover:bg-slate-50 cursor-pointer flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-slate-500">verified_user</span>
                  <span>Credentials & Badges</span>
                </div>
                <div className="px-4 py-2 text-[12px] text-slate-700 hover:bg-slate-50 cursor-pointer flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-slate-500">tune</span>
                  <span>Surveillance Sensitivity</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
