"""
Test script to validate improved scraping patterns for Handle-It products
"""

from improved_scraper import ImprovedPriceScraper
import logging

def test_scraping():
    """Test the improved scraper with specific Handle-It product searches"""

    # Set up logging
    logging.basicConfig(level=logging.INFO)
    logger = logging.getLogger(__name__)

    print("Testing Improved Scraping Patterns for Handle-It Products")
    print("=" * 60)

    scraper = ImprovedPriceScraper()

    # Test different search terms
    test_searches = [
        ['handle-it'],
        ['pedestrian gate'],
        ['adjustable pedestrian gate'],
        ['electric hoist'],
        ['hand chain hoist']
    ]

    for i, keywords in enumerate(test_searches, 1):
        print(f"\n{i}. Testing search: {', '.join(keywords)}")
        print("-" * 40)

        try:
            # Test each site individually
            print("Source 4 Industries:")
            source4_products = scraper.scrape_source4industries(keywords)
            if source4_products:
                for product in source4_products[:3]:  # Show first 3
                    print(f"  ✓ {product['name']} - ${product['price']:.2f}")
            else:
                print("  No products found")

            print("\nAce Industries:")
            ace_products = scraper.scrape_aceindustries(keywords)
            if ace_products:
                for product in ace_products[:3]:  # Show first 3
                    print(f"  ✓ {product['name']} - ${product['price']:.2f}")
            else:
                print("  No products found")

            print("\nIndustrial Products:")
            industrial_products = scraper.scrape_industrialproducts(keywords)
            if industrial_products:
                for product in industrial_products[:3]:  # Show first 3
                    print(f"  ✓ {product['name']} - ${product['price']:.2f}")
            else:
                print("  No products found")

            # Summary for this search
            total_found = len(source4_products) + len(ace_products) + len(industrial_products)
            print(f"\nTotal products found for '{', '.join(keywords)}': {total_found}")

        except Exception as e:
            logger.error(f"Error testing search '{', '.join(keywords)}': {e}")

    print("\n" + "=" * 60)
    print("Testing complete!")

def test_specific_urls():
    """Test scraping with specific product URLs if available"""

    print("\nTesting Specific Handle-It Product URLs")
    print("=" * 40)

    # We can add specific URL testing here once we identify exact product pages
    specific_urls = [
        "https://source4industries.com/products/handle-it-adjustable-pedestrian-gate"
    ]

    scraper = ImprovedPriceScraper()

    for url in specific_urls:
        print(f"\nTesting URL: {url}")
        try:
            response = scraper.session.get(url)
            if response.status_code == 200:
                print("  ✓ URL accessible")
                # We could add specific product page parsing here
            else:
                print(f"  ✗ URL returned {response.status_code}")
        except Exception as e:
            print(f"  ✗ Error accessing URL: {e}")

if __name__ == "__main__":
    test_scraping()
    test_specific_urls()