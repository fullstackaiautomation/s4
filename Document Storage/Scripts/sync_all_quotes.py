#!/usr/bin/env python3
"""
Sync All Quotes Data to Supabase
Compares CSV file with existing Supabase data and uploads only missing records
Uses task_id as unique identifier to prevent duplicates
"""

import os
import sys
import pandas as pd
from supabase import create_client, Client
from dotenv import load_dotenv
import time
from datetime import datetime
import math

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

def get_existing_task_ids():
    """Fetch all existing task IDs from Supabase"""
    print("\nFetching existing task IDs from Supabase...")

    all_tasks = set()
    page_size = 1000
    offset = 0

    while True:
        try:
            response = supabase.table('all_quotes')\
                .select('task_id')\
                .range(offset, offset + page_size - 1)\
                .execute()

            if not response.data:
                break

            for record in response.data:
                if record.get('task_id'):
                    all_tasks.add(str(record['task_id']))

            print(f"  Loaded {len(all_tasks)} unique task IDs so far...")

            if len(response.data) < page_size:
                break

            offset += page_size

        except Exception as e:
            print(f"ERROR fetching existing data: {str(e)}")
            return set()

    print(f"Found {len(all_tasks)} unique task IDs in database")
    return all_tasks

def clean_date(value):
    """Clean and parse date values"""
    if pd.isna(value) or value is None or value == '':
        return None

    try:
        # Try parsing as date
        parsed = pd.to_datetime(value, errors='coerce')
        if pd.notna(parsed):
            return parsed.strftime('%Y-%m-%dT%H:%M:%S')
        return None
    except:
        return None

def clean_numeric(value):
    """Clean numeric values (currency and numbers)"""
    if pd.isna(value) or value is None:
        return None

    if isinstance(value, str):
        # Remove $, commas, quotes, and whitespace
        value = value.replace('$', '').replace(',', '').replace('"', '').strip()
        if value == '' or value == '#N/A' or value.lower() == 'nan':
            return None

    try:
        result = float(value)
        # Check for NaN or infinity
        if math.isnan(result) or math.isinf(result):
            return None
        return result
    except:
        return None

def clean_integer(value):
    """Clean integer values"""
    if pd.isna(value) or value is None:
        return None

    try:
        result = int(float(value))
        return result
    except:
        return None

