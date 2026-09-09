import pytest
from httpx import AsyncClient, ASGITransport
from backend.main import app

@pytest.mark.asyncio
async def test_get_production_state():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.get("/api/v1/production/state")
        assert res.status_code == 200
        data = res.json()
        assert "active_scene" in data
        assert "active_take" in data
        assert "total_takes_count" in data
        assert data["total_takes_count"] >= 4

@pytest.mark.asyncio
async def test_list_and_create_scenes():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.get("/api/v1/production/scenes")
        assert res.status_code == 200
        scenes = res.json()
        assert isinstance(scenes, list)
        assert len(scenes) >= 5
        scene_ids = [s["scene_id"] for s in scenes]
        assert "SCENE_42B" in scene_ids

        # Create a new test scene
        new_scene_res = await ac.post("/api/v1/production/scenes", json={
            "scene_number": "45",
            "title": "Scene 45 (INT. SARDOU EMBASSY - NIGHT)",
            "description": "Covert spy negotiation"
        })
        assert new_scene_res.status_code == 200
        created = new_scene_res.json()
        assert created["scene_id"] == "SCENE_45"

@pytest.mark.asyncio
async def test_takes_lifecycle_and_persistence():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # 1. List existing takes for Scene 42B
        res = await ac.get("/api/v1/production/takes?scene_id=Scene 42B")
        assert res.status_code == 200
        takes = res.json()
        assert len(takes) >= 4

        # Verify initial seeds
        verdicts = [t.get("verdict") for t in takes]
        assert "CIRCLE" in verdicts
        assert "NG" in verdicts
        assert "HOLD" in verdicts

        # 2. Record a new Take 5
        record_res = await ac.post("/api/v1/production/takes", json={
            "scene_display": "Scene 42B",
            "take_number": 5,
            "director": "Denis Villeneuve",
            "timecode_in": "01:24:36:04",
            "timecode_out": "01:25:02:18",
            "duration_sec": 26.5,
            "verdict": "CIRCLE",
            "director_notes": "Perfect follow-up take. Excellent delivery.",
            "prop_fill_level": 65
        })
        assert record_res.status_code == 200
        t5 = record_res.json()
        assert t5["take_number"] == 5
        assert t5["verdict"] == "CIRCLE"
        assert "Scene42B_Take05_Circle.mov" in t5["file_name"]

        # 3. Update take properties (PATCH)
        patch_res = await ac.patch(f"/api/v1/production/takes/{t5['take_id']}", json={
            "director_notes": "Updated: Master print approved by Denis and Editor."
        })
        assert patch_res.status_code == 200
        updated = patch_res.json()
        assert "Denis and Editor" in updated["director_notes"]

        # 4. Check production state reflected the new take
        state_res = await ac.get("/api/v1/production/state")
        assert state_res.status_code == 200
        state = state_res.json()
        assert state["active_take"] >= 5

        # 5. Check storage assets includes the newly recorded take proxy
        assets_res = await ac.get("/api/v1/storage/assets")
        assert assets_res.status_code == 200
        assets = assets_res.json()
        file_names = [a["file_name"] for a in assets]
        assert any("Scene42B_Take05" in fn for fn in file_names)
