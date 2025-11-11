"""
Import Script: Google & Bing Ads Product Spend Data to Supabase

This script reads the Excel file containing historical ad spend data and uploads it to Supabase.
It handles data transformation, cleaning, and validation.

Usage:
    python import_ad_spend_to_supabase.py [--test] [--batch-size 100]

Flags:
    --test: Run in test mode (imports only first 100 rows)
    --batch-size: Number of records to import in each batch (default: 1000)
"""

import os
import sys
import pandas as pd
import json
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Any, Tuple
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('ad_spend_import.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)


class AdSpendImporter:
    """Handle importing ad spend data from Excel to Supabase"""

    def __init__(self, excel_path: str, test_mode: bool = False, batch_size: int = 1000):
        """
        Initialize the importer

        Args:
            excel_path: Path to the Excel file
            test_mode: If True, only import first 100 rows
            batch_size: Number of records per batch
        """
        self.excel_path = excel_path
        self.test_mode = test_mode
        self.batch_size = batch_size
        self.df = None
        self.supabase_client = None

        # Initialize Supabase client
        self._init_supabase()

    def _init_supabase(self):
        """Initialize Supabase client from environment variables"""
        try:
            from supabase import create_client, Client

            supabase_url = os.getenv('SUPABASE_URL')
            supabase_key = os.getenv('SUPABASE_KEY')

            # If not found in env, try loading from .env file
            if not supabase_url or not supabase_key:
                env_vars = self._load_env_file()
                supabase_url = env_vars.get('SUPABASE_URL') or supabase_url
                supabase_key = env_vars.get('SUPABASE_KEY') or supabase_key

            if not supabase_url or not supabase_key:
                raise ValueError(
                    "SUPABASE_URL and SUPABASE_KEY environment variables not set.\n"
                    "Set them in your .env file or as environment variables."
                )

            self.supabase_client = create_client(supabase_url, supabase_key)
            logger.info("Supabase client initialized successfully")

        except ImportError:
            logger.error("supabase-py not installed. Install with: pip install supabase")
            sys.exit(1)
        except Exception as e:
            logger.error(f"Failed to initialize Supabase client: {e}")
            sys.exit(1)

    @staticmethod
    def _load_env_file() -> dict:
        """Load environment variables from .env file"""
        env_vars = {}
        env_path = Path('.env')
        if env_path.exists():
            with open(env_path, 'r') as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith('#'):
                        try:
                            key, value = line.split('=', 1)
                            env_vars[key.strip()] = value.strip()
                        except ValueError:
                            pass
        return env_vars

    def read_excel(self) -> Tuple[pd.DataFrame, int]:
        """
        Read Excel file and perform initial validation

        Returns:
            Tuple of (DataFrame, row_count)
        """
        try:
            logger.info(f"Reading Excel file: {self.excel_path}")

            # Read the Excel file
            self.df = pd.read_excel(self.excel_path, sheet_name='SKU Ad Spend')

            total_rows = len(self.df)
            logger.info(f"Successfully read {total_rows} rows from Excel")

            # Show column info
            logger.info(f"Columns found: {list(self.df.columns)}")
            logger.info(f"Data types:\n{self.df.dtypes}")

            return self.df, total_rows

        except FileNotFoundError:
            logger.error(f"Excel file not found: {self.excel_path}")
            sys.exit(1)
        except Exception as e:
            logger.error(f"Error reading Excel file: {e}")
            sys.exit(1)

    def transform_data(self) -> pd.DataFrame:
        """
        Transform and clean the data for Supabase insertion

        Returns:
            Transformed DataFrame
        """
        logger.info("Transforming data...")

        df = self.df.copy()

        # Rename columns to match database schema (handle spacing)
        column_mapping = {
            'Month': 'month',
            'Platform': 'platform',
            'Product Category': 'product_category',
            'SKU': 'sku',
            'Title': 'title',
            'Vendor': 'vendor',
            'Price': 'price',
            'Ad Spend': 'ad_spend',
            'Impressions': 'impressions',
            'Clicks': 'clicks',
            'CTR': 'ctr',
            'Avg. CPC': 'avg_cpc',
            'Conversions': 'conversions',
            'Revenue': 'revenue',
            'Impression share': 'impression_share',
            'Impression share lost to rank': 'impression_share_lost_to_rank',
            'Absolute top impression share': 'absolute_top_impression_share',
            'Campaign': 'campaign'
        }

        # Apply column mapping
        df = df.rename(columns=column_mapping)

        # Data type conversions and cleaning
        logger.info("Converting data types...")

        # Ensure month is text in YYYY-MM format
        if not pd.api.types.is_string_dtype(df['month']):
            df['month'] = df['month'].astype(str)

        # Ensure text columns are strings
        text_columns = ['platform', 'sku', 'title', 'vendor', 'product_category', 'campaign']
        for col in text_columns:
            if col in df.columns:
                df[col] = df[col].fillna('').astype(str).str.strip()
                # Remove actual null/None representations
                df.loc[df[col].isin(['None', 'NaN', 'nan', '']), col] = None

        # Numeric columns: ensure proper types
        numeric_columns = [
            'ad_spend', 'impressions', 'clicks', 'conversions', 'revenue', 'price'
        ]
        for col in numeric_columns:
            if col in df.columns:
                df[col] = pd.to_numeric(df[col], errors='coerce')

        # Percentage columns: store as decimal (0-1 range)
        percentage_columns = [
            'ctr', 'impression_share', 'impression_share_lost_to_rank',
            'absolute_top_impression_share'
        ]
        for col in percentage_columns:
            if col in df.columns:
                df[col] = pd.to_numeric(df[col], errors='coerce')

        # Integer columns for counts
        integer_columns = ['impressions', 'clicks']
        for col in integer_columns:
            if col in df.columns:
                df[col] = df[col].astype('Int64', errors='ignore')  # Nullable integer

        # Round decimal values to appropriate precision
        df['ad_spend'] = df['ad_spend'].round(2)
        df['avg_cpc'] = df['avg_cpc'].round(2)
        df['conversions'] = df['conversions'].round(2)
        df['revenue'] = df['revenue'].round(2)
        df['price'] = df['price'].round(2)
        df['ctr'] = df['ctr'].round(4)
        df['impression_share'] = df['impression_share'].round(4)
        df['impression_share_lost_to_rank'] = df['impression_share_lost_to_rank'].round(4)
        df['absolute_top_impression_share'] = df['absolute_top_impression_share'].round(4)

        # Add timestamps
        now = datetime.utcnow().isoformat() + 'Z'
        df['created_at'] = now
        df['updated_at'] = now

        # Reorder columns to match schema
        column_order = [
            'month', 'platform', 'sku', 'title', 'vendor', 'product_category',
            'ad_spend', 'impressions', 'clicks', 'ctr', 'avg_cpc',
            'conversions', 'revenue', 'price',
            'impression_share', 'impression_share_lost_to_rank',
            'absolute_top_impression_share', 'campaign',
            'created_at', 'updated_at'
        ]

        df = df[column_order]

        # Replace NaN with None (NULL) for JSON serialization
        df = df.where(pd.notnull(df), None)

        # Test mode: only first 100 rows
        if self.test_mode:
            logger.warning("TEST MODE: Importing only first 100 rows")
            df = df.head(100)

        logger.info(f"Data transformation complete. Ready to import {len(df)} rows")

        return df

    def validate_data(self, df: pd.DataFrame) -> Tuple[bool, List[str]]:
        """
        Validate transformed data before import

        Args:
            df: Transformed DataFrame

        Returns:
            Tuple of (is_valid, error_messages)
        """
        logger.info("Validating data...")

        errors = []

        # Check required columns
        required_columns = ['month', 'platform', 'sku', 'title', 'vendor', 'ad_spend']
        missing = [col for col in required_columns if col not in df.columns]
        if missing:
            errors.append(f"Missing required columns: {missing}")

        # Check required values
        if df['month'].isna().any():
            errors.append(f"{df['month'].isna().sum()} null month values")
        if df['platform'].isna().any():
            errors.append(f"{df['platform'].isna().sum()} null platform values")
        if df['sku'].isna().any():
            errors.append(f"{df['sku'].isna().sum()} null SKU values")
        if df['vendor'].isna().any():
            errors.append(f"{df['vendor'].isna().sum()} null vendor values")
        if df['ad_spend'].isna().any():
            errors.append(f"{df['ad_spend'].isna().sum()} null ad_spend values")

        # Check platform values
        valid_platforms = {'Google', 'Bing'}
        invalid_platforms = df[~df['platform'].isin(valid_platforms)]
        if not invalid_platforms.empty:
            errors.append(f"{len(invalid_platforms)} records with invalid platform values")

        # Check numeric ranges
        if (df['ad_spend'] < 0).any():
            errors.append(f"{(df['ad_spend'] < 0).sum()} records with negative ad_spend")

        if errors:
            logger.error("Validation errors found:")
            for error in errors:
                logger.error(f"  - {error}")
            return False, errors
        else:
            logger.info("Data validation passed")
            return True, []

    def import_to_supabase(self, df: pd.DataFrame) -> bool:
        """
        Import data to Supabase in batches

        Args:
            df: Transformed DataFrame to import

        Returns:
            True if successful, False otherwise
        """
        logger.info(f"Starting import to Supabase ({len(df)} rows)...")

        total_rows = len(df)
        imported_rows = 0
        failed_rows = 0

        try:
            # Convert DataFrame to list of dicts with NaN handling
            records_raw = df.to_dict('records')
            records = []
            for record in records_raw:
                clean_record = {}
                for key, value in record.items():
                    # Replace NaN with None for JSON serialization
                    if pd.isna(value):
                        clean_record[key] = None
                    else:
                        clean_record[key] = value
                records.append(clean_record)

            # Import in batches
            for i in range(0, len(records), self.batch_size):
                batch = records[i:i + self.batch_size]
                batch_num = (i // self.batch_size) + 1
                total_batches = (len(records) + self.batch_size - 1) // self.batch_size

                try:
                    logger.info(f"Importing batch {batch_num}/{total_batches} ({len(batch)} records)...")

                    # Insert batch into Supabase
                    response = self.supabase_client.table('sku_ad_spend').insert(batch).execute()

                    # Check response
                    if response.data:
                        imported_rows += len(batch)
                        logger.info(f"✓ Batch {batch_num} imported successfully")
                    else:
                        failed_rows += len(batch)
                        logger.error(f"✗ Batch {batch_num} failed: {response}")

                except Exception as e:
                    failed_rows += len(batch)
                    logger.error(f"✗ Batch {batch_num} error: {e}")

                # Progress update
                progress_pct = (imported_rows / total_rows) * 100
                logger.info(f"Progress: {imported_rows}/{total_rows} rows ({progress_pct:.1f}%)")

            # Summary
            logger.info("=" * 60)
            logger.info(f"Import Complete!")
            logger.info(f"  Total rows: {total_rows}")
            logger.info(f"  Imported: {imported_rows}")
            logger.info(f"  Failed: {failed_rows}")
            logger.info("=" * 60)

            return failed_rows == 0

        except Exception as e:
            logger.error(f"Fatal error during import: {e}")
            return False

    def run(self) -> bool:
        """
        Execute the full import process

        Returns:
            True if successful, False otherwise
        """
        logger.info("=" * 60)
        logger.info("AD SPEND DATA IMPORT TO SUPABASE")
        logger.info("=" * 60)

        try:
            # Step 1: Read Excel
            df, total_rows = self.read_excel()

            # Step 2: Transform data
            df = self.transform_data()

            # Step 3: Validate data
            is_valid, errors = self.validate_data(df)
            if not is_valid:
                logger.error("Data validation failed. Aborting import.")
                return False

            # Step 4: Import to Supabase
            success = self.import_to_supabase(df)

            return success

        except Exception as e:
            logger.error(f"Unexpected error: {e}")
            import traceback
            logger.error(traceback.format_exc())
            return False


def main():
    """Main entry point"""
    import argparse

    parser = argparse.ArgumentParser(
        description='Import Google & Bing Ads Product Spend data to Supabase'
    )
    parser.add_argument(
        '--test',
        action='store_true',
        help='Run in test mode (import only first 100 rows)'
    )
    parser.add_argument(
        '--batch-size',
        type=int,
        default=1000,
        help='Number of records per batch (default: 1000)'
    )
    parser.add_argument(
        '--excel-path',
        type=str,
        default=None,
        help='Path to Excel file (if not in default location)'
    )

    args = parser.parse_args()

    # Default Excel path
    if args.excel_path is None:
        base_path = Path(__file__).parent
        args.excel_path = base_path / "Ads Report" / "All Time Data" / "Google & Bing Ads Product Spend.xlsx"

    # Check file exists
    if not Path(args.excel_path).exists():
        logger.error(f"Excel file not found: {args.excel_path}")
        sys.exit(1)

    # Run importer
    importer = AdSpendImporter(
        excel_path=str(args.excel_path),
        test_mode=args.test,
        batch_size=args.batch_size
    )

    success = importer.run()
    sys.exit(0 if success else 1)


if __name__ == '__main__':
    main()
