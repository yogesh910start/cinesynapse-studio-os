import pytest
import pytest_asyncio
import io
from httpx import AsyncClient, ASGITransport
from backend.main import app

@pytest.mark.asyncio
async def test_multi_tenant_isolation():
    """Verify ClickHouse multi-tenant partition isolation across Paramount, A24, and Warner Bros."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # 1. Fetch Paramount production graph
        res_paramount = await ac.get("/api/v1/production-graph", headers={"x-tenant-id": "paramount_pictures"})
        assert res_paramount.status_code == 200
        data_p = res_paramount.json()["dataset"]
        assert data_p["tenant_id"] == "paramount_pictures"
        assert data_p["active_project"] == "CHRONO-2026"
        assert len(data_p["sentries"]) > 0

        # 2. Fetch A24 production graph
        res_a24 = await ac.get("/api/v1/production-graph", headers={"x-tenant-id": "a24_films"})
        assert res_a24.status_code == 200
        data_a = res_a24.json()["dataset"]
        assert data_a["tenant_id"] == "a24_films"
        assert data_a["active_project"] == "NEON-GHOST"

        # 3. Fetch Warner Bros production graph
        res_wb = await ac.get("/api/v1/production-graph", headers={"x-tenant-id": "warner_bros"})
        assert res_wb.status_code == 200
        data_wb = res_wb.json()["dataset"]
        assert data_wb["tenant_id"] == "warner_bros"
        assert data_wb["active_project"] == "APEX-2026"

        # Ensure no cross-contamination between projects
        assert data_p["active_project"] != data_a["active_project"]
        assert data_a["active_project"] != data_wb["active_project"]

@pytest.mark.asyncio
async def test_sentry_drift_remediation():
    """Verify that triggering and remediating fractional timecode drift applies 0.1% audio pull-up."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # Trigger timecode drift scenario
        res_trig = await ac.post(
            "/api/v1/scenarios/trigger",
            headers={"x-tenant-id": "paramount_pictures"},
            json={"scenario_id": "timecode_drift"}
        )
        assert res_trig.status_code == 200

        # Remediate drift with pull-up
        res_rem = await ac.post(
            "/api/v1/sentries/remediate",
            headers={"x-tenant-id": "paramount_pictures"},
            json={"category": "TIMECODE_DRIFT", "action": "APPLY_0.1_PERCENT_AUDIO_PULL_UP"}
        )
        assert res_rem.status_code == 200
        rem_data = res_rem.json()
        assert rem_data["status"] == "REMEDIATED"
        assert rem_data["sentry"]["category"] == "TIMECODE_DRIFT"

@pytest.mark.asyncio
async def test_sag_likeness_extension_and_add():
    """Verify SAG-AFTRA Schedule A digital likeness extension and new performer registration."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # 1. Check initial Marcus Vance likeness
        res_init = await ac.get("/api/v1/likeness-ledger", headers={"x-tenant-id": "paramount_pictures"})
        assert res_init.status_code == 200
        marcus = next(a for a in res_init.json() if a["actor_id"] == "ACTOR_MARCUS_VANCE")
        initial_auth = marcus["authorized_seconds"]

        # 2. Extend likeness by +15s
        res_ext = await ac.post(
            "/api/v1/likeness/extend",
            headers={"x-tenant-id": "paramount_pictures"},
            json={"actor_id": "ACTOR_MARCUS_VANCE", "add_seconds": 15.0}
        )
        assert res_ext.status_code == 200
        ext_data = res_ext.json()
        assert ext_data["actor"]["authorized_seconds"] == initial_auth + 15.0
        assert ext_data["actor"]["status"] == "CLEARED"

        # 3. Add new performer rider
        new_actor = {
            "actor_id": "ACTOR_SARAH_CONNOR",
            "actor_name": "Sarah Connor",
            "contract_id": "SAG-2026-9912",
            "union_affiliation": "SAG_AFTRA",
            "schedule_code": "SCHEDULE_A",
            "authorized_seconds": 45.0,
            "used_seconds": 5.0,
            "residual_rate_per_sec": 420.0,
            "accrued_residuals_usd": 2100.0,
            "consent_expiry": "2029-01-01",
            "c2pa_hash": "c2pa:sha256:rider_sarah",
            "status": "CLEARED"
        }
        res_add = await ac.post(
            "/api/v1/likeness/add",
            headers={"x-tenant-id": "paramount_pictures"},
            json=new_actor
        )
        assert res_add.status_code == 200
        assert res_add.json()["actor"]["actor_name"] == "Sarah Connor"

@pytest.mark.asyncio
async def test_territory_compliance_and_inpaint_dispatch():
    """Verify 190-Territory compliance inspection and ShotGrid inpaint task dispatch."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # 1. Fetch compliance
        res_comp = await ac.get("/api/v1/compliance", headers={"x-tenant-id": "paramount_pictures"})
        assert res_comp.status_code == 200
        comp_list = res_comp.json()
        assert len(comp_list) >= 4

        # 2. Dispatch inpaint for Singapore (SG)
        res_disp = await ac.post(
            "/api/v1/compliance/dispatch",
            headers={"x-tenant-id": "paramount_pictures"},
            json={"territory_iso": "SG"}
        )
        assert res_disp.status_code == 200
        disp_data = res_disp.json()
        assert "shotgrid" in disp_data
        assert disp_data["shotgrid"]["task_id"].startswith("SG-TASK-")
        assert disp_data["compliance"]["status"] == "DISPATCHED"
        assert disp_data["compliance"]["territory"]["risk_level"] == "CLEARED"

