import React, { useState } from 'react';
import { NavigationPage, IncidentRecord, CameraData, DetectionItem } from './types';
import { CAMERAS, INCIDENTS, ANPR_SCANS, FACE_SUBJECTS, EVIDENCE_RECORDS } from './data/mockData';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { DispatchModal } from './components/DispatchModal';
import { DashboardView } from './views/DashboardView';
import { LiveCamerasView } from './views/LiveCamerasView';
import { CameraDetailView } from './views/CameraDetailView';
import { IncidentsView } from './views/IncidentsView';
import { AnprView } from './views/AnprView';
import { FaceAnalyticsView } from './views/FaceAnalyticsView';
import { EvidenceView } from './views/EvidenceView';
import { AdminConsoleView } from './views/AdminConsoleView';

const API_BASE = (import.meta as any).env.VITE_API_URL || "http://127.0.0.1:8000";

export default function App() {
  const [currentPage, setCurrentPage] = useState<NavigationPage>('dashboard');
  const [selectedCameraId, setSelectedCameraId] = useState<string>('CAM-01');
  const [selectedIncidentId, setSelectedIncidentId] = useState<string>('INC-2026-084');
  const [selectedEvidenceId, setSelectedEvidenceId] = useState<string>('EV-2026-084-A');

  // Operational State
  const [cameras, setCameras] = useState<CameraData[]>(CAMERAS);
  const [incidents, setIncidents] = useState<IncidentRecord[]>(INCIDENTS);
  const [anprScans, setAnprScans] = useState(ANPR_SCANS);
  const [faceSubjects, setFaceSubjects] = useState(FACE_SUBJECTS);
  const [evidence, setEvidence] = useState(EVIDENCE_RECORDS);
  const [liveDetections, setLiveDetections] = useState<DetectionItem[]>([]);
  const [liveAlerts, setLiveAlerts] = useState<any[]>([]);

  React.useEffect(() => {
    const fetchLivePipeline = async () => {
      try {
        const [liveRes, eventsRes] = await Promise.all([
          fetch(`${API_BASE}/api/video/live`),
          fetch(`${API_BASE}/api/events`),
        ]);
        if (liveRes.ok) {
          const live = await liveRes.json();
          const detections: DetectionItem[] = live.detections.map((d: any, index: number) => ({
            id: `live-${index}`,
            className: d.class_name,
            confidence: d.confidence,
            type: d.class_name.toLowerCase() === 'person' ? 'person' : 'vehicle',
          }));
          setLiveDetections(detections);
          setCameras((current) => current.map((camera) =>
            camera.id === 'CAM-01'
              ? { ...camera, detections, status: detections.length ? 'alert' : 'online' }
              : camera
          ));
        }
        if (eventsRes.ok) setLiveAlerts(await eventsRes.json());
      } catch (error) {
        console.error('Live pipeline not reachable', error);
      }
    };

    fetchLivePipeline();
    const interval = setInterval(fetchLivePipeline, 2000);
    return () => clearInterval(interval);
  }, []);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const incRes = await fetch(`${API_BASE}/api/incidents`);
        const evRes = await fetch(`${API_BASE}/api/evidence`).catch(() => null);
        
        if (evRes && evRes.ok) {
          const evData = await evRes.json();
          if (evData.length > 0) {
            const mappedEv = evData.map((ev: any) => ({
              id: ev.evidence_id,
              type: 'snapshot',
              timestamp: ev.timestamp,
              cameraId: ev.camera_id || 'CAM-01',
              cameraName: `CAM: ${ev.camera_id || 'Unknown'}`,
              description: `Automated Evidence for Event`,
              fileUrl: `${API_BASE}/api/evidence/download/${ev.evidence_id}`,
              thumbnailUrl: `${API_BASE}/api/evidence/download/${ev.evidence_id}`
            }));
            setEvidence(mappedEv);
          }
        }

        if (incRes.ok) {
          const incData = await incRes.json();
          if (incData.length > 0) {
            // Map backend incidents to frontend IncidentRecord format
            const mappedIncidents = incData.map((inc: any) => ({
              id: inc.incident_id,
              timestamp: inc.timestamp_start,
              cameraId: inc.camera_ids[0] || 'CAM-01',
              cameraName: `CAM: ${inc.camera_ids[0] || 'Unknown'}`,
              sector: 'Sector IV',
              zone: 'Auto-Detected Zone',
              classification: 'AI Correlated Incident',
              description: inc.explanation || 'No description available',
              targetClass: 'MIXED',
              confidence: inc.correlation_score || 0.8,
              severity: inc.severity === 'P0_CRITICAL' || inc.severity === 'P1_HIGH' ? 'critical' : inc.severity === 'P2_MEDIUM' ? 'medium' : 'low',
              status: inc.lifecycle_status === 1 ? 'Open / Active' : inc.lifecycle_status === 2 ? 'Acknowledged' : 'Resolved',
              triggerFrameUrl: inc.metadata && inc.metadata.evidence_refs && inc.metadata.evidence_refs.length > 0 
                ? `${API_BASE}/api/evidence/download/${inc.metadata.evidence_refs[0]}` 
                : 'https://lh3.googleusercontent.com/aida-public/AB6AXuBZ75ko-hSH40qHJheNfXeIhheinGuuDBv-Ysrt7MKNVCdaIYDDwAgOxWBqtm8_ug8U3M-77EAnKijDgXwV8UOYbcPW7jVBCyvOEeonF2WpKFenUafCgivsOs9GtyOVdzzUYUkelETr6b5Eqx4xiu6Ok48ODfmKGDoZqKXzkQs_A14ETMdB1tZlfKARBQJAMzGePh2LcmpyLk5GPQPQKHpzf8wxXzH8kwE1FFmU6hv1HeogjUSmqCIp',
              coordinates: 'Live Geo',
              ingestStream: 'Live Stream',
              activePipeline: 'IBVAP Pipeline',
              qrtUnit: 'Standby',
              eta: 'N/A',
              operatorNotes: ''
            }));
            setIncidents(mappedIncidents);
          }
        }
      } catch (e) {
        console.error("Backend not reachable", e);
      }
    };
    
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  // Dispatch Modal State
  const [isDispatchOpen, setIsDispatchOpen] = useState(false);
  const [activeDispatchIncident, setActiveDispatchIncident] = useState<IncidentRecord | null>(null);
  const [toastNotification, setToastNotification] = useState<string | null>(null);

  // Sync hash routing on initial load
  React.useEffect(() => {
    const hash = window.location.hash.replace('#', '') as NavigationPage;
    if (hash && ['dashboard', 'live-cameras', 'incidents', 'anpr', 'face-analytics', 'evidence', 'admin-console'].includes(hash)) {
      setCurrentPage(hash);
    }
  }, []);

  // Flow: Select a Camera -> Navigates to full Camera Detail page
  const handleSelectCamera = (cameraId: string) => {
    setSelectedCameraId(cameraId);
    setCurrentPage('camera-detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Flow: Back button from Camera Detail
  const handleBackFromCameraDetail = () => {
    setCurrentPage('dashboard');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Flow: Navigate to incidents with specific incident pre-selected
  const handleNavigateIncidents = (incidentId?: string) => {
    if (incidentId) setSelectedIncidentId(incidentId);
    setCurrentPage('incidents');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Flow: Navigate to evidence with specific evidence pre-selected
  const handleNavigateEvidence = (evidenceId: string) => {
    setSelectedEvidenceId(evidenceId);
    setCurrentPage('evidence');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Open QRT dispatch modal
  const handleOpenDispatch = (incident: IncidentRecord) => {
    setActiveDispatchIncident(incident);
    setIsDispatchOpen(true);
  };

  // Confirm QRT dispatch
  const handleConfirmDispatch = (unit: string, remark: string) => {
    if (!activeDispatchIncident) return;
    setIncidents((prev) =>
      prev.map((inc) =>
        inc.id === activeDispatchIncident.id
          ? { ...inc, qrtUnit: unit, operatorNotes: remark, status: 'Acknowledged' }
          : inc
      )
    );
    setToastNotification(`QRT Dispatch Transmitted: ${unit} deployed to ${activeDispatchIncident.cameraName}`);
    setTimeout(() => setToastNotification(null), 5000);
  };

  // Update incident status
  const handleUpdateIncidentStatus = (incidentId: string, newStatus: IncidentRecord['status']) => {
    setIncidents((prev) =>
      prev.map((inc) => (inc.id === incidentId ? { ...inc, status: newStatus } : inc))
    );
    setToastNotification(`Incident ${incidentId} status updated to: ${newStatus}`);
    setTimeout(() => setToastNotification(null), 3000);
  };

  // Camera currently selected for detail
  const currentCamera = cameras.find((c) => c.id === selectedCameraId) || cameras[0];

  const activeAlertCount = incidents.filter((i) => i.severity === 'critical' && i.status === 'Open / Active').length;
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f1f5f9] text-[#0f172a]">
      {/* Tactical Top Header */}
      <Header
        onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        onNavigateNotifications={() => handleNavigateIncidents()}
      />

      {/* Global Notification Toast */}
      {toastNotification && (
        <div className="fixed top-20 right-6 z-50 bg-[#0052ff] text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2.5 text-[13px] font-semibold animate-in fade-in slide-in-from-top-3 border border-white/20">
          <span className="material-symbols-outlined text-[20px]">notifications_active</span>
          <span>{toastNotification}</span>
        </div>
      )}

      {/* Left Navigation Console */}
      <Sidebar
        currentPage={currentPage}
        onNavigate={(page) => {
          setCurrentPage(page);
          setIsMobileMenuOpen(false);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        activeAlertCount={activeAlertCount}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content Viewport */}
      <main className="ml-0 md:ml-64 mt-16 p-4 sm:p-6 min-h-[calc(100vh-64px)]">
        {currentPage === 'dashboard' && (
          <DashboardView
            cameras={cameras}
            incidents={incidents}
            liveDetections={liveDetections}
            liveAlerts={liveAlerts}
            onSelectCamera={handleSelectCamera}
            onNavigateIncidents={handleNavigateIncidents}
            onOpenDispatch={handleOpenDispatch}
            onNavigatePage={(page) => {
              setCurrentPage(page);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {currentPage === 'live-cameras' && (
          <LiveCamerasView
            cameras={cameras}
            selectedCameraId={selectedCameraId}
            onSelectCamera={setSelectedCameraId}
            onOpenDetail={handleSelectCamera}
          />
        )}

        {currentPage === 'camera-detail' && (
          <CameraDetailView
            camera={currentCamera}
            allCameras={cameras}
            incidents={incidents}
            evidence={evidence}
            anprScans={anprScans}
            faceSubjects={faceSubjects}
            onBack={handleBackFromCameraDetail}
            onSelectCamera={(id) => setSelectedCameraId(id)}
            onNavigateIncidents={handleNavigateIncidents}
            onNavigateEvidence={handleNavigateEvidence}
            onOpenDispatch={handleOpenDispatch}
          />
        )}

        {currentPage === 'incidents' && (
          <IncidentsView
            incidents={incidents}
            selectedIncidentId={selectedIncidentId}
            onSelectCamera={handleSelectCamera}
            onOpenDispatch={handleOpenDispatch}
            onUpdateStatus={handleUpdateIncidentStatus}
          />
        )}

        {currentPage === 'anpr' && (
          <AnprView
            scans={anprScans}
            cameras={cameras}
            onSelectCamera={handleSelectCamera}
            onOpenDetail={handleSelectCamera}
          />
        )}

        {currentPage === 'face-analytics' && (
          <FaceAnalyticsView
            subjects={faceSubjects}
            camera={cameras[0]}
            onOpenDetail={handleSelectCamera}
          />
        )}

        {currentPage === 'evidence' && (
          <EvidenceView
            evidence={evidence}
            selectedEvidenceId={selectedEvidenceId}
            onSelectCamera={handleSelectCamera}
            onNavigateIncident={handleNavigateIncidents}
          />
        )}

        {currentPage === 'admin-console' && (
          <AdminConsoleView
            cameras={cameras}
            onSelectCamera={handleSelectCamera}
          />
        )}
      </main>

      {/* QRT Tactical Intercept Dispatch Modal */}
      {activeDispatchIncident && (
        <DispatchModal
          isOpen={isDispatchOpen}
          incidentId={activeDispatchIncident.id}
          cameraName={activeDispatchIncident.cameraName}
          defaultUnit={activeDispatchIncident.qrtUnit}
          eta={activeDispatchIncident.eta}
          onClose={() => setIsDispatchOpen(false)}
          onConfirmDispatch={handleConfirmDispatch}
        />
      )}
    </div>
  );
}
