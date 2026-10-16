"""Build the homepage CV: python3 scripts/build_cv.py (requires reportlab).

Profile: data/cv.json. Publications: data/publications.bib and
data/publication-config.json. Set CV_FONT_DIR to a directory containing the
four DejaVuSans TTF variants if they are not available in a standard location.
"""

import json
import os
from pathlib import Path
import re
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    HRFlowable, KeepTogether, Paragraph, SimpleDocTemplate, Table,
    TableStyle,
)

ROOT = Path(__file__).resolve().parents[1]
CV = json.loads((ROOT / "data/cv.json").read_text())
CONFIG = json.loads((ROOT / "data/publication-config.json").read_text())["publications"]
OUTPUT = ROOT / "assets/Resume_ChenChaofeng_en.pdf"
ACCENT = colors.HexColor("#17406b")
SIDE_MARGIN = 50
TOP_MARGIN = 40
BOTTOM_MARGIN = 44
FONT_DIRS = [
    Path(os.environ.get("CV_FONT_DIR", "/usr/share/fonts/truetype/dejavu")),
    Path.home() / ".cache/codex-runtimes/codex-primary-runtime/dependencies/native/libreoffice-headless/libreoffice/LibreOfficeDev.app/Contents/Resources/fonts/truetype",
    Path("/Library/Fonts"),
]
FONT_DIR = next((p for p in FONT_DIRS if (p / "DejaVuSans.ttf").exists()), None)
if FONT_DIR is None:
    raise SystemExit("Set CV_FONT_DIR to the directory containing DejaVuSans TTF fonts.")
for name, suffix in [("CV", ""), ("CV-Bold", "-Bold"), ("CV-Italic", "-Oblique"), ("CV-BoldItalic", "-BoldOblique")]:
    pdfmetrics.registerFont(TTFont(name, str(FONT_DIR / f"DejaVuSans{suffix}.ttf")))
pdfmetrics.registerFontFamily("CV", normal="CV", bold="CV-Bold", italic="CV-Italic", boldItalic="CV-BoldItalic")

# Embed the three Chinese name glyphs; avoid the old PDF's unembedded CJK font.
CJK = Path("/System/Library/Fonts/Supplemental/Songti.ttc")
if CJK.exists():
    pdfmetrics.registerFont(TTFont("CV-Chinese", str(CJK), subfontIndex=0))

BODY = ParagraphStyle("body", fontName="CV", fontSize=9, leading=12, spaceAfter=3, textColor=colors.HexColor("#20262d"))
SMALL = ParagraphStyle("small", parent=BODY, fontSize=8.5, leading=11.8, spaceAfter=3)
DATE = ParagraphStyle("date", parent=SMALL, alignment=TA_RIGHT, textColor=colors.HexColor("#657180"))
ACTIVITY_ITEM = ParagraphStyle("activity-item", parent=SMALL, leftIndent=12, bulletIndent=2, bulletFontName="CV", bulletFontSize=8.5)
PUB = ParagraphStyle("pub", parent=BODY, fontSize=9, leading=12.2, leftIndent=24, firstLineIndent=-24, spaceAfter=7)
SECTION = ParagraphStyle("section", parent=BODY, fontName="CV-Bold", fontSize=10.4, leading=14, textColor=ACCENT, spaceBefore=12, spaceAfter=4, keepWithNext=True)
SECTION_ICON = ParagraphStyle("section-icon", parent=SECTION, leftIndent=17)
CONTACT = ParagraphStyle("contact", parent=BODY, fontSize=8.5, leading=12, leftIndent=14, spaceAfter=0)
SUB = ParagraphStyle("sub", parent=SECTION, fontSize=9.5, leading=12, spaceBefore=10, spaceAfter=6)
TITLE = ParagraphStyle("title", parent=BODY, fontName="CV-Bold", fontSize=21, leading=27, alignment=TA_CENTER, spaceAfter=3)
CENTER = ParagraphStyle("center", parent=BODY, alignment=TA_CENTER)


