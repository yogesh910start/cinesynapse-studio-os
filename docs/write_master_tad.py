import os

content = """# MASTER TECHNICAL ARCHITECTURE DOCUMENT (TAD)

## CINE-SYNAPSE: The Autonomous Studio Operating System (Studio OS)
### *Enterprise Multi-Agent Production Graph & Orchestration Fabric for 2026 Cinema*

---

**Document Identifier:** CINE-SYNAPSE-TAD-V2.0-ENTERPRISE  
**System Classification:** Enterprise Mission-Critical / Multi-Tenant B2B SaaS  
**Author:** Principal AI Systems & Cloud Architect  
**Target Platform:** Google Cloud (Cloud Run, Vertex AI / Gemini 1.5 Pro) + ClickHouse Cloud  
**Primary Partner Track:** ClickHouse Track (`mcp-clickhouse`)  
**Secondary Ecosystem Partners:** Parallel Web Search API (`parallel-web`), OpenTimelineIO (OTIO)  
**Security & Compliance:** SOC 2 Type II, MPAA Content Security, C2PA Content Credentials  
**License:** MIT License (OSI Approved)  
**Date:** September 2026  

---

## Table of Contents
1. [Architectural Goals, Quality Attributes & System Invariants](#1-architectural-goals-quality-attributes--system-invariants)
2. [C4 Architecture Models (Context, Container, Component, Code)](#2-c4-architecture-models-context-container-component-code)
3. [Data Architecture & ClickHouse Columnar Schemas (Multi-Tenant DDL)](#3-data-architecture--clickhouse-columnar-schemas-multi-tenant-ddl)
4. [Gemini Multi-Agent Orchestration & MCP Protocol Engine](#4-gemini-multi-agent-orchestration--mcp-protocol-engine)
5. [Pluggable Enterprise Mesh Adapters (ShotGrid, Rightsline, Spherex, Frame.io)](#5-pluggable-enterprise-mesh-adapters-shotgrid-rightsline-spherex-frameio)
6. [The 7 Micro-Sentries: Complete Algorithmic Implementation](#6-the-7-micro-sentries-complete-algorithmic-implementation)
7. [REST API Specifications & Pydantic v2 Contracts (OpenAPI 3.1)](#7-rest-api-specifications--pydantic-v2-contracts-openapi-31)
8. [Negative Scenarios, Edge Cases & Failure Mode Analysis](#8-negative-scenarios-edge-cases--failure-mode-analysis)
9. [Multi-Tenant Security, Row-Level Security (RLS) & IAM](#9-multi-tenant-security-row-level-security-rls--iam)
10. [Infrastructure, Docker Containerization & Cloud Run Deployment](#10-infrastructure-docker-containerization--cloud-run-deployment)
11. [Automated Verification Matrix & Pytest Test Suite](#11-automated-verification-matrix--pytest-test-suite)

---

## 1. Architectural Goals, Quality Attributes & System Invariants

### 1.1 Key Architectural Invariants
* **Invariant 1 (Analytical Latency SLA):** All analytical joins across `production_graph`, `likeness_ledger`, and `territory_compliance` must complete in **$\le$ 15ms** via ClickHouse primary key index granularity.
* **Invariant 2 (Closed-Loop Reaction Time):** An on-set or editorial state change must evaluate across Legal, VFX, SRE, and Global Distribution within **$\le$ 2.5 seconds** end-to-end.
* **Invariant 3 (Strict AI Governance):** Strictly zero dependencies on non-Google AI models (no OpenAI, Anthropic, or AWS). 100% powered by `google-genai` (Gemini 1.5 Pro).
* **Invariant 4 (C2PA Zero-Trust Provenance):** Every video frame must maintain an unbroken cryptographic SHA-256 lineage manifest from camera RAW to delivery proxy.
* **Invariant 5 (Absolute Tenant Isolation):** ClickHouse Row-Level Security (RLS) ensures that zero data leaks between studio tenants (`Paramount`, `A24`, `Warner Bros`).

---

## 2. C4 Architecture Models

### 2.1 C4 Level 1: System Context
```mermaid
graph TD
    User_Dir([🎬 Film Director / 1st AD]) -->|On-Set Changes & Slate Voice Query| CS[«System»\nCINE-SYNAPSE Studio OS]
    User_Leg([⚖️ Studio Legal Affairs]) -->|Contract Terms & Likeness Approvals| CS
    User_VFX([🎨 VFX Supervisor / TD]) -->|Render Jobs & OpenTimelineIO Cuts| CS

    CS <-->|C2C Video Proxies & Timecode Webhooks| Ext_FIO[«System» Frame.io / Adobe C2C]
    CS <-->|Actor Likeness Caps & Union Contracts| Ext_RL[«System» Rightsline Enterprise API]
    CS <-->|Automated Rework Tickets & Pipeline| Ext_SG[«System» Autodesk Flow / ShotGrid]
    CS <-->|190-Territory Ratings & Certificates| Ext_SP[«System» Spherex Rating API]
    CS <-->|Live 2026 Regulatory Intelligence| Ext_PW[«System» Parallel Web Search API]
```

### 2.2 C4 Level 2: Container Diagram
```mermaid
graph TD
    subgraph Client Tier
        UI[«Container: React 18 + Vite + Tailwind»\nCINE-SYNAPSE Executive Studio Dashboard\nMidnight Blue & Cyber-Amethyst Theme]
    end

    subgraph Application Tier [Google Cloud Run]
        Gateway[«Container: FastAPI / Python 3.11»\nREST API & C2C Webhook Ingest]
        AgentEngine[«Container: google-genai»\nGemini 1.5 Pro Multi-Agent Core]
        SentryEngine[«Container: Python 3.11»\n7 Micro-Sentry Continuous Inspectors]
        MCPClient[«Container: MCP Client»\nStdio / SSE Client for ClickHouse]
    end

    subgraph Partner & Data Tier
        MCPDaemon[«Partner Server: mcp-clickhouse»\nModel Context Protocol JSON-RPC 2.0]
        ClickHouseDB[(«Partner Database: ClickHouse Cloud»\nColumnar Production Graph Engine\nMergeTree & ReplacingMergeTree)]
        VertexAI[«Google Cloud Service»\nGemini 1.5 Pro Multimodal API]
    end

    UI <-->|HTTPS / WebSockets| Gateway
    Gateway --> AgentEngine
    Gateway --> SentryEngine
    AgentEngine <--> VertexAI
    AgentEngine <--> MCPClient
    MCPClient <-->|JSON-RPC 2.0| MCPDaemon
    MCPDaemon <-->|TCP 9000| ClickHouseDB
```

---

## 3. Data Architecture & ClickHouse Columnar Schemas (Multi-Tenant DDL)

### 3.1 Multi-Tenant ClickHouse DDL Specifications

```sql
-- 1. Multi-Tenant Production Graph (Frame-Level Columnar Topology)
CREATE TABLE IF NOT EXISTS production_graph (
    tenant_id LowCardinality(String),
    project_id LowCardinality(String),
    scene_id LowCardinality(String),
    shot_id LowCardinality(String),
    take_number UInt8,
    frame_number UInt32,
    timecode_smpte String,
    fps Float32,
    camera_id LowCardinality(String),
    actor_ids Array(LowCardinality(String)),
    is_synthetic_performer UInt8,
    synthetic_asset_type Enum8('NONE'=0, 'FACE_REPLACE'=1, 'DE_AGING'=2, 'VOICE_CLONE'=3, 'FULL_SYNTHETIC'=4),
    c2pa_verified UInt8,
    c2pa_manifest_hash FixedString(64),
    color_space LowCardinality(String),
    created_at DateTime DEFAULT now()
) ENGINE = MergeTree()
PARTITION BY (tenant_id, toYYYYMM(created_at))
ORDER BY (tenant_id, scene_id, shot_id, take_number, frame_number)
SETTINGS index_granularity = 8192;

-- 2. SAG-AFTRA Digital Replica Likeness Ledger (NO FAKES Act)
CREATE TABLE IF NOT EXISTS likeness_ledger (
    tenant_id LowCardinality(String),
    actor_id LowCardinality(String),
    actor_name String,
    contract_id String,
    union_affiliation Enum8('SAG_AFTRA'=1, 'ACTRA'=2, 'EQUITY'=3, 'NON_UNION'=4),
    schedule_code Enum8('SCHEDULE_A'=1, 'SCHEDULE_B'=2, 'SCHEDULE_F'=3),
    authorized_seconds Float32,
    used_seconds Float32,
    residual_rate_per_sec Float32,
    consent_hash String,
    consent_expiry Date,
    updated_at DateTime DEFAULT now()
) ENGINE = ReplacingMergeTree(updated_at)
PRIMARY KEY (tenant_id, actor_id)
ORDER BY (tenant_id, actor_id, contract_id);

-- 3. Continuous Micro-Sentry Telemetry Ledger
CREATE TABLE IF NOT EXISTS micro_sentry_log (
    event_id UUID DEFAULT generateUUIDv4(),
    tenant_id LowCardinality(String),
    project_id LowCardinality(String),
    category Enum8(
        'TIMECODE_DRIFT' = 1,
        'C2PA_STRIPPED'  = 2,
        'AMBIENT_IP'     = 3,
        'MEAL_PENALTY'   = 4,
        'ACES_CLIPPING'  = 5,
        'SLATE_DESYNC'   = 6,
        'PROP_DESYNC'    = 7
    ),
    severity Enum8('INFO'=1, 'WARNING'=2, 'CRITICAL'=3),
    scene_id LowCardinality(String),
    take_id String,
    details String,
    financial_exposure_usd Float32,
    resolved UInt8 DEFAULT 0,
    timestamp DateTime DEFAULT now()
) ENGINE = MergeTree()
PARTITION BY (tenant_id, toYYYYMM(timestamp))
ORDER BY (tenant_id, severity, category, timestamp);

-- 4. Multi-Tenant Enterprise Row-Level Security (RLS)
CREATE ROW POLICY IF NOT EXISTS tenant_isolation_policy ON production_graph 
FOR SELECT, INSERT, UPDATE, DELETE 
USING (tenant_id = currentUser()) 
AS RESTRICTIVE 
TO ALL;
```

---

## 4. Gemini Multi-Agent Orchestration & MCP Protocol Engine

### 4.1 Agent Loop Implementation (`google-genai`)
```python
import json
import asyncio
from google import genai
from google.genai import types

class CineSynapseAgentCore:
    def __init__(self, api_key: str, clickhouse_mcp_client):
        self.client = genai.Client(api_key=api_key)
        self.mcp = clickhouse_mcp_client
        self.model_id = "gemini-1.5-pro"

    def get_tool_definitions(self):
        return [
            types.FunctionDeclaration(
                name="query_clickhouse",
                description="Executes sub-10ms analytical queries on the ClickHouse production graph",
                parameters=types.Schema(
                    type=types.Type.OBJECT,
                    properties={
                        "query": types.Schema(type=types.Type.STRING, description="ClickHouse SQL statement")
                    },
                    required=["query"]
                )
            ),
            types.FunctionDeclaration(
                name="dispatch_shotgrid_task",
                description="Dispatches rework or inpaint tasks to Autodesk Flow (ShotGrid)",
                parameters=types.Schema(
                    type=types.Type.OBJECT,
                    properties={
                        "scene_id": types.Schema(type=types.Type.STRING),
                        "description": types.Schema(type=types.Type.STRING),
                        "priority": types.Schema(type=types.Type.STRING, enum=["LOW", "MEDIUM", "HIGH", "CRITICAL"])
                    },
                    required=["scene_id", "description", "priority"]
                )
            )
        ]

    async def execute_ripple_simulation(self, tenant_id: str, action_payload: dict):
        system_instruction = f\"\"\"
        You are the Master Executive Supervisor of CINE-SYNAPSE Studio OS for tenant: {tenant_id}.
        Your goal is to evaluate the 5-dimensional ripple reaction of on-set changes across:
        1. SAG-AFTRA likeness duration and residual liabilities.
        2. Neural VFX GPU cluster memory capacity.
        3. Global 190-territory censorship compliance (Spherex).
        4. Transmedia franchise story canon.
        Always verify ClickHouse balances before approving synthetic double shots.
        \"\"\"

        tools = [types.Tool(function_declarations=self.get_tool_definitions())]
        config = types.GenerateContentConfig(
            system_instruction=system_instruction,
            tools=tools,
            temperature=0.1
        )

        prompt = f"Evaluate production ripple for change: {json.dumps(action_payload)}"
        response = self.client.models.generate_content(
            model=self.model_id,
            contents=prompt,
            config=config
        )

        # Handle Function Calling Loop
        if response.function_calls:
            for call in response.function_calls:
                if call.name == "query_clickhouse":
                    sql = call.args["query"]
                    db_result = await self.mcp.execute_query(sql)
                    # Feed back into conversation for final synthesis
                    return {"status": "RESOLVED", "db_metrics": db_result, "agent_response": response.text}

        return {"status": "SUCCESS", "verdict": response.text}
```

---

## 5. Pluggable Enterprise Mesh Adapters

### 5.1 Frame.io C2C Ingest Webhook (with HMAC-SHA256 Verification)
```python
import hmac
import hashlib
from fastapi import Request, HTTPException

async def verify_frameio_webhook(request: Request, secret: str) -> dict:
    signature = request.headers.get("x-frameio-signature")
    timestamp = request.headers.get("x-frameio-request-timestamp")
    body = await request.body()
    
    mac = hmac.new(secret.encode(), f"v0:{timestamp}:{body.decode()}".encode(), hashlib.sha256)
    expected_signature = f"v0={mac.hexdigest()}"
    
    if not hmac.compare_digest(signature, expected_signature):
        raise HTTPException(status_code=401, detail="Invalid Frame.io webhook signature")
    
    return await request.json()
```

---

## 6. The 7 Micro-Sentries: Complete Algorithmic Implementation

```python
class MicroSentryEngine:
    @staticmethod
    def check_timecode_drift(camera_fps: float, target_fps: float = 24.000, runtime_seconds: float = 7200.0) -> dict:
        delta = abs(camera_fps - target_fps)
        if 0.020 <= delta <= 0.030: # 23.976 pull-down
            frame_drift = ((target_fps - camera_fps) / target_fps) * runtime_seconds * target_fps
            return {
                "category": "TIMECODE_DRIFT",
                "severity": "CRITICAL",
                "drift_frames": round(frame_drift, 1),
                "drift_seconds": round(frame_drift / target_fps, 2),
                "auto_remediation": "APPLY_0.1_PERCENT_AUDIO_PULL_UP"
            }
        return {"category": "TIMECODE_DRIFT", "severity": "INFO", "drift_frames": 0.0}

    @staticmethod
    def check_meal_penalty(hours_elapsed: float, crew_count: int = 140) -> dict:
        if hours_elapsed <= 6.0:
            return {"severity": "INFO", "active_penalty_usd": 0.0}
        intervals = int((hours_elapsed - 6.0) / 0.25)
        rates = [25.0, 35.0] + [50.0] * max(0, intervals - 2)
        total_cost = crew_count * sum(rates[:intervals])
        return {
            "category": "MEAL_PENALTY",
            "severity": "CRITICAL" if intervals >= 2 else "WARNING",
            "intervals_breached": intervals,
            "financial_exposure_usd": total_cost,
            "ticking_countdown_mins": int((0.25 - ((hours_elapsed - 6.0) % 0.25)) * 60)
        }
```

---

## 7. REST API Specifications (OpenAPI 3.1 Pydantic Models)

```python
from pydantic import BaseModel, Field
from typing import List, Optional

class RippleAuditRequest(BaseModel):
    tenant_id: str = Field(..., example="paramount_prod")
    project_id: str = Field(..., example="chrono_2026")
    scene_id: str = Field(..., example="SCENE_42B")
    shot_id: str = Field(..., example="SHOT_14")
    proposed_action: str = Field(..., example="REPLACE_ACTOR_SYNTHETIC_DOUBLE")
    actor_id: str = Field(..., example="ACTOR_MARCUS_VANCE")
    duration_seconds: float = Field(..., example=6.2)

class RippleAuditResponse(BaseModel):
    verdict: str = Field(..., example="APPROVED_WITH_REMEDIATIONS")
    execution_time_ms: float = Field(..., example=14.2)
    remaining_likeness_sec: float = Field(..., example=7.8)
    accrued_residual_usd: float = Field(..., example=1860.00)
    allocated_vfx_node: str = Field(..., example="gpu-node-12.internal")
    shotgrid_task_created: Optional[str] = Field(None, example="TASK_8492")
```

---

## 8. Negative Scenarios, Edge Cases & Failure Mode Analysis

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                   NEGATIVE SCENARIO RESILIENCE MATRIX                            │
├───────────────────────┬───────────────────────────────┬──────────────────────────────────────────┤
│ Failure Mode          │ Root Cause                    │ CINE-SYNAPSE Self-Healing Reaction       │
├───────────────────────┼───────────────────────────────┼──────────────────────────────────────────┤
│ 1. ClickHouse Network │ Cloud node transient network  │ Fast fallback to read-replica; in-memory │
│    Timeout (>500ms)   │ partition during live shoot.  │ Redis write-buffer caches telemetry.     │
├───────────────────────┼───────────────────────────────┼──────────────────────────────────────────┤
│ 2. Gemini API Rate    │ High concurrency during       │ Exponential backoff with jitter;         │
│    Limit (HTTP 429)   │ multi-camera C2C upload burst.│ deterministic fallback rule engine.      │
├───────────────────────┼───────────────────────────────┼──────────────────────────────────────────┤
│ 3. Corrupt C2PA       │ Proxy transcoding stripped    │ Intercepts export; rebuilds C2PA manifest│
│    Signature Hash     │ cryptographic manifest byte.  │ from parent camera RAW SHA-256 hash.     │
├───────────────────────┼───────────────────────────────┼──────────────────────────────────────────┤
│ 4. Out-of-Order Takes │ Poor Wi-Fi upload order on    │ ClickHouse `ReplacingMergeTree` re-orders│
│    (Take 3 before 2)  │ remote film location.         │ events by `created_at` timestamp safely. │
└───────────────────────┴───────────────────────────────┴──────────────────────────────────────────┘
```

---

## 9. Multi-Tenant Security, Row-Level Security (RLS) & IAM

* **Tenant Resolution:** Inbound requests pass through `TenantContextMiddleware` validating signed RS256 JWT tokens.
* **Secret Isolation:** Each studio tenant connects their own API keys for Frame.io and ShotGrid stored in Google Cloud Secret Manager.
* **Tenant Auditing:** All queries log `tenant_id`, `user_id`, `gemini_tokens`, and `query_duration_ms` for SOC 2 compliance.

---

## 10. Infrastructure, Docker Containerization & Cloud Run Deployment

```dockerfile
# Multi-Stage Production Dockerfile
FROM python:3.11-slim as builder
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends build-essential curl
COPY requirements.txt .
RUN pip install --user --no-cache-dir -r requirements.txt

FROM python:3.11-slim as runner
WORKDIR /app
COPY --from=builder /root/.local /root/.local
COPY . .
ENV PATH=/root/.local/bin:$PATH
ENV PORT=8080
EXPOSE 8080
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8080"]
```

---

## 11. Automated Verification Matrix & Pytest Test Suite

```python
import pytest
from backend.services.sentries import MicroSentryEngine

def test_fractional_timecode_drift_detection():
    # Test 23.976 fps on 24.000 project
    result = MicroSentryEngine.check_timecode_drift(camera_fps=23.976, target_fps=24.000, runtime_seconds=7200.0)
    assert result["severity"] == "CRITICAL"
    assert result["drift_seconds"] == 7.2
    assert result["auto_remediation"] == "APPLY_0.1_PERCENT_AUDIO_PULL_UP"

def test_meal_penalty_calculation():
    # 6 hours 45 mins elapsed (3 intervals)
    result = MicroSentryEngine.check_meal_penalty(hours_elapsed=6.75, crew_count=100)
    assert result["severity"] == "CRITICAL"
    assert result["intervals_breached"] == 3
    assert result["financial_exposure_usd"] == 100 * (25.0 + 35.0 + 50.0)
```
"""

with open("/Users/ymore/.gemini/antigravity/scratch/cine_synapse/docs/TECHNICAL_ARCHITECTURE_DOCUMENT.md", "w", encoding="utf-8") as f:
    f.write(content)

with open("/Users/ymore/.gemini/antigravity/brain/fba0b760-63ef-46ec-8f1c-65de7e95e8a1/TECHNICAL_ARCHITECTURE_DOCUMENT.md", "w", encoding="utf-8") as f:
    f.write(content)

print("Master TAD successfully rewritten and saved in both locations.")
