import pandas as pd
import os
import json

# Load configuration
with open('config.json', 'r') as f:
    config = json.load(f)

month = config['month']
bing_file = config['input_files']['bing']
google_file = config['input_files']['google']
sku_path = config['paths']['sku_documents']
input_dir = config['paths']['input_dir']
output_dir = config['paths']['output_dir'].replace("{month}", month)

print("=" * 120)
print(f"AD SPEND PROCESSOR - {month.upper()} UPLOAD SHEET WITH SKU LOOKUP")
print("=" * 120)

# ============================================================================
# 1. LOAD ALL DATA
# ============================================================================
print("\n1. LOADING DATA FILES")

print(f"   Loading Bing Ads ({bing_file})...")
bing_raw = pd.read_csv(os.path.join(input_dir, bing_file), skiprows=6)
# Remove summary rows: Title='Total', Title='-', or Custom label has 'TOTAL'
bing_raw = bing_raw[
    (bing_raw['Title'] != 'Total') &
    (bing_raw['Title'] != '-') &
    (bing_raw['Custom label 1 (Product)'].astype(str).str.upper() != 'TOTAL')
].dropna(subset=['Title'])
print(f"   Loaded {len(bing_raw)} rows (after removing summary rows)")

print(f"   Loading Google Ads ({google_file})...")
google_raw = pd.read_csv(os.path.join(input_dir, google_file), encoding='utf-16-le', sep='\t', skiprows=2)
print(f"   Loaded {len(google_raw)} rows")

# SKU Lookup Files
print(f"\n   Loading ID to SKU mapping...")
id_to_sku = pd.read_csv(os.path.join(sku_path, "Google Ads - Product Spend - ID to SKU (1).csv"))
print(f"   Loaded {len(id_to_sku)} ID-to-SKU mappings")

print(f"   Loading MASTER SKU...")
master_sku = pd.read_csv(os.path.join(sku_path, "Google Ads - Product Spend - MASTER SKU (1).csv"))
print(f"   Loaded {len(master_sku)} SKU records")

# ============================================================================
# 2. SETUP VENDOR LIST
# ============================================================================
print("\n2. SETTING UP VENDOR CONFIGURATION")

main_vendors = {
    'lincoln industrial': 'Lincoln Industrial',
    'durable superior casters': 'Durable Superior Casters',
    'ekko lifts': 'Ekko Lifts',
    'handle-it': 'Handle-It',
    'noblelift': 'Noblelift',
    's4 bollards': 'S4 Bollards',
    'reliance foundry': 'Reliance Foundry',
    'b&p manufacturing': 'B&P Manufacturing',
    'little giant': 'Little Giant',
    'wesco': 'Wesco',
    'valley craft': 'Valley Craft',
    'dutro': 'Dutro',
    'merrick machine': 'Merrick Machine',
    'bluff manufacturing': 'Bluff Manufacturing',
    'meco-omaha': 'Meco-Omaha',
    'apollo forklift': 'Apollo Forklift',
    "adrian's safety": "Adrian's Safety",
    'sentry protection': 'Sentry Protection',
    'colson': 'Caster Depot',
}

print(f"   Configured {len(main_vendors)} main vendors")

# ============================================================================
# 3. HELPER FUNCTIONS
# ============================================================================

def clean_currency(val):
    if pd.isna(val):
        return 0.0
    s = str(val).replace('$', '').replace(',', '')
    try:
        return float(s)
    except:
        return 0.0

def clean_number(val):
    if pd.isna(val):
        return 0
    s = str(val).replace(',', '')
    try:
        return int(float(s))
    except:
        return 0

def clean_percent(val):
    if pd.isna(val):
        return ""
    s = str(val).strip()
    if s.endswith('%'):
        return s
    try:
        pct = float(s)
        return f"{pct:.2f}%" if pct != 0 else ""
    except:
        return ""

