import sys
import os
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.pdfgen import canvas

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count):
        self.saveState()
        self.setFont("Helvetica-Bold", 8)
        self.setFillColor(colors.HexColor("#64748B"))

        # Running Header (pages > 1)
        if self._pageNumber > 1:
            self.drawString(54, letter[1] - 36, "CINE-SYNAPSE STUDIO OS  |  END-TO-END MANUAL TESTING GUIDE")
            self.drawRightString(letter[0] - 54, letter[1] - 36, "STANDARDS: OMC ISO-1004 / TPN GOLD v5.2")
            self.setStrokeColor(colors.HexColor("#CBD5E1"))
            self.setLineWidth(0.5)
            self.line(54, letter[1] - 42, letter[0] - 54, letter[1] - 42)

        # Running Footer (all pages)
        self.setStrokeColor(colors.HexColor("#CBD5E1"))
        self.setLineWidth(0.5)
        self.line(54, 46, letter[0] - 54, 46)

        self.setFont("Helvetica", 7.5)
        self.drawString(54, 34, "CONFIDENTIAL & PROPRIETARY — GOOGLE DEEPMIND ADVANCED AGENTIC CODING")
        page_str = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(letter[0] - 54, 34, page_str)
        self.restoreState()


def build_pdf(filename):
    doc = SimpleDocTemplate(
        filename,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54
    )

    styles = getSampleStyleSheet()

    # Custom typography hierarchy
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=22,
        leading=26,
        textColor=colors.HexColor('#0F172A'),
        spaceAfter=4
    )
    subtitle_style = ParagraphStyle(
        'DocSubTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=colors.HexColor('#059669'), # Emerald
        spaceAfter=12
    )
    h1_style = ParagraphStyle(
        'SectionH1',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=17,
        textColor=colors.HexColor('#0F172A'),
        spaceBefore=14,
        spaceAfter=6,
        keepWithNext=True
    )
    h2_style = ParagraphStyle(
        'SectionH2',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10.5,
        leading=14,
        textColor=colors.HexColor('#1E293B'),
        spaceBefore=10,
        spaceAfter=4,
        keepWithNext=True
    )
    body_style = ParagraphStyle(
        'BodyDark',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=12,
        textColor=colors.HexColor('#1E293B'),
        spaceAfter=4
    )
    bullet_style = ParagraphStyle(
        'BulletDark',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=12,
        leftIndent=14,
        firstLineIndent=-10,
        textColor=colors.HexColor('#334155'),
        spaceAfter=3
    )
    callout_style = ParagraphStyle(
        'CalloutText',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=11.5,
        textColor=colors.HexColor('#0F172A')
    )
    code_style = ParagraphStyle(
        'CodeStyle',
        parent=styles['Normal'],
        fontName='Courier',
        fontSize=7.5,
        leading=9.5,
        textColor=colors.HexColor('#0F172A')
    )

    story = []

    # Title Banner Block
    story.append(Paragraph("CINE-SYNAPSE / Studio OS", title_style))
    story.append(Paragraph("End-to-End Manual Testing & Quality Assurance Guide", subtitle_style))
    story.append(Paragraph(
        "<b>System Release:</b> 2.4.0-Production &nbsp;|&nbsp; <b>Active Benchmarking:</b> The Matrix (4 Fight Clips)<br/>"
        "<b>Industry Standards:</b> OMC ISO-1004, TPN Gold Shield v5.2, C2PA v2.1, SAG-AFTRA 2026 Theatrical Agreement",
        body_style
    ))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#10B981'), spaceAfter=10, spaceBefore=4))

    # Metadata & Environment Card
    env_data = [
        [
            Paragraph("<b>Target Host:</b> http://localhost:5173", callout_style),
            Paragraph("<b>API Engine:</b> FastAPI (Port 8000)", callout_style),
            Paragraph("<b>Database:</b> ClickHouse OLAP", callout_style)
        ],
        [
            Paragraph("<b>Active Studio:</b> Silver Pictures / Village Roadshow", callout_style),
            Paragraph("<b>Active Project:</b> The Matrix (MATRIX-2026)", callout_style),
            Paragraph("<b>Storage Capacity:</b> 25.0 PB Multi-Tier", callout_style)
        ]
    ]
    env_table = Table(env_data, colWidths=[170, 170, 164])
    env_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#F1F5F9')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#CBD5E1')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(env_table)
    story.append(Spacer(1, 10))

    # Executive Summary
    story.append(Paragraph("Executive Overview & Test Scope", h1_style))
    story.append(Paragraph(
        "This verification manual provides a rigorous, button-by-button test procedure for CINE-SYNAPSE Studio OS. "
        "Every single interactive button, modal window, drawer, slider, and workflow developed across all 9 screens, "
        "the global header, and the real-time status bar is systematically tested from a clean scratch slate using "
        "<b>4 fight clips from The Matrix</b>.",
        body_style
    ))
    story.append(Spacer(1, 4))

    # Phase 0
    story.append(Paragraph("Phase 0: Clean Slate Tenant & Project Initialization", h1_style))
    story.append(Paragraph("<b>Test Case 0.1: Register New Studio Organization (Tenant)</b>", h2_style))
    story.append(Paragraph("&bull; <b>Action:</b> Locate the Studio Tenant Selector in the top header. Click <i>➕ Register New Studio...</i>.", bullet_style))
    story.append(Paragraph("&bull; <b>Input Values:</b> Studio Name = <code>Silver Pictures / Village Roadshow</code>, Slug = <code>silver_pictures</code>, Short Code = <code>SILV</code>, Icon = <code>🏛️</code>.", bullet_style))
    story.append(Paragraph("&bull; <b>Verification:</b> Click <i>Cancel</i> to verify clean dismissal, re-open, click <i>Register Studio</i>, verify green confirmation toast and header dropdown update.", bullet_style))

    story.append(Paragraph("<b>Test Case 0.2: Create Isolated Movie Project from Scratch</b>", h2_style))
    story.append(Paragraph("&bull; <b>Action:</b> In the top header, click the <b><code>➕ New Project</code></b> button.", bullet_style))
    story.append(Paragraph("&bull; <b>Input Values:</b> Title = <code>The Matrix: Resurrections & Revolutions</code>, Code = <code>MATRIX-2026</code>, Director = <code>Lana & Lilly Wachowski</code>, FPS = <code>24.000 fps</code>, Aspect Ratio = <code>2.39:1 Scope</code>.", bullet_style))
    story.append(Paragraph("&bull; <b>Template Mode:</b> Select <b><code>✨ Clean Blank Slate</code></b> (0 scenes, 0 takes, 0 likeness riders).", bullet_style))
    story.append(Paragraph("&bull; <b>Verification:</b> Click <i>Create Movie Project</i>. Verify project dropdown selects the new Matrix project and all views initialize in an isolated namespace.", bullet_style))
    story.append(Spacer(1, 6))

    # Phase 1
    story.append(Paragraph("Phase 1: Global Header, Status Bar & System Overlays", h1_style))
    story.append(Paragraph("<b>Test Case 1.1: Header Controls, Quick Launchers & Scenario Bar</b>", h2_style))
    story.append(Paragraph("&bull; <b>Studio & Project Switchers:</b> Switch between tenants. Verify active project list cascades immediately without cross-tenant bleed.", bullet_style))
    story.append(Paragraph("&bull; <b><code>📦 Storage Vault</code> Button:</b> Click to verify direct transition to Screen 9 Storage Vault.", bullet_style))
    story.append(Paragraph("&bull; <b><code>⚡ Logs</code> Button:</b> Click to open the bottom SRE Telemetry & Audit Logger drawer.", bullet_style))
    story.append(Paragraph("&bull; <b><code>🧪 Scenarios</code> Menu:</b> Test all 4 hackathon triggers: <i>1. Trigger 23.976 Drift</i>, <i>2. Breach Meal Penalty</i>, <i>3. Synthesize Past SAG Cap</i>, <i>4. Dispatch ShotGrid Inpaint</i>. Verify immediate state mutation toasts.", bullet_style))
    story.append(Paragraph("&bull; <b>User Profile Avatar:</b> Inspect active user persona, assigned role, and tenant session ID.", bullet_style))

    story.append(Paragraph("<b>Test Case 1.2: Persistent Bottom Status Bar (StatusBar.tsx)</b>", h2_style))
    story.append(Paragraph("&bull; <b>SLA & Telemetry:</b> Verify <code>ClickHouse: 11.4ms</code>, <code>Gemini 1.5 Pro | 1.2M ctx</code>, <code>C2PA: Root-of-Trust Valid</code>, <code>OMC ISO-1004 / TPN Gold</code>.", bullet_style))
    story.append(Paragraph("&bull; <b>High-Speed Throughput:</b> Verify live network meter (<code>800G RoCE: 3.8 GB/s</code>) and active camera slate indicator.", bullet_style))
    story.append(Paragraph("&bull; <b>Dock Buttons:</b> Click <code>[📦 Vault]</code> and <code>[⚡ SRE Logs]</code> shortcuts in the status bar to verify responsive launch.", bullet_style))

    story.append(PageBreak())

    # Phase 2
    story.append(Paragraph("Phase 2: Screen 1 — Autonomous Production Graph", h1_style))
    story.append(Paragraph("<b>Test Case 2.1: Graph Navigation & Node Dependency Inspection</b>", h2_style))
    story.append(Paragraph("&bull; <b>KPI Filters:</b> Click <code>All Nodes</code>, <code>Production Pipeline</code>, <code>Sentry & Security</code>, <code>Distribution & Legal</code>.", bullet_style))
    story.append(Paragraph("&bull; <b>Node Clicking:</b> Click on <code>On-Set Camera Sentry</code>, <code>SAG Likeness Ledger</code>, and <code>Storage Vault</code>. Verify glowing selection border and side-panel inspection details.", bullet_style))
    story.append(Paragraph("<b>Test Case 2.2: 5-Dimensional Autonomous Consensus Check</b>", h2_style))
    story.append(Paragraph("&bull; <b>Action:</b> Click <b><code>[▶ Run 5-D Consensus Check]</code></b>.", bullet_style))
    story.append(Paragraph("&bull; <b>Simulation Progression:</b> Verify step-by-step telemetry: ClickHouse Graph query -> SAG Schedule A cap check -> Spherex 190-territory scan -> H100 GPU allocation.", bullet_style))
    story.append(Paragraph("&bull; <b>Verdict Card:</b> Verify <code>APPROVED_WITH_AUTOMATED_REMEDIATION</code>, ShotGrid ticket generation (<code>SG-TASK-8492</code>), and 0.1% audio pull-up remediation.", bullet_style))
    story.append(Spacer(1, 6))

    # Phase 3
    story.append(Paragraph("Phase 3: Screen 2 — On-Set Camera Sentry (Matrix Clips Testing)", h1_style))
    story.append(Paragraph(
        "<i>This is the primary production screen where the user tests their 4 Matrix fight clips in multi-camera sync.</i>",
        body_style
    ))
    story.append(Paragraph("<b>Test Case 3.1: Mount 4 Matrix Fight Clips to Camera Feeds</b>", h2_style))
    story.append(Paragraph("&bull; <b>Camera A (ARRI ALEXA 35):</b> Drag & drop <b>Clip 1 (Dojo Sparring: Neo vs Morpheus)</b> onto Camera A card.", bullet_style))
    story.append(Paragraph("&bull; <b>Camera B (RED V-RAPTOR XL):</b> Drag & drop <b>Clip 2 (Subway Fight vs Agent Smith)</b> onto Camera B card.", bullet_style))
    story.append(Paragraph("&bull; <b>Camera C (Sony VENICE 2):</b> Drag & drop <b>Clip 3 (Rooftop Bullet-Time Acrobatics)</b> onto Camera C card.", bullet_style))
    story.append(Paragraph("&bull; <b>Camera D (Aux Witness):</b> Drag & drop <b>Clip 4 (Burly Brawl: 100-Agent Smith Clones)</b> onto Camera D card.", bullet_style))
    story.append(Paragraph("&bull; <b>Verification:</b> Verify video players load, source switches to <code>file</code>, and resolution/framerate display on HUD.", bullet_style))

    story.append(Paragraph("<b>Test Case 3.2: Master Transport & Playback Engine</b>", h2_style))
    story.append(Paragraph("&bull; <b>Buttons:</b> Click <code>▶ PLAY</code> (Spacebar), <code>⏸ PAUSE</code> (Spacebar), <code>Step +1 Frame</code> (L), <code>Step -1 Frame</code> (J).", bullet_style))
    story.append(Paragraph("&bull; <b>Timecode Sync:</b> Drag SMPTE scrubbing bar; verify synchronized scrubbing across all 4 clips.", bullet_style))
    story.append(Paragraph("&bull; <b>Sub-Clipping:</b> Press <code>[</code> to Mark IN, press <code>]</code> to Mark OUT on the combat impact moment.", bullet_style))

    story.append(Paragraph("<b>Test Case 3.3: DIT Assist Toolbelt (False Color, Peaking, Scopes, CDL)</b>", h2_style))
    story.append(Paragraph("&bull; <b>False Color:</b> Toggle on; verify ARRI LogC4 thermal luminance overlay over Matrix martial arts footage.", bullet_style))
    story.append(Paragraph("&bull; <b>Focus Peaking:</b> Toggle on; verify green edge highlight illuminates punch and kick contact points.", bullet_style))
    story.append(Paragraph("&bull; <b>Zebra Stripes:</b> Toggle on; verify 95% IRE highlight zebra hatching appears over bright studio lights.", bullet_style))
    story.append(Paragraph("&bull; <b>Frame Guides & De-Squeeze:</b> Test <code>2.39:1 Scope</code>, <code>1.85:1 Flat</code>, <code>1.43:1 IMAX</code>, and <code>2.0x Anamorphic</code> unsqueeze.", bullet_style))
    story.append(Paragraph("&bull; <b>Real-Time Scopes (W):</b> Inspect Waveform monitor, Vectorscope (Neo skin tone alignment), and RGB Parade.", bullet_style))
    story.append(Paragraph("&bull; <b>ASC-CDL Grading:</b> Adjust Slope, Offset, Power, and Saturation to dial in the iconic Matrix green tint.", bullet_style))

    story.append(Paragraph("<b>Test Case 3.4: Live Slate Setup & Take Verdicts</b>", h2_style))
    story.append(Paragraph("&bull; <b>Action:</b> Click <code>[+ New Slate / Setup]</code>. Enter Scene: <code>102</code>, Setup: <code>B</code>, Take: <code>1</code>, Lens: <code>Cooke 40mm T2.0</code>. Click <i>Apply Slate</i>.", bullet_style))
    story.append(Paragraph("&bull; <b><code>🟢 CIRCLE TAKE</code>:</b> Click to mark preferred editorial take; verify conform log written to ClickHouse.", bullet_style))
    story.append(Paragraph("&bull; <b><code>🟡 HOLD TAKE</code>:</b> Click to mark backup take.", bullet_style))
    story.append(Paragraph("&bull; <b><code>🔴 NG (NO GOOD)</code>:</b> Click to reject take with failure reason code (e.g. Focus buzz or Drop frame).", bullet_style))

    story.append(Paragraph("<b>Test Case 3.5: Ingest Matrix & Sentry Drift Remediation</b>", h2_style))
    story.append(Paragraph("&bull; <b>Ingest Matrix Tab:</b> Review cross-camera genlock lock status, PTP Grandmaster Clock, and 10GbE bitrates.", bullet_style))
    story.append(Paragraph("&bull; <b>Auto-Remediate:</b> On Camera B drift alert (+1.5 frames), click <code>[⚡ Auto-Remediate]</code>. Verify timecode pull-up filter resolves breach.", bullet_style))

    story.append(PageBreak())

    # Phase 4
    story.append(Paragraph("Phase 4: Screen 3 — SAG-AFTRA Digital Replica Likeness Ledger", h1_style))
    story.append(Paragraph("<b>Test Case 4.1: Register Talent Riders (Keanu Reeves & Hugo Weaving)</b>", h2_style))
    story.append(Paragraph("&bull; <b>Action:</b> In Screen 3, click <b><code>➕ Add Performer Rider</code></b>.", bullet_style))
    story.append(Paragraph("&bull; <b>Keanu Reeves:</b> Role = <code>Neo / Thomas Anderson</code>, Contract = <code>SAG-2026-KR-NEO-001</code>, Schedule = <code>SCHEDULE_F</code>, Authorized = <code>180.0s</code>, Residual = <code>$500/s</code>.", bullet_style))
    story.append(Paragraph("&bull; <b>Hugo Weaving:</b> Role = <code>Agent Smith</code>, Contract = <code>SAG-2026-HW-SMITH-002</code>, Schedule = <code>SCHEDULE_A</code>, Authorized = <code>60.0s</code>, Residual = <code>$350/s</code>.", bullet_style))
    story.append(Paragraph("&bull; <b>Verification:</b> Verify performer cards render with accurate quota bars, contract IDs, and initial 0.0s burn rate.", bullet_style))

    story.append(Paragraph("<b>Test Case 4.2: Top-Up Quota (+15s Extension)</b>", h2_style))
    story.append(Paragraph("&bull; <b>Action:</b> On Keanu Reeves' card, click the <b><code>+15s</code></b> button.", bullet_style))
    story.append(Paragraph("&bull; <b>Verification:</b> Toast confirms NO FAKES Act amendment signed; authorized cap increments to 195.0s.", bullet_style))

    story.append(Paragraph("<b>Test Case 4.3: Synthetic Double Inspector (Gaussian Splatting & A/B Wipe)</b>", h2_style))
    story.append(Paragraph("&bull; <b>Action:</b> On Keanu Reeves' card, click <b><code>🧬 Double</code></b>.", bullet_style))
    story.append(Paragraph("&bull; <b>Inspection Modes:</b> Test <code>🔀 A/B Split Wipe</code> (drag slider 0-100%), <code>📐 Photogrammetry Mesh</code>, <code>✨ Neural Composite</code>, and <code>🔬 Landmark Delta</code>.", bullet_style))
    story.append(Paragraph("&bull; <b>HUD Metrics:</b> Verify Scan Fidelity <code>99.6%</code>, Landmark Deviation <code>0.038 mm</code>, and ACEScg color gamut match.", bullet_style))

    story.append(Paragraph("<b>Test Case 4.4: C2PA Cryptographic Provenance Manifest Viewer</b>", h2_style))
    story.append(Paragraph("&bull; <b>Action:</b> Click the <code>🔒 c2pa:sha256:...</code> link on any performer card.", bullet_style))
    story.append(Paragraph("&bull; <b>Verification:</b> Verify DigiCert Studio CA root-of-trust, ARRI hardware enclave seal, and click <code>📋 Copy SHA-256 Hash</code>.", bullet_style))

    story.append(Paragraph("<b>Test Case 4.5: Performer Audit Drawer & Live Shot Deduction Simulator</b>", h2_style))
    story.append(Paragraph("&bull; <b>Action:</b> On Hugo Weaving's card, click <b><code>Audit</code></b>.", bullet_style))
    story.append(Paragraph("&bull; <b>Permitted vs Prohibited Matrix:</b> Test clauses: <i>Dangerous wirework</i> (Permitted) vs <i>Dialogue synth</i> (Prohibited Section 4(B)).", bullet_style))
    story.append(Paragraph("&bull; <b>Deduction Simulator:</b> Enter Scene: <code>Scene 104</code>, Take: <code>3</code>, Seconds: <code>12.5s</code>, Desc: <code>Courtyard multi-Smith clone</code>. Click <i>Record Live Shot Deduction</i>.", bullet_style))
    story.append(Paragraph("&bull; <b>Verification:</b> Verify Hugo Weaving's used seconds increment by 12.5s and accrued residuals update immediately.", bullet_style))

    story.append(Paragraph("<b>Test Case 4.6: Export SAG Section 43 Compliance Packet</b>", h2_style))
    story.append(Paragraph("&bull; <b>Action:</b> Inside Audit Drawer, click <b><code>Export Section 43 Audit Packet</code></b>.", bullet_style))
    story.append(Paragraph("&bull; <b>Buttons:</b> Test <code>📋 Copy JSON Payload</code>, <code>💾 Download Formal JSON Packet</code>, and <code>🖨️ Print Formal Delivery Packet</code>.", bullet_style))
    story.append(Spacer(1, 6))

    # Phase 5
    story.append(Paragraph("Phase 5: Screen 4 — 190-Territory Distribution Compliance & Inpaint Hub", h1_style))
    story.append(Paragraph("<b>Test Case 5.1: Territory Inspection & Infraction Rules</b>", h2_style))
    story.append(Paragraph("&bull; <b>Territory Grid:</b> Click <b>Saudi Arabia (GCAM)</b>, <b>China (NRTA)</b>, <b>Singapore (IMDA)</b>, and <b>United States (MPAA)</b>.", bullet_style))
    story.append(Paragraph("&bull; <b>Infraction Cards:</b> Inspect cultural rules regarding alcohol, violent blood splatter, and supernatural content.", bullet_style))
    story.append(Paragraph("<b>Test Case 5.2: Generative Inpaint A/B Comparison & ShotGrid Dispatch</b>", h2_style))
    story.append(Paragraph("&bull; <b>Action:</b> Click <b><code>Toggle Inpaint Preview</code></b>. Observe side-by-side comparison of original plate vs AI-inpainted clean plate.", bullet_style))
    story.append(Paragraph("&bull; <b>ShotGrid Dispatch:</b> Click <b><code>[🚀 Dispatch to ShotGrid / Autodesk Flow]</code></b>. Verify ticket SG-TASK-8492 generated and territory status transitions to CLEARED.", bullet_style))

    story.append(PageBreak())

    # Phase 6
    story.append(Paragraph("Phase 6: Screen 5 — SaaS Tenant Portal & IAM Security", h1_style))
    story.append(Paragraph("<b>Test Case 6.1: Personas & Role-Based Access Control (RBAC)</b>", h2_style))
    story.append(Paragraph("&bull; <b>Persona Switching:</b> Switch between <i>Director</i>, <i>Production Attorney (Legal)</i>, <i>DIT / Color Engineer</i>, <i>VFX Supervisor</i>, and <i>Cloud SRE</i>.", bullet_style))
    story.append(Paragraph("<b>Test Case 6.2: Single Sign-On (SSO) Handshake Simulation</b>", h2_style))
    story.append(Paragraph("&bull; <b>Providers:</b> Click <code>Okta Enterprise SSO</code>, <code>Ping Identity</code>, and <code>Google Workspace SAML 2.0</code>. Verify JWT token issuance.", bullet_style))
    story.append(Paragraph("<b>Test Case 6.3: RLS Policy Explorer & Security Audit</b>", h2_style))
    story.append(Paragraph("&bull; <b>RLS Table:</b> Inspect ClickHouse and PostgreSQL row-level security permissions per role.", bullet_style))
    story.append(Paragraph("&bull; <b>Session Audit:</b> Test <code>Revoke Token / Sign Out</code> (status = REVOKED), re-authenticate, and click <code>Proceed to Studio OS Dashboard</code>.", bullet_style))
    story.append(Spacer(1, 6))

    # Phase 7
    story.append(Paragraph("Phase 7: Screen 6 — Timeline Ingest & Conform Hub", h1_style))
    story.append(Paragraph("<b>Test Case 7.1: Timeline File Drag & Drop Ingestion</b>", h2_style))
    story.append(Paragraph("&bull; <b>Dropzone:</b> Drag & drop an OpenTimelineIO (<code>.otio</code>) or EDL file, or click <b><code>[📁 Load Sample Matrix OTIO Timeline]</code></b>.", bullet_style))
    story.append(Paragraph("<b>Test Case 7.2: Multi-Track Visualizer & Clip Inspector</b>", h2_style))
    story.append(Paragraph("&bull; <b>Timeline Tracks:</b> Review V1 (Master RAW Plates), V2 (Neural Inpaint Pass), and A1-A3 (Production Audio).", bullet_style))
    story.append(Paragraph("&bull; <b>Clip Inspector:</b> Click clip segments; inspect lens metadata, timecode IN/OUT, C2PA seal, and click <code>Conform & Dispatch to VFX Pipeline</code>.", bullet_style))
    story.append(Spacer(1, 6))

    # Phase 8
    story.append(Paragraph("Phase 8: Screen 7 — Studio Copilot & Professional Side-Tools", h1_style))
    story.append(Paragraph("<b>Test Case 8.1: Gemini 1.5 Pro Studio Copilot</b>", h2_style))
    story.append(Paragraph("&bull; <b>AI Prompting:</b> Enter: <i>'Analyze timecode drift between Cam A and Cam B in Scene 102 and check Keanu Reeves SAG quota.'</i>", bullet_style))
    story.append(Paragraph("&bull; <b>ClickHouse SQL:</b> Verify copilot returns synthesis accompanied by executable SQL query on the production graph.", bullet_style))
    story.append(Paragraph("<b>Test Case 8.2: SMPTE Voice Scratchpad (Audio Memo Dictation)</b>", h2_style))
    story.append(Paragraph("&bull; <b>Dictation:</b> Click <code>🎙️ Start Audio Memo Dictation</code>, latch live SMPTE timecode, enter note, assign department (VFX), click <code>Save Voice Memo</code>.", bullet_style))
    story.append(Paragraph("<b>Test Case 8.3: Look Library A/B Split Comparator & 3D LUT Export</b>", h2_style))
    story.append(Paragraph("&bull; <b>Split Slider:</b> Test <code>WIPE</code>, <code>DIFFERENCE</code>, and <code>FALSE_COLOR</code> modes comparing LogC4 plate against Matrix Green LUT.", bullet_style))
    story.append(Paragraph("&bull; <b>LUT Export:</b> Click <b><code>[📥 Export 33-point .CUBE 3D LUT]</code></b> to download LUT, then click <b><code>[🚀 Dispatch LUT to DIT Cart]</code></b>.", bullet_style))
    story.append(Spacer(1, 6))

    # Phase 9
    story.append(Paragraph("Phase 9: Screen 8 — Studio War Room & Multi-Party Collaboration", h1_style))
    story.append(Paragraph("<b>Test Case 9.1: Live Video Huddle Simulation</b>", h2_style))
    story.append(Paragraph("&bull; <b>Video Grid:</b> Verify 5-way video grid (Director, VFX Sup, DIT, Legal, Camera Op) with active speaker indicators.", bullet_style))
    story.append(Paragraph("&bull; <b>Controls:</b> Click <code>Mute Mic</code>, <code>Camera Toggle</code>, and <code>Share Screen</code> buttons.", bullet_style))
    story.append(Paragraph("<b>Test Case 9.2: Channel Messaging & SMPTE Timecode Latch</b>", h2_style))
    story.append(Paragraph("&bull; <b>Channels:</b> Switch between <code>#on-set-camera-comms</code>, <code>#vfx-generative-pipeline</code>, <code>#legal-sag-approvals</code>.", bullet_style))
    story.append(Paragraph("&bull; <b>Message:</b> Type take note with SMPTE timecode latch toggle enabled, click Send, verify instant delivery.", bullet_style))
    story.append(Paragraph("<b>Test Case 9.3: Gemini Live Transcription & Action Items</b>", h2_style))
    story.append(Paragraph("&bull; <b>Review:</b> Review live speech-to-text rolling feed and AI-extracted action items. Click <b><code>[🚀 Push Action Items to ShotGrid / Jira]</code></b>.", bullet_style))
    story.append(Paragraph("<b>Test Case 9.4: NexGuard Invisible Forensic Watermarking</b>", h2_style))
    story.append(Paragraph("&bull; <b>Inspect & Leak Test:</b> Click <code>Inspect Forensic Payload</code>, review TPN+ Level 3 hash, click <code>Run Leak Simulation</code> to verify bit-exact leak trace.", bullet_style))
    story.append(Paragraph("<b>Test Case 9.5: Call Sheet & Union Labor Logistics Mode</b>", h2_style))
    story.append(Paragraph("&bull; <b>Toggle:</b> Switch mode to <code>Call Sheet & Logistics</code>. Review crew calls, meal penalty countdown, and 12-hour turnaround tracker.", bullet_style))

    story.append(PageBreak())

    # Phase 10
    story.append(Paragraph("Phase 10: Screen 9 — Cloud Storage & Security Vault", h1_style))
    story.append(Paragraph("<b>Test Case 10.1: Multi-Petabyte Tier Architecture Dashboard</b>", h2_style))
    story.append(Paragraph("&bull; <b>Storage Tiers Tab:</b> Inspect Tier 0 (Hot NVMe 2.5 PB @ 800 Gbps RoCE v2), Tier 1 (Warm GCS 7.5 PB), Tier 2 (Cold WORM Tape 15.0 PB).", bullet_style))
    story.append(Paragraph("&bull; <b>Capacity Gauges:</b> Verify total 25.0 PB capacity display and auto-tiering rules.", bullet_style))

    story.append(Paragraph("<b>Test Case 10.2: Camera-to-Cloud (C2C) Real-Time Ingress Monitor</b>", h2_style))
    story.append(Paragraph("&bull; <b>C2C Ingress Tab:</b> Inspect Cam A (1.2 GB/s), Cam B (1.4 GB/s), Cam C (1.2 GB/s) streaming pipes.", bullet_style))
    story.append(Paragraph("&bull; <b>Proxy Transcode Matrix:</b> Verify automated background transcode to Apple ProRes 422 Proxy and H.265 streaming dailies.", bullet_style))

    story.append(Paragraph("<b>Test Case 10.3: TPN Gold Shield & Cloud KMS BYOK Center</b>", h2_style))
    story.append(Paragraph("&bull; <b>Security & KMS Tab:</b> Review TPN Gold Shield v5.2 compliance posture and FIPS 140-3 HSM BYOK master key ID.", bullet_style))
    story.append(Paragraph("&bull; <b><code>[🔄 Rotate KMS Key Now]</code>:</b> Click button; verify zero-downtime key rotation toast (rotates to v4) and timestamp update.", bullet_style))
    story.append(Paragraph("&bull; <b><code>[🛡️ Run SHA-256 Parity & Integrity Audit]</code>:</b> Click button; verify progress bar and audit confirmation (14,892 C2PA hashes verified).", bullet_style))

    story.append(Paragraph("<b>Test Case 10.4: Cryptographic Encrypted Asset Explorer</b>", h2_style))
    story.append(Paragraph("&bull; <b>Asset Explorer Tab:</b> Search <code>MATRIX</code> or <code>ari</code> or <code>RAW</code>; verify dynamic asset table filtering.", bullet_style))
    story.append(Paragraph("&bull; <b>Inspect C2PA:</b> Click button on any asset row; verify C2PA cryptographic manifest modal opens with signed hardware certificates.", bullet_style))
    story.append(Spacer(1, 10))

    # Appendix Table
    story.append(Paragraph("Appendix: Matrix Fight Clips Mapping & Test Case Matrix", h1_style))
    matrix_table_data = [
        [
            Paragraph("<b>Clip Name</b>", callout_style),
            Paragraph("<b>Narrative Sequence</b>", callout_style),
            Paragraph("<b>Recommended Camera</b>", callout_style),
            Paragraph("<b>Primary Test Scenarios Exercised</b>", callout_style)
        ],
        [
            Paragraph("<b>Clip 1</b>", callout_style),
            Paragraph("Dojo Sparring<br/>(Neo vs Morpheus)", callout_style),
            Paragraph("<b>Camera A</b><br/>(ARRI ALEXA 35)", callout_style),
            Paragraph("Master Transport (J/K/L), False Color exposure, Zebra highlights, ASC-CDL Green Matrix Tint, Focus Peaking on martial arts impacts.", callout_style)
        ],
        [
            Paragraph("<b>Clip 2</b>", callout_style),
            Paragraph("Subway Station Fight<br/>(Neo vs Agent Smith)", callout_style),
            Paragraph("<b>Camera B</b><br/>(RED V-RAPTOR XL)", callout_style),
            Paragraph("Anamorphic 2.39:1 Scope Framing, Genlock Ingest Matrix, Timecode Drift (+1.5 frames) auto-remediation via audio pull-up.", callout_style)
        ],
        [
            Paragraph("<b>Clip 3</b>", callout_style),
            Paragraph("Rooftop Bullet-Time<br/>(High-Speed Acrobatics)", callout_style),
            Paragraph("<b>Camera C</b><br/>(Sony VENICE 2)", callout_style),
            Paragraph("High-Speed 120 fps capture, Video Scopes (Waveform & Vectorscope skin tone line), In/Out Marker sub-clipping.", callout_style)
        ],
        [
            Paragraph("<b>Clip 4</b>", callout_style),
            Paragraph("Burly Brawl<br/>(100-Agent Smith Clones)", callout_style),
            Paragraph("<b>Camera D</b><br/>(Aux / VFX Plate)", callout_style),
            Paragraph("SAG Likeness Ledger deduction (12.5s for Hugo Weaving), Synthetic Double A/B Split Wipe, C2PA Manifest audit & export.", callout_style)
        ]
    ]
    mat_table = Table(matrix_table_data, colWidths=[55, 115, 105, 229])
    mat_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#1E293B')),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#94A3B8')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.HexColor('#FFFFFF'), colors.HexColor('#F8FAFC')]),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(mat_table)
    story.append(Spacer(1, 14))

    story.append(Paragraph(
        "<i>Testing Protocol Complete. All test cases in this manual comply with the 2026 SAG-AFTRA TV/Theatrical Agreement, "
        "Federal NO FAKES Act, TPN Gold Shield v5.2, and MovieLabs 2030 Vision for Cloud-Native Production.</i>",
        callout_style
    ))

    # Build document
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"Successfully generated {filename}")

if __name__ == "__main__":
    out_pdf = "/Users/ymore/.gemini/antigravity/scratch/cine_synapse/CINE_SYNAPSE_E2E_MANUAL_TESTING_GUIDE.pdf"
    build_pdf(out_pdf)
