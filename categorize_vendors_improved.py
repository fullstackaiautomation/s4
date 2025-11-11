#!/usr/bin/env python3
"""
Vendor and product category assignment for Source 4 Industries SKUs.
Uses fuzzy matching and keyword analysis to suggest categories.

IMPROVED VERSION:
- Only AUTO-ASSIGNS HIGH confidence (≥70%) suggestions to main data
- Routes MEDIUM/LOW confidence items to separate "Missing Product Categories" file
- Includes confidence scores in missing categories file for review
"""

import pandas as pd
from typing import Dict, List, Tuple
import re


# Source 4 Industries vendor list (18 main vendors)
VENDORS = [
    "S4 Bollards",
    "Handle-It",
    "Casters",  # Combination of: Caster Depot/Colson, DH International, Durable Superior Casters
    "Lincoln Industrial",
    "Noblelift",
    "B&P Manufacturing",
    "Dutro",
    "Reliance Foundry",
    "Ekko Lifts",
    "Adrian's Safety Solutions",
    "Sentry Protection Products",
    "Little Giant",
    "Merrick Machine",
    "Wesco",
    "Valley Craft",
    "Bluff Manufacturing",
    "Meco-Omaha",
    "Apollo Forklift",
]

# Additional vendors (not main 18)
OTHER_VENDORS = [
    "ANNT Bollards",
    "Luxor",
    "Durable Superior Casters",
    "Ravas",
    "Electro Kinetic Technologies",
    "R&B Wire",
    "Suncast",
]


# Product category keywords for intelligent categorization
# Organized by Main Vendor → Subcategories

