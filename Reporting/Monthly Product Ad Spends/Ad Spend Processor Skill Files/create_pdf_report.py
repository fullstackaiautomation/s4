import pandas as pd
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.gridspec import GridSpec
import seaborn as sns
from datetime import datetime
import io
import json
import os

# Set style
plt.style.use('seaborn-v0_8-whitegrid')
sns.set_palette("husl")

# Load configuration
with open('config.json', 'r') as f:
    config = json.load(f)

month = config['month']
output_dir = config['paths']['output_dir'].replace("{month}", month)

# Load the upload sheet
upload_df = pd.read_csv(os.path.join(output_dir, f"{month} Product Spend Upload.csv"))

# Clean up numeric columns
def clean_currency(val):
    if pd.isna(val) or val == '' or val == 'NaN':
        return 0
    if isinstance(val, str):
        return float(val.replace('$', '').replace(',', ''))
    return float(val)

def clean_numeric(val):
    if pd.isna(val) or val == '' or val == 'NaN':
        return 0
    if isinstance(val, str):
        val = val.replace('%', '').strip()
    return float(val) if val else 0

# Convert to numeric
upload_df['Ad Spend Numeric'] = upload_df['Ad Spend'].apply(clean_currency)
upload_df['Revenue Numeric'] = upload_df['Revenue'].apply(clean_currency)
upload_df['Clicks Numeric'] = upload_df['Clicks'].apply(clean_numeric)

# Calculate metrics
upload_df['ROAS'] = upload_df.apply(
    lambda row: row['Revenue Numeric'] / row['Ad Spend Numeric'] if row['Ad Spend Numeric'] > 0 else 0,
    axis=1
)
upload_df['CPC'] = upload_df.apply(
    lambda row: row['Ad Spend Numeric'] / row['Clicks Numeric'] if row['Clicks Numeric'] > 0 else 0,
    axis=1
)

print("Creating professional PDF report...")

# Prepare data for sections
top_20_spend = upload_df.nlargest(20, 'Ad Spend Numeric')[['SKU', 'Title', 'Vendor', 'Ad Spend Numeric', 'Revenue Numeric', 'ROAS']].reset_index(drop=True)
top_20_revenue = upload_df.nlargest(20, 'Revenue Numeric')[['SKU', 'Title', 'Vendor', 'Ad Spend Numeric', 'Revenue Numeric', 'ROAS']].reset_index(drop=True)
top_20_cpc = upload_df[upload_df['CPC'] > 0].nlargest(20, 'CPC')[['SKU', 'Title', 'Vendor', 'CPC', 'Clicks Numeric']].reset_index(drop=True)
vendor_spend = upload_df.groupby('Vendor').agg({
    'Ad Spend Numeric': 'sum',
    'Revenue Numeric': 'sum'
}).reset_index()
vendor_spend['ROAS'] = (vendor_spend['Revenue Numeric'] / vendor_spend['Ad Spend Numeric']).round(2)
vendor_spend = vendor_spend.sort_values('Ad Spend Numeric', ascending=False).head(20).reset_index(drop=True)

category_vendor = upload_df.groupby(['Product Category', 'Vendor']).agg({
    'Ad Spend Numeric': 'sum',
    'Revenue Numeric': 'sum'
}).reset_index()
category_vendor['ROAS'] = (category_vendor['Revenue Numeric'] / category_vendor['Ad Spend Numeric']).round(2)
category_vendor = category_vendor.sort_values('Ad Spend Numeric', ascending=False).head(20).reset_index(drop=True)

# Create PDF with reportlab
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak, Image
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from io import BytesIO

pdf_file = os.path.join(output_dir, f"{month} Ad Spend Performance Report.pdf")
doc = SimpleDocTemplate(pdf_file, pagesize=letter, rightMargin=0.4*inch, leftMargin=0.4*inch, topMargin=0.4*inch, bottomMargin=0.4*inch)

elements = []

# Define styles
styles = getSampleStyleSheet()
title_style = ParagraphStyle(
    'CustomTitle',
    parent=styles['Heading1'],
    fontSize=26,
    textColor=colors.HexColor('#1F4E78'),
    spaceAfter=6,
    alignment=TA_CENTER,
    fontName='Helvetica-Bold'
)

