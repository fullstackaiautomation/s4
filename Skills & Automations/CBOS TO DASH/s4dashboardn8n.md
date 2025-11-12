# CBOS to Dashboard Data Processing Workflow

## Overview

This workflow processes monthly CBOS (Source 4 Industries ERP) Sales Order Detail exports and transforms them into clean, formatted data ready for import into the Source 4 Industries main sales dashboard. The process includes data cleaning, SKU enrichment via Master SKU lookup, cost calculations, vendor/category assignment, margin analysis, and quality control checks.

---

## File Locations

### Input Files
- **Source Data:** `C:\Users\blkw\OneDrive\Documents\Github\Source 4 Industries\Ads Report\Dashboard\Monthly Imports\Sales_Order_Detail[timestamp].xlsx`
- **Template Structure:** `C:\Users\blkw\OneDrive\Documents\Github\Source 4 Industries\Ads Report\Dashboard\Monthly Imports\CBOS TO DASH.xlsx`
- **Master SKU Reference:** `C:\Users\blkw\OneDrive\Documents\Github\Source 4 Industries\Ads Report\SKU Documents\[Master SKU File]`

### Output Structure
Final export contains multiple tabs:
1. **READY TO IMPORT** - Clean data ready for dashboard import
2. **MISSING COSTS** - Rows with missing/zero cost data
3. **MISSING OVERALL CATEGORY** - Rows without overall product category
4. **MISSING PRODUCT CATEGORY - MAIN VENDORS** - Main vendor rows missing product category
5. **HIGH MARGIN ALERT** - Rows with ROI > 70%
6. **NEGATIVE/ZERO MARGIN ALERT** - Rows with ROI ≤ 0%

---

## Target Column Structure (A through AD)

| Column | Field Name | Description |
|--------|-----------|-------------|
| A | Customer | Business Partner name |
| B | Sales Rep | Sales representative |
| C | Order Type | Online or Local (derived) |
| D | Year-Month | YYYY-MM format |
| E | Date Ordered | Full order date |
| F | Order # | Invoice/Order number |
| G | SKU | Product Search Key |
| H | Product Name | Product description |
| I | Order Quantity | Quantity ordered |
| J | Sales Each | Unit price |
| K | Sales Total | Line amount |
| L | Cost Each | Unit cost (from Master SKU) |
| M | Cost Total | Total cost (Qty × Cost Each) |
| N | Vendor | Vendor name (from Master SKU) |
| O | Orders | Order percentage (proportional by invoice) |
| P | Shipping | Shipping amount (proportional) |
| Q | Discount | Discount amount (proportional) |
| R | Total Lines | Total line count |
| S | Invoice Total | Sales + Shipping - Discount |
| T | Profit Total | Sales - Cost - Discount |
| U | ROI | Profit ÷ Invoice (percentage) |
| V-X | *Reserved* | Additional fields |
| Y | Year | Extracted from date |
| Z | Tracked Month | Custom code (ZH, ZI, ZJ, etc.) |
| AA | State | 2-letter state/province abbreviation |
| AB | Region | USA or Canada |
| AC | User Email | Order user email |
| AD | Shipping Method | Shipper ID |

---

## Workflow Steps

### Step 1: File Upload & Initial Cleanup

**Input:** Sales Order Detail export from CBOS

**Raw File Structure:**
- Rows 1-11: Report parameters (Report Run Date, Client, Organization, Date Range, etc.)
- Row 12: Column headers
- Row 13+: Actual transaction data

**Action:** Delete rows 1-11 to clean data and start with headers

**Key Columns in Raw Data:**
- Business Partner
- Sales Rep
- Order
- Date Ordered
- Invoice #
- Search Key (SKU)
- Product Name
- Ordered Qty
- Unit Price
- Line Amt
- Partner Location (shipping address)
- User_Email
- c_orderline_m_shipper_id (shipping method)
- currentvendor_b_partner_ID
- c_orderline_c_charge_id
- c_order_c_activity_id
- Total Lines
- State
- Ad Spend (contains shipping/discount identifiers)

---

### Step 2: Delete Projects & Reorganize Columns

**Purpose:** Filter out unwanted rows and reorganize data into target column structure (A-AD)

**Code Node:** Delete Projects / Reorganize Columns

#### Filtering Logic

**Excluded Rows:**
1. Where `c_order_c_activity_id` = "Projects"
2. Where `Sales Rep` is one of:
   - KRISTI CROFFORD
   - MEL HEDGEPETH
   - CURT ROSS

#### Column Mapping & Business Logic

```javascript
// Column reordering + extra filtering for n8n Code node
const items = $input.all();
const filteredItems = [];

// names to exclude (case insensitive)
const excludedReps = new Set(['KRISTI CROFFORD', 'MEL HEDGEPETH', 'CURT ROSS']);

for (let item of items) {
  const data = item.json;
  
  // skip Projects rows
  if (data['c_order_c_activity_id'] === 'Projects') continue;
  
  // skip rows by Sales Rep
  const rep = (data['Sales Rep'] || '').toString().trim().toUpperCase();
  if (excludedReps.has(rep)) continue;
  
  // build reordered row
  const newRow = {
    A: data['Business Partner'] || '',
    B: data['Sales Rep'] || '',
    C: (() => {
      const order = (data['Order'] || '').toString();
      const salesRep = (data['Sales Rep'] || '').toString();
      if (salesRep === 'Michael Karuga') return 'Online';
      if (order.includes('#')) return 'Online';
      if (order.startsWith('C')) return 'Online';
      if (order.startsWith('SO')) return 'Local';
      return '';
    })(),
    D: data['Date Ordered']
      ? new Date(data['Date Ordered']).getFullYear()
        + '-' + (new Date(data['Date Ordered']).getMonth() + 1).toString().padStart(2, '0')
      : '',
    E: data['Date Ordered'] || '',
    F: data['Order'] || '',
    G: data['Search Key'] || '',
    H: data['Product Name'] || '',
    I: data['Ordered Qty'] || '',
    J: data['Unit Price'] || '',
    K: data['Line Amt'] || '',
    L: '',
    M: '',
    N: data['currentvendor_b_partner_ID'] || '',
    O: '',
    P: data['c_orderline_c_charge_id'] || '',
    Q: data['c_order_c_activity_id'] || '',
    R: data['Total Lines'] || '',
    // New columns added
    AA: data['Partner Location'] || '',        // Column AA = Shipping State
    AC: data['User_Email'] || '',               // Column AC = User Email  
    AD: data['c_orderline_m_shipper_id'] || ''  // Column AD = Shipping Method
  };
  
  item.json = newRow;
  filteredItems.push(item);
}

return filteredItems;
```