def normalize_vendor(vendor_str):
    """Normalize vendor name to proper format"""
    if pd.isna(vendor_str):
        return ""
    vendor_lower = str(vendor_str).strip().lower()
    for key, proper_name in main_vendors.items():
        if key in vendor_lower or vendor_lower in key:
            return proper_name
    return str(vendor_str).strip().title()

def lookup_sku_from_id(item_id, id_to_sku_df):
    """Look up SKU from Item ID"""
    if pd.isna(item_id) or item_id == '':
        return ""

    item_id_str = str(item_id).strip()

    # First try exact match
    matches = id_to_sku_df[id_to_sku_df['id'].astype(str).str.strip() == item_id_str]

    # If no match, try extracting just the numeric ID (before / or |)
    if matches.empty:
        # Extract numeric ID before any / or | delimiter
        base_id = item_id_str.split('/')[0].split('|')[0].strip()
        if base_id and base_id != item_id_str:
            matches = id_to_sku_df[id_to_sku_df['id'].astype(str).str.strip() == base_id]

    if not matches.empty:
        sku = matches.iloc[0].get('custom label 1', '')
        if pd.notna(sku) and str(sku).strip():
            return str(sku).strip().upper()
    return ""

def lookup_category_from_sku(sku_val, master_sku_df):
    """Look up Product Category from SKU in Master SKU"""
    if pd.isna(sku_val) or sku_val == '':
        return ""

    sku_str = str(sku_val).strip().upper()
    matches = master_sku_df[master_sku_df['SKU'].astype(str).str.strip().str.upper() == sku_str]

    if not matches.empty:
        category = matches.iloc[0].get('PRODUCT CATEGORY', '')
        if pd.notna(category) and str(category).strip():
            return str(category).strip()
    return ""

# ============================================================================
# 4. PROCESS BING ADS
# ============================================================================
print("\n3. PROCESSING BING ADS")

bing_list = []
bing_missing_skus = []

for idx, row in bing_raw.iterrows():
    # Get SKU
    sku = str(row['Custom label 1 (Product)']).strip().upper() if pd.notna(row['Custom label 1 (Product)']) and str(row['Custom label 1 (Product)']).strip() else ""

    # Fallback to Merchant product ID if blank
    if not sku or sku == '-' or sku == '--':
        sku = str(row['Merchant product ID']).strip().upper() if pd.notna(row['Merchant product ID']) else ""

    vendor = normalize_vendor(row.get('Brand', ''))

    # Track missing SKUs (but include in main sheet)
    if not sku or sku == '-' or sku == '--':
        title = str(row.get('Title', '')).strip()
        bing_missing_skus.append({'Vendor': vendor, 'Product Name': title, 'Source': 'Bing'})
        sku = ""  # Set to empty string for upload sheet

    # Get category from Master SKU (only if we have a valid SKU)
    category = lookup_category_from_sku(sku, master_sku) if sku else ""

    bing_list.append({
        'Month': month,
        'Platform': 'Bing',
        'Product Category': category,
        'SKU': sku,
        'Title': str(row['Title']).strip(),
        'Vendor': vendor,
        'Price': f"${clean_currency(row['Price']):,.2f}" if clean_currency(row['Price']) > 0 else "",
        'Ad Spend': f"${clean_currency(row['Spend']):.2f}",
        'Impressions': f"{clean_number(row['Impressions']):,}" if clean_number(row['Impressions']) > 0 else "",
        'Clicks': f"{clean_number(row['Clicks']):,}" if clean_number(row['Clicks']) > 0 else "",
        'CTR': clean_percent(row['CTR']),
        'Avg. CPC': f"${clean_currency(row['Avg. CPC']):.2f}" if clean_currency(row['Avg. CPC']) > 0 else "",
        'Conversions': f"{float(row['Conversions']):.2f}" if float(row['Conversions']) > 0 else "",
        'Revenue': f"${clean_currency(row['Revenue']):.2f}" if clean_currency(row['Revenue']) > 0 else "",
        'Impression share': clean_percent(row['Impression share']),
        'Impression share lost to rank': clean_percent(row['Impression share lost to rank']),
        'Absolute top impression share': clean_percent(row['Absolute top impression share'])
    })

