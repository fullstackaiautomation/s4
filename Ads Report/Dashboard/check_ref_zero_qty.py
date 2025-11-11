#!/usr/bin/env python3
"""
Check reference file for the same rows
"""

import pandas as pd
from pathlib import Path

dashboard_path = Path("C:\\Users\\blkw\\OneDrive\\Documents\\Github\\Source 4 Industries\\Ads Report\\Dashboard")
reference_file = dashboard_path / "CBOS TO DASH Actual.xlsx"

reference_df = pd.read_excel(reference_file, sheet_name="BLANK (CBOS FINAL)")

# Check for the specific SKUs from our 0 qty rows
test_skus = ['R-7591-Anchor-NC', 'TP10JOP3', 'MRSS4040']
test_invoices = ['#37260', '#37356', '#37347']

for sku in test_skus:
    rows = reference_df[reference_df['SKU'] == sku]
    if len(rows) > 0:
        print(f"\n[+] SKU: {sku}")
        for idx, row in rows.iterrows():
            print(f"    Invoice: {row['Invoice #']}")
            print(f"    Qty: {row['Order Quantity']}")
            print(f"    Sales Each: {row['Sales Each']}")
            print(f"    Sales Total: {row['Sales Total']}")