@pytest.mark.asyncio
async def test_timeline_ingest_and_sample():
    """Verify OpenTimelineIO sample loading and multi-track file upload parsing."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # 1. Get sample timeline
        res_sample = await ac.get("/api/v1/timeline/sample")
        assert res_sample.status_code == 200
        sample_data = res_sample.json()
        assert sample_data["timeline_name"] == "chrono_reel01_conform.otio"
        assert len(sample_data["tracks"]) >= 3

        # 2. Upload and parse synthetic .otio file
        fake_otio = b'{"OTIO_SCHEMA": "Timeline.1", "name": "test_reel.otio", "tracks": []}'
        files = {"file": ("test_reel.otio", io.BytesIO(fake_otio), "application/json")}
        res_upload = await ac.post("/api/v1/timeline/upload", files=files)
        assert res_upload.status_code == 200
        up_data = res_upload.json()
        assert up_data["file_name"] == "test_reel.otio"
        assert up_data["size_bytes"] == len(fake_otio)

@pytest.mark.asyncio
async def test_voice_scratchpad_and_copilot():
    """Verify voice scratchpad creation with SMPTE lock and Gemini Copilot interaction."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # 1. Create a voice note
        note_payload = {
            "memo_id": "memo-test-771",
            "timecode_smpte": "01:24:12:04",
            "transcript": "Lens distortion on Cooke 40mm left border.",
            "assigned_department": "VFX",
            "shotgrid_ticket_id": "SG-TASK-7710",
            "created_at": "2026-09-05T00:00:00Z"
        }
        res_note = await ac.post("/api/v1/voice-notes", json=note_payload)
        assert res_note.status_code == 200
        assert res_note.json()["memo_id"] == "memo-test-771"

        # Fetch voice notes
        res_notes_list = await ac.get("/api/v1/voice-notes")
        assert res_notes_list.status_code == 200
        assert any(n["memo_id"] == "memo-test-771" for n in res_notes_list.json())

        # 2. Copilot chat query
        res_copilot = await ac.post(
            "/api/v1/copilot/chat",
            headers={"x-tenant-id": "paramount_pictures"},
            json={"message": "Audit Marcus Vance likeness cap status"}
        )
        assert res_copilot.status_code == 200
        assert "reply" in res_copilot.json()
        assert len(res_copilot.json()["reply"]) > 0

