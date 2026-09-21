import React from 'react';
import { NavigationPage } from '../types';

interface SidebarProps {
  currentPage: NavigationPage;
  onNavigate: (page: NavigationPage) => void;
  activeAlertCount?: number;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onNavigate,
  activeAlertCount = 3,
  isOpenMobile = false,
  onCloseMobile
}) => {
  const navItems: { id: NavigationPage; label: string; icon: string; badge?: number }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: 'home' },
    { id: 'live-cameras', label: 'Live Cameras', icon: 'videocam' },
    { id: 'incidents', label: 'Incidents', icon: 'warning', badge: activeAlertCount },
    { id: 'anpr', label: 'ANPR', icon: 'directions_car' },
    { id: 'face-analytics', label: 'Face Analytics', icon: 'face' },
    { id: 'evidence', label: 'Evidence', icon: 'folder' },
    { id: 'admin-console', label: 'Admin Console', icon: 'settings' }
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-xs transition-opacity"
        />
      )}

      <aside
        className={`fixed left-0 top-0 bottom-0 w-64 bg-[#07162c] text-[#94a3b8] z-50 flex flex-col justify-between py-4 border-r border-[#152a4a] transition-transform duration-300 md:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="flex flex-col gap-2">
          {/* Logo Header */}
          <div className="px-5 pt-1 pb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 via-blue-600 to-cyan-500 p-[1.5px] shadow-lg shadow-blue-500/20">
                <div className="w-full h-full bg-[#051124] rounded-[10px] flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-blue-500/10 animate-pulse" />
                  <svg className="w-6 h-6 text-cyan-400 relative z-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2L3 7v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-5.45 9-12V7l-9-5z" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8"/>
                    <path d="M12 9v-2M12 17v-2M9 12H7M17 12h-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </div>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="text-[19px] font-black tracking-wider text-white font-sans leading-none">
                    IBVAP
                  </span>
                  <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-amber-500/20 border border-amber-400/50 text-amber-300 font-mono">
                    PS-187
                  </span>
                </div>
                <span className="text-[10px] text-cyan-400/90 tracking-widest uppercase font-bold mt-1">
                  Border AI • SIH 187
                </span>
              </div>
            </div>

            {/* Close Button on Mobile */}
            {onCloseMobile && (
              <button
                onClick={onCloseMobile}
                className="md:hidden p-1.5 rounded-lg text-[#94a3b8] hover:text-white hover:bg-white/10"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            )}
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1 px-3">
            {navItems.map((item) => {
              const isActive =
                currentPage === item.id || (currentPage === 'camera-detail' && item.id === 'live-cameras');
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onNavigate(item.id);
                    if (onCloseMobile) onCloseMobile();
                  }}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all text-left font-medium text-[14px] ${
                    isActive
                      ? 'bg-[#0052ff] text-white shadow-sm font-semibold'
                      : 'text-[#94a3b8] hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span
                      className={`font-mono text-[11px] font-bold px-2 py-0.5 rounded-full ${
                        isActive ? 'bg-white text-[#0052ff]' : 'bg-[#ef4444] text-white'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer: Mountain Line Art & Motto */}
        <div className="px-4 flex flex-col items-center mt-auto pt-6">
          <div className="w-full px-2 mb-2 flex items-center justify-center opacity-65">
            <svg viewBox="0 0 220 70" className="w-full h-12 stroke-white/60 fill-none">
              <path
                d="M 10 58 L 55 24 L 90 46 L 140 12 L 180 42 L 210 58"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M 90 46 L 110 32 L 130 45"
                strokeWidth="1.2"
                strokeLinecap="round"
              />
              <path
                d="M 40 58 L 70 38 L 95 58"
                strokeWidth="1.2"
                strokeLinecap="round"
              />
            </svg>
          </div>

          <div className="text-center text-[12px] font-medium text-slate-300 tracking-wide leading-snug pb-1">
            <div className="text-slate-200 font-semibold">Safer Borders</div>
            <div className="text-slate-400 text-[11px]">Stronger Nation</div>
          </div>
        </div>
      </aside>
    </>
  );
};
