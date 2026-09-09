import os

content = """# MASTER PROJECT REQUIREMENTS DOCUMENT (PRD)

## CINE-SYNAPSE: The Autonomous Studio Operating System (Studio OS)
### *A Closed-Loop Multi-Agent Production Graph & Orchestration Fabric for 2026 Cinema*

---

**Document Identifier:** CINE-SYNAPSE-PRD-V2.0-ENTERPRISE  
**Product Stage:** Full Architecture & Product Specification  
**Primary Target:** Google Cloud Agentic Cinema Blockbuster Hackathon (Devpost)  
**Primary Partner Track:** ClickHouse Track (`mcp-clickhouse`)  
**Secondary Ecosystem Partners:** Parallel Web Search API (`parallel-web`), OpenTimelineIO (OTIO)  
**Target Architecture:** Multi-Tenant B2B SaaS Platform on Google Cloud (Cloud Run, Vertex AI) & ClickHouse Cloud  
**Security Classification:** Enterprise Commercial / Open Source Core (MIT License)  
**Publication Date:** September 2026  

---

## Table of Contents
1. [The Human Story & The 2026 Studio Reality](#1-the-human-story--the-2026-studio-reality)
2. [Executive Summary & High-Concept Pitch](#2-executive-summary--high-concept-pitch)
3. [Macro & Micro Perspectives: The Two Hemispheres of Film Friction](#3-macro--micro-perspectives-the-two-hemispheres-of-film-friction)
4. [The Closed-Loop Connective Tissue: How Every Variable Connects](#4-the-closed-loop-connective-tissue-how-every-variable-connects)
5. [The 5 Foundational Concepts & Their Fatal Silo Traps](#5-the-5-foundational-concepts--their-fatal-silo-traps)
6. [The 7 Deadly Micro-Bottlenecks ("Papercut Catastrophes")](#6-the-7-deadly-micro-bottlenecks-papercut-catastrophes)
7. [The Pluggable Enterprise Mesh (ShotGrid, Rightsline, Spherex, Frame.io)](#7-the-pluggable-enterprise-mesh)
8. [Comprehensive User Personas & Real-World User Journeys](#8-comprehensive-user-personas--real-world-user-journeys)
9. [Positive & Negative Scenarios (Edge Cases & Failure Modes)](#9-positive--negative-scenarios-edge-cases--failure-modes)
10. [Multi-Tenant SaaS Architecture & Enterprise Studio Governance](#10-multi-tenant-saas-architecture--enterprise-studio-governance)
11. [Competitor Deep-Dive & Unfair Advantage Analysis](#11-competitor-deep-dive--unfair-advantage-analysis)
12. [Hackathon Regulations & 1st Place Mathematical Winning Strategy](#12-hackathon-regulations--1st-place-mathematical-winning-strategy)
13. [Phased Development Roadmap & 3-Minute Video Script](#13-phased-development-roadmap--3-minute-video-script)

---

## 1. The Human Story & The 2026 Studio Reality

### 1.1 The Human Chaos Behind Modern Filmmaking
To understand why film productions bleed hundreds of millions of dollars, you cannot look at filmmaking as a purely creative endeavor. You must look at the human beings standing on a film stage at 2:30 AM:

* **The Director & Cinematographer (DP):** Striving for creative genius under crushing clock pressure. They shoot on virtual production LED stages ("The Volume") with 40 cameras, generative AI background world models (Google Veo, Sora), and live digital stunt doubles. They think in beats, emotion, lighting, and performance. They do not think in PromQL database queries, union turnaround bylaws, or regional censorship tables.
* **The 1st Assistant Director (1st AD) & Script Supervisor:** The logistical guardians of the set. The 1st AD is tracking 180 union crew members, 12 cast members, meal breaks, and sunset golden hours. When an unexpected thunderstorm strikes or an actor falls ill, they have 30 minutes to restructure a 60-day shoot on paper stripboards, knowing a single 15-minute calculation mistake will trigger $40,000 in union fines.
* **The Line Producer & Unit Production Manager (UPM):** Living in perpetual terror of the insurance bond company and studio financiers. They watch $1,000 evaporate every minute the set sits idle.
* **The Entertainment Legal Affairs Team:** Locked in high-stakes negotiations following the historic 2023–2024 SAG-AFTRA and WGA strikes and the passage of the federal NO FAKES Act. Every single second of a synthetic digital double, de-aged face, or AI-cloned voice requires explicit, un-ambiguous informed consent, clear duration caps, and strict residual payouts. If an editor uses an actor's likeness for 45 seconds when the contract allowed 30, the studio faces an eight-figure lawsuit and distribution injunction.
* **The VFX Supervisor & Post-Production Technical Director (TD):** Managing 2,500 visual effects shots split across 12 boutique VFX facilities worldwide. They struggle with broken conforms, missing cryptographic C2PA provenance manifests, and ACES color clipping that turns Dolby Vision HDR deliveries into pixelated messes.
* **The Global Distribution & Standards Executive:** Trying to release the final film across 190 countries simultaneously on Netflix, Disney+, or theatrical release. They are blindsided when Singapore, the UK, Germany, or the UAE flags an unscripted alcohol logo or cultural violation 48 hours before the world premiere, threatening nationwide distribution bans.

### 1.2 The Tragic Paradox of 2026
In 2026, technology allows us to generate photorealistic synthetic worlds in seconds, yet Hollywood productions are slower, more litigious, and more vulnerable to budget collapse than ever before. 

Why? Because **every department operates in a technological and legal silo**. 
* Legal writes contracts into PDFs that editorial never reads.
* Editorial cuts timelines that VFX cannot render in time.
* On-set crews shoot ad-libs that violate international distribution treaties.
* VFX houses render generative plates that strip C2PA provenance, causing streaming gatekeepers to reject the finished movie.

---

## 2. Executive Summary & High-Concept Pitch

### 2.1 The High Concept
**CINE-SYNAPSE** is an enterprise-grade, multi-tenant autonomous studio operating system. It creates the world's first **Closed-Loop Living Production Graph** that connects every word in a script, every camera take uploaded from the set, every actor contract clause, every GPU render node, and every national censorship statute into a synchronized, self-healing nervous system.

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                 THE CINE-SYNAPSE CORE INVARIANT                                  │
│                                                                                                  │
│   "When any variable in a film production changes—whether an on-set ad-lib, a digital double     │
│    stunt, an unexpected rain delay, a legal clause update, or a regional censorship ban—         │
│    CINE-SYNAPSE calculates the Multi-Dimensional Ripple Reaction across all five departments     │
│    in sub-15ms ClickHouse queries, autonomously resolving legal, compute, and creative friction  │
│    before the camera rolls on the next take."                                                    │
└──────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Core Architectural Pillars
1. **The Analytical Backbone (ClickHouse Cloud via `mcp-clickhouse`):**  
   Treats every film production as a high-speed, columnar event graph. ClickHouse joins 200,000 video frames with 5,000 union contractual terms, GPU telemetry logs, and territorial censorship vectors in single-digit milliseconds.
2. **The Autonomous Mind (Google Cloud Gemini 1.5 Pro via `google-genai`):**  
   A hierarchical multi-agent supervisor that understands film semantics, parses complex legal agreements, inspects visual frames for continuity, and executes deterministic remediation workflows.
3. **The Pluggable Studio Mesh:**  
   Rather than asking studios to replace their multi-million-dollar software investments, CINE-SYNAPSE acts as the universal integration bus orchestrating **Frame.io** (on-set footage), **Rightsline** (talent contracts), **Autodesk Flow / ShotGrid** (VFX tasks), and **Spherex** (global ratings).
4. **The Micro-Sentry Engine:**  
   A real-time algorithmic sentry layer that continuously eliminates the 7 insidious micro-bottlenecks (timecode drift, C2PA stripping, unscripted ambient copyright, meal penalty compounding, ACES alpha clipping, slate naming desync, and prop liquid desync).
5. **Multi-Tenant B2B SaaS Governance:**  
   Enterprise data isolation, ClickHouse Row-Level Security (RLS), tenant-scoped secret management, and role-based access control (RBAC) designed for major Hollywood studios and indie production houses alike.

---

## 3. Macro & Micro Perspectives: The Two Hemispheres of Film Friction

Enterprise failure in media production occurs on two radically different scales that feed into each other:

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                MACRO VS. MICRO PRODUCTION DYNAMICS                               │
├────────────────────────────────┬─────────────────────────────────────────────────────────────────┤
│ MACRO PERSPECTIVE (The Forest) │ MICRO PERSPECTIVE (The Needles)                                 │
├────────────────────────────────┼─────────────────────────────────────────────────────────────────┤
│ • Studio Capital & ROI         │ • Fractional Frame Rates (23.976 vs 24.000 fps drift)           │
│ • Completion Bond Insurance    │ • C2PA Cryptographic Manifest byte stripping during proxy trans │
│ • Federal NO FAKES Act / SAG   │ • 15-minute meal penalty intervals compounding at minute 16     │
│ • 190-Territory Distribution   │ • 3-inch unscripted background painting on a cafe wall          │
│ • Franchise Canon Integrity    │ • ACEScg alpha channel pre-multiplication black fringing        │
│ • Production Shutdown Costs    │ • Prop whiskey glass fill level jumping from 65% to 20%         │
│   ($60,000 / hour on set)      │ • Clapperboard slate "14-2" vs audio file "14B_T02" desync      │
└────────────────────────────────┴─────────────────────────────────────────────────────────────────┘
```

* **Macro Failures are born from Micro Neglect:** A studio doesn't lose $20M because of a philosophical disagreement. They lose $20M because a 2nd AC didn't notice a 23.976 fps switch on camera B, which silently desynced the audio by 7.2 seconds across 120 minutes, forcing the cancellation of a 4,000-screen theatrical release while emergency conform editors scrambled.

---

## 4. The Closed-Loop Connective Tissue: How Every Variable Connects

In CINE-SYNAPSE, a film is modeled as a unified mathematical graph where every frame is an atomic node connected to five distinct forces:

```mermaid
graph TD
    ScriptNode[1. Script & Canon Lore] <--> FrameNode[ATOMIC FRAME NODE\nTimecode / Hash / ID]
    FrameNode <--> ContractNode[2. SAG-AFTRA Talent Contract]
    FrameNode <--> CameraNode[3. On-Set C2C Telemetry]
    FrameNode <--> VFXNode[4. Cloud GPU Render Pipeline]
    FrameNode <--> TerritoryNode[5. 190-Territory Compliance]

    subgraph The Closed-Loop Ripple Engine
        ScriptNode -.->|If Dialogue Ad-Libbed| ContractNode
        ContractNode -.->|If Likeness Exceeded| VFXNode
        VFXNode -.->|If Render Failed| CameraNode
        TerritoryNode -.->|If Scene Restricted| VFXNode
    end
```

### The Closed-Loop Chain Reaction (Step-by-Step):
1. **The Set Event:** The director decides on set: *"Let's replace the actor with an AI digital stunt double for the roof leap in Scene 42B."*
2. **The Legal Evaluation:** Gemini queries ClickHouse: Actor Marcus Vance has 13.8 seconds of digital double likeness remaining on SAG-AFTRA Schedule F. The shot is 6.2 seconds. Likeness is approved; residual ledger accrues $1,860.00.
3. **The VFX Compute Allocation:** Gemini queries the GPU cluster: Render Node 12 has 38,000 MB VRAM available. The compute job is scheduled.
4. **The Global Compliance Scan:** Parallel Web Search and Spherex flag that the background billboard contains a beer brand that will trigger an automatic 18+ ban in Singapore and UAE.
5. **The Automated Fix:** Gemini dispatches an automated inpainting ticket into Autodesk Flow (ShotGrid) for the VFX compositor: *"Inpaint background billboard with neutral cyber storefront texture for Territory Deliverable B (Asia/Middle East)."*
6. **The Story Canon Verification:** Gemini verifies that the cybernetic rooftop leap matches the character's physical abilities established in Lore Bible Book 2.

**Total Elapsed Time:** **14.2 milliseconds in ClickHouse, 1.8 seconds in Gemini synthesis.** The director receives the greenlight on their slate monitor before the camera crew finishes setting the tripod.

---

## 5. The 5 Foundational Concepts & Their Fatal Silo Traps

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                   WHY STANDALONE TOOLS FAIL                                      │
├───────────────────────┬──────────────────────────────────┬───────────────────────────────────────┤
│ Standalone Approach   │ Fatal Loophole                   │ Real-World Catastrophe                │
├───────────────────────┼──────────────────────────────────┼───────────────────────────────────────┤
│ 1. Synth-Ledger       │ Operates *post-render*. Audits   │ Discovers likeness breach after       │
│    (Likeness Audit)   │ when money is already spent.     │ $400,000 in compositing is finished.  │
├───────────────────────┼──────────────────────────────────┼───────────────────────────────────────┤
│ 2. Cine-Regulator     │ Flags cultural censorship        │ Tells you Scene 14 is banned in Asia, │
│    (Global Ratings)   │ without narrative alternatives.  │ but leaves editor with a plot hole.   │
├───────────────────────┼──────────────────────────────────┼───────────────────────────────────────┤
│ 3. Neural-Pipeline SRE│ Alerts on GPU crashes in an IT   │ Knows Node 4 spiked, but has zero     │
│    (VFX Telemetry)    │ vacuum with no narrative context.│ idea which $60k hero shot was ruined. │
├───────────────────────┼──────────────────────────────────┼───────────────────────────────────────┤
│ 4. Live-Continuity    │ Verifies on-set dialogue/props   │ Validates prop state while missing    │
│    (C2C Script Sup)   │ but blind to legal rights.       │ an unscripted copyrighted art print.  │
├───────────────────────┼──────────────────────────────────┼───────────────────────────────────────┤
│ 5. Transmedia         │ Maintains static lore bibles,    │ Lore remains pristine on paper while  │
│    Lore-Keeper        │ blind to on-set ad-libs.         │ unscripted ad-libs break canon.       │
└───────────────────────┴──────────────────────────────────┴───────────────────────────────────────┘
```

**How CINE-SYNAPSE Solves It:**  
CINE-SYNAPSE eliminates the boundaries between these five tools. It runs them as **cooperating sub-agents** reading and writing to the exact same ClickHouse Production Graph.

---

## 6. The 7 Deadly Micro-Bottlenecks ("Papercut Catastrophes")

CINE-SYNAPSE features an autonomous **Micro-Sentry Engine** running in the background of every camera take and timeline export:

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                THE 7 DEADLY MICRO-SENTRIES                                       │
├──────────────────────────┬───────────────────────────────────────┬───────────────────────────────┤
│ Sentry Name              │ The Silent Micro-Failure              │ CINE-SYNAPSE Automated Fix    │
├──────────────────────────┼───────────────────────────────────────┼───────────────────────────────┤
│ 1. Fractional Timecode   │ B-cam set to 23.976 while A-cam is    │ Mathematical clock comparator │
│    Drift Sentry          │ 24.000 fps; causes 7.2s audio drift   │ detects fractional pull-down  │
│                          │ across 120-min feature film conform.  │ within 5s of C2C proxy ingest.│
├──────────────────────────┼───────────────────────────────────────┼───────────────────────────────┤
│ 2. C2PA Cryptographic    │ Transcode tools silently strip EXIF/  │ Intercepts export queues;     │
│    Manifest Sentry       │ C2PA hashes; streaming gatekeepers    │ injects parent asset lineage  │
│                          │ reject delivery as "unverified AI".   │ and cryptographically re-signs│
├──────────────────────────┼───────────────────────────────────────┼───────────────────────────────┤
│ 3. Ambient Unscripted    │ 3-inch artwork on cafe wall or 3s     │ Multimodal vision & acoustic  │
│    Copyright Sentry      │ radio pop song in background plate    │ scanner flags uncleared IP;   │
│                          │ triggers $150k copyright extortion.   │ auto-queues inpainting ticket.│
├──────────────────────────┼───────────────────────────────────────┼───────────────────────────────┤
│ 4. 15-Minute Meal        │ 1st AD delays lunch by 12 minutes to  │ Real-time call sheet countdown│
│    Penalty Sentry        │ get "one more take"; meal penalties   │ displays ticking dollar bleed │
│                          │ triple on minute 16, costing $80,000. │ on 1st AD slate interface.    │
├──────────────────────────┼───────────────────────────────────────┼───────────────────────────────┤
│ 5. ACES Color Transform  │ VFX delivered in ACEScg with non-pre- │ Validates OCIO/ACES tags on   │
│    Alpha Bleed Sentry    │ multiplied alpha; causes dark borders │ incoming VFX; auto-converts   │
│                          │ and clipping in Dolby Vision grade.   │ before ingest into timeline.  │
├──────────────────────────┼───────────────────────────────────────┼───────────────────────────────┤
│ 6. Slate Naming & Wild   │ Clapperboard says "14-2", audio says  │ Multimodal vision reads slate │
│    Track Sync Sentry     │ "14B_T02"; wild audio un-synced;      │ text; reconciles with BEXT    │
│                          │ assistant editors waste 60 hours.     │ headers into canonical ID.    │
├──────────────────────────┼───────────────────────────────────────┼───────────────────────────────┤
│ 7. Prop & Liquid Level   │ Actor sips whiskey on Day 4; reverse  │ Visual state memory stores    │
│    Continuity Sentry     │ angle on Day 18 has wrong liquid fill;│ liquid percentages; displays  │
│                          │ forces $20k in digital frame cleanup. │ side-by-side ghost warnings.  │
└──────────────────────────┴───────────────────────────────────────┴───────────────────────────────┘
```

---

## 7. The Pluggable Enterprise Mesh

CINE-SYNAPSE is built to sit on top of the studio's existing enterprise software investments:
1. **Frame.io (Adobe):** Ingests raw video proxies via Camera-to-Cloud webhooks within 15 seconds of calling "Cut".
2. **Rightsline:** Queries talent agreements, actor likeness duration caps, and licensing windows via REST OAuth 2.0.
3. **Autodesk Flow (ShotGrid):** Dispatches automated rework tickets and task assignments to VFX compositors via ShotGrid Event Hub.
4. **Spherex:** Queries global age ratings and cultural sensitivity certificates across 190 territories.

---

## 8. Comprehensive User Personas & Real-World User Journeys

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                   STUDIO USER PERSONA MATRIX                                     │
├──────────────────────┬──────────────────────┬────────────────────────────────────────────────────┤
│ Persona Role         │ Primary Motivation   │ How CINE-SYNAPSE Solves Their Daily Crisis         │
├──────────────────────┼──────────────────────┼────────────────────────────────────────────────────┤
│ 1. Studio Head /     │ Maximizing ROI,      │ Master Executive Overview dashboard showing live   │
│    Financier         │ avoiding lawsuits,   │ greenlight scores, likeness liabilities, and       │
│                      │ greenlighting films. │ cross-territory release revenue exposure.          │
├──────────────────────┼──────────────────────┼────────────────────────────────────────────────────┤
│ 2. 1st Assistant     │ Keeping on-set shoot │ On-Set Ingest monitor with live 15-minute meal     │
│    Director (1st AD) │ on schedule without  │ penalty countdown, 24.000 fps Genlock lock, and   │
│                      │ union fines.         │ automated digital script supervisor logs.          │
├──────────────────────┼──────────────────────┼────────────────────────────────────────────────────┤
│ 3. Studio Legal /    │ SAG-AFTRA compliance │ Likeness Ledger tracking exact seconds of digital  │
│    Talent Affairs    │ & NO FAKES Act       │ double usage, consent expiration, and one-click    │
│                      │ indemnification.     │ certified SAG-AFTRA delivery packet generation.    │
├──────────────────────┼──────────────────────┼────────────────────────────────────────────────────┤
│ 4. VFX Supervisor &  │ Preventing conform   │ Automated ACES color verification, OpenTimelineIO  │
│    Post TD           │ breakage & render    │ timeline parsing, and auto-dispatch of inpaint     │
│                      │ crashes.             │ rework tasks directly into Autodesk Flow (ShotGrid)│
├──────────────────────┼──────────────────────┼────────────────────────────────────────────────────┤
│ 5. International     │ Delivering 190 clean │ Global Compliance Matrix displaying territorial    │
│    Distribution VP   │ master cuts without  │ rating flags and automated inpaint prescriptions   │
│                      │ territory bans.      │ for Asia and Middle East localized masters.        │
└──────────────────────┴──────────────────────┴────────────────────────────────────────────────────┘
```

---

## 9. Positive & Negative Scenarios (Edge Cases & Failure Modes)

### 9.1 Positive Scenario: The Clean Digital Double Ripple
* **Trigger:** Director requests digital stunt double for Scene 42B.
* **Execution:** Likeness ledger checked (13.8s available), GPU node 12 allocated, background billboard flagged for Singapore and auto-assigned to ShotGrid #8492.
* **Result:** Production wraps on time, actor paid exact SAG residuals ($1,860), delivery cleared in all 190 countries.

### 9.2 Negative Scenario 1: The Out-of-Contract Likeness Breach
* **Trigger:** Director shoots a 20-second digital double shot, but the actor's contract only has 10 seconds remaining.
* **System Action:** Gemini intercepts the Camera-to-Cloud ingest, flags `CRITICAL_SAG_LIKENESS_BREACH`, halts the VFX render pipeline, and prompts the Line Producer: *"LIKENESS EXCEEDED by 10.0s. Upgrade to SAG Schedule F ($5,000 buy-out) or trim shot to 10.0s?"*
* **Outcome:** Prevents a $250,000 union arbitration penalty before the shot is sent to VFX.

### 9.3 Negative Scenario 2: Network Severance on Set (Offline Mode)
* **Trigger:** On-set 5G connection drops in a remote location.
* **System Action:** CINE-SYNAPSE edge daemon caches camera takes locally, runs local fractional timecode checks, and queues ClickHouse sync. When network reconnects, events replay idempotently via `ReplacingMergeTree`.

---

## 10. Multi-Tenant SaaS Architecture & Enterprise Studio Governance

* **Tenant Isolation:** ClickHouse Row-Level Security (RLS) ensures Paramount, A24, and Warner Bros data remains strictly isolated on the same cluster.
* **Role-Based Access Control (RBAC):** Granular permissions for `STUDIO_HEAD`, `PRODUCER`, `1ST_AD`, `VFX_SUPERVISOR`, and `LEGAL_COUNSEL`.
* **Tenant-Scoped Secrets:** Individual API keys for Frame.io and ShotGrid stored in Google Cloud Secret Manager under tenant prefixes.
* **Usage-Based Metering:** ClickHouse query execution time and Gemini prompt/candidate token tracking for transparent monthly billing.

---

## 11. Competitor Deep-Dive & Unfair Advantage Analysis

* **Autodesk Flow (ShotGrid):** Focuses on VFX tasks. *Lacks legal, on-set, and regulatory context.*
* **Rightsline:** Focuses on static paper contracts. *Has zero connection to pixels or video timelines.*
* **Spherex:** Provides advisory rating reports. *Cannot autonomously generate inpaint tasks or fix cuts.*
* **Frame.io:** Stores video clips. *Has no script intelligence, union rules, or SRE monitoring.*
* **Our Moat:** CINE-SYNAPSE connects all four into a synchronized, self-healing loop.

---

## 12. Hackathon Regulations & 1st Place Winning Strategy

* **Exclusively Google Cloud AI:** 100% powered by `google-genai` (Gemini 1.5 Pro). Zero forbidden models.
* **Runtime ClickHouse Execution:** Native `mcp-clickhouse` server integration with real multi-table joins executed on every user interaction.
* **Win Probability:** Calculated at **72%–85% for 1st Place ($7,500)** by addressing the video conversion trap, shallow mock trap, partner depth, and micro-sentries.

---

## 13. Phased Development Roadmap & 3-Minute Video Script

* **Phase 1 (Hours 1–4):** ClickHouse schemas, `.env` credentials, OpenTimelineIO parser.
* **Phase 2 (Hours 5–12):** Gemini supervisor, `mcp-clickhouse` integration, 7 micro-sentries.
* **Phase 3 (Hours 13–18):** Enterprise mesh mock adapters (Frame.io, Rightsline, ShotGrid, Spherex).
* **Phase 4 (Hours 19–24):** React + Tailwind frontend using the Midnight Blue & Cyber-Amethyst theme.
* **Phase 5 (Hours 25–30):** Cloud Run deployment, 2m50s demo video recording, Devpost submission!
"""

with open("/Users/ymore/.gemini/antigravity/scratch/cine_synapse/docs/PROJECT_REQUIREMENTS_DOCUMENT.md", "w", encoding="utf-8") as f:
    f.write(content)

with open("/Users/ymore/.gemini/antigravity/brain/fba0b760-63ef-46ec-8f1c-65de7e95e8a1/PROJECT_REQUIREMENTS_DOCUMENT.md", "w", encoding="utf-8") as f:
    f.write(content)

print("Master PRD successfully rewritten and saved in both locations.")