bing_processed = pd.DataFrame(bing_list)
print(f"   Processed {len(bing_processed)} Bing records")
print(f"   Missing SKUs: {len(bing_missing_skus)}")

# ============================================================================
# 5. PROCESS GOOGLE ADS
# ============================================================================
print("\n4. PROCESSING GOOGLE ADS")

google_list = []
google_missing_skus = []

for idx, row in google_raw.iterrows():
    # Get SKU from Custom label 1
    sku = str(row['Custom label 1']).strip().upper() if pd.notna(row['Custom label 1']) and str(row['Custom label 1']).strip() else ""

    # If blank, try to lookup from Item ID using ID to SKU
    if not sku or sku == '-' or sku == '--':
        item_id = row['Item ID'] if 'Item ID' in row else ''
        sku = lookup_sku_from_id(item_id, id_to_sku)

    # If still blank, try to lookup from Product Title in Master SKU
    if not sku or sku == '-' or sku == '--':
        title = str(row.get('Title', '')).strip()
        if title:
            # First try exact match
            exact_match = master_sku[master_sku['PRODUCT NAME'].astype(str).str.lower() == title.lower()]
            if not exact_match.empty:
                sku = str(exact_match.iloc[0].get('SKU', '')).strip().upper()
            else:
                # Try matching multiple words from title for better relevance
                words = title.split()[:3]  # Use first 3 words
                for num_words in range(len(words), 0, -1):
                    search_phrase = ' '.join(words[:num_words])
                    title_matches = master_sku[master_sku['PRODUCT NAME'].astype(str).str.contains(
                        search_phrase, case=False, na=False, regex=False)]
                    if not title_matches.empty:
                        # Pick the match with the longest product name (likely more specific)
                        title_matches_len = title_matches['PRODUCT NAME'].str.len()
                        best_idx = title_matches_len.idxmax()
                        sku = str(master_sku.loc[best_idx, 'SKU']).strip().upper()
                        break

    vendor = normalize_vendor(row.get('Brand', ''))

    # Track missing SKUs (but include in main sheet)
    if not sku or sku == '-' or sku == '--':
        title = str(row.get('Title', '')).strip()
        google_missing_skus.append({'Vendor': vendor, 'Product Name': title, 'Source': 'Google'})
        sku = ""  # Set to empty string for upload sheet

    # Get category from Master SKU (only if we have a valid SKU)
    category = lookup_category_from_sku(sku, master_sku) if sku else ""

    google_list.append({
        'Month': month,
        'Platform': 'Google',
        'Product Category': category,
        'SKU': sku,
        'Title': str(row['Title']).strip(),
        'Vendor': vendor,
        'Price': f"${clean_currency(row['Price']):,.2f}" if clean_currency(row['Price']) > 0 else "",
        'Ad Spend': f"${clean_currency(row['Cost']):.2f}",
        'Impressions': f"{clean_number(row['Impr.']):,}" if clean_number(row['Impr.']) > 0 else "",
        'Clicks': f"{clean_number(row['Clicks']):,}" if clean_number(row['Clicks']) > 0 else "",
        'CTR': clean_percent(row['CTR']),
        'Avg. CPC': f"${clean_currency(row['Avg. CPC']):.2f}" if clean_currency(row['Avg. CPC']) > 0 else "",
        'Conversions': f"{float(row['Conversions']):.2f}" if float(row['Conversions']) > 0 else "",
        'Revenue': f"${clean_currency(row['Conv. value']):.2f}" if clean_currency(row['Conv. value']) > 0 else "",
        'Impression share': clean_percent(row['Search impr. share']) if str(row['Search impr. share']).strip() != '--' else "",
        'Impression share lost to rank': clean_percent(row['Search lost IS (rank)']) if str(row['Search lost IS (rank)']).strip() != '--' else "",
        'Absolute top impression share': clean_percent(row['Search abs. top IS']) if str(row['Search abs. top IS']).strip() != '--' else ""
    })

