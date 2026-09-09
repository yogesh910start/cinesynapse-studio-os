import pytest
from backend.storage.project_store import project_store
from backend.storage.takes_store import takes_store
from backend.storage.likeness_store import likeness_store


def test_create_studio_and_blank_project():
    from backend.storage.takes_store import TAKES_FILE, SCENES_FILE
    all_takes = [t for t in takes_store._load_json(TAKES_FILE, []) if t.get("tenant_id") != "silver_pictures_blank"]
    takes_store._save_json(TAKES_FILE, all_takes)
    all_scenes = [s for s in takes_store._load_json(SCENES_FILE, []) if s.get("tenant_id") != "silver_pictures_blank"]
    takes_store._save_json(SCENES_FILE, all_scenes)
    ledger = likeness_store._load_ledger()
    ledger.pop("silver_pictures_blank:MATRIX-BLANK-2026", None)
    ledger.pop("silver_pictures_blank", None)
    likeness_store._save_ledger(ledger)

    # 1. Create a brand new studio
    studio = project_store.create_studio({
        "tenant_id": "silver_pictures_blank",
        "name": "Silver Pictures Blank",
        "code": "SLVB"
    })
    assert studio["tenant_id"] == "silver_pictures_blank"
    assert studio["name"] == "Silver Pictures Blank"

    # 2. Create a blank-slate project "MATRIX-BLANK-2026"
    proj = project_store.create_project("silver_pictures_blank", {
        "project_id": "MATRIX-BLANK-2026",
        "title": "The Matrix: Blank Slate",
        "director": "Lana & Lilly Wachowski",
        "camera_fps": 24.0,
        "aspect_ratio": "2.39:1 Scope",
        "is_blank": True
    })
    proj_id = proj["project_id"]
    assert proj_id == "MATRIX-BLANK-2026"
    assert proj["tenant_id"] == "silver_pictures_blank"
    assert proj["director"] == "Lana & Lilly Wachowski"

    # 3. Verify clean slate: 0 scenes, 0 takes, 0 performers
    scenes = takes_store.list_scenes("silver_pictures_blank", project_id=proj_id)
    assert len(scenes) == 0, f"Expected 0 scenes in blank project, got {len(scenes)}"

    takes = takes_store.list_takes("silver_pictures_blank", project_id=proj_id)
    assert len(takes) == 0, f"Expected 0 takes in blank project, got {len(takes)}"

    performers = likeness_store.list_performers("silver_pictures_blank", project_id=proj_id)
    assert len(performers) == 0, f"Expected 0 performers in blank project, got {len(performers)}"


def test_existing_chrono_project_unaffected():
    # Ensure CHRONO-2026 under paramount_pictures remains 100% intact
    chrono_scenes = takes_store.list_scenes("paramount_pictures", project_id="CHRONO-2026")
    assert len(chrono_scenes) >= 5
    scene_ids = [s["scene_id"] for s in chrono_scenes]
    assert "SCENE_42B" in scene_ids
    assert "SCENE_41" in scene_ids

    chrono_takes = takes_store.list_takes("paramount_pictures", project_id="CHRONO-2026")
    assert len(chrono_takes) >= 4
    hero_take = next((t for t in chrono_takes if t.get("verdict") == "CIRCLE"), None)
    assert hero_take is not None
    assert hero_take["scene_id"] == "SCENE_42B"

    chrono_performers = likeness_store.list_performers("paramount_pictures", project_id="CHRONO-2026")
    assert len(chrono_performers) >= 4
    marcus = next((p for p in chrono_performers if p["actor_id"] == "ACTOR_MARCUS_VANCE"), None)
    assert marcus is not None
    assert marcus["actor_name"] == "Marcus Vance"


