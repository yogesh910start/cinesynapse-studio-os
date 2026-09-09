# CINE-SYNAPSE / Studio OS: End-to-End Manual Testing Guide
**Comprehensive Quality Assurance & Feature Verification Manual**
*Version: 2.4.0-Production | Standards: OMC ISO-1004, TPN Gold Shield v5.2, C2PA v2.1, SAG-AFTRA 2026 TV/Theatrical Agreement*

---

## Executive Summary & Test Environment Setup

This document provides a systematic, zero-omission manual test protocol for the **CINE-SYNAPSE Studio OS** platform. It guides a Quality Assurance (QA) engineer, Director, Digital Imaging Technician (DIT), or Studio SRE through testing **every single interactive element, button, modal, drawer, and workflow** from a clean slate.

### Required Prerequisites
1. **Operating System:** macOS / Linux / Windows with Chrome or modern Chromium browser.
2. **Backend Engine:** FastAPI server running at `http://localhost:8000` (or `run.sh`).
3. **Frontend Application:** React + Vite development server running at `http://localhost:5173` (or `npm run dev`).
4. **Test Media:** 4 fight clips from *The Matrix* (e.g., MP4/MOV/WebM):
   - **Clip 1:** Dojo Sparring (Neo vs. Morpheus — Kung Fu / Hand-to-Hand)
   - **Clip 2:** Subway Station Fight (Neo vs. Agent Smith — Wirework & Impact)
   - **Clip 3:** Government Lobby / Rooftop Bullet-Time (Neo & Trinity — High-Speed Acrobatics)
   - **Clip 4:** Burly Brawl (Neo vs. Multiple Agent Smith Clones — Neural Replica & Stunt Doubling)

---

## Phase 0: Fresh Studio Tenant & Movie Project Creation (From Scratch)

### Test Case 0.1: Register a New Studio Organization (Tenant)
* **Goal:** Verify multi-tenant isolation by creating a brand-new studio entity.
* **Steps:**
  1. Open `http://localhost:5173` in your browser.
  2. Look at the top navigation header. Locate the **Studio Tenant Selector** (left-most dropdown).
  3. Click the dropdown and select **`➕ Register New Studio...`** (or click the Studio registration trigger).
  4. The **`REGISTER STUDIO TENANT`** modal opens.
  5. Test input fields:
     - **Studio Organization Name:** Enter `Silver Pictures / Village Roadshow`
     - **Tenant Slug (Unique ID):** Enter `silver_pictures` (verify auto-slug formatting)
     - **Short Code:** Enter `SILV` (verify 3-4 uppercase characters enforced)
     - **Studio Icon / Emblem Emoji:** Click one of the quick emoji buttons (e.g. `🏛️`, `🎬`, or `🦅`).
  6. Click **`Cancel`** first to ensure modal dismisses cleanly without state corruption.
  7. Re-open modal, fill in the values, and click **`Register Studio`**.
* **Expected Result:**
  - The modal closes.
  - A toast notification confirms studio registration.
  - The Studio Tenant dropdown in the header updates to display `🏛️ Silver Pictures / Village Roadshow (SILV)`.

### Test Case 0.2: Create a Clean Movie Project from Scratch
* **Goal:** Create an isolated project container with a 100% blank slate.
* **Steps:**
  1. In the top header, click the **`➕ New Project`** button (`#btn-new-project`).
  2. The **`CREATE NEW MOVIE PROJECT`** modal opens.
  3. Fill in project specifications:
     - **Studio Organization:** Ensure `Silver Pictures / Village Roadshow` is selected.
     - **Movie Title:** Enter `The Matrix: Resurrections & Revolutions`
     - **Project Code / Slug:** Enter `MATRIX-2026`
     - **Principal Director(s):** Enter `Lana & Lilly Wachowski`
     - **Target Capture FPS:** Select `24.000 fps (SMPTE Theatrical Master)`
     - **Master Aspect Ratio:** Select `2.39:1 Anamorphic Scope`
     - **Project Initialization Mode:** Select the radio card **`✨ Clean Blank Slate`** (0 scenes, 0 takes, 0 likeness riders).
     - **Production Logline / Scope:** Enter `Principal martial arts photography and neural digital double benchmarking.`
  4. Click **`Create Movie Project`**.
* **Expected Result:**
  - Spinner displays during creation.
  - Modal closes, and the **Movie Project Dropdown** switches to `🎬 The Matrix: Resurrections & Revolutions (MATRIX-2026)`.
  - All screens are now bound to this isolated project namespace.

---

## Phase 1: Global Navigation, Header, Status Bar & Utilities