subtitle_style = ParagraphStyle(
    'CustomSubtitle',
    parent=styles['Normal'],
    fontSize=10,
    textColor=colors.HexColor('#666666'),
    spaceAfter=12,
    alignment=TA_CENTER
)

section_style = ParagraphStyle(
    'SectionTitle',
    parent=styles['Heading2'],
    fontSize=12,
    textColor=colors.HexColor('#FFFFFF'),
    spaceAfter=8,
    fontName='Helvetica-Bold',
    backColor=colors.HexColor('#1F4E78'),
    leftIndent=8,
    rightIndent=8,
    spaceBefore=12,
    leading=18
)

# ==================== TITLE PAGE ====================
elements.append(Spacer(1, 0.3*inch))
elements.append(Paragraph(f"{month} Ad Spend Performance Report", title_style))
elements.append(Paragraph(f"Generated on {datetime.now().strftime('%B %d, %Y')}", subtitle_style))
elements.append(Spacer(1, 0.25*inch))

# Summary metrics
total_spend = upload_df['Ad Spend Numeric'].sum()
total_revenue = upload_df['Revenue Numeric'].sum()
overall_roas = total_revenue / total_spend if total_spend > 0 else 0
total_products = len(upload_df)
total_vendors = upload_df['Vendor'].nunique()

summary_data = [
    ['Metric', 'Value'],
    ['Total Ad Spend', f"${total_spend:,.2f}"],
    ['Total Revenue', f"${total_revenue:,.2f}"],
    ['Overall ROAS', f"{overall_roas:.2f}"],
    ['Total Products', f"{total_products}"],
    ['Total Vendors', f"{total_vendors}"]
]

summary_table = Table(summary_data, colWidths=[2.2*inch, 1.8*inch])
summary_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1F4E78')),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
    ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
    ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
    ('FONTSIZE', (0, 0), (-1, -1), 10),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ('TOPPADDING', (0, 0), (-1, -1), 8),
    ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#CCCCCC')),
    ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F5F5F5')]),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
]))

elements.append(summary_table)
elements.append(PageBreak())

# Helper function to create clean table data
def format_product_table_data(df_data):
    """Format product dataframe for table display with truncation"""
    data = [['SKU', 'Product Title', 'Vendor', 'Ad Spend', 'Revenue', 'ROAS']]
    for idx, row in df_data.iterrows():
        # Truncate title to 32 chars
        title = str(row['Title'])[:32].strip()
        vendor = str(row['Vendor'])[:18].strip()

        data.append([
            str(row['SKU']),
            title,
            vendor,
            f"${row['Ad Spend Numeric']:,.0f}",
            f"${row['Revenue Numeric']:,.0f}",
            f"{row['ROAS']:.2f}"
        ])
    return data

# ==================== TOP 20 PRODUCTS BY AD SPEND ====================
elements.append(Paragraph("Top 20 Products by Ad Spend", section_style))
elements.append(Spacer(1, 0.1*inch))

spend_data = format_product_table_data(top_20_spend)
spend_table = Table(spend_data, colWidths=[0.8*inch, 2.4*inch, 1.3*inch, 1.0*inch, 1.0*inch, 0.65*inch])
spend_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1F4E78')),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
    ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
    ('ALIGN', (0, 1), (0, -1), 'CENTER'),
    ('ALIGN', (1, 1), (1, -1), 'LEFT'),
    ('ALIGN', (2, 1), (-1, -1), 'CENTER'),
    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
    ('FONTSIZE', (0, 0), (-1, -1), 7.5),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ('TOPPADDING', (0, 0), (-1, -1), 4),
    ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#DDDDDD')),
    ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#FAFAFA')]),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
]))

elements.append(spend_table)
elements.append(Spacer(1, 0.15*inch))

