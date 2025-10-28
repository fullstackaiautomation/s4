# Source 4 Industries Price Monitoring System

A comprehensive competitive pricing monitoring system that tracks product prices across Source 4 Industries and competitor websites, providing automated analysis and alerts.

## Features

- **Multi-Site Price Scraping**: Monitors prices from Source 4 Industries and competitor sites (Ace Industries)
- **Automated Data Storage**: Saves all pricing data to CSV files with timestamps for historical tracking
- **Intelligent Price Analysis**: Compares prices and identifies competitive advantages/disadvantages
- **Interactive Dashboard**: HTML dashboard with charts and visualizations
- **Alert System**: Notifications when competitors undercut your prices
- **Error Handling**: Robust error handling for website changes and connectivity issues
- **Scheduling**: Automatic monitoring on configurable schedules

## Installation

1. **Clone or download** this project to your local machine

2. **Install Python dependencies**:
```bash
pip install -r requirements.txt
```

3. **Verify installation** by running:
```bash
python main.py --help
```

## Quick Start

### Basic Monitoring Run
```bash
python main.py --mode monitor
```
This will:
- Scrape prices from all configured websites
- Save data to `price_monitoring_data.csv`
- Generate `price_dashboard.html`
- Create an analysis report

### View Dashboard
After running monitoring, open `price_dashboard.html` in your web browser to see:
- Current price comparisons
- Products where you're being undercut
- Products where you have the best price
- Price trend charts over time

### Analysis Only (No Scraping)
```bash
python main.py --mode analyze
```
Generates dashboard and reports from existing data without scraping.

### Automatic Scheduling
```bash
python main.py --mode schedule --schedule-hours 6
```
Runs monitoring every 6 hours automatically.

## Configuration

### Products to Monitor
Edit `config.py` to modify the products being monitored:

```python
PRODUCTS_TO_MONITOR = [
    {
        'name': 'Electric Chain Hoist',
        'keywords': ['electric chain hoist', 'electric hoist'],
        'category': 'Hoists'
    },
    # Add more products here
]
```

### Adding New Competitors
Add competitor websites in `config.py`:

```python
WEBSITES = {
    'your_new_competitor': {
        'name': 'Competitor Name',
        'base_url': 'https://competitor.com',
        'search_url': 'https://competitor.com/search',
        'is_our_site': False
    }
}
```

You'll also need to implement scraping logic in `scraper.py` for the new site.

### Alert Thresholds
Modify alert sensitivity in `config.py`:

```python
PRICE_ALERT_THRESHOLD = 0.05  # Alert if competitor is 5% cheaper
SIGNIFICANT_DIFFERENCE_THRESHOLD = 0.10  # 10% difference is significant
```

## Output Files

- **`price_monitoring_data.csv`**: Raw pricing data with timestamps
- **`price_dashboard.html`**: Interactive dashboard (open in browser)
- **`price_analysis_report_[timestamp].txt`**: Detailed text analysis
- **`monitoring.log`**: System logs
- **`error_log.json`**: Error tracking

## Dashboard Features

The HTML dashboard includes:

### Summary Cards
- Total products monitored
- Products where you lead on price
- Products where you lag on price
- Your overall leading percentage

### Price Alerts
- Visual alerts for products where competitors undercut you
- Severity levels (high/medium) based on price difference
- Specific competitor information

### Charts
- Bar chart comparing your prices vs lowest competitor prices
- Price trend charts showing changes over time

### Competitive Position Table
- Product-by-product comparison
- Your price vs best competitor price
- Status indicators (leading/lagging with percentages)

## Command Line Options

```bash
python main.py [OPTIONS]

Options:
  --mode {monitor,analyze,schedule}  Operation mode (default: monitor)
  --schedule-hours INT              Hours between scheduled runs (default: 24)
  --help                           Show help message
```

## Troubleshooting

### Common Issues

**No products found during scraping:**
- Check if websites are accessible
- Verify product keywords in `config.py`
- Check `monitoring.log` for specific errors

**Charts not displaying in dashboard:**
- Ensure you have internet connection (charts use CDN)
- Check if CSV data exists and contains valid price data

**Permission errors:**
- Ensure you have write permissions in the project directory
- Try running as administrator if needed

### Error Logs

Check these files for debugging:
- `monitoring.log`: General system logs
- `error_log.json`: Detailed error information

### Website Changes

If competitor websites change their structure:
1. Check `error_log.json` for scraping errors
2. Update scraping selectors in `scraper.py`
3. Test with `--mode analyze` first to verify data integrity

## Advanced Usage

### Custom Scheduling

For more complex scheduling, use external tools like cron (Linux/Mac) or Task Scheduler (Windows):

**Linux/Mac cron example** (run every 6 hours):
```bash
0 */6 * * * cd /path/to/project && python main.py --mode monitor
```

**Windows Task Scheduler:**
- Create new task
- Set trigger for desired frequency
- Set action to run `python main.py --mode monitor` in project directory

### Data Export

Export data programmatically:
```python
from data_manager import DataManager

dm = DataManager()
df = dm.load_pricing_data()
dm.export_to_csv('custom_export.csv')
```

### Custom Analysis

Create custom analysis scripts:
```python
from data_manager import DataManager
from price_analyzer import PriceAnalyzer

dm = DataManager()
analyzer = PriceAnalyzer(dm)

# Get current analysis
analysis = analyzer.analyze_current_prices()

# Get price trends
trends = analyzer.generate_price_trends(days=7)
```

## Contributing

To add new features or fix bugs:

1. Test changes thoroughly with existing data
2. Update configuration if adding new sites/products
3. Ensure error handling covers new scenarios
4. Update documentation

## Support

For issues or feature requests:
1. Check the troubleshooting section above
2. Review log files for specific errors
3. Verify configuration settings
4. Test with a minimal product set first

## System Requirements

- Python 3.7+
- Internet connection
- Write permissions for output files
- ~50MB disk space for data storage (grows over time)

## Security Considerations

- The system respects website robots.txt files
- Includes delays between requests to avoid overwhelming servers
- Uses appropriate User-Agent strings
- No authentication credentials are stored