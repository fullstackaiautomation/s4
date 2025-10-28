"""
Dashboard module for creating HTML reports and visualizations
"""

import pandas as pd
from jinja2 import Template
import plotly.graph_objects as go
import plotly.express as px
from datetime import datetime
import json
import logging
from data_manager import DataManager
from price_analyzer import PriceAnalyzer
from config import DASHBOARD_FILE

class DashboardGenerator:
    def __init__(self, data_manager: DataManager, price_analyzer: PriceAnalyzer):
        self.data_manager = data_manager
        self.price_analyzer = price_analyzer
        self.logger = logging.getLogger(__name__)

    def create_price_comparison_chart(self, comparison_data: dict) -> str:
        """Create price comparison chart using Plotly"""
        if not comparison_data:
            return ""

        products = []
        our_prices = []
        competitor_prices = []
        competitor_sites = []

        for product_name, data in comparison_data.items():
            our_price = None
            lowest_competitor_price = None
            lowest_competitor_site = ""

            for site, price_data in data['prices'].items():
                if 'Source 4 Industries' in site:
                    our_price = price_data['price']
                else:
                    if lowest_competitor_price is None or price_data['price'] < lowest_competitor_price:
                        lowest_competitor_price = price_data['price']
                        lowest_competitor_site = site

            if our_price and lowest_competitor_price:
                products.append(product_name)
                our_prices.append(our_price)
                competitor_prices.append(lowest_competitor_price)
                competitor_sites.append(lowest_competitor_site)

        if not products:
            return ""

        fig = go.Figure()

        # Add our prices
        fig.add_trace(go.Bar(
            name='Source 4 Industries',
            x=products,
            y=our_prices,
            marker_color='#1f77b4',
            text=[f'${p:.2f}' for p in our_prices],
            textposition='auto'
        ))

        # Add competitor prices
        fig.add_trace(go.Bar(
            name='Lowest Competitor',
            x=products,
            y=competitor_prices,
            marker_color='#ff7f0e',
            text=[f'${p:.2f}' for p in competitor_prices],
            textposition='auto'
        ))

        fig.update_layout(
            title='Price Comparison: Source 4 Industries vs Competitors',
            xaxis_title='Products',
            yaxis_title='Price ($)',
            barmode='group',
            height=400,
            showlegend=True
        )

        return fig.to_html(include_plotlyjs='cdn', div_id="price-comparison-chart")

    def create_price_trend_chart(self, days: int = 30) -> str:
        """Create price trend chart over time"""
        price_history = self.data_manager.get_price_history(days=days)

        if price_history.empty:
            return ""

        fig = go.Figure()

        # Group by product and site
        for product_name in price_history['product_name'].unique():
            product_data = price_history[price_history['product_name'] == product_name]

            for site in product_data['site'].unique():
                site_data = product_data[product_data['site'] == site].sort_values('timestamp')

                if len(site_data) < 2:
                    continue

                fig.add_trace(go.Scatter(
                    x=site_data['timestamp'],
                    y=site_data['price'],
                    mode='lines+markers',
                    name=f'{product_name} - {site}',
                    line=dict(width=2)
                ))

        fig.update_layout(
            title=f'Price Trends (Last {days} Days)',
            xaxis_title='Date',
            yaxis_title='Price ($)',
            height=400,
            showlegend=True
        )

        return fig.to_html(include_plotlyjs='cdn', div_id="price-trend-chart")

    def generate_dashboard(self, output_file: str = DASHBOARD_FILE) -> str:
        """Generate complete HTML dashboard"""
        self.logger.info("Generating dashboard...")

        # Get analysis data
        analysis = self.price_analyzer.analyze_current_prices()
        comparison_data = self.data_manager.get_comparison_data()
        latest_prices = self.data_manager.get_latest_prices()

        # Create charts
        comparison_chart = self.create_price_comparison_chart(comparison_data)
        trend_chart = self.create_price_trend_chart()

        # Prepare data for template
        template_data = {
            'generated_at': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            'summary': analysis.get('summary', {}),
            'alerts': analysis.get('alerts', []),
            'recommendations': analysis.get('recommendations', []),
            'comparison_chart': comparison_chart,
            'trend_chart': trend_chart,
            'competitive_position': analysis.get('competitive_position', {}),
            'latest_update': latest_prices['timestamp'].max().strftime('%Y-%m-%d %H:%M:%S') if not latest_prices.empty else 'No data'
        }

        # HTML template
        html_template = """
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Source 4 Industries - Price Monitoring Dashboard</title>
            <style>
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    margin: 0;
                    padding: 20px;
                    background-color: #f5f5f5;
                }
                .container {
                    max-width: 1200px;
                    margin: 0 auto;
                    background-color: white;
                    padding: 30px;
                    border-radius: 8px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                }
                .header {
                    text-align: center;
                    margin-bottom: 30px;
                    border-bottom: 2px solid #007bff;
                    padding-bottom: 20px;
                }
                .summary-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 20px;
                    margin-bottom: 30px;
                }
                .summary-card {
                    background: #f8f9fa;
                    padding: 20px;
                    border-radius: 8px;
                    text-align: center;
                    border-left: 4px solid #007bff;
                }
                .summary-card h3 {
                    margin: 0 0 10px 0;
                    color: #333;
                }
                .summary-card .value {
                    font-size: 2em;
                    font-weight: bold;
                    color: #007bff;
                }
                .alerts {
                    margin-bottom: 30px;
                }
                .alert {
                    padding: 15px;
                    margin-bottom: 10px;
                    border-radius: 5px;
                    border-left: 4px solid;
                }
                .alert.high {
                    background-color: #f8d7da;
                    border-color: #dc3545;
                    color: #721c24;
                }
                .alert.medium {
                    background-color: #fff3cd;
                    border-color: #ffc107;
                    color: #856404;
                }
                .charts {
                    margin-bottom: 30px;
                }
                .chart-container {
                    margin-bottom: 30px;
                }
                .recommendations {
                    background-color: #e7f3ff;
                    padding: 20px;
                    border-radius: 8px;
                    border-left: 4px solid #007bff;
                }
                .competitive-position {
                    margin-top: 30px;
                }
                .product-row {
                    display: grid;
                    grid-template-columns: 2fr 1fr 1fr 1fr;
                    gap: 10px;
                    padding: 10px;
                    border-bottom: 1px solid #eee;
                    align-items: center;
                }
                .product-row.header {
                    font-weight: bold;
                    background-color: #f8f9fa;
                }
                .status-good {
                    color: #28a745;
                    font-weight: bold;
                }
                .status-bad {
                    color: #dc3545;
                    font-weight: bold;
                }
                .footer {
                    text-align: center;
                    margin-top: 30px;
                    padding-top: 20px;
                    border-top: 1px solid #eee;
                    color: #666;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Price Monitoring Dashboard</h1>
                    <p>Source 4 Industries Competitive Analysis</p>
                    <p><strong>Generated:</strong> {{ generated_at }} | <strong>Last Update:</strong> {{ latest_update }}</p>
                </div>

                <div class="summary-grid">
                    <div class="summary-card">
                        <h3>Total Products</h3>
                        <div class="value">{{ summary.total_products or 0 }}</div>
                    </div>
                    <div class="summary-card">
                        <h3>Leading Price</h3>
                        <div class="value">{{ summary.products_where_we_lead or 0 }}</div>
                    </div>
                    <div class="summary-card">
                        <h3>Lagging Price</h3>
                        <div class="value">{{ summary.products_where_we_lag or 0 }}</div>
                    </div>
                    <div class="summary-card">
                        <h3>Lead Percentage</h3>
                        <div class="value">{{ "%.1f"|format(summary.lead_percentage or 0) }}%</div>
                    </div>
                </div>

                {% if alerts %}
                <div class="alerts">
                    <h2>🚨 Price Alerts</h2>
                    {% for alert in alerts %}
                    <div class="alert {{ alert.severity }}">
                        <strong>{{ alert.severity.upper() }} ALERT:</strong> {{ alert.product }}<br>
                        Our price: ${{ "%.2f"|format(alert.our_price) }} |
                        Competitor: ${{ "%.2f"|format(alert.competitor_price) }} ({{ alert.competitor_site }})<br>
                        <strong>We're {{ "%.1f"|format(alert.percentage) }}% higher</strong>
                    </div>
                    {% endfor %}
                </div>
                {% endif %}

                <div class="charts">
                    <div class="chart-container">
                        {{ comparison_chart|safe }}
                    </div>
                    <div class="chart-container">
                        {{ trend_chart|safe }}
                    </div>
                </div>

                <div class="competitive-position">
                    <h2>📊 Competitive Position</h2>
                    <div class="product-row header">
                        <div>Product</div>
                        <div>Our Price</div>
                        <div>Best Competitor</div>
                        <div>Status</div>
                    </div>
                    {% for product, data in competitive_position.items() %}
                    <div class="product-row">
                        <div>{{ product }}</div>
                        <div>${{ "%.2f"|format(data.our_price) }}</div>
                        <div>${{ "%.2f"|format(data.lowest_competitor_price) }}</div>
                        <div class="{% if data.price_difference <= 0 %}status-good{% else %}status-bad{% endif %}">
                            {% if data.price_difference <= 0 %}
                                ✅ Leading
                            {% else %}
                                ❌ {{ "%.1f"|format(data.percentage_difference) }}% higher
                            {% endif %}
                        </div>
                    </div>
                    {% endfor %}
                </div>

                {% if recommendations %}
                <div class="recommendations">
                    <h2>💡 Recommendations</h2>
                    <ul>
                    {% for rec in recommendations %}
                        <li>{{ rec }}</li>
                    {% endfor %}
                    </ul>
                </div>
                {% endif %}

                <div class="footer">
                    <p>Source 4 Industries Price Monitoring System</p>
                    <p>This dashboard is automatically updated when the monitoring system runs.</p>
                </div>
            </div>
        </body>
        </html>
        """

        # Render template
        template = Template(html_template)
        html_content = template.render(**template_data)

        # Save to file
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(html_content)

        self.logger.info(f"Dashboard generated: {output_file}")
        return output_file