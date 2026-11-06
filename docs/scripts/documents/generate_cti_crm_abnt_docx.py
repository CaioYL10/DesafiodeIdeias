from pathlib import Path
import re
import zipfile
from xml.etree.ElementTree import Element, SubElement, tostring

ROOT = Path(__file__).resolve().parents[3]
SOURCE = ROOT / "docs/entregas/cti/ideacao/Proposta_CRM_CTI_GR1_ABNT.md"
OUTPUT = ROOT / "docs/entregas/cti/ideacao/Proposta_CRM_CTI_GR1_ABNT.docx"
NS = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
RNS = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"
ETNS = "http://www.w3.org/XML/1998/namespace"


def tag(name):
    return f"{{{NS}}}{name}"


def add_run(paragraph, text, bold=False, italic=False):
    run = SubElement(paragraph, tag("r"))
    props = SubElement(run, tag("rPr"))
    if bold:
        SubElement(props, tag("b"))
    if italic:
        SubElement(props, tag("i"))
    font = SubElement(props, tag("rFonts"))
    font.set(tag("ascii"), "Arial")
    font.set(tag("hAnsi"), "Arial")
    size = SubElement(props, tag("sz"))
    size.set(tag("val"), "24")
    node = SubElement(run, tag("t"))
    node.set(f"{{{ETNS}}}space", "preserve")
    node.text = text


def add_text_runs(paragraph, text):
    for i, part in enumerate(re.split(r"(\*\*.*?\*\*)", text)):
        if not part:
            continue
        bold = part.startswith("**") and part.endswith("**")
        add_run(paragraph, part[2:-2] if bold else part, bold=bold)


def add_paragraph(body, text="", *, align=None, style=None, page_break=False, first_indent=False):
    p = SubElement(body, tag("p"))
    ppr = SubElement(p, tag("pPr"))
    if style:
        pstyle = SubElement(ppr, tag("pStyle"))
        pstyle.set(tag("val"), style)
    if align:
        jc = SubElement(ppr, tag("jc"))
        jc.set(tag("val"), align)
    if first_indent:
        ind = SubElement(ppr, tag("ind"))
        ind.set(tag("firstLine"), "709")
    if page_break:
        run = SubElement(p, tag("r"))
        SubElement(run, tag("br")).set(tag("type"), "page")
    else:
        add_text_runs(p, text)
    return p


def build_document():
    document = Element(tag("document"))
    document.set("xmlns:r", RNS)
    body = SubElement(document, tag("body"))
    lines = SOURCE.read_text(encoding="utf-8").splitlines()
    cover = True
    for line in lines:
        stripped = line.strip()
        if stripped == "---":
            add_paragraph(body, page_break=True)
            cover = False
            continue
        if not stripped or stripped.startswith("<br"):
            add_paragraph(body, "", style="CoverSpace" if cover else None)
            continue
        if stripped.startswith("# "):
            heading = stripped[2:].strip()
            if cover:
                style = "CoverTitle" if heading.startswith("PROPOSTA") else "CoverHeading"
                add_paragraph(body, heading, align="center", style=style)
            else:
                add_paragraph(body, heading, style="Heading1")
        elif stripped.startswith("## "):
            heading = stripped[3:].strip()
            add_paragraph(body, heading, style="Heading1")
        else:
            add_paragraph(body, stripped, align="both", first_indent=not cover)

    sect = SubElement(body, tag("sectPr"))
    pg_sz = SubElement(sect, tag("pgSz"))
    pg_sz.set(tag("w"), "11906")
    pg_sz.set(tag("h"), "16838")
    margins = SubElement(sect, tag("pgMar"))
    for key, val in (("top", "1701"), ("right", "1134"), ("bottom", "1134"), ("left", "1701"), ("header", "1021"), ("footer", "1021"), ("gutter", "0")):
        margins.set(tag(key), val)
    return tostring(document, encoding="utf-8", xml_declaration=True)


def styles_xml():
    styles = Element(tag("styles"))
    defaults = SubElement(styles, tag("docDefaults"))
    rpr_default = SubElement(SubElement(defaults, tag("rPrDefault")), tag("rPr"))
    fonts = SubElement(rpr_default, tag("rFonts"))
    fonts.set(tag("ascii"), "Arial")
    fonts.set(tag("hAnsi"), "Arial")
    size = SubElement(rpr_default, tag("sz"))
    size.set(tag("val"), "24")
    ppr_default = SubElement(SubElement(defaults, tag("pPrDefault")), tag("pPr"))
    spacing = SubElement(ppr_default, tag("spacing"))
    spacing.set(tag("line"), "360")
    spacing.set(tag("lineRule"), "auto")
    normal = SubElement(styles, tag("style"), {tag("type"): "paragraph", tag("default"): "1", tag("styleId"): "Normal"})
    SubElement(normal, tag("name"), {tag("val"): "Normal"})
    for sid, name, size_val, bold, align, before, after in [
        ("Heading1", "Heading 1", "24", True, "left", "240", "120"),
        ("CoverHeading", "Cover heading", "24", True, "center", "0", "120"),
        ("CoverTitle", "Cover title", "28", True, "center", "1200", "240"),
        ("CoverSpace", "Cover spacing", "24", False, "center", "0", "120"),
    ]:
        style = SubElement(styles, tag("style"), {tag("type"): "paragraph", tag("styleId"): sid})
        SubElement(style, tag("name"), {tag("val"): name})
        ppr = SubElement(style, tag("pPr"))
        SubElement(ppr, tag("jc"), {tag("val"): align})
        SubElement(ppr, tag("spacing"), {tag("before"): before, tag("after"): after, tag("line"): "360", tag("lineRule"): "auto"})
        rpr = SubElement(style, tag("rPr"))
        SubElement(rpr, tag("b")) if bold else None
        SubElement(rpr, tag("sz"), {tag("val"): size_val})
    return tostring(styles, encoding="utf-8", xml_declaration=True)


def main():
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    content_types = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/></Types>'''
    rels = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>'''
    package_rels = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>'''
    with zipfile.ZipFile(OUTPUT, "w", zipfile.ZIP_DEFLATED) as docx:
        docx.writestr("[Content_Types].xml", content_types)
        docx.writestr("_rels/.rels", package_rels)
        docx.writestr("word/_rels/document.xml.rels", rels)
        docx.writestr("word/document.xml", build_document())
        docx.writestr("word/styles.xml", styles_xml())
    print(OUTPUT)


if __name__ == "__main__":
    main()