CATEGORY_KEYWORDS = {
    # S4 Bollards
    "Bollard Covers": ["bollard cover", "cover"],
    "Crash Rated Bollards": ["crash rated", "k4", "k8", "k12", "crash test"],
    "Fixed Bollards": ["fixed bollard", "permanent bollard", "embedded"],
    "Flexible Bollards": ["flexible bollard", "flex post", "spring bollard"],
    "Removable Bollards": ["removable bollard", "lift out", "key lock"],
    "Retractable Bollards": ["retractable bollard", "automatic bollard", "hydraulic bollard"],

    # Handle-It
    "Floor Mounted Barrier": ["floor mounted barrier", "barrier system"],
    "Forklift Wheel Stops": ["wheel stop", "forklift stop", "parking stop"],
    "Guard Rail": ["guard rail", "guardrail", "safety rail", "railing"],
    "Rack Protection": ["rack protector", "column protector", "pallet rack"],
    "Stretch Wrap Machines": ["stretch wrap", "wrapper", "wrapping machine"],

    # Casters (Caster Depot/Colson, DH International, Durable Superior Casters)
    "Bellman Casters": ["bellman", "hospitality caster"],
    "Gate Casters": ["gate caster", "gate wheel"],
    "General Casters": ["caster", "wheel", "swivel", "rigid", "brake"],
    "Heavy Duty / Container": ["heavy duty caster", "container caster", "capacity"],
    "High Temp Casters": ["high temp", "high temperature", "heat resistant"],
    "Leveling Casters": ["leveling", "leveling foot"],

    # Lincoln Industrial
    "Air Motors": ["air motor", "pneumatic motor"],
    "Hoses": ["hose", "fluid hose", "grease hose"],
    "Kits": ["kit", "grease kit", "lubrication kit"],
    "Other": ["other", "accessory", "adapter"],
    "Pumps": ["pump", "grease pump", "fluid pump"],
    "Quicklub": ["quicklub", "quick lub"],

    # Noblelift
    "Battery, Charger, Accessories": ["battery", "charger", "charging"],
    "Bigger Electric Equipment": ["big joe", "bigger", "large capacity"],
    "EDGE Powered": ["edge", "edge powered"],
    "Electric Pallet Jacks": ["electric pallet jack", "powered pallet", "EPJ"],
    "Manual Pallet Jacks": ["manual pallet jack", "hand pallet", "MPJ"],
    "Scissor Lifts": ["scissor lift", "scissor table"],
    "Straddle Stackers": ["straddle stacker", "stacker"],

    # B&P Manufacturing
    "Aristocrat": ["aristocrat"],
    "Carts": ["cart", "platform cart"],
    "Dock Plates": ["dock plate", "loading plate"],
    "Hand Truck Accessories": ["hand truck accessory", "noseplate", "extension"],
    "Hand Trucks": ["hand truck", "dolly"],
    "Ramps": ["ramp", "loading ramp"],

    # Dutro
    "Accessories": ["accessory", "bracket", "strap"],
    "Carts": ["cart"],
    "Dollies": ["dolly", "furniture dolly"],
    "Hand Trucks": ["hand truck"],
    "Mattress Moving Carts": ["mattress cart", "mattress mover"],
    "Vending Machine Trucks": ["vending machine", "appliance dolly"],

    # Reliance Foundry
    "Bollard Covers": ["bollard cover"],
    "Crash Rated Bollards": ["crash rated"],
    "Decorative Bollards": ["decorative bollard", "ornamental"],
    "Fixed Bollards": ["fixed bollard"],
    "Flexible Bollards": ["flexible bollard"],
    "Fold Down Bollards": ["fold down", "folding bollard"],
    "Removable Bollards": ["removable bollard"],
    "Retractable Bollards": ["retractable bollard"],

    # Ekko Lifts
    "Electric Forklifts": ["electric forklift", "counterbalance"],
    "Electric Pallet Jacks": ["electric pallet jack", "EPJ"],
    "Electric Straddle Stackers": ["electric straddle", "stacker"],
    "Electric Walkie Stackers": ["walkie stacker", "walkie reach"],
    "Other": ["other"],

    # Adrian's Safety Solutions
    "Cargo Safety": ["cargo net", "cargo strap", "tie down"],
    "Pallet Rack Safety Straps": ["safety strap", "rack strap"],
    "Pallet Rack Safety Netting": ["safety net", "rack netting", "netting"],

    # Sentry Protection Products
    "ST - Accessories": ["sentry accessory", "anchor"],
    "ST - Collision Sentry": ["collision sentry", "impact protection"],
    "ST - Column Protectors": ["column protector", "post protector"],

    # Little Giant
    "Cabinet": ["cabinet", "storage cabinet"],
    "Carts": ["cart"],
    "Dollies": ["dolly"],
    "Gas Cylinder": ["gas cylinder", "cylinder truck"],
    "Rack": ["rack", "ladder rack"],
    "Tables": ["table", "work table"],

    # Merrick Machine
    "Accessories": ["accessory"],
    "Auto Dollies": ["auto dolly", "car dolly"],
    "Auto Rotisseries": ["rotisserie", "auto rotisserie"],
    "Flat Top Dollies": ["flat top", "panel dolly"],
    "Lifts, Rack, Stands": ["lift", "rack", "stand"],
    "Other Dollies": ["dolly"],

    # Wesco
    "Accessories & Other": ["accessory", "part"],
    "Carts, Hand Trucks & Dollies": ["cart", "hand truck", "dolly"],
    "Dock Equipment": ["dock", "leveler"],
    "Drum Equipment": ["drum", "barrel"],
    "Lifts & Stackers": ["lift", "stacker"],
    "Pallet Jacks": ["pallet jack"],

    # Valley Craft
    "Accessories": ["accessory"],
    "Cabinets & Desks": ["cabinet", "desk"],
    "Carts": ["cart"],
    "Dumpers & Lifts": ["dumper", "lift", "tipper"],
    "Hand Trucks & Dollies": ["hand truck", "dolly"],
    "Other": ["other"],

    # Bluff Manufacturing
    "Bollards & Protectors": ["bollard", "protector"],
    "Dock Boards": ["dock board", "bridge plate"],
    "Edge of Dock Levelers": ["edge of dock", "EOD"],
    "Other": ["other"],
    "Ramps": ["ramp", "yard ramp"],
    "Stairways": ["stairway", "stairs"],

    # Meco-Omaha
    "Cantilever": ["cantilever"],
    "Carts & Dollies": ["cart", "dolly"],
    "Guard Rail": ["guard rail", "railing"],
    "Hoppers": ["hopper", "self dumping"],
    "Other": ["other"],
    "Racking": ["rack", "pallet rack"],

    # Apollo Forklift
    "AF - Electric Pallet Jacks": ["electric pallet jack"],
    "AF - Electric Stackers": ["electric stacker"],
    "AF - Manual Pallet Jacks": ["manual pallet jack"],
    "AF - Manual Stackers": ["manual stacker"],
    "AF - Order Pickers": ["order picker"],
    "AF - Scissor Lifts": ["scissor lift"],
}


