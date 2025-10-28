"""
Example script showing how to use the pricing monitoring system
"""

from scraper import PriceScraper
from data_manager import DataManager
from price_analyzer import PriceAnalyzer
from dashboard import DashboardGenerator

def run_example():
    """Run a simple example of the monitoring system"""
    print("Starting Source 4 Industries Price Monitoring Example")
    print("=" * 60)

    # Initialize components
    print("\nInitializing system components...")
    scraper = PriceScraper()
    data_manager = DataManager()
    price_analyzer = PriceAnalyzer(data_manager)
    dashboard_generator = DashboardGenerator(data_manager, price_analyzer)

    # Define some example products to search for
    example_products = [
        ['electric chain hoist', 'electric hoist'],
        ['industrial cart', 'utility cart'],
        ['jib crane']
    ]

    print(f"\nSearching for {len(example_products)} product categories...")

    all_products = []
    for i, keywords in enumerate(example_products, 1):
        print(f"   {i}. Searching for: {', '.join(keywords)}")

        # Scrape products (this might take a while due to delays)
        products = scraper.scrape_all_sites(keywords)

        if products:
            print(f"      Found {len(products)} products")
            all_products.extend(products)
        else:
            print(f"      No products found")

    if all_products:
        print(f"\nSaving {len(all_products)} products to database...")
        data_manager.save_pricing_data(all_products, category="Example Run")

        print("\nGenerating price analysis...")
        analysis = price_analyzer.analyze_current_prices()

        print("\nCreating dashboard...")
        dashboard_file = dashboard_generator.generate_dashboard()

        # Display results
        print("\n" + "=" * 60)
        print("RESULTS SUMMARY")
        print("=" * 60)

        summary = analysis.get('summary', {})
        print(f"Products found: {summary.get('total_products', 0)}")
        print(f"Products where we lead: {summary.get('products_where_we_lead', 0)}")
        print(f"Products where we lag: {summary.get('products_where_we_lag', 0)}")

        alerts = analysis.get('alerts', [])
        if alerts:
            print(f"\nPrice Alerts: {len(alerts)}")
            for alert in alerts[:3]:  # Show first 3
                print(f"   - {alert['product']}: {alert['percentage']:.1f}% higher than {alert['competitor_site']}")
        else:
            print("\nNo price alerts")

        print(f"\nDashboard created: {dashboard_file}")
        print(f"Open {dashboard_file} in your web browser to view results")

        # Show some sample data
        if all_products:
            print(f"\nSample product data:")
            for product in all_products[:3]:
                print(f"   - {product['name']} - ${product['price']:.2f} ({product['site']})")

    else:
        print("\nNo products were found. This could be due to:")
        print("   - Website access issues")
        print("   - Changes in website structure")
        print("   - Network connectivity problems")
        print("\nCheck the monitoring.log file for detailed error information.")

    print("\n" + "=" * 60)
    print("Example complete! Check the generated files:")
    print("   - price_monitoring_data.csv - Raw data")
    print("   - price_dashboard.html - Interactive dashboard")
    print("   - monitoring.log - System logs")
    print("=" * 60)

if __name__ == "__main__":
    run_example()