**Order Type Logic (Column C):**
- If Sales Rep = "Michael Karuga" → "Online"
- If Order contains "#" → "Online"
- If Order starts with "C" → "Online"
- If Order starts with "SO" → "Local"
- Otherwise → Empty

**Columns Populated:**
- A-K: Customer and transaction details
- L-M: Reserved for cost calculations (populated later)
- N: Vendor ID (preliminary)
- O-Q: Reserved for orders/shipping/discount (populated later)
- R: Total Lines
- AA: Shipping State (raw address, cleaned later)
- AC: User Email
- AD: Shipping Method

---

### Step 3: Calculate Orders, Shipping, Discounts & State Data

**Purpose:** Consolidate shipping and discount charges, distribute them proportionally across line items, and standardize state/region data

**Code Node:** Orders / Shipping / Discounts / States

#### Shipping & Discount Identification

**Shipping Terms** (identified in "Ad Spend" field, Column V):
- DELIVERY FEE
- FREIGHT CHARGED
- FREIGHT-NON TAX
- FREIGHT-Taxable
- SHIPPING CHARGED - NON-TAXABLE
- SHIPPING CHARGED - TAXABLE
- RESTOCKING FEE
- TAX, TARIFF, FREIGHT

**Discount Terms** (identified in "Ad Spend" field):
- DISCOUNT

#### Process Flow

