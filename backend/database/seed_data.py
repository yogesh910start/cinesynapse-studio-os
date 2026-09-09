import datetime

TENANTS_SEED = {
    "paramount_pictures": {
        "tenant_id": "paramount_pictures",
        "name": "Paramount Pictures Studio OS",
        "active_project": "CHRONO-2026",
        "rls_status": "ENFORCED",
        "projects": [
            {
                "project_id": "CHRONO-2026",
                "title": "Chrono 2026 (Theatrical Feature)",
                "director": "Denis Villeneuve",
                "total_frames": 1248912,
                "active_scene": "SCENE_42B",
                "active_shot": "SHOT_14",
                "active_take": 4,
                "timecode": "01:24:12:04",
                "camera_fps": 23.976,
                "target_fps": 24.000,
                "lens": "Cooke Anamorphic /i 40mm T/2.0",
                "color_space": "ACEScg (AP1 Primaries)",
                "c2pa_status": "VERIFIED",
                "c2pa_hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
            }
        ],
        "likeness": [
            {
                "actor_id": "ACTOR_MARCUS_VANCE",
                "actor_name": "Marcus Vance",
                "contract_id": "SAG-SCH-A-8942",
                "union_affiliation": "SAG_AFTRA",
                "schedule_code": "SCHEDULE_A",
                "authorized_seconds": 60.0,
                "used_seconds": 52.2,
                "residual_rate_per_sec": 300.0,
                "accrued_residuals_usd": 28310.0,
                "consent_expiry": "2027-12-31",
                "c2pa_hash": "c2pa:sha256:7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069",
                "status": "CLEARED"
            },
            {
                "actor_id": "ACTOR_ELENA_ROSTOVA",
                "actor_name": "Elena Rostova",
                "contract_id": "SAG-SCH-F-1102",
                "union_affiliation": "SAG_AFTRA",
                "schedule_code": "SCHEDULE_F",
                "authorized_seconds": 120.0,
                "used_seconds": 44.5,
                "residual_rate_per_sec": 450.0,
                "accrued_residuals_usd": 20025.0,
                "consent_expiry": "2028-06-30",
                "c2pa_hash": "c2pa:sha256:1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b",
                "status": "CLEARED"
            }
        ],
        "sentries": [
            {
                "event_id": "evt-sentry-01",
                "category": "TIMECODE_DRIFT",
                "severity": "CRITICAL",
                "scene_id": "SCENE_42B",
                "shot_id": "SHOT_14",
                "details": "Camera B clocked at 23.976 fps on 24.000 fps project. Cumulative drift: +7.2s over 2h.",
                "financial_exposure_usd": 42000.0,
                "auto_remediation": "APPLY_0.1_PERCENT_AUDIO_PULL_UP",
                "timestamp": "2026-09-04T23:24:12Z"
            },
            {
                "event_id": "evt-sentry-04",
                "category": "MEAL_PENALTY",
                "severity": "CRITICAL",
                "scene_id": "SCENE_42B",
                "shot_id": "SHOT_14",
                "details": "Filming continuous 6h 32m without meal break. 140 crew members breached Tier 2 ($35/head).",
                "financial_exposure_usd": 3500.0,
                "auto_remediation": "CALL_IMMEDIATE_CATERING_WRAP",
                "timestamp": "2026-09-04T23:28:00Z"
            },
            {
                "event_id": "evt-sentry-07",
                "category": "PROP_DESYNC",
                "severity": "WARNING",
                "scene_id": "SCENE_42B",
                "shot_id": "SHOT_14",
                "details": "Whiskey glass prop fill level: 42% (Take 3) vs 68% (Take 4). Continuity flag triggered.",
                "financial_exposure_usd": 15000.0,
                "auto_remediation": "DISPATCH_SCRIPT_SUPERVISOR_ALERT",
                "timestamp": "2026-09-04T23:29:15Z"
            }
        ],
        "compliance": [
            {"territory_iso": "US", "territory_name": "United States (MPA)", "risk_level": "CLEARED", "infractions_count": 0, "inpaint_required": False, "status": "PG-13 RATED"},
            {"territory_iso": "GB", "territory_name": "United Kingdom (BBFC)", "risk_level": "CLEARED", "infractions_count": 0, "inpaint_required": False, "status": "12A RATED"},
            {"territory_iso": "SG", "territory_name": "Singapore (IMDA)", "risk_level": "WARNING", "infractions_count": 1, "inpaint_required": True, "status": "INPAINT_PENDING"},
            {"territory_iso": "AE", "territory_name": "United Arab Emirates", "risk_level": "BANNED", "infractions_count": 2, "inpaint_required": True, "status": "REPLACE_BILLBOARD"}
        ]
    },
    "a24_films": {
        "tenant_id": "a24_films",
        "name": "A24 Production Hub",
        "active_project": "NEON-GHOST",
        "rls_status": "ENFORCED",
        "projects": [
            {
                "project_id": "NEON-GHOST",
                "title": "Neon Ghost (Indie Thriller)",
                "director": "Ari Aster",
                "total_frames": 458900,
                "active_scene": "SCENE_12",
                "active_shot": "SHOT_03",
                "active_take": 2,
                "timecode": "00:45:10:18",
                "camera_fps": 24.000,
                "target_fps": 24.000,
                "lens": "Kowa Prominar Anamorphic 50mm",
                "color_space": "ACEScg",
                "c2pa_status": "VERIFIED",
                "c2pa_hash": "a24c2pa7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd2001"
            }
        ],
        "likeness": [
            {
                "actor_id": "ACTOR_FLORENCE_PUGH",
                "actor_name": "Florence Pugh",
                "contract_id": "A24-AGR-0042",
                "union_affiliation": "SAG_AFTRA",
                "schedule_code": "SCHEDULE_A",
                "authorized_seconds": 30.0,
                "used_seconds": 8.5,
                "residual_rate_per_sec": 500.0,
                "accrued_residuals_usd": 4250.0,
                "consent_expiry": "2028-12-31",
                "c2pa_hash": "c2pa:sha256:pugh7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd2001",
                "status": "CLEARED"
            }
        ],
        "sentries": [],
        "compliance": [
            {"territory_iso": "US", "territory_name": "United States", "risk_level": "CLEARED", "infractions_count": 0, "inpaint_required": False, "status": "R RATED"}
        ]
    },
    "warner_bros": {
        "tenant_id": "warner_bros",
        "name": "Warner Bros. Discovery OS",
        "active_project": "APEX-2026",
        "rls_status": "ENFORCED",
        "projects": [
            {
                "project_id": "APEX-2026",
                "title": "Apex: The Final Frontier",
                "director": "Christopher Nolan",
                "total_frames": 2104000,
                "active_scene": "SCENE_88",
                "active_shot": "SHOT_01",
                "active_take": 1,
                "timecode": "02:10:04:12",
                "camera_fps": 24.000,
                "target_fps": 24.000,
                "lens": "ARRI Signature Prime 24mm T/1.8",
                "color_space": "ACES 2065-1 (AP0)",
                "c2pa_status": "VERIFIED",
                "c2pa_hash": "wb7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069"
            }
        ],
        "likeness": [],
        "sentries": [],
        "compliance": []
    }
}
