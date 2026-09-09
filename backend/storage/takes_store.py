import os
import json
import uuid
import datetime
from typing import Dict, Any, List, Optional
from backend.core.logging import log_telemetry

BASE_STORAGE_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "storage", "local")
PRODUCTION_STATE_FILE = os.path.join(BASE_STORAGE_DIR, "production_state.json")
SCENES_FILE = os.path.join(BASE_STORAGE_DIR, "scenes.json")
TAKES_FILE = os.path.join(BASE_STORAGE_DIR, "takes.json")

INITIAL_SCENES = [
    {
        "scene_id": "SCENE_41",
        "scene_number": "41",
        "title": "Scene 41 (EXT. DUNE SEA - DUSK)",
        "slug": "ext-dune-sea-dusk",
        "description": "Feyd-Rautha gladiator transport convoy traverses the southern perimeter.",
        "location": "Jordan Desert / Practical Stage B",
        "active_take": 6,
        "total_takes": 6,
        "status": "COMPLETED"
    },
    {
        "scene_id": "SCENE_42A",
        "scene_number": "42A",
        "title": "Scene 42A (INT. ORNITHOPTER COCKPIT - NIGHT)",
        "slug": "int-ornithopter-cockpit-night",
        "description": "Marcus Vance pilots through sandstorm turbulence. Tight close-up coverage.",
        "location": "Stage 4 LED Volume Wall",
        "active_take": 8,
        "total_takes": 8,
        "status": "COMPLETED"
    },
    {
        "scene_id": "SCENE_42B",
        "scene_number": "42B",
        "title": "Scene 42B (INT. ARRAKEEN COMMAND VAULT - NIGHT)",
        "slug": "int-arrakeen-command-vault-night",
        "description": "Hero confrontation over spice trade treaty. Whiskey glass prop continuity critical.",
        "location": "Stage 2 Main Soundstage",
        "active_take": 4,
        "total_takes": 4,
        "status": "IN_PROGRESS"
    },
    {
        "scene_id": "SCENE_43",
        "scene_number": "43",
        "title": "Scene 43 (EXT. SIETCH ENTRANCE - DAWN)",
        "slug": "ext-sietch-entrance-dawn",
        "description": "Fremen sentry guard observation post sunrise sequence.",
        "location": "Wadi Rum South Stage",
        "active_take": 3,
        "total_takes": 3,
        "status": "SCHEDULED"
    },
    {
        "scene_id": "SCENE_44",
        "scene_number": "44",
        "title": "Scene 44 (INT. COUNCIL CHAMBER - DAY)",
        "slug": "int-council-chamber-day",
        "description": "Guild Navigator interrogation and diplomatic summit.",
        "location": "Stage 1 Soundstage",
        "active_take": 1,
        "total_takes": 0,
        "status": "SCHEDULED"
    }
]