def p(text, style=BODY):
    return Paragraph(text, style)


def link(url, label):
    return f'<a href="{escape(url, {chr(34): "&quot;"})}" color="#17406b">{escape(label)}</a>'


def draw_icon(canvas, kind, x, y, size):
    """Small vector line icons stay sharp at any PDF zoom level."""
    canvas.saveState()
    canvas.translate(x, y)
    canvas.scale(size / 24, size / 24)
    canvas.setStrokeColor(ACCENT)
    canvas.setLineWidth(1.7)
    canvas.setLineCap(1)
    canvas.setLineJoin(1)

    def line(*points, close=False):
        path = canvas.beginPath()
        path.moveTo(*points[0])
        for point in points[1:]:
            path.lineTo(*point)
        if close:
            path.close()
        canvas.drawPath(path)

    if kind == "research":
        canvas.circle(10, 14, 6, stroke=1, fill=0)
        line((14.5, 9.5), (21, 3))
    elif kind == "experience":
        canvas.roundRect(3, 4, 18, 14, 2, stroke=1, fill=0)
        line((8, 18), (8, 21), (16, 21), (16, 18))
        line((3, 12), (21, 12))
        line((10, 12), (10, 9), (14, 9), (14, 12))
    elif kind == "education":
        line((2, 15), (12, 20), (22, 15), (12, 10), close=True)
        line((6, 12), (6, 7), (12, 4), (18, 7), (18, 12))
        line((22, 15), (22, 7))
    elif kind == "publications":
        line((5, 2), (5, 22), (15, 22), (20, 17), (20, 2), close=True)
        line((15, 22), (15, 17), (20, 17))
        line((9, 12), (16, 12))
        line((9, 8), (16, 8))
    elif kind == "activities":
        canvas.circle(9, 17, 3, stroke=1, fill=0)
        canvas.circle(18, 16, 2.5, stroke=1, fill=0)
        canvas.arc(2, 1, 16, 13, 0, 180)
        canvas.arc(14, 3, 23, 11, 0, 140)
    elif kind == "teaching":
        line((12, 4), (3, 7), (3, 21), (12, 18), (21, 21), (21, 7), close=True)
        line((12, 4), (12, 18))
    elif kind == "awards":
        canvas.circle(12, 15, 6, stroke=1, fill=0)
        line((8, 10), (6, 2), (12, 5), (18, 2), (16, 10))
        canvas.circle(12, 15, 2.5, stroke=1, fill=0)
    elif kind == "email":
        canvas.roundRect(2, 5, 20, 14, 2, stroke=1, fill=0)
        line((3, 18), (12, 11), (21, 18))
    elif kind == "home":
        line((2, 12), (12, 21), (22, 12))
        line((5, 14), (5, 3), (19, 3), (19, 14))
        line((10, 3), (10, 10), (14, 10), (14, 3))
    elif kind == "code":
        line((7, 18), (2, 12), (7, 6))
        line((17, 18), (22, 12), (17, 6))
        line((14, 21), (10, 3))
    canvas.restoreState()


class IconParagraph(Paragraph):
    def __init__(self, text, style, icon, size):
        super().__init__(text, style)
        self.icon = icon
        self.icon_size = size

    def draw(self):
        super().draw()
        draw_icon(self.canv, self.icon, 0, self.height - self.icon_size - 0.5, self.icon_size)


def contact_row(contacts):
    cells, widths = [], []
    for icon, url, label in contacts:
        if cells:
            cells.append("")
            widths.append(16)
        cells.append(IconParagraph(link(url, label), CONTACT, icon, 10))
        widths.append(pdfmetrics.stringWidth(label, "CV", CONTACT.fontSize) + 16)
    row = Table([cells], colWidths=widths, hAlign="CENTER")
    row.setStyle(TableStyle([("LEFTPADDING", (0, 0), (-1, -1), 0), ("RIGHTPADDING", (0, 0), (-1, -1), 0), ("TOPPADDING", (0, 0), (-1, -1), 0), ("BOTTOMPADDING", (0, 0), (-1, -1), 3)]))
    return row


