export interface ProductionProject {
  project_id: string;
  title: string;
  director: string;
  total_frames: number;
  active_scene: string;
  active_shot: string;
  active_take: number;
  timecode: string;
  camera_fps: number;
  target_fps: number;
  lens: string;
  color_space: string;
  c2pa_status: string;
  c2pa_hash: string;
}

export interface ShotAttribution {
  attribution_id: string;
  scene_id: string;
  scene_display: string;
  take_number: number;
  shot_id: string;
  description: string;
  used_seconds: number;
  rendered_by: string;
  timecode: string;
  timestamp: string;
  status: string;
}

export interface C2PACertificateInfo {
  performer_key_id: string;
  sha256_consent_hash: string;
  c2pa_manifest_uri: string;
  root_of_trust: string;
  x509_issuer: string;
  tsa_timestamp: string;
  integrity_status: string;
}

export interface SyntheticDoubleAssets {
  scan_fidelity: number;
  landmark_deviation_mm: number;
  gamut_match: string;
  topology_points: number;
  render_engine: string;
  raw_scan_tag: string;
  neural_render_tag: string;
  topology_coordinates?: Array<{
    id?: number;
    index?: number;
    name: string;
    region: string;
    x: number;
    y: number;
    z: number;
    delta_mm?: number;
    deviation?: number;
  }>;
  c2pa_mesh_hash?: string;
  c2pa_hash?: string;
  source_frame?: string;
  last_conformed_timecode?: string;
  status?: string;
  reconstructed_at?: string;
}

export interface LikenessPerformer {
  actor_id: string;
  actor_name: string;
  character_name?: string;
  contract_id: string;
  union_affiliation: string;
  schedule_code: string;
  performer_type?: string;
  authorized_seconds: number;
  used_seconds: number;
  residual_rate_per_sec: number;
  accrued_residuals_usd: number;
  consent_expiry: string;
  c2pa_hash: string;
  status: string;
  permitted_uses?: string[];
  prohibited_uses?: string[];
  cryptographic_signatures?: C2PACertificateInfo;
  synthetic_double_assets?: SyntheticDoubleAssets;
  shot_attributions?: ShotAttribution[];
}

export interface SagUnionPacket {
  packet_id: string;
  production_title: string;
  studio_tenant: string;
  generated_at: string;
  union_jurisdiction: string;
  statutory_act: string;
  compliance_status: string;
  performer: {
    actor_id: string;
    actor_name: string;
    character_name?: string;
    contract_id: string;
    schedule_code: string;
    consent_expiry: string;
  };
  metering: {
    contracted_seconds_cap: number;
    actual_rendered_seconds: number;
    remaining_authorized_headroom_sec: number;
    contracted_rate_per_sec_usd: number;
    total_accrued_residuals_usd: number;
  };
  permitted_uses: string[];
  prohibited_uses: string[];
  c2pa_provenance: any;
  shot_audit_ledger: ShotAttribution[];
  certification: {
    attorney_signature: string;
    digital_seal: string;
    timestamp_authority: string;
  };
}

export interface SentryAlert {
  event_id: string;
  category: string;
  severity: "INFO" | "WARNING" | "CRITICAL";
  scene_id: string;
  shot_id: string;
  details: string;
  financial_exposure_usd: number;
  auto_remediation?: string;
  timestamp: string;
}

export interface TerritoryCompliance {
  territory_iso: string;
  territory_name: string;
  risk_level: string;
  infractions_count: number;
  inpaint_required: boolean;
  status: string;
}

export interface VoiceNote {
  memo_id: string;
  timecode_smpte: string;
  transcript: string;
  assigned_department: string;
  shotgrid_ticket_id?: string;
  created_at: string;
}

export interface StorageTier {
  tier_id: string;
  name: string;
  protocol: string;
  latency: string;
  throughput_gbps: number;
  used_pb: number;
  total_pb: number;
  utilization_pct: number;
  purpose: string;
  status: string;
}

export interface StorageBandwidthMetrics {
  aggregate_fabric_gbps: number;
  current_read_throughput_gbps: number;
  current_write_ingress_gbps: number;
  peak_burst_gbps: number;
  active_camera_streams: number;
  direct_io_latency_ms: number;
}

export interface StorageSecurityPosture {
  tpn_certification: string;
  encryption_at_rest: string;
  kms_key_id: string;
  kms_hsm_level: string;
  encryption_in_transit: string;
  c2pa_hardware_signing: string;
  forensic_watermarking: string;
  zero_knowledge_enclave: string;
  worm_retention_days: number;
  soc2_iso27001_status: string;
}

export interface StorageSecurityAuditResult {
  status: string;
  audit_id: string;
  scanned_partitions: number;
  verified_c2pa_hashes: number;
  kms_integrity: string;
  tpn_compliance: string;
  forensic_watermark_integrity: string;
  timestamp: string;
  details: string[];
}

export interface StorageKeyRotationResult {
  status: string;
  old_key_version: string;
  new_key_version: string;
  re_encrypted_assets_count: number;
  rotation_timestamp: string;
  kms_arn: string;
}

