# Ad Spend Processor - Categorization Improvements

## Problem
The original `categorize_vendors.py` script was auto-assigning **ALL** category suggestions to the main upload sheet, including low-confidence guesses (below 40%). This meant products without clear category matches were being filled in with weak suggestions rather than flagged for manual review.

## Solution
Created **`categorize_vendors_improved.py`** with a smarter categorization strategy:

### Key Changes

#### 1. **Smart Confidence Thresholds**
- **HIGH (≥70%)**: Automatically assigned to main upload sheet ✅ Auto-assign
- **MEDIUM (40-69%)**: Routed to "Missing Product Categories" file for review 📋 Needs decision
- **LOW (<40%)**: Routed to "Missing Product Categories" file for review 📋 Needs decision
- **0% (No match)**: Stays blank, clearly needs manual assignment 🔍 Manual only

#### 2. **Improved Output Files**

**Before:**
- `YYYY-MM Product Spend Upload.csv` - Contains all guesses
- `YYYY-MM Missing Product Categories.csv` - Lists blanks only

**After:**
```
Main Upload Sheet:
└─ `YYYY-MM Product Spend Upload.csv`
   └─ Only HIGH confidence auto-assignments (≥70%)
   └─ Remaining blanks = truly unguessable items

Review Sheet:
└─ `YYYY-MM Product Category Suggestions.csv`
   ├─ All products with blank/guessed categories
   ├─ Suggested category from AI matching
   ├─ Confidence % shown
   └─ Sorted: MEDIUM first (more likely correct), then LOW
```

#### 3. **What Goes Where**

| Scenario | Confidence | Upload Sheet | Review Sheet | Notes |
|----------|-----------|--------------|--------------|-------|
| Perfect SKU match in MASTER | 100% | ✅ Auto-assign | - | High confidence from existing data |
| Strong keyword match | 70%+ | ✅ Auto-assign | - | e.g., "electric pallet jack" → "Electric Pallet Jacks" |
| Partial keyword match | 40-69% | ❌ Blank | ✅ Suggested: 52% | e.g., "pallet" could be many categories |
| Weak/generic keywords | <40% | ❌ Blank | ✅ Suggested: 25% | e.g., "cart" matches 6 different vendors |
| No keywords match | 0% | ❌ Blank | ✅ Show: "BLANK" 0% | Clear indication of data gap |

---

## How to Use the Improved Version

### Option 1: Replace Current Script (Recommended)
```bash
# Backup original
mv ad-spend-processor/scripts/categorize_vendors.py \
   ad-spend-processor/scripts/categorize_vendors_original_backup.py

# Use improved version
mv categorize_vendors_improved.py \
   ad-spend-processor/scripts/categorize_vendors.py
```

### Option 2: Side-by-Side Testing
Keep both and test the improved version first:
```python
# Test improved version
from categorize_vendors_improved import auto_categorize_blanks

high_conf, low_conf = auto_categorize_blanks(df, master_sku)
# high_conf: Ready to use in upload sheet
# low_conf: Review these before deciding
```

---

## New Output File Format: "Missing Product Categories"

**Filename:** `YYYY-MM Product Category Suggestions.csv`

**Columns:**
```
Month | Platform | SKU | Title | Vendor | Price | Ad Spend |
Impressions | Clicks | CTR | Avg. CPC | Conversions | Revenue |
Impression share | Impression share lost to rank |
Absolute top impression share | Suggested_Category | Confidence
```

**Sorted by:** Confidence (descending) - MEDIUM confidence first

**Example:**
```csv
Month,Platform,SKU,Title,Vendor,Suggested_Category,Confidence
2025-10,Google Ads,CART-42,"Blue Platform Cart",B&P,Carts,65%
2025-10,Google Ads,WHEEL-08,"Heavy Duty Wheel",Casters,General Casters,48%
2025-10,Google Ads,MISC-01,"Storage Solution",Unknown,BLANK,0%
```

---

## Workflow Changes

### Old Workflow ❌
1. Run processor
2. Get `YYYY-MM Product Spend Upload.csv`
3. Review entire upload sheet for incorrect guesses
4. Manually find and fix wrong categories
5. Check `YYYY-MM Missing Product Categories.csv` for blanks

### New Workflow ✅
1. Run processor
2. Get `YYYY-MM Product Spend Upload.csv` with only HIGH confidence
3. Check `YYYY-MM Product Category Suggestions.csv` for suggestions (confidence-sorted)
4. For each row: Accept suggestion or manually assign
5. Copy approved suggestions back to upload sheet

**Result:** Clear separation between "auto-approved" and "needs human decision"

---

## Confidence Score Logic

```
Keyword Match Score = Sum of word counts in matching keywords

Confidence = min(Match_Score / 3.0, 1.0) * 100%

Examples:
- "electric pallet jack" (3 words) = 100% confidence ✅ Auto-assign
- "pallet jack" (2 words) = 67% confidence 📋 Medium - review
- "pallet" (1 word) = 33% confidence 📋 Low - review
- No matches = 0% confidence 🔍 Manual only
```

---

## Benefits

✅ **Data Quality** - No weak guesses in final uploads
✅ **Audit Trail** - All suggestions visible with confidence scores
✅ **Efficiency** - Only review MEDIUM/LOW confidence items
✅ **Transparency** - Clear why each item was categorized
✅ **Flexibility** - Easy to approve or override suggestions

---

## Migration Checklist

- [ ] Review categorization logic (no changes to keyword matching)
- [ ] Test with sample month's data
- [ ] Verify HIGH confidence assignments are correct
- [ ] Check MEDIUM confidence suggestions for accuracy
- [ ] Update documentation to reflect new workflow
- [ ] Train team on new "Product Category Suggestions" file
- [ ] Archive old output format for reference
