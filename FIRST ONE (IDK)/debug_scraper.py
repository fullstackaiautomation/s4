"""
Debug script to understand why scraping isn't finding products
"""

import requests
from bs4 import BeautifulSoup
import json
import re
from urllib.parse import quote

def debug_source4industries():
    """Debug Source 4 Industries scraping"""
    print("Debugging Source 4 Industries")
    print("=" * 40)

    session = requests.Session()
    session.headers.update({
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    })

    # Test with known Handle-It search
    search_url = "https://source4industries.com/search?q=handle-it"
    print(f"Testing URL: {search_url}")

    try:
        response = session.get(search_url)
        print(f"Response status: {response.status_code}")
        print(f"Response length: {len(response.text)} characters")

        soup = BeautifulSoup(response.content, 'html.parser')

        # Look for any product-related elements
        print("\nLooking for product elements...")

        # Check for common product selectors
        selectors = [
            '[data-product-id]',
            '.product-item',
            '.product-card',
            '.grid-product',
            '.product',
            '.search-result-item'
        ]

        for selector in selectors:
            elements = soup.select(selector)
            if elements:
                print(f"Found {len(elements)} elements with selector '{selector}'")
                if len(elements) > 0:
                    print(f"First element HTML: {str(elements[0])[:200]}...")

        # Look for JSON data in scripts
        print("\nLooking for JSON data in script tags...")
        scripts = soup.find_all('script')
        json_found = False

        for i, script in enumerate(scripts):
            if script.string:
                script_content = script.string
                # Look for product-related JSON
                if 'product' in script_content.lower() and ('"title"' in script_content or '"price"' in script_content):
                    print(f"Found potential product JSON in script {i}:")
                    # Try to find JSON objects
                    json_pattern = r'\{[^{}]*"(?:title|price|amount)"[^{}]*\}'
                    matches = re.findall(json_pattern, script_content)
                    for match in matches[:3]:  # Show first 3 matches
                        print(f"  JSON match: {match[:150]}...")
                        json_found = True

        if not json_found:
            print("No product JSON found in script tags")

        # Look for search results indication
        if "results found" in response.text or "results for" in response.text:
            print("Found search results text in page")
            # Extract the results count
            count_pattern = r'(\d+)\s+results?\s+(?:found\s+)?for'
            count_match = re.search(count_pattern, response.text, re.IGNORECASE)
            if count_match:
                print(f"Results count: {count_match.group(1)}")
        else:
            print("No search results text found")

        # Check for specific Handle-It content
        if "handle-it" in response.text.lower() or "handle it" in response.text.lower():
            print("Found 'Handle-It' text in page content")
        else:
            print("No 'Handle-It' text found in page content")

    except Exception as e:
        print(f"Error debugging Source 4 Industries: {e}")

def debug_aceindustries():
    """Debug Ace Industries scraping"""
    print("\n\nDebugging Ace Industries")
    print("=" * 40)

    session = requests.Session()
    session.headers.update({
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    })

    # Test with electric hoist search
    search_url = "https://aceindustries.com/search.php?search=electric+hoist"
    print(f"Testing URL: {search_url}")

    try:
        response = session.get(search_url)
        print(f"Response status: {response.status_code}")
        print(f"Response length: {len(response.text)} characters")

        soup = BeautifulSoup(response.content, 'html.parser')

        # Look for product elements
        product_selectors = [
            '.product',
            '.product-item',
            '.search-result',
            '[data-product]'
        ]

        for selector in product_selectors:
            elements = soup.select(selector)
            if elements:
                print(f"Found {len(elements)} elements with selector '{selector}'")

        # Look for search results
        if "results" in response.text.lower():
            print("Found 'results' text in page")

        # Check title
        title = soup.find('title')
        if title:
            print(f"Page title: {title.get_text()}")

    except Exception as e:
        print(f"Error debugging Ace Industries: {e}")

if __name__ == "__main__":
    debug_source4industries()
    debug_aceindustries()