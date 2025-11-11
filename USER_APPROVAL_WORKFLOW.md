# Ad Spend Processor - User Approval Workflow

## Your Workflow

You want **complete control** over which categories get added. Here's how it works:

### Step 1: Processing
```
Google Ads CSV + Bing Ads CSV + MASTER SKU
           ↓
      process_ad_data.py
      (Clean & standardize)
           ↓
   categorize_vendors_final.py
           ↓
    ┌──────┴──────────┐
    ↓                 ↓
100% MASTER SKU    Suggestions
Matches            (All others)
    ↓                 ↓
Upload Sheet    Review Tab
(Ready now)     (Your approval)
```

### Step 2: You Review & Approve
Open the **Product Category Suggestions** tab:
- Sorted by **Vendor (A-Z)**, then **Product Name (A-Z)**
- See Suggested Category + Confidence % for each
- Approve or reject each suggestion

### Step 3: Update MASTER SKU
Once approved, you add them to MASTER SKU:
```
SKU | PRODUCT CATEGORY | VENDOR
----|------------------|--------
EK25GB | Electric Forklifts | Ekko Lifts
CART-42 | Carts | B&P Manufacturing
```

### Step 4: Next Month
When you process next month, those approved items will be **100% MASTER SKU matches** and auto-appear in the upload sheet.

---

## Output Files

### Main Upload Sheet
**Filename:** `YYYY-MM Product Spend Upload.csv`

**Contains:** Only items with 100% MASTER SKU matches
- All columns per specification
- Ready to upload immediately
- No guesses

**Example:**
```
Month | SKU | Title | Vendor | Product Category | ...
2025-10 | EK25GB | EKKO EK25GB Electric Forklift | Ekko Lifts | Electric Forklifts | ...
```

### Suggestions Tab (For Your Review)
**Filename:** `YYYY-MM Product Category Suggestions.csv`

**Contains:** All items needing your approval
- **Sorted:** Vendor (A-Z), then Product Name (A-Z)
- **Columns:** All ad metrics + Suggested Category + Confidence %
- **Action Required:** You review each and decide

**Example:**
```
Vendor | Product Name | Suggested Category | Confidence % | Decision
Adrian's Safety Solutions | Cargo Net Assembly | Cargo Safety | 85% | ✅ Approve
Adrian's Safety Solutions | Safety Strap Kit | Pallet Rack Safety Straps | 72% | ✅ Approve
Adrian's Safety Solutions | Unknown Component | Cargo Safety | 38% | ❌ Reject
B&P Manufacturing | Blue Platform Cart | Carts | 95% | ✅ Approve
B&P Manufacturing | Dock Equipment System | Dock Plates | 45% | ? Research
```

---

## How to Review Suggestions

### 1. Open the Suggestions File
```
2025-10 Product Category Suggestions.csv
```

### 2. Scan by Vendor (Already Grouped)
```
Adrian's Safety Solutions (3 items)
├─ Cargo Net Assembly → Cargo Safety (85%)
├─ Safety Strap Kit → Pallet Rack Safety Straps (72%)
└─ Unknown Component → Cargo Safety (38%)

Apollо Forklift (5 items)
├─ Electric Pallet Jack → AF - Electric Pallet Jacks (92%)
├─ Manual Stacker → AF - Manual Stackers (88%)
...
```

### 3. Decision for Each Item

**Option A: Approve ✅**
- Suggested category looks correct
- Action: Add to MASTER SKU with that category

**Option B: Reject ❌**
- Suggested category is wrong
- Action: Leave blank, research manually later

**Option C: Modify**
- Suggested category is close but not quite
- Action: Change to correct category, add to MASTER SKU

**Option D: Research**
- Need more info from vendor
- Action: Defer, follow up with vendor

---

## Example: Full Review Session

### Items to Review (from suggestions file)

