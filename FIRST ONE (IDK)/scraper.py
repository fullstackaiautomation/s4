"""
Web scraping module for extracting pricing data from competitor websites
"""

import requests
from bs4 import BeautifulSoup
import time
import logging
from typing import List, Dict, Optional
import re
from urllib.parse import urljoin, quote
from config import WEBSITES, REQUEST_DELAY, TIMEOUT, USER_AGENT
from error_handler import retry_on_failure, error_handler

class PriceScraper:
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

        # Common price patterns
        price_patterns = [
            r'\$[\d,]+\.?\d*',  # $123.45 or $1,234
            r'[\d,]+\.?\d*\s*(?:USD|usd|\$)',  # 123.45 USD
            r'Price:\s*\$?[\d,]+\.?\d*',  # Price: $123.45
            r'Cost:\s*\$?[\d,]+\.?\d*',   # Cost: $123.45
        ]

        for pattern in price_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            if matches:
                # Extract numeric value from the first match
                price_str = re.sub(r'[^\d.]', '', matches[0])
                try:
                    return float(price_str)
                except ValueError:
                    continue

        return None

    @retry_on_failure(max_retries=2, delay=2.0)
    def scrape_source4industries(self, product_keywords: List[str]) -> List[Dict]:
        """Scrape pricing data from Source 4 Industries"""
        products = []

        try:
            for keyword in product_keywords:
                self.logger.info(f"Searching Source 4 Industries for: {keyword}")

                # Search for the product
                search_url = f"{WEBSITES['source4industries']['search_url']}?q={quote(keyword)}"
                response = self.session.get(search_url, timeout=TIMEOUT)
                response.raise_for_status()

                soup = BeautifulSoup(response.content, 'html.parser')

                # Look for product listings (this will need to be adjusted based on actual HTML structure)
                product_elements = soup.find_all(['div', 'article'], class_=re.compile(r'product|item', re.I))

                for element in product_elements[:5]:  # Limit to first 5 results
                    try:
                        # Extract product name
                        name_elem = element.find(['h1', 'h2', 'h3', 'h4'], class_=re.compile(r'title|name|product', re.I))
                        if not name_elem:
                            name_elem = element.find(['a'], title=True)

                        name = name_elem.get_text(strip=True) if name_elem else f"Product for {keyword}"

                        # Extract price
                        price_elem = element.find(['span', 'div'], class_=re.compile(r'price|cost', re.I))
                        if not price_elem:
                            price_elem = element.find(text=re.compile(r'\$[\d,]+\.?\d*'))

                        price_text = price_elem.get_text(strip=True) if hasattr(price_elem, 'get_text') else str(price_elem)
                        price_text = error_handler.sanitize_price_text(price_text)
                        price = self.extract_price_from_text(price_text)

                        # Extract product URL
                        url_elem = element.find('a', href=True)
                        product_url = urljoin(WEBSITES['source4industries']['base_url'], url_elem['href']) if url_elem else None

                        if price:
                            products.append({
                                'name': name,
                                'price': price,
                                'url': product_url,
                                'site': 'Source 4 Industries',
                                'keyword': keyword
                            })

                    except Exception as e:
                        self.logger.warning(f"Error parsing product element: {e}")
                        continue

                time.sleep(REQUEST_DELAY)

        except Exception as e:
            self.logger.error(f"Error scraping Source 4 Industries: {e}")

        return products

    def scrape_aceindustries(self, product_keywords: List[str]) -> List[Dict]:
        """Scrape pricing data from Ace Industries"""
        products = []

        try:
            for keyword in product_keywords:
                self.logger.info(f"Searching Ace Industries for: {keyword}")

                # Try different search approaches
                search_urls = [
                    f"{WEBSITES['aceindustries']['base_url']}/search?q={quote(keyword)}",
                    f"{WEBSITES['aceindustries']['base_url']}/products?search={quote(keyword)}"
                ]

                for search_url in search_urls:
                    try:
                        response = self.session.get(search_url, timeout=TIMEOUT)
                        response.raise_for_status()

                        soup = BeautifulSoup(response.content, 'html.parser')

                        # Look for product listings
                        product_elements = soup.find_all(['div', 'article'], class_=re.compile(r'product|item', re.I))

                        for element in product_elements[:3]:  # Limit to first 3 results
                            try:
                                # Extract product name
                                name_elem = element.find(['h1', 'h2', 'h3', 'h4'])
                                name = name_elem.get_text(strip=True) if name_elem else f"Product for {keyword}"

                                # Extract price
                                price_elem = element.find(['span', 'div'], class_=re.compile(r'price|cost', re.I))
                                if price_elem:
                                    price_text = price_elem.get_text(strip=True)
                                    price = self.extract_price_from_text(price_text)

                                    if price:
                                        products.append({
                                            'name': name,
                                            'price': price,
                                            'url': search_url,
                                            'site': 'Ace Industries',
                                            'keyword': keyword
                                        })

                            except Exception as e:
                                self.logger.warning(f"Error parsing Ace Industries product: {e}")
                                continue

                        if products:  # If we found products, break from search URL loop
                            break

                    except Exception as e:
                        self.logger.warning(f"Error with search URL {search_url}: {e}")
                        continue

                time.sleep(REQUEST_DELAY)

        except Exception as e:
            self.logger.error(f"Error scraping Ace Industries: {e}")

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

        self.logger.info(f"Total products found: {len(all_products)}")
        return all_products