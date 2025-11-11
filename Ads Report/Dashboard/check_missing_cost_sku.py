#!/usr/bin/env python3
"""
Check why Cost Each is NaN when it should have a value
"""

import pandas as pd
from pathlib import Path

dashboard_path = Path("C:\\Users\\blkw\\OneDrive\\Documents\\Github\\Source 4 Industries\\Ads Report\\Dashboard")

# Get latest output
output_files = list(dashboard_path.glob("2025-10_Dashboard_Import_*.xlsx"))
latest_output = max(output_files, key=lambda p: p.stat().st_mtime)

output_df = pd.read_excel(latest_output, sheet_name="READY TO IMPORT")
reference_df = pd.read_excel(dashboard_path / "CBOS TO DASH Actual.xlsx", sheet_name="BLANK (CBOS FINAL)")

# Check for #37380 / 508037010014 which should have cost 415.0
our_row = output_df[(output_df['Invoice #'] == '#37380') & (output_df['SKU'] == '508037010014')]
ref_row = reference_df[(reference_df['Invoice #'] == '#37380') & (reference_df['SKU'] == '508037010014')]

print("[+] Checking SKU 508037010014 / Invoice #37380")
if len(our_row) > 0:
    print("\nOUR OUTPUT:")
    r = our_row.iloc[0]
    print(f"  SKU: {r['SKU']}")
    print(f"  Description: {r['Description']}")
    print(f"  Cost Each: {r['Cost Each']}")
    print(f"  Vendor: {r['Vendor']}")

if len(ref_row) > 0:
    print("\nREFERENCE:")
    r = ref_row.iloc[0]
    print(f"  SKU: {r['SKU']}")
    print(f"  Description: {r['Description']}")
    print(f"  Cost Each: {r['Cost Each']}")
    print(f"  Vendor: {r['Vendor']}")

# Check if this SKU exists in Master SKU
master_sku_file = dashboard_path / "Ads Report/SKU Documents/Google Ads - Product Spend - MASTER SKU (1).csv"
if master_sku_file.exists():
    master_df = pd.read_csv(master_sku_file)
    # Search for the SKU
    found = master_df[master_df['SKU'].astype(str).str.contains('508037010014', na=False)]
    print(f"\n[+] Master SKU file search for '508037010014':")
    if len(found) > 0:
        for idx, row in found.iterrows():
            print(f"    SKU: {row['SKU']}")
            print(f"    COST: {row.get('COST', 'N/A')}")
    else:
        print("    NOT FOUND")