def section(title):
    icon = {
        "Research Interests": "research",
        "Research Experience": "experience",
        "Education": "education",
        "Selected Publications": "publications",
        "Academic Activities": "activities",
        "Teaching": "teaching",
        "Honors and Awards": "awards",
    }[title]
    story.append(IconParagraph(title.upper(), SECTION_ICON, icon, 12))
    rule = HRFlowable(width="100%", thickness=0.5, color=ACCENT, spaceAfter=6)
    rule.keepWithNext = True
    story.append(rule)


def dated(left, date, style=BODY):
    row = Table([[p(left, style), p(escape(date), DATE)]], colWidths=[WIDTH - 110, 110])
    row.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP"), ("LEFTPADDING", (0, 0), (-1, -1), 0), ("RIGHTPADDING", (0, 0), (-1, -1), 0), ("TOPPADDING", (0, 0), (-1, -1), 0), ("BOTTOMPADDING", (0, 0), (-1, -1), 2)]))
    return row


def bib_entries():
    # The repository uses brace-delimited fields; count braces to preserve titles.
    text = (ROOT / "data/publications.bib").read_text()
    entries = {}
    for match in re.finditer(r"@(\w+)\s*\{\s*([^,]+),", text):
        depth, end = 1, match.end()
        while depth and end < len(text):
            depth += (text[end] == "{") - (text[end] == "}")
            end += 1
        content = text[match.end():end - 1]
        fields = {}
        for field in re.finditer(r"(\w+)\s*=\s*\{", content):
            depth, stop = 1, field.end()
            while depth and stop < len(content):
                depth += (content[stop] == "{") - (content[stop] == "}")
                stop += 1
            fields[field[1].lower()] = content[field.end():stop - 1].strip()
        entries[match[2].strip()] = fields
    entries.update(CV["additional_publications"])
    return entries


def publication(key, number):
    entry = ENTRIES[key]
    config = CONFIG.get(key, {})
    authors = []
    for author in entry["author"].split(" and "):
        text = escape(author)
        if author == "Chaofeng Chen":
            text = "<b>Chaofeng&#160;Chen</b>"
        if author in config.get("co_first_authors", []):
            text += "<super>*</super>"
        if author in config.get("corresponding_authors", []):
            text += "<super>#</super>"
        authors.append(text)
    venue = entry.get("journal", entry.get("booktitle", "arXiv preprint"))
    abbrev = re.search(r"\(([^)]+)\)", venue)
    venue = abbrev[1] if abbrev else venue
    annotation = config.get("accept_info", "")
    # Keep distinctions, omitting dated rates and internal update annotations.
    annotation = annotation.split(",")[0].split(" · ")[0]
    label = escape(f"{venue} {entry['year']}")
    if annotation:
        distinction = escape(annotation)
        distinction_color = {
            "Oral": "#dc2626",
            "Highlight": "#dc2626",
            "ESI Highly Cited Paper": "#dc2626",
        }.get(annotation)
        if distinction_color:
            distinction = f'<font color="{distinction_color}">{distinction}</font>'
        label += f"; {distinction}"
    url = config.get("pdf") or entry.get("url")
    if not url and entry.get("eprint"):
        url = f"https://arxiv.org/abs/{entry['eprint']}"
    title = link(url, entry["title"]) if url else escape(entry["title"])
    return p(f'[{number}] <b>[{label}]</b> {title}. <font size="8.2" color="#56616f">{", ".join(authors)}.</font>', PUB)


WIDTH = A4[0] - 2 * SIDE_MARGIN - 12
ENTRIES = bib_entries()
story = []
name = escape(CV["name"])
if "CV-Chinese" in pdfmetrics.getRegisteredFontNames():
    name += f' <font name="CV-Chinese" size="17">({CV["name_zh"]})</font>'
