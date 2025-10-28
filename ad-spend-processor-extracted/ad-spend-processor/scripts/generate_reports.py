#!/usr/bin/env python3
"""
Generate spend reports by Vendor and Product Category for Source 4 Industries.
"""

import pandas as pd
from typing import Dict, List


def generate_vendor_spend_report(df: pd.DataFrame) -> pd.DataFrame:
    """
    Aggregate spending by Vendor.
    
    Returns:
        DataFrame with columns: Vendor, Ad Spend, Impressions, Clicks, CTR, Conversions, Revenue
    """
    # Group by vendor
    agg_dict = {
        'Ad Spend': 'sum',
        'Impressions': 'sum',
        'Clicks': 'sum',
        'Conversions': 'sum',
        'Revenue': 'sum',
    }
    
    # Only include columns that exist
    agg_dict = {k: v for k, v in agg_dict.items() if k in df.columns}
    
    vendor_report = df.groupby('Vendor', as_index=False).agg(agg_dict)
    
    # Calculate metrics
    if 'Clicks' in vendor_report.columns and 'Impressions' in vendor_report.columns:
        vendor_report['CTR'] = (vendor_report['Clicks'] / vendor_report['Impressions'] * 100).round(2)
    
    if 'Ad Spend' in vendor_report.columns and 'Clicks' in vendor_report.columns:
        vendor_report['Avg. CPC'] = (vendor_report['Ad Spend'] / vendor_report['Clicks']).round(2)
    
    # Sort by spend descending
    if 'Ad Spend' in vendor_report.columns:
        vendor_report = vendor_report.sort_values('Ad Spend', ascending=False)
    
    # Format currency columns
    for col in ['Ad Spend', 'Revenue', 'Avg. CPC']:
        if col in vendor_report.columns:
            vendor_report[col] = vendor_report[col].round(2)
    
    return vendor_report


def generate_category_spend_report(df: pd.DataFrame) -> pd.DataFrame:
    """
    Aggregate spending by Product Category.
    """
    if 'Product Category' not in df.columns:
        return pd.DataFrame()
    
    agg_dict = {
        'Ad Spend': 'sum',
        'Impressions': 'sum',
        'Clicks': 'sum',
        'Conversions': 'sum',
        'Revenue': 'sum',
    }
    
    agg_dict = {k: v for k, v in agg_dict.items() if k in df.columns}
    
    category_report = df.groupby('Product Category', as_index=False).agg(agg_dict)
    
    # Calculate metrics
    if 'Clicks' in category_report.columns and 'Impressions' in category_report.columns:
        category_report['CTR'] = (category_report['Clicks'] / category_report['Impressions'] * 100).round(2)
    
    if 'Ad Spend' in category_report.columns and 'Clicks' in category_report.columns:
        category_report['Avg. CPC'] = (category_report['Ad Spend'] / category_report['Clicks']).round(2)
    
    # Sort by spend
    if 'Ad Spend' in category_report.columns:
        category_report = category_report.sort_values('Ad Spend', ascending=False)
    
    # Format currency columns
    for col in ['Ad Spend', 'Revenue', 'Avg. CPC']:
        if col in category_report.columns:
            category_report[col] = category_report[col].round(2)
    
    return category_report


def generate_vendor_category_matrix(df: pd.DataFrame, main_vendors: List[str] = None) -> pd.DataFrame:
    """
    Generate a pivot table showing spend by Vendor x Product Category.
    Optionally filter to main vendors only.
    
    Args:
        df: DataFrame with Vendor, Product Category, and Ad Spend columns
        main_vendors: List of main vendors to include (None = all vendors)
    """
    if main_vendors:
        df = df[df['Vendor'].isin(main_vendors)].copy()
    
    if 'Product Category' not in df.columns or 'Vendor' not in df.columns:
        return pd.DataFrame()
    
    # Create pivot table
    matrix = df.pivot_table(
        index='Vendor',
        columns='Product Category',
        values='Ad Spend',
        aggfunc='sum',
        fill_value=0
    )
    
    # Add row totals
    matrix['TOTAL'] = matrix.sum(axis=1)
    
    # Sort by total spend
    matrix = matrix.sort_values('TOTAL', ascending=False)
    
    # Round to 2 decimals
    matrix = matrix.round(2)
    
    return matrix


def generate_main_vendor_summary(df: pd.DataFrame, main_vendors: List[str]) -> pd.DataFrame:
    """
    Generate summary report for main vendors with category breakdowns.
    """
    main_df = df[df['Vendor'].isin(main_vendors)].copy()
    
    summary = []
    
    for vendor in main_vendors:
        vendor_data = main_df[main_df['Vendor'] == vendor]
        
        if vendor_data.empty:
            continue
        
        # Calculate vendor totals
        total_spend = vendor_data['Ad Spend'].sum() if 'Ad Spend' in vendor_data.columns else 0
        total_clicks = vendor_data['Clicks'].sum() if 'Clicks' in vendor_data.columns else 0
        total_impressions = vendor_data['Impressions'].sum() if 'Impressions' in vendor_data.columns else 0
        
        # Get category breakdown
        if 'Product Category' in vendor_data.columns:
            categories = vendor_data.groupby('Product Category')['Ad Spend'].sum().to_dict()
        else:
            categories = {}
        
        summary.append({
            'Vendor': vendor,
            'Total_Spend': round(total_spend, 2),
            'Total_Clicks': int(total_clicks),
            'Total_Impressions': int(total_impressions),
            'Category_Count': len(categories),
            'Top_Category': max(categories, key=categories.get) if categories else 'N/A',
            'Top_Category_Spend': round(max(categories.values(), default=0), 2),
        })
    
    summary_df = pd.DataFrame(summary)
    summary_df = summary_df.sort_values('Total_Spend', ascending=False)
    
    return summary_df


def export_monthly_report(
    vendor_report: pd.DataFrame,
    category_report: pd.DataFrame,
    vendor_category_matrix: pd.DataFrame,
    output_path: str,
    month_name: str = None
):
    """
    Export all reports to an Excel file with multiple sheets.
    """
    with pd.ExcelWriter(output_path, engine='openpyxl') as writer:
        # Write each report to a separate sheet
        if not vendor_report.empty:
            vendor_report.to_excel(writer, sheet_name='Vendor Spend', index=False)
        
        if not category_report.empty:
            category_report.to_excel(writer, sheet_name='Category Spend', index=False)
        
        if not vendor_category_matrix.empty:
            vendor_category_matrix.to_excel(writer, sheet_name='Vendor x Category')
    
    print(f"Report exported to: {output_path}")


if __name__ == "__main__":
    print("Reporting utilities loaded.")
    print("Use generate_vendor_spend_report() and generate_category_spend_report() for analysis.")
