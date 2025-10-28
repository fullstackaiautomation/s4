"""
Configuration settings for the pricing monitoring system
"""

# Target websites to monitor
WEBSITES = {
    'source4industries': {
        'name': 'Source 4 Industries',
        'base_url': 'https://source4industries.com',
        'search_url': 'https://source4industries.com/search',
        'is_our_site': True
    },
    'aceindustries': {
        'name': 'Ace Industries',
        'base_url': 'https://aceindustries.com',
        'search_url': 'https://aceindustries.com/search.php',
        'is_our_site': False
    },
    'industrialproducts': {
        'name': 'Industrial Products',
        'base_url': 'https://industrialproducts.com',
        'search_url': 'https://industrialproducts.com/search',
        'is_our_site': False
    }
}

# Products to monitor (can be expanded)
PRODUCTS_TO_MONITOR = [
    {
        'name': 'Handle-It Products',
        'keywords': ['handle-it', 'handle it'],
        'category': 'Handle-It'
    },
    {
        'name': 'Pedestrian Gates',
        'keywords': ['pedestrian gate', 'adjustable pedestrian gate'],
        'category': 'Safety Gates'
    },
    {
        'name': 'Electric Chain Hoist',
        'keywords': ['electric chain hoist', 'electric hoist'],
        'category': 'Hoists'
    },
    {
        'name': 'Hand Chain Hoist',
        'keywords': ['hand chain hoist', 'manual hoist'],
        'category': 'Hoists'
    },
    {
        'name': 'Industrial Cart',
        'keywords': ['industrial cart', 'utility cart'],
        'category': 'Carts'
    }
]

# Alert thresholds
PRICE_ALERT_THRESHOLD = 0.05  # Alert if competitor is 5% cheaper
SIGNIFICANT_DIFFERENCE_THRESHOLD = 0.10  # 10% difference is significant

# File paths
CSV_OUTPUT_FILE = 'price_monitoring_data.csv'
DASHBOARD_FILE = 'price_dashboard.html'
LOG_FILE = 'monitoring.log'

# Scraping settings
REQUEST_DELAY = 2  # Seconds between requests
TIMEOUT = 30  # Request timeout in seconds
USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'