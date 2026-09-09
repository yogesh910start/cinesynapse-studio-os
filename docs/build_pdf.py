import re
import sys
import os

class CanvasPDF:
    def __init__(self, filename, doc_title="CINE-SYNAPSE: Master Requirements Document", 
                 doc_subtitle="The Autonomous Studio Operating System (Studio OS)",
                 doc_type="PROJECT REQUIREMENTS DOCUMENT",
                 track="ClickHouse Track | Google Cloud Hackathon 2026",
                 footer_info="CINE-SYNAPSE Studio OS — Baseline v2.0"):
        self.filename = filename
        self.doc_title = doc_title
        self.doc_subtitle = doc_subtitle
        self.doc_type = doc_type
        self.track = track
        self.footer_info = footer_info
        
        self.pages = []
        self.current_ops = []
        self.page_width = 612
        self.page_height = 792
        self.margin_left = 48
        self.margin_right = 564
        self.content_width = self.margin_right - self.margin_left
        self.y = 730
        self.page_num = 1
        self._start_new_page(first=True)

    def _start_new_page(self, first=False):
        if not first:
            self.pages.append(self.current_ops)
            self.page_num += 1
            self.current_ops = []

        # Running Header (except page 1 if cover)
        if self.page_num > 1:
            # Header line
            self.current_ops.append("0.2 0.25 0.35 RG 0.75 w")
            self.current_ops.append(f"{self.margin_left} 752 m {self.margin_right} 752 l S")
            # Header text
            title = self._escape_text(self.doc_title[:55])
            track = self._escape_text(self.track[:45])
            self.current_ops.append(f"BT /F2 8 Tf 0.3 0.35 0.45 rg {self.margin_left} 757 Td ({title}) Tj ET")
            self.current_ops.append(f"BT /F1 8 Tf 0.4 0.45 0.55 rg 380 757 Td ({track}) Tj ET")

        # Running Footer
        self.current_ops.append("0.75 0.75 0.8 RG 0.5 w")
        self.current_ops.append(f"{self.margin_left} 42 m {self.margin_right} 42 l S")
        p_text = self._escape_text(f"Page {self.page_num}")
        self.current_ops.append(f"BT /F1 8 Tf 0.4 0.4 0.45 rg {self.margin_right - 40} 30 Td ({p_text}) Tj ET")
        f_info = self._escape_text(self.footer_info[:65])
        self.current_ops.append(f"BT /F1 8 Tf 0.4 0.4 0.45 rg {self.margin_left} 30 Td ({f_info}) Tj ET")

        self.y = 725

    def check_space(self, needed):
        if self.y - needed < 55:
            self._start_new_page()

    def _escape_text(self, text):
        return text.replace('\\', '\\\\').replace('(', '\\(').replace(')', '\\)')

    def draw_cover(self):
        # Decorative top bar
        self.current_ops.append("0.08 0.12 0.25 rg 0 760 612 32 re f")
        self.current_ops.append("0.2 0.4 0.8 rg 0 754 612 6 re f")
        
        # Super title
        self.y = 710
        super_text = self._escape_text(f"GOOGLE CLOUD AGENTIC CINEMA HACKATHON 2026 | {self.doc_type}")
        self.current_ops.append(f"BT /F2 10 Tf 0.25 0.4 0.7 rg 48 710 Td ({super_text}) Tj ET")
        
        # Main Title
        self.y = 660
        self.current_ops.append("BT /F2 26 Tf 0.08 0.12 0.25 rg 48 660 Td (CINE-SYNAPSE) Tj ET")
        
        sub1 = self._escape_text(self.doc_subtitle)
        self.current_ops.append(f"BT /F2 15 Tf 0.2 0.3 0.45 rg 48 635 Td ({sub1}) Tj ET")
        
        desc = self._escape_text("Enterprise Multi-Agent Production Graph & Orchestration Fabric for 2026 Cinema")
        self.current_ops.append(f"BT /F1 10.5 Tf 0.35 0.4 0.5 rg 48 615 Td ({desc}) Tj ET")
        
        # Horizontal accent
        self.current_ops.append("0.2 0.4 0.8 RG 2 w 48 598 m 564 598 l S")
        
        # Metadata Block in stylized container
        self.current_ops.append("0.95 0.96 0.98 rg 48 495 516 85 re f")
        self.current_ops.append("0.8 0.83 0.9 RG 1 w 48 495 516 85 re S")
        
        meta = [
            ("Primary Partner Track:", "ClickHouse Track (Runtime mcp-clickhouse Server)"),
            ("Secondary Ecosystem:", "Parallel Web Search API, OpenTimelineIO (OTIO), C2PA / CAI"),
            ("Core AI Engine:", "Google Cloud Gemini 1.5 Pro (via google-genai SDK)"),
            ("Document Version & Date:", "Version 2.0 (Enterprise Multi-Tenant SaaS) | September 2026"),
            ("Compliance & Security:", "SOC 2 Type II, MPAA Content Security, Federal NO FAKES Act of 2026")
        ]
        my = 562
        for label, val in meta:
            l_esc = self._escape_text(label)
            v_esc = self._escape_text(val)
            self.current_ops.append(f"BT /F2 8.5 Tf 0.15 0.2 0.3 rg 60 {my} Td ({l_esc}) Tj ET")
            self.current_ops.append(f"BT /F1 8.5 Tf 0.25 0.3 0.35 rg 205 {my} Td ({v_esc}) Tj ET")
            my -= 14

        self.y = 465

    def add_h1(self, text):
        self.check_space(45)
        self.y -= 10
        # Section banner background
        self.current_ops.append(f"0.92 0.94 0.98 rg {self.margin_left} {self.y-5} {self.content_width} 24 re f")
        self.current_ops.append(f"0.15 0.28 0.55 RG 1.5 w {self.margin_left} {self.y-5} m {self.margin_left} {self.y+19} l S")
        t_esc = self._escape_text(text)
        self.current_ops.append(f"BT /F2 12.5 Tf 0.1 0.18 0.35 rg {self.margin_left + 10} {self.y+2} Td ({t_esc}) Tj ET")
        self.y -= 20

    def add_h2(self, text):
        self.check_space(32)
        self.y -= 8
        t_esc = self._escape_text(text)
        self.current_ops.append(f"BT /F2 10.5 Tf 0.18 0.3 0.5 rg {self.margin_left} {self.y} Td ({t_esc}) Tj ET")
        self.current_ops.append(f"0.75 0.8 0.9 RG 0.5 w {self.margin_left} {self.y-3} m {self.margin_right} {self.y-3} l S")
        self.y -= 15

    def add_h3(self, text):
        self.check_space(24)
        self.y -= 6
        t_esc = self._escape_text(text)
        self.current_ops.append(f"BT /F2 9.5 Tf 0.15 0.2 0.3 rg {self.margin_left} {self.y} Td ({t_esc}) Tj ET")
        self.y -= 13

    def add_paragraph(self, text):
        clean_text = text.replace("**", "").replace("`", "")
        words = clean_text.split()
        lines = []
        cur_line = []
        for w in words:
            test_line = " ".join(cur_line + [w])
            if len(test_line) * 4.9 > self.content_width:
                lines.append(" ".join(cur_line))
                cur_line = [w]
            else:
                cur_line.append(w)
        if cur_line:
            lines.append(" ".join(cur_line))

        for line in lines:
            self.check_space(13)
            l_esc = self._escape_text(line)
            self.current_ops.append(f"BT /F1 8.5 Tf 0.2 0.2 0.22 rg {self.margin_left} {self.y} Td ({l_esc}) Tj ET")
            self.y -= 12
        self.y -= 4

    def add_bullet(self, text):
        clean_text = text.replace("**", "").replace("`", "")
        words = clean_text.split()
        lines = []
        cur_line = []
        avail_w = self.content_width - 16
        for w in words:
            test_line = " ".join(cur_line + [w])
            if len(test_line) * 4.9 > avail_w:
                lines.append(" ".join(cur_line))
                cur_line = [w]
            else:
                cur_line.append(w)
        if cur_line:
            lines.append(" ".join(cur_line))

        for i, line in enumerate(lines):
            self.check_space(13)
            l_esc = self._escape_text(line)
            if i == 0:
                self.current_ops.append(f"0.2 0.4 0.8 rg {self.margin_left+4} {self.y+2} 3 3 re f")
            self.current_ops.append(f"BT /F1 8.5 Tf 0.2 0.2 0.22 rg {self.margin_left + 14} {self.y} Td ({l_esc}) Tj ET")
            self.y -= 12
        self.y -= 2

    def add_callout_box(self, title, text):
        clean_text = text.replace("**", "").replace("`", "")
        words = clean_text.split()
        lines = []
        cur_line = []
        avail_w = self.content_width - 24
        for w in words:
            test_line = " ".join(cur_line + [w])
            if len(test_line) * 4.9 > avail_w:
                lines.append(" ".join(cur_line))
                cur_line = [w]
            else:
                cur_line.append(w)
        if cur_line:
            lines.append(" ".join(cur_line))

        box_h = len(lines) * 12 + 18
        self.check_space(box_h + 10)
        self.y -= 6
        # Background box
        self.current_ops.append(f"0.94 0.95 0.99 rg {self.margin_left} {self.y - box_h + 12} {self.content_width} {box_h} re f")
        self.current_ops.append(f"0.82 0.85 0.94 RG 0.5 w {self.margin_left} {self.y - box_h + 12} {self.content_width} {box_h} re S")
        # Left accent bar
        self.current_ops.append(f"0.35 0.25 0.75 rg {self.margin_left} {self.y - box_h + 12} 3.5 {box_h} re f")
        
        # Title
        t_esc = self._escape_text(title)
        self.current_ops.append(f"BT /F2 8.5 Tf 0.2 0.15 0.5 rg {self.margin_left + 12} {self.y} Td ({t_esc}) Tj ET")
        self.y -= 13

        # Body lines
        for line in lines:
            l_esc = self._escape_text(line)
            self.current_ops.append(f"BT /F1 8.0 Tf 0.2 0.22 0.3 rg {self.margin_left + 12} {self.y} Td ({l_esc}) Tj ET")
            self.y -= 11
        self.y -= 8

    def add_code_block(self, lines):
        block_h = len(lines) * 10 + 12
        self.check_space(min(block_h, 150))
        self.y -= 4
        # Draw soft background for code block
        self.current_ops.append(f"0.96 0.97 0.98 rg {self.margin_left} {self.y - min(block_h, 140) + 8} {self.content_width} {min(block_h, 140)} re f")
        self.current_ops.append(f"0.85 0.88 0.92 RG 0.5 w {self.margin_left} {self.y - min(block_h, 140) + 8} {self.content_width} {min(block_h, 140)} re S")
        for line in lines:
            if self.y < 65:
                self._start_new_page()
            l_esc = self._escape_text(line[:115])
            self.current_ops.append(f"BT /F3 6.8 Tf 0.08 0.2 0.18 rg {self.margin_left + 8} {self.y} Td ({l_esc}) Tj ET")
            self.y -= 9.5
        self.y -= 6

    def add_table(self, headers, rows):
        col_count = len(headers)
        if col_count == 0:
            return
        col_w = self.content_width / col_count
        row_h = 15
        needed = (len(rows) + 1) * row_h + 10
        self.check_space(min(needed, 100))
        max_chars = max(24, int(col_w / 4.7))

        # Header row
        self.current_ops.append(f"0.88 0.92 0.97 rg {self.margin_left} {self.y - 12} {self.content_width} {row_h} re f")
        self.current_ops.append(f"0.7 0.78 0.88 RG 0.5 w {self.margin_left} {self.y - 12} {self.content_width} {row_h} re S")
        for i, h in enumerate(headers):
            clean_h = h.replace("**", "").replace("`", "")
            h_esc = self._escape_text(clean_h[:max_chars])
            x = self.margin_left + (i * col_w) + 4
            self.current_ops.append(f"BT /F2 7.5 Tf 0.1 0.2 0.35 rg {x} {self.y - 8} Td ({h_esc}) Tj ET")
        self.y -= row_h

        # Data rows
        for r_idx, row in enumerate(rows):
            if self.y < 65:
                self._start_new_page()
            bg_color = "0.98 0.98 0.99" if r_idx % 2 == 0 else "1.0 1.0 1.0"
            self.current_ops.append(f"{bg_color} rg {self.margin_left} {self.y - 12} {self.content_width} {row_h} re f")
            self.current_ops.append(f"0.85 0.88 0.92 RG 0.5 w {self.margin_left} {self.y - 12} {self.content_width} {row_h} re S")
            for i, cell in enumerate(row):
                if i >= col_count:
                    break
                clean_cell = str(cell).replace("**", "").replace("`", "")
                c_esc = self._escape_text(clean_cell[:max_chars])
                x = self.margin_left + (i * col_w) + 4
                self.current_ops.append(f"BT /F1 7.2 Tf 0.2 0.2 0.25 rg {x} {self.y - 8} Td ({c_esc}) Tj ET")
            self.y -= row_h
        self.y -= 6

    def compile(self):
        if self.current_ops:
            self.pages.append(self.current_ops)

        objects = []
        def add_obj(content):
            objects.append(content)
            return len(objects)

        add_obj("<< /Type /Catalog /Pages 2 0 R >>")
        add_obj("") # Pages placeholder
        add_obj("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>")
        add_obj("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>")
        add_obj("<< /Type /Font /Subtype /Type1 /BaseFont /Courier /Encoding /WinAnsiEncoding >>")

        page_ids = []
        for ops in self.pages:
            data = "\n".join(ops).encode('latin-1', errors='replace')
            s_len = len(data)
            sid = add_obj(f"<< /Length {s_len} >>\nstream\n".encode('latin-1') + data + b"\nendstream")
            pid = add_obj(f"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 3 0 R /F2 4 0 R /F3 5 0 R >> >> /Contents {sid} 0 R >>")
            page_ids.append(pid)

        kids_str = " ".join(f"{pid} 0 R" for pid in page_ids)
        objects[1] = f"<< /Type /Pages /Kids [{kids_str}] /Count {len(page_ids)} >>"

        with open(self.filename, "wb") as f:
            f.write(b"%PDF-1.4\n")
            offsets = []
            for i, obj in enumerate(objects):
                offsets.append(f.tell())
                if isinstance(obj, bytes):
                    f.write(f"{i+1} 0 obj\n".encode('latin-1'))
                    f.write(obj)
                    f.write(b"\nendobj\n")
                else:
                    f.write(f"{i+1} 0 obj\n{obj}\nendobj\n".encode('latin-1'))

            xref_pos = f.tell()
            f.write(f"xref\n0 {len(objects)+1}\n0000000000 65535 f \n".encode('latin-1'))
            for off in offsets:
                f.write(f"{off:010d} 00000 n \n".encode('latin-1'))
            f.write(f"trailer\n<< /Size {len(objects)+1} /Root 1 0 R >>\nstartxref\n{xref_pos}\n%%EOF\n".encode('latin-1'))

print("Updated CanvasPDF engine with dynamic metadata loaded.")