def assign_vendor_from_sku_or_title(row: pd.Series, master_sku_df: pd.DataFrame = None) -> str:
    """
    Assign vendor based on SKU patterns or title keywords.
    Falls back to MASTER SKU lookup if available.
    Maps vendor variations to main 18 vendor names.
    """
    sku = str(row.get('SKU', ''))
    title = str(row.get('Title', ''))

    # Check MASTER SKU first if available
    if master_sku_df is not None and sku:
        match = master_sku_df[master_sku_df['SKU'] == sku]
        if not match.empty and 'VENDOR' in match.columns:
            vendor = match.iloc[0]['VENDOR']
            if pd.notna(vendor) and vendor.strip():
                # Map variations to main names
                return normalize_vendor_name(vendor)

    # SKU pattern matching
    if sku.startswith('1426') or 'Lincoln' in title:
        return 'Lincoln Industrial'
    elif sku.startswith('00-') or 'Luxor' in title:
        return 'Luxor'  # Not main 18, but known vendor
    elif 'ANNT' in sku or 'ANNT' in title:
        return 'ANNT Bollards'  # Maps to S4 Bollards in some contexts
    elif 'CoreFlex' in title or 'Coreflex' in title:
        return 'ANNT Bollards'
    elif 'BDB' in sku or 'BDBB' in sku:
        return 'ANNT Bollards'
    elif 'E50' in sku or 'Ekko' in title:
        return 'Ekko Lifts'
    elif sku.startswith('01HR') or sku.startswith('01PO') or sku.startswith('03MA') or sku.startswith('03PO') or sku.startswith('04MA'):
        return 'Casters'  # Durable Superior → Casters main vendor
    elif sku.startswith('02') or sku.startswith('03') or sku.startswith('04'):
        return 'Ekko Lifts'
    elif 'RAVAS' in title.upper():
        return 'Ravas'
    elif sku.startswith('0244') or sku.startswith('0845'):
        return 'Electro Kinetic Technologies'
    elif 'Handle' in title and 'It' in title:
        return 'Handle-It'
    elif 'Noblelift' in title or 'EDGE' in title:
        return 'Noblelift'
    elif 'B&P' in title or 'B & P' in title:
        return 'B&P Manufacturing'
    elif 'Dutro' in title:
        return 'Dutro'
    elif 'Reliance' in title:
        return 'Reliance Foundry'
    elif "Adrian" in title or "Adrian's" in title:
        return "Adrian's Safety Solutions"
    elif 'Sentry' in title:
        return 'Sentry Protection Products'
    elif 'Little Giant' in title:
        return 'Little Giant'
    elif 'Merrick' in title:
        return 'Merrick Machine'
    elif 'Wesco' in title:
        return 'Wesco'
    elif 'Valley Craft' in title:
        return 'Valley Craft'
    elif 'Bluff' in title:
        return 'Bluff Manufacturing'
    elif 'Meco' in title or 'Omaha' in title:
        return 'Meco-Omaha'
    elif 'Apollo' in title:
        return 'Apollo Forklift'

    # Check title for vendor names (more general matching)
    title_lower = title.lower()

    vendor_patterns = {
        'S4 Bollards': ['s4 bollard', 'source 4 bollard'],
        'Casters': ['caster depot', 'colson', 'dh international'],
        'R&B Wire': ['r&b wire', 'r & b wire', 'utility cart'],
    }

    for vendor, patterns in vendor_patterns.items():
        if any(pattern in title_lower for pattern in patterns):
            return vendor

    return ""


