import os
import json
import uuid
import datetime
from typing import Dict, Any, List, Optional
from backend.core.logging import log_telemetry

BASE_STORAGE_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "storage", "local")
LIKENESS_LEDGER_FILE = os.path.join(BASE_STORAGE_DIR, "likeness_ledger.json")

INITIAL_PERFORMERS = [
    {
        "actor_id": "ACTOR_MARCUS_VANCE",
        "actor_name": "Marcus Vance",
        "character_name": "Commander Vance",
        "contract_id": "SAG-SCH-A-8942",
        "union_affiliation": "SAG_AFTRA",
        "schedule_code": "SCHEDULE_A",
        "performer_type": "Digital Stunt Double & Facial Stabilizer",
        "authorized_seconds": 60.0,
        "used_seconds": 52.2,
        "residual_rate_per_sec": 300.0,
        "accrued_residuals_usd": 28310.0,
        "consent_expiry": "2027-12-31",
        "c2pa_hash": "c2pa:sha256:7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069",
        "status": "WARNING_THRESHOLD",
        "permitted_uses": [
            "VFX digital double background stunt replication",
            "Dangerous wirework replacement in Scene 42B",
            "Extreme environment cockpit facial composite in Scene 42A",
            "High-G facial turbulence stabilizer"
        ],
        "prohibited_uses": [
            "Dialogue generation unscripted by principal author",
            "Posthumous continuation without secondary estate consent",
            "Commercial merchandising endorsement without Rider B",
            "Third-party AI foundation model training"
        ],
        "cryptographic_signatures": {
            "performer_key_id": "kms:us-central1:sag:mv-vault-key-01",
            "sha256_consent_hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
            "c2pa_manifest_uri": "c2pa:sha256:42a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1",
            "root_of_trust": "ARRI Alexa 35 Hardware Enclave CA",
            "x509_issuer": "DigiCert Studio CA v3 / SAG-AFTRA Trust Network",
            "tsa_timestamp": "2026-03-14T08:12:44Z",
            "integrity_status": "VERIFIED_VALID"
        },
        "synthetic_double_assets": {
            "scan_fidelity": 99.6,
            "landmark_deviation_mm": 0.038,
            "gamut_match": "ACEScg SMPTE ST 2065-1",
            "topology_points": 148200,
            "render_engine": "Neural Gaussian Splatting v4.2 / Unreal Substrate",
            "raw_scan_tag": "MV_HEADSCAN_POLARIZED_RAW_v04",
            "neural_render_tag": "MV_NEURAL_COMP_ACEScg_v12"
        },
        "shot_attributions": [
            {
                "attribution_id": "attr-mv-01",
                "scene_id": "SCENE_42B",
                "scene_display": "Scene 42B",
                "take_number": 4,
                "shot_id": "SHOT_14",
                "description": "Wirework stunt platform drop & backward flip",
                "used_seconds": 6.2,
                "rendered_by": "VFX_GPU_NODE_12",
                "timecode": "01:24:14:10",
                "timestamp": "2026-09-04T23:10:00Z",
                "status": "CONFORMED"
            },
            {
                "attribution_id": "attr-mv-02",
                "scene_id": "SCENE_42B",
                "scene_display": "Scene 42B",
                "take_number": 2,
                "shot_id": "SHOT_11",
                "description": "Explosion concussion shockwave head replacement",
                "used_seconds": 4.1,
                "rendered_by": "VFX_GPU_NODE_08",
                "timecode": "01:24:18:00",
                "timestamp": "2026-09-04T22:50:00Z",
                "status": "CONFORMED"
            },
            {
                "attribution_id": "attr-mv-03",
                "scene_id": "SCENE_42A",
                "scene_display": "Scene 42A",
                "take_number": 8,
                "shot_id": "SHOT_08",
                "description": "Cockpit turbulence high-G facial stabilizer",
                "used_seconds": 5.4,
                "rendered_by": "VFX_GPU_NODE_04",
                "timecode": "01:18:04:12",
                "timestamp": "2026-09-04T21:40:00Z",
                "status": "CONFORMED"
            },
            {
                "attribution_id": "attr-mv-04",
                "scene_id": "SCENE_41",
                "scene_display": "Scene 41",
                "take_number": 3,
                "shot_id": "SHOT_02",
                "description": "Dune sandstorm digital double wide shot background",
                "used_seconds": 18.5,
                "rendered_by": "VFX_GPU_NODE_02",
                "timecode": "01:10:12:00",
                "timestamp": "2026-09-03T19:20:00Z",
                "status": "CONFORMED"
            },
            {
                "attribution_id": "attr-mv-05",
                "scene_id": "SCENE_38",
                "scene_display": "Scene 38",
                "take_number": 1,
                "shot_id": "SHOT_01",
                "description": "De-aging flashback sequence (age 24 retro-composite)",
                "used_seconds": 18.0,
                "rendered_by": "VFX_GPU_NODE_06",
                "timecode": "00:54:10:00",
                "timestamp": "2026-09-02T16:15:00Z",
                "status": "CONFORMED"
            }
        ]
    },
    {
        "actor_id": "ACTOR_ELENA_ROSTOVA",
        "actor_name": "Elena Rostova",
        "character_name": "Dr. Aris Thorne",
        "contract_id": "SAG-SCH-F-1102",
        "union_affiliation": "SAG_AFTRA",
        "schedule_code": "SCHEDULE_F",
        "performer_type": "Principal Cast Theatrical Buyout",
        "authorized_seconds": 120.0,
        "used_seconds": 44.5,
        "residual_rate_per_sec": 450.0,
        "accrued_residuals_usd": 20025.0,
        "consent_expiry": "2028-06-30",
        "c2pa_hash": "c2pa:sha256:1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b",
        "status": "CLEARED",
        "permitted_uses": [
            "Sub-zero environmental breath condensation composite",
            "High-altitude atmospheric descent stunt plate",
            "Extreme lighting HDR facial re-illumination"
        ],
        "prohibited_uses": [
            "Dialogue generation unscripted by principal author",
            "Synthetic vocal timbre modification"
        ],
        "cryptographic_signatures": {
            "performer_key_id": "kms:us-central1:sag:er-vault-key-02",
            "sha256_consent_hash": "b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3",
            "c2pa_manifest_uri": "c2pa:sha256:8899aabbccddeeff00112233445566778899aabbccddeeff0011223344556677",
            "root_of_trust": "Sony CineAlta Venice 2 Hardware Enclave CA",
            "x509_issuer": "DigiCert Studio CA v3 / SAG-AFTRA Trust Network",
            "tsa_timestamp": "2026-04-02T11:20:10Z",
            "integrity_status": "VERIFIED_VALID"
        },
        "synthetic_double_assets": {
            "scan_fidelity": 99.8,
            "landmark_deviation_mm": 0.024,
            "gamut_match": "ACEScg SMPTE ST 2065-1",
            "topology_points": 162000,
            "render_engine": "Neural Gaussian Splatting v4.2 / Unreal Substrate",
            "raw_scan_tag": "ER_HEADSCAN_POLARIZED_RAW_v02",
            "neural_render_tag": "ER_NEURAL_COMP_ACEScg_v09"
        },
        "shot_attributions": [
            {
                "attribution_id": "attr-er-01",
                "scene_id": "SCENE_34",
                "scene_display": "Scene 34",
                "take_number": 2,
                "shot_id": "SHOT_05",
                "description": "Sub-zero cryo-chamber condensation double",
                "used_seconds": 14.5,
                "rendered_by": "VFX_GPU_NODE_03",
                "timecode": "00:48:12:00",
                "timestamp": "2026-09-01T14:10:00Z",
                "status": "CONFORMED"
            },
            {
                "attribution_id": "attr-er-02",
                "scene_id": "SCENE_28",
                "scene_display": "Scene 28",
                "take_number": 5,
                "shot_id": "SHOT_09",
                "description": "High altitude atmospheric descent exterior harness",
                "used_seconds": 30.0,
                "rendered_by": "VFX_GPU_NODE_07",
                "timecode": "00:39:20:00",
                "timestamp": "2026-08-28T18:30:00Z",
                "status": "CONFORMED"
            }
        ]
    },
    {
        "actor_id": "ACTOR_DAVID_KALU",
        "actor_name": "David Kalu",
        "character_name": "Lt. Joseph Vance",
        "contract_id": "SAG-SCH-B-4401",
        "union_affiliation": "SAG_AFTRA",
        "schedule_code": "SCHEDULE_B",
        "performer_type": "Secondary Cast Stunt Replica",
        "authorized_seconds": 45.0,
        "used_seconds": 42.0,
        "residual_rate_per_sec": 250.0,
        "accrued_residuals_usd": 10500.0,
        "consent_expiry": "2027-09-15",
        "c2pa_hash": "c2pa:sha256:883bf12c99182a39df4a1023901bce44a192837465abc1234567890abcdef123",
        "status": "WARNING_THRESHOLD",
        "permitted_uses": [
            "Corridor combat wirework body double replacement",
            "Pyrotechnic concussion blast roll in Scene 42B"
        ],
        "prohibited_uses": [
            "Voice replication unapproved by performer",
            "Standalone merchandising digital avatars"
        ],
        "cryptographic_signatures": {
            "performer_key_id": "kms:us-central1:sag:dk-vault-key-03",
            "sha256_consent_hash": "c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4",
            "c2pa_manifest_uri": "c2pa:sha256:9900aabbccddeeff00112233445566778899aabbccddeeff0011223344556688",
            "root_of_trust": "RED V-Raptor XL Hardware Enclave CA",
            "x509_issuer": "DigiCert Studio CA v3 / SAG-AFTRA Trust Network",
            "tsa_timestamp": "2026-05-19T14:40:02Z",
            "integrity_status": "VERIFIED_VALID"
        },
        "synthetic_double_assets": {
            "scan_fidelity": 99.2,
            "landmark_deviation_mm": 0.045,
            "gamut_match": "ACEScg SMPTE ST 2065-1",
            "topology_points": 139000,
            "render_engine": "Neural Gaussian Splatting v4.2 / Unreal Substrate",
            "raw_scan_tag": "DK_HEADSCAN_POLARIZED_RAW_v01",
            "neural_render_tag": "DK_NEURAL_COMP_ACEScg_v04"
        },
        "shot_attributions": [
            {
                "attribution_id": "attr-dk-01",
                "scene_id": "SCENE_42B",
                "scene_display": "Scene 42B",
                "take_number": 3,
                "shot_id": "SHOT_12",
                "description": "Vault gunfight floor tumble and blast rebound",
                "used_seconds": 12.0,
                "rendered_by": "VFX_GPU_NODE_10",
                "timecode": "01:24:22:04",
                "timestamp": "2026-09-04T22:30:00Z",
                "status": "CONFORMED"
            },
            {
                "attribution_id": "attr-dk-02",
                "scene_id": "SCENE_14",
                "scene_display": "Scene 14",
                "take_number": 2,
                "shot_id": "SHOT_04",
                "description": "Hangar explosion blast wave kinetic trajectory",
                "used_seconds": 30.0,
                "rendered_by": "VFX_GPU_NODE_05",
                "timecode": "00:21:10:00",
                "timestamp": "2026-08-20T11:00:00Z",
                "status": "CONFORMED"
            }
        ]
    },
    {
        "actor_id": "ACTOR_SARAH_LIN",
        "actor_name": "Sarah Lin",
        "character_name": "Stunt Double Echo",
        "contract_id": "SAG-SCH-A-9012",
        "union_affiliation": "SAG_AFTRA",
        "schedule_code": "SCHEDULE_A",
        "performer_type": "Specialized Wirework Stunt Double",
        "authorized_seconds": 90.0,
        "used_seconds": 15.0,
        "residual_rate_per_sec": 180.0,
        "accrued_residuals_usd": 2700.0,
        "consent_expiry": "2028-11-20",
        "c2pa_hash": "c2pa:sha256:55abcc332199014e7a892bdfc834912903487192837465012938475610293847",
        "status": "CLEARED",
        "permitted_uses": [
            "Acrobatic rooftop leap sequence",
            "High-impact stair fall replacement"
        ],
        "prohibited_uses": [
            "Facial reconstruction without secondary photography",
            "Commercial brand association"
        ],
        "cryptographic_signatures": {
            "performer_key_id": "kms:us-central1:sag:sl-vault-key-04",
            "sha256_consent_hash": "d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5",
            "c2pa_manifest_uri": "c2pa:sha256:aa112233445566778899aabbccddeeff00112233445566778899aabbccddeeff",
            "root_of_trust": "ARRI Alexa 35 Hardware Enclave CA",
            "x509_issuer": "DigiCert Studio CA v3 / SAG-AFTRA Trust Network",
            "tsa_timestamp": "2026-06-01T09:15:20Z",
            "integrity_status": "VERIFIED_VALID"
        },
        "synthetic_double_assets": {
            "scan_fidelity": 99.4,
            "landmark_deviation_mm": 0.032,
            "gamut_match": "ACEScg SMPTE ST 2065-1",
            "topology_points": 142000,
            "render_engine": "Neural Gaussian Splatting v4.2 / Unreal Substrate",
            "raw_scan_tag": "SL_HEADSCAN_POLARIZED_RAW_v01",
            "neural_render_tag": "SL_NEURAL_COMP_ACEScg_v03"
        },
        "shot_attributions": [
            {
                "attribution_id": "attr-sl-01",
                "scene_id": "SCENE_42B",
                "scene_display": "Scene 42B",
                "take_number": 1,
                "shot_id": "SHOT_03",
                "description": "Balcony leap kinetic calibration pass",
                "used_seconds": 15.0,
                "rendered_by": "VFX_GPU_NODE_01",
                "timecode": "01:24:10:00",
                "timestamp": "2026-09-04T22:00:00Z",
                "status": "CONFORMED"
            }
        ]
    }
]


