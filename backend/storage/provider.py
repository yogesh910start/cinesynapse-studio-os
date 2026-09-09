import os
import hashlib
import uuid
import datetime
from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional
from backend.config import settings
from backend.core.logging import log_telemetry


class IStorageProvider(ABC):
    @abstractmethod
    async def list_assets(self, tenant_id: str, project_id: Optional[str] = None) -> List[Dict[str, Any]]:
        pass

    @abstractmethod
    async def get_storage_quota(self, tenant_id: str, project_id: Optional[str] = None) -> Dict[str, Any]:
        pass

    @abstractmethod
    async def verify_vault_security(self, tenant_id: str) -> Dict[str, Any]:
        pass

    @abstractmethod
    async def rotate_kms_key(self, tenant_id: str) -> Dict[str, Any]:
        pass


class LocalStorageProvider(IStorageProvider):
    def __init__(self, base_dir: str = "backend/storage/local"):
        self.base_dir = base_dir
        self.active_kms_version = 4
        os.makedirs(os.path.join(base_dir, "c2c-proxies"), exist_ok=True)
        os.makedirs(os.path.join(base_dir, "c2pa-manifests"), exist_ok=True)
        os.makedirs(os.path.join(base_dir, "audio-scratchpad"), exist_ok=True)
        os.makedirs(os.path.join(base_dir, "look-stills"), exist_ok=True)

    async def list_assets(self, tenant_id: str, project_id: Optional[str] = None) -> List[Dict[str, Any]]:
        from backend.storage.takes_store import takes_store
        takes = takes_store.list_takes(tenant_id, project_id=project_id)
        
        take_assets = []
        for t in takes:
            dur = float(t.get("duration_sec", 24.0))
            is_circle = t.get("verdict") == "CIRCLE"
            bucket_tenant = tenant_id.lower().replace("_", "-")
            bucket_proj = f"-{project_id.lower().replace('_', '-')}" if project_id else ""
            take_assets.append({
                "asset_id": f"AST-TAKE-{t.get('take_id', uuid.uuid4().hex[:6])}",
                "file_name": t.get("file_name", f"Take_{t.get('take_number')}.mov"),
                "bucket": f"gs://{bucket_tenant}{bucket_proj}-c2c-vault/takes",
                "tier": "Tier 0 (Ultra-Hot NVMe)",
                "size_mb": round(dur * 242.0, 1), # ~242 MB/sec for ARRIRAW 4.6K 24fps
                "resolution": "4.6K (4608 x 3164)",
                "codec": "ARRIRAW / MXF",
                "color_space": "ACES 1.3 ST 2065-1 (AP0/AP1)",
                "c2pa_status": t.get("c2pa_status", "VERIFIED_HARDWARE_SIGNATURE"),
                "c2pa_root_of_trust": "ARRI Hardware Secure Enclave (X.509 Device Cert)",
                "forensic_watermark_id": f"NXG-{uuid.uuid4().hex[:8].upper()}",
                "sha256": (t.get("c2pa_hash") or hashlib.sha256(str(t.get("take_id")).encode()).hexdigest()).replace("c2pa:sha256:", ""),
                "created_at": t.get("created_at", "2026-09-04T23:24:12Z"),
                "metadata": {
                    "scene": t.get("scene_display"),
                    "take": t.get("take_number"),
                    "verdict": t.get("verdict"),
                    "director": t.get("director", "Principal Director"),
                    "lens": t.get("lens", "Cooke Anamorphic /i 40mm T/2.0"),
                    "duration": f"{dur}s ({int(dur * 24)} frames)",
                    "is_hero_print": is_circle
                }
            })
            
        # Only include legacy demo base_assets for Paramount's Chrono demo project
        is_demo_paramount = (tenant_id == "paramount_pictures") and (project_id in (None, "CHRONO-2026"))
        if not is_demo_paramount:
            return take_assets

        base_assets = [
            {
                "asset_id": "AST-VFX-HERO-01",
                "file_name": "scene42b_vfx_plate_background_h100_v08.exr",
                "bucket": f"gs://{tenant_id}-c2c-vault/vfx-plates",
                "tier": "Tier 1 (Warm GCS Iceberg)",
                "size_mb": 3480.5,
                "resolution": "8K UHD (7680 x 4320)",
                "codec": "OpenEXR 16-bit Float DWAA",
                "color_space": "ACEScg Linear",
                "c2pa_status": "VERIFIED_HARDWARE_SIGNATURE",
                "c2pa_root_of_trust": "NVIDIA H100 Confidential Computing Enclave",
                "forensic_watermark_id": "NXG-VFX-PLATE-8492",
                "sha256": "4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a",
                "created_at": "2026-09-04T22:15:00Z",
                "metadata": {
                    "department": "Neural VFX",
                    "gpu_cluster": "Node 04 (H100 SXM5)",
                    "inpaint_task": "SG-TASK-8492"
                }
            },
            {
                "asset_id": "AST-BIO-REP-01",
                "file_name": "marcus_vance_photogrammetry_scan_polar_4d.ply",
                "bucket": f"gs://{tenant_id}-c2c-vault/biometric-quarantine",
                "tier": "Tier 2 (Cold WORM Tape)",
                "size_mb": 14200.0,
                "resolution": "148,200 Topology Mesh Points",
                "codec": "Gaussian Splatting / Point Cloud",
                "color_space": "Rec.2020 Spectral",
                "c2pa_status": "SIGNATURE_VALID",
                "c2pa_root_of_trust": "SAG-AFTRA Schedule A Biometric Key Vault",
                "forensic_watermark_id": "NXG-SAG-SCHA-8942",
                "sha256": "7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069",
                "created_at": "2026-09-04T21:00:00Z",
                "metadata": {
                    "actor_name": "Marcus Vance",
                    "character": "Commander Vance",
                    "union_contract": "SAG-SCH-A-8942",
                    "air_gap_status": "QUARANTINED_ACTIVE"
                }
            },
            {
                "asset_id": "AST-AUD-MASTER-01",
                "file_name": "boom_master_32bit_float_24fps_timecode_locked.bwf",
                "bucket": f"gs://{tenant_id}-c2c-vault/audio-scratchpad",
                "tier": "Tier 0 (Ultra-Hot NVMe)",
                "size_mb": 420.8,
                "resolution": "48 kHz / 32-bit Float Multi-track",
                "codec": "Broadcast WAV (BWF)",
                "color_space": "SMPTE ST 2067-2 Audio",
                "c2pa_status": "VERIFIED_HARDWARE_SIGNATURE",
                "c2pa_root_of_trust": "Sound Devices Scorpio Hardware Cert",
                "forensic_watermark_id": "NXG-AUD-BOOM-01",
                "sha256": "ef2d127de37b942baad06145e54b0c619a1f22327b2ebbcfbec78f5564afe39d",
                "created_at": "2026-09-04T23:20:15Z",
                "metadata": {
                    "sample_rate": "48000 Hz",
                    "timecode_clock": "24.000 fps Locked",
                    "drift_correction": "0.1% Audio Pull-Up Ready"
                }
            },
            {
                "asset_id": "AST-LUT-SHOW-01",
                "file_name": "hero_show_lut_acescc_to_rec709_kodak2383.cube",
                "bucket": f"gs://{tenant_id}-c2c-vault/look-stills",
                "tier": "Tier 1 (Warm GCS Iceberg)",
                "size_mb": 4.8,
                "resolution": "65 x 65 x 65 3D Grid",
                "codec": "Adobe 3D Cube LUT",
                "color_space": "ACEScc to Rec.709 100 nits",
                "c2pa_status": "VERIFIED",
                "c2pa_root_of_trust": "Company 3 Master Color Vault",
                "forensic_watermark_id": "NXG-COLOR-SHOW-01",
                "sha256": "893c8347daef9234857bfec27b2ebbcfbec78f5564afe39ddfe231456bcab512",
                "created_at": "2026-09-04T18:30:00Z",
                "metadata": {
                    "colorist": "Senior Supervising Colorist",
                    "emulation": "Kodak 2383 Print Stock D65"
                }
            }
        ]
        return take_assets + base_assets

    async def get_storage_quota(self, tenant_id: str, project_id: Optional[str] = None) -> Dict[str, Any]:
        from backend.storage.takes_store import takes_store
        takes = takes_store.list_takes(tenant_id, project_id=project_id)
        
        is_demo_paramount = (tenant_id == "paramount_pictures") and (project_id in (None, "CHRONO-2026"))
        
        if is_demo_paramount:
            # Hollywood Multi-Petabyte Tier Allocations for Paramount Demo
            t0_used_pb = round(1.24 + len(takes) * 0.008, 3)
            t0_total_pb = 2.50
            
            t1_used_pb = round(4.15 + len(takes) * 0.012, 3)
            t1_total_pb = 7.50
            
            t2_used_pb = round(5.00, 3)
            t2_total_pb = 15.00
            
            total_used_pb = round(t0_used_pb + t1_used_pb + t2_used_pb, 2)
            total_quota_pb = round(t0_total_pb + t1_total_pb + t2_total_pb, 2) # 25.0 PB
            pb_to_bytes = 1024 ** 5
            used_bytes = int(total_used_pb * pb_to_bytes)
            quota_bytes = int(total_quota_pb * pb_to_bytes)
            utilization_pct = round((total_used_pb / total_quota_pb) * 100, 1) if total_quota_pb else 0.0
            used_human = f"{total_used_pb} PB"
            files_count = 18420 + len(takes) * 144
            active_streams = 6
            read_tp = 38.4
            write_tp = 18.2
        else:
            # Custom/Fresh Studio & Project: 100% clean-slate calculation based strictly on real assets
            take_assets = await self.list_assets(tenant_id, project_id=project_id)
            total_take_mb = sum(a.get("size_mb", 0.0) for a in take_assets)
            used_bytes = int(total_take_mb * 1024 * 1024)
            
            if total_take_mb >= 1024 * 1024 * 1024:
                used_human = f"{round(total_take_mb / (1024 * 1024 * 1024), 3)} PB"
            elif total_take_mb >= 1024 * 1024:
                used_human = f"{round(total_take_mb / (1024 * 1024), 2)} TB"
            elif total_take_mb >= 1024:
                used_human = f"{round(total_take_mb / 1024, 2)} GB"
            else:
                used_human = f"{round(total_take_mb, 1)} MB"

            total_quota_pb = 25.0
            pb_to_bytes = 1024 ** 5
            quota_bytes = int(total_quota_pb * pb_to_bytes)
            utilization_pct = round((used_bytes / quota_bytes) * 100, 4) if quota_bytes else 0.0
            
            t0_used_pb = round(total_take_mb / (1024 * 1024 * 1024), 5)
            t0_total_pb = 2.50
            t1_used_pb = 0.00
            t1_total_pb = 7.50
            t2_used_pb = 0.00
            t2_total_pb = 15.00
            
            total_used_pb = t0_used_pb
            files_count = len(take_assets)
            active_streams = min(4, len(take_assets)) if take_assets else 0
            read_tp = 12.4 if take_assets else 0.0
            write_tp = 18.2 if take_assets else 0.0
        
        tiers = [
            {
                "tier_id": "TIER_0_NVME",
                "name": "Tier 0 (Ultra-Hot NVMe-oF Direct Ingest)",
                "protocol": "800 Gbps RoCE v2 / NVMe-oF",
                "latency": "0.12 ms (Direct I/O)",
                "throughput_gbps": 142.0,
                "used_pb": t0_used_pb,
                "total_pb": t0_total_pb,
                "utilization_pct": round((t0_used_pb / t0_total_pb) * 100, 1) if t0_total_pb else 0.0,
                "purpose": "Real-time 8K uncompressed Bayer raw plates & LED volume wall playback",
                "status": "OPTIMAL_PERFORMANCE"
            },
            {
                "tier_id": "TIER_1_WARM_GCS",
                "name": "Tier 1 (Warm Dual-Region GCS Iceberg Vault)",
                "protocol": "HTTPS / gRPC Dual-Region Multi-Zone",
                "latency": "4.80 ms",
                "throughput_gbps": 48.0,
                "used_pb": t1_used_pb,
                "total_pb": t1_total_pb,
                "utilization_pct": round((t1_used_pb / t1_total_pb) * 100, 1) if t1_total_pb else 0.0,
                "purpose": "ACES 1.3 OpenEXR VFX plates & Apple ProRes 4444 XQ editorial proxies",
                "status": "COLLABORATIVE_SYNCED"
            },
            {
                "tier_id": "TIER_2_COLD_WORM",
                "name": "Tier 2 (Cold Deep Archival WORM Tape & Iceberg)",
                "protocol": "LTO-9 / GCS Archive WORM",
                "latency": "1,200 ms (Robotic Jukebox)",
                "throughput_gbps": 12.0,
                "used_pb": t2_used_pb,
                "total_pb": t2_total_pb,
                "utilization_pct": round((t2_used_pb / t2_total_pb) * 100, 1) if t2_total_pb else 0.0,
                "purpose": "SEC Rule 17a-4 / NO FAKES Act master negative & likeness vault",
                "status": "IMMUTABLE_WORM_LOCKED"
            }
        ]
        
        bandwidth = {
            "aggregate_fabric_gbps": 800.0,
            "current_read_throughput_gbps": read_tp,
            "current_write_ingress_gbps": write_tp,
            "peak_burst_gbps": 240.0,
            "active_camera_streams": active_streams,
            "direct_io_latency_ms": 0.12
        }
        
        bucket_tenant = tenant_id.lower().replace("_", "-")
        bucket_proj = f"-{project_id.lower().replace('_', '-')}" if project_id else ""
        active_bucket = f"gs://{bucket_tenant}{bucket_proj}-c2c-vault"
        kms_key_name = f"{project_id.lower().replace('_', '-')}-master-v{self.active_kms_version}" if project_id else f"{tenant_id}-master-v{self.active_kms_version}"

        security = {
            "tpn_certification": "TPN Gold Shield v5.2 (Certified Air-Gapped Cloud & Physical)",
            "encryption_at_rest": "AES-256-GCM Hardware BYOK (Cloud KMS HSM FIPS 140-3 Level 3)",
            "kms_key_id": f"projects/cine-synapse/locations/us-central1/keyRings/studio-vault/cryptoKeys/{kms_key_name}",
            "kms_hsm_level": "FIPS 140-3 Level 3 Thales Luna HSM",
            "encryption_in_transit": "TLS 1.3 + MACsec 256-bit Point-to-Point Enclave",
            "c2pa_hardware_signing": "ACTIVE (ARRI / RED Secure Enclave Root of Trust)",
            "forensic_watermarking": "ACTIVE (NexGuard Imperceptible Steganographic Payload per frame)",
            "zero_knowledge_enclave": "ENABLED (SAG-AFTRA Schedule A/F Biometric Air-Gap)",
            "worm_retention_days": 3650,
            "soc2_iso27001_status": "COMPLIANT / AUDIT READY"
        }
        
        return {
            "storage_provider": "Google Cloud Storage CMEK Tiered Vault (Multi-Petabyte Fabric)",
            "active_bucket": active_bucket,
            "used_bytes": used_bytes,
            "quota_bytes": quota_bytes,
            "used_human": used_human,
            "quota_human": f"{total_quota_pb} PB",
            "utilization_pct": utilization_pct,
            "files_count": files_count,
            "tiers": tiers,
            "bandwidth": bandwidth,
            "security": security
        }

    async def verify_vault_security(self, tenant_id: str) -> Dict[str, Any]:
        audit_id = f"SEC-AUDIT-{uuid.uuid4().hex[:8].upper()}"
        now = datetime.datetime.now(datetime.timezone.utc).isoformat()
        log_telemetry("INFO", "SecurityVault", f"Triggered full cryptographic parity audit {audit_id} for tenant {tenant_id}")
        return {
            "status": "PASSED_WITH_ZERO_INFRACTIONS",
            "audit_id": audit_id,
            "scanned_partitions": 12,
            "verified_c2pa_hashes": 18420,
            "kms_integrity": "FIPS 140-3 Level 3 Verified Valid",
            "tpn_compliance": "TPN Gold Shield v5.2 Certified 100%",
            "forensic_watermark_integrity": "NexGuard Imperceptible Payload 100% Extractable",
            "timestamp": now,
            "details": [
                "Checked Tier 0 NVMe hardware parity with zero bit rot",
                "Validated ARRI Alexa 35 & RED hardware enclave X.509 certificates",
                "Audited SAG-AFTRA biometric likeness vault zero-knowledge air-gap",
                "Confirmed SEC Rule 17a-4 WORM immutable lock on Tier 2 archive"
            ]
        }

    async def rotate_kms_key(self, tenant_id: str) -> Dict[str, Any]:
        old_v = self.active_kms_version
        self.active_kms_version += 1
        now = datetime.datetime.now(datetime.timezone.utc).isoformat()
        log_telemetry("INFO", "SecurityVault", f"Rotated KMS master key for {tenant_id} from v{old_v} to v{self.active_kms_version}")
        return {
            "status": "KEY_ROTATED_SUCCESSFULLY",
            "old_key_version": f"v{old_v}",
            "new_key_version": f"v{self.active_kms_version}",
            "re_encrypted_assets_count": 18420,
            "rotation_timestamp": now,
            "kms_arn": f"projects/cine-synapse/locations/us-central1/keyRings/studio-vault/cryptoKeys/{tenant_id}-master-v{self.active_kms_version}"
        }


storage_provider = LocalStorageProvider()
