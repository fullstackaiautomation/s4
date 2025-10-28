"""
Data management module for storing and retrieving pricing data
"""

import pandas as pd
import csv
from datetime import datetime
import os
from typing import List, Dict
import logging
from config import CSV_OUTPUT_FILE

class DataManager:
    def __init__(self, csv_file: str = CSV_OUTPUT_FILE):
        self.csv_file = csv_file
        self.logger = logging.getLogger(__name__)

        # Create CSV file with headers if it doesn't exist
        if not os.path.exists(self.csv_file):
            self.create_csv_file()

    def create_csv_file(self):
        """Create CSV file with appropriate headers"""
        headers = [
            'timestamp',
            'product_name',
            'keyword',
            'site',
            'price',
            'url',
            'category'
        ]

        with open(self.csv_file, 'w', newline='', encoding='utf-8') as file:
            writer = csv.writer(file)
            writer.writerow(headers)

        self.logger.info(f"Created CSV file: {self.csv_file}")

    def save_pricing_data(self, products: List[Dict], category: str = None):
        """Save pricing data to CSV file with timestamps"""
        if not products:
            self.logger.warning("No products to save")
            return

        timestamp = datetime.now().isoformat()

        with open(self.csv_file, 'a', newline='', encoding='utf-8') as file:
            writer = csv.writer(file)

            for product in products:
                row = [
                    timestamp,
                    product.get('name', ''),
                    product.get('keyword', ''),
                    product.get('site', ''),
                    product.get('price', ''),
                    product.get('url', ''),
                    category or product.get('category', '')
                ]
                writer.writerow(row)

        self.logger.info(f"Saved {len(products)} products to {self.csv_file}")

    def load_pricing_data(self) -> pd.DataFrame:
        """Load all pricing data from CSV file"""
        try:
            df = pd.read_csv(self.csv_file)
            df['timestamp'] = pd.to_datetime(df['timestamp'])
            return df
        except Exception as e:
            self.logger.error(f"Error loading CSV data: {e}")
            return pd.DataFrame()

    def get_latest_prices(self) -> pd.DataFrame:
        """Get the most recent prices for each product from each site"""
        df = self.load_pricing_data()

        if df.empty:
            return df

        # Get the latest timestamp for each product-site combination
        latest_data = df.groupby(['product_name', 'site']).apply(
            lambda x: x.loc[x['timestamp'].idxmax()]
        ).reset_index(drop=True)

        return latest_data

    def get_price_history(self, product_name: str = None, days: int = 30) -> pd.DataFrame:
        """Get price history for a specific product or all products"""
        df = self.load_pricing_data()

        if df.empty:
            return df

        # Filter by date
        cutoff_date = datetime.now() - pd.Timedelta(days=days)
        df = df[df['timestamp'] >= cutoff_date]

        # Filter by product if specified
        if product_name:
            df = df[df['product_name'].str.contains(product_name, case=False, na=False)]

        return df.sort_values('timestamp')

    def get_comparison_data(self) -> Dict:
        """Get comparison data showing price differences between sites"""
        latest_prices = self.get_latest_prices()

        if latest_prices.empty:
            return {}

        comparison_data = {}

        # Group by product name to compare prices across sites
        for product_name in latest_prices['product_name'].unique():
            product_data = latest_prices[latest_prices['product_name'] == product_name]

            if len(product_data) < 2:  # Need at least 2 sites for comparison
                continue

            prices = {}
            for _, row in product_data.iterrows():
                prices[row['site']] = {
                    'price': row['price'],
                    'url': row['url'],
                    'timestamp': row['timestamp']
                }

            # Find lowest and highest prices
            min_price = min(prices.values(), key=lambda x: x['price'])
            max_price = max(prices.values(), key=lambda x: x['price'])

            # Calculate price differences
            price_differences = {}
            for site, data in prices.items():
                if data['price'] != min_price['price']:
                    diff_amount = data['price'] - min_price['price']
                    diff_percentage = (diff_amount / min_price['price']) * 100
                    price_differences[site] = {
                        'amount': diff_amount,
                        'percentage': diff_percentage
                    }

            comparison_data[product_name] = {
                'prices': prices,
                'lowest_price': min_price,
                'highest_price': max_price,
                'differences': price_differences
            }

        return comparison_data

    def export_to_csv(self, filename: str = None):
        """Export current data to a new CSV file"""
        if filename is None:
            filename = f"price_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"

        df = self.load_pricing_data()
        df.to_csv(filename, index=False)

        self.logger.info(f"Data exported to {filename}")
        return filename