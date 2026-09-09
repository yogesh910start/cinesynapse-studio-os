import os

addition = """
---

## 14. Environment-Specific Architecture & Multi-Stage Deployment Matrix

### 14.1 3-Tier Environment Separation Matrix
To prevent accidental data cross-contamination between test scenarios and mission-critical theatrical shoots, CINE-SYNAPSE enforces a strict Three-Tier Twelve-Factor environment model:

```
┌──────────────────────────────────┬─────────────────────────────┬─────────────────────────────┬─────────────────────────────┐
│ Architectural Property           │ Development (`dev`)         │ Staging (`staging`)         │ Production (`production`)   │
├──────────────────────────────────┼─────────────────────────────┼─────────────────────────────┼─────────────────────────────┤
│ Target Infrastructure            │ Local Host / Docker Compose │ Google Cloud Run Sandbox    │ Cloud Run Multi-Zone (HA)   │
│ ClickHouse Columnar Cluster      │ In-Memory / Dev Cluster     │ Staging ClickHouse Cloud    │ Dedicated Tier-1 Cluster    │
│ Google Gemini Model Rate Limit   │ Mock Fallback / Low Quota   │ Live Gemini 1.5 Pro (60 RPM)│ Tier-1 Dedicated (1000 RPM) │
│ Media Storage Provider           │ Local File Vault (`/local`) │ GCS `gs://staging-cine-c2c` │ GCS Multi-Region + CMEK     │
│ Cloud KMS Key Ring               │ In-Memory Mock Envelope     │ `projects/cine-stage/kms`   │ `projects/cine-prod/kms`    │
│ Mock Scenarios / Judge Bar       │ Fully Enabled               │ Enabled with Auth Gate      │ Hard Disabled               │
│ UI Topbar Environment Banner     │ `[DEV: LOCAL_SIM]` (Amber)  │ `[STAGING: SANDBOX]` (Cyan) │ Hidden / `[PROD]` (Emerald) │
│ Database Schema Migrations       │ Auto-Apply & Auto-Seed      │ Automated CI/CD PR Deploy   │ Manual Gated & Audited      │
│ Minimum Container Scaling        │ 1 Worker (Uvicorn :8000)    │ 1 Instance (Min 0 scale)    │ 2 Instances (Zero Cold-Start)│
└──────────────────────────────────┴─────────────────────────────┴─────────────────────────────┴─────────────────────────────┘
```

### 14.2 Environment Configuration Hierarchy (`pydantic-settings`)
The application dynamically configures its runtime behavior based on the `APP_ENV` environment variable:

```python
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Literal, Optional

class Settings(BaseSettings):
    APP_ENV: Literal["development", "staging", "production"] = "development"
    PROJECT_NAME: str = "CINE-SYNAPSE Studio OS"
    API_V1_PREFIX: str = "/api/v1"
    
    # ClickHouse Cloud
    CLICKHOUSE_HOST: str = "localhost"
    CLICKHOUSE_PORT: int = 8443
    CLICKHOUSE_USER: str = "default"
    CLICKHOUSE_PASSWORD: str = ""
    CLICKHOUSE_SECURE: bool = True
    CLICKHOUSE_MOCK_FALLBACK: bool = True
    
    # Gemini AI Engine
    GEMINI_API_KEY: Optional[str] = None
    GEMINI_MODEL_ID: str = "gemini-1.5-pro"
    
    # Storage Configuration
    STORAGE_PROVIDER: Literal["local", "gcs"] = "local"
    GCS_BUCKET_VAULT: str = "cine-synapse-local-vault"
    
    # Security
    JWT_SECRET: str = "dev-insecure-secret-key-change-in-prod"
    RATE_LIMIT_ENABLED: bool = True
    
    model_config = SettingsConfigDict(
        env_file=(".env", f".env.{os.getenv('APP_ENV', 'development')}"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
```

### 14.3 Multi-Stage Dockerfile Targets
```dockerfile
# Development Target with Hot Reloading
FROM python:3.11-slim AS development
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
ENV APP_ENV=development
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]

# Production Hardened Target
FROM python:3.11-slim AS production
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt
COPY . .
RUN useradd -u 1001 cinesynapse && chown -R cinesynapse:cinesynapse /app
USER 1001
ENV APP_ENV=production
ENV PORT=8080
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8080", "--workers", "4"]
```
"""

tad_path = "/Users/ymore/.gemini/antigravity/scratch/cine_synapse/docs/TECHNICAL_ARCHITECTURE_DOCUMENT.md"
brain_tad_path = "/Users/ymore/.gemini/antigravity/brain/fba0b760-63ef-46ec-8f1c-65de7e95e8a1/TECHNICAL_ARCHITECTURE_DOCUMENT.md"

with open(tad_path, "r", encoding="utf-8") as f:
    orig = f.read()

# Replace the end marker
if "*End of Master Technical Architecture Document" in orig:
    updated = orig.replace("*End of Master Technical Architecture Document (CINE-SYNAPSE-TAD-V2.0-ENTERPRISE)*", addition + "\n\n*End of Master Technical Architecture Document (CINE-SYNAPSE-TAD-V2.0-ENTERPRISE)*")
else:
    updated = orig + "\n" + addition

with open(tad_path, "w", encoding="utf-8") as f:
    f.write(updated)

with open(brain_tad_path, "w", encoding="utf-8") as f:
    f.write(updated)

print("TAD successfully updated with Section 14 (Environment-Specific Architecture & Deployment).")
