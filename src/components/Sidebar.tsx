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
              <div className="w-9 h-9 rounded-lg bg-[#0052ff]/20 border border-[#0052ff]/40 flex items-center justify-center text-white shadow-inner">
                <svg className="w-5 h-5 text-white fill-none stroke-current" viewBox="0 0 24 24" strokeWidth="2.2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="text-[20px] font-bold tracking-wider text-white font-sans leading-none">
                  IBVAP
                </span>
                <span className="text-[10px] text-[#64748b] tracking-wider uppercase font-semibold mt-1">
                  Sector Alpha
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