### Test Case 1.1: Header Global Controls & Quick Launchers
* **Steps:**
  1. **Studio Dropdown:** Switch between `Warner Bros. Discovery`, `Paramount Pictures`, and your newly created `Silver Pictures`. Verify active project lists update dynamically.
  2. **Project Dropdown:** Switch between projects. Verify active project badge in header updates immediately.
  3. **`📦 Storage Vault` Button:** Click the top-header button. Verify the workspace transitions directly to **Screen 9: Storage & Security Vault**.
  4. **`⚡ Logs` Button:** Click the top-header button. Verify the bottom **SRE Telemetry & Structured Audit Logger** drawer slides open.
  5. **`🧪 Scenarios` Menu:** Click to toggle the Hackathon Scenario Bar:
     - Click `1. Trigger 23.976 Drift (+7.2s)` -> Observe toast and drift telemetry in Camera Sentry.
     - Click `2. Breach Meal Penalty Tier 2 ($3.5k)` -> Observe War Room notification and financial liability alert.
     - Click `3. Synthesize Past SAG Cap (Freeze)` -> Observe likeness freeze in Likeness Ledger.
     - Click `4. Dispatch ShotGrid Inpaint` -> Observe ShotGrid task dispatch toast.
  6. **User Profile Dropdown:** Click the user avatar in the top right. Inspect active role, tenant ID, and session status.

### Test Case 1.2: Real-Time SRE Telemetry Logger Drawer
* **Steps:**
  1. Open the drawer via the `⚡ Logs` button.
  2. Click the severity filter pills: `ALL`, `INFO`, `WARNING`, `CRITICAL`. Verify the log entries filter in real-time.
  3. Click **`Export JSONL`**. Verify a notification confirms export of structured OpenTelemetry JSON lines.
  4. Click the **`✕`** button in the top right of the drawer to close it.

### Test Case 1.3: Global Bottom Status Bar (`StatusBar.tsx`)
* **Steps:**
  1. Observe the persistent bottom dock:
     - **ClickHouse Latency:** Verify sub-15ms reading (e.g. `ClickHouse: 11.4ms`).
     - **Gemini Engine:** Verify `Gemini 1.5 Pro | 1.2M ctx`.
     - **C2PA Status:** Verify `C2PA: Root-of-Trust Valid`.
     - **Compliance Badges:** Verify `OMC ISO-1004` and `TPN Gold Shield v5.2`.
     - **Live Ingress Speed:** Verify real-time network throughput (e.g. `800G RoCE: 3.8 GB/s`).
  2. Click the **`[📦 Vault]`** shortcut button in the status bar -> Verify navigation to Screen 9.
  3. Click the **`[⚡ SRE Logs]`** shortcut button -> Verify logs drawer opens.

---

## Phase 2: Screen 1 — Autonomous Production Graph

### Test Case 2.1: KPI Filters & Topology Visualizer
* **Steps:**
  1. In the left sidebar, click **`🌐 Production Graph`** (`Screen 1`).
  2. Click the KPI filter buttons:
     - `All Nodes` (Full production graph)
     - `Production Pipeline` (Ingest, Sentry, Vault)
     - `Sentry & Security` (C2C, Hardware Enclaves, C2PA)
     - `Distribution & Legal` (SAG Likeness, 190-Territory Compliance)
  3. Click any graph node (e.g. `Camera Sentry`, `SAG Likeness Ledger`, or `Cloud Vault`).
* **Expected Result:**
  - Selected node highlights with glowing cyan/purple border.
  - Node inspector side-panel slides out displaying upstream/downstream dependencies, throughput latency, and status.

### Test Case 2.2: 5-Dimensional Autonomous Consensus Check
* **Steps:**
  1. Click the button **`[▶ Run 5-D Consensus Check]`**.
  2. Observe the multi-stage simulation progression:
     - Stage 1: Querying ClickHouse Production Graph (< 15ms).
     - Stage 2: Checking SAG-AFTRA Schedule A likeness caps.
     - Stage 3: Verifying Spherex 190-Territory compliance & inpaint requirements.
     - Stage 4: Allocating neural VFX cluster memory (H100 nodes).
  3. Review the consensus verdict card:
     - Verdict: `APPROVED_WITH_AUTOMATED_REMEDIATION`
     - ShotGrid Ticket generated (`SG-TASK-8492`)
     - Remediations: Audio pull-up filter applied, territory inpaint dispatched, likeness headroom validated.

---

## Phase 3: Screen 2 — On-Set Camera Sentry (Matrix Clips Verification)

*This is the core on-set testing screen where you will verify your 4 Matrix fight clips.*