**Step 3.1: First Pass - Collect Charges by Invoice**
- Scan all rows by Invoice # (Column F)
- Sum shipping charges from rows containing shipping terms
- Sum discount charges from rows containing discount terms
- Mark these rows for deletion (they're consolidated, not individual line items)

**Step 3.2: Calculate Invoice Totals**
- For each Invoice #, calculate total sales (excluding deleted shipping/discount rows)
- Store as `salesTotalByInvoice[invoiceNum]`

**Step 3.3: Proportional Distribution**
- For each remaining line item:
  - Calculate percentage: `lineSalesTotal ÷ invoiceTotalSales`
  - Apply to shipping: `shippingByInvoice[invoice] × percentage`
  - Apply to discount: `discountByInvoice[invoice] × percentage`

**Step 3.4: State/Region Processing**
- Parse "Partner Location" address field
- Extract 2-letter state abbreviation
- Determine region (USA or Canada)

#### State Abbreviation Logic

**Extraction Patterns:**
1. Look for "CITY, ST ZIP" pattern (regex: `,\s*([A-Z]{2})\s+\d{5}`)
2. Search for 2-letter state codes in address text
3. Fallback to state name lookup table

**Supported Regions:**
- **US States:** All 50 states + DC
- **Canadian Provinces:** AB, BC, MB, NB, NL, NT, NS, NU, ON, PE, QC, SK, YT

**Region Determination:**
- If state code in Canadian provinces list → "Canada"
- Otherwise → "USA"

#### Full Code

```javascript
// Consolidate shipping, discount, and restocking fee charges code for n8n
const items = $input.all();

// Define shipping and discount terms
const shippingTerms = ['DELIVERY FEE', 'FREIGHT CHARGED', 'FREIGHT-NON TAX', 'FREIGHT-Taxable', 'SHIPPING CHARGED - NON-TAXABLE', 'SHIPPING CHARGED - TAXABLE', 'RESTOCKING FEE', 'TAX, TARIFF, FREIGHT'];
const discountTerms = ['DISCOUNT'];

// State name to abbreviation mapping
const stateAbbreviations = {
  'ALABAMA': 'AL', 'ALASKA': 'AK', 'ARIZONA': 'AZ', 'ARKANSAS': 'AR', 'CALIFORNIA': 'CA',
  'COLORADO': 'CO', 'CONNECTICUT': 'CT', 'DELAWARE': 'DE', 'FLORIDA': 'FL', 'GEORGIA': 'GA',
  'HAWAII': 'HI', 'IDAHO': 'ID', 'ILLINOIS': 'IL', 'INDIANA': 'IN', 'IOWA': 'IA',
  'KANSAS': 'KS', 'KENTUCKY': 'KY', 'LOUISIANA': 'LA', 'MAINE': 'ME', 'MARYLAND': 'MD',
  'MASSACHUSETTS': 'MA', 'MICHIGAN': 'MI', 'MINNESOTA': 'MN', 'MISSISSIPPI': 'MS', 'MISSOURI': 'MO',
  'MONTANA': 'MT', 'NEBRASKA': 'NE', 'NEVADA': 'NV', 'NEW HAMPSHIRE': 'NH', 'NEW JERSEY': 'NJ',
  'NEW MEXICO': 'NM', 'NEW YORK': 'NY', 'NORTH CAROLINA': 'NC', 'NORTH DAKOTA': 'ND', 'OHIO': 'OH',
  'OKLAHOMA': 'OK', 'OREGON': 'OR', 'PENNSYLVANIA': 'PA', 'RHODE ISLAND': 'RI', 'SOUTH CAROLINA': 'SC',
  'SOUTH DAKOTA': 'SD', 'TENNESSEE': 'TN', 'TEXAS': 'TX', 'UTAH': 'UT', 'VERMONT': 'VT',
  'VIRGINIA': 'VA', 'WASHINGTON': 'WA', 'WEST VIRGINIA': 'WV', 'WISCONSIN': 'WI', 'WYOMING': 'WY',
  // Canadian provinces
  'ALBERTA': 'AB', 'BRITISH COLUMBIA': 'BC', 'MANITOBA': 'MB', 'NEW BRUNSWICK': 'NB',
  'NEWFOUNDLAND AND LABRADOR': 'NL', 'NORTHWEST TERRITORIES': 'NT', 'NOVA SCOTIA': 'NS',
  'NUNAVUT': 'NU', 'ONTARIO': 'ON', 'PRINCE EDWARD ISLAND': 'PE', 'QUEBEC': 'QC',
  'SASKATCHEWAN': 'SK', 'YUKON': 'YT'
};

// Canadian provinces/territories
const canadianProvinces = new Set(['AB', 'BC', 'MB', 'NB', 'NL', 'NT', 'NS', 'NU', 'ON', 'PE', 'QC', 'SK', 'YT']);

// Function to extract state abbreviation from full address
function extractStateFromAddress(addressString) {
  if (!addressString) return '';
  
  const address = addressString.toString().toUpperCase();
  
  // Look for state abbreviation patterns in the address
  // Common patterns: "CITY, ST ZIP" or "CITY, STATE ZIP"
  
  // First try to find 2-letter state codes followed by zip codes
  const stateRegex = /,\s*([A-Z]{2})\s+\d{5}/;
  const match = address.match(stateRegex);
  
  if (match) {
    return match[1]; // Return the 2-letter state code
  }
  
  // If no pattern found, try to find any 2-letter state abbreviation
  const allStates = ['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY','AB','BC','MB','NB','NL','NT','NS','NU','ON','PE','QC','SK','YT'];
  
  for (const state of allStates) {
    if (address.includes(` ${state} `) || address.includes(`,${state} `) || address.includes(`\n${state} `)) {
      return state;
    }
  }
  
  return ''; // Return empty if no state found
}

// Function to convert state name to abbreviation  
function getStateAbbreviation(stateName) {
  if (!stateName) return '';
  
  // First try to extract from address format
  const extracted = extractStateFromAddress(stateName);
  if (extracted) return extracted;
  
  // If not an address, process as before
  const upperState = stateName.toString().toUpperCase().trim();
  // If it's already an abbreviation, return as is
  if (upperState.length <= 3) return upperState;
  // Otherwise, look up the abbreviation
  return stateAbbreviations[upperState] || upperState;
}

// Function to determine region (USA or Canada)
function getRegion(stateAbbr) {
  if (!stateAbbr) return '';
  return canadianProvinces.has(stateAbbr) ? 'Canada' : 'USA';
}

// Step 1: First pass - collect shipping and discount amounts by Invoice #
const shippingByInvoice = {};
const discountByInvoice = {};
const rowsToDelete = [];

for (let i = 0; i < items.length; i++) {
  const data = items[i].json;
  const adSpend = (data['Ad Spend'] || '').toString().toUpperCase(); // Column V
  const invoiceNum = data['Invoice #']; // Column F
  const salesTotal = parseFloat(data['Sales Total']) || 0; // Column K
  
  // Check if this row contains shipping terms (including restocking fee)
  const isShipping = shippingTerms.some(term => adSpend.includes(term.toUpperCase()));
  
  // Check if this row contains discount terms  
  const isDiscount = discountTerms.some(term => adSpend.includes(term.toUpperCase()));
  
  if (isShipping) {
    // Add to shipping total for this invoice
    if (!shippingByInvoice[invoiceNum]) {
      shippingByInvoice[invoiceNum] = 0;
    }
    shippingByInvoice[invoiceNum] += salesTotal;
    rowsToDelete.push(i); // Mark for deletion
  } else if (isDiscount) {
    // Add to discount total for this invoice
    if (!discountByInvoice[invoiceNum]) {
      discountByInvoice[invoiceNum] = 0;
    }
    discountByInvoice[invoiceNum] += Math.abs(salesTotal);
    rowsToDelete.push(i); // Mark for deletion
  }
}

// Step 2: Calculate total sales by invoice and apply proportional amounts
const salesTotalByInvoice = {};
const finalItems = [];

// First, calculate total sales for each invoice (excluding deleted rows)
for (let i = 0; i < items.length; i++) {
  if (rowsToDelete.includes(i)) {
    continue;
  }
  
  const data = items[i].json;
  const invoiceNum = data['Invoice #'];
  const salesTotal = parseFloat(data['Sales Total']) || 0;
  
  if (!salesTotalByInvoice[invoiceNum]) {
    salesTotalByInvoice[invoiceNum] = 0;
  }
  salesTotalByInvoice[invoiceNum] += salesTotal;
}

// Then apply proportional amounts to each line item
for (let i = 0; i < items.length; i++) {
  // Skip rows marked for deletion
  if (rowsToDelete.includes(i)) {
    continue;
  }
  
  const data = items[i].json;
  const invoiceNum = data['Invoice #'];
  const lineSalesTotal = parseFloat(data['Sales Total']) || 0;
  const invoiceTotalSales = salesTotalByInvoice[invoiceNum] || 1;
  
  // Calculate percentage for this line (Column O)
  const orderPercentage = lineSalesTotal / invoiceTotalSales;
  
  // Apply percentage to shipping and discount amounts
  const shippingAmount = shippingByInvoice[invoiceNum] ? (shippingByInvoice[invoiceNum] * orderPercentage) : '';
  const discountAmount = discountByInvoice[invoiceNum] ? (discountByInvoice[invoiceNum] * orderPercentage) : '';
  
  // Process state abbreviation and region from the State field
  const stateAbbr = getStateAbbreviation(data.State || '');
  const region = getRegion(stateAbbr);
  
  // Add proportional amounts to columns O, P and Q, plus state/region info
  const newRow = {
    ...data,
    O: orderPercentage, // Column O = Orders (percentage)
    P: shippingAmount,  // Column P = Shipping (proportional) - now includes restocking fees
    Q: discountAmount,  // Column Q = Discount (proportional)
    AA: stateAbbr,      // Column AA = State abbreviation
    AB: region          // Column AB = Region (USA or Canada)
  };
  
  items[i].json = newRow;
  finalItems.push(items[i]);
}

return finalItems;
```

**Columns Updated:**
- **O:** Order Percentage (line item % of invoice total)
- **P:** Shipping Amount (proportional, includes restocking fees)
- **Q:** Discount Amount (proportional)
- **AA:** State Abbreviation (2-letter code)
- **AB:** Region (USA or Canada)

---

### Step 4: SKU Normalization & Master Data Lookup

**Purpose:** Clean SKU values and enrich transaction data with Master SKU reference information (vendor, category, cost)

This step uses a **dual-branch architecture** for parallel processing efficiency.

#### Step 4.1: Loop Preparation

**Code Node:** Code2 - LOOP

**Purpose:** Add dummy field to prepare items for branch splitting

```javascript
// Loop over input items and add a new field called 'myNewField' to the JSON of each one
for (const item of $input.all()) {
  item.json.myNewField = 1;
}
return $input.all();
```

#### Step 4.2: Dual Branch Processing

### Branch 1 (Top): Transaction Data SKU Normalization

**Step A: Convert SKU to Plain Text**

**Code Node:** Code2 - Force SKU to Plain Text

```javascript
// Code2 - force SKU to plain text
const items = $input.all();

for (const item of items) {
  const v = item.json['SKU'];
  if (v !== undefined && v !== null && v !== '') {
    let s = String(v).trim();
    // remove thousand separators like 123,456
    s = s.replace(/,/g, '');
    // convert scientific notation like 2.79E5 to full number string
    if (/^\d+(\.\d+)?e\+?\d+$/i.test(s)) {
      const n = Number(s);
      if (Number.isFinite(n)) s = String(n);
    }
    // drop trailing .0 or .000 that Sheets sometimes adds
    s = s.replace(/\.0+$/, '');
    item.json['SKU'] = s;          // use this field for the Merge match
    item.json['_SKU_text'] = s;    // optional helper if you want a separate key
  }
}

return items;
```

**Cleaning Operations:**
- Remove thousand separators: `123,456` → `123456`
- Convert scientific notation: `2.79E5` → `279000`
- Remove trailing zeros: `11872.0` → `11872`

**Step B: Create Normalized Lookup Key**

**Code Node:** Code - SKU KEY

```javascript
// Normalize to a consistent text key for the Merge
function normSKU(v) {
  if (v === undefined || v === null) return '';
  let s = String(v).trim();
  s = s.replace(/,/g, '');      // 123,456 -> 123456
  s = s.replace(/\s+/g, '');    // remove spaces
  s = s.replace(/\.0+$/, '');   // 11872.0 -> 11872
  if (/^\d+(\.\d+)?e\+?\d+$/i.test(s)) { // 1.2e5
    const n = Number(s);
    if (Number.isFinite(n)) s = String(n);
  }
  return s.toUpperCase();       // case-insensitive
}

const items = $input.all();
for (const item of items) {
  item.json.SKU_KEY = normSKU(item.json['SKU']);
}
return items;
```

**Normalization Operations:**
- Remove commas, spaces, trailing zeros
- Convert scientific notation
- Uppercase for case-insensitive matching
- Store as `SKU_KEY` field

### Branch 2 (Bottom): Master SKU Data Lookup

**Step A: Read Master SKU Sheet**

**Data Source:**
- **Location:** `C:\Users\blkw\OneDrive\Documents\Github\Source 4 Industries\Ads Report\SKU Documents`
- **File:** Master SKU reference sheet

**Master SKU Contains:**
- SKU (Search Key)
- VENDOR (Vendor name)
- COST (Unit cost - Column D)
- PRODUCT CATEGORY
- OVERALL PRODUCT CATEGORY
- Other product master data

**Node:** Get row(s) in sheet1 - MASTER SKU

**Step B: Normalize Master SKU Keys**

**Code Node:** Code - SKU KEY1

```javascript
// Normalize to a consistent text key for the Merge
function normSKU(v) {
  if (v === undefined || v === null) return '';
  let s = String(v).trim();
  s = s.replace(/,/g, '');      // 123,456 -> 123456
  s = s.replace(/\s+/g, '');    // remove spaces
  s = s.replace(/\.0+$/, '');   // 11872.0 -> 11872
  if (/^\d+(\.\d+)?e\+?\d+$/i.test(s)) { // 1.2e5
    const n = Number(s);
    if (Number.isFinite(n)) s = String(n);
  }
  return s.toUpperCase();       // case-insensitive
}

const items = $input.all();
for (const item of items) {
  item.json.SKU_KEY = normSKU(item.json['SKU']);
}
return items;
```

**Note:** Uses identical normalization logic as Branch 1 to ensure matching consistency

#### Step 4.3: Merge Transaction Data with Master SKU

**Node:** Merge - SKU MASTER

**Configuration:**
- **Mode:** Combine
- **Combine By:** Matching Fields
- **Fields to Match:** `SKU_KEY` (from both branches)
- **Output Type:** Keep Everything

**Result:** Each transaction line now enriched with:
- VENDOR
- COST
- PRODUCT CATEGORY
- OVERALL PRODUCT CATEGORY
- Other Master SKU fields

**Why Dual Branch?**
- Parallel processing improves efficiency
- Both branches use identical normalization for consistent matching
- Ensures all transactions are retained even if SKU not found in Master

---

### Step 5: Cost Calculation, Vendor & Category Assignment

**Purpose:** Apply Master SKU data to calculate costs and assign vendor/category information

**Code Node:** Code3 - COST EACH / VENDOR / CATEGORIES

#### Process Flow

**Match Status Check:**
- **MATCHED:** Has VENDOR field populated from merge
- **UNMATCHED:** VENDOR is empty or '#N/A'

#### For MATCHED Items:

1. **Extract Cost Each (Column L):**
   - Retrieve from Master SKU COST field or Column D
   - Remove $ signs
   - Convert to number

2. **Calculate Cost Total (Column M):**
   - Formula: `Order Quantity × Cost Each`
   - Round to 2 decimal places

3. **Assign Vendor (Column N):**
   - From Master SKU VENDOR field

4. **Assign Categories:**
   - Product Category: From Master SKU PRODUCT CATEGORY
   - Overall Category: From Master SKU OVERALL PRODUCT CATEGORY

5. **Set Match Status:** "MATCHED"

#### For UNMATCHED Items:

1. **Cost Each (Column L):** Empty
2. **Cost Total (Column M):** Empty
3. **Vendor (Column N):** "NOT FOUND"
4. **Product Category:** Empty
5. **Overall Category:** Empty
6. **Match Status:** "UNMATCHED"
7. **Log Missing SKU:** For Master SKU maintenance

#### Full Code

```javascript
// VLOOKUP Code - Fixed to properly get COST from column D
const allItems = $input.all();

console.log('=== VLOOKUP PROCESSING START ===');
console.log('Total items from merge:', allItems.length);

// Debug: Check what fields are available in first few items
console.log('Sample item fields:', Object.keys(allItems[0]?.json || {}));
if (allItems[0]) {
  console.log('First item COST field:', allItems[0].json.COST);
  console.log('First item D field:', allItems[0].json.D);
}

// Process all merged items
const processedItems = [];
let matchedCount = 0;
let unmatchedCount = 0;

allItems.forEach((item, index) => {
  const data = item.json;
  
  // Skip if this isn't transaction data
  if (!data.Customer) {
    console.log(`Skipping item ${index} - no Customer field`);
    return;
  }
  
  const sku = String(data.SKU || '').trim();
  
  // Check if the merge found matching master data
  const hasMatchedData = data.VENDOR && data.VENDOR !== '' && data.VENDOR !== '#N/A';
  
  if (hasMatchedData) {
    // Matched - has vendor data from master sheet
    matchedCount++;
    
    // Try different possible field names for cost
    let costValue = data.COST || data.D || data['COST'] || '';
    
    // Remove $ sign if present and convert to number
    if (costValue && typeof costValue === 'string') {
      costValue = costValue.replace('$', '').trim();
    }
    
    // Calculate Cost Total
    let costTotal = '';
    if (data['Order Quantity'] && costValue) {
      const qty = parseFloat(data['Order Quantity']);
      const cost = parseFloat(costValue);
      if (!isNaN(qty) && !isNaN(cost)) {
        costTotal = (qty * cost).toFixed(2);
      }
    }
    
    processedItems.push({
      json: {
        ...data,
        'Cost Each': costValue,
        'Cost Total': costTotal,
        'Vendor': data.VENDOR,
        'Product Category': data['PRODUCT CATEGORY'] || '',
        'Overall Category': data['OVERALL PRODUCT CATEGORY'] || '',
        'Match Status': 'MATCHED'
      }
    });
    
    // Debug log for matched items
    if (index < 5) {
      console.log(`Matched item ${index}: SKU=${sku}, Cost=${costValue}, Vendor=${data.VENDOR}`);
    }
    
  } else {
    // Unmatched - no vendor data found
    unmatchedCount++;
    processedItems.push({
      json: {
        ...data,
        'Cost Each': '',
        'Cost Total': '',
        'Vendor': 'NOT FOUND',
        'Product Category': '',
        'Overall Category': '',
        'Match Status': 'UNMATCHED',
        'Missing SKU': sku || 'NO SKU PROVIDED'
      }
    });
    console.log(`Unmatched SKU: "${sku}" from Customer: ${data.Customer}`);
  }
});

console.log('\n=== SUMMARY ===');
console.log(`Total processed: ${processedItems.length}`);
console.log(`Matched: ${matchedCount}`);
console.log(`Unmatched: ${unmatchedCount}`);

// Check first few processed items to verify Cost Each is populated
console.log('\nFirst 3 processed items Cost Each values:');
processedItems.slice(0, 3).forEach((item, i) => {
  console.log(`Item ${i}: SKU=${item.json.SKU}, Cost Each=${item.json['Cost Each']}, Vendor=${item.json.Vendor}`);
});

return processedItems;
```

**Console Logging:**
- Total items processed
- Matched vs unmatched count
- Details of unmatched SKUs for troubleshooting
- Sample cost assignments for verification

**Key Fields Updated:**
- **Column L:** Cost Each
- **Column M:** Cost Total (Qty × Cost Each)
- **Column N:** Vendor
- Product Category
- Overall Category
- Match Status

---

### Step 6: Create Unique Row Identifiers

**Purpose:** Generate unique identifiers for deduplication and order tracking

**Code Node:** Code5 - LOOP

```javascript
// Create compound unique identifier
for (let i = 0; i < $input.all().length; i++) {
  const item = $input.all()[i];
  const data = item.json;
  
  // Create unique key combining multiple fields
  item.json.uniqueKey = `${data.SKU || 'NOSKU'}_${data['Invoice #'] || 'NOINV'}_${i}`;
  item.json.rowOrder = i + 1;
}
return $input.all();
```

**Unique Key Format:**
- Pattern: `{SKU}_{InvoiceNumber}_{ArrayIndex}`
- Example: `11872_SO-12345_0`
- Fallbacks: "NOSKU" if blank, "NOINV" if no invoice

**Row Order:**
- Sequential number starting at 1
- Maintains original data order through processing

**Why This Matters:**
- Prevents duplicate rows in final import
- Enables tracking of specific line items
- Maintains data integrity through multiple transformations

---

### Step 7: Final Calculations & Formatting

**Purpose:** Calculate all financial metrics, format numeric fields for display, and generate tracking codes

**Code Node:** Code4 - TOTALS / FINALIZE

#### Calculations Performed

| Field | Column | Formula | Format |
|-------|--------|---------|--------|
| Cost Total | M | Cost Each × Order Quantity | Currency |
| Invoice Total | S | Sales Total + Shipping - Discount + Refunds* | Currency |
| Profit Total | T | Sales Total - Cost Total - Discount + Refunds* | Currency |
| ROI | U | Profit Total ÷ Invoice Total | Percentage |
| Year | Y | Extract from Date field | YYYY |
| Tracked Month | Z | Custom month code generator | ZH, ZI, ZJ... |

*Note: Refunds always = 0 in current implementation

#### Tracked Month Code Logic

**Base:** August 2025 = ZH
**Pattern:** Z + Letter (H, I, J, K, L...)
**Calculation:** Months since August 2025

| Month | Code | Month | Code |
|-------|------|-------|------|
| Aug 2025 | ZH | Sep 2025 | ZI |
| Oct 2025 | ZJ | Nov 2025 | ZK |
| Dec 2025 | ZL | Jan 2026 | ZM |

**Behavior:**
- Months before August 2025 default to ZH
- Letters increment sequentially (H=7, I=8, J=9...)
- Wraps after Z if needed (unlikely in normal use)

#### Field Formatting

| Field | Format Type | Example |
|-------|-------------|---------|
| Order Quantity | Whole number, comma separated | 1,234 |
| Sales Each | Currency | $12.50 |
| Sales Total | Currency | $1,234.56 |
| Cost Each | Currency | $8.75 |
| Cost Total (M) | Currency | $10,500.00 |
| Orders (O) | 2 decimal places | 0.45 |
| Shipping (P) | Currency | $125.00 |
| Discount (Q) | Currency | $50.00 |
| Invoice Total (S) | Currency | $11,809.56 |
| Profit Total (T) | Currency | $1,309.56 |
| ROI (U) | Percentage (1 decimal) | 11.1% |
| Year (Y) | Year only | 2025 |
| Tracked Month (Z) | Custom code | ZJ |

#### Full Code

```javascript
// Code4 - All Calculations with Formatting
const items = $input.all();

console.log('Starting calculations for', items.length, 'items');

// Helper function to format currency
function formatCurrency(value) {
  if (value === 0) return '$0.00';
  if (!value || isNaN(value)) return '';
  return '$' + parseFloat(value).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

// Helper function to format percentage (1 decimal place)
function formatPercentage(value) {
  if (value === 0) return '0.0%';
  if (!value || isNaN(value)) return '';
  return (parseFloat(value) * 100).toLocaleString('en-US', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  }) + '%';
}

// Helper function to format numbers with no decimals
function formatWholeNumber(value) {
  if (value === 0) return '0';
  if (!value || isNaN(value)) return '';
  return Math.round(parseFloat(value)).toLocaleString('en-US');
}

// Helper function to format numbers with 2 decimal places
function formatTwoDecimals(value) {
  if (value === 0) return '0.00';
  if (!value || isNaN(value)) return '';
  return parseFloat(value).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

// Helper function to format numbers with 1 decimal place
function formatOneDecimal(value) {
  if (value === 0) return '0.0';
  if (!value || isNaN(value)) return '';
  return parseFloat(value).toLocaleString('en-US', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  });
}

// Process each item and add calculations
const processedItems = items.map((item, index) => {
  const data = item.json;
  
  // Parse numeric values for calculations
  const orderQuantity = parseFloat(data['Order Quantity']) || 0;
  const salesTotal = parseFloat(data['Sales Total']) || 0;
  const shipping = parseFloat(data['Shipping']) || 0;
  const discount = parseFloat(data['Discount']) || 0;
  const refunds = 0; // Always 0 as specified
  
  // Parse cost each (remove $ sign if present)
  const costEachRaw = data['Cost Each'] || '';
  const costEachNum = costEachRaw ? parseFloat(costEachRaw.toString().replace('$', '')) || 0 : 0;
  
  // Calculate all formulas
  const costTotal = costEachNum * orderQuantity; // Column M
  const invoiceTotal = salesTotal + shipping - discount + refunds; // Column S
  const profitTotal = salesTotal - costTotal - discount + refunds; // Column T
  const roi = invoiceTotal !== 0 ? profitTotal / invoiceTotal : 0; // Column U
  
  // Extract year from Date field
  const dateField = data['Date'] || '';
  const year = dateField ? new Date(dateField).getFullYear() : '';
  
  // Calculate tracked month code
  function getTrackedMonthCode(dateString) {
    if (!dateString) return 'ZH'; // Default to August 2025
    
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = date.getMonth(); // 0-based (0 = January)
    
    // Calculate months since August 2025 (ZH)
    const baseYear = 2025;
    const baseMonth = 7; // August is month 7 (0-based)
    
    const monthsSinceBase = (year - baseYear) * 12 + (month - baseMonth);
    
    if (monthsSinceBase < 0) {
      return 'ZH'; // Before August 2025, default to ZH
    }
    
    // Generate the code: Z + letter (H=7, I=8, J=9, etc.)
    const letterIndex = 7 + monthsSinceBase; // Start from H (7)
    
    if (letterIndex > 25) {
      // If we go beyond Z, wrap around
      return 'Z' + String.fromCharCode(65 + (letterIndex % 26));
    }
    
    const letter = String.fromCharCode(65 + letterIndex); // A=65, H=72, etc.
    return 'Z' + letter;
  }
  
  const trackedMonth = getTrackedMonthCode(dateField);
  
  // Debug first few calculations
  if (index < 3) {
    console.log(`Item ${index}:`, {
      SKU: data.SKU,
      CostEach: costEachNum,
      OrderQty: orderQuantity,
      CostTotal: costTotal,
      SalesTotal: salesTotal,
      InvoiceTotal: invoiceTotal,
      ProfitTotal: profitTotal,
      ROI: roi,
      Year: year,
      TrackedMonth: trackedMonth
    });
  }
  
  // Return item with all calculations and proper formatting
  return {
    ...item,
    json: {
      ...data,
      // Format existing fields
      'Order Quantity': formatWholeNumber(data['Order Quantity']),  // No decimal places
      'Sales Each': formatCurrency(data['Sales Each']),             // Currency format
      'Sales Total': formatCurrency(data['Sales Total']),           // Currency format
      'Cost Each': formatCurrency(data['Cost Each']),               // Currency format
      'Orders': formatTwoDecimals(data['Orders']),                  // 2 decimal places (0.00 format)
      'Shipping': formatCurrency(data['Shipping']),                 // Currency format
      'Discount': formatCurrency(data['Discount']),                 // Currency format
      
      // New calculated fields
      M: formatCurrency(costTotal),     // Cost Total (formatted as $)
      S: formatCurrency(invoiceTotal),  // Invoice Total (formatted as $)
      T: formatCurrency(profitTotal),   // Profit Total (formatted as $)
      U: formatPercentage(roi),         // ROI (formatted as %)
      Y: year,                          // Year from Date field
      Z: trackedMonth                   // Tracked Month code
    }
  };
});

console.log('Completed calculations for', processedItems.length, 'items');
return processedItems;
```

**Console Logging:**
- Total items being calculated
- First 3 items with detailed calculation breakdown
- Completion confirmation

---

### Step 8: Quality Control - Missing Data & Margin Alerts

**Purpose:** Identify and segregate rows with incomplete data or unusual margins for review and Master SKU maintenance

#### Quality Control Categories

### 1. Missing Cost Data

**Criteria:**
- `Cost Each` (Column L) is empty/blank
- `Cost Each` = $0.00

**Action Required:** Add cost data to Master SKU sheet

**Columns to Include in Report:**
- Vendor (Column N)
- SKU (Column G)
- Order # (Column F)
- Customer (Column A)
- Product Name (Column H)
- Cost Each (Column L)
- Sales Total (Column K)
- Flag Reason: "Missing Cost" or "Zero Cost"

---

### 2. Missing Overall Product Category

**Criteria:**
- `Overall Product Category` is empty
- `Overall Product Category` = "BLANK"

**Action Required:** Assign overall category in Master SKU

**Columns to Include in Report:**
- Vendor (Column N)
- SKU (Column G)
- Order # (Column F)
- Product Name (Column H)
- Product Category
- Overall Product Category
- Flag Reason: "Missing Overall Category"

---

### 3. Missing Product Category for Main Vendors

**Criteria:**
- Vendor is one of 18 main vendors (see list below)
- `Product Category` is empty OR = "BLANK"

**Action Required:** Assign specific product category in Master SKU

**Columns to Include in Report:**
- Vendor (Column N)
- SKU (Column G)
- Order # (Column F)
- Product Name (Column H)
- Product Category
- Flag Reason: "Missing Product Category for Main Vendor"

#### Main Vendors & Their Categories

**S4 Bollards** (6 categories)
- Bollard Covers
- Crash Rated Bollards
- Fixed Bollards
- Flexible Bollards
- Removable Bollards
- Retractable Bollards

**Handle-It** (5 categories)
- Floor Mounted Barrier
- Forklift Wheel Stops
- Guard Rail
- Rack Protection
- Stretch Wrap Machines

**Casters** (6 categories)
- Bellman Casters
- Gate Casters
- General Casters
- Heavy Duty / Container
- High Temp Casters
- Leveling Casters

**Lincoln Industrial** (6 categories)
- Air Motors
- Hoses
- Kits
- Other
- Pumps
- Quicklub

**Noblelift** (7 categories)
- Battery, Charger, Accessories
- Bigger Electric Equipment
- EDGE Powered
- Electric Pallet Jacks
- Manual Pallet Jacks
- Scissor Lifts
- Straddle Stackers

**B&P Manufacturing** (6 categories)
- Aristocrat
- Carts
- Dock Plates
- Hand Truck Accessories
- Hand Trucks
- Ramps

**Dutro** (6 categories)
- Accessories
- Carts
- Dollies
- Hand Trucks
- Mattress Moving Carts
- Vending Machine Trucks

**Reliance Foundry** (8 categories)
- Bollard Covers
- Crash Rated Bollards
- Decorative Bollards
- Fixed Bollards
- Flexible Bollards
- Fold Down Bollards
- Removable Bollards
- Retractable Bollards

**Ekko Lifts** (6 categories)
- Electric Forklifts
- Electric Pallet Jacks
- Electric Straddle Stackers
- Electric Walkie Stackers
- Manual Pallet Jacks
- Other

**Adrian's Safety** (3 categories)
- Cargo Safety
- Pallet Rack Safety Straps
- Pallet Rack Safety Netting

**Sentry Protection** (3 categories)
- ST - Accessories
- ST - Collision Sentry
- ST - Column Protectors

**Little Giant** (6 categories)
- Cabinet
- Carts
- Dollies
- Gas Cylinder
- Rack
- Tables

**Merrick Machine** (6 categories)
- Accessories
- Auto Dollies
- Auto Rotisseries
- Flat Top Dollies
- Lifts, Rack, Stands
- Other Dollies

**Wesco** (6 categories)
- Accessories & Other
- Carts, Hand Trucks & Dollies
- Dock Equipment
- Drum Equipment
- Lifts & Stackers
- Pallet Jacks

**Valley Craft** (6 categories)
- Accessories
- Cabinets & Desks
- Carts
- Dumpers & Lifts
- Hand Trucks & Dollies
- Other

**Bluff Manufacturing** (6 categories)
- Bollards & Protectors
- Dock Boards
- Edge of Dock Levelers
- Other
- Ramps
- Stairways

**Meco-Omaha** (6 categories)
- Cantilever
- Carts & Dollies
- Guard Rail
- Hoppers
- Other
- Racking

**Apollo Forklift** (6 categories)
- AF - Electric Pallet Jacks
- AF - Electric Stackers
- AF - Manual Pallet Jacks
- AF - Manual Stackers
- AF - Order Pickers
- AF - Scissor Lifts

---

### 4. High Margin Alert (>70%)

**Criteria:**
- `ROI` (Column U) > 70%

**Potential Issue:** Incorrect pricing, missing costs, or data entry errors

**Action Required:** Review pricing and cost accuracy

**Columns to Include in Report:**
- Vendor (Column N)
- SKU (Column G)
- Order # (Column F)
- Customer (Column A)
- Product Name (Column H)
- Sales Total (Column K)
- Cost Total (Column M)
- Profit Total (Column T)
- ROI (Column U)
- Flag Reason: "High Margin >70%"

---

### 5. Negative/Zero Margin Alert (≤0%)

**Criteria:**
- `ROI` (Column U) ≤ 0%

**Potential Issue:** Unprofitable transactions, pricing below cost, or calculation errors

**Action Required:** Review for profitability issues

**Columns to Include in Report:**
- Vendor (Column N)
- SKU (Column G)
- Order # (Column F)
- Customer (Column A)
- Product Name (Column H)
- Sales Total (Column K)
- Cost Total (Column M)
- Profit Total (Column T)
- ROI (Column U)
- Flag Reason: "Negative/Zero Margin"

---

### Step 9: Final Export Structure

**Output:** Multi-tab Excel/Google Sheet file

#### Tab 1: READY TO IMPORT
**Contents:** All rows with complete, formatted data
**Columns:** A through AD (all 30 columns)
**Use:** Direct import into main sales dashboard

#### Tab 2: MISSING COSTS
**Contents:** Rows with missing/zero cost data
**Sort:** By Vendor for batch updates
**Use:** Master SKU cost maintenance

#### Tab 3: MISSING OVERALL CATEGORY
**Contents:** Rows without overall product category
**Use:** Master SKU category assignment

#### Tab 4: MISSING PRODUCT CATEGORY - MAIN VENDORS
**Contents:** Main vendor rows missing product category
**Sort:** By Vendor
**Use:** Detailed category assignment for key vendors

#### Tab 5: HIGH MARGIN ALERT
**Contents:** Rows with ROI > 70%
**Sort:** By ROI descending (highest margins first)
**Use:** Pricing and cost accuracy review

#### Tab 6: NEGATIVE/ZERO MARGIN ALERT
**Contents:** Rows with ROI ≤ 0%
**Sort:** By ROI ascending (most negative first)
**Use:** Unprofitable transaction review

---

## Summary of Transformations

### Data Cleaning
1. ✅ Remove metadata rows (1-11)
2. ✅ Filter out "Projects" rows
3. ✅ Exclude specific sales reps
4. ✅ Normalize SKU formatting
5. ✅ Consolidate shipping/discount line items
6. ✅ Clean and abbreviate state data

### Data Enrichment
1. ✅ Lookup vendor from Master SKU
2. ✅ Lookup cost from Master SKU
3. ✅ Lookup categories from Master SKU
4. ✅ Derive order type (Online/Local)
5. ✅ Calculate proportional shipping/discounts
6. ✅ Determine region (USA/Canada)

### Calculations
1. ✅ Cost Total (Qty × Cost Each)
2. ✅ Invoice Total (Sales + Shipping - Discount)
3. ✅ Profit Total (Sales - Cost - Discount)
4. ✅ ROI (Profit ÷ Invoice)
5. ✅ Year extraction
6. ✅ Tracked Month code generation

### Formatting
1. ✅ Currency fields ($#,##0.00)
2. ✅ Percentage fields (##.#%)
3. ✅ Whole number fields (#,##0)
4. ✅ Date fields (YYYY-MM)

### Quality Control
1. ✅ Missing cost identification
2. ✅ Missing category identification
3. ✅ High margin alerts (>70%)
4. ✅ Negative margin alerts (≤0%)
5. ✅ Unique row identifiers
6. ✅ Unmatched SKU logging

---

## Implementation Notes for Claude Code

### Key Considerations

1. **File Handling:**
   - Read from specified OneDrive paths
   - Handle varying Sales_Order_Detail filename timestamps
   - Support both .xlsx and .csv formats

2. **Master SKU Dependency:**
   - Critical reference file required before processing
   - Should validate Master SKU file exists and is accessible
   - Consider caching Master SKU data for performance

3. **State/Province Processing:**
   - Comprehensive US + Canada support
   - Robust address parsing for multiple formats
   - Fallback to original value if no match

4. **Error Handling:**
   - Log unmatched SKUs for Master SKU maintenance
   - Gracefully handle missing cost data
   - Flag margin anomalies without blocking import

5. **Performance:**
   - Dual-branch architecture for parallel processing
   - Single-pass calculations where possible
   - Efficient lookups using normalized keys

6. **Data Integrity:**
   - Unique row identifiers prevent duplicates
   - Row order preservation throughout workflow
   - Match status tracking for audit trails

7. **Output Formatting:**
   - Excel-compatible number formatting
   - Proper currency/percentage display
   - Tab organization for efficient review

### Testing Recommendations

1. Test with sample data containing:
   - Matched and unmatched SKUs
   - Various shipping/discount scenarios
   - Edge cases (zero costs, high margins)
   - Multiple state/address formats

2. Validate calculations:
   - Cost Total accuracy
   - Proportional shipping/discount distribution
   - ROI formula correctness
   - Tracked Month code generation

3. Verify quality control flags:
   - Missing data detection
   - Margin threshold alerts
   - Main vendor category checks

4. Confirm output structure:
   - All 6 tabs present
   - Correct column headers
   - Proper data segregation

---

## Workflow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. Upload Sales_Order_Detail.xlsx                              │
│    Delete rows 1-11 (metadata)                                  │
└─────────────────────────┬───────────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────────┐
│ 2. Delete Projects & Reorganize Columns                         │
│    - Filter Projects rows                                       │
│    - Exclude specific sales reps                                │
│    - Map to columns A-AD structure                              │
│    - Derive Order Type (Online/Local)                           │
└─────────────────────────┬───────────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────────┐
│ 3. Calculate Orders/Shipping/Discounts/State                    │
│    - Identify shipping/discount rows by terms                   │
│    - Sum by Invoice #, delete source rows                       │
│    - Distribute proportionally to line items                    │
│    - Extract state abbreviations                                │
│    - Determine region (USA/Canada)                              │
└─────────────────────────┬───────────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────────┐
│ 4. SKU Normalization & Master Lookup (Dual Branch)              │
│                                                                  │
│   Branch 1 (Transaction Data)    Branch 2 (Master SKU)          │
│   ├─ Clean SKU formatting         ├─ Read Master SKU sheet     │
│   └─ Create SKU_KEY               └─ Create SKU_KEY             │
│                                                                  │
│   Merge on SKU_KEY (Keep All)                                   │
│   ├─ Matched: Enrich with vendor/cost/categories                │
│   └─ Unmatched: Flag as NOT FOUND                               │
└─────────────────────────┬───────────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────────┐
│ 5. Cost Calculation & Category Assignment                       │
│    - Apply Cost Each from Master SKU                            │
│    - Calculate Cost Total (Qty × Cost Each)                     │
│    - Assign Vendor, Product Category, Overall Category          │
│    - Log unmatched SKUs                                         │
└─────────────────────────┬───────────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────────┐
│ 6. Create Unique Identifiers                                    │
│    - Generate uniqueKey (SKU_Invoice_Index)                     │
│    - Assign rowOrder (sequential)                               │
└─────────────────────────┬───────────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────────┐
│ 7. Final Calculations & Formatting                              │
│    - Calculate Invoice Total, Profit Total, ROI                 │
│    - Generate Year, Tracked Month code                          │
│    - Format all currency, percentage, number fields             │
└─────────────────────────┬───────────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────────┐
│ 8. Quality Control Checks                                       │
│    - Flag missing costs                                         │
│    - Flag missing categories                                    │
│    - Flag high margins (>70%)                                   │
│    - Flag negative/zero margins (≤0%)                           │
└─────────────────────────┬───────────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────────┐
│ 9. Export Multi-Tab File                                        │
│    Tab 1: READY TO IMPORT (clean data)                          │
│    Tab 2: MISSING COSTS                                         │
│    Tab 3: MISSING OVERALL CATEGORY                              │
│    Tab 4: MISSING PRODUCT CATEGORY - MAIN VENDORS               │
│    Tab 5: HIGH MARGIN ALERT                                     │
│    Tab 6: NEGATIVE/ZERO MARGIN ALERT                            │
└─────────────────────────────────────────────────────────────────┘
```

---

## End of Documentation

**Document Version:** 1.0  
**Created:** November 10, 2025  
**For:** Claude Code Implementation  
**Workflow:** CBOS to Dashboard Data Processing
