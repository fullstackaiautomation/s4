"""
Main application for the pricing monitoring system
"""

import logging
import argparse
import sys
from datetime import datetime
import schedule
import time

from advanced_scraper import AdvancedPriceScraper
from data_manager import DataManager
from price_analyzer import PriceAnalyzer
from dashboard import DashboardGenerator
from config import PRODUCTS_TO_MONITOR

def setup_logging():
    """Set up logging configuration"""
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            logging.FileHandler('monitoring.log'),
            logging.StreamHandler(sys.stdout)
        ]
    )

def run_price_monitoring():
    """Main function to run the complete price monitoring process"""
    logger = logging.getLogger(__name__)
    logger.info("Starting price monitoring process...")

    try:
        # Initialize components
        scraper = AdvancedPriceScraper()
        data_manager = DataManager()
        price_analyzer = PriceAnalyzer(data_manager)
        dashboard_generator = DashboardGenerator(data_manager, price_analyzer)

        # Scrape pricing data for all configured products
        all_products = []

        for product_config in PRODUCTS_TO_MONITOR:
            logger.info(f"Monitoring {product_config['name']} products...")

            # Scrape data from all sites
            products = scraper.scrape_all_sites(product_config['keywords'])

            # Add category information
            for product in products:
                product['category'] = product_config['category']

            all_products.extend(products)

        if all_products:
            # Save data to CSV
            data_manager.save_pricing_data(all_products)

            # Generate analysis
            analysis = price_analyzer.analyze_current_prices()

            # Create dashboard
            dashboard_file = dashboard_generator.generate_dashboard()

            # Export analysis report
            report_file = price_analyzer.export_analysis_report()

            logger.info(f"Monitoring complete. Found {len(all_products)} products.")
            logger.info(f"Dashboard: {dashboard_file}")
            logger.info(f"Analysis report: {report_file}")

            # Print summary to console
            summary = analysis.get('summary', {})
            print("\n" + "="*50)
            print("PRICE MONITORING SUMMARY")
            print("="*50)
            print(f"Products monitored: {summary.get('total_products', 0)}")
            print(f"Products where we lead: {summary.get('products_where_we_lead', 0)}")
            print(f"Products where we lag: {summary.get('products_where_we_lag', 0)}")
            print(f"Our leading percentage: {summary.get('lead_percentage', 0):.1f}%")

            alerts = analysis.get('alerts', [])
            if alerts:
                print(f"\n🚨 {len(alerts)} PRICE ALERTS:")
                for alert in alerts[:5]:  # Show first 5 alerts
                    print(f"  - {alert['product']}: We're {alert['percentage']:.1f}% higher than {alert['competitor_site']}")

            print(f"\nDashboard available at: {dashboard_file}")
            print("="*50)

        else:
            logger.warning("No products found during scraping")

    except Exception as e:
        logger.error(f"Error during price monitoring: {e}")
        raise

def run_analysis_only():
    """Run analysis on existing data without scraping"""
    logger = logging.getLogger(__name__)
    logger.info("Running analysis on existing data...")

    try:
        data_manager = DataManager()
        price_analyzer = PriceAnalyzer(data_manager)
        dashboard_generator = DashboardGenerator(data_manager, price_analyzer)

        # Generate analysis and dashboard from existing data
        analysis = price_analyzer.analyze_current_prices()
        dashboard_file = dashboard_generator.generate_dashboard()
        report_file = price_analyzer.export_analysis_report()

        logger.info(f"Analysis complete. Dashboard: {dashboard_file}, Report: {report_file}")

    except Exception as e:
        logger.error(f"Error during analysis: {e}")
        raise

def schedule_monitoring(interval_hours: int = 24):
    """Schedule automatic monitoring"""
    logger = logging.getLogger(__name__)
    logger.info(f"Scheduling monitoring every {interval_hours} hours...")

    schedule.every(interval_hours).hours.do(run_price_monitoring)

    try:
        while True:
            schedule.run_pending()
            time.sleep(60)  # Check every minute
    except KeyboardInterrupt:
        logger.info("Monitoring stopped by user")

def main():
    """Main entry point"""
    setup_logging()

    parser = argparse.ArgumentParser(description='Source 4 Industries Price Monitoring System')
    parser.add_argument('--mode', choices=['monitor', 'analyze', 'schedule'],
                       default='monitor', help='Operation mode')
    parser.add_argument('--schedule-hours', type=int, default=24,
                       help='Hours between scheduled runs (for schedule mode)')

    args = parser.parse_args()

    try:
        if args.mode == 'monitor':
            run_price_monitoring()
        elif args.mode == 'analyze':
            run_analysis_only()
        elif args.mode == 'schedule':
            schedule_monitoring(args.schedule_hours)

    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()