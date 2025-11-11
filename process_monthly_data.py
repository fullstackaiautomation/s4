#!/usr/bin/env python3
"""
Ad Spend Processor - Monthly Data Processing
Processes Google Ads and Bing Ads exports with user approval workflow
"""

import pandas as pd
import os
import re
from datetime import datetime
from categorize_vendors_final import categorize_blanks_for_review, find_blank_categories

def detect_month_from_files(data_dir):
    """Extract month from file names or metadata"""
    # Check Bing file for date range
    bing_files = [f for f in os.listdir(data_dir) if 'bing' in f.lower()]
    if bing_files:
        bing_path = os.path.join(data_dir, bing_files[0])
        try:
            df = pd.read_excel(bing_path, header=None)
            # Row 1 usually has date range like "10/1/2025,10/31/2025"
            if len(df) > 1:
                date_str = str(df.iloc[1, 0])
                match = re.search(r'(\d+)/(\d+)/(\d+)', date_str)
                if match:
                    month, _, year = match.groups()
                    return f"{year}-{month.zfill(2)}"
        except:
            pass

    return datetime.now().strftime("%Y-%m")

def load_google_ads(filepath):
    """Load Google Ads CSV with proper encoding"""
    print(f"  Loading Google Ads CSV...")

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
            if len(df.columns) > 5:
                print(f"    Loaded: {len(df)} rows, {len(df.columns)} columns")
                df['Platform'] = 'Google Ads'
                return df
        except Exception as e:
            continue

    raise ValueError(f"Could not load Google Ads file: {filepath}")

def load_bing_ads(filepath):
    """Load Bing Ads Excel file"""
    print(f"  Loading Bing Ads Excel...")

    df = pd.read_excel(filepath, header=None)

    # Find actual header row (skip metadata)
    header_row = 0
    for i, row in df.iterrows():
        row_str = ' '.join(str(x) for x in row.values if pd.notna(x))
        if any(col in row_str for col in ['Impressions', 'Clicks', 'Spend', 'Product']):
            header_row = i
            break

    df = pd.read_excel(filepath, header=header_row)
    print(f"    Loaded: {len(df)} rows, {len(df.columns)} columns")
    df['Platform'] = 'Bing Ads'
    return df

def combine_data(df_google, df_bing):
    """Combine Google and Bing data with standardized columns"""
    print("\n  Combining data sources...")

    # Define standard column mappings
    google_mapping = {
        'Title': 'Title',
        'Custom label 1': 'SKU',
        'Item ID': 'Item_ID',
        'Brand': 'Vendor',
        'Price': 'Price',
        'Cost': 'Ad Spend',
        'Impr.': 'Impressions',
        'Clicks': 'Clicks',
        'CTR': 'CTR',
        'Avg. CPC': 'Avg. CPC',
        'Conversions': 'Conversions',
        'Conv. value': 'Revenue',
        'Search impr. share': 'Impression share',
        'Search lost IS (rank)': 'Impression share lost to rank',
        'Search abs. top IS': 'Absolute top impression share',
    }

    bing_mapping = {
        'Product title': 'Title',
        'Custom label 1': 'SKU',
        'Merchant product id': 'Item_ID',
        'Brand': 'Vendor',
        'Price': 'Price',
        'Spend': 'Ad Spend',
        'Impressions': 'Impressions',
        'Clicks': 'Clicks',
        'Ctr': 'CTR',
        'Avg. cpc': 'Avg. CPC',
        'Conversions': 'Conversions',
        'Revenue': 'Revenue',
        'Impression share': 'Impression share',
    }

    # Rename Google columns
    df_g = df_google.rename(columns=google_mapping)
    df_g = df_g[['Platform', 'Title', 'SKU', 'Item_ID', 'Vendor', 'Price', 'Ad Spend',
                   'Impressions', 'Clicks', 'CTR', 'Avg. CPC', 'Conversions', 'Revenue',
                   'Impression share', 'Impression share lost to rank', 'Absolute top impression share']]

    # Rename Bing columns
    df_b = df_bing.rename(columns=bing_mapping)
    available_cols = [col for col in ['Platform', 'Title', 'SKU', 'Item_ID', 'Vendor',
                                       'Price', 'Ad Spend', 'Impressions', 'Clicks', 'CTR',
                                       'Avg. CPC', 'Conversions', 'Revenue', 'Impression share']
                      if col in df_b.columns]
    df_b = df_b[available_cols]

    # Combine
    combined = pd.concat([df_g, df_b], ignore_index=True, sort=False)
    print(f"    Combined: {len(combined)} total rows")

    return combined

def process_monthly_data(data_dir):
    """Main processing workflow"""

    print("=" * 80)
    print("AD SPEND PROCESSOR - MONTHLY DATA PROCESSING")
    print("=" * 80)

    # Detect month
    month = detect_month_from_files(data_dir)
    print(f"\nProcessing Month: {month}")

    # Find files
    google_files = [f for f in os.listdir(data_dir) if 'google' in f.lower() and f.endswith('.csv')]
    bing_files = [f for f in os.listdir(data_dir) if 'bing' in f.lower() and f.endswith('.xlsx')]

    if not google_files or not bing_files:
        print("ERROR: Missing Google Ads CSV or Bing Ads Excel file")
        return

    google_path = os.path.join(data_dir, google_files[0])
    bing_path = os.path.join(data_dir, bing_files[0])

    print("\nLoading files:")
    df_google = load_google_ads(google_path)
    df_bing = load_bing_ads(bing_path)

    print("\nProcessing:")
    combined = combine_data(df_google, df_bing)

    # Add Product Category column if it doesn't exist
    if 'Product Category' not in combined.columns:
        combined['Product Category'] = ''

    # Find items needing categorization
    items_blank = find_blank_categories(combined)
    print(f"\n  Items needing categories: {len(items_blank)}")

    if len(items_blank) > 0:
        # Generate suggestions
        suggestions = categorize_blanks_for_review(items_blank)
        print(f"    • With suggestions: {len(suggestions)}")

        # Save suggestions file
        output_dir = os.path.dirname(data_dir)
        suggestions_file = os.path.join(output_dir, f"{month} Product Category Suggestions.csv")

        # Select columns for export
        export_cols = ['SKU', 'Product Name', 'Vendor', 'Platform', 'Price', 'Ad Spend',
                       'Impressions', 'Clicks', 'CTR', 'Avg. CPC', 'Conversions',
                       'Revenue', 'Impression share', 'Impression share lost to rank',
                       'Absolute top impression share', 'Suggested Category', 'Confidence %']

        available_cols = [col for col in export_cols if col in suggestions.columns]
        suggestions[available_cols].to_csv(suggestions_file, index=False)
        print(f"\n  Suggestions saved: {suggestions_file}")

        # Save upload sheet (only items with 100% MASTER SKU matches - none yet since they're blank)
        upload_file = os.path.join(output_dir, f"{month} Product Spend Upload.csv")
        combined.to_csv(upload_file, index=False)
        print(f"  Upload sheet saved: {upload_file}")

    print("\n" + "=" * 80)
    print("Processing Complete!")
    print("=" * 80)
    print(f"\nYour suggestions are ready for review in the suggestions file.")
    print(f"Next step: Approve categories and update MASTER SKU")

if __name__ == "__main__":
    # Use absolute path
    data_dir = r"c:\Users\blkw\OneDrive\Documents\Github\Source 4 Industries\Ads Report\Monthly Product Ad Spends"
    process_monthly_data(data_dir)
