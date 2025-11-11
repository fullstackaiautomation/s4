#!/usr/bin/env python3
"""
Check the row with nan SKU in reference file
"""

import pandas as pd
from pathlib import Path
import numpy as np

dashboard_path = Path("C:\\Users\\blkw\\OneDrive\\Documents\\Github\\Source 4 Industries\\Ads Report\\Dashboard")
reference_file = dashboard_path / "CBOS TO DASH Actual.xlsx"

# Load reference file
reference_df = pd.read_excel(reference_file, sheet_name="BLANK (CBOS FINAL)")

# Find the row with SO3589 invoice
so3589_rows = reference_df[reference_df['Invoice #'] == 'SO3589']
print(f"[+] Found {len(so3589_rows)} row(s) with Invoice #SO3589")
print("\nRow details:")
print(so3589_rows.to_string())

print("\n[*] Checking for rows with null/nan SKU in reference:")
nan_sku_rows = reference_df[reference_df['SKU'].isna() | (reference_df['SKU'] == '')]
print(f"Found {len(nan_sku_rows)} row(s) with null/empty SKU")
if len(nan_sku_rows) > 0:
    print("\nDetails:")
    for idx, row in nan_sku_rows.iterrows():
        print(f"  Invoice: {row['Invoice #']}, Desc: {row['Description']}, Customer: {row['Customer']}")
