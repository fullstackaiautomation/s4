# Generate Reports - Integration with New Suggestions File

## What Needs to Change in generate_reports.py

The `generate_reports.py` script is responsible for creating output files. With the new categorization approach, it needs to also generate the suggestions file.

### Current Function (Generate Reports)

```python
def export_monthly_report(vendor_report, category_report,
                         vendor_category_matrix, output_path, month_name=None):
    """Export all reports to an Excel file"""
    with pd.ExcelWriter(output_path, engine='openpyxl') as writer:
        vendor_report.to_excel(writer, sheet_name='Vendor Spend', index=False)
        category_report.to_excel(writer, sheet_name='Category Spend', index=False)
        vendor_category_matrix.to_excel(writer, sheet_name='Vendor x Category')
```

### Updated Function (Needed)

```python
def export_category_suggestions(low_conf_df, month, output_dir):
    """
    Export the product category suggestions file for review.

    Args:
        low_conf_df: DataFrame from auto_categorize_blanks()[1] (low confidence items)
        month: Month string (e.g., "2025-10")
        output_dir: Directory to save file

    Returns:
        Filename of saved suggestions file
    """

    # Filter to only needed columns
    suggestions = low_conf_df[[
        'Month', 'Platform', 'SKU', 'Title', 'Vendor', 'Price',
        'Ad Spend', 'Impressions', 'Clicks', 'CTR', 'Avg. CPC',
        'Conversions', 'Revenue', 'Impression share',
        'Impression share lost to rank', 'Absolute top impression share',
        'Suggested_Category', 'Confidence'
    ]].copy()

    # Sort by confidence (descending) - MEDIUM first
    suggestions = suggestions.sort_values('Confidence_Score', ascending=False)

    # Create filename
    output_file = f"{output_dir}/{month} Product Category Suggestions.csv"

    # Export with formatting
    suggestions.to_csv(output_file, index=False, encoding='utf-8')

    print(f"Suggestions exported: {output_file}")
    print(f"  Medium confidence: {len(suggestions[suggestions['Confidence'] >= '40%'])}")
    print(f"  Low confidence: {len(suggestions[suggestions['Confidence'] < '40%'])}")

    return output_file
```

---

## Full Updated Workflow in generate_reports.py

### Current Flow
```
process_ad_data.py → generate_reports.py
                     └─ Vendor Spend Report
                     └─ Category Spend Report
                     └─ Vendor x Category Matrix
```

### New Flow
```
process_ad_data.py → categorize_vendors_improved.py
                     ├─ high_conf_df (ready to upload)
                     └─ low_conf_df (needs review)
                            ↓
                     generate_reports.py
                     ├─ Main upload sheet
                     │  └─ Uses high_conf_df
                     ├─ Suggestions file ← NEW
                     │  └─ Uses low_conf_df
                     ├─ Vendor Spend Report
                     ├─ Category Spend Report
                     └─ Vendor x Category Matrix
```

---

## Integration Code

### In main processing script (pseudo-code)

```python
# Step 1: Process data
from process_ad_data import clean_and_combine
combined_data = clean_and_combine(google_csv, bing_csv)

# Step 2: Find items needing categorization
from categorize_vendors_improved import find_blank_categories
items_to_categorize = find_blank_categories(combined_data)

# Step 3: Generate suggestions & split by confidence
from categorize_vendors_improved import auto_categorize_blanks
high_conf, low_conf = auto_categorize_blanks(items_to_categorize, master_sku)

# Step 4: Merge high confidence back to main data
final_upload_data = pd.concat([
    combined_data[~combined_data.index.isin(items_to_categorize.index)],
    high_conf
])

# Step 5: Generate all reports
from generate_reports import (
    export_category_suggestions,
    generate_vendor_spend_report,
    export_monthly_report
)

# Save suggestions file
export_category_suggestions(low_conf, month="2025-10", output_dir="./outputs")

# Generate other reports (existing functionality)
vendor_report = generate_vendor_spend_report(final_upload_data)
category_report = generate_category_spend_report(final_upload_data)
# ... etc ...

# Save main upload sheet
final_upload_data.to_csv(f"2025-10 Product Spend Upload.csv", index=False)
```

---

## Output Files Generated

