import os
import json
import datetime
from typing import Dict, Any, List, Optional
from backend.core.logging import log_telemetry

BASE_STORAGE_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "storage", "local")
STUDIOS_FILE = os.path.join(BASE_STORAGE_DIR, "studios.json")
PROJECTS_FILE = os.path.join(BASE_STORAGE_DIR, "projects.json")

INITIAL_STUDIOS = [
    {
        "tenant_id": "paramount_pictures",
        "name": "Paramount Pictures",
        "code": "PARA",
        "default_project": "CHRONO-2026",
        "created_at": "2026-09-01T00:00:00Z"
    },
    {
        "tenant_id": "warner_bros",
        "name": "Warner Bros. Discovery",
        "code": "WBD",
        "default_project": "APEX-2026",
        "created_at": "2026-09-01T00:00:00Z"
    },
    {
        "tenant_id": "a24_films",
        "name": "A24 Films",
        "code": "A24",
        "default_project": "NEON-GHOST",
        "created_at": "2026-09-01T00:00:00Z"
    }
]

INITIAL_PROJECTS = [
    {
        "project_id": "CHRONO-2026",
        "tenant_id": "paramount_pictures",
        "title": "Chrono (2026)",
        "director": "Denis Villeneuve",
        "year": 2026,
        "camera_fps": 24.0,
        "aspect_ratio": "2.39:1 Scope",
        "color_space": "ACEScg SMPTE ST 2065-1",
        "description": "Epic sci-fi action feature set on the arid dunes of Arrakis.",
        "active_scene": "Scene 42B",
        "active_take": 4,
        "created_at": "2026-09-01T00:00:00Z"
    },
    {
        "project_id": "APEX-2026",
        "tenant_id": "warner_bros",
        "title": "Apex",
        "director": "George Miller",
        "year": 2026,
        "camera_fps": 24.0,
        "aspect_ratio": "2.39:1 Scope",
        "color_space": "ACEScg SMPTE ST 2065-1",
        "description": "High-octane desert warfare diesel-punk epic.",
        "active_scene": "Scene 01",
        "active_take": 1,
        "created_at": "2026-09-02T00:00:00Z"
    },
    {
        "project_id": "NEON-GHOST",
        "tenant_id": "a24_films",
        "title": "Neon Ghost",
        "director": "Alex Garland",
        "year": 2026,
        "camera_fps": 24.0,
        "aspect_ratio": "1.85:1 Flat",
        "color_space": "ACEScg SMPTE ST 2065-1",
        "description": "Cyberpunk psychological thriller set in Tokyo underworld.",
        "active_scene": "Scene 01",
        "active_take": 1,
        "created_at": "2026-09-03T00:00:00Z"
    }
]