### Test Case 3.1: Loading the 4 Matrix Fight Clips into Multi-Camera Feeds
* **Matrix Clip Allocation:**
  - **Camera A (Master A-Cam / ARRI ALEXA 35):** Load **Clip 1 (Dojo Sparring)**
  - **Camera B (B-Cam / RED V-RAPTOR XL):** Load **Clip 2 (Subway Fight vs Agent Smith)**
  - **Camera C (VFX High-Speed / Sony VENICE 2):** Load **Clip 3 (Rooftop Bullet-Time)**
  - **Camera D (Aux Witness Cam):** Load **Clip 4 (Burly Brawl Multi-Smith)**
* **Steps:**
  1. In the left sidebar, click **`📹 On-Set Camera Sentry`** (`Screen 2`).
  2. On **Camera A card**, click the **Upload / File selector** or drag **Clip 1** directly onto the viewport canvas.
  3. On **Camera B card**, drag & drop **Clip 2**.
  4. On **Camera C card**, drag & drop **Clip 3**.
  5. On **Camera D card**, drag & drop **Clip 4**.
* **Expected Result:**
  - Each camera viewport mounts its respective video clip cleanly.
  - Source type updates to `file`, and video metadata (codec, framerate, resolution) displays on the HUD.

### Test Case 3.2: Master Transport & Synchronized Playback Controls
* **Steps:**
  1. Locate the **Master Transport Ribbon** in the central viewport:
     - Click **`▶ PLAY`** (or press Spacebar). Verify all active camera video feeds play synchronously.
     - Click **`⏸ PAUSE`** (or press Spacebar). Verify all feeds freeze on the exact frame.
     - Click **`Step +1 Frame`** (or press `L`). Verify feeds advance by exactly 1 SMPTE frame.
     - Click **`Step -1 Frame`** (or press `J`). Verify feeds step backward by 1 frame.
     - Drag the **SMPTE Scrubbing Slider**. Verify smooth scrubbing across timecode marks.
     - Click **`Mark IN`** (`[`) and **`Mark OUT`** (`]`) to set take sub-clip boundaries.

### Test Case 3.3: DIT Assist Toolbelt (False Color, Peaking, Scopes, CDL)
* **Steps:**
  1. Click **`False Color`** toggle. Verify ARRI LogC4 false-color thermal exposure overlay applies over the Matrix video feeds.
  2. Click **`Focus Peaking`** toggle. Verify high-contrast green edge peaking illuminates martial arts punch impacts.
  3. Click **`Zebra Stripes`** toggle. Verify 95% IRE highlight zebra hatching appears over bright ceiling lights.
  4. Click **`Frame Guides`** dropdown:
     - Switch between `2.39:1 Anamorphic Scope`, `1.85:1 Flat`, and `1.43:1 IMAX`. Verify framing mask overlays adjust accurately.
  5. Click **`Anamorphic De-Squeeze`** dropdown:
     - Test `1.33x`, `1.5x`, `1.8x`, and `2.0x` anamorphic unsqueeze transformations.
  6. Click **`Real-Time Video Scopes`** tab (Shortcut: `W`):
     - Inspect the **Waveform Monitor** (Luminance distribution).
     - Inspect the **Vectorscope** (Skin-tone line alignment for Keanu Reeves / Neo).
     - Inspect the **RGB Parade** (Red, Green, Blue channel balance, highlighting Matrix green tint).
  7. Click **`ASC-CDL Grading Dock`**:
     - Adjust **Slope** (Gain), **Offset** (Lift), **Power** (Gamma), and **Saturation**.
     - Verify instant real-time color correction applied to the live canvas.
     - Click **`Reset CDL`** to restore neutral uncalibrated values.

### Test Case 3.4: Slate Management & Take Verdict Buttons
* **Steps:**
  1. Click **`[+ New Slate / Setup]`** button in the top ribbon:
     - Enter **Scene:** `102` (Dojo Sparring)
     - Enter **Setup:** `B` (Medium Close-Up)
     - Enter **Take:** `1`
     - Select **Lens:** `Cooke Anamorphic /i 40mm T2.0`
     - Click **`Apply Slate`**. Verify top slate banner updates to `SC102-B-TK1`.
  2. Play Clip 1 to the end of the combat sequence.
  3. Test Verdict Buttons:
     - Click **`🟢 CIRCLE TAKE`**: Verify take is stamped as preferred editorial take. A green toast confirms conform logging to ClickHouse.
     - Click **`🟡 HOLD TAKE`**: Verify take is stamped as backup VFX plate.
     - Click **`🔴 NG (NO GOOD)`**: Verify modal prompts for rejection reason (`Boom in shot`, `Focus buzz`, `Timecode drift`) and logs rejection.

