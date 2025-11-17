#!/usr/bin/env python3
"""
Sync All Time Sales Data to Supabase
Compares CSV file with existing Supabase data and uploads only missing records
"""

import os
import sys
import pandas as pd
from supabase import create_client, Client
from dotenv import load_dotenv
import time
from datetime import datetime

# Load environment variables from parent directory
parent_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
env_path = os.path.join(parent_dir, '.env')
load_dotenv(env_path)

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_KEY')

if not SUPABASE_URL or not SUPABASE_KEY:
    print("ERROR: SUPABASE_URL and SUPABASE_KEY not found in .env")
    print(f"Tried loading from: {env_path}")
    sys.exit(1)

# Initialize Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def get_existing_invoice_numbers():
    """Fetch all existing invoice numbers from Supabase"""
    print("\nFetching existing invoice numbers from Supabase...")

    all_invoices = set()
    page_size = 1000
    offset = 0

    while True:
        try:
            response = supabase.table('all_time_sales')\
                .select('invoice_number')\
                .range(offset, offset + page_size - 1)\
                .execute()

            if not response.data:
                break

            for record in response.data:
                if record.get('invoice_number'):
                    all_invoices.add(record['invoice_number'])

            print(f"  Loaded {len(all_invoices)} unique invoices so far...")

            if len(response.data) < page_size:
                break

            offset += page_size

        except Exception as e:
            print(f"ERROR fetching existing data: {str(e)}")
            return set()

    print(f"Found {len(all_invoices)} unique invoice numbers in database")
    return all_invoices

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
        df['date'] = pd.to_datetime(df['date'], errors='coerce').dt.strftime('%Y-%m-%dT%H:%M:%S')

    # Helper function to clean currency strings
    def clean_currency(value):
        if pd.isna(value) or value is None:
            return None
        if isinstance(value, str):
            # Remove $, commas, quotes
            value = value.replace('$', '').replace(',', '').replace('"', '').strip()
            if value == '' or value == '#N/A':
                return None
        try:
            return float(value)
        except:
            return None

    # Clean currency and numeric columns
    currency_columns = ['sales_each', 'sales_total', 'cost_each', 'cost_total',
                       'shipping', 'discount', 'refunds', 'invoice_total', 'profit_total', 'ad_spend']

    for col in currency_columns:
        if col in df.columns:
            df[col] = df[col].apply(clean_currency)

    # Clean other numeric columns
    for col in ['order_quantity', 'orders', 'route']:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors='coerce')

    # Clean ROI (remove %) and cap at database limit
    if 'roi' in df.columns:
        def clean_roi(x):
            if pd.isna(x):
                return None
            value = clean_currency(str(x).replace('%', ''))
            # Cap ROI to fit numeric(8,4) - max value is 9999.9999
            if value is not None and abs(value) >= 10000:
                return None  # Set extreme values to None
            return value
        df['roi'] = df['roi'].apply(clean_roi)

    # Convert year to integer
    df['year'] = pd.to_numeric(df['year'], errors='coerce').astype('Int64')

    # Final cleanup: replace all remaining NaN/None values with None for JSON serialization
    df = df.replace({pd.NA: None, pd.NaT: None})
    df = df.where(pd.notna(df), None)

    # Handle required SKU field - provide default for null values
    if 'sku' in df.columns:
        df['sku'] = df['sku'].fillna('N/A')

    return df

def upload_to_supabase(df, batch_size=500):
    """Upload data to Supabase in batches"""
    import math

    total_records = len(df)
    successful = 0
    failed = 0

    print(f"\nStarting upload of {total_records} new records...")
    print(f"Batch size: {batch_size}")

    # Process in batches
    for i in range(0, total_records, batch_size):
        batch = df.iloc[i:i+batch_size]
        batch_num = (i // batch_size) + 1
        total_batches = (total_records + batch_size - 1) // batch_size

        # Convert batch to list of dictionaries and clean NaN values
        records = batch.to_dict('records')

        # Clean NaN/infinity values from each record
        cleaned_records = []
        for record in records:
            cleaned_record = {}
            for key, value in record.items():
                # Check for NaN or infinity
                if isinstance(value, float) and (math.isnan(value) or math.isinf(value)):
                    cleaned_record[key] = None
                else:
                    cleaned_record[key] = value
            cleaned_records.append(cleaned_record)

        try:
            # Insert batch
            response = supabase.table('all_time_sales').insert(cleaned_records).execute()
            successful += len(cleaned_records)
            print(f"[{batch_num}/{total_batches}] Uploaded {len(cleaned_records)} records (Total: {successful}/{total_records})")

        except Exception as e:
            failed += len(cleaned_records)
            print(f"[{batch_num}/{total_batches}] ERROR: {str(e)}")
            print(f"Failed records in this batch: {len(cleaned_records)}")

        # Rate limiting
        time.sleep(0.5)

    return successful, failed

def main():
    print("=" * 80)
    print("All Time Sales Data Sync to Supabase")
    print("=" * 80)

    csv_file = r"C:\Users\blkw\OneDrive\Documents\Github\Source 4 Industries\Reporting\All Time Sales Files\ALL TIME SALES DATABASE - Sheet1.csv"

    if not os.path.exists(csv_file):
        print(f"ERROR: CSV file not found: {csv_file}")
        sys.exit(1)

    # Read CSV
    print(f"\nReading CSV file: {csv_file}")
    df = pd.read_csv(csv_file)
    print(f"Loaded {len(df)} records from CSV")

    # Get existing invoice numbers from Supabase
    existing_invoices = get_existing_invoice_numbers()

    # Filter for new records only
    print("\nFiltering for new records...")
    original_count = len(df)
    df_new = df[~df['Invoice #'].isin(existing_invoices)].copy()
    new_count = len(df_new)

    print(f"  Total records in CSV: {original_count}")
    print(f"  Already in database: {original_count - new_count}")
    print(f"  New records to import: {new_count}")

    if new_count == 0:
        print("\n[SUCCESS] Database is already up to date! No new records to import.")
        return

    # Prepare data
    print("\nPreparing new data for upload...")
    df_new = prepare_data(df_new)

    # Upload to Supabase
    successful, failed = upload_to_supabase(df_new)

    # Summary
    print("\n" + "=" * 80)
    print("SYNC SUMMARY")
    print("=" * 80)
    print(f"CSV records: {original_count}")
    print(f"Already in database: {original_count - new_count}")
    print(f"New records identified: {new_count}")
    print(f"Successfully uploaded: {successful}")
    print(f"Failed: {failed}")
    if new_count > 0:
        print(f"Success rate: {(successful/new_count*100):.1f}%")
    print(f"Completed at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

    if failed == 0:
        print("\n[SUCCESS] All new records uploaded successfully!")
    else:
        print(f"\n[WARNING] {failed} records failed to upload")

if __name__ == "__main__":
    main()
