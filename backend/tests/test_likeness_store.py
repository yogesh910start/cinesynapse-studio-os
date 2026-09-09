import pytest
from httpx import AsyncClient, ASGITransport
from backend.main import app
from backend.storage.likeness_store import LikenessStore, likeness_store

@pytest.fixture
def clean_store(tmp_path):
    store = LikenessStore(storage_dir=str(tmp_path))
    return store

def test_store_initialization(clean_store):
    performers = clean_store.list_performers("paramount_pictures")
    assert len(performers) >= 4
    marcus = next(p for p in performers if p["actor_id"] == "ACTOR_MARCUS_VANCE")
    assert marcus["actor_name"] == "Marcus Vance"
    assert marcus["authorized_seconds"] == 60.0
    assert marcus["used_seconds"] == 52.2
    assert len(marcus["shot_attributions"]) == 5
    assert len(marcus["permitted_uses"]) > 0
    assert len(marcus["prohibited_uses"]) > 0

def test_extend_seconds_persists(clean_store):
    res = clean_store.extend_seconds(
        actor_id="ACTOR_MARCUS_VANCE",
        add_seconds=15.0,
        note="Court-approved stunt extension",
        tenant_id="paramount_pictures"
    )
    assert res["authorized_seconds"] == 75.0
    assert res["status"] == "CLEARED"  # 52.2 / 75.0 = 69.6% < 80%

    # Verify persistence by reloading from disk
    reloaded_store = LikenessStore(storage_dir=clean_store.storage_dir)
    marcus = reloaded_store.get_performer("ACTOR_MARCUS_VANCE", "paramount_pictures")
    assert marcus["authorized_seconds"] == 75.0
    assert len(marcus["extension_history"]) == 1

def test_add_performer_persists(clean_store):
    new_performer = {
        "actor_id": "ACTOR_CHRISTIAN_BALE",
        "actor_name": "Christian Bale",
        "character_name": "John Connor",
        "contract_id": "SAG-SCH-F-9901",
        "schedule_code": "SCHEDULE_F",
        "authorized_seconds": 90.0,
        "residual_rate_per_sec": 500.0,
        "consent_expiry": "2029-12-31"
    }
    added = clean_store.add_performer(new_performer, "paramount_pictures")
    assert added["actor_name"] == "Christian Bale"
    assert added["status"] == "CLEARED"

    # Reload from disk
    reloaded = LikenessStore(storage_dir=clean_store.storage_dir)
    bale = reloaded.get_performer("ACTOR_CHRISTIAN_BALE", "paramount_pictures")
    assert bale is not None
    assert bale["contract_id"] == "SAG-SCH-F-9901"

def test_record_shot_attribution(clean_store):
    shot_data = {
        "scene_id": "SCENE_42B",
        "take_number": 5,
        "shot_id": "SHOT_15",
        "description": "Explosion concussion secondary head stabilizer",
        "used_seconds": 3.5,
        "rendered_by": "VFX_GPU_NODE_12"
    }
    res = clean_store.record_shot_attribution("ACTOR_MARCUS_VANCE", shot_data, "paramount_pictures")
    assert res["used_seconds"] == 55.7
    assert res["attribution"]["used_seconds"] == 3.5

    # Reload and verify
    reloaded = LikenessStore(storage_dir=clean_store.storage_dir)
    marcus = reloaded.get_performer("ACTOR_MARCUS_VANCE", "paramount_pictures")
    assert marcus["used_seconds"] == 55.7
    assert marcus["shot_attributions"][0]["shot_id"] == "SHOT_15"

def test_generate_union_packet(clean_store):
    packet = clean_store.generate_union_packet("ACTOR_MARCUS_VANCE", "paramount_pictures")
    assert packet["statutory_act"] == "Federal NO FAKES Act of 2026 (17 U.S.C. § 1401 et seq.)"
    assert packet["performer"]["actor_name"] == "Marcus Vance"
    assert packet["compliance_status"] == "AUDIT_READY_AND_VERIFIED"
    assert "certification" in packet
    assert "digital_seal" in packet["certification"]


@pytest.mark.asyncio
async def test_likeness_api_endpoints():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # 1. Fetch ledger
        res = await ac.get("/api/v1/likeness-ledger", headers={"x-tenant-id": "paramount_pictures"})
        assert res.status_code == 200
        performers = res.json()
        assert len(performers) >= 4

        # 2. Get single performer
        res_single = await ac.get("/api/v1/likeness/ACTOR_MARCUS_VANCE", headers={"x-tenant-id": "paramount_pictures"})
        assert res_single.status_code == 200
        assert res_single.json()["actor_name"] == "Marcus Vance"

        # 3. Extend seconds
        res_ext = await ac.post(
            "/api/v1/likeness/extend",
            headers={"x-tenant-id": "paramount_pictures"},
            json={"actor_id": "ACTOR_MARCUS_VANCE", "add_seconds": 15.0}
        )
        assert res_ext.status_code == 200
        assert res_ext.json()["authorized_seconds"] >= 75.0

        # 4. Export packet
        res_packet = await ac.get(
            "/api/v1/likeness/export-packet/ACTOR_MARCUS_VANCE",
            headers={"x-tenant-id": "paramount_pictures"}
        )
        assert res_packet.status_code == 200
        assert res_packet.json()["performer"]["actor_name"] == "Marcus Vance"

        # 5. Sync topology coordinates to performer docs
        sample_coords = [
            {"index": 0, "name": "V_000_POGONION", "region": "jaw", "x": 0.0, "y": 64.2, "z": 24.1, "deviation": 0.012}
        ]
        res_sync = await ac.post(
            "/api/v1/likeness/ACTOR_MARCUS_VANCE/sync-topology",
            headers={"x-tenant-id": "paramount_pictures"},
            json={
                "topology_coordinates": sample_coords,
                "scan_fidelity": 99.85,
                "landmark_deviation_mm": 0.012,
                "c2pa_hash": "c2pa:sha256:test_hash_conformed",
                "source_frame": "01:24:14:10",
                "status": "CERTIFIED_RECONSTRUCTED"
            }
        )
        assert res_sync.status_code == 200
        sync_json = res_sync.json()
        assert sync_json["status"] == "CONFORMED"
        assert sync_json["synthetic_double_assets"]["scan_fidelity"] == 99.85
        assert len(sync_json["synthetic_double_assets"]["topology_coordinates"]) == 1