### Test Case 3.5: Ingest Matrix & Sentry Drift Remediation
* **Steps:**
  1. In the bottom dock of Screen 2, click the **`📊 Ingest Matrix`** tab.
  2. Review the cross-camera genlock table comparing Cam A, B, C, and D:
     - Genlock Phase status (Locked / 0.000 ms jitter).
     - PTP Grandmaster Clock ID.
     - C2C 10GbE uplink bitrates.
  3. Switch back to **`⚡ Sentinel Cards`** tab:
     - Locate a simulated drift card (e.g. `Cam B audio drift +1.5 frames`).
     - Click **`[⚡ Auto-Remediate]`**.
     - Verify audio pull-up/pull-down filter recalculates timecode and clears the breach alert.

---

## Phase 4: Screen 3 — SAG-AFTRA Digital Replica Likeness Ledger

*This screen verifies compliance with the SAG-AFTRA 2026 Agreement and Federal NO FAKES Act for digital doubles.*

### Test Case 4.1: Register Matrix Performers (Neo & Agent Smith)
* **Steps:**
  1. In the left sidebar, click **`⚖️ SAG Likeness Ledger`** (`Screen 3`).
  2. Click the **`➕ Add Performer Rider`** button.
  3. The registration modal opens. Enter Keanu Reeves' details:
     - **Performer Legal Name:** `Keanu Reeves`
     - **Character Role:** `Neo / Thomas Anderson`
     - **Contract ID:** `SAG-2026-KR-NEO-001`
     - **Union Schedule:** Select `SCHEDULE_F (Buyout / Major Role)`
     - **Replica Type:** Select `Generative Neural Replica & Stunt Double`
     - **Authorized Screen Seconds:** Enter `180.0`
     - **Residual Rate ($/sec):** Enter `500.00`
     - **Consent Expiration:** Enter `2028-12-31`
     - Click **`Register Performer`**.
  4. Repeat and add Hugo Weaving:
     - **Performer Legal Name:** `Hugo Weaving`
     - **Character Role:** `Agent Smith`
     - **Contract ID:** `SAG-2026-HW-SMITH-002`
     - **Union Schedule:** Select `SCHEDULE_A (Stunt & Double)`
     - **Authorized Screen Seconds:** Enter `60.0`
     - **Residual Rate ($/sec):** Enter `350.00`
     - Click **`Register Performer`**.
* **Expected Result:**
  - Both performers appear as cards in the Likeness Ledger.
  - Active union cast count updates to `2 Performers`.
  - Authorized cap displays `240.0s Total`.

### Test Case 4.2: Top-Up Screen Time Quota (+15s Extension)
* **Steps:**
  1. Locate the card for **Keanu Reeves**.
  2. Click the **`+15s`** button in the action column.
* **Expected Result:**
  - A toast notification confirms: `✓ Authorized +15.0s extension for Keanu Reeves (NO FAKES Act Amendment Signed)`.
  - Keanu Reeves' authorized cap increments from `180.0s` to `195.0s`.
  - Total Authorized Cap metric in top ribbon updates instantly.

### Test Case 4.3: Synthetic Double Inspector (A/B Split Wipe & Gaussian Splatting)
* **Steps:**
  1. On the card for **Keanu Reeves**, click the **`🧬 Double`** button.
  2. The **Synthetic Double Inspector Modal** opens.
  3. Inspect HUD metrics:
     - Scan Fidelity: `99.6%`
     - Landmark Deviation: `0.038 mm`
     - Gamut Match: `ACEScg SMPTE ST 2065-1`
     - Topology Points: `148,200 pts`
     - Render Engine: `Neural Gaussian Splatting v4.2 / Unreal Substrate`
  4. Test Display Modes:
     - Click **`🔀 A/B Split Wipe`**: Drag the slider handle from 0% to 100%. Observe clean split between raw photogrammetry plate and neural double pass.
     - Click **`📐 Photogrammetry Mesh`**: Inspect 3D wireframe topology.
     - Click **`✨ Neural Composite`**: Inspect final post-processed digital double composite.
     - Click **`🔬 Landmark Delta`**: Inspect difference heatmap highlighting facial landmark deltas.
  5. Click **`+15s Top-Up`** inside the modal header -> Verify headroom increments.
  6. Click **`✕`** to close modal.

