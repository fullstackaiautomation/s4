#!/usr/bin/env python3
"""
Compare processor output with reference file to verify SKU fix
"""

import pandas as pd
from pathlib import Path

# Read the latest processor output
dashboard_path = Path("C:\\Users\\blkw\\OneDrive\\Documents\\Github\\Source 4 Industries\\Ads Report\\Dashboard")

# Get the latest output file (should be 2025-10_Dashboard_Import_*.xlsx)
output_files = list(dashboard_path.glob("2025-10_Dashboard_Import_*.xlsx"))
if not output_files:
    print("[-] No output files found!")
    exit(1)

latest_output = max(output_files, key=lambda p: p.stat().st_mtime)
print(f"[+] Using output file: {latest_output.name}")

# Read the reference file
reference_file = dashboard_path / "CBOS TO DASH Actual.xlsx"
if not reference_file.exists():
    print(f"[-] Reference file not found: {reference_file}")
    exit(1)

print(f"[+] Using reference file: {reference_file.name}")

# Load both files
print("\n[*] Loading files...")
output_df = pd.read_excel(latest_output, sheet_name="READY TO IMPORT")
reference_df = pd.read_excel(reference_file, sheet_name="BLANK (CBOS FINAL)")

print(f"    Output rows: {len(output_df)}")
print(f"    Reference rows: {len(reference_df)}")

# Create comparison key: Invoice # + SKU
output_df['comparison_key'] = output_df['Invoice #'].astype(str) + "_" + output_df['SKU'].astype(str)
reference_df['comparison_key'] = reference_df['Invoice #'].astype(str) + "_" + reference_df['SKU'].astype(str)

print("\n[*] Analyzing differences...")

output_keys = set(output_df['comparison_key'].unique())
reference_keys = set(reference_df['comparison_key'].unique())

extra_in_output = output_keys - reference_keys
missing_from_output = reference_keys - output_keys

print(f"\n[+] RESULTS:")
print(f"    Rows in output but not in reference: {len(extra_in_output)}")
print(f"    Rows in reference but not in output: {len(missing_from_output)}")
print(f"    Rows matching: {len(output_keys & reference_keys)}")

if len(extra_in_output) == 0 and len(missing_from_output) == 0:
    print("\n✓ PERFECT MATCH! All rows match between output and reference.")
    print(f"  Total rows verified: {len(output_df)}")
else:
    print(f"\n[!] There are still {len(extra_in_output) + len(missing_from_output)} rows with differences")

    if extra_in_output and len(extra_in_output) <= 20:
        print("\nExtra in output (first 20):")
        for key in list(extra_in_output)[:20]:
            invoice, sku = key.split("_", 1)
            row = output_df[output_df['comparison_key'] == key].iloc[0]
            print(f"  Invoice #{invoice}, SKU: {sku}")

    if missing_from_output and len(missing_from_output) <= 20:
        print("\nMissing from output (first 20):")
        for key in list(missing_from_output)[:20]:
            invoice, sku = key.split("_", 1)
            row = reference_df[reference_df['comparison_key'] == key].iloc[0]
            print(f"  Invoice #{invoice}, SKU: {sku}")

print("\n[*] Done!")
