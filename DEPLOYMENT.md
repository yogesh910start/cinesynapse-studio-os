# CineSynapse Studio OS — Production Deployment & Git Guide

This guide details how to build, test, containerize, and deploy **CineSynapse** across cloud environments (Google Cloud Run, Docker Compose, Bare-metal) and connect your repository to GitHub.

---

## 📋 Hackathon Compliance Checklist

- [x] **Open Source License:** OSI-approved MIT License located in root [`LICENSE`](./LICENSE).
- [x] **Google Cloud GenAI SDK:** Integrated and actively imported via `google-genai` and `google-cloud-aiplatform` in [`backend/services/gemini_agent.py`](./backend/services/gemini_agent.py).
- [x] **ClickHouse Partner Track:** Active runtime database integration via ClickHouse Cloud client and official MCP server [`backend/database/clickhouse_mcp.py`](./backend/database/clickhouse_mcp.py).
- [x] **Clean Repository:** Heavy media files (>100MB) and local virtual environments excluded via [`.gitignore`](./.gitignore).

---

## 🚀 Deployment Options

### Option 1: Single-Container Production Image (Cloud Run / Docker)

The multi-stage `Dockerfile` compiles the React 18 + TypeScript SPA in Stage 1 and serves it directly through FastAPI on port `8080` in Stage 2.

```bash
# 1. Build the production multi-stage image
docker build --target production -t cinesynapse:latest .

# 2. Run the container locally or on any cloud VM
docker run -d \
  -p 8080:8080 \
  --name cinesynapse \
  --env-file .env.production.example \
  cinesynapse:latest

# 3. Access in browser
open http://localhost:8080
```

### Option 2: Docker Compose (Local Staging)

```bash
# Start backend and frontend services
docker compose up -d

# Check service logs
docker compose logs -f
```

### Option 3: Google Cloud Run Serverless Deployment

```bash
# 1. Set Google Cloud Project
gcloud config set project YOUR_GCP_PROJECT_ID

# 2. Enable Cloud Run & Artifact Registry
gcloud services enable run.googleapis.com artifactregistry.googleapis.com

# 3. Build & Deploy directly from source
gcloud run deploy cinesynapse-studio-os \
  --source . \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --port 8080 \
  --memory 4Gi \
  --cpu 2
```

### Option 4: Free One-Click Deployment on Render.com (Zero-Config Blueprint)

The repository includes a production-ready Render Blueprint ([`render.yaml`](./render.yaml)) configured for Render's **Free Tier**.

#### Method A: 1-Click Infrastructure as Code (Blueprint)
1. Log into your [Render Dashboard](https://dashboard.render.com/).
2. Click **New +** $\to$ **Blueprint**.
3. Connect your GitHub repository: `https://github.com/yogesh910start/cinesynapse-studio-os`.
4. Render will automatically parse `render.yaml`, recognizing the Docker multi-stage service, health check at `/healthz`, and 512 MB memory footprint.
5. (Optional) Provide your `GEMINI_API_KEY` under Environment Variables.
6. Click **Apply**. Render builds the image and launches your live URL: `https://cinesynapse-studio-os.onrender.com`.

#### Method B: Manual Web Service
1. Click **New +** $\to$ **Web Service**.
2. Connect `https://github.com/yogesh910start/cinesynapse-studio-os`.
3. Select **Docker** as the runtime.
4. Select **Free** instance type.
5. Under **Advanced**, set **Health Check Path** to `/healthz`.
6. Click **Create Web Service**.

---

## 🛠️ Local Development Setup

### 1. Backend Setup
```bash
# Activate Python 3.11+ environment
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run automated tests (37 tests)
pytest backend/tests/ -v

# Launch backend
uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```

### 2. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Verify TypeScript types & build bundle
npm run build

# Start Vite dev server
npm run dev
```

---

## 🌐 Git Setup & Upload to GitHub

Follow these steps to push your clean, production-ready repository to GitHub:

### Step 1: Create a New Public Repository on GitHub
1. Navigate to [github.com/new](https://github.com/new).
2. Repository Name: `cinesynapse-studio-os`
3. Visibility: **Public** *(Mandatory per hackathon rules)*.
4. Do **not** check "Initialize with README", .gitignore, or license (we already created them).
5. Click **Create repository**.

### Step 2: Push Local Code to GitHub
Run the following commands inside `/Users/ymore/.gemini/antigravity/scratch/cine_synapse`:

```bash
# 1. Initialize Git repository on the main branch
git init -b main

# 2. Stage all files (verified against .gitignore)
git add .

# 3. Create initial production commit
git commit -m "feat: initial commit of CineSynapse Studio OS v2.0 with CI/CD"

# 4. Link your GitHub remote (replace with your actual URL)
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/cinesynapse-studio-os.git

# 5. Push to GitHub
git push -u origin main
```

---

## 🔒 Automated CI/CD (GitHub Actions)

Once pushed to `main`, GitHub Actions automatically triggers [`.github/workflows/ci-cd.yml`](./.github/workflows/ci-cd.yml):
1. **Code Quality:** Python bytecode compilation + TypeScript static check (`npx tsc --noEmit`).
2. **Backend Tests:** 37 Pytest unit, SRE, and E2E scenario tests.
3. **Docker Build:** Builds the multi-stage production container image.
4. **Cloud Run:** Automatically deploys to Google Cloud Run when `GCP_SA_KEY` is configured in repository secrets.
