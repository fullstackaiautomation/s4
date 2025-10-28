#!/usr/bin/env python3
"""
Process Google Ads and Bing Ads data for Source 4 Industries monthly reporting.
Handles data cleaning, SKU extraction, and standardization per exact specifications.
"""

import pandas as pd
import re
from datetime import datetime
from typing import Optional, List


def format_month(date_value=None) -> str:
    """Format month as YYYY-MM."""
    if date_value and pd.notna(date_value):
        date_str = str(date_value).strip()
        if re.match(r'^\d{4}-\d{2}$', date_str):
            return date_str
        try:
            dt = pd.to_datetime(date_value)
            return dt.strftime('%Y-%m')
        except:
            pass
    return datetime.now().strftime('%Y-%m')


def lookup_sku_from_id(item_id: str, id_to_sku_df: Optional[pd.DataFrame] = None) -> str:
    """
    Look up SKU from Google Merchant Center ID using ID to SKU mapping.
    
    Args:
        item_id: Google Item ID / Product ID
        id_to_sku_df: DataFrame with 'id' and 'custom label 1' columns
    
    Returns:
        SKU if found, empty string otherwise
    """
    if pd.isna(item_id) or id_to_sku_df is None or id_to_sku_df.empty:
        return ""
    
    # Search for ID in the mapping
    match = id_to_sku_df[id_to_sku_df['id'].astype(str) == str(item_id)]
    if not match.empty and 'custom label 1' in match.columns:
        sku = match.iloc[0]['custom label 1']
        if pd.notna(sku) and str(sku).strip():
            return str(sku).strip()
    
    return ""


def format_vendor_name(vendor) -> str:
    """Format vendor name with proper capitalization."""
    if pd.isna(vendor) or not str(vendor).strip():
        return ''
    
    vendor = str(vendor).strip()
    
    # Known vendor formatting
    vendor_formatting = {
        'handle it': 'Handle-It',
        'handleit': 'Handle-It',
        'handle-it': 'Handle-It',
        'durable superior casters': 'Durable Superior Casters',
        'durable superior': 'Durable Superior Casters',
        'lincoln industrial': 'Lincoln Industrial',
        'lincoln': 'Lincoln Industrial',
        'b&p manufacturing': 'B&P Manufacturing',
        'b & p manufacturing': 'B&P Manufacturing',
        "adrian's safety solutions": "Adrian's Safety Solutions",
        'adrians safety solutions': "Adrian's Safety Solutions",
        'sentry protection products': 'Sentry Protection Products',
        'sentry': 'Sentry Protection Products',
        'bluff manufacturing': 'Bluff Manufacturing',
        'bluff': 'Bluff Manufacturing',
        'reliance foundry': 'Reliance Foundry',
        'reliance': 'Reliance Foundry',
    }
    
    vendor_lower = vendor.lower()
    if vendor_lower in vendor_formatting:
        return vendor_formatting[vendor_lower]
    
    return vendor.title()


def clean_currency(series: pd.Series) -> pd.Series:
    """Clean currency values: remove $, commas, convert to float."""
    cleaned = (series
               .astype(str)
               .str.replace('$', '', regex=False)
               .str.replace(',', '', regex=False)
               .str.replace('%', '', regex=False)
               .str.strip())
    return pd.to_numeric(cleaned, errors='coerce').fillna(0.0)


def clean_integer(series: pd.Series) -> pd.Series:
    """Clean integer values: remove commas, convert to int. No decimal places."""
    cleaned = (series
               .astype(str)
               .str.replace(',', '', regex=False)
               .str.strip())
    return pd.to_numeric(cleaned, errors='coerce').fillna(0).astype(int)


def clean_percentage(series: pd.Series) -> pd.Series:
    """
    Clean percentage values.
    Input: "0.46%" means 0.46% (not 46%)
    Output: Return as decimal (0.0046 for 0.46%)
    """
    def parse_pct(val):
        if pd.isna(val):
            return 0.0
        
        val_str = str(val).strip()
        if not val_str or val_str == '--':
            return 0.0
        
        # Remove % if present
        val_str = val_str.replace('%', '')
        
        try:
            num = float(val_str)
            # Already a percentage, divide by 100 to get decimal
            return num / 100.0
        except:
            return 0.0
    
    return series.apply(parse_pct)