story += [p(name, TITLE), p(f'<b>{escape(CV["position"])}</b> | {escape(CV["affiliation"])}', CENTER)]
story.append(contact_row([("email", "mailto:" + CV["personal_email"], CV["personal_email"]), ("home", CV["website"], "Homepage"), ("code", CV["github"], "GitHub"), ("education", CV["scholar"], "Google Scholar")]))

section("Research Interests")
story.append(p(escape(CV["research"])))
section("Research Experience")
for role, institution, date in CV["experience"]:
    story.append(dated(f"<b>{escape(role)}</b><br/>{escape(institution)}", date, SMALL))
section("Education")
for institution, degree, date, *details in CV["education"]:
    degree_line = " | ".join(escape(part) for part in [degree, *details])
    entry = [dated(f"<b>{escape(institution)}</b>", date, SMALL), p(degree_line, SMALL)]
    story.append(KeepTogether(entry))

section("Selected Publications")
story.append(p("Full list: " + link(CV["scholar"], "Google Scholar") + ". * Equal contribution; # Corresponding author.", SMALL))
number = 0
for group in CV["publication_groups"]:
    for index, key in enumerate(group["keys"]):
        number += 1
        entry = publication(key, number)
        content = [p(group["heading"], SUB), entry] if index == 0 else [entry]
        story.append(KeepTogether(content))

section("Academic Activities")
for role, description in CV["service"]:
    if isinstance(description, list):
        items = [p(f"<b>{escape(role)}:</b>", SMALL)]
        items.extend(Paragraph(escape(item), ACTIVITY_ITEM, bulletText="•") for item in description)
        story.append(KeepTogether(items))
    else:
        story.append(p(f"<b>{escape(role)}:</b> {escape(description)}", SMALL))
section("Teaching")
rows = [[p(f"<b>{heading}</b>", SMALL) for heading in ["Institution / Term", "Course", "Role"]]]
rows += [[p(f"<b>{escape(institution)}</b><br/>{escape(term)}", SMALL), p("<br/>".join(escape(part) for part in course.split("; ")), SMALL), p(escape(role), SMALL)] for institution, term, course, role in CV["teaching"]]
table = Table(rows, colWidths=[100, WIDTH - 165, 65], repeatRows=1)
table.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP"), ("LEFTPADDING", (0, 0), (-1, -1), 0), ("RIGHTPADDING", (0, 0), (-1, -1), 8), ("TOPPADDING", (0, 0), (-1, -1), 3), ("BOTTOMPADDING", (0, 0), (-1, -1), 6), ("LINEBELOW", (0, 0), (-1, 0), 0.4, colors.HexColor("#cdd5df"))]))
story.append(table)
section("Honors and Awards")
for award, date in CV["awards"]:
    story.append(dated(escape(award), date, SMALL))

def footer(canvas, doc):
    canvas.saveState()
    canvas.setFont("CV", 7.5)
    canvas.setFillColor(colors.HexColor("#657180"))
    canvas.drawString(SIDE_MARGIN + 6, 23, f"CHEN Chaofeng | Updated {CV['updated']}")
    canvas.drawRightString(A4[0] - SIDE_MARGIN - 6, 23, str(doc.page))
    if doc.page > 1:
        canvas.setFont("CV", 7)
        canvas.drawString(SIDE_MARGIN + 6, A4[1] - 24, "CHEN Chaofeng | Curriculum Vitae")
        canvas.setStrokeColor(colors.HexColor("#dce2e9"))
        canvas.setLineWidth(0.4)
        canvas.line(SIDE_MARGIN + 6, A4[1] - 30, A4[0] - SIDE_MARGIN - 6, A4[1] - 30)
    canvas.restoreState()


doc = SimpleDocTemplate(str(OUTPUT), pagesize=A4, leftMargin=SIDE_MARGIN, rightMargin=SIDE_MARGIN, topMargin=TOP_MARGIN, bottomMargin=BOTTOM_MARGIN, title="Chaofeng Chen - Curriculum Vitae", author="Chaofeng Chen", subject=f"Academic CV updated {CV['updated']}")
doc.build(story, onFirstPage=footer, onLaterPages=footer)
print(f"Built {OUTPUT}")
