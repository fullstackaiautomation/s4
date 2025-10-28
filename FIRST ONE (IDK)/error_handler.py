"""
Error handling and resilience module for the pricing monitoring system
"""

import logging
import time
import requests
from functools import wraps
from typing import Callable, Any
import json
from datetime import datetime

class MonitoringError(Exception):
    """Custom exception for monitoring system errors"""
    pass

class ScrapingError(MonitoringError):
    """Exception for scraping-related errors"""
    pass

class DataError(MonitoringError):
    """Exception for data-related errors"""
    pass

def retry_on_failure(max_retries: int = 3, delay: float = 1.0, backoff: float = 2.0):
    """Decorator for retrying failed operations with exponential backoff"""
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs) -> Any:
            logger = logging.getLogger(func.__module__)

            for attempt in range(max_retries + 1):
                try:
                    return func(*args, **kwargs)
                except Exception as e:
                    if attempt == max_retries:
                        logger.error(f"Function {func.__name__} failed after {max_retries + 1} attempts: {e}")
                        raise

                    wait_time = delay * (backoff ** attempt)
                    logger.warning(f"Attempt {attempt + 1}/{max_retries + 1} failed for {func.__name__}: {e}. Retrying in {wait_time:.1f}s...")
                    time.sleep(wait_time)

            return None
        return wrapper
    return decorator

class ErrorHandler:
    def __init__(self, log_file: str = 'error_log.json'):
        self.log_file = log_file
        self.logger = logging.getLogger(__name__)

    def log_error(self, error_type: str, error_message: str, context: dict = None):
        """Log errors to both file and console"""
        error_entry = {
            'timestamp': datetime.now().isoformat(),
            'error_type': error_type,
            'message': error_message,
            'context': context or {}
        }

        # Log to console
        self.logger.error(f"{error_type}: {error_message}")

        # Log to JSON file
        try:
            with open(self.log_file, 'a', encoding='utf-8') as f:
                f.write(json.dumps(error_entry) + '\n')
        except Exception as e:
            self.logger.error(f"Failed to write error log: {e}")

    def handle_scraping_error(self, url: str, error: Exception) -> dict:
        """Handle scraping-related errors and return fallback data"""
        context = {
            'url': url,
            'error_details': str(error),
            'error_type': type(error).__name__
        }

        self.log_error('SCRAPING_ERROR', f"Failed to scrape {url}", context)

        # Return empty result structure
        return {
            'success': False,
            'error': str(error),
            'data': [],
            'timestamp': datetime.now().isoformat()
        }

    def handle_network_error(self, error: requests.RequestException, url: str = None) -> bool:
        """Handle network-related errors"""
        error_details = {
            'url': url,
            'status_code': getattr(error.response, 'status_code', None) if hasattr(error, 'response') else None,
            'reason': getattr(error.response, 'reason', None) if hasattr(error, 'response') else None
        }

        self.log_error('NETWORK_ERROR', str(error), error_details)

        # Determine if error is recoverable
        if hasattr(error, 'response') and error.response:
            status_code = error.response.status_code
            # 4xx errors are typically not recoverable, 5xx might be
            return status_code >= 500

        return True  # Assume recoverable if we can't determine

    def validate_scraped_data(self, data: list) -> bool:
        """Validate scraped data structure and content"""
        if not isinstance(data, list):
            self.log_error('DATA_VALIDATION', "Scraped data is not a list")
            return False

        required_fields = ['name', 'price', 'site']

        for i, item in enumerate(data):
            if not isinstance(item, dict):
                self.log_error('DATA_VALIDATION', f"Item {i} is not a dictionary")
                return False

            for field in required_fields:
                if field not in item:
                    self.log_error('DATA_VALIDATION', f"Item {i} missing required field: {field}")
                    return False

            # Validate price is a number
            try:
                float(item['price'])
            except (ValueError, TypeError):
                self.log_error('DATA_VALIDATION', f"Item {i} has invalid price: {item.get('price')}")
                return False

        return True

    def check_website_availability(self, url: str, timeout: int = 10) -> bool:
        """Check if a website is available"""
        try:
            response = requests.head(url, timeout=timeout)
            return response.status_code < 400
        except Exception as e:
            self.log_error('AVAILABILITY_CHECK', f"Website {url} unavailable", {'error': str(e)})
            return False

    def sanitize_price_text(self, price_text: str) -> str:
        """Sanitize and clean price text"""
        if not price_text:
            return ""

        # Remove common unwanted characters and normalize
        import re

        # Remove extra whitespace
        price_text = re.sub(r'\s+', ' ', price_text.strip())

        # Remove HTML entities
        price_text = price_text.replace('&nbsp;', ' ').replace('&amp;', '&')

        # Remove non-price related text
        price_patterns_to_remove = [
            r'(?i)call for price',
            r'(?i)contact us',
            r'(?i)quote',
            r'(?i)price on request'
        ]

        for pattern in price_patterns_to_remove:
            price_text = re.sub(pattern, '', price_text)

        return price_text.strip()

    def create_error_report(self) -> str:
        """Create a summary report of recent errors"""
        try:
            with open(self.log_file, 'r', encoding='utf-8') as f:
                lines = f.readlines()

            # Parse last 100 errors
            recent_errors = []
            for line in lines[-100:]:
                try:
                    error = json.loads(line.strip())
                    recent_errors.append(error)
                except json.JSONDecodeError:
                    continue

            if not recent_errors:
                return "No recent errors found."

            # Categorize errors
            error_summary = {}
            for error in recent_errors:
                error_type = error.get('error_type', 'UNKNOWN')
                if error_type not in error_summary:
                    error_summary[error_type] = []
                error_summary[error_type].append(error)

            # Generate report
            report_lines = [
                "ERROR SUMMARY REPORT",
                "=" * 30,
                f"Total errors in last 100 entries: {len(recent_errors)}",
                ""
            ]

            for error_type, errors in error_summary.items():
                report_lines.append(f"{error_type}: {len(errors)} occurrences")

                # Show latest example
                latest_error = max(errors, key=lambda x: x['timestamp'])
                report_lines.append(f"  Latest: {latest_error['message']}")
                report_lines.append(f"  Time: {latest_error['timestamp']}")
                report_lines.append("")

            return "\n".join(report_lines)

        except Exception as e:
            return f"Failed to generate error report: {e}"

# Global error handler instance
error_handler = ErrorHandler()