google_processed = pd.DataFrame(google_list)
print(f"   Processed {len(google_processed)} Google records")
print(f"   Missing SKUs: {len(google_missing_skus)}")

# ============================================================================
# 6. COMBINE DATA
# ============================================================================
print("\n5. COMBINING DATA")
combined = pd.concat([bing_processed, google_processed], ignore_index=True)
print(f"   Combined total: {len(combined)} products")

# ============================================================================
# 7. IDENTIFY MISSING CATEGORIES
# ============================================================================
print("\n6. IDENTIFYING MISSING PRODUCT CATEGORIES")

# Filter to only main vendors and blank/missing categories
missing_categories = combined[
    (combined['Vendor'].isin(list(main_vendors.values()))) &
    ((combined['Product Category'].isna()) |
     (combined['Product Category'] == '') |
     (combined['Product Category'].astype(str).str.strip().str.upper() == 'BLANK'))
].copy()
print(f"   Products with missing categories (main vendors only): {len(missing_categories)}")

# ============================================================================
# 8. COMBINE MISSING SKUs
# ============================================================================
print("\n7. COMPILING MISSING SKUs")
all_missing_skus = pd.DataFrame(bing_missing_skus + google_missing_skus)
if len(all_missing_skus) > 0:
    print(f"   Total missing SKUs: {len(all_missing_skus)}")
else:
    print(f"   No missing SKUs found!")

# ============================================================================
# 9. EXPORT UPLOAD SHEET
# ============================================================================
print("\n8. EXPORTING FILES")

# Main upload sheet
output_file = os.path.join(output_dir, f"{month} Product Spend Upload.csv")
combined.to_csv(output_file, index=False, encoding='utf-8')
print(f"   Exported: {output_file} ({len(combined)} rows)")

# Missing categories sheet
missing_cat_file = os.path.join(output_dir, f"{month} Missing Product Categories.csv")
missing_categories.to_csv(missing_cat_file, index=False, encoding='utf-8')
print(f"   Exported: {missing_cat_file} ({len(missing_categories)} rows)")

# Missing SKUs sheet
if len(all_missing_skus) > 0:
    missing_sku_file = os.path.join(output_dir, f"{month} Missing SKUs.csv")
    all_missing_skus.to_csv(missing_sku_file, index=False, encoding='utf-8')
    print(f"   Exported: {missing_sku_file} ({len(all_missing_skus)} rows)")
else:
    print(f"   No missing SKUs to export")

# ============================================================================
# 10. SUMMARY
# ============================================================================
print("\n" + "=" * 120)
print("PROCESSING COMPLETE")
print("=" * 120)

print(f"\nUPLOAD SHEET SUMMARY:")
print(f"  Total products: {len(combined):,}")
print(f"  Bing products: {len(bing_processed):,}")
print(f"  Google products: {len(google_processed):,}")

bing_spend = sum([float(x.replace('$','')) for x in bing_processed['Ad Spend']])
google_spend = sum([float(x.replace('$','')) for x in google_processed['Ad Spend']])
total_spend = bing_spend + google_spend

print(f"\nAD SPEND:")
print(f"  Bing: ${bing_spend:,.2f}")
print(f"  Google: ${google_spend:,.2f}")
print(f"  Total: ${total_spend:,.2f}")

print(f"\nDATA ISSUES TO RESOLVE:")
print(f"  Missing SKUs: {len(all_missing_skus)}")
print(f"  Missing categories: {len(missing_categories)}")

print("\n" + "=" * 120)