### Test Case 4.4: C2PA Cryptographic Provenance Manifest Viewer
* **Steps:**
  1. On any performer card, click the **`🔒 c2pa:sha256:...`** link.
  2. The **C2PA Cryptographic Provenance Manifest Modal** opens.
  3. Inspect the cryptographic trust chain:
     - Root of Trust: `ARRI Alexa 35 Hardware Enclave CA`
     - X.509 Issuer: `DigiCert Studio CA v3 / SAG-AFTRA Trust Network`
     - Hardware Serial Number & PTP Timestamp.
     - Integrity Status: `VERIFIED_VALID`.
  4. Click **`📋 Copy SHA-256 Hash`**. Verify clipboard receives the hash string and a toast confirms copy.
  5. Click **`✕`** to close modal.

### Test Case 4.5: Performer Audit Drawer & Live Shot Deduction Simulator
* **Steps:**
  1. On **Hugo Weaving (Agent Smith)** card, click **`Audit`**.
  2. The **Performer Audit Drawer** slides out from the right.
  3. **Tab 1: Shot Deductions & History:**
     - Review past conformed takes where the neural replica was used.
  4. **Tab 2: Permitted vs Prohibited Use Matrix:**
     - Test the interactive compliance checker dropdown:
       - Select `Dangerous wirework replacement` -> Cleared (Green).
       - Select `Dialogue generation unscripted by principal author` -> Prohibited (Red alert citing Section 4(B)).
       - Select `Commercial merchandising avatar` -> Prohibited (Red alert citing Rider B).
  5. **Tab 3: Shot Deduction Simulator:**
     - Enter Scene: `Scene 104` (Burly Brawl)
     - Enter Take: `3`
     - Enter Seconds to Deduct: `12.5`
     - Enter Description: `Courtyard pole spin multi-clone composite`
     - Click **`Record Live Shot Deduction`**.
* **Expected Result:**
  - The drawer submits the deduction to ClickHouse and the physical ledger.
  - Used seconds increment by `12.5s`.
  - Burn rate percentage updates and residual liabilities recalculate immediately.

### Test Case 4.6: Export SAG Section 43 Compliance Packet
* **Steps:**
  1. Inside the Audit Drawer, click **`Export Section 43 Audit Packet`**.
  2. The **SAG-AFTRA Certified Digital Replica Delivery Packet Modal** opens.
  3. Verify the generated formal union packet:
     - Packet ID, Timestamp, SAG Agreement Clause (Section 43 MBA).
     - Performer Consent Hash & Escrow Statement.
  4. Test Export Buttons:
     - Click **`📋 Copy JSON Payload`** -> Verifies clipboard copy.
     - Click **`💾 Download Formal JSON Packet`** -> Downloads `.json` file to local machine.
     - Click **`🖨️ Print Formal Delivery Packet`** -> Triggers browser print preview.
  5. Close the export modal and drawer.

---

## Phase 5: Screen 4 — 190-Territory Distribution Compliance & Inpaint Hub

### Test Case 5.1: Territory Inspection & Infraction Rules
* **Steps:**
  1. In the left sidebar, click **`🌍 Global Compliance`** (`Screen 4`).
  2. Review the top summary counters: `142 Cleared`, `36 Inpaint Required`, `12 Banned/Strict`.
  3. In the territory grid, click:
     - **Saudi Arabia (GCAM):** Inspect cultural rules regarding alcohol, religious references, and violent blood impact.
     - **China (NRTA):** Inspect rules regarding supernatural apparitions, excessive gore, and political symbols.
     - **Singapore (IMDA):** Inspect violence and substance use guidelines.
     - **United States (MPAA):** Inspect PG-13 vs R rating triggers.

### Test Case 5.2: Generative Inpaint A/B Comparison & ShotGrid Dispatch
* **Steps:**
  1. Select **Saudi Arabia (GCAM)** or **Singapore (IMDA)**.
  2. Click **`Toggle Inpaint Preview`**.
  3. Observe the viewport switch between the **Original Live-Action Plate** (with infraction highlighted in red bounding box) and the **Generative Inpainted Clean Plate** (with infraction removed via AI inpainting).
  4. Click the button **`[🚀 Dispatch to ShotGrid / Autodesk Flow]`**.
* **Expected Result:**
  - Button transitions to confirmed state.
  - Toast displays: `✓ Dispatched VFX Inpaint Task SG-TASK-8492 to Autodesk Flow for Saudi Arabia!`.
  - Selected territory status transitions from `INPAINT_REQUIRED` to `INPAINT_DISPATCHED / CLEARED`.

---

## Phase 6: Screen 5 — SaaS Tenant Portal & IAM Security

### Test Case 6.1: Personas & Role-Based Access Control (RBAC)
* **Steps:**
  1. In the left sidebar, click **`🏢 Tenants & Access`** (`Screen 5`).
  2. Select different personas from the left selector card:
     - **Production Attorney / Legal:** Focus on SAG agreements and C2PA provenance.
     - **Director / Executive Producer:** Full creative and slate approvals.
     - **DIT / Color Engineer:** Focus on camera telemetry, ASC-CDL LUTs, and storage.
     - **VFX Supervisor:** Focus on digital doubles, inpaint dispatch, and ShotGrid.
     - **Cloud SRE / Security Admin:** Focus on KMS keys, TPN Gold Shield, and multi-petabyte vault.