def normalize_vendor_name(vendor: str) -> str:
    """
    Normalize vendor name variations to main 18 vendor names.
    """
    vendor_clean = vendor.strip()

    # Mapping of variations to main names
    vendor_map = {
        # Casters variations
        'Durable Superior Casters': 'Casters',
        'Caster Depot': 'Casters',
        'Colson': 'Casters',
        'DH International': 'Casters',

        # Handle-It variations
        'Handle It': 'Handle-It',
        'HandleIt': 'Handle-It',

        # Adrian's variations
        'Adrian': "Adrian's Safety Solutions",
        "Adrians": "Adrian's Safety Solutions",

        # Sentry variations
        'Sentry': 'Sentry Protection Products',

        # Bluff variations
        'Bluff': 'Bluff Manufacturing',

        # Reliance variations
        'Reliance': 'Reliance Foundry',
    }

    return vendor_map.get(vendor_clean, vendor_clean)


def suggest_product_category(row: pd.Series, master_sku_df: pd.DataFrame = None) -> Tuple[str, float]:
    """
    Suggest product category based on title keywords and existing patterns.

    Returns:
        Tuple of (suggested_category, confidence_score)
        confidence_score: 0.0 to 1.0, where 1.0 is high confidence
    """
    title = str(row.get('Title', '')).lower()
    product_name = str(row.get('PRODUCT NAME', '')).lower()
    sku = str(row.get('SKU', ''))

    # Check MASTER SKU first if available
    if master_sku_df is not None and sku:
        match = master_sku_df[master_sku_df['SKU'] == sku]
        if not match.empty and 'PRODUCT CATEGORY' in match.columns:
            category = match.iloc[0]['PRODUCT CATEGORY']
            if pd.notna(category) and category.strip() and category.strip().upper() != 'BLANK':
                return category, 1.0  # High confidence from existing data

    # Combine title and product name for matching
    text = f"{title} {product_name}"

    # Score each category based on keyword matches
    scores = {}
    for category, keywords in CATEGORY_KEYWORDS.items():
        score = 0
        for keyword in keywords:
            if keyword.lower() in text:
                # Longer, more specific keywords get higher scores
                score += len(keyword.split())
        if score > 0:
            scores[category] = score

    if not scores:
        return "BLANK", 0.0

    # Get category with highest score
    best_category = max(scores, key=scores.get)
    max_score = scores[best_category]

    # Calculate confidence (normalize based on keyword match strength)
    # More specific matches = higher confidence
    confidence = min(max_score / 3.0, 1.0)  # Cap at 1.0

    return best_category, confidence


def find_blank_categories(df: pd.DataFrame, vendors: List[str] = None) -> pd.DataFrame:
    """
    Find SKUs with blank or missing product categories.
    Optionally filter by specific vendors (main vendors).

    Args:
        df: DataFrame with SKU, Vendor, and Product Category columns
        vendors: List of vendors to filter by (e.g., main vendors only)

    Returns:
        DataFrame of SKUs needing category assignment
    """
    # Find rows where category is blank, null, or literally "BLANK"
    blank_mask = (
        df['Product Category'].isna() |
        (df['Product Category'] == '') |
        (df['Product Category'].str.upper() == 'BLANK')
    )

    blank_df = df[blank_mask].copy()

    # Filter by vendors if specified
    if vendors:
        blank_df = blank_df[blank_df['Vendor'].isin(vendors)]

    return blank_df


