#!/usr/bin/env python3
"""
Import All Time Sales Data to Supabase
Reads CSV file and uploads to all_time_sales table
"""

import os
import sys
import pandas as pd
from supabase import create_client, Client
from dotenv import load_dotenv
import time
from datetime import datetime

# Load environment variables
load_dotenv()

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_KEY')

if not SUPABASE_URL or not SUPABASE_KEY:
    print("ERROR: SUPABASE_URL and SUPABASE_KEY not found in .env")
    sys.exit(1)

# Initialize Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def prepare_data(df):
    """Prepare dataframe for database insertion"""
    # Rename columns to match database schema
    column_mapping = {
        'Customer': 'customer',
        'Rep': 'rep',
        'Online / Local': 'online_local',
        'Month': 'month',
        'Date': 'date',
        'Invoice #': 'invoice_number',
        'SKU': 'sku',
        'Description': 'description',
        'Order Quantity': 'order_quantity',
        'Sales Each': 'sales_each',
        'Sales Total': 'sales_total',
        'Cost Each': 'cost_each',
        'Cost Total': 'cost_total',
        'Vendor': 'vendor',
        'Orders': 'orders',
        'Shipping': 'shipping',
        'Discount': 'discount',
        'Refunds': 'refunds',
        'Invoice Total': 'invoice_total',
        'Profit Total': 'profit_total',
        'ROI': 'roi',
        'Ad Spend': 'ad_spend',
        'Product Category': 'product_category',
        'Overall Product Category': 'overall_product_category',
        'Year': 'year',
        'Tracked Month': 'tracked_month',
        'State': 'state',
        'Region': 'region',
        'User Email': 'user_email',
        'Shipping Method': 'shipping_method',
        'Route': 'route'
    }

    df = df.rename(columns=column_mapping)

    # Convert NaN to None for database
    df = df.where(pd.notna(df), None)

    # Convert date column to ISO format
    if 'date' in df.columns:
        df['date'] = pd.to_datetime(df['date']).dt.strftime('%Y-%m-%dT%H:%M:%S')

    # Convert boolean and numeric types
    for col in ['order_quantity', 'sales_each', 'sales_total', 'cost_each', 'cost_total',
                'orders', 'shipping', 'discount', 'refunds', 'invoice_total', 'profit_total',
                'roi', 'ad_spend', 'route']:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors='coerce')

    df['year'] = pd.to_numeric(df['year'], errors='coerce').astype('Int64')

    return df

def upload_to_supabase(df, batch_size=1000):
    """Upload data to Supabase in batches"""
    total_records = len(df)
    successful = 0
    failed = 0

    print(f"\nStarting upload of {total_records} records...")
    print(f"Batch size: {batch_size}")

    # Process in batches
    for i in range(0, total_records, batch_size):
        batch = df.iloc[i:i+batch_size]
        batch_num = (i // batch_size) + 1
        total_batches = (total_records + batch_size - 1) // batch_size

        # Convert batch to list of dictionaries
        records = batch.to_dict('records')

        try:
            # Insert batch
            response = supabase.table('all_time_sales').insert(records).execute()
            successful += len(records)
            print(f"[{batch_num}/{total_batches}] Uploaded {len(records)} records (Total: {successful}/{total_records})")

        except Exception as e:
            failed += len(records)
            print(f"[{batch_num}/{total_batches}] ERROR: {str(e)}")
            print(f"Failed records in this batch: {len(records)}")

        # Rate limiting
        time.sleep(0.5)

    return successful, failed

def main():
    print("=" * 60)
    print("All Time Sales Data Import to Supabase")
    print("=" * 60)

    csv_file = r"c:\Users\blkw\OneDrive\Documents\Github\Source 4 Industries\all_time_sales_data.csv"

    if not os.path.exists(csv_file):
        print(f"ERROR: CSV file not found: {csv_file}")
        sys.exit(1)

    # Read CSV
    print(f"\nReading CSV file: {csv_file}")
    df = pd.read_csv(csv_file)
    print(f"Loaded {len(df)} records")

    # Prepare data
    print("\nPreparing data for upload...")
    df = prepare_data(df)

    # Upload to Supabase
    successful, failed = upload_to_supabase(df)

    # Summary
    print("\n" + "=" * 60)
    print("IMPORT SUMMARY")
    print("=" * 60)
    print(f"Total records: {len(df)}")
    print(f"Successfully uploaded: {successful}")
    print(f"Failed: {failed}")
    print(f"Success rate: {(successful/len(df)*100):.1f}%")
    print(f"Completed at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

    if failed == 0:
        print("\n✓ All records uploaded successfully!")
    else:
        print(f"\n⚠ {failed} records failed to upload")

if __name__ == "__main__":
    main()