@pytest.mark.asyncio
async def test_auth_token_issuance():
    """Verify JWT bearer token issuance for multi-tenant personas."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.post("/api/v1/auth/token?tenant_id=paramount_pictures")
        assert res.status_code == 200
        token_data = res.json()
        assert "access_token" in token_data
        assert token_data["token_type"] == "bearer"
        assert token_data["tenant_id"] == "paramount_pictures"

@pytest.mark.asyncio
async def test_war_room_channels_and_messages():
    """Verify encrypted War Room channels and SMPTE-timecoded message dispatch."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # 1. Fetch channels
        res_ch = await ac.get("/api/v1/war-room/channels")
        assert res_ch.status_code == 200
        channels = res_ch.json()
        assert any(c["id"] == "#on-set-camera-comms" for c in channels)
        assert any(c["id"] == "#vfx-legal-clearance" for c in channels)

        # 2. Post a new message
        new_msg = {
            "message_id": "msg-test-99",
            "channel_id": "#on-set-camera-comms",
            "sender_id": "klaus-dit",
            "sender_name": "Klaus Richter",
            "sender_role": "Lead DIT",
            "text": "Timecode locked to 24.000 fps via Ambient ACL204 Genlock.",
            "timecode_smpte": "01:24:18:00",
            "asset_name": "Scene42B_Take04_Cooke40mm_RAW.mov",
            "asset_type": "VIDEO",
            "c2pa_status": "VERIFIED_HARDWARE_SIGNATURE",
            "created_at": "2026-09-05T01:00:00Z"
        }
        res_post = await ac.post("/api/v1/war-room/messages", json=new_msg)
        assert res_post.status_code == 200
        assert res_post.json()["message_id"] == "msg-test-99"

        # 3. Fetch messages for channel
        res_msgs = await ac.get("/api/v1/war-room/messages?channel_id=%23on-set-camera-comms")
        assert res_msgs.status_code == 200
        assert any(m["message_id"] == "msg-test-99" for m in res_msgs.json())

@pytest.mark.asyncio
async def test_war_room_meeting_transcription():
    """Verify live meeting huddle transcription with Gemini Voice-to-Action extraction."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.post(
            "/api/v1/war-room/meetings/transcribe",
            headers={"x-tenant-id": "paramount_pictures"},
            json={
                "speaker": "Elena Rostova (Legal)",
                "text": "Approved Marcus Vance +15s digital likeness extension.",
                "timecode": "01:24:22:15"
            }
        )
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "TRANSCRIBED"
        assert len(data["extracted_decisions"]) > 0

@pytest.mark.asyncio
async def test_war_room_forensic_watermark():
    """Verify TPN+ Level 3 dynamic forensic session watermarking."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.post(
            "/api/v1/war-room/watermark",
            headers={"x-tenant-id": "paramount_pictures"},
            json={"user_id": "david-director", "asset_name": "Scene42B_Take04.mov"}
        )
        assert res.status_code == 200
        data = res.json()
        assert "CONFIDENTIAL" in data["watermark_text"]
        assert data["watermark_hash"].startswith("TPN53:C2PA:")
        assert data["tpn_compliance"] == "TPN+ Level 3 Certified"

@pytest.mark.asyncio
async def test_war_room_external_dispatch():
    """Verify external tokenized relay to Slack, Teams, and WhatsApp pager."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # Slack dispatch
        res_slack = await ac.post(
            "/api/v1/war-room/external-dispatch",
            json={"platform": "slack", "channel": "#production-sentry", "message": "High-priority alert"}
        )
        assert res_slack.status_code == 200

        # WhatsApp Pager dispatch (blocks raw video, sends tokenized link only)
        res_wa = await ac.post(
            "/api/v1/war-room/external-dispatch",
            json={"platform": "whatsapp_pager", "channel": "+15550192834", "message": "Meal penalty breach alert"}
        )
        assert res_wa.status_code == 200
        assert res_wa.json()["recipient_type"] == "URGENT_PAGER_ONLY"

@pytest.mark.asyncio
async def test_auth_logout_and_session_revocation():
    """Verify session termination and RLS token revocation redirect."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.post(
            "/api/v1/auth/logout",
            headers={"x-tenant-id": "paramount_pictures"}
        )
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "LOGGED_OUT"
        assert data["redirect_to"] == "tenant-login"
        assert data["tenant_id"] == "paramount_pictures"
