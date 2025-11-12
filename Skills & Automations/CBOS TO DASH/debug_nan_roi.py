#!/usr/bin/env python3
"""
Debug why ROI is NaN when it shouldn't be
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

# Look at one of the problematic rows
print("[+] Examining row: #37355 / SKU 544-31996-1")
out = output_df[(output_df['Invoice #'] == '#37355') & (output_df['SKU'] == '544-31996-1')]
ref = reference_df[(reference_df['Invoice #'] == '#37355') & (reference_df['SKU'] == '544-31996-1')]

print("\nOUR OUTPUT:")
if len(out) > 0:
    row = out.iloc[0]
    print(f"  Sales Total:   {row['Sales Total']}")
    print(f"  Cost Each:     {row['Cost Each']}")
    print(f"  Cost Total:    {row['Cost Total']}")
    print(f"  Shipping:      {row['Shipping']}")
    print(f"  Discount:      {row['Discount']}")
    print(f"  Invoice Total: {row['Invoice Total']}")
    print(f"  Profit Total:  {row['Profit Total']}")
    print(f"  ROI:           {row['ROI']}")

    # Manually calculate ROI
    profit = row['Profit Total']
    invoice = row['Invoice Total']
    calc_roi = profit / (invoice + 0.0001) if not pd.isna(invoice) else np.nan
    print(f"  Calculated ROI: {calc_roi}")

print("\nREFERENCE:")
if len(ref) > 0:
    row = ref.iloc[0]
    print(f"  Sales Total:   {row['Sales Total']}")
    print(f"  Cost Each:     {row['Cost Each']}")
    print(f"  Cost Total:    {row['Cost Total']}")
    print(f"  Shipping:      {row['Shipping']}")
    print(f"  Discount:      {row['Discount']}")
    print(f"  Invoice Total: {row['Invoice Total']}")
    print(f"  Profit Total:  {row['Profit Total']}")
    print(f"  ROI:           {row['ROI']}")

print("\n" + "="*60)
print("[+] Examining row: SO3543 / SKU MRLOCK")
out = output_df[(output_df['Invoice #'] == 'SO3543') & (output_df['SKU'] == 'MRLOCK')]
ref = reference_df[(reference_df['Invoice #'] == 'SO3543') & (reference_df['SKU'] == 'MRLOCK')]

print("\nOUR OUTPUT:")
if len(out) > 0:
    row = out.iloc[0]
    print(f"  Sales Total:   {row['Sales Total']}")
    print(f"  Cost Each:     {row['Cost Each']}")
    print(f"  Cost Total:    {row['Cost Total']}")
    print(f"  Invoice Total: {row['Invoice Total']}")
    print(f"  Profit Total:  {row['Profit Total']}")
    print(f"  ROI:           {row['ROI']}")
    print(f"  Types: Cost={type(row['Cost Each']).__name__}, Profit={type(row['Profit Total']).__name__}")
else:
    print("  NOT FOUND")

print("\nREFERENCE:")
if len(ref) > 0:
    row = ref.iloc[0]
    print(f"  Sales Total:   {row['Sales Total']}")
    print(f"  Cost Each:     {row['Cost Each']}")
    print(f"  Cost Total:    {row['Cost Total']}")
    print(f"  Invoice Total: {row['Invoice Total']}")
    print(f"  Profit Total:  {row['Profit Total']}")
    print(f"  ROI:           {row['ROI']}")