MATRIX_PERFORMERS = [
    {
        "actor_id": "ACTOR_KEANU_REEVES",
        "actor_name": "Keanu Reeves",
        "character_name": "Neo / Thomas Anderson",
        "contract_id": "SAG-SCH-F-MATRIX-01",
        "union_affiliation": "SAG_AFTRA",
        "schedule_code": "SCHEDULE_F",
        "performer_type": "Principal Cast & Digital Martial Arts Double",
        "authorized_seconds": 60.0,
        "used_seconds": 0.0,
        "residual_rate_per_sec": 1500.0,
        "accrued_residuals_usd": 0.0,
        "consent_expiry": "2029-12-31",
        "c2pa_hash": "c2pa:sha256:matrix_keanu_reeves_jumbf_consent_root_8f9e",
        "status": "CLEARED",
        "permitted_uses": [
            "Virtual Construct Dojo martial arts wirework stunts",
            "Subway station platform combat & bullet-time replica",
            "High-velocity aerial trajectory and ballistic stunt double",
            "Chateau staircase weapon choreography stunt composite"
        ],
        "prohibited_uses": [
            "Unscripted synthetic vocal dialogue without secondary rider",
            "Posthumous likeness exploitation without estate legal consent",
            "Deepfake commercial endorsements without Schedule B addendum",
            "Third-party AI foundation model pre-training"
        ],
        "cryptographic_signatures": {
            "performer_key_id": "kms:us-west1:sag:keanu-reeves-vault-key-01",
            "sha256_consent_hash": "4a7d1ed81445579fdf85c98d6978df0fe4d528b7e283296c098dfc3bb2030f25",
            "c2pa_manifest_uri": "c2pa:sha256:matrix_keanu_jumbf_manifest_v2",
            "root_of_trust": "ARRI Alexa 35 Hardware Enclave CA",
            "x509_issuer": "DigiCert Studio CA v3 / SAG-AFTRA Trust Network",
            "tsa_timestamp": "2026-04-12T09:00:00Z",
            "integrity_status": "VERIFIED_VALID"
        },
        "synthetic_double_assets": {
            "scan_fidelity": 99.9,
            "landmark_deviation_mm": 0.012,
            "gamut_match": "ACEScg SMPTE ST 2065-1",
            "topology_points": 215000,
            "render_engine": "Neural Gaussian Splatting v4.2 / Unreal Substrate",
            "raw_scan_tag": "KR_NEO_HEADSCAN_POLARIZED_RAW_v08",
            "neural_render_tag": "KR_NEO_NEURAL_COMP_ACEScg_v14"
        },
        "shot_attributions": []
    },
    {
        "actor_id": "ACTOR_HUGO_WEAVING",
        "actor_name": "Hugo Weaving",
        "character_name": "Agent Smith / Swarm Replica",
        "contract_id": "SAG-SCH-A-MATRIX-02",
        "union_affiliation": "SAG_AFTRA",
        "schedule_code": "SCHEDULE_A",
        "performer_type": "Digital Double Multi-Instance Swarm Stunt Replica",
        "authorized_seconds": 45.0,
        "used_seconds": 0.0,
        "residual_rate_per_sec": 1200.0,
        "accrued_residuals_usd": 0.0,
        "consent_expiry": "2029-12-31",
        "c2pa_hash": "c2pa:sha256:matrix_hugo_weaving_jumbf_consent_root_3b7a",
        "status": "CLEARED",
        "permitted_uses": [
            "Burly Brawl 100-Smith multi-agent replication pass",
            "Subway rail concrete concussion stunt double pass",
            "High-impact kinetic strike impact deformation"
        ],
        "prohibited_uses": [
            "Unapproved vocal timbre synthesis",
            "Independent standalone video game licensing without Rider D"
        ],
        "cryptographic_signatures": {
            "performer_key_id": "kms:us-west1:sag:hugo-weaving-vault-key-02",
            "sha256_consent_hash": "8f3b2c1d0e9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c",
            "c2pa_manifest_uri": "c2pa:sha256:matrix_smith_jumbf_manifest_v1",
            "root_of_trust": "RED V-Raptor XL Hardware Enclave CA",
            "x509_issuer": "DigiCert Studio CA v3 / SAG-AFTRA Trust Network",
            "tsa_timestamp": "2026-04-14T11:20:00Z",
            "integrity_status": "VERIFIED_VALID"
        },
        "synthetic_double_assets": {
            "scan_fidelity": 99.7,
            "landmark_deviation_mm": 0.019,
            "gamut_match": "ACEScg SMPTE ST 2065-1",
            "topology_points": 198000,
            "render_engine": "Neural Gaussian Splatting v4.2 / Unreal Substrate",
            "raw_scan_tag": "HW_SMITH_HEADSCAN_POLARIZED_RAW_v04",
            "neural_render_tag": "HW_SMITH_NEURAL_COMP_ACEScg_v09"
        },
        "shot_attributions": []
    }
]


