"""
Simple script to convert Markdown to PDF using reportlab
"""
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
from pathlib import Path
import re

# Read markdown file
md_file = Path(r"d:\Project\School-Management-System\BAO_CAO_CHUC_NANG_NON_TECHNICAL.md")
output_pdf = Path(r"d:\Project\School-Management-System\BAO_CAO_CHUC_NANG_NON_TECHNICAL.pdf")

print(f"Đọc file: {md_file}")
with open(md_file, 'r', encoding='utf-8') as f:
    md_content = f.read()

# Create PDF
doc = SimpleDocTemplate(
    str(output_pdf),
    pagesize=A4,
    rightMargin=2*cm,
    leftMargin=2*cm,
    topMargin=2*cm,
    bottomMargin=2*cm
)

# Get styles
styles = getSampleStyleSheet()

# Custom styles
title_style = ParagraphStyle(
    'TitleStyle',
    parent=styles['Heading1'],
    fontSize=18,
    spaceAfter=12,
    alignment=TA_CENTER,
    fontName='Helvetica-Bold'
)

h1_style = ParagraphStyle(
    'H1Style',
    parent=styles['Heading1'],
    fontSize=14,
    spaceAfter=10,
    spaceBefore=12,
    fontName='Helvetica-Bold'
)

h2_style = ParagraphStyle(
    'H2Style',
    parent=styles['Heading2'],
    fontSize=12,
    spaceAfter=8,
    spaceBefore=10,
    fontName='Helvetica-Bold'
)

h3_style = ParagraphStyle(
    'H3Style',
    parent=styles['Heading3'],
    fontSize=11,
    spaceAfter=6,
    spaceBefore=8,
    fontName='Helvetica-Bold'
)

body_style = ParagraphStyle(
    'BodyStyle',
    parent=styles['BodyText'],
    fontSize=10,
    leading=14,
    alignment=TA_JUSTIFY
)

bullet_style = ParagraphStyle(
    'BulletStyle',
    parent=styles['BodyText'],
    fontSize=10,
    leading=14,
    leftIndent=20
)

# Story
story = []

# Process lines
lines = md_content.split('\n')

for line in lines:
    line = line.strip()
    
    if not line:
        continue
    
    if line.startswith('---'):
        story.append(Spacer(1, 0.5*cm))
        continue
    
    # Headers
    if line.startswith('# '):
        text = line[2:].strip()
        story.append(Paragraph(text, title_style))
        story.append(Spacer(1, 0.3*cm))
    elif line.startswith('## '):
        text = line[3:].strip()
        story.append(Spacer(1, 0.3*cm))
        story.append(Paragraph(text, h1_style))
    elif line.startswith('### '):
        text = line[4:].strip()
        story.append(Paragraph(text, h2_style))
    elif line.startswith('#### '):
        text = line[5:].strip()
        story.append(Paragraph(text, h3_style))
    
    # Lists
    elif line.startswith('- ') or line.startswith('* ') or line.startswith('+ '):
        text = line[2:].strip()
        story.append(Paragraph(f"• {text}", bullet_style))
    
    # Numbered lists
    elif re.match(r'^\d+\.', line):
        text = re.sub(r'^\d+\.\s*', '', line)
        story.append(Paragraph(text, bullet_style))
    
    # Bold lines
    elif line.startswith('**') and line.endswith('**'):
        text = line[2:-2].strip()
        story.append(Paragraph(f"<b>{text}</b>", body_style))
    
    # Regular text
    else:
        story.append(Paragraph(line, body_style))

# Build PDF
print("Đang tạo file PDF...")
try:
    doc.build(story)
    print(f"✅ Thành công! File PDF đã được tạo:")
    print(f"   📄 {output_pdf}")
    print(f"   💾 Kích thước: {output_pdf.stat().st_size / 1024:.2f} KB")
except Exception as e:
    print(f"❌ Lỗi khi tạo PDF: {e}")
    import traceback
    traceback.print_exc()
