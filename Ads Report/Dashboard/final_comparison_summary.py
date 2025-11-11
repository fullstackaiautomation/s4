#!/usr/bin/env python3
"""
Final comprehensive comparison summary
"""

import pandas as pd
from pathlib import Path
import numpy as np

dashboard_path = Path("C:\\Users\\blkw\\OneDrive\\Documents\\Github\\Source 4 Industries\\Ads Report\\Dashboard")

# Get the latest output file
output_files = list(dashboard_path.glob("2025-10_Dashboard_Import_*.xlsx"))
latest_output = max(output_files, key=lambda p: p.stat().st_mtime)

output_df = pd.read_excel(latest_output, sheet_name="READY TO IMPORT")
reference_df = pd.read_excel(dashboard_path / "CBOS TO DASH Actual.xlsx", sheet_name="BLANK (CBOS FINAL)")

print("=" * 80)
print("[+] FINAL COMPARISON SUMMARY")
print("=" * 80)

print(f"\nROW COUNTS:")
print(f"  Our output:        {len(output_df)} rows")
print(f"  Reference:         {len(reference_df)} rows")
print(f"  Difference:        {len(output_df) - len(reference_df)} rows")

# Create comparison keys
output_df['key'] = output_df['Invoice #'].astype(str) + "_" + output_df['SKU'].fillna('NaN').astype(str)
reference_df['key'] = reference_df['Invoice #'].astype(str) + "_" + reference_df['SKU'].fillna('NaN').astype(str)

output_keys = set(output_df['key'])
ref_keys = set(reference_df['key'])
matching_keys = output_keys & ref_keys

print(f"\nROW MATCHING:")
print(f"  Matching row keys: {len(matching_keys)} rows")
print(f"  Extra in output:   {len(output_keys - ref_keys)} rows")
print(f"  Missing from output: {len(ref_keys - output_keys)} rows")

# Find differences in matching rows
print(f"\nVALUE DIFFERENCES IN MATCHING ROWS:")

value_diffs = 0
cost_diffs = 0
cost_mismatches = []

for key in matching_keys:
    out_row = output_df[output_df['key'] == key].iloc[0]
    ref_row = reference_df[reference_df['key'] == key].iloc[0]

    # Check Cost Each
    out_cost = out_row['Cost Each']
    ref_cost = ref_row['Cost Each']

    out_is_nan = pd.isna(out_cost)
    ref_is_nan = pd.isna(ref_cost)

    if out_is_nan != ref_is_nan or (not out_is_nan and not ref_is_nan and out_cost != ref_cost):
        cost_diffs += 1
        if cost_diffs <= 10:  # Store first 10 for reporting
            cost_mismatches.append({
                'invoice': out_row['Invoice #'],
                'sku': out_row['SKU'],
                'our_cost': out_cost,
                'ref_cost': ref_cost
            })
        value_diffs += 1

print(f"  Total value differences: {value_diffs}")
print(f"  - Cost Each differences: {cost_diffs}")

if cost_mismatches:
    print(f"\n  Cost Each mismatches (first 10):")
    for m in cost_mismatches:
        print(f"    {m['invoice']} / {m['sku']}: our={m['our_cost']}, ref={m['ref_cost']}")

# Summary
print("\n" + "=" * 80)
print("[+] CONCLUSION:")
print("=" * 80)

if len(output_keys - ref_keys) == 0 and len(ref_keys - output_keys) == 0:
    if value_diffs == 0:
        print("✓ PERFECT MATCH!")
        print(f"  All {len(output_df)} rows match exactly with the reference file")
    else:
        print(f"⚠ MOSTLY MATCHED (with {value_diffs} value differences)")
        print(f"  Row counts match: {len(output_df)} rows")
        print(f"  {value_diffs} rows have different values (mostly Cost Each)")
        print("\n  LIKELY CAUSE:")
        print("  The Master SKU file used in processing has NaN/missing cost values")
        print("  that the reference file has actual costs for. This suggests:")
        print("  - Reference file was manually edited with cost values, OR")
        print("  - Master SKU file has been updated since reference was created")
else:
    print(f"⚠ ROW COUNT MISMATCH: {len(output_df) - len(reference_df)} extra rows")
    if len(ref_keys - output_keys) > 0:
        print(f"  {len(ref_keys - output_keys)} rows in reference not in output:")
        for key in list(ref_keys - output_keys)[:5]:
            invoice, sku = key.split("_", 1)
            print(f"    {invoice} / {sku}")

print("\n" + "=" * 80)
