"""
Advanced web scraper with proper JSON parsing for Shopify-based sites
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

class AdvancedPriceScraper:
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
            r'"amount":\s*"?(\d+(?:\.\d{2})?)"?',  # JSON format: "amount": "123.45"
            r'(\d+(?:\.\d{2})?)',  # Just numbers: 123.45
        ]

        for pattern in price_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            if matches:
                try:
                    # Remove commas and convert to float
                    price_str = matches[0].replace(',', '')
                    price = float(price_str)
                    # Reasonable price validation (between $0.01 and $100,000)
                    if 0.01 <= price <= 100000:
                        return price
                except ValueError:
                    continue

        return None

    def extract_shopify_search_results(self, response_text: str) -> List[Dict]:
        """Extract product data from Shopify search results page"""
        products = []

        # Look for the main product data in JavaScript
        # Pattern 1: Search for window.BOLD or similar product data
        js_patterns = [
            r'window\.BOLD\s*=\s*({.*?});',
            r'window\.productVariants\s*=\s*(\[.*?\]);',
            r'"products":\s*(\[.*?\])',
            r'"product":\s*({.*?})',
        ]

        for pattern in js_patterns:
            matches = re.findall(pattern, response_text, re.DOTALL | re.IGNORECASE)
            for match in matches:
                try:
                    data = json.loads(match)
                    if isinstance(data, list):
                        products.extend(self.parse_product_list(data))
                    elif isinstance(data, dict) and 'products' in data:
                        products.extend(self.parse_product_list(data['products']))
                    elif isinstance(data, dict):
                        products.append(self.parse_single_product(data))
                except json.JSONDecodeError:
                    continue

        # Pattern 2: Look for individual product objects in script tags
        # This pattern finds objects with title and price
        product_pattern = r'\\*"title\\*":\\s*\\*"([^"]+)\\*"[^}]*\\*"price\\*":\\s*(\\*"?[\d.]+\\*"?)'
        title_price_matches = re.findall(product_pattern, response_text)

        for title, price in title_price_matches:
            # Clean up the title and price
            clean_title = title.replace('\\"', '"').replace('\\/', '/')
            clean_price = price.replace('\\"', '').replace('\\', '')

            parsed_price = self.extract_price_from_text(clean_price)
            if parsed_price and clean_title:
                products.append({
                    'title': clean_title,
                    'price': parsed_price,
                    'url': '',  # We'll need to construct this
                })

        # Pattern 3: Look for more structured product data
        # Search for arrays of product objects
        structured_pattern = r'(\[{[^[\]]*"title"[^[\]]*"price"[^[\]]*}\])'
        struct_matches = re.findall(structured_pattern, response_text, re.DOTALL)

        for match in struct_matches:
            try:
                # Clean up the JSON
                clean_json = match.replace('\\"', '"').replace('\\/', '/')
                data = json.loads(clean_json)
                products.extend(self.parse_product_list(data))
            except json.JSONDecodeError:
                continue

        return products

    def parse_product_list(self, product_list: List[Dict]) -> List[Dict]:
        """Parse a list of product dictionaries"""
        parsed_products = []

        for product in product_list:
            parsed = self.parse_single_product(product)
            if parsed:
                parsed_products.append(parsed)

        return parsed_products

    def parse_single_product(self, product: Dict) -> Optional[Dict]:
        """Parse a single product dictionary"""
        try:
            title = product.get('title', '')
            if not title:
                return None

            # Try different price field names
            price = None
            price_fields = ['price', 'amount', 'price_min', 'price_max', 'compare_at_price']

            for field in price_fields:
                if field in product:
                    price_value = product[field]
                    if isinstance(price_value, (int, float)):
                        price = float(price_value)
                        break
                    elif isinstance(price_value, str):
                        price = self.extract_price_from_text(price_value)
                        if price:
                            break
                    elif isinstance(price_value, dict) and 'amount' in price_value:
                        price = self.extract_price_from_text(str(price_value['amount']))
                        if price:
                            break

            # Try variants if no main price found
            if not price and 'variants' in product:
                for variant in product['variants']:
                    if 'price' in variant:
                        price = self.extract_price_from_text(str(variant['price']))
                        if price:
                            break

            if price and title:
                url = product.get('url', '')
                return {
                    'title': title,
                    'price': price,
                    'url': url
                }

        except Exception as e:
            self.logger.warning(f"Error parsing product: {e}")

        return None

    @retry_on_failure(max_retries=2, delay=2.0)
    def scrape_source4industries(self, product_keywords: List[str]) -> List[Dict]:
        """Scrape Source 4 Industries with advanced JSON parsing"""
        products = []

        try:
            for keyword in product_keywords:
                self.logger.info(f"Searching Source 4 Industries for: {keyword}")

                search_url = f"{WEBSITES['source4industries']['search_url']}?q={quote(keyword)}"
                response = self.session.get(search_url, timeout=TIMEOUT)
                response.raise_for_status()

                # Extract products from the response
                shopify_products = self.extract_shopify_search_results(response.text)

                # Convert to our standard format
                for product in shopify_products:
                    product_url = product.get('url', '')
                    if product_url and not product_url.startswith('http'):
                        product_url = urljoin(WEBSITES['source4industries']['base_url'], product_url)

                    products.append({
                        'name': product['title'],
                        'price': product['price'],
                        'url': product_url,
                        'site': 'Source 4 Industries',
                        'keyword': keyword
                    })

                self.logger.info(f"Found {len(shopify_products)} products for '{keyword}' on Source 4 Industries")
                time.sleep(REQUEST_DELAY)

        except Exception as e:
            error_handler.handle_scraping_error(search_url, e)
            self.logger.error(f"Error scraping Source 4 Industries: {e}")

        return products

    @retry_on_failure(max_retries=2, delay=2.0)
    def scrape_aceindustries(self, product_keywords: List[str]) -> List[Dict]:
        """Scrape Ace Industries with improved pattern matching"""
        products = []

        try:
            for keyword in product_keywords:
                self.logger.info(f"Searching Ace Industries for: {keyword}")

                search_url = f"{WEBSITES['aceindustries']['search_url']}?search={quote(keyword)}"
                response = self.session.get(search_url, timeout=TIMEOUT)
                response.raise_for_status()

                soup = BeautifulSoup(response.content, 'html.parser')

                # Look for product containers with various selectors
                product_selectors = [
                    '.product-item',
                    '.product',
                    '.search-result-item',
                    '.item',
                    '[data-product]',
                    '.result'
                ]

                found_products = False
                for selector in product_selectors:
                    elements = soup.select(selector)
                    if elements:
                        self.logger.info(f"Found {len(elements)} elements with selector '{selector}' on Ace Industries")
                        found_products = True

                        for element in elements[:5]:  # Limit to first 5
                            product_data = self.parse_ace_product_element(element, keyword)
                            if product_data:
                                products.append(product_data)

                if not found_products:
                    self.logger.info(f"No product elements found for '{keyword}' on Ace Industries - may need different selectors")

                time.sleep(REQUEST_DELAY)

        except Exception as e:
            error_handler.handle_scraping_error(search_url, e)
            self.logger.error(f"Error scraping Ace Industries: {e}")

        return products

    def parse_ace_product_element(self, element, keyword: str) -> Optional[Dict]:
        """Parse product element from Ace Industries"""
        try:
            # Look for product name
            name_selectors = ['h3', 'h2', 'h4', '.title', '.product-title', '.name', 'a[title]']
            name = None

            for selector in name_selectors:
                name_elem = element.select_one(selector)
                if name_elem:
                    name = name_elem.get_text(strip=True) or name_elem.get('title', '')
                    if name and len(name) > 3:  # Valid name
                        break

            # Look for price
            price_selectors = ['.price', '.cost', '.amount', '[data-price]', '.money']
            price = None

            for selector in price_selectors:
                price_elem = element.select_one(selector)
                if price_elem:
                    price_text = price_elem.get_text(strip=True)
                    price = self.extract_price_from_text(price_text)
                    if price:
                        break

            # Look for URL
            url_elem = element.select_one('a[href]')
            product_url = None
            if url_elem:
                href = url_elem.get('href', '')
                if href:
                    product_url = urljoin(WEBSITES['aceindustries']['base_url'], href)

            if name and price:
                return {
                    'name': name,
                    'price': price,
                    'url': product_url,
                    'site': 'Ace Industries',
                    'keyword': keyword
                }

        except Exception as e:
            self.logger.warning(f"Error parsing Ace Industries product element: {e}")

        return None

    def scrape_all_sites(self, product_keywords: List[str]) -> List[Dict]:
        """Scrape all configured websites for the given product keywords"""
        all_products = []

        # Scrape Source 4 Industries
        source4_products = self.scrape_source4industries(product_keywords)
        all_products.extend(source4_products)

        # Scrape Ace Industries
        ace_products = self.scrape_aceindustries(product_keywords)
        all_products.extend(ace_products)

        # Note: Industrial Products is blocked (403), so we skip it

        self.logger.info(f"Total products found: {len(all_products)}")

        # Log sample of found products for debugging
        if all_products:
            self.logger.info("Sample products found:")
            for product in all_products[:5]:
                self.logger.info(f"  - {product['name']} - ${product['price']:.2f} ({product['site']})")

        return all_products