### Before (Original)
```
outputs/
├── 2025-10 Product Spend Upload.csv (includes guesses)
├── 2025-10 Missing SKUs.csv
├── 2025-10 Missing Product Categories.csv (blanks only)
└── monthly_ad_spend_report.xlsx
```

### After (Improved)
```
outputs/
├── 2025-10 Product Spend Upload.csv (HIGH confidence only)
├── 2025-10 Product Category Suggestions.csv ← NEW (MEDIUM/LOW with suggestions)
├── 2025-10 Missing SKUs.csv (unchanged)
├── 2025-10 Missing Product Categories.csv (unchanged, if keeping for legacy)
└── monthly_ad_spend_report.xlsx (unchanged)
```

---

## Suggestions File Format

### CSV Structure
```csv
Month,Platform,SKU,Title,Vendor,Price,Ad Spend,Impressions,Clicks,CTR,Avg. CPC,
Conversions,Revenue,Impression share,Impression share lost to rank,Absolute top impression share,
Suggested_Category,Confidence
2025-10,Google Ads,EK25GB,EKKO EK25GB Electric Forklift,Ekko Lifts,30799.00,45.82,125,8,6.40%,5.73,2.00,61.50,45.50%,23.14%,12.89%,Electric Forklifts,75%
2025-10,Bing Ads,CART-42,Blue Platform Cart System,B&P,1299.00,23.45,89,5,5.62%,4.69,0.00,0.00,,,,Carts,52%
```

### Column Explanation

| Column | Purpose | Example |
|--------|---------|---------|
| Month-Vendor | Identifiers | See above |
| Price...Revenue | Ad metrics | From original data |
| **Suggested_Category** | AI suggestion | "Electric Forklifts" |
| **Confidence** | % confidence | "75%" or "52%" |

---

## Processing the Suggestions File

### User's Decision Process

1. Open `2025-10 Product Category Suggestions.csv`
2. Review items sorted by confidence (MEDIUM confidence first)
3. For each row, decide:
   - ✅ Accept suggestion → Copy category to upload sheet
   - ✗ Reject suggestion → Leave blank, note for manual review
   - 🔍 Research → Investigate vendor/product for correct category

### Example: User Reviews Medium Confidence Items

```
Item 1: "Pallet Equipment" → Suggested: "Pallet Jacks" (52%)
  ✅ Decide: Actually it's a pallet rack system → Change to "Pallet Rack"

Item 2: "Cart System Kit" → Suggested: "Carts" (48%)
  ✅ Decide: Correct, accept as-is

Item 3: "Component Assembly" → Suggested: "Accessories" (25%)
  ✗ Decide: Too vague, needs more info from vendor → Leave blank
```

4. Update upload sheet with approved categories
5. Submit upload sheet with all approved items

---

## Error Handling

### What If the Suggestions File is Large?

If you have many MEDIUM/LOW confidence items, filter to focus on highest-value products:

```python
# Filter to just high-value items
high_value = low_conf_df[low_conf_df['Ad Spend'] > 50].copy()
high_value.to_csv(f"{month} Product Category Suggestions - High Value Only.csv")

# Or filter to just MEDIUM confidence (skip LOW)
medium_only = low_conf_df[low_conf_df['Confidence_Score'] >= 0.4].copy()
medium_only.to_csv(f"{month} Product Category Suggestions - Medium Confidence.csv")
```

### What If Confidence Scores Seem Wrong?

Adjust the keyword scoring algorithm in `categorize_vendors.py`:

```python
def suggest_product_category(row, master_sku_df=None):
    # ... existing code ...

    # Current: confidence = min(max_score / 3.0, 1.0)
    # Option 1: More conservative (require higher match)
    confidence = min(max_score / 5.0, 1.0)  # Stricter

    # Option 2: More aggressive (accept lower match)
    confidence = min(max_score / 2.0, 1.0)  # Looser

    return best_category, confidence
```

---

## Summary

The updated workflow adds one new CSV output file with:
- All items needing category review
- AI suggestion for each item
- Confidence % for each suggestion
- Sorted MEDIUM-first for efficient review
- All original ad metrics included for context

This enables a clear **Approve/Reject** workflow instead of manual guessing.
