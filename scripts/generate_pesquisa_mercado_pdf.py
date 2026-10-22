from pathlib import Path
from docx import Document
from docx.oxml.ns import qn
from reportlab.lib import colors
from reportlab.lib.enums import TA_JUSTIFY, TA_LEFT, TA_RIGHT, TA_CENTER
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether
from xml.sax.saxutils import escape

root = Path(__file__).resolve().parents[1]
docx_path = root / 'entregas' / 'cti' / 'analise_mercado' / 'Pesquisa_Analise_Mercado_Feedback_CTI_GR1.docx'
pdf_path = root / 'entregas' / 'cti' / 'analise_mercado' / 'Pesquisa_Analise_Mercado_Feedback_CTI_GR1.pdf'
document = Document(docx_path)
pdfmetrics.registerFont(TTFont('Arial', r'C:\Windows\Fonts\arial.ttf'))
pdfmetrics.registerFont(TTFont('Arial-Bold', r'C:\Windows\Fonts\arialbd.ttf'))
styles = getSampleStyleSheet()
styles.add(ParagraphStyle(name='ReportTitle', parent=styles['Title'], fontName='Arial-Bold', fontSize=22, leading=27, textColor=colors.black, spaceAfter=5))
styles.add(ParagraphStyle(name='Subtitle', parent=styles['Normal'], fontName='Arial', fontSize=15, leading=19, textColor=colors.HexColor('#0F6B78'), spaceAfter=12))
styles.add(ParagraphStyle(name='Meta', parent=styles['Normal'], fontName='Arial', fontSize=9.5, leading=12, textColor=colors.HexColor('#5B6573'), spaceAfter=14))
styles.add(ParagraphStyle(name='BodyReport', parent=styles['BodyText'], fontName='Arial', fontSize=10, leading=14, alignment=TA_JUSTIFY, spaceAfter=7))
styles.add(ParagraphStyle(name='H1Report', parent=styles['Heading1'], fontName='Arial-Bold', fontSize=14, leading=17, textColor=colors.black, spaceBefore=13, spaceAfter=6, keepWithNext=True))
styles.add(ParagraphStyle(name='H2Report', parent=styles['Heading2'], fontName='Arial-Bold', fontSize=12, leading=15, textColor=colors.black, spaceBefore=10, spaceAfter=5, keepWithNext=True))
styles.add(ParagraphStyle(name='BulletReport', parent=styles['BodyText'], fontName='Arial', fontSize=9.8, leading=13.3, leftIndent=15, firstLineIndent=-10, spaceAfter=4))
styles.add(ParagraphStyle(name='TableReport', parent=styles['BodyText'], fontName='Arial', fontSize=7.7, leading=10, spaceAfter=0))
styles.add(ParagraphStyle(name='TableHeadReport', parent=styles['BodyText'], fontName='Arial-Bold', fontSize=7.8, leading=10, textColor=colors.white, spaceAfter=0))
styles.add(ParagraphStyle(name='ReferenceReport', parent=styles['BodyText'], fontName='Arial', fontSize=8.5, leading=11, leftIndent=18, firstLineIndent=-18, spaceAfter=5, wordWrap='CJK'))

story = []
body = document._element.body
for el in body.iterchildren():
    tag = el.tag.rsplit('}', 1)[-1]
    if tag == 'p':
        from docx.text.paragraph import Paragraph as DocxParagraph
        p = DocxParagraph(el, document)
        text = p.text.strip()
        if not text:
            continue
        style = p.style.name if p.style else 'Normal'
        encoded = escape(text)
        if style == 'Title':
            story.append(Paragraph(encoded, styles['ReportTitle']))
        elif style.startswith('Heading 1'):
            story.append(Paragraph(encoded, styles['H1Report']))
        elif style.startswith('Heading 2'):
            story.append(Paragraph(encoded, styles['H2Report']))
        elif 'List' in style or el.find('.//' + qn('w:numPr')) is not None:
            story.append(Paragraph('•&nbsp;&nbsp;' + encoded, styles['BulletReport']))
        elif text.startswith('https://') or ('Disponível em:' in text):
            escaped = escape(text).replace('https://', 'https://')
            story.append(Paragraph(escaped, styles['ReferenceReport']))
        elif text.startswith('Pesquisa de mercado') or text.startswith('DESAFIO DE IDEIAS'):
            continue
        elif text.startswith('Sistema de coleta'):
            story.append(Paragraph(encoded, styles['Subtitle']))
        elif text.startswith('Desafio de Ideias'):
            story.append(Paragraph(encoded, styles['Meta']))
        else:
            if text.startswith('A leitura competitiva sugere dois grupos principais.'):
                story.append(KeepTogether([Paragraph(encoded, styles['BodyReport'])]))
            else:
                story.append(Paragraph(encoded, styles['BodyReport']))
    elif tag == 'tbl':
        from docx.table import Table as DocxTable
        tbl = DocxTable(el, document)
        data = []
        for ri, tr in enumerate(tbl.rows):
            row = []
            for cell in tr.cells:
                txt = escape(cell.text.strip()).replace('\n', '<br/>')
                row.append(Paragraph(txt, styles['TableHeadReport'] if ri == 0 else styles['TableReport']))
            data.append(row)
        t = Table(data, colWidths=[1.13*inch, 2.68*inch, 2.44*inch], repeatRows=1, hAlign='LEFT')
        t.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#17365D')),
            ('TEXTCOLOR', (0,0), (-1,0), colors.white),
            ('GRID', (0,0), (-1,-1), 0.4, colors.HexColor('#C7D2DE')),
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ('LEFTPADDING', (0,0), (-1,-1), 5), ('RIGHTPADDING', (0,0), (-1,-1), 5),
            ('TOPPADDING', (0,0), (-1,-1), 5), ('BOTTOMPADDING', (0,0), (-1,-1), 5),
            ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#F5F8FB')]),
        ]))
        story.extend([Spacer(1, 2), t, Spacer(1, 7)])

pdf = SimpleDocTemplate(str(pdf_path), pagesize=letter, rightMargin=0.75*inch, leftMargin=0.75*inch, topMargin=0.92*inch, bottomMargin=0.98*inch, title='Pesquisa e análise de mercado sobre gestão de feedback', author='GR1 | Desafio de Ideias')
pdf.build(story)
print(pdf_path)