def auto_categorize_blanks(df: pd.DataFrame, master_sku_df: pd.DataFrame = None) -> Tuple[pd.DataFrame, pd.DataFrame]:
    """
    IMPROVED: Automatically suggest categories for blank SKUs.

    Returns HIGH confidence suggestions applied to data, and MEDIUM/LOW confidence
    suggestions as a separate "Missing Product Categories" file.

    Returns:
        Tuple of (high_confidence_df, low_confidence_suggestions_df)
        - high_confidence_df: Data with HIGH confidence (≥70%) categories auto-assigned
        - low_confidence_suggestions_df: All items with their suggestions + confidence scores
    """
    results = []

    for idx, row in df.iterrows():
        suggested_cat, confidence = suggest_product_category(row, master_sku_df)
        results.append({
            'SKU': row.get('SKU', ''),
            'Title': row.get('Title', ''),
            'Vendor': row.get('Vendor', ''),
            'Platform': row.get('Platform', ''),
            'Price': row.get('Price', ''),
            'Ad Spend': row.get('Ad Spend', ''),
            'Impressions': row.get('Impressions', ''),
            'Clicks': row.get('Clicks', ''),
            'CTR': row.get('CTR', ''),
            'Avg. CPC': row.get('Avg. CPC', ''),
            'Conversions': row.get('Conversions', ''),
            'Revenue': row.get('Revenue', ''),
            'Impression share': row.get('Impression share', ''),
            'Impression share lost to rank': row.get('Impression share lost to rank', ''),
            'Absolute top impression share': row.get('Absolute top impression share', ''),
            'Suggested_Category': suggested_cat,
            'Confidence': f"{confidence:.0%}",
            'Confidence_Score': confidence,
        })

    results_df = pd.DataFrame(results)

    # Split into HIGH confidence (auto-assign) and LOW confidence (needs review)
    high_conf_mask = results_df['Confidence_Score'] >= 0.7
    high_conf_df = results_df[high_conf_mask].copy()
    low_conf_df = results_df[~high_conf_mask].copy()

    # For high confidence, apply the suggested category
    high_conf_df['Product Category'] = high_conf_df['Suggested_Category']

    # Sort both by confidence (descending for low conf to see medium first)
    low_conf_df = low_conf_df.sort_values('Confidence_Score', ascending=False)

    return high_conf_df, low_conf_df


def generate_category_report(suggestions_df: pd.DataFrame) -> str:
    """
    Generate a human-readable report of category suggestions for review.
    """
    report = []
    report.append("=" * 80)
    report.append("PRODUCT CATEGORY SUGGESTIONS FOR REVIEW")
    report.append("=" * 80)
    report.append("")

    # Group by confidence level
    high_conf = suggestions_df[suggestions_df['Confidence_Score'] >= 0.7]
    medium_conf = suggestions_df[(suggestions_df['Confidence_Score'] >= 0.4) &
                                  (suggestions_df['Confidence_Score'] < 0.7)]
    low_conf = suggestions_df[suggestions_df['Confidence_Score'] < 0.4]

    report.append(f"HIGH CONFIDENCE ({len(high_conf)} items) - AUTO-ASSIGNED:")
    report.append("-" * 80)
    for _, row in high_conf.iterrows():
        report.append(f"SKU: {row['SKU']}")
        report.append(f"  Title: {row['Title'][:60]}...")
        report.append(f"  Assigned: {row['Suggested_Category']} (Confidence: {row['Confidence']})")
        report.append("")

    report.append(f"\nMEDIUM CONFIDENCE ({len(medium_conf)} items) - NEEDS REVIEW:")
    report.append("-" * 80)
    for _, row in medium_conf.iterrows():
        report.append(f"SKU: {row['SKU']}")
        report.append(f"  Title: {row['Title'][:60]}...")
        report.append(f"  Suggested: {row['Suggested_Category']} (Confidence: {row['Confidence']})")
        report.append("")

    report.append(f"\nLOW CONFIDENCE ({len(low_conf)} items) - MANUAL REVIEW RECOMMENDED:")
    report.append("-" * 80)
    for _, row in low_conf.iterrows():
        report.append(f"SKU: {row['SKU']}")
        report.append(f"  Title: {row['Title'][:60]}...")
        report.append(f"  Suggested: {row['Suggested_Category']} (Confidence: {row['Confidence']})")
        report.append("")

    return "\n".join(report)


if __name__ == "__main__":
    print("Vendor and category assignment utilities loaded (IMPROVED VERSION).")
    print(f"Configured for {len(VENDORS)} vendors and {len(CATEGORY_KEYWORDS)} category types.")
    print("\nKey improvement: HIGH confidence (≥70%) auto-assigned, others routed to review file.")