# Chart for top 10 by spend
fig, ax = plt.subplots(figsize=(6.5, 2.2), dpi=100)
top_10_spend = top_20_spend.head(10)
bars = ax.barh(range(len(top_10_spend)), top_10_spend['Ad Spend Numeric'], color='#1F4E78', edgecolor='#000000', linewidth=0.5)
ax.set_yticks(range(len(top_10_spend)))
ax.set_yticklabels(top_10_spend['SKU'], fontsize=7.5)
ax.set_xlabel('Ad Spend ($)', fontsize=8, fontweight='bold')
ax.set_title('Top 10 by Ad Spend', fontsize=9, fontweight='bold', pad=8)
ax.invert_yaxis()
ax.grid(axis='x', alpha=0.2, linestyle='--')
ax.set_axisbelow(True)
for i, bar in enumerate(bars):
    width = bar.get_width()
    ax.text(width, bar.get_y() + bar.get_height()/2, f'${width:,.0f}',
            ha='left', va='center', fontsize=6.5, fontweight='bold', color='#000000')
plt.tight_layout()

img_buffer = BytesIO()
plt.savefig(img_buffer, format='png', bbox_inches='tight', dpi=100, facecolor='white', edgecolor='none')
img_buffer.seek(0)
plt.close()

img = Image(img_buffer, width=5.8*inch, height=1.95*inch)
elements.append(img)
elements.append(PageBreak())

# ==================== TOP 20 PRODUCTS BY REVENUE ====================
elements.append(Paragraph("Top 20 Products by Revenue", section_style))
elements.append(Spacer(1, 0.1*inch))

revenue_data = format_product_table_data(top_20_revenue)
revenue_table = Table(revenue_data, colWidths=[0.8*inch, 2.4*inch, 1.3*inch, 1.0*inch, 1.0*inch, 0.65*inch])
revenue_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1F4E78')),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
    ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
    ('ALIGN', (0, 1), (0, -1), 'CENTER'),
    ('ALIGN', (1, 1), (1, -1), 'LEFT'),
    ('ALIGN', (2, 1), (-1, -1), 'CENTER'),
    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
    ('FONTSIZE', (0, 0), (-1, -1), 7.5),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ('TOPPADDING', (0, 0), (-1, -1), 4),
    ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#DDDDDD')),
    ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#FAFAFA')]),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
]))

elements.append(revenue_table)
elements.append(Spacer(1, 0.15*inch))

# Chart for top 10 by revenue
fig, ax = plt.subplots(figsize=(6.5, 2.2), dpi=100)
top_10_revenue = top_20_revenue.head(10)
bars = ax.barh(range(len(top_10_revenue)), top_10_revenue['Revenue Numeric'], color='#70AD47', edgecolor='#000000', linewidth=0.5)
ax.set_yticks(range(len(top_10_revenue)))
ax.set_yticklabels(top_10_revenue['SKU'], fontsize=7.5)
ax.set_xlabel('Revenue ($)', fontsize=8, fontweight='bold')
ax.set_title('Top 10 by Revenue', fontsize=9, fontweight='bold', pad=8)
ax.invert_yaxis()
ax.grid(axis='x', alpha=0.2, linestyle='--')
ax.set_axisbelow(True)
for i, bar in enumerate(bars):
    width = bar.get_width()
    ax.text(width, bar.get_y() + bar.get_height()/2, f'${width:,.0f}',
            ha='left', va='center', fontsize=6.5, fontweight='bold', color='#000000')
plt.tight_layout()

img_buffer = BytesIO()
plt.savefig(img_buffer, format='png', bbox_inches='tight', dpi=100, facecolor='white', edgecolor='none')
img_buffer.seek(0)
plt.close()

img = Image(img_buffer, width=5.8*inch, height=1.95*inch)
elements.append(img)
elements.append(PageBreak())

# ==================== TOP 20 HIGHEST CPC ====================
elements.append(Paragraph("Top 20 Highest CPC by SKU", section_style))
elements.append(Spacer(1, 0.1*inch))

cpc_data = [['SKU', 'Product Title', 'Vendor', 'CPC', 'Clicks']]
for idx, row in top_20_cpc.iterrows():
    title = str(row['Title'])[:32].strip()
    vendor = str(row['Vendor'])[:18].strip()
    cpc_data.append([
        str(row['SKU']),
        title,
        vendor,
        f"${row['CPC']:,.2f}",
        f"{int(row['Clicks Numeric'])}"
    ])