### Test Case 6.2: Single Sign-On (SSO) Handshake Simulation
* **Steps:**
  1. Click **`Okta Enterprise SSO`**.
  2. Click **`Ping Identity`**.
  3. Click **`Google Workspace SAML 2.0`**.
* **Expected Result:**
  - Fast token exchange simulation occurs.
  - A cryptographically signed JWT token appears in the session token box (`eyJhbGciOiJSUzI1Ni...`).
  - Toast confirms: `SSO Handshake verified via [Provider]! Authenticated as [Persona]`.

### Test Case 6.3: RLS Policy Explorer & Security Audit
* **Steps:**
  1. Click **`RLS Policy Explorer`** tab:
     - Review row-level security table permissions for ClickHouse and PostgreSQL (Read, Write, Redact, Sign).
  2. Click **`Security Audit`** tab:
     - Inspect active session fingerprint and hardware enclave certificate.
     - Click **`Revoke Token / Sign Out`** -> Verify session transitions to `REVOKED`.
     - Click **`Re-Authenticate via Okta`** -> Verify session restores.
     - Click **`Proceed to Studio OS Dashboard`** -> Verifies smooth transition back to main workspace.

---

## Phase 7: Screen 6 — Timeline Ingest & Conform Hub

### Test Case 7.1: Ingesting Editorial Timelines
* **Steps:**
  1. In the left sidebar, click **`⏱️ Timeline Ingest`** (`Screen 6`).
  2. Observe the Ingest Dropzone:
     - Drag & drop an OpenTimelineIO file (`.otio`), Avid EDL (`.edl`), Final Cut XML (`.fcpxml`), or Script Supervisor breakdown (`.pdf`).
     - Or click the shortcut button **`[📁 Load Sample Matrix OTIO Timeline]`**.
* **Expected Result:**
  - Timeline parser loads conformed tracks immediately.
  - Track count, total duration, and clip count display in the header.

### Test Case 7.2: Multi-Track Visualizer & Clip Metadata Inspector
* **Steps:**
  1. Review the multi-track timeline:
     - **Track V1:** Master Camera RAW Plates.
     - **Track V2:** Generative Neural Inpaint Pass.
     - **Tracks A1-A3:** Production Boom, Lav 1 (Neo), Lav 2 (Agent Smith).
  2. Click on individual clip blocks in the timeline:
     - Inspect the **Clip Inspector Panel** on the right:
       - Timecode IN / OUT
       - Lens metadata (e.g. `Cooke Anamorphic /i 32mm T2.3`)
       - C2PA Hardware Enclave Root of Trust
       - Color Space (`ACEScg AP1`)
       - Associated SAG Likeness Performer
       - Global Distribution clearance note.
  3. Click **`Conform & Dispatch to VFX Pipeline`**. Verify conform verification toast.

---

## Phase 8: Screen 7 — Studio Copilot & Professional Side-Tools

### Test Case 8.1: Gemini 1.5 Pro Studio Copilot
* **Steps:**
  1. In the left sidebar, click **`🤖 Studio Copilot`** (`Screen 7`).
  2. In the chat prompt input, type a test query:
     - Query: `Analyze timecode drift between Cam A and Cam B in Scene 102 and check Keanu Reeves SAG quota.`
     - Press Enter or click Send.
  3. Or click any quick prompt pill:
     - `Explain SAG Section 43 quota rules for Keanu Reeves`
     - `Check Middle East GCAM rating flags for Dojo Fight`
* **Expected Result:**
  - Gemini copilot returns an analytical breakdown.
  - Automatically synthesizes and displays the corresponding ClickHouse SQL query executed against the production graph.

### Test Case 8.2: SMPTE Voice Scratchpad (Audio Memo Dictation)
* **Steps:**
  1. In the Voice Scratchpad panel, click **`🎙️ Start Audio Memo Dictation`**.
  2. Speak or allow the simulator to count recording seconds.
  3. Notice the live SMPTE timecode auto-latches to the current playback position.
  4. Select Department: `VFX` (or `Camera`, `DIT`, `Legal`).
  5. Type memo text: `Check focus on Agent Smith sunglasses reflection at 01:24:14:12.`
  6. Click **`Save Voice Memo`**.
* **Expected Result:**
  - Memo appears in the persistent Voice Memos list with timestamp, timecode, department badge, and ShotGrid ticket reference.

