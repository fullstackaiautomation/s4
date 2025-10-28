"""
Improved web scraping module with better pattern matching for Handle-It products
"""

import requests
from bs4 import BeautifulSoup
import time
import logging
import json
import re
from typing import List, Dict, Optional
from urllib.parse import urljoin, quote
from config import WEBSITES, REQUEST_DELAY, TIMEOUT, USER_AGENT
from error_handler import retry_on_failure, error_handler

class ImprovedPriceScraper:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({'User-Agent': USER_AGENT})

        # Set up logging
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler('monitoring.log'),
                logging.StreamHandler()
            ]
        )
        self.logger = logging.getLogger(__name__)

    def extract_price_from_text(self, text: str) -> Optional[float]:
        """Extract price from text using regex patterns"""
        if not text:
            return None

        # Clean the text first
        text = error_handler.sanitize_price_text(text)

        # Enhanced price patterns for different formats
        price_patterns = [
            r'\$(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)',  # $123.45 or $1,234.56
            r'(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*(?:USD|\$)',  # 123.45 USD
            r'Price:\s*\$?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)',  # Price: $123.45
            r'Cost:\s*\$?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)',   # Cost: $123.45
            r'"amount":\s*"?(\d+(?:\.\d{2})?)"?',  # JSON format: "amount": "123.45"
        ]

        for pattern in price_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            if matches:
                try:
                    # Remove commas and convert to float
                    price_str = matches[0].replace(',', '')
                    return float(price_str)
                except ValueError:
                    continue

        return None

    def extract_json_from_script(self, soup: BeautifulSoup) -> Dict:
        """Extract JSON data from script tags (for Shopify sites)"""
        scripts = soup.find_all('script', type='application/json')
        for script in scripts:
            try:
                data = json.loads(script.string)
                if 'products' in data or 'product' in data:
                    return data
            except (json.JSONDecodeError, TypeError):
                continue

        # Also check for inline JavaScript with product data
        scripts = soup.find_all('script')
        for script in scripts:
            if script.string:
                # Look for common patterns
                if 'window.Shopify' in script.string or 'product' in script.string:
                    # Try to extract JSON-like structures
                    json_pattern = r'({[^{}]*"price"[^{}]*})'
                    matches = re.findall(json_pattern, script.string)
                    for match in matches:
                        try:
                            return json.loads(match)
                        except json.JSONDecodeError:
                            continue

        return {}

    @retry_on_failure(max_retries=2, delay=2.0)
    def scrape_source4industries(self, product_keywords: List[str]) -> List[Dict]:
        """Scrape pricing data from Source 4 Industries with improved pattern matching"""
        products = []

        try:
            for keyword in product_keywords:
                self.logger.info(f"Searching Source 4 Industries for: {keyword}")

                # Search for the product
                search_url = f"{WEBSITES['source4industries']['search_url']}?q={quote(keyword)}"
                response = self.session.get(search_url, timeout=TIMEOUT)
                response.raise_for_status()

                soup = BeautifulSoup(response.content, 'html.parser')

                # Method 1: Look for JSON data in script tags
                json_data = self.extract_json_from_script(soup)
                if json_data:
                    products.extend(self.parse_shopify_json(json_data, keyword))

                # Method 2: Traditional HTML parsing as fallback
                product_elements = self.find_product_elements(soup)
                for element in product_elements[:5]:  # Limit to first 5 results
                    product_data = self.parse_product_element(element, keyword, 'Source 4 Industries')
                    if product_data:
                        products.append(product_data)

                time.sleep(REQUEST_DELAY)

        except Exception as e:
            error_handler.handle_scraping_error(search_url, e)
            self.logger.error(f"Error scraping Source 4 Industries: {e}")

        return products

    def parse_shopify_json(self, json_data: Dict, keyword: str) -> List[Dict]:
        """Parse Shopify JSON data for product information"""
        products = []

        # Handle different JSON structures
        if 'products' in json_data:
            product_list = json_data['products']
        elif 'product' in json_data:
            product_list = [json_data['product']]
        else:
            return products

        for product in product_list:
            try:
                name = product.get('title', f"Product for {keyword}")

                # Extract price from various possible locations
                price = None
                if 'price' in product:
                    if isinstance(product['price'], dict):
                        price = self.extract_price_from_text(str(product['price'].get('amount', '')))
                    else:
                        price = self.extract_price_from_text(str(product['price']))

                # Try variants if main price not found
                if not price and 'variants' in product:
                    for variant in product['variants']:
                        if 'price' in variant:
                            price = self.extract_price_from_text(str(variant['price']))
                            if price:
                                break

                url = product.get('url', '')
                if url and not url.startswith('http'):
                    url = urljoin(WEBSITES['source4industries']['base_url'], url)

                if price and name:
                    products.append({
                        'name': name,
                        'price': price,
                        'url': url,
                        'site': 'Source 4 Industries',
                        'keyword': keyword
                    })

            except Exception as e:
                self.logger.warning(f"Error parsing Shopify product data: {e}")
                continue

        return products

    def find_product_elements(self, soup: BeautifulSoup) -> List:
        """Find product elements using various selectors"""
        selectors = [
            '[data-product-id]',
            '.product-item',
            '.product-card',
            '.grid-product',
            '.product',
            '.search-result-item',
            'article[itemtype*="Product"]',
            '.product-wrap'
        ]

        for selector in selectors:
            elements = soup.select(selector)
            if elements:
                return elements

        # Fallback to common patterns
        return soup.find_all(['div', 'article'], class_=re.compile(r'product|item', re.I))

    def parse_product_element(self, element, keyword: str, site: str) -> Optional[Dict]:
        """Parse individual product element"""
        try:
            # Extract product name with multiple fallback patterns
            name_selectors = [
                'h3', 'h2', 'h4', '.product-title', '.product-name',
                'a[title]', '[data-product-title]', '.title'
            ]

            name = None
            for selector in name_selectors:
                name_elem = element.select_one(selector)
                if name_elem:
                    name = name_elem.get_text(strip=True) or name_elem.get('title', '')
                    if name:
                        break

            if not name:
                name = f"Product for {keyword}"

            # Extract price with multiple patterns
            price_selectors = [
                '.price', '.cost', '[data-price]', '.product-price',
                '.money', '.amount', '.price-current'
            ]

            price = None
            for selector in price_selectors:
                price_elem = element.select_one(selector)
                if price_elem:
                    price_text = price_elem.get_text(strip=True)
                    price = self.extract_price_from_text(price_text)
                    if price:
                        break

            # Extract URL
            url_elem = element.select_one('a[href]')
            product_url = None
            if url_elem:
                href = url_elem.get('href', '')
                if href:
                    product_url = urljoin(WEBSITES[site.lower().replace(' ', '')]['base_url'], href)

            if price:
                return {
                    'name': name,
                    'price': price,
                    'url': product_url,
                    'site': site,
                    'keyword': keyword
                }

        except Exception as e:
            self.logger.warning(f"Error parsing product element: {e}")

        return None

    @retry_on_failure(max_retries=2, delay=2.0)
    def scrape_aceindustries(self, product_keywords: List[str]) -> List[Dict]:
        """Scrape pricing data from Ace Industries with corrected search URL"""
        products = []

        try:
            for keyword in product_keywords:
                self.logger.info(f"Searching Ace Industries for: {keyword}")

                # Use the correct search endpoint
                search_url = f"{WEBSITES['aceindustries']['search_url']}?search={quote(keyword)}"
                response = self.session.get(search_url, timeout=TIMEOUT)
                response.raise_for_status()

                soup = BeautifulSoup(response.content, 'html.parser')

                # Look for product listings
                product_elements = self.find_product_elements(soup)

                for element in product_elements[:5]:  # Limit to first 5 results
                    product_data = self.parse_product_element(element, keyword, 'Ace Industries')
                    if product_data:
                        products.append(product_data)

                time.sleep(REQUEST_DELAY)

        except Exception as e:
            error_handler.handle_scraping_error(search_url, e)
            self.logger.error(f"Error scraping Ace Industries: {e}")

        return products

    @retry_on_failure(max_retries=2, delay=2.0)
    def scrape_industrialproducts(self, product_keywords: List[str]) -> List[Dict]:
        """Scrape pricing data from Industrial Products (if accessible)"""
        products = []

        try:
            for keyword in product_keywords:
                self.logger.info(f"Searching Industrial Products for: {keyword}")

                # Try different search URL patterns
                search_urls = [
                    f"{WEBSITES['industrialproducts']['search_url']}?q={quote(keyword)}",
                    f"{WEBSITES['industrialproducts']['search_url']}?search={quote(keyword)}",
                    f"{WEBSITES['industrialproducts']['base_url']}/search?query={quote(keyword)}"
                ]

                for search_url in search_urls:
                    try:
                        response = self.session.get(search_url, timeout=TIMEOUT)

                        if response.status_code == 403:
                            self.logger.warning(f"Access denied to Industrial Products: {search_url}")
                            continue

                        response.raise_for_status()
                        soup = BeautifulSoup(response.content, 'html.parser')

                        product_elements = self.find_product_elements(soup)
                        for element in product_elements[:3]:  # Limit to first 3 results
                            product_data = self.parse_product_element(element, keyword, 'Industrial Products')
                            if product_data:
                                products.append(product_data)

                        if products:  # If we found products, break from search URL loop
                            break

                    except Exception as e:
                        self.logger.warning(f"Error with Industrial Products URL {search_url}: {e}")
                        continue

                time.sleep(REQUEST_DELAY)

        except Exception as e:
            self.logger.error(f"Error scraping Industrial Products: {e}")

        return products

    def scrape_all_sites(self, product_keywords: List[str]) -> List[Dict]:
        """Scrape all configured websites for the given product keywords"""
        all_products = []

        # Scrape Source 4 Industries
        source4_products = self.scrape_source4industries(product_keywords)
        all_products.extend(source4_products)

        # Scrape Ace Industries
        ace_products = self.scrape_aceindustries(product_keywords)
        all_products.extend(ace_products)

        # Scrape Industrial Products
        industrial_products = self.scrape_industrialproducts(product_keywords)
        all_products.extend(industrial_products)

        self.logger.info(f"Total products found: {len(all_products)}")

        # Log sample of found products for debugging
        if all_products:
            self.logger.info("Sample products found:")
            for product in all_products[:3]:
                self.logger.info(f"  - {product['name']}: ${product['price']:.2f} ({product['site']})")

        return all_products