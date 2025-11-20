"""
Import Script: Shopify Orders Export to Supabase

This script reads Shopify order export CSV files and uploads them to Supabase.
It handles multi-row orders (one order with multiple line items), data transformation,
cleaning, and validation.

Usage:
    python import_shopify_orders.py <csv_file_path> [--test] [--batch-size 100]
    python import_shopify_orders.py "orders_export_1.csv" "orders_export_2.csv" --test

Flags:
    --test: Run in test mode (imports only first 10 orders)
    --batch-size: Number of orders to import in each batch (default: 100)
"""

import os
import sys
import pandas as pd
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import List, Dict, Any, Tuple
import logging
import hashlib

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('shopify_orders_import.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)


class ShopifyOrderImporter:
    """Handle importing Shopify order CSV exports to Supabase"""

    def __init__(self, csv_paths: List[str], test_mode: bool = False, batch_size: int = 100):
        """
        Initialize the importer

        Args:
            csv_paths: List of paths to CSV files
            test_mode: If True, only import first 10 orders
            batch_size: Number of orders per batch
        """
        self.csv_paths = csv_paths
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

            supabase_url = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
            supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

            # If not found in env, try loading from .env file
            if not supabase_url or not supabase_key:
                env_vars = self._load_env_file()
                supabase_url = env_vars.get('NEXT_PUBLIC_SUPABASE_URL') or supabase_url
                supabase_key = env_vars.get('SUPABASE_SERVICE_ROLE_KEY') or supabase_key

            if not supabase_url or not supabase_key:
                raise ValueError(
                    "NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables not set.\n"
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

        # Try multiple locations for .env file
        possible_paths = [
            Path('.env'),
            Path('Source 4 Dashboard/web/.env.local'),
            Path('../Source 4 Dashboard/web/.env.local'),
            Path('../../Source 4 Dashboard/web/.env.local'),
        ]

        for env_path in possible_paths:
            if env_path.exists():
                logger.info(f"Loading .env from: {env_path}")
                with open(env_path, 'r') as f:
                    for line in f:
                        line = line.strip()
                        if line and not line.startswith('#'):
                            try:
                                key, value = line.split('=', 1)
                                env_vars[key.strip()] = value.strip()
                            except ValueError:
                                pass
                break

        return env_vars

    def read_csv_files(self) -> Tuple[pd.DataFrame, int]:
        """
        Read all CSV files and combine them

        Returns:
            Tuple of (DataFrame, total_row_count)
        """
        try:
            all_dfs = []

            for csv_path in self.csv_paths:
                logger.info(f"Reading CSV file: {csv_path}")

                # Read the CSV file
                df = pd.read_csv(csv_path, dtype=str, keep_default_na=False)
                all_dfs.append(df)

                logger.info(f"  Read {len(df)} rows from {Path(csv_path).name}")

            # Combine all DataFrames
            self.df = pd.concat(all_dfs, ignore_index=True)

            total_rows = len(self.df)
            logger.info(f"Combined total: {total_rows} rows from {len(self.csv_paths)} file(s)")

            # Show column info
            logger.info(f"Columns found: {len(self.df.columns)}")
            logger.debug(f"Column names: {list(self.df.columns)}")

            return self.df, total_rows

        except FileNotFoundError as e:
            logger.error(f"CSV file not found: {e}")
            sys.exit(1)
        except Exception as e:
            logger.error(f"Error reading CSV files: {e}")
            import traceback
            logger.error(traceback.format_exc())
            sys.exit(1)

    def parse_orders(self) -> Tuple[List[Dict], List[Dict]]:
        """
        Parse CSV rows into orders and line items

        Shopify CSV exports have one row per line item, with order details
        repeated on the first line item row only.

        Returns:
            Tuple of (orders_list, line_items_list)
        """
        logger.info("Parsing orders from CSV rows...")

        orders = []
        line_items = []
        current_order = None
        order_count = 0
        line_item_count = 0

        for idx, row in self.df.iterrows():
            # Check if this is a new order (has Name field populated with # AND has Id)
            order_name = str(row.get('Name', '')).strip()
            order_id = str(row.get('Id', '')).strip()

            # New order must have both # in name AND a valid order ID
            if order_name.startswith('#') and order_id and order_id.isdigit():
                # New order - save previous order if exists
                if current_order is not None:
                    orders.append(current_order)
                    order_count += 1

                # Test mode: stop after N orders
                if self.test_mode and order_count >= 10:
                    logger.warning(f"TEST MODE: Stopping after {order_count} orders")
                    break

                # Parse order ID from Name field
                order_number = order_name.replace('#', '').strip()

                # Create new order record
                current_order = {
                    'order_id': int(order_id) if order_id.isdigit() else None,
                    'order_number': order_number,
                    'name': order_name,
                    'email': str(row.get('Email', '')).strip() or None,
                    'created_at': self._parse_datetime(row.get('Created at')),
                    'updated_at': None,  # Not in CSV
                    'closed_at': None,  # Not in CSV
                    'cancelled_at': self._parse_datetime(row.get('Cancelled at')),
                    'processed_at': self._parse_datetime(row.get('Paid at')),

                    # Financial
                    'currency': str(row.get('Currency', 'USD')).strip() or 'USD',
                    'total_price': self._parse_decimal(row.get('Total')),
                    'subtotal_price': self._parse_decimal(row.get('Subtotal')),
                    'total_tax': self._parse_decimal(row.get('Taxes')),
                    'total_discounts': self._parse_decimal(row.get('Discount Amount')),
                    'total_shipping': self._parse_decimal(row.get('Shipping')),

                    # Status
                    'financial_status': str(row.get('Financial Status', '')).strip() or None,
                    'fulfillment_status': str(row.get('Fulfillment Status', '')).strip() or None,

                    # Customer info - extract from billing name
                    'customer_id': None,  # Not in CSV
                    'customer_email': str(row.get('Email', '')).strip() or None,
                    'customer_first_name': self._extract_first_name(row.get('Billing Name')),
                    'customer_last_name': self._extract_last_name(row.get('Billing Name')),

                    # Shipping address
                    'shipping_address_city': str(row.get('Shipping City', '')).strip() or None,
                    'shipping_address_province': str(row.get('Shipping Province', '')).strip() or None,
                    'shipping_address_country': str(row.get('Shipping Country', '')).strip() or None,
                    'shipping_address_zip': str(row.get('Shipping Zip', '')).strip() or None,

                    # Billing address
                    'billing_address_city': str(row.get('Billing City', '')).strip() or None,
                    'billing_address_province': str(row.get('Billing Province', '')).strip() or None,
                    'billing_address_country': str(row.get('Billing Country', '')).strip() or None,

                    # Source
                    'source_name': str(row.get('Source', '')).strip() or None,
                    'landing_site': None,  # Not in CSV
                    'referring_site': None,  # Not in CSV

                    # Items count will be calculated
                    'line_items_count': 0,

                    # Metadata
                    'tags': str(row.get('Tags', '')).strip() or None,
                    'note': str(row.get('Notes', '')).strip() or None,

                    'synced_at': datetime.now(timezone.utc).isoformat()
                }

            # Parse line item (present on all rows including first)
            if current_order is not None:
                lineitem_name = str(row.get('Lineitem name', '')).strip()
                lineitem_sku = str(row.get('Lineitem sku', '')).strip()

                if lineitem_name:  # Only add if there's a product name
                    # Generate a unique line_item_id from order_id + SKU + title
                    # This allows for consistent re-imports without duplicates
                    unique_str = f"{current_order['order_id']}-{lineitem_sku}-{lineitem_name}-{line_item_count}"
                    line_item_hash = int(hashlib.md5(unique_str.encode()).hexdigest()[:15], 16)

                    line_item = {
                        'line_item_id': line_item_hash,  # Generate unique hash-based ID
                        'order_id': current_order['order_id'],

                        # Product info
                        'product_id': None,  # Not in CSV
                        'variant_id': None,  # Not in CSV
                        'title': lineitem_name,
                        'variant_title': None,  # Not in CSV
                        'sku': lineitem_sku or None,
                        'vendor': str(row.get('Vendor', '')).strip() or None,

                        # Quantities and pricing
                        'quantity': self._parse_int(row.get('Lineitem quantity')),
                        'price': self._parse_decimal(row.get('Lineitem price')),
                        'total_discount': self._parse_decimal(row.get('Lineitem discount')),

                        # Fulfillment
                        'fulfillment_status': str(row.get('Lineitem fulfillment status', '')).strip() or None,
                        'fulfillable_quantity': None,  # Not in CSV

                        # Tax
                        'taxable': str(row.get('Lineitem taxable', '')).strip().lower() == 'true',

                        'synced_at': datetime.now(timezone.utc).isoformat()
                    }

                    line_items.append(line_item)
                    line_item_count += 1
                    current_order['line_items_count'] += 1

        # Don't forget the last order
        if current_order is not None:
            orders.append(current_order)
            order_count += 1

        logger.info(f"Parsed {order_count} orders with {line_item_count} total line items")

        return orders, line_items

    @staticmethod
    def _parse_datetime(value) -> str | None:
        """Parse datetime string from Shopify format"""
        if not value or pd.isna(value) or str(value).strip() == '':
            return None

        try:
            # Shopify format: "2025-11-18 13:56:11 -0800"
            dt = pd.to_datetime(str(value).strip(), format='%Y-%m-%d %H:%M:%S %z', errors='coerce')
            if pd.isna(dt):
                return None
            return dt.isoformat()
        except:
            return None

    @staticmethod
    def _parse_decimal(value) -> float | None:
        """Parse decimal value"""
        if not value or pd.isna(value) or str(value).strip() == '':
            return None

        try:
            return round(float(str(value).strip()), 2)
        except:
            return None

    @staticmethod
    def _parse_int(value) -> int | None:
        """Parse integer value"""
        if not value or pd.isna(value) or str(value).strip() == '':
            return None

        try:
            return int(float(str(value).strip()))
        except:
            return None

    @staticmethod
    def _extract_first_name(full_name) -> str | None:
        """Extract first name from full name"""
        if not full_name or pd.isna(full_name) or str(full_name).strip() == '':
            return None

        parts = str(full_name).strip().split()
        return parts[0] if parts else None

    @staticmethod
    def _extract_last_name(full_name) -> str | None:
        """Extract last name from full name"""
        if not full_name or pd.isna(full_name) or str(full_name).strip() == '':
            return None

        parts = str(full_name).strip().split()
        return ' '.join(parts[1:]) if len(parts) > 1 else None

    def validate_data(self, orders: List[Dict], line_items: List[Dict]) -> Tuple[bool, List[str]]:
        """
        Validate parsed data before import

        Args:
            orders: List of order records
            line_items: List of line item records

        Returns:
            Tuple of (is_valid, error_messages)
        """
        logger.info("Validating data...")

        errors = []

        # Check we have orders
        if not orders:
            errors.append("No orders found in CSV files")
            return False, errors

        # Validate orders
        missing_order_ids = sum(1 for o in orders if not o.get('order_id'))
        if missing_order_ids > 0:
            errors.append(f"{missing_order_ids} orders missing order_id")

        missing_order_numbers = sum(1 for o in orders if not o.get('order_number'))
        if missing_order_numbers > 0:
            errors.append(f"{missing_order_numbers} orders missing order_number")

        # Validate line items
        missing_line_item_orders = sum(1 for li in line_items if not li.get('order_id'))
        if missing_line_item_orders > 0:
            errors.append(f"{missing_line_item_orders} line items missing order_id")

        missing_titles = sum(1 for li in line_items if not li.get('title'))
        if missing_titles > 0:
            errors.append(f"{missing_titles} line items missing title")

        if errors:
            logger.error("Validation errors found:")
            for error in errors:
                logger.error(f"  - {error}")
            return False, errors
        else:
            logger.info("[OK] Data validation passed")
            return True, []

    def import_to_supabase(self, orders: List[Dict], line_items: List[Dict]) -> bool:
        """
        Import orders and line items to Supabase in batches

        Args:
            orders: List of order records
            line_items: List of line item records

        Returns:
            True if successful, False otherwise
        """
        logger.info(f"Starting import to Supabase...")
        logger.info(f"  Orders (before dedup): {len(orders)}")
        logger.info(f"  Line items (before dedup): {len(line_items)}")

        # Deduplicate orders by order_id (keep last occurrence)
        seen_order_ids = {}
        for order in orders:
            seen_order_ids[order['order_id']] = order
        orders = list(seen_order_ids.values())
        logger.info(f"  Orders (after dedup): {len(orders)}")

        # Deduplicate line items by line_item_id (keep last occurrence)
        seen_line_item_ids = {}
        for item in line_items:
            seen_line_item_ids[item['line_item_id']] = item
        line_items = list(seen_line_item_ids.values())
        logger.info(f"  Line items (after dedup): {len(line_items)}")

        try:
            # Import orders in batches
            logger.info("=" * 60)
            logger.info("IMPORTING ORDERS")
            logger.info("=" * 60)

            imported_orders = 0
            failed_orders = 0

            for i in range(0, len(orders), self.batch_size):
                batch = orders[i:i + self.batch_size]
                batch_num = (i // self.batch_size) + 1
                total_batches = (len(orders) + self.batch_size - 1) // self.batch_size

                try:
                    logger.info(f"Importing order batch {batch_num}/{total_batches} ({len(batch)} orders)...")

                    # Upsert orders (on conflict with order_id, update)
                    response = self.supabase_client.table('shopify_orders').upsert(
                        batch,
                        on_conflict='order_id'
                    ).execute()

                    if response.data:
                        imported_orders += len(batch)
                        logger.info(f"[OK] Batch {batch_num} imported successfully")
                    else:
                        failed_orders += len(batch)
                        logger.error(f"[FAIL] Batch {batch_num} failed")

                except Exception as e:
                    failed_orders += len(batch)
                    logger.error(f"[FAIL] Batch {batch_num} error: {e}")

            logger.info(f"Orders imported: {imported_orders}/{len(orders)}")

            # Import line items in batches
            logger.info("=" * 60)
            logger.info("IMPORTING LINE ITEMS")
            logger.info("=" * 60)

            imported_line_items = 0
            failed_line_items = 0

            for i in range(0, len(line_items), self.batch_size * 5):  # Larger batches for line items
                batch = line_items[i:i + self.batch_size * 5]
                batch_num = (i // (self.batch_size * 5)) + 1
                total_batches = (len(line_items) + self.batch_size * 5 - 1) // (self.batch_size * 5)

                try:
                    logger.info(f"Importing line item batch {batch_num}/{total_batches} ({len(batch)} items)...")

                    # Upsert line items (on conflict with line_item_id, update)
                    response = self.supabase_client.table('shopify_order_line_items').upsert(
                        batch,
                        on_conflict='line_item_id'
                    ).execute()

                    if response.data:
                        imported_line_items += len(batch)
                        logger.info(f"[OK] Batch {batch_num} imported successfully")
                    else:
                        failed_line_items += len(batch)
                        logger.error(f"[FAIL] Batch {batch_num} failed")

                except Exception as e:
                    failed_line_items += len(batch)
                    logger.error(f"[FAIL] Batch {batch_num} error: {e}")

            logger.info(f"Line items imported: {imported_line_items}/{len(line_items)}")

            # Summary
            logger.info("=" * 60)
            logger.info("IMPORT COMPLETE")
            logger.info("=" * 60)
            logger.info(f"Orders:")
            logger.info(f"  Total: {len(orders)}")
            logger.info(f"  Imported: {imported_orders}")
            logger.info(f"  Failed: {failed_orders}")
            logger.info(f"Line Items:")
            logger.info(f"  Total: {len(line_items)}")
            logger.info(f"  Imported: {imported_line_items}")
            logger.info(f"  Failed: {failed_line_items}")
            logger.info("=" * 60)

            return failed_orders == 0 and failed_line_items == 0

        except Exception as e:
            logger.error(f"Fatal error during import: {e}")
            import traceback
            logger.error(traceback.format_exc())
            return False

    def run(self) -> bool:
        """
        Execute the full import process

        Returns:
            True if successful, False otherwise
        """
        logger.info("=" * 60)
        logger.info("SHOPIFY ORDERS IMPORT TO SUPABASE")
        logger.info("=" * 60)

        try:
            # Step 1: Read CSV files
            df, total_rows = self.read_csv_files()

            # Step 2: Parse orders and line items
            orders, line_items = self.parse_orders()

            # Step 3: Validate data
            is_valid, errors = self.validate_data(orders, line_items)
            if not is_valid:
                logger.error("Data validation failed. Aborting import.")
                return False

            # Step 4: Import to Supabase
            success = self.import_to_supabase(orders, line_items)

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
        description='Import Shopify order CSV exports to Supabase'
    )
    parser.add_argument(
        'csv_files',
        nargs='+',
        help='Path(s) to CSV file(s) to import'
    )
    parser.add_argument(
        '--test',
        action='store_true',
        help='Run in test mode (import only first 10 orders)'
    )
    parser.add_argument(
        '--batch-size',
        type=int,
        default=100,
        help='Number of orders per batch (default: 100)'
    )

    args = parser.parse_args()

    # Check files exist
    for csv_file in args.csv_files:
        if not Path(csv_file).exists():
            logger.error(f"CSV file not found: {csv_file}")
            sys.exit(1)

    # Run importer
    importer = ShopifyOrderImporter(
        csv_paths=args.csv_files,
        test_mode=args.test,
        batch_size=args.batch_size
    )

    success = importer.run()
    sys.exit(0 if success else 1)


if __name__ == '__main__':
    main()
