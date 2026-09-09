import os

addition = """
---

## 13. Enterprise SRE, Observability, Storage & CI/CD Pipeline

### 13.1 Global Exception Handling & RFC 7807 Problem Details
CINE-SYNAPSE implements an enterprise-grade exception handling boundary. All unexpected exceptions and domain errors are transformed into RFC 7807 Problem Details envelopes, complete with a unique `correlation_id` (UUIDv4) and tenant audit context:

```python
from fastapi import Request, status
from fastapi.responses import JSONResponse
import uuid
import datetime

class AppException(Exception):
    def __init__(self, status_code: int, title: str, detail: str, error_type: str = "about:blank"):
        self.status_code = status_code
        self.title = title
        self.detail = detail
        self.error_type = error_type

class LikenessCapExceededException(AppException):
    def __init__(self, actor_id: str, requested_sec: float, remaining_sec: float):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            title="SAG-AFTRA Likeness Cap Exceeded",
            detail=f"Actor {actor_id} has {remaining_sec}s remaining, but requested shot requires {requested_sec}s.",
            error_type="https://cinesynapse.studio/errors/likeness-cap-exceeded"
        )

async def app_exception_handler(request: Request, exc: AppException):
    correlation_id = request.headers.get("x-correlation-id", f"req-{uuid.uuid4().hex[:8]}")
    tenant_id = getattr(request.state, "tenant_id", "anonymous")
    
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "type": exc.error_type,
            "title": exc.title,
            "status": exc.status_code,
            "detail": exc.detail,
            "instance": request.url.path,
            "tenant_id": tenant_id,
            "correlation_id": correlation_id,
            "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat()
        }
    )
```

### 13.2 Structured JSON Logger & Observability Engine
The logging engine formats all application events as structured JSON compatible with Google Cloud Logging and OpenTelemetry:

```json
{
  "timestamp": "2026-09-04T23:55:12.891Z",
  "severity": "WARNING",
  "tenant_id": "paramount_pictures",
  "correlation_id": "req-98f4-2026",
  "logger": "cinesynapse.sentries.meal_penalty",
  "message": "Meal penalty interval 2 breached for CHRONO-2026",
  "active_exposure_usd": 3500.0,
  "elapsed_hours": 6.35,
  "duration_ms": 4.2
}
```

### 13.3 Cloud Storage Architecture & Provider Abstraction
CINE-SYNAPSE abstracts media and asset persistence behind a unified `IStorageProvider` interface, allowing seamless switching between Google Cloud Storage (GCS) and local disk:

```python
from abc import ABC, abstractmethod
import hashlib

class IStorageProvider(ABC):
    @abstractmethod
    async def upload_asset(self, bucket: str, path: str, content: bytes, content_type: str) -> dict:
        pass

    @abstractmethod
    async def get_download_url(self, bucket: str, path: str, expires_seconds: int = 3600) -> str:
        pass

    @abstractmethod
    async def get_storage_quota(self, tenant_id: str) -> dict:
        pass

class GoogleCloudStorageProvider(IStorageProvider):
    def __init__(self, project_id: str):
        from google.cloud import storage
        self.client = storage.Client(project=project_id)

    async def upload_asset(self, bucket: str, path: str, content: bytes, content_type: str) -> dict:
        bucket_obj = self.client.bucket(bucket)
        blob = bucket_obj.blob(path)
        sha256 = hashlib.sha256(content).hexdigest()
        blob.metadata = {"sha256": sha256, "c2pa_signed": "true"}
        blob.upload_from_string(content, content_type=content_type)
        return {"uri": f"gs://{bucket}/{path}", "size_bytes": len(content), "sha256": sha256}

    async def get_download_url(self, bucket: str, path: str, expires_seconds: int = 3600) -> str:
        blob = self.client.bucket(bucket).blob(path)
        return blob.generate_signed_url(expiration=expires_seconds, method="GET")

    async def get_storage_quota(self, tenant_id: str) -> dict:
        # Mocked quota calculation based on tenant bucket scans
        return {"used_bytes": 45957382144, "quota_bytes": 1099511627776, "utilization_pct": 4.18}
```

### 13.4 Complete GitHub Actions CI/CD Pipeline (`.github/workflows/ci-cd.yml`)
```yaml
name: CINE-SYNAPSE Production CI/CD Pipeline

on:
  push:
    branches: [ main, release/* ]
  pull_request:
    branches: [ main ]

env:
  PROJECT_ID: cine-synapse-prod
  REGION: us-central1
  SERVICE_NAME: cinesynapse-studio-os
  IMAGE_NAME: gcr.io/cine-synapse-prod/studio-os

jobs:
  lint-and-typecheck:
    name: Code Quality & Type Safety
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Set up Python 3.11
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'
      - name: Install Linting Tools
        run: pip install ruff black
      - name: Run Ruff Linter
        run: ruff check backend/
      - name: Run Black Code Formatter Check
        run: black --check backend/
      - name: Set up Node.js 20
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json
      - name: Install Frontend Dependencies
        working-directory: frontend
        run: npm ci
      - name: TypeScript Type Check
        working-directory: frontend
        run: npx tsc --noEmit

  backend-tests:
    name: Pytest Automated Suite
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Set up Python 3.11
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'
      - name: Install Dependencies
        run: pip install -r requirements.txt pytest pytest-asyncio
      - name: Execute Pytest Suite
        run: pytest backend/tests/ -v --junitxml=report.xml

  build-and-deploy:
    name: Cloud Run Deployment
    needs: [lint-and-typecheck, backend-tests]
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Authenticate to Google Cloud
        uses: google-github-actions/auth@v2
        with:
          credentials_json: ${{ secrets.GCP_SA_KEY }}
      - name: Set up Cloud SDK
        uses: google-github-actions/setup-gcloud@v2
      - name: Configure Docker for Artifact Registry
        run: gcloud auth configure-docker gcr.io --quiet
      - name: Build and Push Production Container
        run: |
          docker build -t $IMAGE_NAME:${{ github.sha }} -t $IMAGE_NAME:latest .
          docker push $IMAGE_NAME:${{ github.sha }}
          docker push $IMAGE_NAME:latest
      - name: Deploy to Google Cloud Run
        uses: google-github-actions/deploy-cloudrun@v2
        with:
          service: ${{ env.SERVICE_NAME }}
          image: ${{ env.IMAGE_NAME }}:${{ github.sha }}
          region: ${{ env.REGION }}
          flags: '--min-instances=2 --max-instances=50 --cpu=4 --memory=8Gi --port=8080'
```

### 13.5 Production SRE Telemetry & Prometheus Metrics
The backend exposes Prometheus metrics at `/metrics` to power Grafana and Google Cloud Monitoring:
* `cinesynapse_http_requests_total{method, status, tenant_id}`
* `cinesynapse_http_request_duration_seconds{endpoint, le}` (Histogram)
* `cinesynapse_clickhouse_query_duration_seconds{query_type, le}` (Histogram)
* `cinesynapse_sentry_breaches_total{category, severity, tenant_id}` (Counter)
* `cinesynapse_active_tenants_gauge` (Gauge)
* `cinesynapse_gemini_token_consumption_total{model_id, token_type}` (Counter)
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

print("TAD successfully updated with Section 13 (SRE, Storage, Observability & CI/CD).")