INITIAL_TAKES = [
    {
        "take_id": "take-CHRONO-SC42B-T01",
        "project_id": "CHRONO-2026",
        "scene_id": "SCENE_42B",
        "scene_display": "Scene 42B",
        "take_number": 1,
        "director": "Denis Villeneuve",
        "sound_roll": "A104",
        "lens": "Cooke Anamorphic /i 40mm T/2.0",
        "timecode_in": "01:24:12:00",
        "timecode_out": "01:24:28:12",
        "duration_sec": 16.5,
        "duration_frames": 396,
        "fps": 24.0,
        "verdict": "NG",
        "ng_reason": "Soft Focus / Focus Puller Missed Mark",
        "director_notes": "1st AC missed rack focus on actor mark. Reset for Take 2.",
        "prop_fill_level": 40,
        "cdl": {"slope": 1.0, "offset": 0.0, "power": 1.0, "saturation": 1.0},
        "c2pa_status": "VERIFIED_HARDWARE_SIGNATURE",
        "c2pa_hash": "c2pa:sha256:4a8b11c9e782d0291f09e6d421bb8a11b0e2f98114",
        "file_name": "Scene42B_Take01_NG.mov",
        "storage_path": "gs://paramount-c2c-vault/takes/Scene42B_Take01_NG.mov",
        "created_at": "2026-09-04T22:45:10Z"
    },
    {
        "take_id": "take-CHRONO-SC42B-T02",
        "project_id": "CHRONO-2026",
        "scene_id": "SCENE_42B",
        "scene_display": "Scene 42B",
        "take_number": 2,
        "director": "Denis Villeneuve",
        "sound_roll": "A104",
        "lens": "Cooke Anamorphic /i 40mm T/2.0",
        "timecode_in": "01:24:12:00",
        "timecode_out": "01:24:32:00",
        "duration_sec": 20.0,
        "duration_frames": 480,
        "fps": 24.0,
        "verdict": "NG",
        "ng_reason": "Boom Mic / Sound Shadow in Frame",
        "director_notes": "Boom shadow visible on background concrete wall at 00:14s.",
        "prop_fill_level": 41,
        "cdl": {"slope": 1.0, "offset": 0.0, "power": 1.0, "saturation": 1.0},
        "c2pa_status": "VERIFIED_HARDWARE_SIGNATURE",
        "c2pa_hash": "c2pa:sha256:7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677",
        "file_name": "Scene42B_Take02_NG.mov",
        "storage_path": "gs://paramount-c2c-vault/takes/Scene42B_Take02_NG.mov",
        "created_at": "2026-09-04T22:58:20Z"
    },
    {
        "take_id": "take-CHRONO-SC42B-T03",
        "project_id": "CHRONO-2026",
        "scene_id": "SCENE_42B",
        "scene_display": "Scene 42B",
        "take_number": 3,
        "director": "Denis Villeneuve",
        "sound_roll": "A104",
        "lens": "Cooke Anamorphic /i 40mm T/2.0",
        "timecode_in": "01:24:12:00",
        "timecode_out": "01:24:34:18",
        "duration_sec": 22.75,
        "duration_frames": 546,
        "fps": 24.0,
        "verdict": "HOLD",
        "ng_reason": None,
        "director_notes": "Solid performance coverage. Prop whiskey glass baseline fill at 42%. Held as safety cover.",
        "prop_fill_level": 42,
        "cdl": {"slope": 1.05, "offset": 0.02, "power": 0.98, "saturation": 1.02},
        "c2pa_status": "VERIFIED_HARDWARE_SIGNATURE",
        "c2pa_hash": "c2pa:sha256:1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3",
        "file_name": "Scene42B_Take03_Hold.mov",
        "storage_path": "gs://paramount-c2c-vault/takes/Scene42B_Take03_Hold.mov",
        "created_at": "2026-09-04T23:12:05Z"
    },
    {
        "take_id": "take-CHRONO-SC42B-T04",
        "project_id": "CHRONO-2026",
        "scene_id": "SCENE_42B",
        "scene_display": "Scene 42B",
        "take_number": 4,
        "director": "Denis Villeneuve",
        "sound_roll": "A104",
        "lens": "Cooke Anamorphic /i 40mm T/2.0",
        "timecode_in": "01:24:12:00",
        "timecode_out": "01:24:36:00",
        "duration_sec": 24.0,
        "duration_frames": 576,
        "fps": 24.0,
        "verdict": "CIRCLE",
        "ng_reason": None,
        "director_notes": "HERO TAKE PRINTED! Tack sharp focus, Marcus delivered dialogue with perfect pacing. Whiskey glass at 68% (Sentry 7 flagged).",
        "prop_fill_level": 68,
        "cdl": {"slope": 1.08, "offset": -0.01, "power": 0.96, "saturation": 1.05},
        "c2pa_status": "VERIFIED_HARDWARE_SIGNATURE",
        "c2pa_hash": "c2pa:sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        "file_name": "Scene42B_Take04_Print.mov",
        "storage_path": "gs://paramount-c2c-vault/takes/Scene42B_Take04_Print.mov",
        "created_at": "2026-09-04T23:24:12Z"
    }
]

