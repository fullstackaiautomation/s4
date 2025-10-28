"""
Extract and analyze the exact JSON structure from Source 4 Industries
"""

import requests
import json
import re
from bs4 import BeautifulSoup

def extract_source4_json():
    """Extract JSON data from Source 4 Industries search page"""
    session = requests.Session()
    session.headers.update({
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    })

    search_url = "https://source4industries.com/search?q=handle-it"
    print(f"Extracting JSON from: {search_url}")

    try:
        response = session.get(search_url)
        soup = BeautifulSoup(response.content, 'html.parser')

        print("Looking for JSON in script tags...")

        # Check all script tags
        for i, script in enumerate(soup.find_all('script')):
            if script.string:
                script_content = script.string

                # Look for product data patterns
                if 'handle-it' in script_content.lower() or 'handle it' in script_content.lower():
                    print(f"\nScript {i} contains 'handle-it':")
                    print("First 500 characters:")
                    print(script_content[:500])
                    print("...")

                    # Try to find specific JSON structures
                    json_patterns = [
                        r'"products":\s*(\[.*?\])',
                        r'"results":\s*(\[.*?\])',
                        r'window\.searchResults\s*=\s*(\[.*?\]);',
                        r'window\.productData\s*=\s*(\[.*?\]);',
                    ]

                    for pattern in json_patterns:
                        matches = re.findall(pattern, script_content, re.DOTALL)
                        if matches:
                            print(f"\nFound JSON pattern: {pattern}")
                            for j, match in enumerate(matches[:2]):  # Show first 2 matches
                                print(f"Match {j+1}: {match[:200]}...")
                                try:
                                    parsed = json.loads(match)
                                    print(f"Successfully parsed JSON with {len(parsed)} items")
                                    if len(parsed) > 0:
                                        print(f"First item keys: {list(parsed[0].keys())}")
                                        if 'title' in parsed[0]:
                                            print(f"First title: {parsed[0]['title']}")
                                        if 'price' in parsed[0]:
                                            print(f"First price: {parsed[0]['price']}")
                                except json.JSONDecodeError as e:
                                    print(f"JSON decode error: {e}")

        # Also look for direct product object patterns
        print("\n" + "="*50)
        print("Looking for individual product objects...")

        # Pattern for individual products
        product_objects = re.findall(r'\{[^{}]*"title"[^{}]*"price"[^{}]*\}', response.text)
        print(f"Found {len(product_objects)} individual product objects")

        for i, obj in enumerate(product_objects[:3]):  # Show first 3
            print(f"\nProduct object {i+1}:")
            print(obj[:300] + "..." if len(obj) > 300 else obj)

            # Try to clean and parse
            try:
                # Basic cleanup
                clean_obj = obj.replace('\\"', '"').replace('\\/', '/')
                parsed = json.loads(clean_obj)
                print(f"Parsed - Title: {parsed.get('title', 'N/A')}, Price: {parsed.get('price', 'N/A')}")
            except:
                print("Could not parse this object")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    extract_source4_json()