def clean_percentage_or_blank(series: pd.Series) -> pd.Series:
    """Clean percentage values, leave blank if '--' or missing."""
    def parse_pct_or_blank(val):
        if pd.isna(val):
            return None
        
        val_str = str(val).strip()
        if not val_str or val_str == '--' or val_str == '<10%':
            return None
        
        # Remove % if present
        val_str = val_str.replace('%', '')
        
        try:
            num = float(val_str)
            return num / 100.0
        except:
            return None
    
    return series.apply(parse_pct_or_blank)


def clean_conversions(series: pd.Series) -> pd.Series:
    """
    Clean conversion values.
    2 decimal places unless zero (then no decimal places).
    """
    return clean_currency(series)


def clean_google_ads_data(df: pd.DataFrame, id_to_sku_df: Optional[pd.DataFrame] = None, month: Optional[str] = None) -> pd.DataFrame:
    """
    Clean and standardize Google Ads export data per Source 4 specifications.
    
    Args:
        df: Raw Google Ads data
        id_to_sku_df: Optional ID to SKU mapping from Google Merchant Center
        month: Month string in YYYY-MM format (defaults to current month)
    
    Returns:
        Cleaned DataFrame with standardized columns
    """
    df_clean = df.copy()
    
    # Month - Format as YYYY-MM
    df_clean['Month'] = format_month(month)
    
    # Platform
    df_clean['Platform'] = 'Google'
    
    # SKU - Custom label 1, fallback to Item ID lookup
    if 'Custom label 1' in df_clean.columns:
        df_clean['SKU'] = df_clean['Custom label 1'].fillna('')
    else:
        df_clean['SKU'] = ''
    
    # For blank SKUs, try Item ID lookup
    if id_to_sku_df is not None and 'Item ID' in df_clean.columns:
        for idx, row in df_clean[df_clean['SKU'] == ''].iterrows():
            if pd.notna(row['Item ID']):
                sku = lookup_sku_from_id(row['Item ID'], id_to_sku_df)
                if sku:
                    df_clean.at[idx, 'SKU'] = sku
    
    # Title
    if 'Product title' in df_clean.columns:
        df_clean['Title'] = df_clean['Product title']
    elif 'Title' not in df_clean.columns:
        df_clean['Title'] = ''
    
    # Vendor - Brand with proper formatting
    if 'Brand' in df_clean.columns:
        df_clean['Vendor'] = df_clean['Brand'].apply(format_vendor_name)
    else:
        df_clean['Vendor'] = ''
    
    # Price - $ formatting
    if 'Price' in df_clean.columns:
        df_clean['Price'] = clean_currency(df_clean['Price'])
    else:
        df_clean['Price'] = 0.0
    
    # Ad Spend - Cost column, $ formatting
    if 'Cost' in df_clean.columns:
        df_clean['Ad Spend'] = clean_currency(df_clean['Cost'])
    elif 'Ad Spend' in df_clean.columns:
        df_clean['Ad Spend'] = clean_currency(df_clean['Ad Spend'])
    else:
        df_clean['Ad Spend'] = 0.0
    
    # Impressions - Impr. column, no decimals
    if 'Impr.' in df_clean.columns:
        df_clean['Impressions'] = clean_integer(df_clean['Impr.'])
    elif 'Impressions' in df_clean.columns:
        df_clean['Impressions'] = clean_integer(df_clean['Impressions'])
    else:
        df_clean['Impressions'] = 0
    
    # Clicks - no decimals
    if 'Clicks' in df_clean.columns:
        df_clean['Clicks'] = clean_integer(df_clean['Clicks'])
    else:
        df_clean['Clicks'] = 0
    
    # CTR - % formatting (1.95 in file means 1.95%, not 195%)
    if 'CTR' in df_clean.columns:
        df_clean['CTR'] = clean_percentage(df_clean['CTR'])
    else:
        df_clean['CTR'] = 0.0
    
    # Avg. CPC - $ formatting
    if 'Avg. CPC' in df_clean.columns:
        df_clean['Avg. CPC'] = clean_currency(df_clean['Avg. CPC'])
    else:
        df_clean['Avg. CPC'] = 0.0
    
    # Conversions - 2 decimals unless zero
    if 'Conv.' in df_clean.columns:
        df_clean['Conversions'] = clean_conversions(df_clean['Conv.'])
    elif 'Conversions' in df_clean.columns:
        df_clean['Conversions'] = clean_conversions(df_clean['Conversions'])
    else:
        df_clean['Conversions'] = 0.0
    
    # Revenue - Conv. value column, $ formatting
    if 'Conv. value' in df_clean.columns:
        df_clean['Revenue'] = clean_currency(df_clean['Conv. value'])
    elif 'Revenue' in df_clean.columns:
        df_clean['Revenue'] = clean_currency(df_clean['Revenue'])
    else:
        df_clean['Revenue'] = 0.0
    
    # Impression share - "Search impr. share", blank if "--"
    if 'Search impr. share' in df_clean.columns:
        df_clean['Impression share'] = clean_percentage_or_blank(df_clean['Search impr. share'])
    else:
        df_clean['Impression share'] = None
    
    # Impression share lost to rank - "Search lost IS (rank)", blank if "--"
    if 'Search lost IS (rank)' in df_clean.columns:
        df_clean['Impression share lost to rank'] = clean_percentage_or_blank(df_clean['Search lost IS (rank)'])
    else:
        df_clean['Impression share lost to rank'] = None
    
    # Absolute top impression share - "Search abs. top IS", blank if "--"
    if 'Search abs. top IS' in df_clean.columns:
        df_clean['Absolute top impression share'] = clean_percentage_or_blank(df_clean['Search abs. top IS'])
    else:
        df_clean['Absolute top impression share'] = None
    
    return df_clean