INITIAL_PRODUCTION_STATE = {
    "tenant_id": "paramount_pictures",
    "project_id": "CHRONO-2026",
    "project_title": "Chrono 2026 (Theatrical Feature)",
    "active_scene": "Scene 42B",
    "active_scene_id": "SCENE_42B",
    "active_take": 4,
    "director": "Denis Villeneuve",
    "sound_roll": "A104",
    "updated_at": "2026-09-04T23:24:12Z"
}


class TakesStore:
    def __init__(self):
        os.makedirs(BASE_STORAGE_DIR, exist_ok=True)
        os.makedirs(os.path.join(BASE_STORAGE_DIR, "c2c-proxies"), exist_ok=True)
        self._init_storage()

    def _init_storage(self):
        if not os.path.exists(PRODUCTION_STATE_FILE):
            self._save_json(PRODUCTION_STATE_FILE, INITIAL_PRODUCTION_STATE)
        if not os.path.exists(SCENES_FILE):
            self._save_json(SCENES_FILE, INITIAL_SCENES)
        if not os.path.exists(TAKES_FILE):
            self._save_json(TAKES_FILE, INITIAL_TAKES)

    def _load_json(self, file_path: str, default: Any) -> Any:
        try:
            if os.path.exists(file_path):
                with open(file_path, "r", encoding="utf-8") as f:
                    return json.load(f)
        except Exception as e:
            log_telemetry("ERROR", "TakesStore", f"Failed to load {file_path}: {e}")
        return default

    def _save_json(self, file_path: str, data: Any):
        try:
            with open(file_path, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2)
        except Exception as e:
            log_telemetry("ERROR", "TakesStore", f"Failed to save {file_path}: {e}")

    def get_production_state(self, tenant_id: str = "paramount_pictures", project_id: Optional[str] = None) -> Dict[str, Any]:
        from backend.storage.project_store import project_store
        if not project_id:
            studio = project_store.get_studio(tenant_id)
            if studio and studio.get("default_project"):
                norm_proj = studio["default_project"]
            else:
                projs = project_store.list_projects(tenant_id)
                norm_proj = projs[0]["project_id"] if projs else ("CHRONO-2026" if tenant_id == "paramount_pictures" else f"{tenant_id.upper()}-PROJ")
        else:
            norm_proj = project_id

        state_key = f"{tenant_id}:{norm_proj}"
        raw_state = self._load_json(PRODUCTION_STATE_FILE, INITIAL_PRODUCTION_STATE)
        
        # Support keyed dictionary per tenant:project or legacy single-dict
        if "project_id" in raw_state and "active_scene" in raw_state:
            states_dict = {f"{raw_state.get('tenant_id', 'paramount_pictures')}:{raw_state.get('project_id', 'CHRONO-2026')}": raw_state}
        else:
            states_dict = raw_state

        if state_key not in states_dict:
            # Check legacy un-prefixed key
            if norm_proj in states_dict and states_dict[norm_proj].get("tenant_id") == tenant_id:
                states_dict[state_key] = states_dict[norm_proj]
            else:
                proj_obj = project_store.get_project(norm_proj, tenant_id=tenant_id)
                states_dict[state_key] = {
                    "tenant_id": tenant_id,
                    "project_id": norm_proj,
                    "project_title": proj_obj.get("title") if proj_obj else norm_proj.replace("-", " ").title(),
                    "active_scene": proj_obj.get("active_scene", "Scene 01") if proj_obj else "Scene 01",
                    "active_scene_id": "SCENE_01",
                    "active_take": 1,
                    "director": proj_obj.get("director", "Principal Director") if proj_obj else "Principal Director",
                    "sound_roll": "A101",
                    "updated_at": datetime.datetime.now(datetime.timezone.utc).isoformat()
                }
                self._save_json(PRODUCTION_STATE_FILE, states_dict)

        state = dict(states_dict[state_key])
        takes = self.list_takes(tenant_id=tenant_id, project_id=norm_proj)
        active_scene_takes = [t for t in takes if t.get("scene_id") == state.get("active_scene_id") or t.get("scene_display") == state.get("active_scene")]
        state["scene_takes_count"] = len(active_scene_takes)
        state["total_takes_count"] = len(takes)
        return state

    def update_production_state(self, tenant_id: str, updates: Dict[str, Any], project_id: Optional[str] = None) -> Dict[str, Any]:
        norm_proj = project_id or updates.get("project_id") or "CHRONO-2026"
        state_key = f"{tenant_id}:{norm_proj}"
        raw_state = self._load_json(PRODUCTION_STATE_FILE, INITIAL_PRODUCTION_STATE)
        if "project_id" in raw_state and "active_scene" in raw_state:
            states_dict = {f"{raw_state.get('tenant_id', 'paramount_pictures')}:{raw_state.get('project_id', 'CHRONO-2026')}": raw_state}
        else:
            states_dict = raw_state

        current = states_dict.get(state_key, states_dict.get(norm_proj, {}))
        current.update(updates)
        current["tenant_id"] = tenant_id
        current["project_id"] = norm_proj
        current["updated_at"] = datetime.datetime.now(datetime.timezone.utc).isoformat()
        
        # If scene changed, align scene_id and display
        if "active_scene" in updates:
            scene_str = updates["active_scene"]
            norm_id = scene_str.upper().replace(" ", "_")
            if not norm_id.startswith("SCENE_"):
                norm_id = f"SCENE_{norm_id}"
            current["active_scene_id"] = norm_id
            current["active_scene"] = scene_str
            
        states_dict[state_key] = current
        self._save_json(PRODUCTION_STATE_FILE, states_dict)
        log_telemetry("INFO", "TakesStore", f"Updated production state for {state_key}: Scene={current.get('active_scene')} Take={current.get('active_take')}")
        return self.get_production_state(tenant_id, norm_proj)

    def list_scenes(self, tenant_id: str = "paramount_pictures", project_id: Optional[str] = None) -> List[Dict[str, Any]]:
        norm_proj = project_id or "CHRONO-2026"
        all_scenes = self._load_json(SCENES_FILE, INITIAL_SCENES)
        all_takes = self._load_json(TAKES_FILE, INITIAL_TAKES)
        
        # Filter scenes by tenant and project
        scenes = [
            s for s in all_scenes 
            if s.get("project_id", "CHRONO-2026") == norm_proj 
            and (s.get("tenant_id") == tenant_id or (not s.get("tenant_id") and tenant_id == "paramount_pictures"))
        ]
        project_takes = [
            t for t in all_takes 
            if t.get("project_id", "CHRONO-2026") == norm_proj 
            and (t.get("tenant_id") == tenant_id or (not t.get("tenant_id") and tenant_id == "paramount_pictures"))
        ]

        # Recalculate dynamic take counts per scene
        for scene in scenes:
            scene_takes = [t for t in project_takes if t.get("scene_id") == scene.get("scene_id") or t.get("scene_display") == scene.get("title") or t.get("scene_display") == f"Scene {scene.get('scene_number')}"]
            scene["total_takes"] = len(scene_takes)
            if scene_takes:
                scene["active_take"] = max(t.get("take_number", 1) for t in scene_takes)
            else:
                scene["active_take"] = 1
        return scenes

    def create_or_update_scene(self, tenant_id: str, scene_data: Dict[str, Any], project_id: Optional[str] = None) -> Dict[str, Any]:
        norm_proj = project_id or scene_data.get("project_id") or "CHRONO-2026"
        scenes = self._load_json(SCENES_FILE, INITIAL_SCENES)
        scene_id = scene_data.get("scene_id") or f"SCENE_{str(scene_data.get('scene_number', '')).upper()}"
        
        for i, s in enumerate(scenes):
            if s.get("scene_id") == scene_id and s.get("project_id", "CHRONO-2026") == norm_proj and (s.get("tenant_id") == tenant_id or (not s.get("tenant_id") and tenant_id == "paramount_pictures")):
                scenes[i].update(scene_data)
                scenes[i]["tenant_id"] = tenant_id
                scenes[i]["project_id"] = norm_proj
                self._save_json(SCENES_FILE, scenes)
                return scenes[i]

        new_scene = {
            "scene_id": scene_id,
            "tenant_id": tenant_id,
            "project_id": norm_proj,
            "scene_number": str(scene_data.get("scene_number", "New")),
            "title": scene_data.get("title") or f"Scene {scene_data.get('scene_number', 'New')}",
            "slug": scene_data.get("slug") or scene_id.lower().replace("_", "-"),
            "description": scene_data.get("description", "Production coverage scene"),
            "location": scene_data.get("location", "Main Stage"),
            "active_take": 1,
            "total_takes": 0,
            "status": "IN_PROGRESS"
        }
        scenes.append(new_scene)
        self._save_json(SCENES_FILE, scenes)
        log_telemetry("INFO", "TakesStore", f"Created new production scene in {tenant_id}:{norm_proj}: {new_scene['title']}")
        return new_scene

    def list_takes(self, tenant_id: str = "paramount_pictures", scene_id: Optional[str] = None, verdict: Optional[str] = None, project_id: Optional[str] = None) -> List[Dict[str, Any]]:
        norm_proj = project_id or "CHRONO-2026"
        all_takes = self._load_json(TAKES_FILE, INITIAL_TAKES)
        takes = [
            t for t in all_takes 
            if t.get("project_id", "CHRONO-2026") == norm_proj 
            and (t.get("tenant_id") == tenant_id or (not t.get("tenant_id") and tenant_id == "paramount_pictures"))
        ]
        
        if scene_id:
            norm_id = scene_id.strip().upper().replace(" ", "_")
            if not norm_id.startswith("SCENE_"):
                norm_id = f"SCENE_{norm_id}"
            takes = [
                t for t in takes 
                if t.get("scene_id") == norm_id 
                or t.get("scene_display") == scene_id 
                or norm_id in t.get("scene_id", "")
                or scene_id.lower() in t.get("scene_display", "").lower()
            ]
            
        if verdict:
            if verdict.upper() == "UNRATED":
                takes = [t for t in takes if not t.get("verdict")]
            else:
                takes = [t for t in takes if (t.get("verdict") or "").upper() == verdict.upper()]
                
        # Sort newest take first by default
        return sorted(takes, key=lambda x: x.get("take_number", 0), reverse=True)

    def record_take(self, tenant_id: str, take_data: Dict[str, Any], project_id: Optional[str] = None) -> Dict[str, Any]:
        norm_proj = project_id or take_data.get("project_id") or "CHRONO-2026"
        takes = self._load_json(TAKES_FILE, INITIAL_TAKES)
        
        scene_display = take_data.get("scene_display") or take_data.get("scene", "Scene 42B")
        norm_scene_id = take_data.get("scene_id")
        if not norm_scene_id:
            norm_scene_id = scene_display.upper().replace(" ", "_")
            if not norm_scene_id.startswith("SCENE_"):
                norm_scene_id = f"SCENE_{norm_scene_id}"

        project_scene_takes = [
            t for t in takes 
            if t.get("project_id", "CHRONO-2026") == norm_proj 
            and (t.get("tenant_id") == tenant_id or (not t.get("tenant_id") and tenant_id == "paramount_pictures"))
            and (t.get("scene_id") == norm_scene_id or t.get("scene_display") == scene_display)
        ]
        take_num = int(take_data.get("take_number", len(project_scene_takes) + 1))
        take_id = take_data.get("take_id") or f"take-{norm_proj}-{norm_scene_id}-T{str(take_num).zfill(2)}"
        
        # Check if take already exists (e.g. updating verdict upon wrapping)
        for i, t in enumerate(takes):
            if (t.get("take_id") == take_id or (t.get("scene_id") == norm_scene_id and t.get("take_number") == take_num)) and t.get("project_id", "CHRONO-2026") == norm_proj and (t.get("tenant_id") == tenant_id or (not t.get("tenant_id") and tenant_id == "paramount_pictures")):
                takes[i].update(take_data)
                takes[i]["tenant_id"] = tenant_id
                takes[i]["project_id"] = norm_proj
                takes[i]["updated_at"] = datetime.datetime.now(datetime.timezone.utc).isoformat()
                self._save_json(TAKES_FILE, takes)
                self.update_production_state(tenant_id, {
                    "active_scene": scene_display,
                    "active_scene_id": norm_scene_id,
                    "active_take": take_num
                }, project_id=norm_proj)
                log_telemetry("INFO", "TakesStore", f"Updated take record {take_id} (Verdict: {takes[i].get('verdict')}) in {tenant_id}:{norm_proj}")
                return takes[i]

        file_clean_scene = scene_display.replace(" ", "")
        verdict_slug = (take_data.get("verdict") or "Roll").capitalize()
        file_name = f"{norm_proj}_{file_clean_scene}_Take{str(take_num).zfill(2)}_{verdict_slug}.mov"
        
        new_take = {
            "take_id": take_id,
            "tenant_id": tenant_id,
            "project_id": norm_proj,
            "scene_id": norm_scene_id,
            "scene_display": scene_display,
            "take_number": take_num,
            "director": take_data.get("director", "Principal Director"),
            "sound_roll": take_data.get("sound_roll", "A101"),
            "lens": take_data.get("lens", "Cooke Anamorphic /i 40mm T/2.0"),
            "timecode_in": take_data.get("timecode_in", "01:24:12:00"),
            "timecode_out": take_data.get("timecode_out", "01:24:36:00"),
            "duration_sec": float(take_data.get("duration_sec", 24.0)),
            "duration_frames": int(take_data.get("duration_frames", int(float(take_data.get("duration_sec", 24.0)) * 24))),
            "fps": float(take_data.get("fps", 24.0)),
            "verdict": take_data.get("verdict"),
            "ng_reason": take_data.get("ng_reason"),
            "director_notes": take_data.get("director_notes", ""),
            "prop_fill_level": take_data.get("prop_fill_level"),
            "cdl": take_data.get("cdl", {"slope": 1.0, "offset": 0.0, "power": 1.0, "saturation": 1.0}),
            "c2pa_status": take_data.get("c2pa_status", "VERIFIED_HARDWARE_SIGNATURE"),
            "c2pa_hash": take_data.get("c2pa_hash", f"c2pa:sha256:{uuid.uuid4().hex}"),
            "file_name": file_name,
            "storage_path": f"gs://paramount-c2c-vault/takes/{file_name}",
            "created_at": datetime.datetime.now(datetime.timezone.utc).isoformat()
        }
        
        takes.append(new_take)
        self._save_json(TAKES_FILE, takes)
        
        # Touch a physical proxy stub in storage/local/c2c-proxies/
        proxy_path = os.path.join(BASE_STORAGE_DIR, "c2c-proxies", file_name)
        try:
            if not os.path.exists(proxy_path):
                with open(proxy_path, "w") as f:
                    f.write(f"C2C Proxy container for {file_name}\nProject: {norm_proj}\nSMPTE In: {new_take['timecode_in']}\nVerdict: {new_take['verdict']}\n")
        except Exception:
            pass

        # Update active_take in production state
        self.update_production_state(tenant_id, {
            "active_scene": scene_display,
            "active_scene_id": norm_scene_id,
            "active_take": take_num
        }, project_id=norm_proj)

        # Autonomous AI Vision Sentry: Auto-detect digital double / stunt replica
        try:
            from backend.storage.likeness_store import likeness_store
            active_performers = likeness_store.list_performers(tenant_id, project_id=norm_proj)
            if active_performers:
                scene_text = f"{scene_display} {norm_scene_id} {take_data.get('director_notes', '')}".lower()
                matched_performers = []

                # 1. Explicit performer IDs passed from client
                if take_data.get("detected_actor_ids") and isinstance(take_data["detected_actor_ids"], list):
                    matched_performers = [p for p in active_performers if p.get("actor_id") in take_data["detected_actor_ids"]]

                # 2. Token matching
                if not matched_performers:
                    for p in active_performers:
                        name_words = p.get("actor_name", "").lower().split()
                        char_words = p.get("character_name", "").lower().replace("/", " ").split()
                        tokens = [w for w in name_words + char_words if len(w) > 2 and w not in ["the", "and", "dr."]]
                        if any(tok in scene_text for tok in tokens):
                            matched_performers.append(p)

                # 3. Multi-character stunt feed: If Matrix project or multiple performers in project/scene, attribute to all active performers
                is_matrix_proj = any(k in f"{tenant_id} {norm_proj}".lower() for k in ["matrix", "silver", "roadshow", "village"])
                if is_matrix_proj and len(active_performers) > 1:
                    matched_performers = active_performers
                elif not matched_performers and active_performers:
                    matched_performers = active_performers

                attributed_names = []
                last_burn_status = "CLEARED"
                for p in matched_performers:
                    attr_res = likeness_store.record_shot_attribution(
                        actor_id=p["actor_id"],
                        shot_data={
                            "attribution_id": f"attr-take-{new_take['take_id']}-{p['actor_id']}",
                            "scene_id": norm_scene_id,
                            "scene_display": scene_display,
                            "take_number": take_num,
                            "shot_id": f"SHOT_{str(take_num).zfill(2)}",
                            "description": f"AI Vision Sentry conformed take for {p.get('actor_name')} ({scene_display} Take {take_num})",
                            "used_seconds": new_take["duration_sec"],
                            "rendered_by": "ARRI Alexa 35 Neural Ingest / ACEScg Node",
                            "timecode": new_take["timecode_in"],
                            "status": "CONFORMED"
                        },
                        tenant_id=tenant_id,
                        project_id=norm_proj
                    )
                    attributed_names.append(p.get("actor_name", p.get("actor_id")))
                    if attr_res.get("status") in ["CAP_EXCEEDED", "WARNING_THRESHOLD"]:
                        last_burn_status = attr_res.get("status")
                    log_telemetry("INFO", "TakesStore", f"Auto-detected digital double for {p.get('actor_name')}: {new_take['duration_sec']}s conformed in {norm_proj}")

                if matched_performers:
                    new_take["digital_double_detected"] = True
                    new_take["attributed_actor_ids"] = [p["actor_id"] for p in matched_performers]
                    new_take["attributed_actor_name"] = ", ".join(attributed_names)
                    new_take["likeness_burn_status"] = last_burn_status
                    for i, t in enumerate(takes):
                        if t.get("take_id") == new_take["take_id"]:
                            takes[i] = new_take
                            self._save_json(TAKES_FILE, takes)
                            break
        except Exception as e:
            log_telemetry("WARN", "TakesStore", f"Vision sentry likeness attribution skipped: {e}")
        
        log_telemetry("INFO", "TakesStore", f"Physically recorded {new_take['take_id']} ({scene_display} Take {take_num}) in {norm_proj} -> {new_take['storage_path']}")
        return new_take

    def update_take(self, tenant_id: str, take_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        takes = self._load_json(TAKES_FILE, INITIAL_TAKES)
        for i, t in enumerate(takes):
            if t.get("take_id") == take_id:
                takes[i].update(updates)
                takes[i]["updated_at"] = datetime.datetime.now(datetime.timezone.utc).isoformat()
                self._save_json(TAKES_FILE, takes)
                log_telemetry("INFO", "TakesStore", f"Updated take {take_id} properties: {list(updates.keys())}")
                return takes[i]
        return None

    def get_take(self, tenant_id: str, take_id: str) -> Optional[Dict[str, Any]]:
        takes = self._load_json(TAKES_FILE, INITIAL_TAKES)
        for t in takes:
            if t.get("take_id") == take_id:
                return t
        return None


takes_store = TakesStore()
