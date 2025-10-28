"""
Test the advanced scraper to validate Handle-It product extraction
"""

from advanced_scraper import AdvancedPriceScraper

def test_advanced_scraper():
    """Test the advanced scraper with Handle-It products"""
    print("Testing Advanced Scraper for Handle-It Products")
    print("=" * 50)

    scraper = AdvancedPriceScraper()

    # Test with Handle-It specific searches
    test_keywords = [
        ['handle-it'],
        ['pedestrian gate'],
    ]

    for keywords in test_keywords:
        print(f"\nTesting keywords: {keywords}")
        print("-" * 30)

        # Test Source 4 Industries
        print("Source 4 Industries:")
        try:
            products = scraper.scrape_source4industries(keywords)
            if products:
                print(f"  Found {len(products)} products:")
                for i, product in enumerate(products[:5], 1):  # Show first 5
                    print(f"    {i}. {product['name']} - ${product['price']:.2f}")
                    if product['url']:
                        print(f"       URL: {product['url']}")
            else:
                print("  No products found")
        except Exception as e:
            print(f"  Error: {e}")

        # Test Ace Industries
        print("\nAce Industries:")
        try:
            products = scraper.scrape_aceindustries(keywords)
            if products:
                print(f"  Found {len(products)} products:")
                for i, product in enumerate(products[:5], 1):  # Show first 5
                    print(f"    {i}. {product['name']} - ${product['price']:.2f}")
            else:
                print("  No products found")
        except Exception as e:
            print(f"  Error: {e}")

    print("\n" + "=" * 50)
    print("Test completed!")

if __name__ == "__main__":
    test_advanced_scraper()