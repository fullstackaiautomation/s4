# Shopify Orders Import to Supabase

## Overview

This script imports Shopify order export CSV files into the Supabase database. It handles multi-row order structures, data validation, and duplicate detection.

## Prerequisites

1. **Python 3.8+** installed
2. **Required Python packages:**
   ```bash
   pip install pandas supabase
   ```

3. **Environment variables** set in `.env` file:
   - `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
   - `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key (with write permissions)

## Usage

### Basic Import

Import a single CSV file:

```bash
python import_shopify_orders.py "path/to/orders_export.csv"
```

Import multiple CSV files at once:

```bash
python import_shopify_orders.py "orders_export_1.csv" "orders_export_2.csv"
```

### Test Mode

Test the import with only the first 10 orders (recommended before full import):

```bash
python import_shopify_orders.py "orders_export.csv" --test
```

### Custom Batch Size

Adjust the batch size for import (default is 100 orders per batch):

```bash
python import_shopify_orders.py "orders_export.csv" --batch-size 50
```

## Current Data Files

Located in: `Document Storage/Imports/`

1. **orders_export_1.csv** - 9,856 rows (~2,164 orders from February 2024)
2. **orders_export_2.csv** - 1,169 rows (~1,000 orders from November 2025)

## Import Process

The script performs the following steps:

### 1. Read CSV Files
- Loads all specified CSV files
- Combines them into a single dataset
- Handles 79 columns from Shopify export format

### 2. Parse Orders
- Identifies new orders (rows with `Name` starting with `#` AND having an `Id`)
- Groups line items under their parent order
- Handles multi-row orders (one order spans multiple CSV rows)

### 3. Data Transformation

#### Orders Table Mapping:
- `Name` (#37632) → `order_number` (37632)
- `Id` → `order_id`
- `Email` → `email`, `customer_email`
- `Financial Status` → `financial_status`
- `Fulfillment Status` → `fulfillment_status`
- `Created at` → `created_at`
- `Paid at` → `processed_at`
- `Total` → `total_price`
- `Subtotal` → `subtotal_price`
- `Taxes` → `total_tax`
- `Shipping` → `total_shipping`
- `Discount Amount` → `total_discounts`
- Billing/Shipping addresses
- `Tags`, `Notes` → metadata fields

#### Line Items Table Mapping:
- `Lineitem name` → `title`
- `Lineitem sku` → `sku`
- `Lineitem quantity` → `quantity`
- `Lineitem price` → `price`
- `Lineitem discount` → `total_discount`
- `Vendor` → `vendor`
- Generates unique `line_item_id` using MD5 hash of (order_id + SKU + title + index)

### 4. Validation
- Checks for required fields (order_id, order_number, line item titles)
- Validates data integrity before import

### 5. Import to Supabase
- **Deduplication**: Removes duplicate orders/line items within the batch
- **Upsert**: Uses `ON CONFLICT DO UPDATE` to handle existing records
- **Batch Processing**: Imports in configurable batches (default: 100 orders, 500 line items)
- **Error Handling**: Logs failed batches and continues with remaining data

## Database Schema

### shopify_orders
Primary table storing one record per order with financial, customer, and shipping information.

### shopify_order_line_items
Stores individual line items (products) for each order. Foreign key relationship to `shopify_orders` on `order_id`.

## Output

The script produces:
- **Console logs**: Real-time progress and statistics
- **Log file**: `shopify_orders_import.log` with detailed execution log

### Example Output:
```
============================================================
IMPORT COMPLETE
============================================================
Orders:
  Total: 10
  Imported: 10
  Failed: 0
Line Items:
  Total: 11
  Imported: 11
  Failed: 0
============================================================
```

## Important Notes

1. **Duplicate Handling**: The script uses hash-based `line_item_id` generation for consistent re-imports. Running the import multiple times with the same data will update existing records (not create duplicates).

2. **Order ID Requirements**: Orders MUST have both:
   - `Name` field starting with `#` (e.g., `#37632`)
   - Valid numeric `Id` field

3. **Multi-row Orders**: Shopify exports one row per line item. The script correctly groups these:
   - Row 1: Order header + first line item
   - Row 2+: Additional line items (Name column might repeat but Id is empty)

4. **Data Quality**:
   - Empty values are converted to `NULL`
   - Dates are parsed from Shopify format (`2025-11-18 13:56:11 -0800`)
   - Customer name is split into first/last from `Billing Name`

## Troubleshooting

### Missing Environment Variables
```
Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables not set.
```
**Solution**: Create `.env.local` file in `Source 4 Dashboard/web/` with your credentials.

### Validation Errors
```
ERROR - 2 orders missing order_id
```
**Solution**: Check CSV file structure. Ensure orders have valid `Id` column values.

### Foreign Key Constraint Errors
```
insert or update on table "shopify_order_line_items" violates foreign key constraint
```
**Solution**: This means an order wasn't imported successfully. Check logs for order import errors first.

## Next Steps

After successful import, you can:

1. **Verify Data**: Query Supabase to check imported records
   ```sql
   SELECT COUNT(*) FROM shopify_orders;
   SELECT COUNT(*) FROM shopify_order_line_items;
   ```

2. **View in Dashboard**: Visit the Shopify sales dashboard in the web app

3. **Re-import Updates**: Run the script again with updated CSV files - it will upsert changes

## Files

- `import_shopify_orders.py` - Main import script
- `shopify_orders_import.log` - Execution log
- `SHOPIFY_ORDERS_IMPORT_README.md` - This documentation

## Support

For issues or questions, check:
- Log files for detailed error messages
- Database schema in `Document Storage/SQL/shopify_schema.sql`
- Existing import patterns in `import_ad_spend_to_supabase.py`