### Test Case 8.3: Look Library A/B Split Comparator & 3D LUT Export
* **Steps:**
  1. In the Look Library panel, test comparison modes:
     - `WIPE`: Drag the split slider handle left and right to compare raw LogC4 plate against the Matrix Green Show LUT.
     - `DIFFERENCE`: View pixel difference map.
     - `FALSE_COLOR`: Inspect exposure false color.
  2. Adjust the ASC-CDL sliders:
     - **Slope** (e.g. `1.15`), **Offset** (e.g. `-0.02`), **Power** (e.g. `0.95`).
  3. Click **`[📥 Export 33-point .CUBE 3D LUT]`**:
     - Verify browser downloads the `.cube` LUT file for on-set monitor loading.
  4. Click **`[🚀 Dispatch LUT to DIT Cart / ARRI Look Library]`**:
     - Verify toast confirms dispatch to wireless camera transmitters.

---

## Phase 9: Screen 8 — Studio War Room & Multi-Party Collaboration

### Test Case 9.1: Live Video Huddle Simulation
* **Steps:**
  1. In the left sidebar, click **`🎙️ Studio War Room`** (`Screen 8`).
  2. Verify the 5-way video grid displays:
     - `Director (Lana Wachowski)`
     - `VFX Supervisor (John Gaeta)`
     - `DIT / Color Engineer`
     - `Production Attorney (SAG Legal)`
     - `Camera Operator (A-Cam)`
  3. Test Huddle Controls:
     - Click **`Mute / Unmute Mic`** button.
     - Click **`Camera On / Off`** button.
     - Click **`Share Screen`** button.

### Test Case 9.2: Departmental Chat Channels & SMPTE Asset Latch
* **Steps:**
  1. Click between channels in the left list:
     - `#on-set-camera-comms`
     - `#vfx-generative-pipeline`
     - `#legal-sag-approvals`
     - `#executive-dailies`
  2. In the chat composer:
     - Type: `Take 3 of the subway sequence has perfect wire removal. Circle this take for editorial conform.`
     - Verify the **Latch Timecode** toggle is active (`01:24:12:04`).
     - Click **Send**.
* **Expected Result:**
  - Message publishes instantly to the channel with sender avatar, timestamp, timecode badge, and linked asset card.

### Test Case 9.3: Gemini Live Meeting Transcription & Action Item Extraction
* **Steps:**
  1. Review the **Live Speech-to-Text Rolling Transcript** in the center panel.
  2. Review the **Gemini AI Action Items** column on the right:
     - Action items automatically extracted from dialogue with assigned owner and priority tag.
  3. Click **`[🚀 Push Action Items to ShotGrid / Jira]`**.
     - Verify toast confirms synchronization of tasks to external project management.

### Test Case 9.4: NexGuard Invisible Forensic Watermarking Inspector
* **Steps:**
  1. In the War Room header, locate the **NexGuard Forensic Watermarking** status badge (`TPN+ Level 3 Certified`).
  2. Click **`Inspect Forensic Payload`**.
  3. Review the forensic payload:
     - Recipient: `David Fincher / Lana Wachowski`
     - Terminal IP & Timestamp: `2026-09-07T01:25:00Z`
     - Cryptographic Watermark Hash: `TPN53:C2PA:9f84a20b71e84`
  4. Click **`Run Leak Simulation`**:
     - Simulates an unauthorized camera screen capture and extracts the embedded watermark payload with 100% bit-exact forensic attribution.

### Test Case 9.5: Call Sheet & Union Labor Logistics Mode
* **Steps:**
  1. In the top right of Screen 8, toggle mode from `Comms` to **`Call Sheet & Logistics`**.
  2. Review Call Sheet:
     - Crew Call: `06:00 AM`, Shooting Call: `07:30 AM`, First Meal: `01:00 PM`.
     - Location: `Stage 4 - Courtyard Matrix Set`.
  3. Review Union Labor Rules (IATSE Local 600 / DGA):
     - Meal penalty countdown timer.
     - Forced turnaround tracker (12-hour rest period between wrap and next call).
     - Overtime multiplier calculator.

---

## Phase 10: Screen 9 — Cloud Storage & Security Vault

*This screen verifies your enterprise-grade 25.0 Petabyte storage, Camera-to-Cloud ingress, and FIPS 140-3 HSM Cloud KMS BYOK.*