def prepare_data(df):
    """Prepare dataframe for database insertion"""
    # Column mapping from CSV to database schema
    column_mapping = {
        'Assignee': 'assignee',
        'Name': 'name',
        'Created At Year': 'created_at_year',
        'Created At Y-M': 'created_at_ym',
        'Created At': 'created_at',
        'Task ID': 'task_id',
        'Completed At': 'completed_at',
        'Last Modified': 'last_modified',
        'Section/Column': 'section_column',
        'Assignee Email': 'assignee_email',
        'Start Date': 'start_date',
        'Due Date': 'due_date',
        'Tags': 'tags',
        'Notes': 'notes',
        'Projects': 'projects',
        'Parent task': 'parent_task',
        'Blocked By (Dependencies)': 'blocked_by',
        'Blocking (Dependencies)': 'blocking',
        'QUOTE NUMBER': 'quote_number',
        '$ AMOUNT': 'amount',
        'FOLLOW UP VIA': 'follow_up_via',
        'FOLLOW UP': 'follow_up',
        'QUOTE SENT': 'quote_sent',
        'STATUS OF QUOTE': 'status_of_quote',
        'INQUIRY DATE': 'inquiry_date',
        'TURNED TO ORDER': 'turned_to_order',
        'CUSTOMER PHONE #': 'customer_phone',
        'CUSTOMER EMAIL': 'customer_email',
        'SHIPPING ADDRESS': 'shipping_address',
        'DELIVERY': 'delivery',
        'REP': 'rep',
        'INQUIRY TYPE': 'inquiry_type',
        'VENDOR': 'vendor',
        'CUSTOMER PO#': 'customer_po',
        'TERMS': 'terms',
        'FREIGHT': 'freight',
        'SHIPS FROM': 'ships_from',
        'NOTES': 'notes_field',
        'PAYMENT INFO': 'payment_info',
        'CUSTOMER FIRST NAME': 'customer_first_name',
        'NEXT FOLLOW UP': 'next_follow_up',
        'QUOTE STATUS': 'quote_status',
    }

    df = df.rename(columns=column_mapping)

    # Clean date columns
    date_columns = ['created_at', 'completed_at', 'last_modified', 'quote_sent', 'next_follow_up']
    for col in date_columns:
        if col in df.columns:
            df[col] = df[col].apply(clean_date)

    # Clean simple date columns (no time)
    simple_date_columns = ['start_date', 'due_date', 'inquiry_date']
    for col in simple_date_columns:
        if col in df.columns:
            df[col] = df[col].apply(lambda x: clean_date(x).split('T')[0] if clean_date(x) else None)

    # Clean numeric column
    if 'amount' in df.columns:
        df['amount'] = df['amount'].apply(clean_numeric)

    # Clean integer column
    if 'created_at_year' in df.columns:
        df['created_at_year'] = df['created_at_year'].apply(clean_integer)

    # Convert task_id to string and ensure it's not null
    if 'task_id' in df.columns:
        df['task_id'] = df['task_id'].astype(str)
        # Remove any rows where task_id is NaN or empty
        df = df[df['task_id'].notna() & (df['task_id'] != '') & (df['task_id'] != 'nan')]

    # Replace all remaining NaN/None values with None for JSON serialization
    df = df.replace({pd.NA: None, pd.NaT: None})
    df = df.where(pd.notna(df), None)

    return df

def upload_to_supabase(df, batch_size=500):
    """Upload data to Supabase in batches"""
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
            response = supabase.table('all_quotes').insert(cleaned_records).execute()
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
    print("All Quotes Data Sync to Supabase")
    print("=" * 80)

    csv_file = r"C:\Users\blkw\OneDrive\Documents\Github\Source 4 Industries\Reporting\All Time Sales Files\SOURCE 4 QUOTES & ORDERS - ALL QUOTES.csv"

    if not os.path.exists(csv_file):
        print(f"ERROR: CSV file not found: {csv_file}")
        sys.exit(1)

    # Read CSV
    print(f"\nReading CSV file: {csv_file}")
    df = pd.read_csv(csv_file, low_memory=False)
    print(f"Loaded {len(df)} records from CSV")

    # Convert Task ID to string for comparison
    df['Task ID'] = df['Task ID'].astype(str)

    # Remove duplicates within CSV - keep most recent (last occurrence)
    print("\nRemoving duplicates within CSV...")
    original_count = len(df)
    df = df.drop_duplicates(subset=['Task ID'], keep='last')
    duplicates_removed = original_count - len(df)
    print(f"  Removed {duplicates_removed} duplicate task IDs from CSV")
    print(f"  Unique records in CSV: {len(df)}")

    # Get existing task IDs from Supabase
    existing_tasks = get_existing_task_ids()

    # Filter for new records only
    print("\nFiltering for new records...")
    df_new = df[~df['Task ID'].isin(existing_tasks)].copy()
    new_count = len(df_new)
    original_count = len(df)

    print(f"  Total records in CSV: {original_count}")
    print(f"  Already in database: {original_count - new_count}")
    print(f"  New records to import: {new_count}")

    if new_count == 0:
        print("\n[SUCCESS] Database is already up to date! No new records to import.")
        return

    # Prepare data
    print("\nPreparing new data for upload...")
    df_new = prepare_data(df_new)

    # Remove any rows that lost task_id during cleaning
    df_new = df_new[df_new['task_id'].notna()]
    new_count = len(df_new)

    if new_count == 0:
        print("\n[WARNING] All new records had invalid task IDs and were filtered out.")
        return

    print(f"After cleaning: {new_count} valid records ready to upload")

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
