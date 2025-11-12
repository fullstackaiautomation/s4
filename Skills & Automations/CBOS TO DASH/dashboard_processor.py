#!/usr/bin/env python3
"""
S4 Dashboard Processor - CBOS to Dashboard Format

Transforms CBOS Sales Order Detail exports into final dashboard-ready format (columns A-AD).
Enriches with Master SKU data (cost, price, profit, margin, categories).

Version: 2.0.0
Author: Claude Code
"""

import pandas as pd
import numpy as np
import openpyxl
from openpyxl.utils import get_column_letter
from pathlib import Path
from datetime import datetime
import logging
import sys
from typing import Optional

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('dashboard_processor.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)


class DashboardProcessor:
    """Process CBOS data to Dashboard format (A-AD columns)"""

    def __init__(self, base_path: str = None):
        """Initialize processor"""
        if base_path is None:
            base_path = Path.home() / "OneDrive/Documents/Github/Source 4 Industries"
        else:
            base_path = Path(base_path)

        self.base_path = Path(base_path)
        self.dashboard_path = self.base_path / "Ads Report/Dashboard"
        self.monthly_imports = self.dashboard_path / "Monthly Imports"
        self.sku_docs_path = self.base_path / "Ads Report/SKU Documents"

        self.sales_data = None
        self.master_sku = None
        self.current_month = None

        logger.info("DashboardProcessor initialized")

    def find_latest_sales_file(self) -> Optional[Path]:
        """Find the latest Sales_Order_Detail file"""
        if not self.monthly_imports.exists():
            logger.error(f"Monthly Imports directory not found: {self.monthly_imports}")
            return None

        sales_files = list(self.monthly_imports.glob("Sales_Order_Detail*.xlsx"))

        if not sales_files:
            logger.error(f"No Sales_Order_Detail files found in {self.monthly_imports}")
            return None

        latest_file = max(sales_files, key=lambda p: p.stat().st_mtime)
        logger.info(f"Found latest sales file: {latest_file.name}")
        return latest_file

    def find_master_sku_file(self) -> Optional[Path]:
        """Find the Master SKU file"""
        sku_file = self.sku_docs_path / "Google Ads - Product Spend - MASTER SKU (1).csv"

        if not sku_file.exists():
            logger.error(f"Master SKU file not found: {sku_file}")
            return None

        logger.info(f"Found Master SKU file: {sku_file.name}")
        return sku_file

    def load_sales_data(self, file_path: Path) -> bool:
        """Load sales data from CBOS export"""
        try:
            logger.info(f"Loading sales data from {file_path.name}")
            df = pd.read_excel(file_path, sheet_name=0, skiprows=11)
            logger.info(f"Loaded {len(df)} rows of sales data")

            # Extract month from first date found
            date_column_candidates = [col for col in df.columns if 'date' in col.lower()]
            if date_column_candidates:
                date_col = date_column_candidates[0]
                first_date = pd.to_datetime(df[date_col].iloc[0], errors='coerce')
                if pd.notna(first_date):
                    self.current_month = first_date.strftime('%Y-%m')
                    logger.info(f"Extracted month: {self.current_month}")

            self.sales_data = df
            return True

        except Exception as e:
            logger.error(f"Error loading sales data: {e}")
            return False

    def load_master_sku(self, file_path: Path) -> bool:
        """Load Master SKU reference data"""
        try:
            logger.info(f"Loading Master SKU from {file_path.name}")
            df = pd.read_csv(file_path)
            logger.info(f"Loaded {len(df)} Master SKU records")
            self.master_sku = df
            return True

        except Exception as e:
            logger.error(f"Error loading Master SKU: {e}")
            return False

    def normalize_sku(self, sku_value) -> str:
        """Normalize SKU for matching"""
        if pd.isna(sku_value) or sku_value == '':
            return ''

        s = str(sku_value).strip()
        s = s.replace(',', '')
        s = s.replace(' ', '')
        s = s.replace('\u200b', '')
        s = s.replace('\ufffd', '')

        return s.upper()

    def extract_currency(self, value) -> float:
        """Extract numeric value from currency string"""
        if pd.isna(value) or value == '':
            return 0.0

        try:
            s = str(value).replace('$', '').replace(',', '').strip()
            return float(s) if s else 0.0
        except:
            return 0.0

    def get_month_code(self, date_value) -> str:
        """Generate month code (ZH, ZI, ZJ...) based on date"""
        if pd.isna(date_value):
            return ''

        try:
            date = pd.to_datetime(date_value)
            base_date = pd.to_datetime('2025-08-01')
            months_diff = (date.year - base_date.year) * 12 + (date.month - base_date.month)

            if months_diff < 0:
                return 'ZH'

            letter_code = 7 + months_diff
            if letter_code > 25:
                letter_code = letter_code % 26

            return 'Z' + chr(65 + letter_code)

        except:
            return ''

    def extract_state_and_region(self, address) -> tuple:
        """Extract state abbreviation and region (USA/Canada) from address"""
        if pd.isna(address):
            return '', ''

        try:
            address = str(address).upper().strip()

            # State abbreviations mapping
            state_abbrev = {
                'ALABAMA': 'AL', 'ALASKA': 'AK', 'ARIZONA': 'AZ', 'ARKANSAS': 'AR',
                'CALIFORNIA': 'CA', 'COLORADO': 'CO', 'CONNECTICUT': 'CT', 'DELAWARE': 'DE',
                'FLORIDA': 'FL', 'GEORGIA': 'GA', 'HAWAII': 'HI', 'IDAHO': 'ID',
                'ILLINOIS': 'IL', 'INDIANA': 'IN', 'IOWA': 'IA', 'KANSAS': 'KS',
                'KENTUCKY': 'KY', 'LOUISIANA': 'LA', 'MAINE': 'ME', 'MARYLAND': 'MD',
                'MASSACHUSETTS': 'MA', 'MICHIGAN': 'MI', 'MINNESOTA': 'MN', 'MISSISSIPPI': 'MS',
                'MISSOURI': 'MO', 'MONTANA': 'MT', 'NEBRASKA': 'NE', 'NEVADA': 'NV',
                'NEW HAMPSHIRE': 'NH', 'NEW JERSEY': 'NJ', 'NEW MEXICO': 'NM', 'NEW YORK': 'NY',
                'NORTH CAROLINA': 'NC', 'NORTH DAKOTA': 'ND', 'OHIO': 'OH', 'OKLAHOMA': 'OK',
                'OREGON': 'OR', 'PENNSYLVANIA': 'PA', 'RHODE ISLAND': 'RI', 'SOUTH CAROLINA': 'SC',
                'SOUTH DAKOTA': 'SD', 'TENNESSEE': 'TN', 'TEXAS': 'TX', 'UTAH': 'UT',
                'VERMONT': 'VT', 'VIRGINIA': 'VA', 'WASHINGTON': 'WA', 'WEST VIRGINIA': 'WV',
                'WISCONSIN': 'WI', 'WYOMING': 'WY', 'DISTRICT OF COLUMBIA': 'DC',
                'ALBERTA': 'AB', 'BRITISH COLUMBIA': 'BC', 'MANITOBA': 'MB', 'NEW BRUNSWICK': 'NB',
                'NEWFOUNDLAND AND LABRADOR': 'NL', 'NORTHWEST TERRITORIES': 'NT', 'NOVA SCOTIA': 'NS',
                'NUNAVUT': 'NU', 'ONTARIO': 'ON', 'PRINCE EDWARD ISLAND': 'PE', 'QUEBEC': 'QC',
                'SASKATCHEWAN': 'SK', 'YUKON': 'YT'
            }

            canadian_provinces = ['AB', 'BC', 'MB', 'NB', 'NL', 'NT', 'NS', 'NU', 'ON', 'PE', 'QC', 'SK', 'YT']

            # Try to find state name in address
            for state_name, abbrev in state_abbrev.items():
                if state_name in address:
                    region = 'Canada' if abbrev in canadian_provinces else 'USA'
                    return abbrev, region

            # Try to find 2-letter abbreviation directly
            parts = address.split()
            for part in parts:
                part = part.rstrip(',').upper()
                if len(part) == 2:
                    if part in canadian_provinces:
                        return part, 'Canada'
                    elif part in state_abbrev.values():
                        return part, 'USA'

            return '', ''

        except:
            return '', ''

    def process(self) -> bool:
        """Execute the processing workflow"""
        logger.info("=" * 80)
        logger.info("Starting CBOS to Dashboard Processing (A-AD Format)")
        logger.info("=" * 80)

        # Find and load input files
        sales_file = self.find_latest_sales_file()
        sku_file = self.find_master_sku_file()

        if not sales_file or not sku_file:
            logger.error("Required input files not found")
            return False

        if not self.load_sales_data(sales_file):
            return False

        if not self.load_master_sku(sku_file):
            return False

        # Process data
        logger.info("Processing: Mapping CBOS columns and enriching with Master SKU")

        sales_df = self.sales_data.copy()

        # Filter out Projects rows and excluded sales reps
        logger.info("Filtering: Removing Projects and excluded sales reps...")

        # Remove Projects
        if 'c_order_c_activity_id' in sales_df.columns:
            initial_rows = len(sales_df)
            sales_df = sales_df[sales_df['c_order_c_activity_id'] != 'Projects']
            logger.info(f"Removed Projects rows: {initial_rows - len(sales_df)}")

        # Remove excluded sales reps
        excluded_reps_upper = [rep.upper() for rep in ['KRISTI CROFFORD', 'MEL HEDGEPETH', 'CURT ROSS']]
        if 'Sales Rep' in sales_df.columns:
            initial_rows = len(sales_df)
            sales_df = sales_df[~(sales_df['Sales Rep'].fillna('').str.upper().isin(excluded_reps_upper))]
            logger.info(f"Removed excluded sales reps: {initial_rows - len(sales_df)}")

        logger.info(f"Rows after filtering: {len(sales_df)}")

        # Find SKU column
        sku_col = None
        for col in sales_df.columns:
            if col.lower() in ['search key', 'sku']:
                sku_col = col
                break

        if not sku_col:
            logger.error("SKU column not found in sales data")
            return False

        # Normalize SKUs for merging
        logger.info("Normalizing SKUs for matching...")
        sales_df['SKU_NORMALIZED'] = sales_df[sku_col].apply(self.normalize_sku)

        master_df = self.master_sku.copy()
        master_df['SKU_NORMALIZED'] = master_df['SKU'].apply(self.normalize_sku)

        # Merge on normalized SKU
        merged = pd.merge(
            sales_df,
            master_df[['SKU_NORMALIZED', 'COST', 'PRICE', 'PROFIT', 'MARGIN', 'VENDOR', 'PRODUCT CATEGORY', 'OVERALL PRODUCT CATEGORY']],
            on='SKU_NORMALIZED',
            how='left',
            suffixes=('', '_master')
        )

        logger.info(f"After merge: {len(merged)} rows")

        # Count matches
        matched = merged['COST'].notna().sum()
        unmatched = merged['COST'].isna().sum()
        logger.info(f"Matched SKUs: {matched}, Unmatched: {unmatched}")

        # Step 3: Identify and calculate shipping/discount by invoice
        # CRITICAL: Search in c_orderline_c_charge_id field, not Product Name
        logger.info("Step 3: Identifying and summing shipping/discount charges...")

        shipping_terms = [
            'DELIVERY FEE', 'FREIGHT CHARGED', 'FREIGHT-NON TAX', 'FREIGHT-Taxable',
            'SHIPPING CHARGED - NON-TAXABLE', 'SHIPPING CHARGED - TAXABLE', 'RESTOCKING FEE', 'TAX, TARIFF, FREIGHT'
        ]
        discount_terms = ['DISCOUNT']

        # PASS 1: Identify shipping/discount rows and sum by invoice
        shipping_by_invoice = {}
        discount_by_invoice = {}
        rows_to_delete = set()

        for idx, row in merged.iterrows():
            invoice = row.get('Document No', '')
            charge_id = str(row.get('c_orderline_c_charge_id', '')).upper()
            line_amt = pd.to_numeric(row.get('Line Amt', 0), errors='coerce') or 0

            # Initialize if not exists
            if invoice not in shipping_by_invoice:
                shipping_by_invoice[invoice] = 0
                discount_by_invoice[invoice] = 0

            # Check if this is a shipping or discount line (using c_orderline_c_charge_id)
            is_shipping = any(term in charge_id for term in shipping_terms)
            is_discount = any(term in charge_id for term in discount_terms)

            if is_shipping:
                shipping_by_invoice[invoice] += line_amt
                rows_to_delete.add(idx)
                logger.debug(f"Marked shipping line for deletion: {charge_id} = ${line_amt}")
            elif is_discount:
                discount_by_invoice[invoice] += abs(line_amt)
                rows_to_delete.add(idx)
                logger.debug(f"Marked discount line for deletion: {charge_id} = ${line_amt}")

        logger.info(f"Identified {len(rows_to_delete)} shipping/discount rows for deletion")
        logger.info(f"Shipping totals by invoice: {len(shipping_by_invoice)} invoices")
        logger.info(f"Discount totals by invoice: {len(discount_by_invoice)} invoices")

        # PASS 2: Delete shipping/discount rows from merged dataframe
        merged_filtered = merged.drop(index=rows_to_delete).copy()
        logger.info(f"Rows before deletion: {len(merged)}, After deletion: {len(merged_filtered)}")

        # PASS 3: Calculate total sales by invoice (excluding deleted rows)
        total_sales_by_invoice = {}
        for idx, row in merged_filtered.iterrows():
            invoice = row.get('Document No', '')
            line_amt = pd.to_numeric(row.get('Line Amt', 0), errors='coerce') or 0

            if invoice not in total_sales_by_invoice:
                total_sales_by_invoice[invoice] = 0

            total_sales_by_invoice[invoice] += line_amt

        # Use filtered data for all further processing
        merged = merged_filtered

        # PASS 4: Remove rows with null SKU AND null Description (incomplete/orphan rows)
        merged_clean = merged[(merged['Search Key'].notna()) | (merged['Product Name'].notna())].copy()
        logger.info(f"Rows after removing null SKU/Description: {len(merged_clean)}")
        merged = merged_clean

        # Create output dataframe with CBOS TO DASH format (A-AD)
        output_df = pd.DataFrame()

        # Column mappings for CBOS TO DASH format
        output_df['A_Customer'] = merged.get('Business Partner ', merged.get('Business Partner', ''))
        output_df['B_Rep'] = merged.get('Sales Rep', '')

        # Online/Local determination
        def get_order_type(row):
            sales_rep = str(row.get('Sales Rep', '')).upper()
            order = str(row.get('Order', '')).lower()
            if sales_rep == 'MICHAEL KARUGA' or '#' in order or order.startswith('c'):
                return 'Online'
            if order.startswith('so'):
                return 'Local'
            return ''

        output_df['C_Online_InPerson'] = merged.apply(get_order_type, axis=1)

        # Format date as datetime (NOT string)
        output_df['D_Month'] = merged.get('Date Ordered', '').apply(
            lambda x: pd.to_datetime(x, errors='coerce')
        )
        output_df['E_Date'] = merged.get('Date Ordered', '').apply(
            lambda x: pd.to_datetime(x, errors='coerce')
        )
        output_df['F_Invoice'] = merged.get('Document No', merged.get('Invoice #', ''))
        output_df['G_SKU'] = merged['SKU_NORMALIZED']
        output_df['H_Description'] = merged.get('Product Name', '')
        output_df['I_OrderQuantity'] = merged.get('Ordered Qty', 0)
        output_df['J_SalesEach'] = merged.get('Unit Price', 0)
        output_df['K_SalesTotal'] = merged.get('Line Amt', 0)
        # Cost Each as numeric (not currency string)
        output_df['L_CostEach'] = merged['COST'].apply(lambda x: self.extract_currency(x))

        # Cost Total = Qty × Cost Each
        output_df['M_CostTotal'] = (
            pd.to_numeric(merged.get('Ordered Qty', 0), errors='coerce').fillna(0) *
            merged['COST'].apply(lambda x: self.extract_currency(x))
        )

        output_df['N_Vendor'] = merged['VENDOR']

        # Orders calculation: Line % of invoice (decimal, not percentage)
        def calc_orders(row):
            invoice = row.get('Document No', '')
            line_amt = pd.to_numeric(row.get('Line Amt', 0), errors='coerce') or 0
            total_sales = total_sales_by_invoice.get(invoice, 0)
            if total_sales > 0:
                return line_amt / total_sales
            return 0.0

        # Store Orders as decimal for use in shipping/discount calculations
        orders_decimal = merged.apply(calc_orders, axis=1)
        output_df['O_Orders'] = orders_decimal

        # Shipping calculation: Proportional distribution
        # Since shipping/discount rows are already deleted, just apply orders percentage to shipping total
        def calc_shipping(idx, order_pct):
            row = merged.iloc[idx]
            invoice = row.get('Document No', '')
            shipping_amt = shipping_by_invoice.get(invoice, 0)

            if shipping_amt > 0:
                return order_pct * shipping_amt
            return 0.0

        shipping_values = [calc_shipping(i, orders_decimal.iloc[i]) for i in range(len(merged))]
        output_df['P_Shipping'] = shipping_values

        # Discount calculation: Proportional distribution
        # Since shipping/discount rows are already deleted, just apply orders percentage to discount total
        def calc_discount(idx, order_pct):
            row = merged.iloc[idx]
            invoice = row.get('Document No', '')
            discount_amt = discount_by_invoice.get(invoice, 0)

            if discount_amt > 0:
                return order_pct * discount_amt
            return 0.0

        discount_values = [calc_discount(i, orders_decimal.iloc[i]) for i in range(len(merged))]
        # Convert 0 to NaN for display consistency with reference
        output_df['Q_Discount'] = [v if v > 0 else np.nan for v in discount_values]

        # Refunds always 0, but show as NaN for display
        output_df['R_Refunds'] = np.nan

        # Invoice Total = Sales Total + Shipping - Discount + Refunds
        output_df['S_InvoiceTotal'] = (
            pd.to_numeric(merged.get('Line Amt', 0), errors='coerce').fillna(0) +
            output_df['P_Shipping'] - output_df['Q_Discount'] + 0
        )

        # Profit Total = Sales Total - Cost Total - Discount + Refunds
        cost_total = (
            pd.to_numeric(merged.get('Ordered Qty', 0), errors='coerce').fillna(0) *
            merged['COST'].apply(lambda x: self.extract_currency(x))
        )
        output_df['T_ProfitTotal'] = (
            pd.to_numeric(merged.get('Line Amt', 0), errors='coerce').fillna(0) - cost_total - output_df['Q_Discount'] + 0
        )

        # ROI = Profit Total / Invoice Total (as decimal, not percentage)
        roi_decimal = output_df['T_ProfitTotal'] / (output_df['S_InvoiceTotal'] + 0.0001)
        output_df['U_ROI'] = roi_decimal

        output_df['V_AdSpend'] = ''
        output_df['W_ProductCategory'] = merged['PRODUCT CATEGORY']
        output_df['X_OverallCategory'] = merged['OVERALL PRODUCT CATEGORY']
        output_df['Y_Year'] = merged.get('Date Ordered', '').apply(
            lambda x: pd.to_datetime(x, errors='coerce').strftime('%Y') if pd.notna(x) else ''
        )
        output_df['Z_TrackedMonth'] = merged.get('Date Ordered', '').apply(self.get_month_code)

        # Extract State and Region from Partner Location
        state_region_data = merged.get('Partner Location', '').apply(self.extract_state_and_region)
        output_df['State_temp'] = state_region_data.apply(lambda x: x[0])
        output_df['Region_temp'] = state_region_data.apply(lambda x: x[1])

        output_df['UserEmail_temp'] = merged.get('User_Email', '')
        output_df['ShippingMethod_temp'] = merged.get('c_orderline_m_shipper_id', '')

        # Rename columns to match CBOS TO DASH format (remove prefix)
        final_columns = {
            'A_Customer': 'Customer',
            'B_Rep': 'Rep',
            'C_Online_InPerson': 'Online / In Person',
            'D_Month': 'Month',
            'E_Date': 'Date',
            'F_Invoice': 'Invoice #',
            'G_SKU': 'SKU',
            'H_Description': 'Description',
            'I_OrderQuantity': 'Order Quantity',
            'J_SalesEach': 'Sales Each',
            'K_SalesTotal': 'Sales Total',
            'L_CostEach': 'Cost Each',
            'M_CostTotal': 'Cost Total',
            'N_Vendor': 'Vendor',
            'O_Orders': 'Orders',
            'P_Shipping': 'Shipping',
            'Q_Discount': 'Discount',
            'R_Refunds': 'Refunds',
            'S_InvoiceTotal': 'Invoice Total',
            'T_ProfitTotal': 'Profit Total',
            'U_ROI': 'ROI',
            'V_AdSpend': 'Ad Spend',
            'W_ProductCategory': 'Product Category',
            'X_OverallCategory': 'Overall Product Category',
            'Y_Year': 'Year',
            'Z_TrackedMonth': 'Tracked Month',
            'State_temp': 'State',
            'Region_temp': 'Region',
            'UserEmail_temp': 'User Email',
            'ShippingMethod_temp': 'Shipping Method'
        }

        output_df = output_df.rename(columns=final_columns)

        # Reorder columns to ensure A-AD order
        column_order = [
            'Customer', 'Rep', 'Online / In Person', 'Month', 'Date', 'Invoice #', 'SKU', 'Description',
            'Order Quantity', 'Sales Each', 'Sales Total', 'Cost Each', 'Cost Total', 'Vendor', 'Orders',
            'Shipping', 'Discount', 'Refunds', 'Invoice Total', 'Profit Total', 'ROI', 'Ad Spend',
            'Product Category', 'Overall Product Category', 'Year', 'Tracked Month', 'State', 'Region',
            'User Email', 'Shipping Method'
        ]
        output_df = output_df[column_order]

        # Export to Excel
        if not self.current_month:
            self.current_month = datetime.now().strftime('%Y-%m')

        timestamp = datetime.now().strftime('%H%M%S')
        output_filename = f"{self.current_month}_Dashboard_Import_{timestamp}.xlsx"
        output_path = self.dashboard_path / output_filename

        try:
            logger.info(f"Exporting to: {output_path.name}")

            # Create quality control sheets
            logger.info("Creating quality control sheets...")

            # Tab 1: READY TO IMPORT (all rows)
            ready_to_import = output_df.copy()

            # Tab 2: MISSING COSTS (Cost Each is null or empty)
            missing_costs = output_df[
                (output_df['Cost Each'].isna()) | (output_df['Cost Each'] == '')
            ].copy().sort_values('Vendor')

            # Tab 3: MISSING OVERALL CATEGORY
            missing_overall_cat = output_df[
                (output_df['Overall Product Category'].isna()) |
                (output_df['Overall Product Category'] == '') |
                (output_df['Overall Product Category'] == 'BLANK')
            ].copy()

            # Tab 4: MISSING PRODUCT CATEGORY - MAIN VENDORS
            main_vendors = [
                'S4 Bollards', 'Handle-It', 'Casters', 'Lincoln Industrial', 'Noblelift',
                'B&P Manufacturing', 'Dutro', 'Reliance Foundry', 'Ekko Lifts', 'Adrian\'s Safety',
                'Sentry Protection', 'Little Giant', 'Merrick Machine', 'Wesco', 'Valley Craft',
                'Bluff Manufacturing', 'Meco-Omaha', 'Apollo Forklift'
            ]
            missing_prod_cat_main = output_df[
                (output_df['Vendor'].isin(main_vendors)) &
                ((output_df['Product Category'].isna()) |
                 (output_df['Product Category'] == '') |
                 (output_df['Product Category'] == 'BLANK'))
            ].copy().sort_values('Vendor')

            # Tab 5: HIGH MARGIN ALERT (ROI > 70%)
            high_margin = output_df[roi_decimal > 0.70].copy()
            high_margin = high_margin.sort_values('ROI', ascending=False)

            # Tab 6: NEGATIVE/ZERO MARGIN ALERT (ROI <= 0%)
            neg_margin = output_df[roi_decimal <= 0.00].copy()
            neg_margin = neg_margin.sort_values('ROI', ascending=True)

            # Write all sheets to Excel
            with pd.ExcelWriter(output_path, engine='openpyxl') as writer:
                ready_to_import.to_excel(writer, sheet_name='READY TO IMPORT', index=False)
                missing_costs.to_excel(writer, sheet_name='MISSING COSTS', index=False)
                missing_overall_cat.to_excel(writer, sheet_name='MISSING OVERALL CAT', index=False)
                missing_prod_cat_main.to_excel(writer, sheet_name='MISSING PROD CAT MAIN', index=False)
                high_margin.to_excel(writer, sheet_name='HIGH MARGIN ALERT', index=False)
                neg_margin.to_excel(writer, sheet_name='NEG ZERO MARGIN', index=False)

            logger.info(f"Tab 1 - READY TO IMPORT: {len(ready_to_import)} rows")
            logger.info(f"Tab 2 - MISSING COSTS: {len(missing_costs)} rows")
            logger.info(f"Tab 3 - MISSING OVERALL CAT: {len(missing_overall_cat)} rows")
            logger.info(f"Tab 4 - MISSING PROD CAT MAIN: {len(missing_prod_cat_main)} rows")
            logger.info(f"Tab 5 - HIGH MARGIN ALERT: {len(high_margin)} rows")
            logger.info(f"Tab 6 - NEG ZERO MARGIN: {len(neg_margin)} rows")
            logger.info(f"Successfully exported 6 sheets with {len(output_df.columns)} columns")

        except Exception as e:
            logger.error(f"Error exporting to Excel: {e}")
            return False

        logger.info("=" * 80)
        logger.info("Processing completed successfully!")
        logger.info(f"Output file: {output_path}")
        logger.info("=" * 80)

        return True


def main():
    """Main entry point"""
    try:
        processor = DashboardProcessor()
        success = processor.process()

        if success:
            print("\n[+] Dashboard processing completed successfully!")
            print(f"Output file created in Dashboard folder")
            sys.exit(0)
        else:
            print("\n[-] Dashboard processing failed. Check log file for details.")
            sys.exit(1)

    except Exception as e:
        logger.error(f"Unexpected error: {e}", exc_info=True)
        print(f"\n[-] Unexpected error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