def clean_bing_ads_data(df: pd.DataFrame, month: Optional[str] = None) -> pd.DataFrame:
    """
    Clean and standardize Bing Ads export data per Source 4 specifications.
    
    Args:
        df: Raw Bing Ads data
        month: Month string in YYYY-MM format (defaults to current month)
    
    Returns:
        Cleaned DataFrame with standardized columns
    """
    df_clean = df.copy()
    
    # Month - Format as YYYY-MM
    df_clean['Month'] = format_month(month)
    
    # Platform
    df_clean['Platform'] = 'Bing'
    
    # SKU - Custom label 1 (Product), fallback to Merchant product ID
    if 'Custom label 1 (Product)' in df_clean.columns:
        df_clean['SKU'] = df_clean['Custom label 1 (Product)'].fillna('')
    else:
        df_clean['SKU'] = ''
    
    # For blank SKUs, use Merchant product ID
    if 'Merchant product ID' in df_clean.columns:
        for idx, row in df_clean[df_clean['SKU'] == ''].iterrows():
            if pd.notna(row['Merchant product ID']):
                df_clean.at[idx, 'SKU'] = str(row['Merchant product ID'])
    
    # Title
    if 'Title' not in df_clean.columns:
        df_clean['Title'] = ''
    
    # Vendor - Brand
    if 'Brand' in df_clean.columns:
        df_clean['Vendor'] = df_clean['Brand'].fillna('')
    else:
        df_clean['Vendor'] = ''
    
    # Price - $ formatting
    if 'Price' in df_clean.columns:
        df_clean['Price'] = clean_currency(df_clean['Price'])
    else:
        df_clean['Price'] = 0.0
    
    # Ad Spend - Spend column, $ formatting
    if 'Spend' in df_clean.columns:
        df_clean['Ad Spend'] = clean_currency(df_clean['Spend'])
    elif 'Ad Spend' in df_clean.columns:
        df_clean['Ad Spend'] = clean_currency(df_clean['Ad Spend'])
    else:
        df_clean['Ad Spend'] = 0.0
    
    # Impressions - no decimals
    if 'Impressions' in df_clean.columns:
        df_clean['Impressions'] = clean_integer(df_clean['Impressions'])
    else:
        df_clean['Impressions'] = 0
    
    # Clicks - no decimals  
    if 'Clicks' in df_clean.columns:
        df_clean['Clicks'] = clean_integer(df_clean['Clicks'])
    else:
        df_clean['Clicks'] = 0
    
    # CTR - % formatting (0.46% means 0.46%, not 46%)
    if 'CTR' in df_clean.columns:
        df_clean['CTR'] = clean_percentage(df_clean['CTR'])
    else:
        df_clean['CTR'] = 0.0
    
    # Avg. CPC - $ formatting
    if 'Avg. CPC' in df_clean.columns:
        df_clean['Avg. CPC'] = clean_currency(df_clean['Avg. CPC'])
    else:
        df_clean['Avg. CPC'] = 0.0
    
    # Conversions - 2 decimals unless zero
    if 'Conversions' in df_clean.columns:
        df_clean['Conversions'] = clean_conversions(df_clean['Conversions'])
    else:
        df_clean['Conversions'] = 0.0
    
    # Revenue - $ formatting
    if 'Revenue' in df_clean.columns:
        df_clean['Revenue'] = clean_currency(df_clean['Revenue'])
    else:
        df_clean['Revenue'] = 0.0
    
    # Impression share - blank if missing
    if 'Impression share' in df_clean.columns:
        df_clean['Impression share'] = clean_percentage_or_blank(df_clean['Impression share'])
    else:
        df_clean['Impression share'] = None
    
    # Impression share lost to rank
    if 'Impression share lost to rank' in df_clean.columns:
        df_clean['Impression share lost to rank'] = clean_percentage_or_blank(df_clean['Impression share lost to rank'])
    else:
        df_clean['Impression share lost to rank'] = None
    
    # Absolute top impression share
    if 'Absolute top impression share' in df_clean.columns:
        df_clean['Absolute top impression share'] = clean_percentage_or_blank(df_clean['Absolute top impression share'])
    else:
        df_clean['Absolute top impression share'] = None
    
    return df_clean