cpc_table = Table(cpc_data, colWidths=[0.8*inch, 2.4*inch, 1.3*inch, 1.0*inch, 0.75*inch])
cpc_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1F4E78')),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
    ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
    ('ALIGN', (0, 1), (0, -1), 'CENTER'),
    ('ALIGN', (1, 1), (1, -1), 'LEFT'),
    ('ALIGN', (2, 1), (-1, -1), 'CENTER'),
    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
    ('FONTSIZE', (0, 0), (-1, -1), 7.5),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ('TOPPADDING', (0, 0), (-1, -1), 4),
    ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#DDDDDD')),
    ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#FAFAFA')]),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
]))

elements.append(cpc_table)
elements.append(Spacer(1, 0.15*inch))

# Chart for top 10 CPC
fig, ax = plt.subplots(figsize=(6.5, 2.2), dpi=100)
top_10_cpc = top_20_cpc.head(10)
bars = ax.barh(range(len(top_10_cpc)), top_10_cpc['CPC'], color='#FFC000', edgecolor='#000000', linewidth=0.5)
ax.set_yticks(range(len(top_10_cpc)))
ax.set_yticklabels(top_10_cpc['SKU'], fontsize=7.5)
ax.set_xlabel('Cost Per Click ($)', fontsize=8, fontweight='bold')
ax.set_title('Top 10 by CPC', fontsize=9, fontweight='bold', pad=8)
ax.invert_yaxis()
ax.grid(axis='x', alpha=0.2, linestyle='--')
ax.set_axisbelow(True)
for i, bar in enumerate(bars):
    width = bar.get_width()
    ax.text(width, bar.get_y() + bar.get_height()/2, f'${width:.2f}',
            ha='left', va='center', fontsize=6.5, fontweight='bold', color='#000000')
plt.tight_layout()

img_buffer = BytesIO()
plt.savefig(img_buffer, format='png', bbox_inches='tight', dpi=100, facecolor='white', edgecolor='none')
img_buffer.seek(0)
plt.close()

img = Image(img_buffer, width=5.8*inch, height=1.95*inch)
elements.append(img)
elements.append(PageBreak())

# ==================== TOP 20 VENDORS ====================
elements.append(Paragraph("Top 20 Vendors by Ad Spend", section_style))
elements.append(Spacer(1, 0.1*inch))

vendor_data = [['Vendor', 'Ad Spend', 'Revenue', 'ROAS']]
for idx, row in vendor_spend.iterrows():
    vendor = str(row['Vendor'])[:30].strip()
    vendor_data.append([
        vendor,
        f"${row['Ad Spend Numeric']:,.0f}",
        f"${row['Revenue Numeric']:,.0f}",
        f"{row['ROAS']:.2f}"
    ])

vendor_table = Table(vendor_data, colWidths=[2.5*inch, 1.3*inch, 1.3*inch, 1.05*inch])
vendor_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1F4E78')),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
    ('ALIGN', (0, 0), (0, -1), 'LEFT'),
    ('ALIGN', (1, 0), (-1, -1), 'CENTER'),
    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
    ('FONTSIZE', (0, 0), (-1, -1), 8),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ('TOPPADDING', (0, 0), (-1, -1), 4),
    ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#DDDDDD')),
    ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#FAFAFA')]),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
]))

elements.append(vendor_table)
elements.append(Spacer(1, 0.15*inch))

# Chart for vendors
fig, ax = plt.subplots(figsize=(6.5, 2.2), dpi=100)
top_10_vendors = vendor_spend.head(10)
bars = ax.barh(range(len(top_10_vendors)), top_10_vendors['Ad Spend Numeric'], color='#5B9BD5', edgecolor='#000000', linewidth=0.5)
ax.set_yticks(range(len(top_10_vendors)))
ax.set_yticklabels(top_10_vendors['Vendor'], fontsize=7.5)
ax.set_xlabel('Ad Spend ($)', fontsize=8, fontweight='bold')
ax.set_title('Top 10 Vendors', fontsize=9, fontweight='bold', pad=8)
ax.invert_yaxis()
ax.grid(axis='x', alpha=0.2, linestyle='--')
ax.set_axisbelow(True)
for i, bar in enumerate(bars):
    width = bar.get_width()
    ax.text(width, bar.get_y() + bar.get_height()/2, f'${width:,.0f}',
            ha='left', va='center', fontsize=6.5, fontweight='bold', color='#000000')