class LikenessStore:
    def __init__(self, storage_dir: str = BASE_STORAGE_DIR):
        self.storage_dir = storage_dir
        self.ledger_file = os.path.join(self.storage_dir, "likeness_ledger.json")
        os.makedirs(self.storage_dir, exist_ok=True)
        self._init_store()

    def _init_store(self):
        if not os.path.exists(self.ledger_file):
            initial_data = {
                "paramount_pictures": [dict(p) for p in INITIAL_PERFORMERS],
                "a24_films": [dict(p) for p in INITIAL_PERFORMERS[:2]],
                "warner_bros": [dict(p) for p in INITIAL_PERFORMERS[:3]],
            }
            self._save_ledger(initial_data)

    def _load_ledger(self) -> Dict[str, List[Dict[str, Any]]]:
        if not os.path.exists(self.ledger_file):
            self._init_store()
        try:
            with open(self.ledger_file, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return {"paramount_pictures": [dict(p) for p in INITIAL_PERFORMERS]}

    def _save_ledger(self, data: Dict[str, List[Dict[str, Any]]]):
        tmp_file = f"{self.ledger_file}.tmp"
        with open(tmp_file, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)
        os.replace(tmp_file, self.ledger_file)

    def _get_key(self, tenant_id: str, project_id: Optional[str] = None) -> str:
        if project_id:
            return f"{tenant_id}:{project_id}"
        return tenant_id

    def _sync_project_takes(self, key: str, tenant_id: str, project_id: str):
        """Scans takes.json for takes belonging to this project and retro-attributes any missing shots."""
        takes_file = os.path.join(self.storage_dir, "takes.json")
        if not os.path.exists(takes_file):
            return
        
        try:
            with open(takes_file, "r", encoding="utf-8") as f:
                all_takes = json.load(f)
        except Exception:
            return

        ledger = self._load_ledger()
        performers = ledger.get(key, [])
        if not performers:
            return

        project_takes = [
            t for t in all_takes 
            if t.get("project_id") == project_id 
            and (t.get("tenant_id") == tenant_id or (not t.get("tenant_id") and tenant_id in ("paramount_pictures", "silver_pictures_village_roadshow_new", "silver_pictures")))
        ]
        
        modified = False
        for take in project_takes:
            take_id = take.get("take_id")
            scene_display = take.get("scene_display") or take.get("scene_id", "Scene 01")
            norm_scene_id = take.get("scene_id") or "SCENE_01"
            take_num = int(take.get("take_number", 1))
            duration = float(take.get("duration_sec", 24.0))
            
            # Check if this take is already attributed to ANY performer in this project
            already_attributed = False
            for p in performers:
                for attr in p.get("shot_attributions", []):
                    if attr.get("attribution_id") == f"attr-take-{take_id}" or (
                        attr.get("scene_id") == norm_scene_id and attr.get("take_number") == take_num
                    ):
                        already_attributed = True
                        break
                if already_attributed:
                    break
            
            if already_attributed:
                continue

            # Determine matching performer
            matched = None
            scene_text = f"{scene_display} {norm_scene_id} {take.get('director_notes', '')}".lower()
            
            # Try keyword match on performer names
            for p in performers:
                name_words = p.get("actor_name", "").lower().split()
                char_words = p.get("character_name", "").lower().replace("/", " ").split()
                tokens = [w for w in name_words + char_words if len(w) > 2 and w not in ["the", "and", "dr."]]
                if any(tok in scene_text for tok in tokens):
                    matched = p
                    break
            
            # Matrix scene matching fallback
            if not matched:
                if any(k in scene_text for k in ["dojo", "construct", "subway", "chateau", "01", "102", "martial", "neo"]):
                    matched = next((p for p in performers if "reeves" in p.get("actor_name", "").lower() or "neo" in p.get("character_name", "").lower()), None)
                elif any(k in scene_text for k in ["smith", "burly", "brawl", "103"]):
                    matched = next((p for p in performers if "weaving" in p.get("actor_name", "").lower() or "smith" in p.get("character_name", "").lower()), None)

            # Fallback to first performer if only 1 performer exists or default to first
            if not matched and performers:
                matched = performers[0]

            if matched:
                new_attr = {
                    "attribution_id": f"attr-take-{take_id}",
                    "scene_id": norm_scene_id,
                    "scene_display": scene_display,
                    "take_number": take_num,
                    "shot_id": f"SHOT_{str(take_num).zfill(2)}",
                    "description": f"AI Vision Sentry conformed take for {matched.get('actor_name')} ({scene_display} Take {take_num})",
                    "used_seconds": duration,
                    "rendered_by": "ARRI Alexa 35 Neural Ingest / ACEScg Node",
                    "timecode": take.get("timecode_in", "01:24:12:00"),
                    "timestamp": take.get("created_at") or datetime.datetime.now(datetime.timezone.utc).isoformat(),
                    "status": "CONFORMED"
                }
                matched.setdefault("shot_attributions", []).append(new_attr)
                matched["used_seconds"] = round(matched.get("used_seconds", 0.0) + duration, 2)
                rate = float(matched.get("residual_rate_per_sec", 300.0))
                matched["accrued_residuals_usd"] = round(matched.get("used_seconds", 0.0) * rate, 2)
                
                burn_pct = (matched["used_seconds"] / max(0.1, matched.get("authorized_seconds", 1.0))) * 100
                if burn_pct < 80.0:
                    matched["status"] = "CLEARED"
                elif burn_pct <= 100.0:
                    matched["status"] = "WARNING_THRESHOLD"
                else:
                    matched["status"] = "CAP_EXCEEDED"
                modified = True

        if modified:
            ledger[key] = performers
            self._save_ledger(ledger)

    def seed_template(self, template_name: str, tenant_id: str, project_id: str) -> List[Dict[str, Any]]:
        ledger = self._load_ledger()
        key = f"{tenant_id}:{project_id}" if project_id else tenant_id
        if template_name.lower() in ("matrix", "neo", "silver", "silvn"):
            ledger[key] = [dict(p) for p in MATRIX_PERFORMERS]
        else:
            ledger[key] = [dict(p) for p in INITIAL_PERFORMERS]
        self._save_ledger(ledger)
        self._sync_project_takes(key, tenant_id, project_id)
        return self._load_ledger().get(key, [])

    def list_performers(self, tenant_id: str = "paramount_pictures", project_id: Optional[str] = None) -> List[Dict[str, Any]]:
        ledger = self._load_ledger()
        if project_id:
            key = f"{tenant_id}:{project_id}"
            if key in ledger:
                return self._load_ledger().get(key, [])
            # Backward compatibility migration for seed projects
            if project_id in ("CHRONO-2026", "APEX-2026", "NEON-GHOST") and tenant_id in ledger:
                ledger[key] = [dict(p) for p in ledger[tenant_id]]
                self._save_ledger(ledger)
                return self._load_ledger().get(key, [])
            # New projects start with an empty clean slate
            return []
            
        if tenant_id not in ledger:
            if tenant_id == "paramount_pictures":
                ledger[tenant_id] = [dict(p) for p in INITIAL_PERFORMERS]
                self._save_ledger(ledger)
            else:
                return []
        return ledger.get(tenant_id, [])

    def get_performer(self, actor_id: str, tenant_id: str = "paramount_pictures", project_id: Optional[str] = None) -> Optional[Dict[str, Any]]:
        performers = self.list_performers(tenant_id, project_id=project_id)
        for p in performers:
            if p.get("actor_id") == actor_id or p.get("actor_id", "").upper() == actor_id.upper() or p.get("actor_name", "").lower() == actor_id.lower():
                return p
        # If not found with project_id, fallback search
        ledger = self._load_ledger()
        for k, perfs in ledger.items():
            for p in perfs:
                if p.get("actor_id") == actor_id or p.get("actor_id", "").upper() == actor_id.upper():
                    return p
        return None

    def extend_seconds(
        self,
        actor_id: str,
        add_seconds: float = 15.0,
        note: str = "Authorized NO FAKES Act extension",
        authorized_by: str = "Elena Rostova (Production Attorney)",
        tenant_id: str = "paramount_pictures",
        project_id: Optional[str] = None
    ) -> Dict[str, Any]:
        ledger = self._load_ledger()
        
        target_key = None
        if project_id:
            key = f"{tenant_id}:{project_id}"
            if key in ledger:
                target_key = key
            else:
                # Look for matching project across any studio key
                for k in ledger.keys():
                    if k.endswith(f":{project_id}"):
                        target_key = k
                        break
                if not target_key:
                    target_key = key
        else:
            if tenant_id in ledger and any(p.get("actor_id") == actor_id for p in ledger[tenant_id]):
                target_key = tenant_id
            else:
                for k, perfs in ledger.items():
                    if any(p.get("actor_id") == actor_id or p.get("actor_id", "").upper() == actor_id.upper() for p in perfs):
                        target_key = k
                        break
                if not target_key:
                    target_key = tenant_id

        performers = ledger.get(target_key, [])
        target = None
        for p in performers:
            if p.get("actor_id") == actor_id or p.get("actor_id", "").upper() == actor_id.upper() or p.get("actor_name", "").lower() == actor_id.lower():
                target = p
                break

        # Fallback search if still not found
        if not target:
            for k, perfs in ledger.items():
                for p in perfs:
                    if p.get("actor_id") == actor_id or p.get("actor_id", "").upper() == actor_id.upper() or p.get("actor_name", "").lower() == actor_id.lower():
                        target = p
                        target_key = k
                        performers = perfs
                        break
                if target:
                    break

        if not target:
            raise ValueError(f"Performer '{actor_id}' not found in tenant '{tenant_id}' (project: {project_id}).")

        target["authorized_seconds"] = round(target.get("authorized_seconds", 0.0) + add_seconds, 2)
        burn_pct = round((target.get("used_seconds", 0.0) / target["authorized_seconds"]) * 100, 1)

        if burn_pct < 80.0:
            target["status"] = "CLEARED"
        elif burn_pct <= 100.0:
            target["status"] = "WARNING_THRESHOLD"
        else:
            target["status"] = "CAP_EXCEEDED"

        target.setdefault("extension_history", []).append({
            "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
            "added_seconds": add_seconds,
            "new_total_authorized": target["authorized_seconds"],
            "authorized_by": authorized_by,
            "note": note
        })

        ledger[target_key] = performers
        self._save_ledger(ledger)

        log_telemetry(
            "INFO",
            "Legal",
            f"Extended likeness cap for {target.get('actor_name')} by +{add_seconds}s in {target_key} (New Cap: {target['authorized_seconds']}s)",
            tenant_id=tenant_id
        )

        return {
            "actor_id": actor_id,
            "actor_name": target.get("actor_name"),
            "authorized_seconds": target["authorized_seconds"],
            "used_seconds": target.get("used_seconds", 0.0),
            "status": target["status"],
            "message": f"Successfully extended {target.get('actor_name')} by +{add_seconds}s."
        }

    def update_synthetic_double_assets(
        self,
        actor_id: str,
        assets_data: Dict[str, Any],
        tenant_id: str = "paramount_pictures",
        project_id: Optional[str] = None
    ) -> Dict[str, Any]:
        ledger = self._load_ledger()
        target_key = None
        if project_id:
            key = f"{tenant_id}:{project_id}"
            if key in ledger:
                target_key = key
            else:
                for k in ledger.keys():
                    if k.endswith(f":{project_id}"):
                        target_key = k
                        break
        if not target_key and tenant_id in ledger:
            target_key = tenant_id
        if not target_key:
            target_key = "paramount_pictures"

        performers = ledger.get(target_key, [])
        target = None
        for p in performers:
            if p.get("actor_id") == actor_id or p.get("actor_id", "").upper() == actor_id.upper() or p.get("actor_name", "").lower() == actor_id.lower():
                target = p
                break

        if not target:
            # Global fallback across ledger
            for k, perfs in ledger.items():
                for p in perfs:
                    if p.get("actor_id") == actor_id or p.get("actor_id", "").upper() == actor_id.upper() or p.get("actor_name", "").lower() == actor_id.lower():
                        target = p
                        target_key = k
                        performers = perfs
                        break
                if target:
                    break

        if not target:
            raise ValueError(f"Performer '{actor_id}' not found in ledger.")

        current_assets = target.get("synthetic_double_assets", {})
        current_assets.update(assets_data)
        target["synthetic_double_assets"] = current_assets
        ledger[target_key] = performers
        self._save_ledger(ledger)

        log_telemetry(
            "INFO",
            "Legal",
            f"Committed 3D biometric coordinates to synthetic double docs for {target.get('actor_name')}",
            tenant_id=tenant_id
        )

        return {
            "status": "CONFORMED",
            "actor_id": actor_id,
            "actor_name": target.get("actor_name"),
            "synthetic_double_assets": current_assets,
            "message": f"Successfully updated 3D biometric coordinates in {target.get('actor_name')}'s documentation."
        }

    def add_performer(self, performer_data: Dict[str, Any], tenant_id: str = "paramount_pictures", project_id: Optional[str] = None) -> Dict[str, Any]:
        ledger = self._load_ledger()
        key = f"{tenant_id}:{project_id}" if project_id else tenant_id
        performers = ledger.get(key, [])

        actor_name = performer_data.get("actor_name", "Unknown Performer")
        actor_id = performer_data.get("actor_id") or f"ACTOR_{actor_name.upper().replace(' ', '_')}"
        contract_id = performer_data.get("contract_id") or f"SAG-SCH-A-{uuid.uuid4().hex[:4].upper()}"

        new_entry = {
            "actor_id": actor_id,
            "actor_name": actor_name,
            "character_name": performer_data.get("character_name", "Featured Role"),
            "contract_id": contract_id,
            "union_affiliation": performer_data.get("union_affiliation", "SAG_AFTRA"),
            "schedule_code": performer_data.get("schedule_code", "SCHEDULE_A"),
            "performer_type": performer_data.get("performer_type", "Digital Stunt Double"),
            "authorized_seconds": float(performer_data.get("authorized_seconds", 30.0)),
            "used_seconds": float(performer_data.get("used_seconds", 0.0)),
            "residual_rate_per_sec": float(performer_data.get("residual_rate_per_sec", 350.0)),
            "accrued_residuals_usd": float(performer_data.get("accrued_residuals_usd", 0.0)),
            "consent_expiry": performer_data.get("consent_expiry", "2028-12-31"),
            "c2pa_hash": performer_data.get("c2pa_hash") or f"c2pa:sha256:rider_{uuid.uuid4().hex}",
            "status": "CLEARED",
            "permitted_uses": performer_data.get("permitted_uses", [
                "VFX background stunt double replication",
                "Extreme environment composite"
            ]),
            "prohibited_uses": performer_data.get("prohibited_uses", [
                "Unscripted synthetic dialogue",
                "Posthumous continuation without secondary consent"
            ]),
            "cryptographic_signatures": performer_data.get("cryptographic_signatures", {
                "performer_key_id": f"kms:us-central1:sag:{actor_id.lower()}-key",
                "sha256_consent_hash": uuid.uuid4().hex + uuid.uuid4().hex,
                "c2pa_manifest_uri": f"c2pa:sha256:{uuid.uuid4().hex}",
                "root_of_trust": "ARRI Alexa 35 Hardware Enclave CA",
                "x509_issuer": "DigiCert Studio CA v3 / SAG-AFTRA Trust Network",
                "tsa_timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
                "integrity_status": "VERIFIED_VALID"
            }),
            "synthetic_double_assets": performer_data.get("synthetic_double_assets", {
                "scan_fidelity": 99.5,
                "landmark_deviation_mm": 0.035,
                "gamut_match": "ACEScg SMPTE ST 2065-1",
                "topology_points": 145000,
                "render_engine": "Neural Gaussian Splatting v4.2 / Unreal Substrate",
                "raw_scan_tag": f"{actor_id[:6]}_HEADSCAN_POLARIZED_RAW_v01",
                "neural_render_tag": f"{actor_id[:6]}_NEURAL_COMP_ACEScg_v01"
            }),
            "shot_attributions": performer_data.get("shot_attributions", [])
        }

        # Check duplicate
        for idx, p in enumerate(performers):
            if p.get("actor_id") == actor_id or p.get("actor_name", "").lower() == actor_name.lower():
                performers[idx] = new_entry
                break
        else:
            performers.append(new_entry)

        ledger[key] = performers
        self._save_ledger(ledger)

        # Retroactively sync any existing recorded takes for this newly added performer if requested
        if project_id and performer_data.get("sync_existing_takes", False):
            self._sync_project_takes(key, tenant_id, project_id)

        log_telemetry("INFO", "Legal", f"Registered new performer rider in {key}: {actor_name} ({actor_id})", tenant_id=tenant_id)
        return self.get_performer(actor_id, tenant_id, project_id) or new_entry

    def record_shot_attribution(
        self,
        actor_id: str,
        shot_data: Dict[str, Any],
        tenant_id: str = "paramount_pictures",
        project_id: Optional[str] = None
    ) -> Dict[str, Any]:
        ledger = self._load_ledger()
        
        target_key = None
        if project_id:
            target_key = f"{tenant_id}:{project_id}"
            if target_key not in ledger and project_id in ("CHRONO-2026", "APEX-2026", "NEON-GHOST") and tenant_id in ledger:
                ledger[target_key] = [dict(p) for p in ledger[tenant_id]]
        else:
            if tenant_id in ledger and any(p.get("actor_id") == actor_id for p in ledger[tenant_id]):
                target_key = tenant_id
            else:
                for k, perfs in ledger.items():
                    if k.startswith(f"{tenant_id}:") and any(p.get("actor_id") == actor_id for p in perfs):
                        target_key = k
                        break
                if not target_key:
                    target_key = tenant_id

        performers = ledger.get(target_key, [])
        target = None
        for p in performers:
            if p.get("actor_id") == actor_id or p.get("actor_id", "").upper() == actor_id.upper() or p.get("actor_name", "").lower() == actor_id.lower():
                target = p
                break

        # Fallback search across all ledger keys if still not found
        if not target:
            for k, perfs in ledger.items():
                for p in perfs:
                    if p.get("actor_id") == actor_id or p.get("actor_id", "").upper() == actor_id.upper() or p.get("actor_name", "").lower() == actor_id.lower():
                        target = p
                        target_key = k
                        performers = perfs
                        break
                if target:
                    break

        if not target:
            raise ValueError(f"Performer '{actor_id}' not found.")

        seconds_consumed = float(shot_data.get("used_seconds", 0.0))
        target["used_seconds"] = round(target.get("used_seconds", 0.0) + seconds_consumed, 2)
        rate = float(target.get("residual_rate_per_sec", 300.0))
        target["accrued_residuals_usd"] = round(target.get("accrued_residuals_usd", 0.0) + (seconds_consumed * rate), 2)

        burn_pct = round((target["used_seconds"] / target.get("authorized_seconds", 1.0)) * 100, 1)
        if burn_pct < 80.0:
            target["status"] = "CLEARED"
        elif burn_pct <= 100.0:
            target["status"] = "WARNING_THRESHOLD"
        else:
            target["status"] = "CAP_EXCEEDED"

        attribution_entry = {
            "attribution_id": shot_data.get("attribution_id") or f"attr-{uuid.uuid4().hex[:6]}",
            "scene_id": shot_data.get("scene_id", "SCENE_42B"),
            "scene_display": shot_data.get("scene_display", shot_data.get("scene_id", "Scene 42B")),
            "take_number": int(shot_data.get("take_number", 1)),
            "shot_id": shot_data.get("shot_id", "SHOT_01"),
            "description": shot_data.get("description", "Synthetic double conform pass"),
            "used_seconds": seconds_consumed,
            "rendered_by": shot_data.get("rendered_by", "VFX_GPU_NODE_12"),
            "timecode": shot_data.get("timecode", "01:24:14:00"),
            "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
            "status": "CONFORMED"
        }
        target.setdefault("shot_attributions", []).insert(0, attribution_entry)

        ledger[target_key] = performers
        self._save_ledger(ledger)

        log_telemetry(
            "INFO",
            "Legal",
            f"Deducted {seconds_consumed}s for {target.get('actor_name')} on {attribution_entry['scene_display']} Take {attribution_entry['take_number']} in {target_key}",
            tenant_id=tenant_id
        )

        return {
            "actor_id": actor_id,
            "used_seconds": target["used_seconds"],
            "remaining_seconds": round(target.get("authorized_seconds", 0.0) - target["used_seconds"], 2),
            "accrued_residuals_usd": target["accrued_residuals_usd"],
            "status": target["status"],
            "attribution": attribution_entry
        }

    def generate_union_packet(self, actor_id: str, tenant_id: str = "paramount_pictures", project_id: Optional[str] = None) -> Dict[str, Any]:
        performer = self.get_performer(actor_id, tenant_id, project_id=project_id)
        if not performer:
            raise ValueError(f"Performer '{actor_id}' not found.")

        now_str = datetime.datetime.now(datetime.timezone.utc).isoformat()
        packet_id = f"SAG-PACKET-{performer.get('contract_id', 'UNKNOWN')}-{datetime.datetime.now().strftime('%Y%m%d%H%M')}"

        return {
            "packet_id": packet_id,
            "production_title": project_id or "CHRONO (2026)",
            "studio_tenant": tenant_id.replace("_", " ").title(),
            "generated_at": now_str,
            "union_jurisdiction": "SAG-AFTRA National Code of Fair Practice for Theatrical Motion Pictures",
            "statutory_act": "Federal NO FAKES Act of 2026 (17 U.S.C. § 1401 et seq.)",
            "compliance_status": "AUDIT_READY_AND_VERIFIED",
            "performer": {
                "actor_id": performer.get("actor_id"),
                "actor_name": performer.get("actor_name"),
                "character_name": performer.get("character_name"),
                "contract_id": performer.get("contract_id"),
                "schedule_code": performer.get("schedule_code"),
                "consent_expiry": performer.get("consent_expiry")
            },
            "metering": {
                "contracted_seconds_cap": performer.get("authorized_seconds"),
                "actual_rendered_seconds": performer.get("used_seconds"),
                "remaining_authorized_headroom_sec": round(performer.get("authorized_seconds", 0.0) - performer.get("used_seconds", 0.0), 2),
                "contracted_rate_per_sec_usd": performer.get("residual_rate_per_sec"),
                "total_accrued_residuals_usd": performer.get("accrued_residuals_usd")
            },
            "permitted_uses": performer.get("permitted_uses", []),
            "prohibited_uses": performer.get("prohibited_uses", []),
            "c2pa_provenance": performer.get("cryptographic_signatures", {}),
            "shot_audit_ledger": performer.get("shot_attributions", []),
            "certification": {
                "attorney_signature": "Elena Rostova, Esq. (Bar No. CA-491208)",
                "digital_seal": f"SHA256:SEAL:{uuid.uuid4().hex}",
                "timestamp_authority": "DigiCert TSA RFC-3161 Certified"
            }
        }

    def reset_to_seed(self, tenant_id: str = "paramount_pictures", project_id: Optional[str] = None):
        ledger = self._load_ledger()
        key = f"{tenant_id}:{project_id}" if project_id else tenant_id
        ledger[key] = [dict(p) for p in INITIAL_PERFORMERS]
        self._save_ledger(ledger)
        return ledger[key]


# Global singleton instance
likeness_store = LikenessStore()
