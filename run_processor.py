#!/usr/bin/env python3
"""
Run Ad Spend Processor on monthly data files
Handles Google Ads (CSV) and Bing Ads (Excel) with automatic encoding detection
"""

import pandas as pd
import os
import sys
from datetime import datetime
from categorize_vendors_final import (
    categorize_blanks_for_review,
    find_blank_categories,
    assign_vendor_from_sku_or_title
)

def load_google_ads(filepath):
    """Load Google Ads CSV with proper encoding handling"""
    print(f"Loading Google Ads: {os.path.basename(filepath)}")

    # Try different encodings and separators
    configs = [
        ('utf-16-le', '\t'),
        ('utf-16', '\t'),
        ('utf-16', ','),
        ('utf-8-sig', ','),
        ('latin1', ','),
    ]

    for encoding, sep in configs:
        try:
            df = pd.read_csv(filepath, encoding=encoding, sep=sep, on_bad_lines='skip')
            if len(df.columns) > 5:  # Valid load should have many columns
                print(f"  Loaded with {encoding} encoding and '{sep}' separator")
                return df
        except:
            continue

    raise ValueError(f"Could not load file with any encoding: {filepath}")

def load_bing_ads(filepath):
    """Load Bing Ads Excel file"""
    print(f"Loading Bing Ads: {os.path.basename(filepath)}")

    # Read the Excel file, skipping the header mess
    df = pd.read_excel(filepath, header=None)

    # Find where the actual header row starts
    # Usually Bing exports have a few rows of metadata before headers
    header_row = 0
    for i, row in df.iterrows():
        row_str = ' '.join(str(x) for x in row.values if pd.notna(x))
        if 'Impressions' in row_str or 'Report' not in row_str:
            header_row = i
            break

    # Reload with proper header
    df = pd.read_excel(filepath, header=header_row)
    print(f"  Loaded with header at row {header_row}")
    return df

def standardize_columns(df_google, df_bing):
    """Standardize column names across both sources"""

    # Define mapping
    column_mapping = {
        'Title': ['Title', 'Product title', 'Product Title'],
        'Custom label 1': ['Custom label 1', 'Custom Label 1', 'SKU'],
        'Item ID': ['Item ID', 'Item Id', 'Merchant ID'],
        'Brand': ['Brand', 'Brand', 'Brand'],
        'Price': ['Price', 'Price'],
        'Cost': ['Cost', 'Spend'],
        'Impr.': ['Impr.', 'Impressions', 'Impressions'],
        'Clicks': ['Clicks'],
        'CTR': ['CTR', 'Ctr'],
        'Avg. CPC': ['Avg. CPC', 'Avg Cpc'],
        'Conversions': ['Conversions'],
        'Conv. value': ['Conv. value', 'Conv value', 'Revenue'],
        'Search impr. share': ['Search impr. share', 'Search Impr Share'],
        'Search lost IS (rank)': ['Search lost IS (rank)', 'Search Lost IS Rank'],
        'Search abs. top IS': ['Search abs. top IS', 'Search Abs Top IS'],
    }

    print("Standardizing columns...")

    # Process Google Ads
    print("  Google Ads columns:", list(df_google.columns)[:5])

    # Process Bing Ads
    print("  Bing Ads columns:", list(df_bing.columns)[:5])

    return df_google, df_bing

def main():
    """Main processing workflow"""

    data_dir = r"Ads Report\Monthly Product Ad Spends"

    # Find data files
    google_files = [f for f in os.listdir(data_dir) if 'google' in f.lower() and f.endswith('.csv')]
    bing_files = [f for f in os.listdir(data_dir) if 'bing' in f.lower() and f.endswith('.xlsx')]

    if not google_files:
        print("ERROR: No Google Ads CSV found")
        return
    if not bing_files:
        print("ERROR: No Bing Ads Excel found")
        return

    google_path = os.path.join(data_dir, google_files[0])
    bing_path = os.path.join(data_dir, bing_files[0])

    print("=" * 80)
    print("AD SPEND PROCESSOR - MONTHLY DATA RUN")
    print("=" * 80)
    print()

    # Load files
    df_google = load_google_ads(google_path)
    df_bing = load_bing_ads(bing_path)

    print(f"\nGoogle Ads: {len(df_google)} rows, {len(df_google.columns)} columns")
    print(f"Bing Ads: {len(df_bing)} rows, {len(df_bing.columns)} columns")

    # Standardize columns
    df_google, df_bing = standardize_columns(df_google, df_bing)

    print("\n" + "=" * 80)
    print("Data loaded successfully!")
    print("Next steps: Combine, categorize, and generate outputs")
    print("=" * 80)

if __name__ == "__main__":
    main()