plt.tight_layout()

img_buffer = BytesIO()
plt.savefig(img_buffer, format='png', bbox_inches='tight', dpi=100, facecolor='white', edgecolor='none')
img_buffer.seek(0)
plt.close()

img = Image(img_buffer, width=5.8*inch, height=1.95*inch)
elements.append(img)
elements.append(PageBreak())

# ==================== TOP 20 CATEGORIES ====================
elements.append(Paragraph("Top 20 Product Categories with Vendor Details", section_style))
elements.append(Spacer(1, 0.1*inch))

category_data = [['Category', 'Vendor', 'Ad Spend', 'Revenue', 'ROAS']]
for idx, row in category_vendor.iterrows():
    cat = str(row['Product Category'])[:28].strip()
    vendor = str(row['Vendor'])[:18].strip()
    category_data.append([
        cat,
        vendor,
        f"${row['Ad Spend Numeric']:,.0f}",
        f"${row['Revenue Numeric']:,.0f}",
        f"{row['ROAS']:.2f}"
    ])

category_table = Table(category_data, colWidths=[1.4*inch, 1.85*inch, 1.2*inch, 1.2*inch, 0.75*inch])
category_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1F4E78')),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
    ('ALIGN', (0, 0), (1, -1), 'LEFT'),
    ('ALIGN', (2, 0), (-1, -1), 'CENTER'),
    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
    ('FONTSIZE', (0, 0), (-1, -1), 7.5),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ('TOPPADDING', (0, 0), (-1, -1), 4),
    ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#DDDDDD')),
    ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#FAFAFA')]),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
]))

elements.append(category_table)
elements.append(Spacer(1, 0.15*inch))

# Chart for categories
fig, ax = plt.subplots(figsize=(6.5, 2.2), dpi=100)
top_10_categories = category_vendor.head(10)
bars = ax.barh(range(len(top_10_categories)), top_10_categories['Ad Spend Numeric'], color='#C55A11', edgecolor='#000000', linewidth=0.5)
ax.set_yticks(range(len(top_10_categories)))
ax.set_yticklabels(top_10_categories['Product Category'], fontsize=7.5)
ax.set_xlabel('Ad Spend ($)', fontsize=8, fontweight='bold')
ax.set_title('Top 10 Categories', fontsize=9, fontweight='bold', pad=8)
ax.invert_yaxis()
ax.grid(axis='x', alpha=0.2, linestyle='--')
ax.set_axisbelow(True)
for i, bar in enumerate(bars):
    width = bar.get_width()
    ax.text(width, bar.get_y() + bar.get_height()/2, f'${width:,.0f}',
            ha='left', va='center', fontsize=6.5, fontweight='bold', color='#000000')
plt.tight_layout()

img_buffer = BytesIO()
plt.savefig(img_buffer, format='png', bbox_inches='tight', dpi=100, facecolor='white', edgecolor='none')
img_buffer.seek(0)
plt.close()

img = Image(img_buffer, width=5.8*inch, height=1.95*inch)
elements.append(img)

# Build PDF
doc.build(elements)

print(f"\nCreated: {pdf_file}")
print(f"Report includes:")
print(f"  - Summary metrics (Total Spend, Revenue, ROAS)")
print(f"  - Top 20 Products by Ad Spend with chart")
print(f"  - Top 20 Products by Revenue with chart")
print(f"  - Top 20 Highest CPC by SKU with chart")
print(f"  - Top 20 Vendors by Ad Spend with chart")
print(f"  - Top 20 Categories with Vendor Details and chart")
print(f"\nFormatting improvements:")
print(f"  - All titles truncated to 32 characters")
print(f"  - Consistent table styling")
print(f"  - Better spacing and readability")
print(f"  - Clean header design")
