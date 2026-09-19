export type NavigationPage = 
  | 'dashboard' 
  | 'live-cameras' 
  | 'incidents' 
  | 'anpr' 
  | 'face-analytics' 
  | 'evidence'
  | 'camera-detail'
  | 'admin-console';

export interface DetectionItem {
  id: string;
  trackId?: string;
  className: string;
  confidence: number;
  type: 'person' | 'vehicle' | 'plate';
  bbox?: {
    top: string;
    left: string;
    width: string;
    height: string;
  };
  dwellTime?: string;
  speed?: string;
  heading?: string;
  bufferDist?: string;
  isAlert?: boolean;
  alertText?: string;
  subLabel?: string;
}

export interface CameraData {
  id: string; // e.g. "CAM-01", "CAM-02", "CAM-03", "CAM-04"
  name: string;
  shortName: string;
  location: string;
  sector: string;
  node: string;
  status: 'online' | 'alert' | 'standby';
  resolution: string;
  fps: number;
  bitrate: string;
  latencyMs: number;
  yoloInferenceMs: number;
  ipAddress: string;
  sourceUri: string;
  inferenceEndpoint: string;
  imageUrl: string;
  geoCoordinates: string;
  gridRef: string;
  ptzPreset: string;
  sensorType: string;
  coverageFov: string;
  deployment: string;
  irAssist: string;
  tripwireStatus: string;
  virtualFenceStatus: 'intact' | 'breached' | 'warning' | 'calibrated';
  detections: DetectionItem[];
  recentIncidentsCount: number;
  relatedIncidents: string[];
  relatedEvidenceCount: number;
  hasAnprData?: boolean;
  anprPlate?: string;
  hasFaceData?: boolean;
  faceSubjectId?: string;
}

export interface IncidentRecord {
  id: string;
  timestamp: string;
  cameraId: string;
  cameraName: string;
  sector: string;
  zone: string;
  classification: string;
  description: string;
  targetClass: string;
  confidence: number;
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: 'Open / Active' | 'Under Verification' | 'Acknowledged' | 'Resolved' | 'Closed (Wildlife)';
  triggerFrameUrl: string;
  coordinates: string;
  ingestStream: string;
  activePipeline: string;
  qrtUnit: string;
  eta: string;
  operatorNotes: string;
}

export interface AnprScan {
  id: string;
  time: string;
  plate: string;
  vehicleClass: string;
  cameraId: string;
  status: 'clear' | 'expired' | 'local_pass';
  statusLabel: string;
  radarSpeed: string;
  plateConf: number;
  ocrConf: number;
  permitId: string;
  permitDetails: string;
  validTill: string;
}

export interface FaceScreeningSubject {
  id: string;
  captureTime: string;
  cameraId: string;
  quality: number;
  pose: string;
  lighting: string;
  occlusion: string;
  watchlistMatch: string;
  classification: string;
  status: 'unflagged' | 'manual_inspection' | 'local_verified';
  statusLabel: string;
  cropUrl: string;
}

export interface EvidenceRecord {
  id: string;
  incidentId: string;
  title: string;
  cameraId: string;
  cameraName: string;
  timestamp: string;
  category: 'Critical Intrusion' | 'Vehicular' | 'ANPR / OCR' | 'Thermal Track';
  clipDuration: string;
  mediaType: 'clip' | 'keyframe' | 'anpr' | 'thermal';
  previewImageUrl: string;
  cryptoHash: string;
  gpsAnchor: string;
  tamperStatus: string;
  inferenceEngine: string;
  storageSize: string;
}
