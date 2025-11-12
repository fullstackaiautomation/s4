#!/usr/bin/env python3
"""
Check rows with 0 Qty and 0 Sales Total
"""

import pandas as pd
from pathlib import Path

dashboard_path = Path("C:\\Users\\blkw\\OneDrive\\Documents\\Github\\Source 4 Industries\\Ads Report\\Dashboard")

# Get latest output
output_files = list(dashboard_path.glob("2025-10_Dashboard_Import_*.xlsx"))
latest_output = max(output_files, key=lambda p: p.stat().st_mtime)

output_df = pd.read_excel(latest_output, sheet_name="READY TO IMPORT")

# Find rows with 0 Qty and 0 Sales Total
zero_qty = output_df[(output_df['Order Quantity'] == 0) | (output_df['Sales Total'] == 0)]
print(f"[+] Found {len(zero_qty)} rows with 0 Qty or 0 Sales Total")

if len(zero_qty) > 0:
    print("\nFirst 5 such rows:")
    for idx, row in zero_qty.head(5).iterrows():
        print(f"\n  Invoice: {row['Invoice #']}")
        print(f"    SKU: {row['SKU']}")
        print(f"    Description: {row['Description']}")
        print(f"    Qty: {row['Order Quantity']}")
        print(f"    Sales Each: {row['Sales Each']}")
        print(f"    Sales Total: {row['Sales Total']}")
