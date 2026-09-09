import os
import re

# Import CanvasPDF logic
from build_pdf import CanvasPDF

def generate_prd_pdf(md_path, output_pdf_path):
    pdf = CanvasPDF(output_pdf_path)
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
            # Skip top title as cover already has it
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
            pdf.add_paragraph("[NOTE] " + line[2:].strip())
        elif line.startswith("---"):
            continue
        else:
            pdf.add_paragraph(line.strip())

    if in_table:
        pdf.add_table(table_headers, table_rows)

    pdf.compile()
    print(f"Successfully compiled PDF to: {output_pdf_path}")

md_file = "/Users/ymore/.gemini/antigravity/scratch/cine_synapse/docs/PROJECT_REQUIREMENTS_DOCUMENT.md"
out_pdf = "/Users/ymore/.gemini/antigravity/scratch/cine_synapse/docs/CINE_SYNAPSE_PRD.pdf"
artifact_pdf = "/Users/ymore/.gemini/antigravity/brain/fba0b760-63ef-46ec-8f1c-65de7e95e8a1/CINE_SYNAPSE_PRD.pdf"

generate_prd_pdf(md_file, out_pdf)

# Copy to artifact directory
os.system(f"cp '{out_pdf}' '{artifact_pdf}'")
print(f"Copied PDF to artifact directory: {artifact_pdf}")