```
Vendor: Casters
├─ Heavy Duty Wheel Kit
│  └─ Suggested: Heavy Duty / Container (82%)
│  └─ YOU: ✅ Approve → Add to MASTER SKU
│
├─ Hospitality Cart Wheel
│  └─ Suggested: Bellman Casters (78%)
│  └─ YOU: ✅ Approve → Add to MASTER SKU
│
└─ Roller System Assembly
   └─ Suggested: General Casters (45%)
   └─ YOU: ❌ Reject → Too vague, research needed

Vendor: Ekko Lifts
├─ Electric Forklift Pro Model
│  └─ Suggested: Electric Forklifts (94%)
│  └─ YOU: ✅ Approve → Add to MASTER SKU
│
└─ Stacker Component Kit
   └─ Suggested: Other (22%)
   └─ YOU: ? Research → Need to confirm with vendor
```

### What You Send Back
```
Approved for MASTER SKU:
SKU | Product Category | Vendor
HW-WHEEL | Heavy Duty / Container | Casters
HOS-WHEEL | Bellman Casters | Casters
EKK-FORK | Electric Forklifts | Ekko Lifts
```

---

## Next Month Benefit

Once items are in MASTER SKU:

**BEFORE (First month):**
- SKU: UNKNOWN
- Suggestion: Electric Pallet Jacks (75%)
- Status: In review tab, needs your approval

**AFTER (Next month):**
- SKU: EK25GB
- Category lookup: Electric Pallet Jacks (from MASTER SKU)
- Confidence: 100%
- Status: Automatically in upload sheet, no review needed

---

## Key Points

✅ **No Guesses in Upload Sheet** - Only MASTER SKU matches
✅ **All Suggestions in Review Tab** - You see everything
✅ **Sorted for Easy Review** - Vendor (A-Z), Product (A-Z)
✅ **Confidence Scores Visible** - Know how confident each suggestion is
✅ **You Control Quality** - Approve before adding to MASTER SKU
✅ **Builds Over Time** - More MASTER SKU matches = fewer reviews each month

---

## File Columns

### Suggestions Tab Layout

| Column | From | Purpose |
|--------|------|---------|
| SKU | Ad data | Product identifier |
| Product Name | Title field | What you're reviewing |
| Vendor | Detected | Which vendor (sorted A-Z) |
| Platform | Ad data | Google Ads or Bing Ads |
| Price | Ad data | Reference info |
| Ad Spend | Ad data | Reference info |
| ... | Ad data | All original metrics |
| Suggested Category | Algorithm | What we think it is |
| Confidence % | Algorithm | How confident (0-100%) |

---

## Tips for Reviewing

1. **Start with highest confidence** - More likely to be correct
2. **Group by vendor** - Already sorted, easier to spot patterns
3. **Trust the algorithm more on specific categories**
   - "Electric Pallet Jacks" 90% = probably right ✓
   - "Carts" 45% = could be many things ✗
4. **Watch for pattern** - If algorithm keeps suggesting same category for vendor, it might know something
5. **Keep notes** - Track what gets approved/rejected to improve algorithm

---

## Updating MASTER SKU

Once you've reviewed and decided:

### Format for Updates
```CSV
SKU,PRODUCT CATEGORY,VENDOR
EK25GB,Electric Pallet Jacks,Ekko Lifts
CART-42,Carts,B&P Manufacturing
WHEEL-88,General Casters,Casters
```

### Add to MASTER SKU
- Add new rows to your MASTER SKU file
- Keep existing data
- Next month's processing will pick them up

### Result Next Month
When processing next month's ad data:
- Items with approved SKUs = automatic 100% match
- Skip review tab, go straight to upload sheet
- Time saved!

---

## Summary

Your workflow:
1. **Process data** → Two outputs
2. **Review suggestions** (sorted by Vendor, then Product)
3. **Approve/reject** each suggestion
4. **Add approved items** to MASTER SKU
5. **Next month** → Those items auto-appear in upload sheet

No guesses, full control, builds quality over time.
