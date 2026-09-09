import os
import re
from build_pdf import CanvasPDF

def render_markdown_to_pdf(md_path, pdf_path, doc_title, doc_subtitle, doc_type, footer_info):
    pdf = CanvasPDF(
        filename=pdf_path,
        doc_title=doc_title,
        doc_subtitle=doc_subtitle,
        doc_type=doc_type,
        track="ClickHouse Track | Google Cloud Hackathon 2026",
        footer_info=footer_info
    )
    pdf.draw_cover()

    with open(md_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    in_code = False
    code_lines = []
    in_table = False
    table_headers = []
    table_rows = []

    for raw_line in lines:
        line = raw_line.rstrip()
        
        # Check code block
        if line.startswith("```"):
            if in_code:
                in_code = False
                pdf.add_code_block(code_lines)
                code_lines = []
            else:
                in_code = True
            continue

        if in_code:
            code_lines.append(line)
            continue

        # Check table
        if line.startswith("|") and line.endswith("|"):
            parts = [p.strip() for p in line.split("|")[1:-1]]
            # separator line like |---|---|
            if all(re.match(r'^:?-+:?$', p) for p in parts):
                continue
            if not in_table:
                in_table = True
                table_headers = parts
                table_rows = []
            else:
                table_rows.append(parts)
            continue
        else:
            if in_table:
                in_table = False
                pdf.add_table(table_headers, table_rows)
                table_headers = []
                table_rows = []

        # Empty line
        if not line.strip():
            continue

        # Headings
        if line.startswith("# "):
            continue
        elif line.startswith("## "):
            pdf.add_h1(line[3:].strip())
        elif line.startswith("### "):
            pdf.add_h2(line[4:].strip())
        elif line.startswith("#### "):
            pdf.add_h3(line[5:].strip())
        elif line.startswith("* ") or line.startswith("- "):
            pdf.add_bullet(line[2:].strip())
        elif re.match(r'^\d+\.\s', line):
            pdf.add_bullet(line.strip())
        elif line.startswith("> "):
            callout_text = line[2:].strip()
            if callout_text.startswith("[!NOTE]") or callout_text.startswith("[!IMPORTANT]") or callout_text.startswith("[!TIP]"):
                tag = callout_text.split("]")[0].replace("[!", "")
                msg = callout_text.split("]", 1)[1].strip()
                pdf.add_callout_box(f"SYSTEM NOTICE — {tag}", msg)
            else:
                pdf.add_callout_box("OPERATIONAL DIRECTIVE", callout_text)
        elif line.startswith("---"):
            continue
        else:
            pdf.add_paragraph(line.strip())

    if in_table:
        pdf.add_table(table_headers, table_rows)

    pdf.compile()
    print(f"Successfully compiled: {pdf_path} ({pdf.page_num} pages)")

artifact_dir = "/Users/ymore/.gemini/antigravity/brain/fba0b760-63ef-46ec-8f1c-65de7e95e8a1"

# 1. Compile Playbook
pb_md = "/Users/ymore/.gemini/antigravity/scratch/cine_synapse/docs/CINE_SYNAPSE_PRODUCTION_PLAYBOOK.md"
pb_out = "/Users/ymore/.gemini/antigravity/scratch/cine_synapse/docs/CINE_SYNAPSE_PRODUCTION_PLAYBOOK.pdf"
pb_art = os.path.join(artifact_dir, "CINE_SYNAPSE_PRODUCTION_PLAYBOOK.pdf")

render_markdown_to_pdf(
    md_path=pb_md,
    pdf_path=pb_out,
    doc_title="CINE-SYNAPSE: Production Onboarding & 8-Role Playbook",
    doc_subtitle="Enterprise Setup, 8 Filmmaking Personas & Production Testing Resources",
    doc_type="PRODUCTION ONBOARDING & ROLES PLAYBOOK",
    footer_info="CINE-SYNAPSE Studio OS — Production Playbook v2.0 Enterprise"
)
os.system(f"cp '{pb_out}' '{pb_art}'")

# 2. Compile PRD
prd_md = "/Users/ymore/.gemini/antigravity/scratch/cine_synapse/docs/PROJECT_REQUIREMENTS_DOCUMENT.md"
prd_out = "/Users/ymore/.gemini/antigravity/scratch/cine_synapse/docs/CINE_SYNAPSE_PRD.pdf"
prd_art = os.path.join(artifact_dir, "CINE_SYNAPSE_PRD.pdf")

render_markdown_to_pdf(
    md_path=prd_md,
    pdf_path=prd_out,
    doc_title="CINE-SYNAPSE: Project Requirements Document (PRD)",
    doc_subtitle="The Autonomous Studio Operating System (Studio OS)",
    doc_type="PROJECT REQUIREMENTS DOCUMENT (PRD)",
    footer_info="CINE-SYNAPSE OS — Requirements Baseline v2.0 Enterprise"
)
os.system(f"cp '{prd_out}' '{prd_art}'")

# 3. Compile TAD
tad_md = "/Users/ymore/.gemini/antigravity/scratch/cine_synapse/docs/TECHNICAL_ARCHITECTURE_DOCUMENT.md"
tad_out = "/Users/ymore/.gemini/antigravity/scratch/cine_synapse/docs/CINE_SYNAPSE_TAD.pdf"
tad_art = os.path.join(artifact_dir, "CINE_SYNAPSE_TAD.pdf")

render_markdown_to_pdf(
    md_path=tad_md,
    pdf_path=tad_out,
    doc_title="CINE-SYNAPSE: Technical Architecture Document (TAD)",
    doc_subtitle="Enterprise Multi-Agent Production Graph & Orchestration Fabric",
    doc_type="TECHNICAL ARCHITECTURE DOCUMENT (TAD)",
    footer_info="CINE-SYNAPSE OS — Architecture Baseline v2.0 Enterprise"
)
os.system(f"cp '{tad_out}' '{tad_art}'")

# Copy markdown files to artifact directory as well
os.system(f"cp '{pb_md}' '{os.path.join(artifact_dir, 'CINE_SYNAPSE_PRODUCTION_PLAYBOOK.md')}'")
os.system(f"cp '{prd_md}' '{os.path.join(artifact_dir, 'PROJECT_REQUIREMENTS_DOCUMENT.md')}'")
os.system(f"cp '{tad_md}' '{os.path.join(artifact_dir, 'TECHNICAL_ARCHITECTURE_DOCUMENT.md')}'")

print("All 3 Master PDFs and Markdown specifications successfully compiled and synchronized to artifact directory!")
