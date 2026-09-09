import uuid
import pytest
from httpx import AsyncClient, ASGITransport
from backend.main import app


@pytest.mark.asyncio
async def test_multi_studio_and_project_http_flow():
    """Complete end-to-end HTTP API flow:
    1. Create new Studio Tenant via HTTP
    2. Create Blank Slate Movie Project via HTTP
    3. Verify clean slate (0 scenes, 0 takes, 0 performers)
    4. Populate scenes, takes, performers, shot attribution, cap extension, and union packet export
    5. Test template='matrix_benchmark' project creation
    6. Verify strict isolation from CHRONO-2026 under paramount_pictures
    """
    uid = uuid.uuid4().hex[:6]
    studio_id = f"vrp_studio_{uid}"
    blank_proj_id = f"RESURRECTIONS-{uid}"
    matrix_proj_id = f"MATRIX-BURLY-{uid}"

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # 1. Fetch initial studios
        res_studios = await ac.get("/api/v1/studios")
        assert res_studios.status_code == 200
        initial_studios = res_studios.json()
        assert any(s["tenant_id"] == "paramount_pictures" for s in initial_studios)

        # 2. Create brand-new Studio Tenant: Village Roadshow Pictures
        res_create_studio = await ac.post("/api/v1/studios", json={
            "tenant_id": studio_id,
            "name": f"Village Roadshow Pictures ({uid})",
            "code": f"V{uid[:3].upper()}",
            "description": "Australian-American film co-producer & studio"
        })
        assert res_create_studio.status_code == 200
        created_studio = res_create_studio.json()
        assert created_studio["tenant_id"] == studio_id

        # Verify studio is reflected in auth tenants endpoint
        res_auth_tenants = await ac.get("/api/v1/auth/tenants")
        assert res_auth_tenants.status_code == 200
        auth_tenant_ids = [t["tenant_id"] for t in res_auth_tenants.json()]
        assert studio_id in auth_tenant_ids

        # 3. Create a clean BLANK SLATE Movie Project
        res_create_proj = await ac.post("/api/v1/projects", json={
            "tenant_id": studio_id,
            "project_id": blank_proj_id,
            "title": f"The Matrix Resurrections ({uid})",
            "director": "Lana Wachowski",
            "camera_fps": 24.0,
            "aspect_ratio": "2.39:1 Scope",
            "template": "blank"
        })
        assert res_create_proj.status_code == 200
        new_proj = res_create_proj.json()
        assert new_proj["project_id"] == blank_proj_id
        assert new_proj["tenant_id"] == studio_id

        headers_vrp = {
            "x-tenant-id": studio_id,
            "x-project-id": blank_proj_id
        }

        # 4. Verify clean slate: 0 scenes, 0 takes, 0 likeness performers
        res_scenes = await ac.get("/api/v1/production/scenes", headers=headers_vrp)
        assert res_scenes.status_code == 200
        assert len(res_scenes.json()) == 0

        res_takes = await ac.get("/api/v1/production/takes", headers=headers_vrp)
        assert res_takes.status_code == 200
        assert len(res_takes.json()) == 0

        res_likeness = await ac.get("/api/v1/likeness-ledger", headers=headers_vrp)
        assert res_likeness.status_code == 200
        assert len(res_likeness.json()) == 0

        # 5. Populate scene in the blank project
        res_add_scene = await ac.post(
            "/api/v1/production/scenes",
            headers=headers_vrp,
            json={
                "scene_id": "SCENE_201",
                "scene_number": "201",
                "title": "Scene 201 (EXT. SKYSCRAPER ROOF - DAWN)",
                "slug": "ext-skyscraper-roof-dawn",
                "description": "Neo and Trinity rooftop jump sequence.",
                "location": "San Francisco Financial District Rooftop"
            }
        )
        assert res_add_scene.status_code == 200
        assert res_add_scene.json()["scene_id"] == "SCENE_201"

        # Verify scene is returned
        res_scenes_updated = await ac.get("/api/v1/production/scenes", headers=headers_vrp)
        assert len(res_scenes_updated.json()) == 1
        assert res_scenes_updated.json()[0]["scene_id"] == "SCENE_201"

        # 6. Record Take 1 (HOLD) and Take 2 (CIRCLE)
        res_take1 = await ac.post(
            "/api/v1/production/takes",
            headers=headers_vrp,
            json={
                "scene_id": "SCENE_201",
                "scene_display": "Scene 201",
                "take_number": 1,
                "director": "Lana Wachowski",
                "verdict": "HOLD",
                "director_notes": "First rehearsal wire leap."
            }
        )
        assert res_take1.status_code == 200
        assert res_take1.json()["verdict"] == "HOLD"

        res_take2 = await ac.post(
            "/api/v1/production/takes",
            headers=headers_vrp,
            json={
                "scene_id": "SCENE_201",
                "scene_display": "Scene 201",
                "take_number": 2,
                "director": "Lana Wachowski",
                "verdict": "CIRCLE",
                "director_notes": "Hero sunrise jump printed!"
            }
        )
        assert res_take2.status_code == 200
        assert res_take2.json()["verdict"] == "CIRCLE"

        # 7. Add Carrie-Anne Moss (Trinity) likeness rider
        res_add_trinity = await ac.post(
            "/api/v1/likeness/add",
            headers=headers_vrp,
            json={
                "actor_id": "ACTOR_CARRIE_ANNE_MOSS",
                "actor_name": "Carrie-Anne Moss",
                "character_name": "Trinity",
                "authorized_seconds": 120.0,
                "residual_rate_per_sec": 1200.0,
                "union_affiliation": "SAG_AFTRA",
                "schedule_code": "SCHEDULE_F",
                "contract_reference": "SAG-2026-TRINITY-9021"
            }
        )
        assert res_add_trinity.status_code == 200
        trinity = res_add_trinity.json()["actor"]
        assert trinity["actor_id"] == "ACTOR_CARRIE_ANNE_MOSS"
        assert trinity["authorized_seconds"] == 120.0

        # 8. Record shot attribution of 125.0s -> Triggers CAP_EXCEEDED
        res_deduct = await ac.post(
            "/api/v1/likeness/shot-attribution",
            headers=headers_vrp,
            json={
                "actor_id": "ACTOR_CARRIE_ANNE_MOSS",
                "scene_id": "SCENE_201",
                "take_number": 2,
                "shot_id": "SHOT_ROOF_02",
                "used_seconds": 125.0,
                "description": "Trinity digital double wire-removal and facial composite"
            }
        )
        assert res_deduct.status_code == 200
        deduct_res = res_deduct.json()
        assert deduct_res["status"] == "CAP_EXCEEDED"
        assert deduct_res["used_seconds"] == 125.0

        # 9. Extend likeness cap by +30.0s -> recovers to WARNING_THRESHOLD (125.0 / 150.0 = 83.3%)
        res_extend = await ac.post(
            "/api/v1/likeness/extend",
            headers=headers_vrp,
            json={
                "actor_id": "ACTOR_CARRIE_ANNE_MOSS",
                "add_seconds": 30.0,
                "authorized_by": "Senior Legal Counsel",
                "note": "Authorized rooftop digital double overrun"
            }
        )
        assert res_extend.status_code == 200
        extend_res = res_extend.json()
        assert extend_res["status"] == "WARNING_THRESHOLD"
        assert extend_res["actor"]["authorized_seconds"] == 150.0
        assert extend_res["actor"]["status"] == "WARNING_THRESHOLD"

        # 10. Export union packet via HTTP
        res_packet = await ac.get(
            "/api/v1/likeness/export-packet/ACTOR_CARRIE_ANNE_MOSS",
            headers=headers_vrp
        )
        assert res_packet.status_code == 200
        packet = res_packet.json()
        assert packet["performer"]["actor_name"] == "Carrie-Anne Moss"
        assert packet["metering"]["contracted_seconds_cap"] == 150.0
        assert packet["metering"]["actual_rendered_seconds"] == 125.0
        assert packet["certification"]["digital_seal"].startswith("SHA256:SEAL:")
        assert packet["compliance_status"] == "AUDIT_READY_AND_VERIFIED"


        # 11. Create a project with matrix_benchmark template
        res_matrix_template = await ac.post("/api/v1/projects", json={
            "tenant_id": studio_id,
            "project_id": matrix_proj_id,
            "title": f"The Matrix: Burly Brawl Template ({uid})",
            "director": "Lana & Lilly Wachowski",
            "camera_fps": 24.0,
            "aspect_ratio": "2.39:1 Scope",
            "template": "matrix_benchmark"
        })
        assert res_matrix_template.status_code == 200

        # Verify template seeded Scene 102 and actors Keanu & Hugo
        res_matrix_scenes = await ac.get(
            "/api/v1/production/scenes",
            headers={"x-tenant-id": studio_id, "x-project-id": matrix_proj_id}
        )
        assert res_matrix_scenes.status_code == 200
        matrix_scene_ids = [s["scene_id"] for s in res_matrix_scenes.json()]
        assert "SCENE_102" in matrix_scene_ids

        res_matrix_ledger = await ac.get(
            "/api/v1/likeness-ledger",
            headers={"x-tenant-id": studio_id, "x-project-id": matrix_proj_id}
        )
        assert res_matrix_ledger.status_code == 200
        matrix_actor_ids = [a["actor_id"] for a in res_matrix_ledger.json()]
        assert "ACTOR_KEANU_REEVES" in matrix_actor_ids
        assert "ACTOR_HUGO_WEAVING" in matrix_actor_ids

        # 12. Strict isolation verification against CHRONO-2026 under paramount_pictures
        headers_paramount = {
            "x-tenant-id": "paramount_pictures",
            "x-project-id": "CHRONO-2026"
        }
        res_chrono_scenes = await ac.get("/api/v1/production/scenes", headers=headers_paramount)
        assert res_chrono_scenes.status_code == 200
        chrono_scene_ids = [s["scene_id"] for s in res_chrono_scenes.json()]
        assert "SCENE_42B" in chrono_scene_ids
        assert "SCENE_201" not in chrono_scene_ids

        res_chrono_ledger = await ac.get("/api/v1/likeness-ledger", headers=headers_paramount)
        assert res_chrono_ledger.status_code == 200
        chrono_actor_ids = [a["actor_id"] for a in res_chrono_ledger.json()]
        assert "ACTOR_MARCUS_VANCE" in chrono_actor_ids
        assert "ACTOR_CARRIE_ANNE_MOSS" not in chrono_actor_ids
