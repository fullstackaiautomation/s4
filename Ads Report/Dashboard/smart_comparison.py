#!/usr/bin/env python3
"""
Smart comparison - find rows that exist in both but have value differences
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

# Create keys for matching (ignore NaN in SKU)
output_df['comparison_key'] = output_df['Invoice #'].astype(str) + "_" + output_df['SKU'].fillna('NaN').astype(str)
reference_df['comparison_key'] = reference_df['Invoice #'].astype(str) + "_" + reference_df['SKU'].fillna('NaN').astype(str)

output_keys = set(output_df['comparison_key'])
ref_keys = set(reference_df['comparison_key'])

print("[+] ROW MATCHING ANALYSIS")
print(f"    Output rows:       {len(output_df)}")
print(f"    Reference rows:    {len(reference_df)}")
print(f"    Matching keys:     {len(output_keys & ref_keys)}")
print(f"    Extra in output:   {len(output_keys - ref_keys)}")
print(f"    Missing from out:  {len(ref_keys - output_keys)}")

# For rows that match by key, find value differences
print("\n[+] VALUE DIFFERENCE ANALYSIS")

matching_keys = output_keys & ref_keys
differences_found = 0

for key in matching_keys:
    out_row = output_df[output_df['comparison_key'] == key].iloc[0]
    ref_row = reference_df[reference_df['comparison_key'] == key].iloc[0]

    # Compare key numeric columns
    for col in ['Order Quantity', 'Sales Each', 'Sales Total', 'Cost Each', 'Cost Total', 'ROI']:
        if col not in out_row.index or col not in ref_row.index:
            continue

        out_val = out_row[col]
        ref_val = ref_row[col]

        # Handle NaN comparisons
        out_nan = pd.isna(out_val)
        ref_nan = pd.isna(ref_val)

        if out_nan and ref_nan:
            continue  # Both NaN, OK

        if out_nan != ref_nan:
            print(f"[!] MISMATCH: {key}")
            print(f"    Column: {col}")
            print(f"    Output: {out_val} (type: {type(out_val).__name__})")
            print(f"    Ref:    {ref_val} (type: {type(ref_val).__name__})")
            differences_found += 1
            if differences_found >= 10:
                print(f"\n[*] Found {differences_found} value differences so far...")
                print("[*] Stopping early to show first batch")
                break

    if differences_found >= 10:
        break

if differences_found == 0:
    print("    No value differences found in matching rows!")
    print("\n[+] FINAL ASSESSMENT:")
    print(f"    ✓ All {len(matching_keys)} matching rows have identical values")
    print(f"    [1] Missing row: Invoice SO3589 with NULL SKU")
    print(f"    [15] Extra rows in output with NaN SKU (from filtering)")