def test_populate_matrix_from_scratch():
    # 1. Create Scene 102 in MATRIX-2026
    scene_102 = takes_store.create_or_update_scene("silver_pictures", {
        "scene_id": "SCENE_102",
        "scene_number": "102",
        "title": "Scene 102 (EXT. COURTYARD - DAY)",
        "slug": "ext-courtyard-day",
        "description": "Burly Brawl: Neo battles 100 Agent Smiths in an enclosed courtyard.",
        "location": "Sydney Backlot Stage 3"
    }, project_id="MATRIX-2026")
    assert scene_102["scene_id"] == "SCENE_102"

    # 2. Record Take 1 (HOLD) and Take 2 (CIRCLE)
    take1 = takes_store.record_take("silver_pictures", {
        "scene_id": "SCENE_102",
        "scene_display": "Scene 102",
        "take_number": 1,
        "director": "Lana & Lilly Wachowski",
        "verdict": "HOLD",
        "director_notes": "Safety pass on wire rig."
    }, project_id="MATRIX-2026")
    assert take1["verdict"] == "HOLD"

    take2 = takes_store.record_take("silver_pictures", {
        "scene_id": "SCENE_102",
        "scene_display": "Scene 102",
        "take_number": 2,
        "director": "Lana & Lilly Wachowski",
        "verdict": "CIRCLE",
        "director_notes": "Hero martial arts pass printed!"
    }, project_id="MATRIX-2026")
    assert take2["verdict"] == "CIRCLE"

    # 3. Verify MATRIX-2026 takes count
    matrix_takes = takes_store.list_takes("silver_pictures", scene_id="SCENE_102", project_id="MATRIX-2026")
    assert len(matrix_takes) >= 2

    # 4. Add Keanu Reeves rider
    keanu = likeness_store.add_performer({
        "actor_id": "ACTOR_KEANU_REEVES",
        "actor_name": "Keanu Reeves",
        "character_name": "Neo",
        "authorized_seconds": 180.0,
        "residual_rate_per_sec": 1500.0,
        "union_affiliation": "SAG_AFTRA",
        "schedule_code": "SCHEDULE_F"
    }, tenant_id="silver_pictures", project_id="MATRIX-2026")
    assert keanu["actor_name"] == "Keanu Reeves"
    assert keanu["authorized_seconds"] == 180.0

    # 5. Add Hugo Weaving rider
    hugo = likeness_store.add_performer({
        "actor_id": "ACTOR_HUGO_WEAVING",
        "actor_name": "Hugo Weaving",
        "character_name": "Agent Smith",
        "authorized_seconds": 60.0,
        "residual_rate_per_sec": 450.0,
        "union_affiliation": "SAG_AFTRA",
        "schedule_code": "SCHEDULE_A"
    }, tenant_id="silver_pictures", project_id="MATRIX-2026")
    assert hugo["actor_name"] == "Hugo Weaving"
    assert hugo["authorized_seconds"] == 60.0

    # 6. Deduct 62.5s for Hugo Weaving -> triggers CAP_EXCEEDED
    deduction = likeness_store.record_shot_attribution(
        actor_id="ACTOR_HUGO_WEAVING",
        shot_data={
            "scene_id": "SCENE_102",
            "take_number": 2,
            "shot_id": "SHOT_BURLY_01",
            "used_seconds": 62.5,
            "description": "Agent Smith 100-man crowd clone composite"
        },
        tenant_id="silver_pictures",
        project_id="MATRIX-2026"
    )
    assert deduction["status"] == "CAP_EXCEEDED"
    assert deduction["used_seconds"] == 62.5

    # 7. Extend cap by +15s -> returns to WARNING_THRESHOLD (62.5s / 75s = 83.3%)
    extension = likeness_store.extend_seconds(
        actor_id="ACTOR_HUGO_WEAVING",
        add_seconds=15.0,
        authorized_by="Production Attorney",
        note="Approved courtyard crowd overrun",
        tenant_id="silver_pictures",
        project_id="MATRIX-2026"
    )
    assert extension["authorized_seconds"] == 75.0
    assert extension["status"] == "WARNING_THRESHOLD"

    # 8. Export packet for Hugo
    packet = likeness_store.generate_union_packet(
        actor_id="ACTOR_HUGO_WEAVING",
        tenant_id="silver_pictures",
        project_id="MATRIX-2026"
    )
    assert packet["production_title"] == "MATRIX-2026"
    assert packet["performer"]["actor_name"] == "Hugo Weaving"
    assert packet["metering"]["contracted_seconds_cap"] == 75.0
    assert packet["metering"]["actual_rendered_seconds"] == 62.5

    # 9. Verify CHRONO-2026 remains free of any Matrix scenes or actors
    chrono_scenes_after = takes_store.list_scenes("paramount_pictures", project_id="CHRONO-2026")
    assert not any(s["scene_id"] == "SCENE_102" for s in chrono_scenes_after)

    chrono_performers_after = likeness_store.list_performers("paramount_pictures", project_id="CHRONO-2026")
    assert not any(p["actor_id"] == "ACTOR_HUGO_WEAVING" for p in chrono_performers_after)
    assert not any(p["actor_id"] == "ACTOR_KEANU_REEVES" for p in chrono_performers_after)
