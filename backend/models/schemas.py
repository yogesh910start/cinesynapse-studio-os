from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from enum import Enum

class SentryCategory(str, Enum):
    TIMECODE_DRIFT = "TIMECODE_DRIFT"
    C2PA_STRIPPED = "C2PA_STRIPPED"
    AMBIENT_IP = "AMBIENT_IP"
    MEAL_PENALTY = "MEAL_PENALTY"
    ACES_CLIPPING = "ACES_CLIPPING"
    SLATE_DESYNC = "SLATE_DESYNC"
    PROP_DESYNC = "PROP_DESYNC"

class SentrySeverity(str, Enum):
    INFO = "INFO"
    WARNING = "WARNING"
    CRITICAL = "CRITICAL"

class SentryAlert(BaseModel):
    event_id: str
    category: SentryCategory
    severity: SentrySeverity
    scene_id: str
    shot_id: str
    details: str
    financial_exposure_usd: float
    auto_remediation: Optional[str] = None
    timestamp: str

class ShotAttribution(BaseModel):
    attribution_id: str
    scene_id: str
    scene_display: Optional[str] = "Scene 42B"
    take_number: int = 1
    shot_id: str
    description: str
    used_seconds: float
    rendered_by: str = "VFX_GPU_NODE_12"
    timecode: str = "01:24:14:00"
    timestamp: str
    status: str = "CONFORMED"

class PerformerLikeness(BaseModel):
    actor_id: str
    actor_name: str
    character_name: Optional[str] = None
    contract_id: str
    union_affiliation: str = "SAG_AFTRA"
    schedule_code: str = "SCHEDULE_A"
    performer_type: Optional[str] = "Digital Stunt Double"
    authorized_seconds: float
    used_seconds: float
    residual_rate_per_sec: float
    accrued_residuals_usd: float
    consent_expiry: str
    c2pa_hash: str
    status: str = "CLEARED"
    permitted_uses: Optional[List[str]] = None
    prohibited_uses: Optional[List[str]] = None
    cryptographic_signatures: Optional[Dict[str, Any]] = None
    synthetic_double_assets: Optional[Dict[str, Any]] = None
    shot_attributions: Optional[List[Dict[str, Any]]] = None

class TerritoryCompliance(BaseModel):
    territory_iso: str
    territory_name: str
    risk_level: str
    infractions_count: int
    inpaint_required: bool
    status: str

class RippleAuditRequest(BaseModel):
    project_id: str = "CHRONO-2026"
    scene_id: str = "SCENE_42B"
    shot_id: str = "SHOT_14"
    proposed_action: str = "SUBSTITUTE_SYNTHETIC_DOUBLE"
    actor_id: str = "ACTOR_MARCUS_VANCE"
    duration_seconds: float = 6.2

class RippleAuditResponse(BaseModel):
    verdict: str
    execution_time_ms: float
    remaining_likeness_sec: float
    accrued_residual_usd: float
    vfx_gpu_node: str
    shotgrid_task_id: Optional[str] = None
    consensus_breakdown: Dict[str, str]

class VoiceScratchpadNote(BaseModel):
    memo_id: str
    timecode_smpte: str
    transcript: str
    assigned_department: str
    shotgrid_ticket_id: Optional[str] = None
    created_at: str

class StorageTierInfo(BaseModel):
    tier_id: str
    name: str
    protocol: str
    latency: str
    throughput_gbps: float
    used_pb: float
    total_pb: float
    utilization_pct: float
    purpose: str
    status: str

class StorageBandwidthMetrics(BaseModel):
    aggregate_fabric_gbps: float
    current_read_throughput_gbps: float
    current_write_ingress_gbps: float
    peak_burst_gbps: float
    active_camera_streams: int
    direct_io_latency_ms: float

class StorageSecurityPosture(BaseModel):
    tpn_certification: str
    encryption_at_rest: str
    kms_key_id: str
    kms_hsm_level: str
    encryption_in_transit: str
    c2pa_hardware_signing: str
    forensic_watermarking: str
    zero_knowledge_enclave: str
    worm_retention_days: int
    soc2_iso27001_status: str

class StorageQuotaResponse(BaseModel):
    storage_provider: str
    active_bucket: str
    used_bytes: int
    quota_bytes: int
    used_human: str
    quota_human: str
    utilization_pct: float
    files_count: int
    tiers: Optional[List[StorageTierInfo]] = None
    bandwidth: Optional[StorageBandwidthMetrics] = None
    security: Optional[StorageSecurityPosture] = None

class StorageSecurityAuditResponse(BaseModel):
    status: str
    audit_id: str
    scanned_partitions: int
    verified_c2pa_hashes: int
    kms_integrity: str
    tpn_compliance: str
    forensic_watermark_integrity: str
    timestamp: str
    details: List[str]

class StorageKeyRotationResponse(BaseModel):
    status: str
    old_key_version: str
    new_key_version: str
    re_encrypted_assets_count: int
    rotation_timestamp: str
    kms_arn: str


class TriggerScenarioRequest(BaseModel):
    scenario_id: str = Field(..., description="timecode_drift | meal_penalty | likeness_overage | spherex_inpaint")

class WarRoomMessage(BaseModel):
    message_id: str
    channel_id: str = "#on-set-camera-comms"
    sender_id: str = "david-director"
    sender_name: str = "David Fincher"
    sender_role: str = "Director"
    text: str
    timecode_smpte: Optional[str] = "01:24:12:04"
    asset_name: Optional[str] = None
    asset_type: Optional[str] = None  # "VIDEO" | "STILL" | "EDL" | "SCRIPT"
    c2pa_status: Optional[str] = "VERIFIED"
    created_at: str

class WarRoomMeeting(BaseModel):
    meeting_id: str
    channel_id: str
    title: str
    is_live: bool = True
    participants: List[str] = []
    transcript_log: List[Dict[str, str]] = []
    decisions_extracted: List[str] = []
    action_items: List[Dict[str, Any]] = []
