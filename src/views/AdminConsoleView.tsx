import React, { useState } from 'react';
import { CameraData } from '../types';

interface Operator {
  id: string;
  initials: string;
  color: string;
  name: string;
  username: string;
  role: string;
  accessLevel: 'Surveillance' | 'Full Access' | 'Incident Mgmt';
  lastActive: string;
  status: 'Active' | 'Suspended' | 'Off-Duty';
}

interface ActivityItem {
  id: number;
  title: string;
  desc: string;
  time: string;
  icon: string;
  color: string;
}

interface AdminConsoleViewProps {
  cameras: CameraData[];
  onSelectCamera?: (id: string) => void;
}

export const AdminConsoleView: React.FC<AdminConsoleViewProps> = ({ cameras: initialCameras }) => {
  // --- Local State ---
  const [cameraList, setCameraList] = useState([
    {
      id: 'CAM-01',
      name: 'CAM-01',
      subtitle: 'BOP Main Entry Gate',
      location: 'BOP Alpha',
      ipAddress: '192.168.14.21',
      fps: 25,
      status: 'Online'
    },
    {
      id: 'CAM-02',
      name: 'CAM-02',
      subtitle: 'Patrol Strip North',
      location: 'BOP Alpha',
      ipAddress: '192.168.14.22',
      fps: 24,
      status: 'Online'
    },
    {
      id: 'CAM-03',
      name: 'CAM-03',
      subtitle: 'Checkpoint',
      location: 'BOP Alpha',
      ipAddress: '192.168.14.23',
      fps: 22,
      status: 'Online'
    },
    {
      id: 'CAM-04',
      name: 'CAM-04',
      subtitle: 'Sector North',
      location: 'BOP Alpha',
      ipAddress: '192.168.14.24',
      fps: 20,
      status: 'Online'
    }
  ]);

  const [operatorList, setOperatorList] = useState<Operator[]>([
    {
      id: 'OP-1',
      initials: 'RK',
      color: 'bg-[#0052ff]',
      name: 'R. Kumar',
      username: 'rk.operator',
      role: 'Operator',
      accessLevel: 'Surveillance',
      lastActive: '2 min ago',
      status: 'Active'
    },
    {
      id: 'OP-2',
      initials: 'AS',
      color: 'bg-[#7e22ce]',
      name: 'A. Singh',
      username: 'a.singh',
      role: 'Supervisor',
      accessLevel: 'Full Access',
      lastActive: '18 min ago',
      status: 'Active'
    },
    {
      id: 'OP-3',
      initials: 'PD',
      color: 'bg-[#0d9488]',
      name: 'P. Desai',
      username: 'p.desai',
      role: 'Operator',
      accessLevel: 'Surveillance',
      lastActive: '32 min ago',
      status: 'Active'
    },
    {
      id: 'OP-4',
      initials: 'SP',
      color: 'bg-[#4338ca]',
      name: 'S. Patel',
      username: 's.patel',
      role: 'Operator',
      accessLevel: 'Incident Mgmt',
      lastActive: '1 hr ago',
      status: 'Active'
    }
  ]);

  const [aiModules, setAiModules] = useState({
    personDetection: true,
    vehicleDetection: true,
    virtualFence: true,
    nightMovement: true,
    anpr: true
  });

  const [activities, setActivities] = useState<ActivityItem[]>([
    {
      id: 1,
      title: 'Operator account added',
      desc: 'Administrator added a new operator account',
      time: '10 min ago',
      icon: 'person_add',
      color: 'bg-blue-50 text-[#0052ff]'
    },
    {
      id: 2,
      title: 'Camera configuration updated',
      desc: 'CAM-02 stream configuration modified',
      time: '24 min ago',
      icon: 'videocam',
      color: 'bg-emerald-50 text-emerald-600'
    },
    {
      id: 3,
      title: 'AI configuration changed',
      desc: 'Virtual Fence detection settings updated',
      time: '41 min ago',
      icon: 'tune',
      color: 'bg-amber-50 text-amber-600'
    },
    {
      id: 4,
      title: 'Administrator login',
      desc: 'Successful administrative login',
      time: '1 hr ago',
      icon: 'verified_user',
      color: 'bg-purple-50 text-purple-600'
    }
  ]);

  // Modals state
  const [isAddCameraOpen, setIsAddCameraOpen] = useState(false);
  const [editingCamera, setEditingCamera] = useState<any | null>(null);
  const [deletingCamera, setDeletingCamera] = useState<any | null>(null);

  const [isAddOperatorOpen, setIsAddOperatorOpen] = useState(false);
  const [editingOperator, setEditingOperator] = useState<Operator | null>(null);
  const [deletingOperator, setDeletingOperator] = useState<Operator | null>(null);

  const [isAuditLogOpen, setIsAuditLogOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Toast state
  const [toast, setToast] = useState<{ title: string; desc: string; type: 'success' | 'info' | 'warning' | 'danger' } | null>(null);

  const triggerToast = (title: string, desc: string, type: 'success' | 'info' | 'warning' | 'danger' = 'info') => {
    setToast({ title, desc, type });
    setTimeout(() => {
      setToast((prev) => (prev?.title === title ? null : prev));
    }, 3500);
  };

  const addActivity = (title: string, desc: string, icon: string, color: string) => {
    setActivities((prev) => [
      {
        id: Date.now(),
        title,
        desc,
        time: 'Just now',
        icon,
        color
      },
      ...prev
    ]);
  };

  // --- Handlers for AI Modules ---
  const handleToggleAi = (key: keyof typeof aiModules, label: string) => {
    const nextVal = !aiModules[key];
    setAiModules((prev) => ({ ...prev, [key]: nextVal }));
    const statusText = nextVal ? 'Enabled' : 'Disabled';
    addActivity('AI Module Updated', `${label} set to ${statusText}`, 'tune', 'bg-amber-50 text-amber-600');
    triggerToast(`AI Module: ${label}`, `${label} is now ${statusText.toLowerCase()}.`, nextVal ? 'info' : 'warning');
  };

  // --- Camera CRUD ---
  const handleAddCameraSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const id = (formData.get('id') as string).trim();
    const subtitle = (formData.get('subtitle') as string).trim();
    const location = (formData.get('location') as string).trim() || 'BOP Alpha';
    const ipAddress = (formData.get('ipAddress') as string).trim();
    const fps = parseInt(formData.get('fps') as string, 10) || 25;

    const newCam = {
      id,
      name: id,
      subtitle,
      location,
      ipAddress,
      fps,
      status: 'Online'
    };

    setCameraList((prev) => [...prev, newCam]);
    setIsAddCameraOpen(false);
    addActivity('New Camera Connected', `${id} (${subtitle}) registered to stream matrix`, 'videocam', 'bg-emerald-50 text-emerald-600');
    triggerToast('Camera Connected', `Camera ${id} successfully added to stream matrix.`, 'success');
  };

  const handleEditCameraSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingCamera) return;
    const formData = new FormData(e.currentTarget);
    const subtitle = (formData.get('subtitle') as string).trim();
    const location = (formData.get('location') as string).trim();
    const ipAddress = (formData.get('ipAddress') as string).trim();
    const fps = parseInt(formData.get('fps') as string, 10) || 25;
    const status = formData.get('status') as string;

    setCameraList((prev) =>
      prev.map((c) => (c.id === editingCamera.id ? { ...c, subtitle, location, ipAddress, fps, status } : c))
    );
    setEditingCamera(null);
    addActivity('Camera Configuration Updated', `${editingCamera.id} stream parameters modified`, 'tune', 'bg-amber-50 text-amber-600');
    triggerToast('Camera Updated', `${editingCamera.id} configuration saved.`, 'success');
  };

  const handleDeleteCameraConfirm = () => {
    if (!deletingCamera) return;
    setCameraList((prev) => prev.filter((c) => c.id !== deletingCamera.id));
    addActivity('Camera Removed', `${deletingCamera.id} removed from active CCTV network`, 'delete', 'bg-red-50 text-[#ef4444]');
    triggerToast('Camera Removed', `${deletingCamera.id} was disconnected.`, 'danger');
    setDeletingCamera(null);
  };

  // --- Operator CRUD ---
  const handleAddOperatorSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = (formData.get('name') as string).trim();
    const username = (formData.get('username') as string).trim();
    const role = formData.get('role') as string;
    const accessLevel = formData.get('accessLevel') as Operator['accessLevel'];

    const parts = name.split(' ');
    const initials = parts.length > 1 ? (parts[0][0] + parts[1][0]).toUpperCase() : name.slice(0, 2).toUpperCase();

    const colors = ['bg-[#0052ff]', 'bg-[#7e22ce]', 'bg-[#0d9488]', 'bg-[#4338ca]'];
    const randomColor = colors[operatorList.length % colors.length];

    const newOp: Operator = {
      id: `OP-${operatorList.length + 1}`,
      initials,
      color: randomColor,
      name,
      username,
      role,
      accessLevel,
      lastActive: 'Just now',
      status: 'Active'
    };

    setOperatorList((prev) => [...prev, newOp]);
    setIsAddOperatorOpen(false);
    addActivity('Operator Account Created', `Administrator added operator: ${name}`, 'person_add', 'bg-blue-50 text-[#0052ff]');
    triggerToast('Operator Added', `Operator ${name} registered successfully.`, 'success');
  };

  const handleEditOperatorSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingOperator) return;
    const formData = new FormData(e.currentTarget);
    const name = (formData.get('name') as string).trim();
    const username = (formData.get('username') as string).trim();
    const role = formData.get('role') as string;
    const accessLevel = formData.get('accessLevel') as Operator['accessLevel'];
    const status = formData.get('status') as Operator['status'];

    setOperatorList((prev) =>
      prev.map((o) => (o.id === editingOperator.id ? { ...o, name, username, role, accessLevel, status } : o))
    );
    setEditingOperator(null);
    addActivity('Operator Privileges Updated', `Permissions updated for ${name}`, 'badge', 'bg-blue-50 text-[#0052ff]');
    triggerToast('Operator Updated', `Profile saved for ${name}.`, 'success');
  };

  const handleDeleteOperatorConfirm = () => {
    if (!deletingOperator) return;
    setOperatorList((prev) => prev.filter((o) => o.id !== deletingOperator.id));
    addActivity('Operator Access Revoked', `Access revoked for ${deletingOperator.name}`, 'person_remove', 'bg-red-50 text-[#ef4444]');
    triggerToast('Operator Removed', `Operator account deleted.`, 'danger');
    setDeletingOperator(null);
  };

  const activeModulesCount = Object.values(aiModules).filter(Boolean).length;
  const activeCamerasCount = cameraList.filter((c) => c.status === 'Online').length;

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification Container */}
      {toast && (
        <div className="fixed top-20 right-6 z-50 pointer-events-none animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="pointer-events-auto bg-[#0f172a] text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 text-[13px] border border-slate-700 min-w-[300px]">
            <span
              className={`material-symbols-outlined text-[20px] ${
                toast.type === 'success'
                  ? 'text-emerald-400'
                  : toast.type === 'danger'
                  ? 'text-red-400'
                  : toast.type === 'warning'
                  ? 'text-amber-400'
                  : 'text-blue-400'
              }`}
            >
              {toast.type === 'success'
                ? 'check_circle'
                : toast.type === 'danger'
                ? 'error'
                : toast.type === 'warning'
                ? 'warning'
                : 'info'}
            </span>
            <div className="flex flex-col flex-1 min-w-0">
              <span className="font-bold text-white text-[13px]">{toast.title}</span>
              <span className="text-slate-400 text-[11px] truncate">{toast.desc}</span>
            </div>
            <button
              onClick={() => setToast(null)}
              className="text-slate-400 hover:text-white material-symbols-outlined text-[18px]"
            >
              close
            </button>
          </div>
        </div>
      )}

      {/* Header & Status Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-[#0f172a] tracking-tight">
              Admin &amp; System Operations Console
            </h1>
            <span className="px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200/60 text-[#0052ff] text-[11px] font-bold">
              Root Authority
            </span>
          </div>
          <p className="text-sm text-[#64748b] mt-0.5">
            Surveillance Infrastructure, AI Analytics Configuration, Stream Nodes &amp; Operator Directory
          </p>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="/admin.html"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-1.5 bg-white border border-slate-200/80 hover:bg-slate-50 text-slate-700 rounded-xl text-[12px] font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <span>Open Standalone HTML</span>
            <span className="material-symbols-outlined text-[15px]">open_in_new</span>
          </a>
        </div>
      </div>

      {/* 1. Statistics Cards (4 Cards Grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Cameras */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:shadow-sm transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[13px] font-medium text-[#64748b]">Active Cameras</span>
              <div className="text-2xl font-bold text-[#0f172a] mt-1 tracking-tight">
                {activeCamerasCount < 10 ? `0${activeCamerasCount}` : activeCamerasCount} / {cameraList.length < 10 ? `0${cameraList.length}` : cameraList.length}
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0052ff] flex items-center justify-center">
              <span className="material-symbols-outlined text-[22px]">videocam</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-[12px] text-[#64748b] mt-3">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]"></span>
            <span>All connected</span>
          </div>
        </div>

        {/* Operators */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:shadow-sm transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[13px] font-medium text-[#64748b]">Operators</span>
              <div className="text-2xl font-bold text-[#0f172a] mt-1 tracking-tight">
                {operatorList.length < 10 ? `0${operatorList.length}` : operatorList.length}
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-[22px]">group</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-[12px] text-[#64748b] mt-3">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]"></span>
            <span>4 currently active</span>
          </div>
        </div>

        {/* AI Modules */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:shadow-sm transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[13px] font-medium text-[#64748b]">AI Modules</span>
              <div className="text-2xl font-bold text-[#0f172a] mt-1 tracking-tight">
                {activeModulesCount < 10 ? `0${activeModulesCount}` : activeModulesCount}
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-[22px]">psychology</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-[12px] text-[#64748b] mt-3">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]"></span>
            <span>All operational</span>
          </div>
        </div>

        {/* Storage Used */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:shadow-sm transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[13px] font-medium text-[#64748b]">Storage Used</span>
              <div className="text-2xl font-bold text-[#0f172a] mt-1 tracking-tight">64%</div>
              <div className="text-[11px] text-[#64748b] mt-0.5">128 GB / 200 GB</div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-[22px]">database</span>
            </div>
          </div>
          <div className="w-full h-1.5 bg-slate-100 rounded-full mt-3 overflow-hidden">
            <div className="h-full bg-[#0052ff] rounded-full" style={{ width: '64%' }}></div>
          </div>
        </div>
      </div>

      {/* 2. Middle Row: 3 Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Panel 1: System Services */}
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden flex flex-col">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-[15px] font-bold text-[#0f172a]">System Services</h2>
              <p className="text-[11px] text-[#64748b]">Current status of IBVAP components</p>
            </div>
            <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 text-[11px] font-semibold px-2.5 py-1 rounded-full border border-emerald-200/60">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]"></span>
              Operational
            </span>
          </div>

          <div className="p-4 sm:p-5 flex flex-col divide-y divide-slate-100">
            {/* AI Analytics Engine */}
            <div className="py-2.5 flex items-center justify-between first:pt-0 last:pb-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[19px]">psychology</span>
                </div>
                <div>
                  <div className="text-[13px] font-bold text-[#0f172a]">AI Analytics Engine</div>
                  <div className="text-[11px] text-[#64748b]">Object detection &amp; tracking</div>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-[12px] font-semibold text-[#0f172a]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]"></span>
                <span>Online</span>
              </div>
            </div>

            {/* CCTV Network */}
            <div className="py-2.5 flex items-center justify-between first:pt-0 last:pb-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#0052ff] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[19px]">videocam</span>
                </div>
                <div>
                  <div className="text-[13px] font-bold text-[#0f172a]">CCTV Network</div>
                  <div className="text-[11px] text-[#64748b]">IP camera connectivity</div>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-[12px] font-semibold text-[#0f172a]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]"></span>
                <span>Online</span>
              </div>
            </div>

            {/* Backend API */}
            <div className="py-2.5 flex items-center justify-between first:pt-0 last:pb-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[19px]">cloud</span>
                </div>
                <div>
                  <div className="text-[13px] font-bold text-[#0f172a]">Backend API</div>
                  <div className="text-[11px] text-[#64748b]">FastAPI service</div>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-[12px] font-semibold text-[#0f172a]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]"></span>
                <span>Online</span>
              </div>
            </div>

            {/* Event Database */}
            <div className="py-2.5 flex items-center justify-between first:pt-0 last:pb-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[19px]">dns</span>
                </div>
                <div>
                  <div className="text-[13px] font-bold text-[#0f172a]">Event Database</div>
                  <div className="text-[11px] text-[#64748b]">Event &amp; evidence storage</div>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-[12px] font-semibold text-[#0f172a]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]"></span>
                <span>Online</span>
              </div>
            </div>
          </div>
        </div>

        {/* Panel 2: AI Analytics Configuration */}
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden flex flex-col" id="aiConfigCard">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-[15px] font-bold text-[#0f172a]">AI Analytics Configuration</h2>
              <p className="text-[11px] text-[#64748b]">Enable or disable analytics modules</p>
            </div>
            <span className="material-symbols-outlined text-slate-400 text-[20px]">tune</span>
          </div>

          <div className="p-4 sm:p-5 flex flex-col divide-y divide-slate-100">
            {/* Person Detection */}
            <div className="py-2 flex items-center justify-between first:pt-0 last:pb-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-50 text-[#0052ff] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[17px]">person</span>
                </div>
                <div>
                  <div className="text-[13px] font-bold text-[#0f172a]">Person Detection</div>
                  <div className="text-[11px] text-[#64748b]">Detect people in CCTV feeds</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleToggleAi('personDetection', 'Person Detection')}
                className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                  aiModules.personDetection ? 'bg-[#0052ff]' : 'bg-slate-200'
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-xs transform transition-transform ${
                    aiModules.personDetection ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Vehicle Detection */}
            <div className="py-2 flex items-center justify-between first:pt-0 last:pb-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-800 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[17px]">directions_car</span>
                </div>
                <div>
                  <div className="text-[13px] font-bold text-[#0f172a]">Vehicle Detection</div>
                  <div className="text-[11px] text-[#64748b]">Detect and classify vehicles</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleToggleAi('vehicleDetection', 'Vehicle Detection')}
                className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                  aiModules.vehicleDetection ? 'bg-[#0052ff]' : 'bg-slate-200'
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-xs transform transition-transform ${
                    aiModules.vehicleDetection ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Virtual Fence */}
            <div className="py-2 flex items-center justify-between first:pt-0 last:pb-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[17px]">crop_free</span>
                </div>
                <div>
                  <div className="text-[13px] font-bold text-[#0f172a]">Virtual Fence</div>
                  <div className="text-[11px] text-[#64748b]">Detect zero-line intrusion</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleToggleAi('virtualFence', 'Virtual Fence')}
                className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                  aiModules.virtualFence ? 'bg-[#0052ff]' : 'bg-slate-200'
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-xs transform transition-transform ${
                    aiModules.virtualFence ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Night Movement */}
            <div className="py-2 flex items-center justify-between first:pt-0 last:pb-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[17px]">bedtime</span>
                </div>
                <div>
                  <div className="text-[13px] font-bold text-[#0f172a]">Night Movement</div>
                  <div className="text-[11px] text-[#64748b]">Detect movement after curfew</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleToggleAi('nightMovement', 'Night Movement')}
                className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                  aiModules.nightMovement ? 'bg-[#0052ff]' : 'bg-slate-200'
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-xs transform transition-transform ${
                    aiModules.nightMovement ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* ANPR */}
            <div className="py-2 flex items-center justify-between first:pt-0 last:pb-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[17px]">badge</span>
                </div>
                <div>
                  <div className="text-[13px] font-bold text-[#0f172a]">ANPR</div>
                  <div className="text-[11px] text-[#64748b]">Plate recognition &amp; OCR</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleToggleAi('anpr', 'ANPR')}
                className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                  aiModules.anpr ? 'bg-[#0052ff]' : 'bg-slate-200'
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-xs transform transition-transform ${
                    aiModules.anpr ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Panel 3: Recent Admin Activity */}
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden flex flex-col">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-[15px] font-bold text-[#0f172a]">Recent Admin Activity</h2>
            <button
              onClick={() => setIsAuditLogOpen(true)}
              className="text-[12px] font-semibold text-[#0052ff] hover:underline flex items-center gap-1"
            >
              <span>View Full Log</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
          </div>

          <div className="p-4 sm:p-5 flex flex-col divide-y divide-slate-100">
            {activities.map((act) => (
              <div key={act.id} className="py-2.5 flex items-center justify-between first:pt-0 last:pb-0">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-full ${act.color} flex items-center justify-center shrink-0`}>
                    <span className="material-symbols-outlined text-[18px]">{act.icon}</span>
                  </div>
                  <div>
                    <div className="text-[13px] font-bold text-[#0f172a]">{act.title}</div>
                    <div className="text-[11px] text-[#64748b]">{act.desc}</div>
                  </div>
                </div>
                <span className="text-[11px] text-slate-400 whitespace-nowrap ml-2">{act.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Bottom Row: 2 Management Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Left Table: Camera Management */}
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden flex flex-col" id="cameraManagementCard">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-[15px] font-bold text-[#0f172a]">Camera Management</h2>
              <p className="text-[11px] text-[#64748b]">Manage connected CCTV streams</p>
            </div>
            <button
              onClick={() => setIsAddCameraOpen(true)}
              className="bg-[#0052ff] hover:bg-blue-600 text-white px-3.5 py-1.5 rounded-xl text-[12px] font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              <span>Add Camera</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-[12px]">
              <thead className="bg-slate-50/80 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="p-3 pl-4 sm:pl-5 w-8">#</th>
                  <th className="p-3">Camera</th>
                  <th className="p-3">Location</th>
                  <th className="p-3 font-mono">IP Address</th>
                  <th className="p-3">FPS</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 pr-4 sm:pr-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {cameraList.map((cam, idx) => (
                  <tr key={cam.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 pl-4 sm:pl-5 text-slate-400 font-semibold">{idx + 1}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#0052ff] flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-[18px]">videocam</span>
                        </div>
                        <div>
                          <div className="font-bold text-[#0f172a]">{cam.name}</div>
                          <div className="text-[11px] text-[#64748b]">{cam.subtitle}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 text-slate-600">{cam.location}</td>
                    <td className="p-3 font-mono text-[11px] text-slate-700">{cam.ipAddress}</td>
                    <td className="p-3 font-mono font-semibold text-[#0f172a]">{cam.fps}</td>
                    <td className="p-3">
                      <div className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#0f172a]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]"></span>
                        <span>{cam.status}</span>
                      </div>
                    </td>
                    <td className="p-3 pr-4 sm:pr-5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setEditingCamera(cam)}
                          className="w-7 h-7 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-[#0052ff] flex items-center justify-center transition-colors"
                          title="Edit Camera"
                        >
                          <span className="material-symbols-outlined text-[16px]">edit</span>
                        </button>
                        <button
                          onClick={() => setDeletingCamera(cam)}
                          className="w-7 h-7 rounded-lg hover:bg-red-50 text-slate-500 hover:text-[#ef4444] flex items-center justify-center transition-colors"
                          title="Delete Camera"
                        >
                          <span className="material-symbols-outlined text-[16px]">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Table: Operator Management */}
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden flex flex-col" id="operatorManagementCard">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-[15px] font-bold text-[#0f172a]">Operator Management</h2>
              <p className="text-[11px] text-[#64748b]">Manage authorized IBVAP users</p>
            </div>
            <button
              onClick={() => setIsAddOperatorOpen(true)}
              className="bg-[#0052ff] hover:bg-blue-600 text-white px-3.5 py-1.5 rounded-xl text-[12px] font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              <span>Add Operator</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-[12px]">
              <thead className="bg-slate-50/80 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="p-3 pl-4 sm:pl-5 w-8">#</th>
                  <th className="p-3">Operator</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Access Level</th>
                  <th className="p-3">Last Active</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 pr-4 sm:pr-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {operatorList.map((op, idx) => (
                  <tr key={op.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 pl-4 sm:pl-5 text-slate-400 font-semibold">{idx + 1}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-full ${op.color} text-white font-bold text-[12px] flex items-center justify-center shrink-0`}>
                          {op.initials}
                        </div>
                        <div>
                          <div className="font-bold text-[#0f172a]">{op.name}</div>
                          <div className="text-[11px] text-[#64748b]">{op.username}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 text-slate-600">{op.role}</td>
                    <td className="p-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                          op.accessLevel === 'Full Access'
                            ? 'bg-blue-50 text-[#0052ff] border border-blue-200/60'
                            : op.accessLevel === 'Incident Mgmt'
                            ? 'bg-red-50 text-[#ef4444] border border-red-200/60'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {op.accessLevel}
                      </span>
                    </td>
                    <td className="p-3 text-[11px] text-slate-500">{op.lastActive}</td>
                    <td className="p-3">
                      <div className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#0f172a]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]"></span>
                        <span>{op.status}</span>
                      </div>
                    </td>
                    <td className="p-3 pr-4 sm:pr-5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setEditingOperator(op)}
                          className="w-7 h-7 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-[#0052ff] flex items-center justify-center transition-colors"
                          title="Edit Operator"
                        >
                          <span className="material-symbols-outlined text-[16px]">edit</span>
                        </button>
                        <button
                          onClick={() => setDeletingOperator(op)}
                          className="w-7 h-7 rounded-lg hover:bg-red-50 text-slate-500 hover:text-[#ef4444] flex items-center justify-center transition-colors"
                          title="Delete Operator"
                        >
                          <span className="material-symbols-outlined text-[16px]">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 4. Quick Actions Row */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-[14px] font-bold text-[#0f172a]">
          <span className="material-symbols-outlined text-[#0052ff] text-[20px]">tune</span>
          <span>Quick System Actions</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
          {/* Manage Cameras */}
          <button
            onClick={() => {
              const el = document.getElementById('cameraManagementCard');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="bg-white border border-slate-200/80 rounded-2xl p-4 flex items-center gap-3 hover:border-slate-300 hover:shadow-xs transition-all text-left"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0052ff] flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[20px]">videocam</span>
            </div>
            <span className="text-[13px] font-bold text-[#0f172a]">Manage Cameras</span>
          </button>

          {/* Manage Operators */}
          <button
            onClick={() => {
              const el = document.getElementById('operatorManagementCard');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="bg-white border border-slate-200/80 rounded-2xl p-4 flex items-center gap-3 hover:border-slate-300 hover:shadow-xs transition-all text-left"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[20px]">person</span>
            </div>
            <span className="text-[13px] font-bold text-[#0f172a]">Manage Operators</span>
          </button>

          {/* AI Configuration */}
          <button
            onClick={() => {
              const el = document.getElementById('aiConfigCard');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="bg-white border border-slate-200/80 rounded-2xl p-4 flex items-center gap-3 hover:border-slate-300 hover:shadow-xs transition-all text-left"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[20px]">psychology</span>
            </div>
            <span className="text-[13px] font-bold text-[#0f172a]">AI Configuration</span>
          </button>

          {/* View Audit Log */}
          <button
            onClick={() => setIsAuditLogOpen(true)}
            className="bg-white border border-slate-200/80 rounded-2xl p-4 flex items-center gap-3 hover:border-slate-300 hover:shadow-xs transition-all text-left"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0052ff] flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[20px]">description</span>
            </div>
            <span className="text-[13px] font-bold text-[#0f172a]">View Audit Log</span>
          </button>

          {/* System Settings */}
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="bg-white border border-slate-200/80 rounded-2xl p-4 flex items-center gap-3 hover:border-slate-300 hover:shadow-xs transition-all text-left"
          >
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[20px]">settings</span>
            </div>
            <span className="text-[13px] font-bold text-[#0f172a]">System Settings</span>
          </button>
        </div>
      </div>

      {/* --- MODALS --- */}

      {/* 1. Add Camera Modal */}
      {isAddCameraOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="px-5 py-4 bg-[#0f172c] text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#0052ff] flex items-center justify-center text-white">
                  <span className="material-symbols-outlined text-[20px]">videocam</span>
                </div>
                <h3 className="text-[15px] font-bold text-white">Add CCTV Camera Node</h3>
              </div>
              <button onClick={() => setIsAddCameraOpen(false)} className="text-slate-400 hover:text-white">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <form onSubmit={handleAddCameraSubmit} className="p-5 flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-semibold text-slate-700">Camera ID *</label>
                  <input
                    type="text"
                    name="id"
                    placeholder="e.g. CAM-05"
                    required
                    className="border border-slate-200 bg-slate-50/80 rounded-xl px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#0052ff]/20 focus:border-[#0052ff]"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-semibold text-slate-700">FPS Target</label>
                  <input
                    type="number"
                    name="fps"
                    defaultValue={25}
                    min={10}
                    max={60}
                    required
                    className="border border-slate-200 bg-slate-50/80 rounded-xl px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#0052ff]/20 focus:border-[#0052ff]"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-semibold text-slate-700">Description / Sector *</label>
                <input
                  type="text"
                  name="subtitle"
                  placeholder="e.g. South Watchtower Mast"
                  required
                  className="border border-slate-200 bg-slate-50/80 rounded-xl px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#0052ff]/20 focus:border-[#0052ff]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-semibold text-slate-700">Sector Location</label>
                  <input
                    type="text"
                    name="location"
                    defaultValue="BOP Alpha"
                    required
                    className="border border-slate-200 bg-slate-50/80 rounded-xl px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#0052ff]/20 focus:border-[#0052ff]"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-semibold text-slate-700">IP Address *</label>
                  <input
                    type="text"
                    name="ipAddress"
                    placeholder="192.168.14.25"
                    required
                    className="border border-slate-200 bg-slate-50/80 rounded-xl px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#0052ff]/20 focus:border-[#0052ff]"
                  />
                </div>
              </div>
              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddCameraOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-[12px] font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#0052ff] hover:bg-blue-600 text-white rounded-xl text-[12px] font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
                >
                  <span className="material-symbols-outlined text-[17px]">add_circle</span>
                  <span>Register Camera</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Edit Camera Modal */}
      {editingCamera && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="px-5 py-4 bg-[#0f172c] text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#0052ff] flex items-center justify-center text-white">
                  <span className="material-symbols-outlined text-[20px]">edit</span>
                </div>
                <h3 className="text-[15px] font-bold text-white">Edit Camera Configuration</h3>
              </div>
              <button onClick={() => setEditingCamera(null)} className="text-slate-400 hover:text-white">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <form onSubmit={handleEditCameraSubmit} className="p-5 flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-semibold text-slate-700">Camera ID</label>
                  <input
                    type="text"
                    defaultValue={editingCamera.id}
                    readOnly
                    className="border border-slate-200 bg-slate-100 rounded-xl px-3 py-2 text-[13px] text-slate-500"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-semibold text-slate-700">FPS Target</label>
                  <input
                    type="number"
                    name="fps"
                    defaultValue={editingCamera.fps}
                    min={10}
                    max={60}
                    required
                    className="border border-slate-200 bg-slate-50/80 rounded-xl px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#0052ff]/20 focus:border-[#0052ff]"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-semibold text-slate-700">Description</label>
                <input
                  type="text"
                  name="subtitle"
                  defaultValue={editingCamera.subtitle}
                  required
                  className="border border-slate-200 bg-slate-50/80 rounded-xl px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#0052ff]/20 focus:border-[#0052ff]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-semibold text-slate-700">Location</label>
                  <input
                    type="text"
                    name="location"
                    defaultValue={editingCamera.location}
                    required
                    className="border border-slate-200 bg-slate-50/80 rounded-xl px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#0052ff]/20 focus:border-[#0052ff]"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-semibold text-slate-700">IP Address</label>
                  <input
                    type="text"
                    name="ipAddress"
                    defaultValue={editingCamera.ipAddress}
                    required
                    className="border border-slate-200 bg-slate-50/80 rounded-xl px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#0052ff]/20 focus:border-[#0052ff]"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-semibold text-slate-700">Status</label>
                <select
                  name="status"
                  defaultValue={editingCamera.status}
                  className="border border-slate-200 bg-slate-50/80 rounded-xl px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#0052ff]/20 focus:border-[#0052ff]"
                >
                  <option value="Online">Online</option>
                  <option value="Standby">Standby</option>
                  <option value="Offline">Offline</option>
                </select>
              </div>
              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingCamera(null)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-[12px] font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#0052ff] hover:bg-blue-600 text-white rounded-xl text-[12px] font-semibold shadow-xs transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Delete Camera Confirmation Modal */}
      {deletingCamera && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full border border-slate-200 shadow-2xl p-5 animate-in zoom-in-95 duration-150">
            <h3 className="text-[16px] font-bold text-red-600 mb-2">Remove Camera Node</h3>
            <p className="text-[13px] text-slate-600 mb-4">
              Are you sure you want to remove <strong className="text-[#0f172a]">{deletingCamera.name} ({deletingCamera.subtitle})</strong> from the active surveillance network?
            </p>
            <div className="flex items-center justify-end gap-2.5">
              <button
                onClick={() => setDeletingCamera(null)}
                className="px-3.5 py-2 border border-slate-200 rounded-xl text-[12px] font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteCameraConfirm}
                className="px-3.5 py-2 bg-[#ef4444] hover:bg-red-600 text-white rounded-xl text-[12px] font-semibold shadow-xs transition-colors"
              >
                Disconnect &amp; Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Add Operator Modal */}
      {isAddOperatorOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="px-5 py-4 bg-[#0f172c] text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#0052ff] flex items-center justify-center text-white">
                  <span className="material-symbols-outlined text-[20px]">person_add</span>
                </div>
                <h3 className="text-[15px] font-bold text-white">Add Authorized IBVAP Operator</h3>
              </div>
              <button onClick={() => setIsAddOperatorOpen(false)} className="text-slate-400 hover:text-white">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <form onSubmit={handleAddOperatorSubmit} className="p-5 flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-semibold text-slate-700">Full Name *</label>
                  <input
                    type="text"
                    name="name"
                    placeholder="e.g. V. Sharma"
                    required
                    className="border border-slate-200 bg-slate-50/80 rounded-xl px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#0052ff]/20 focus:border-[#0052ff]"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-semibold text-slate-700">Username / ID *</label>
                  <input
                    type="text"
                    name="username"
                    placeholder="e.g. v.sharma"
                    required
                    className="border border-slate-200 bg-slate-50/80 rounded-xl px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#0052ff]/20 focus:border-[#0052ff]"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-semibold text-slate-700">Operational Role</label>
                  <select
                    name="role"
                    defaultValue="Operator"
                    className="border border-slate-200 bg-slate-50/80 rounded-xl px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#0052ff]/20 focus:border-[#0052ff]"
                  >
                    <option value="Operator">Operator</option>
                    <option value="Supervisor">Supervisor</option>
                    <option value="Duty Officer">Duty Officer</option>
                    <option value="Analyst">Analyst</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-semibold text-slate-700">Access Level</label>
                  <select
                    name="accessLevel"
                    defaultValue="Surveillance"
                    className="border border-slate-200 bg-slate-50/80 rounded-xl px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#0052ff]/20 focus:border-[#0052ff]"
                  >
                    <option value="Surveillance">Surveillance</option>
                    <option value="Full Access">Full Access</option>
                    <option value="Incident Mgmt">Incident Mgmt</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddOperatorOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-[12px] font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#0052ff] hover:bg-blue-600 text-white rounded-xl text-[12px] font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
                >
                  <span className="material-symbols-outlined text-[17px]">person_add</span>
                  <span>Create Operator</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Edit Operator Modal */}
      {editingOperator && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="px-5 py-4 bg-[#0f172c] text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#0052ff] flex items-center justify-center text-white">
                  <span className="material-symbols-outlined text-[20px]">badge</span>
                </div>
                <h3 className="text-[15px] font-bold text-white">Edit Operator Privileges</h3>
              </div>
              <button onClick={() => setEditingOperator(null)} className="text-slate-400 hover:text-white">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <form onSubmit={handleEditOperatorSubmit} className="p-5 flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-semibold text-slate-700">Full Name</label>
                  <input
                    type="text"
                    name="name"
                    defaultValue={editingOperator.name}
                    required
                    className="border border-slate-200 bg-slate-50/80 rounded-xl px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#0052ff]/20 focus:border-[#0052ff]"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-semibold text-slate-700">Username</label>
                  <input
                    type="text"
                    name="username"
                    defaultValue={editingOperator.username}
                    required
                    className="border border-slate-200 bg-slate-50/80 rounded-xl px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#0052ff]/20 focus:border-[#0052ff]"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-semibold text-slate-700">Role</label>
                  <select
                    name="role"
                    defaultValue={editingOperator.role}
                    className="border border-slate-200 bg-slate-50/80 rounded-xl px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#0052ff]/20 focus:border-[#0052ff]"
                  >
                    <option value="Operator">Operator</option>
                    <option value="Supervisor">Supervisor</option>
                    <option value="Duty Officer">Duty Officer</option>
                    <option value="Analyst">Analyst</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-semibold text-slate-700">Access Level</label>
                  <select
                    name="accessLevel"
                    defaultValue={editingOperator.accessLevel}
                    className="border border-slate-200 bg-slate-50/80 rounded-xl px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#0052ff]/20 focus:border-[#0052ff]"
                  >
                    <option value="Surveillance">Surveillance</option>
                    <option value="Full Access">Full Access</option>
                    <option value="Incident Mgmt">Incident Mgmt</option>
                  </select>
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-semibold text-slate-700">Status</label>
                <select
                  name="status"
                  defaultValue={editingOperator.status}
                  className="border border-slate-200 bg-slate-50/80 rounded-xl px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#0052ff]/20 focus:border-[#0052ff]"
                >
                  <option value="Active">Active</option>
                  <option value="Suspended">Suspended</option>
                  <option value="Off-Duty">Off-Duty</option>
                </select>
              </div>
              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingOperator(null)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-[12px] font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#0052ff] hover:bg-blue-600 text-white rounded-xl text-[12px] font-semibold shadow-xs transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Delete Operator Confirmation Modal */}
      {deletingOperator && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full border border-slate-200 shadow-2xl p-5 animate-in zoom-in-95 duration-150">
            <h3 className="text-[16px] font-bold text-red-600 mb-2">Revoke Operator Access</h3>
            <p className="text-[13px] text-slate-600 mb-4">
              Are you sure you want to revoke access for <strong className="text-[#0f172a]">{deletingOperator.name} ({deletingOperator.username})</strong>?
            </p>
            <div className="flex items-center justify-end gap-2.5">
              <button
                onClick={() => setDeletingOperator(null)}
                className="px-3.5 py-2 border border-slate-200 rounded-xl text-[12px] font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteOperatorConfirm}
                className="px-3.5 py-2 bg-[#ef4444] hover:bg-red-600 text-white rounded-xl text-[12px] font-semibold shadow-xs transition-colors"
              >
                Revoke Access
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Full Audit Log Modal */}
      {isAuditLogOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="px-5 py-4 bg-[#0f172c] text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#0052ff] flex items-center justify-center text-white">
                  <span className="material-symbols-outlined text-[20px]">description</span>
                </div>
                <h3 className="text-[15px] font-bold text-white">System Audit Log &amp; Chain of Custody</h3>
              </div>
              <button onClick={() => setIsAuditLogOpen(false)} className="text-slate-400 hover:text-white">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <div className="p-5 flex flex-col gap-3 max-h-[70vh] overflow-y-auto">
              <div className="flex justify-between items-center text-[12px] text-[#64748b]">
                <span>Showing recorded operational audit events</span>
                <span className="font-mono text-[11px] bg-blue-50 text-[#0052ff] px-2.5 py-0.5 rounded-lg font-semibold border border-blue-200/60">
                  SEC-65B VERIFIED
                </span>
              </div>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-[12px] border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-200 font-bold uppercase text-[11px] text-slate-500">
                    <tr>
                      <th className="p-3">Time</th>
                      <th className="p-3">Actor</th>
                      <th className="p-3">Action</th>
                      <th className="p-3">Entity</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="p-3 font-mono text-slate-500">13:42:18 IST</td>
                      <td className="p-3 font-semibold text-[#0f172a]">Insp. Verma</td>
                      <td className="p-3 text-[#0052ff] font-medium">QRT Intercept Dispatched</td>
                      <td className="p-3 text-slate-700">INC-2026-084 (Cheetah-1)</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-mono text-slate-500">13:30:10 IST</td>
                      <td className="p-3 font-semibold text-[#0f172a]">Admin</td>
                      <td className="p-3 text-slate-700">Operator Added</td>
                      <td className="p-3 text-slate-700">OP-4 (s.patel)</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-mono text-slate-500">13:16:45 IST</td>
                      <td className="p-3 font-semibold text-[#0f172a]">Admin</td>
                      <td className="p-3 text-slate-700">Stream Modified</td>
                      <td className="p-3 text-slate-700">CAM-02 (24 FPS)</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-mono text-slate-500">12:59:02 IST</td>
                      <td className="p-3 font-semibold text-[#0f172a]">Admin</td>
                      <td className="p-3 text-slate-700">Virtual Fence Calibrated</td>
                      <td className="p-3 text-slate-700">BOP Entry Restricted Zone</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-mono text-slate-500">12:40:00 IST</td>
                      <td className="p-3 font-semibold text-[#0f172a]">Admin</td>
                      <td className="p-3 text-slate-700">Console Login</td>
                      <td className="p-3 text-slate-700">Node IND-NPL-04</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setIsAuditLogOpen(false)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-[12px] font-semibold text-slate-700 hover:bg-white transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. System Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="px-5 py-4 bg-[#0f172c] text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#0052ff] flex items-center justify-center text-white">
                  <span className="material-symbols-outlined text-[20px]">settings</span>
                </div>
                <h3 className="text-[15px] font-bold text-white">Surveillance Node Settings</h3>
              </div>
              <button onClick={() => setIsSettingsOpen(false)} className="text-slate-400 hover:text-white">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setIsSettingsOpen(false);
                addActivity('System Parameters Saved', 'Storage retention and RTSP settings updated', 'settings', 'bg-blue-50 text-[#0052ff]');
                triggerToast('Settings Saved', 'Node parameters updated and synchronized.', 'success');
              }}
              className="p-5 flex flex-col gap-4"
            >
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-semibold text-slate-700">Sector Identifier</label>
                <input
                  type="text"
                  defaultValue="Sector : BOP Alpha"
                  readOnly
                  className="border border-slate-200 bg-slate-100 rounded-xl px-3 py-2 text-[13px] text-slate-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-semibold text-slate-700">Retention (Days)</label>
                  <input
                    type="number"
                    defaultValue={90}
                    min={30}
                    max={365}
                    className="border border-slate-200 bg-slate-50/80 rounded-xl px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#0052ff]/20 focus:border-[#0052ff]"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-semibold text-slate-700">YOLO Batch Size</label>
                  <input
                    type="number"
                    defaultValue={4}
                    min={1}
                    max={16}
                    className="border border-slate-200 bg-slate-50/80 rounded-xl px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#0052ff]/20 focus:border-[#0052ff]"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-semibold text-slate-700">FastAPI Ingest Endpoint</label>
                <input
                  type="text"
                  defaultValue="http://192.168.14.10:8000/api/v2"
                  className="border border-slate-200 bg-slate-50/80 rounded-xl px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#0052ff]/20 focus:border-[#0052ff]"
                />
              </div>
              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsSettingsOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-[12px] font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#0052ff] hover:bg-blue-600 text-white rounded-xl text-[12px] font-semibold shadow-xs transition-colors"
                >
                  Save Settings
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