class ProjectStore:
    def __init__(self, storage_dir: str = BASE_STORAGE_DIR):
        self.storage_dir = storage_dir
        self.studios_file = os.path.join(self.storage_dir, "studios.json")
        self.projects_file = os.path.join(self.storage_dir, "projects.json")
        os.makedirs(self.storage_dir, exist_ok=True)
        self._init_storage()

    def _init_storage(self):
        if not os.path.exists(self.studios_file):
            self._save_json(self.studios_file, INITIAL_STUDIOS)
        if not os.path.exists(self.projects_file):
            self._save_json(self.projects_file, INITIAL_PROJECTS)

    def _load_json(self, file_path: str, default: Any) -> Any:
        try:
            if os.path.exists(file_path):
                with open(file_path, "r", encoding="utf-8") as f:
                    return json.load(f)
        except Exception as e:
            log_telemetry("ERROR", "ProjectStore", f"Failed to load {file_path}: {e}")
        return default

    def _save_json(self, file_path: str, data: Any):
        try:
            tmp_path = f"{file_path}.tmp"
            with open(tmp_path, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2)
            os.replace(tmp_path, file_path)
        except Exception as e:
            log_telemetry("ERROR", "ProjectStore", f"Failed to save {file_path}: {e}")

    # Studios / Tenants
    def list_studios(self) -> List[Dict[str, Any]]:
        return self._load_json(self.studios_file, INITIAL_STUDIOS)

    def get_studio(self, tenant_id: str) -> Optional[Dict[str, Any]]:
        studios = self.list_studios()
        for s in studios:
            if s.get("tenant_id") == tenant_id:
                return s
        return None

    def create_studio(self, studio_data: Dict[str, Any]) -> Dict[str, Any]:
        studios = self.list_studios()
        tenant_id = studio_data.get("tenant_id") or studio_data.get("name", "Studio").lower().replace(" ", "_")
        
        # Check existing
        for s in studios:
            if s.get("tenant_id") == tenant_id:
                return s

        new_studio = {
            "tenant_id": tenant_id,
            "name": studio_data.get("name", "New Studio Production"),
            "code": studio_data.get("code") or tenant_id[:4].upper(),
            "default_project": studio_data.get("default_project"),
            "created_at": datetime.datetime.now(datetime.timezone.utc).isoformat()
        }
        studios.append(new_studio)
        self._save_json(self.studios_file, studios)
        log_telemetry("INFO", "ProjectStore", f"Created new studio tenant: {new_studio['name']} ({tenant_id})")
        return new_studio

    # Projects / Movies
    def list_projects(self, tenant_id: Optional[str] = None) -> List[Dict[str, Any]]:
        projects = self._load_json(self.projects_file, INITIAL_PROJECTS)
        if tenant_id:
            return [p for p in projects if p.get("tenant_id") == tenant_id]
        return projects

    def get_project(self, project_id: str, tenant_id: Optional[str] = None) -> Optional[Dict[str, Any]]:
        projects = self.list_projects()
        for p in projects:
            if p.get("project_id") == project_id:
                if tenant_id and p.get("tenant_id") != tenant_id:
                    continue
                return p
        return None

    def create_project(self, tenant_id: str, project_data: Dict[str, Any]) -> Dict[str, Any]:
        projects = self._load_json(self.projects_file, INITIAL_PROJECTS)
        
        title = project_data.get("title", "Untitled Feature")
        if project_data.get("project_id"):
            norm_id = project_data["project_id"].strip()
        else:
            raw_id = title.upper().replace(" ", "_").replace(":", "")
            norm_id = f"{raw_id}-2026" if not any(char.isdigit() for char in raw_id) else raw_id


        
        # Check if already exists
        for i, p in enumerate(projects):
            if p.get("project_id") == norm_id and p.get("tenant_id") == tenant_id:
                projects[i].update(project_data)
                self._save_json(self.projects_file, projects)
                return projects[i]

        new_project = {
            "project_id": norm_id,
            "tenant_id": tenant_id,
            "title": title,
            "director": project_data.get("director", "Principal Director"),
            "year": int(project_data.get("year", 2026)),
            "camera_fps": float(project_data.get("camera_fps", 24.0)),
            "aspect_ratio": project_data.get("aspect_ratio", "2.39:1 Scope"),
            "color_space": project_data.get("color_space", "ACEScg SMPTE ST 2065-1"),
            "description": project_data.get("description", "Feature film production."),
            "active_scene": project_data.get("active_scene", "Scene 01"),
            "active_take": 1,
            "is_blank": bool(project_data.get("is_blank", True)),
            "created_at": datetime.datetime.now(datetime.timezone.utc).isoformat()
        }

        projects.append(new_project)
        self._save_json(self.projects_file, projects)

        # Update studio default_project if not set
        studios = self.list_studios()
        for s in studios:
            if s.get("tenant_id") == tenant_id and not s.get("default_project"):
                s["default_project"] = norm_id
                self._save_json(self.studios_file, studios)
                break

        log_telemetry("INFO", "ProjectStore", f"Created new movie project: {title} ({norm_id}) under tenant {tenant_id}")
        return new_project


project_store = ProjectStore()
