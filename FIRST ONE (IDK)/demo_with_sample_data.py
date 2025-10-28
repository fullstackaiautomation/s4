"""
Demo of the pricing monitoring system with sample Handle-It data
"""

import logging
from datetime import datetime
from data_manager import DataManager
from price_analyzer import PriceAnalyzer
from dashboard import DashboardGenerator

def create_sample_handleit_data():
    """Create sample Handle-It product data to demonstrate the system"""

    sample_products = [
        # Source 4 Industries products
        {
            'name': 'Handle-It Adjustable Pedestrian Gate',
            'price': 422.73,
            'url': 'https://source4industries.com/products/handle-it-adjustable-pedestrian-gate',
            'site': 'Source 4 Industries',
            'keyword': 'handle-it',
            'category': 'Safety Gates'
        },
        {
            'name': 'Handle-It Safety Gate 36" Opening',
            'price': 385.50,
            'url': 'https://source4industries.com/products/handle-it-safety-gate-36',
            'site': 'Source 4 Industries',
            'keyword': 'handle-it',
            'category': 'Safety Gates'
        },
        {
            'name': 'Handle-It Swing Gate Self-Closing',
            'price': 295.00,
            'url': 'https://source4industries.com/products/handle-it-swing-gate',
            'site': 'Source 4 Industries',
            'keyword': 'handle-it',
            'category': 'Safety Gates'
        },
        {
            'name': 'Handle-It Ladder Safety Gate',
            'price': 189.99,
            'url': 'https://source4industries.com/products/handle-it-ladder-gate',
            'site': 'Source 4 Industries',
            'keyword': 'handle-it',
            'category': 'Safety Gates'
        },

        # Ace Industries competitive products (simulated)
        {
            'name': 'Industrial Safety Gate - Adjustable',
            'price': 399.00,
            'url': 'https://aceindustries.com/products/adjustable-safety-gate',
            'site': 'Ace Industries',
            'keyword': 'safety gate',
            'category': 'Safety Gates'
        },
        {
            'name': 'Professional Pedestrian Gate',
            'price': 450.00,
            'url': 'https://aceindustries.com/products/pedestrian-gate',
            'site': 'Ace Industries',
            'keyword': 'pedestrian gate',
            'category': 'Safety Gates'
        },
        {
            'name': 'Self-Closing Safety Barrier',
            'price': 275.50,
            'url': 'https://aceindustries.com/products/safety-barrier',
            'site': 'Ace Industries',
            'keyword': 'safety gate',
            'category': 'Safety Gates'
        },

        # Electric hoists for comparison
        {
            'name': 'Handle-It Electric Chain Hoist 1 Ton',
            'price': 1250.00,
            'url': 'https://source4industries.com/products/handle-it-electric-hoist-1ton',
            'site': 'Source 4 Industries',
            'keyword': 'electric hoist',
            'category': 'Hoists'
        },
        {
            'name': 'Yale Electric Chain Hoist 1 Ton',
            'price': 1195.00,
            'url': 'https://aceindustries.com/products/yale-electric-hoist',
            'site': 'Ace Industries',
            'keyword': 'electric hoist',
            'category': 'Hoists'
        },
        {
            'name': 'Columbus McKinnon Electric Hoist',
            'price': 1320.00,
            'url': 'https://aceindustries.com/products/cm-electric-hoist',
            'site': 'Ace Industries',
            'keyword': 'electric hoist',
            'category': 'Hoists'
        }
    ]

    return sample_products

def run_demo():
    """Run a complete demo of the pricing monitoring system"""

    print("Handle-It Product Pricing Monitor - DEMO")
    print("=" * 50)
    print("This demo shows the complete functionality with sample data")
    print("")

    # Set up logging
    logging.basicConfig(level=logging.INFO)

    # Initialize components
    data_manager = DataManager()
    price_analyzer = PriceAnalyzer(data_manager)
    dashboard_generator = DashboardGenerator(data_manager, price_analyzer)

    # Create and save sample data
    print("1. Creating sample Handle-It product data...")
    sample_products = create_sample_handleit_data()

    print(f"   Created {len(sample_products)} sample products:")
    for product in sample_products:
        print(f"   - {product['name']} (${product['price']:.2f}) - {product['site']}")

    print(f"\n2. Saving data to CSV...")
    data_manager.save_pricing_data(sample_products, category="Demo Data")

    print(f"\n3. Analyzing price competition...")
    analysis = price_analyzer.analyze_current_prices()

    # Display analysis results
    summary = analysis.get('summary', {})
    print(f"\nAnalysis Results:")
    print(f"- Total products: {summary.get('total_products', 0)}")
    print(f"- Products where we lead: {summary.get('products_where_we_lead', 0)}")
    print(f"- Products where we lag: {summary.get('products_where_we_lag', 0)}")
    print(f"- Our leading percentage: {summary.get('lead_percentage', 0):.1f}%")

    # Show alerts
    alerts = analysis.get('alerts', [])
    if alerts:
        print(f"\nPrice Alerts ({len(alerts)}):")
        for alert in alerts:
            print(f"  ! {alert['product']}: We're {alert['percentage']:.1f}% higher than {alert['competitor_site']}")
            print(f"    Our price: ${alert['our_price']:.2f} vs ${alert['competitor_price']:.2f}")
    else:
        print("\nNo price alerts - we're competitive!")

    # Show recommendations
    recommendations = analysis.get('recommendations', [])
    if recommendations:
        print(f"\nRecommendations:")
        for i, rec in enumerate(recommendations, 1):
            print(f"  {i}. {rec}")

    print(f"\n4. Generating dashboard...")
    dashboard_file = dashboard_generator.generate_dashboard()

    print(f"\n5. Creating analysis report...")
    report_file = price_analyzer.export_analysis_report()

    print(f"\n" + "=" * 50)
    print("DEMO COMPLETE!")
    print(f"Dashboard: {dashboard_file}")
    print(f"Analysis Report: {report_file}")
    print(f"Data File: price_monitoring_data.csv")
    print("")
    print("Next Steps:")
    print("1. Open the dashboard in your web browser")
    print("2. Review the analysis report")
    print("3. Configure real scraping by updating the scraper")
    print("   (Current limitation: JavaScript-rendered sites need browser automation)")
    print("=" * 50)

if __name__ == "__main__":
    run_demo()