def combine_platform_data(google_df: pd.DataFrame, bing_df: pd.DataFrame) -> pd.DataFrame:
    """
    Combine cleaned Google and Bing data.
    Keeps platforms separate (doesn't aggregate by SKU).
    """
    # Ensure both have same columns
    all_columns = set(google_df.columns) | set(bing_df.columns)
    
    for col in all_columns:
        if col not in google_df.columns:
            google_df[col] = None
        if col not in bing_df.columns:
            bing_df[col] = None
    
    # Combine
    combined = pd.concat([google_df, bing_df], ignore_index=True)
    
    return combined


def find_missing_skus(ad_data_df: pd.DataFrame, master_sku_df: pd.DataFrame) -> List[str]:
    """Find SKUs present in ad data but not in MASTER SKU tab."""
    ad_skus = set(ad_data_df['SKU'].dropna().unique())
    master_skus = set(master_sku_df['SKU'].dropna().unique())
    
    missing = ad_skus - master_skus
    return sorted(list(missing))


def calculate_metrics(df: pd.DataFrame) -> pd.DataFrame:
    """Calculate derived metrics: CTR, Avg CPC, etc. (if not already present)."""
    df_calc = df.copy()
    
    # Only calculate if not already present
    if 'CTR' not in df.columns or df['CTR'].isna().all():
        if 'Clicks' in df.columns and 'Impressions' in df.columns:
            df_calc['CTR'] = (df_calc['Clicks'] / df_calc['Impressions']).fillna(0)
    
    if 'Avg. CPC' not in df.columns or df['Avg. CPC'].isna().all():
        if 'Ad Spend' in df.columns and 'Clicks' in df.columns:
            df_calc['Avg. CPC'] = (df_calc['Ad Spend'] / df_calc['Clicks']).replace([float('inf'), -float('inf')], 0).fillna(0)
    
    return df_calc


if __name__ == "__main__":
    print("Ad data processing utilities loaded.")
    print("Use clean_google_ads_data() and clean_bing_ads_data() to process your CSVs.")