export interface VaultAsset {
  asset_id: string;
  file_name: string;
  bucket: string;
  tier: string;
  size_mb: number;
  resolution?: string;
  codec?: string;
  color_space?: string;
  c2pa_status: string;
  c2pa_root_of_trust?: string;
  forensic_watermark_id?: string;
  sha256: string;
  created_at: string;
  metadata?: Record<string, any>;
}

export interface StorageQuota {
  storage_provider: string;
  active_bucket: string;
  used_bytes: number;
  quota_bytes: number;
  used_human: string;
  quota_human: string;
  utilization_pct: number;
  files_count: number;
  tiers?: StorageTier[];
  bandwidth?: StorageBandwidthMetrics;
  security?: StorageSecurityPosture;
}


export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  clearance: string;
  avatar: string;
  tenantId: string;
  token?: string;
  expiresIn?: string;
}

export const INITIAL_PERSONAS: UserProfile[] = [
  {
    id: "elena-legal",
    name: "Elena Rostova, Esq.",
    email: "elena.rostova@paramount.com",
    role: "Production Attorney / Business Affairs",
    department: "Legal & Guild Clearance",
    clearance: "SAG-AFTRA Schedule A, NO FAKES Act, Territorial Clearance",
    avatar: "⚖️",
    tenantId: "paramount_pictures",
    expiresIn: "07h 59m 42s"
  },
  {
    id: "david-director",
    name: "David Fincher",
    email: "david.fincher@paramount.com",
    role: "Director / Showrunner",
    department: "Creative Editorial & Conform",
    clearance: "Full Creative Override, Master Conform, Final Cut",
    avatar: "🎬",
    tenantId: "paramount_pictures",
    expiresIn: "07h 59m 42s"
  },
  {
    id: "klaus-dit",
    name: "Klaus Richter",
    email: "klaus.richter@paramount.com",
    role: "Lead Digital Imaging Technician (DIT)",
    department: "Camera & Sound Engineering",
    clearance: "ARRI C2C, Ambient Genlock, False-Color IRE, Cooke /i",
    avatar: "🎥",
    tenantId: "paramount_pictures",
    expiresIn: "07h 59m 42s"
  },
  {
    id: "marcus-cast",
    name: "Marcus Vance",
    email: "marcus.vance@paramount.com",
    role: "Principal Performer",
    department: "Talent & Cast Relations",
    clearance: "Likeness Ledger Audit, Residuals Tracking, Consent Tokens",
    avatar: "🎭",
    tenantId: "paramount_pictures",
    expiresIn: "07h 59m 42s"
  },
  {
    id: "sarah-1stad",
    name: "Sarah Chen",
    email: "sarah.chen@paramount.com",
    role: "1st Assistant Director (1st AD)",
    department: "On-Set Production Management",
    clearance: "IATSE Meal Penalties, Safety Protocols, Call Sheets",
    avatar: "⏱️",
    tenantId: "paramount_pictures",
    expiresIn: "07h 59m 42s"
  },
  {
    id: "alex-vfx",
    name: "Alex Thorne",
    email: "alex.thorne@paramount.com",
    role: "VFX Supervisor",
    department: "Visual Effects & Virtual Prod",
    clearance: "Cooke /i Lens Profiles, ShotGrid Dispatch, ACEScg",
    avatar: "✨",
    tenantId: "paramount_pictures",
    expiresIn: "07h 59m 42s"
  }
];

export interface ProductionTake {
  take_id: string;
  id?: string;
  project_id: string;
  scene_id: string;
  scene_display: string;
  scene_number?: string;
  take_number: number;
  director: string;
  sound_roll: string;
  lens: string;
  timecode_in: string;
  timecode_out: string;
  duration_sec: number;
  duration_frames: number;
  fps: number;
  verdict?: "CIRCLE" | "NG" | "HOLD" | null;
  ng_reason?: string | null;
  director_notes?: string;
  notes?: string;
  prop_fill_level?: number | null;
  cdl?: {
    slope: number;
    offset: number;
    power: number;
    saturation: number;
  };
  c2pa_status: string;
  c2pa_hash: string;
  c2pa_manifest_id?: string;
  file_name: string;
  storage_path: string;
  proxy_files?: string[];
  created_at: string;
}

export interface ProductionScene {
  scene_id: string;
  scene_number: string;
  title: string;
  name?: string;
  slug: string;
  description: string;
  location: string;
  active_take: number;
  total_takes: number;
  status: "IN_PROGRESS" | "COMPLETED" | "SCHEDULED";
}

export interface ProductionState {
  tenant_id: string;
  project_id: string;
  project_title: string;
  active_scene: string;
  active_scene_id: string;
  active_take: number;
  director: string;
  sound_roll: string;
  scene_takes_count: number;
  total_takes_count: number;
  updated_at: string;
}

export interface StudioTenant {
  tenant_id: string;
  name: string;
  code: string;
  default_project?: string;
  logo?: string;
  created_at?: string;
}

export interface MovieProject {
  project_id: string;
  tenant_id: string;
  title: string;
  director: string;
  year?: number;
  camera_fps: number;
  aspect_ratio: string;
  color_space?: string;
  description?: string;
  active_scene?: string;
  active_take?: number;
  is_blank?: boolean;
  created_at?: string;
}
