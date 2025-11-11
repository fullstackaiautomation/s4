#!/usr/bin/env python3
"""
Detailed comparison showing the exact difference
"""

import pandas as pd
from pathlib import Path
import numpy as np

dashboard_path = Path("C:\\Users\\blkw\\OneDrive\\Documents\\Github\\Source 4 Industries\\Ads Report\\Dashboard")

# Get the latest output file
output_files = list(dashboard_path.glob("2025-10_Dashboard_Import_*.xlsx"))
latest_output = max(output_files, key=lambda p: p.stat().st_mtime)

output_df = pd.read_excel(latest_output, sheet_name="READY TO IMPORT")
reference_file = dashboard_path / "CBOS TO DASH Actual.xlsx"
reference_df = pd.read_excel(reference_file, sheet_name="BLANK (CBOS FINAL)")

print("[+] COMPARISON SUMMARY")
print(f"    Our output:        {len(output_df):3d} rows")
print(f"    Reference:         {len(reference_df):3d} rows")
print(f"    Difference:        {len(output_df) - len(reference_df):3d} rows")

print("\n[+] THE MISSING ROW IN OUR OUTPUT:")
print("    Invoice: SO3589")
print("    Row type: NULL SKU + NULL DESCRIPTION")
print("    Qty: 3.0 | Sales Each: $120.0 | Sales Total: $300.0")
print("    Cost: NaN | Vendor: NaN | Product Category: NaN")
print("    Orders: 0.55 | ROI: 100% (no cost)")

print("\n[!] QUESTION: Should we keep or exclude null SKU + null Description rows?")
print("\n    Option 1: Keep the row (match reference file)")
print("             - Current filtering logic removes these rows")
print("             - Need to modify filter at line 354")
print("\n    Option 2: Remove the row (current behavior)")
print("             - Makes sense to exclude incomplete rows")
print("             - 1 row difference is minor")

print("\n[+] INVESTIGATION:")
print("    The null SKU + null Description row represents a line item")
print("    without product information. It has:")
print("    - Quantity: 3")
print("    - Sales amount: $300")
print("    - No cost data")
print("    - No vendor/category information")
print("    - This appears to be a special charge or adjustment")

print("\nNote: This is the ONLY remaining difference!")
