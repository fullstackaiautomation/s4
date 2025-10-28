"""
Price analysis module for comparing prices and generating alerts
"""

import pandas as pd
from typing import Dict, List, Tuple
import logging
from datetime import datetime, timedelta
from data_manager import DataManager
from config import PRICE_ALERT_THRESHOLD, SIGNIFICANT_DIFFERENCE_THRESHOLD

class PriceAnalyzer:
    def __init__(self, data_manager: DataManager):
        self.data_manager = data_manager
        self.logger = logging.getLogger(__name__)

    def analyze_current_prices(self) -> Dict:
        """Analyze current price positions and generate insights"""
        comparison_data = self.data_manager.get_comparison_data()

        analysis = {
            'summary': {},
            'alerts': [],
            'competitive_position': {},
            'recommendations': []
        }

        if not comparison_data:
            analysis['summary']['message'] = "No comparison data available"
            return analysis

        # Initialize counters
        total_products = len(comparison_data)
        products_where_we_lead = 0
        products_where_we_lag = 0
        products_with_significant_gaps = 0

        for product_name, data in comparison_data.items():
            our_price = None
            lowest_competitor_price = None
            competitor_sites = []

            # Find our price and competitor prices
            for site, price_data in data['prices'].items():
                if 'Source 4 Industries' in site:
                    our_price = price_data['price']
                else:
                    competitor_sites.append({
                        'site': site,
                        'price': price_data['price'],
                        'url': price_data['url']
                    })

            if not our_price or not competitor_sites:
                continue

            # Find lowest competitor price
            lowest_competitor = min(competitor_sites, key=lambda x: x['price'])
            lowest_competitor_price = lowest_competitor['price']

            # Calculate our position
            price_difference = our_price - lowest_competitor_price
            percentage_difference = (price_difference / lowest_competitor_price) * 100

            position_data = {
                'product': product_name,
                'our_price': our_price,
                'lowest_competitor_price': lowest_competitor_price,
                'lowest_competitor_site': lowest_competitor['site'],
                'price_difference': price_difference,
                'percentage_difference': percentage_difference,
                'competitors': competitor_sites
            }

            analysis['competitive_position'][product_name] = position_data

            # Determine if we're leading or lagging
            if our_price <= lowest_competitor_price:
                products_where_we_lead += 1
            else:
                products_where_we_lag += 1

                # Check for alerts
                if percentage_difference > (PRICE_ALERT_THRESHOLD * 100):
                    alert = {
                        'type': 'undercut_alert',
                        'severity': 'high' if percentage_difference > (SIGNIFICANT_DIFFERENCE_THRESHOLD * 100) else 'medium',
                        'product': product_name,
                        'our_price': our_price,
                        'competitor_price': lowest_competitor_price,
                        'competitor_site': lowest_competitor['site'],
                        'difference': price_difference,
                        'percentage': percentage_difference,
                        'timestamp': datetime.now().isoformat()
                    }
                    analysis['alerts'].append(alert)

                    if percentage_difference > (SIGNIFICANT_DIFFERENCE_THRESHOLD * 100):
                        products_with_significant_gaps += 1

        # Generate summary
        analysis['summary'] = {
            'total_products': total_products,
            'products_where_we_lead': products_where_we_lead,
            'products_where_we_lag': products_where_we_lag,
            'products_with_significant_gaps': products_with_significant_gaps,
            'lead_percentage': (products_where_we_lead / total_products * 100) if total_products > 0 else 0,
            'analysis_timestamp': datetime.now().isoformat()
        }

        # Generate recommendations
        if products_where_we_lag > products_where_we_lead:
            analysis['recommendations'].append(
                "Consider reviewing pricing strategy - competitors are undercutting us on most products"
            )

        if products_with_significant_gaps > 0:
            analysis['recommendations'].append(
                f"Urgent attention needed: {products_with_significant_gaps} products have significant price gaps (>10%)"
            )

        high_priority_alerts = [a for a in analysis['alerts'] if a['severity'] == 'high']
        if high_priority_alerts:
            analysis['recommendations'].append(
                f"Immediate action required for {len(high_priority_alerts)} high-priority price alerts"
            )

        return analysis

    def generate_price_trends(self, days: int = 30) -> Dict:
        """Generate price trend analysis over specified time period"""
        price_history = self.data_manager.get_price_history(days=days)

        if price_history.empty:
            return {'message': 'No historical data available'}

        trends = {}

        for product_name in price_history['product_name'].unique():
            product_data = price_history[price_history['product_name'] == product_name]

            site_trends = {}
            for site in product_data['site'].unique():
                site_data = product_data[product_data['site'] == site].sort_values('timestamp')

                if len(site_data) < 2:
                    continue

                # Calculate trend
                first_price = site_data.iloc[0]['price']
                last_price = site_data.iloc[-1]['price']
                price_change = last_price - first_price
                percentage_change = (price_change / first_price * 100) if first_price > 0 else 0

                site_trends[site] = {
                    'first_price': first_price,
                    'last_price': last_price,
                    'price_change': price_change,
                    'percentage_change': percentage_change,
                    'trend': 'up' if price_change > 0 else 'down' if price_change < 0 else 'stable',
                    'data_points': len(site_data)
                }

            if site_trends:
                trends[product_name] = site_trends

        return trends

    def get_alerts(self, severity: str = None) -> List[Dict]:
        """Get current alerts, optionally filtered by severity"""
        analysis = self.analyze_current_prices()
        alerts = analysis.get('alerts', [])

        if severity:
            alerts = [a for a in alerts if a['severity'] == severity]

        return alerts

    def export_analysis_report(self, filename: str = None) -> str:
        """Export detailed analysis report to text file"""
        if filename is None:
            filename = f"price_analysis_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.txt"

        analysis = self.analyze_current_prices()
        trends = self.generate_price_trends()

        with open(filename, 'w', encoding='utf-8') as f:
            f.write("PRICE MONITORING ANALYSIS REPORT\n")
            f.write("=" * 50 + "\n\n")

            # Summary section
            f.write("EXECUTIVE SUMMARY\n")
            f.write("-" * 20 + "\n")
            summary = analysis['summary']
            f.write(f"Analysis Date: {summary.get('analysis_timestamp', 'N/A')}\n")
            f.write(f"Total Products Monitored: {summary.get('total_products', 0)}\n")
            f.write(f"Products Where We Lead: {summary.get('products_where_we_lead', 0)}\n")
            f.write(f"Products Where We Lag: {summary.get('products_where_we_lag', 0)}\n")
            f.write(f"Our Leading Percentage: {summary.get('lead_percentage', 0):.1f}%\n\n")

            # Alerts section
            f.write("PRICE ALERTS\n")
            f.write("-" * 15 + "\n")
            alerts = analysis.get('alerts', [])
            if alerts:
                for alert in alerts:
                    f.write(f"⚠️  {alert['severity'].upper()} ALERT\n")
                    f.write(f"   Product: {alert['product']}\n")
                    f.write(f"   Our Price: ${alert['our_price']:.2f}\n")
                    f.write(f"   Competitor Price: ${alert['competitor_price']:.2f} ({alert['competitor_site']})\n")
                    f.write(f"   We're {alert['percentage']:.1f}% higher\n\n")
            else:
                f.write("No price alerts at this time.\n\n")

            # Recommendations section
            f.write("RECOMMENDATIONS\n")
            f.write("-" * 15 + "\n")
            recommendations = analysis.get('recommendations', [])
            if recommendations:
                for i, rec in enumerate(recommendations, 1):
                    f.write(f"{i}. {rec}\n")
            else:
                f.write("No specific recommendations at this time.\n")

        self.logger.info(f"Analysis report exported to {filename}")
        return filename