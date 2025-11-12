#!/usr/bin/env python3
"""
Full comparison to find ALL differences
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

print(f"[+] Output rows: {len(output_df)}")
print(f"[+] Reference rows: {len(reference_df)}")

# Try different comparison keys
print("\n[*] Testing comparison with Invoice # + SKU:")
output_df['key1'] = output_df['Invoice #'].astype(str) + "_" + output_df['SKU'].astype(str)
reference_df['key1'] = reference_df['Invoice #'].astype(str) + "_" + reference_df['SKU'].astype(str)

output_keys1 = set(output_df['key1'])
ref_keys1 = set(reference_df['key1'])

extra1 = output_keys1 - ref_keys1
missing1 = ref_keys1 - output_keys1

print(f"    Extra in output: {len(extra1)}")
print(f"    Missing from output: {len(missing1)}")

# Try comparison with all key columns
print("\n[*] Testing comparison with Invoice # + SKU + Qty + Sales Each:")
output_df['key2'] = (output_df['Invoice #'].astype(str) + "_" +
                     output_df['SKU'].astype(str) + "_" +
                     output_df['Order Quantity'].astype(str) + "_" +
                     output_df['Sales Each'].astype(str))

reference_df['key2'] = (reference_df['Invoice #'].astype(str) + "_" +
                        reference_df['SKU'].astype(str) + "_" +
                        reference_df['Order Quantity'].astype(str) + "_" +
                        reference_df['Sales Each'].astype(str))

output_keys2 = set(output_df['key2'])
ref_keys2 = set(reference_df['key2'])

extra2 = output_keys2 - ref_keys2
missing2 = ref_keys2 - output_keys2

print(f"    Extra in output: {len(extra2)}")
print(f"    Missing from output: {len(missing2)}")

if extra2:
    print("\n[*] First 5 extra rows in output:")
    for key in list(extra2)[:5]:
        parts = key.split("_")
        invoice = parts[0]
        matching = output_df[output_df['key2'] == key].iloc[0]
        print(f"    Invoice {invoice}: {matching['SKU']} | Qty {matching['Order Quantity']} | Price {matching['Sales Each']}")

if missing2:
    print("\n[*] First 5 missing rows from output:")
    for key in list(missing2)[:5]:
        parts = key.split("_")
        invoice = parts[0]
        matching = reference_df[reference_df['key2'] == key].iloc[0]
        print(f"    Invoice {invoice}: {matching['SKU']} | Qty {matching['Order Quantity']} | Price {matching['Sales Each']}")