### Test Case 10.1: Multi-Petabyte Tier Architecture Dashboard
* **Steps:**
  1. In the left sidebar, click **`📦 Storage Vault`** (`Screen 9`).
  2. Ensure the **`Storage Tiers`** tab is selected.
  3. Review the 3 storage tiers:
     - **Tier 0: Hot NVMe Burst Cache** (2.5 PB, 800 Gbps RoCE v2, sub-0.1ms latency, 68% utilized).
     - **Tier 1: Warm Object Storage** (Google Cloud Storage Dual-Region, 7.5 PB, 99.999999999% durability).
     - **Tier 2: Cold WORM Archive** (Glacier Deep Archive / LTO-9 Tape, 15.0 PB, 100-Year Immutable Retention).
  4. Inspect the Capacity Allocation bar and auto-tiering policy rules.

### Test Case 10.2: Camera-to-Cloud (C2C) Real-Time Ingress Monitor
* **Steps:**
  1. Click the **`C2C Ingress`** tab.
  2. Inspect the 3 active Camera Ingest Pipes:
     - **Cam A (ARRI ALEXA 35):** `1.2 GB/s` ARRIRAW Ingress &bull; Buffer: `14%` &bull; Dropped: `0.000%`
     - **Cam B (RED V-RAPTOR XL):** `1.4 GB/s` REDCODE 8K Ingress &bull; Buffer: `18%` &bull; Dropped: `0.000%`
     - **Cam C (Sony VENICE 2):** `1.2 GB/s` X-OCN 6K Ingress &bull; Buffer: `12%` &bull; Dropped: `0.000%`
  3. Review the **Automated ACES 1.3 & Editorial Proxy Transcode Matrix**:
     - Verifies automatic conversion of camera RAW to ProRes 422 Proxy and H.265 streaming dailies.

### Test Case 10.3: TPN Gold Shield & Cloud KMS BYOK Center
* **Steps:**
  1. Click the **`Security & KMS`** tab.
  2. Review the Security Posture:
     - Trusted Partner Network (TPN) Gold Shield v5.2 compliance status (`100% PASS`).
     - Cloud KMS BYOK Key ID: `projects/cine-synapse-prod/locations/us-central1/keyRings/studio-vault/cryptoKeys/master-hsm-key`.
     - HSM Protection Level: `FIPS 140-3 Level 3 Verified`.
  3. Test Security Actions:
     - Click **`[🔄 Rotate KMS Key Now]`**:
       - Observe key rotation animation.
       - A toast confirms: `✓ KMS Master Key Rotated to v4: Zero-downtime re-encryption applied.`
       - Key version and Last Rotated timestamp update immediately.
     - Click **`[🛡️ Run SHA-256 Parity & Integrity Audit]`**:
       - Observe audit progress bar.
       - A toast confirms: `✓ Cryptographic Parity Audit Passed: 14,892 C2PA hashes verified bit-exact!`

### Test Case 10.4: Cryptographic Encrypted Asset Explorer
* **Steps:**
  1. Click the **`Asset Explorer`** tab.
  2. In the search box, type `MATRIX` or `SC104` or `ari` or `RAW`.
  3. Review the filtered asset table:
     - File name, Scene/Take, Format, Codec, Resolution (4096x2160 DCI 4K), Tier, and SHA-256 hash.
  4. On any asset row, click **`Inspect C2PA`**:
     - Opens the C2PA Manifest Inspector Modal displaying cryptographic signatures, lens calibration certificate, and camera serial number.

---

## Appendix: 4 Matrix Fight Clips Mapping & Test Case Matrix

| Clip Name | Narrative Sequence | Recommended Camera Feed | Test Scenarios Exercised |
| :--- | :--- | :--- | :--- |
| **Clip 1** | **Dojo Sparring** (Neo vs. Morpheus) | **Camera A** (ARRI ALEXA 35) | Master Transport, False Color, Zebra Stripes, ASC-CDL Green Matrix Tint, Focus Peaking on martial arts impacts. |
| **Clip 2** | **Subway Station Fight** (Neo vs. Agent Smith) | **Camera B** (RED V-RAPTOR XL) | Anamorphic 2.39:1 Frame Guides, Genlock Ingest Matrix, Timecode Drift remediation (+1.5 frames). |
| **Clip 3** | **Rooftop Bullet-Time** (Neo Acrobatics) | **Camera C** (Sony VENICE 2) | High-Speed 120 fps capture, Video Scopes (Waveform & Vectorscope), In/Out Marker sub-clipping. |
| **Clip 4** | **Burly Brawl** (100-Agent Smith Clones) | **Camera D** (Aux / VFX Plate) | SAG Likeness Ledger deduction (12.5s for Hugo Weaving), Synthetic Double A/B Split Wipe, C2PA Manifest audit. |

---
*CINE-SYNAPSE Studio OS &bull; Built for Modern Cloud-First Film & Television Production &bull; Confidential*
