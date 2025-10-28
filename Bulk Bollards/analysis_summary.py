import pandas as pd
import json

# Read the data
wholesale = pd.read_csv(r"C:\Users\blkw\OneDrive\Documents\Claude Code\Source 4 Industries\Bulk Bollards\Wholesale_Pricing.csv")
sales_35 = pd.read_csv(r"C:\Users\blkw\OneDrive\Documents\Claude Code\Source 4 Industries\Bulk Bollards\Pricing_w_Sales_Data_(35_Month).csv")
sales_9 = pd.read_csv(r"C:\Users\blkw\OneDrive\Documents\Claude Code\Source 4 Industries\Bulk Bollards\Pricing_w_Sales_Data_(9_Month).csv")
details_35 = pd.read_csv(r"C:\Users\blkw\OneDrive\Documents\Claude Code\Source 4 Industries\Bulk Bollards\S4_Bollards_35_Month_Data.csv")
details_9 = pd.read_csv(r"C:\Users\blkw\OneDrive\Documents\Claude Code\Source 4 Industries\Bulk Bollards\S4_Bollards_2025_Data_(9_Months.csv")

print("="*100)
print("BULK BOLLARD ORDER ANALYSIS - SOURCEFOUR INDUSTRIES")
print("="*100)
print()

# 1. WHOLESALE PRICING COMPARISON
print("1. WHOLESALE PRICING COMPARISON (ZASP vs 1-800)")
print("-"*100)
print(f"\nTotal Cost Comparison for 500 Units:")
print(f"  ZASP Total Cost:      ${wholesale.loc[wholesale['Product Name'] != 'TOTAL COST', 'ZASP Total Cost'].sum():,.2f}")
print(f"  1800 Total Cost:      ${wholesale.loc[wholesale['Product Name'] != 'TOTAL COST', '1800 Total Cost'].sum():,.2f}")
print(f"  Total Cost Savings:   ${wholesale.loc[wholesale['Product Name'] != 'TOTAL COST', 'Cost Savings'].sum():,.2f}")
print(f"\nPotential Revenue & Profit (500 Units):")
print(f"  S4 Revenue:           ${wholesale.loc[wholesale['Product Name'] != 'TOTAL COST', 'S4 Revenue'].sum():,.2f}")
print(f"  S4 Profit (ZASP):     ${wholesale.loc[wholesale['Product Name'] != 'TOTAL COST', 'S4 Profit'].sum():,.2f}")
print(f"  S4 Margin (ZASP):     {(wholesale.loc[wholesale['Product Name'] != 'TOTAL COST', 'S4 Profit'].sum() / wholesale.loc[wholesale['Product Name'] != 'TOTAL COST', 'S4 Revenue'].sum() * 100):.1f}%")
print()

# Top cost savings by product
print("\nTop 5 Products by Cost Savings (per 50 units):")
top_savings = wholesale[wholesale['Product Name'] != 'TOTAL COST'].nlargest(5, 'Cost Savings')[['Product Name', 'ZASP CPU', '1800 CPU', 'Cost Savings']]
for idx, row in top_savings.iterrows():
    print(f"  {row['Product Name']:<50} | ZASP: ${row['ZASP CPU']:.2f} | 1800: ${row['1800 CPU']:.2f} | Savings: ${row['Cost Savings']:,.2f}")
print()

# 2. HISTORICAL SALES ANALYSIS (35 MONTHS)
print("\n2. HISTORICAL SALES ANALYSIS (35 MONTHS)")
print("-"*100)
print(f"\nTotal Sales Overview:")
print(f"  Total Units Sold:     {sales_35.loc[sales_35['Product Name'] != 'TOTAL', 'Quantity Sold (35 Months)'].sum():.0f} units")
print(f"  Total Revenue:        ${sales_35.loc[sales_35['Product Name'] != 'TOTAL', 'S4 Actual Sales Total'].sum():,.2f}")
print(f"  Average Monthly:      {sales_35.loc[sales_35['Product Name'] != 'TOTAL', 'Quantity Sold (35 Months)'].sum() / 35:.1f} units/month")
print(f"\nProfit Comparison:")
print(f"  Profit with 1800:     ${sales_35.loc[sales_35['Product Name'] != 'TOTAL', 'S4 Profit w 1800 CPU'].sum():,.2f}")
print(f"  Profit with ZASP:     ${sales_35.loc[sales_35['Product Name'] != 'TOTAL', 'S4 Profit w ZASP CPU'].sum():,.2f}")
print(f"  Extra Profit (ZASP):  ${sales_35.loc[sales_35['Product Name'] != 'TOTAL', 'ZASP Extra Profit'].sum():,.2f}")
print(f"  Margin Improvement:   {((sales_35.loc[sales_35['Product Name'] != 'TOTAL', 'S4 Margin w ZASP CPU'].mean() - sales_35.loc[sales_35['Product Name'] != 'TOTAL', 'S4 Margin w 1800 CPU'].mean()) * 100):.1f}%")
print()

# Top sellers
print("\nTop 5 Best Sellers (35 Months):")
top_sellers = sales_35[sales_35['Product Name'] != 'TOTAL'].nlargest(5, 'Quantity Sold (35 Months)')[['Product Name', 'Quantity Sold (35 Months)', 'S4 Actual Sales Total', 'ZASP Extra Profit']]
for idx, row in top_sellers.iterrows():
    print(f"  {row['Product Name']:<50} | {row['Quantity Sold (35 Months)']:.0f} units | ${row['S4 Actual Sales Total']:,.2f} | Extra: ${row['ZASP Extra Profit']:,.2f}")
print()

# 3. RECENT SALES ANALYSIS (9 MONTHS - 2025)
print("\n3. RECENT SALES ANALYSIS (9 MONTHS - 2025)")
print("-"*100)
print(f"\nTotal Sales Overview:")
print(f"  Total Units Sold:     {sales_9.loc[sales_9['Product Name'] != 'TOTAL', 'Quantity Sold (9 Months)'].sum():.0f} units")
print(f"  Total Revenue:        ${sales_9.loc[sales_9['Product Name'] != 'TOTAL', 'S4 Actual Sales Total'].sum():,.2f}")
print(f"  Average Monthly:      {sales_9.loc[sales_9['Product Name'] != 'TOTAL', 'Quantity Sold (9 Months)'].sum() / 9:.1f} units/month")
print(f"\nProfit Comparison:")
print(f"  Profit with 1800:     ${sales_9.loc[sales_9['Product Name'] != 'TOTAL', 'S4 Profit w 1800 CPU'].sum():,.2f}")
print(f"  Profit with ZASP:     ${sales_9.loc[sales_9['Product Name'] != 'TOTAL', 'S4 Profit w ZASP CPU'].sum():,.2f}")
print(f"  Extra Profit (ZASP):  ${sales_9.loc[sales_9['Product Name'] != 'TOTAL', 'ZASP Extra Profit'].sum():,.2f}")
print()

# Top sellers 2025
print("\nTop 5 Best Sellers (2025):")
top_sellers_2025 = sales_9[sales_9['Product Name'] != 'TOTAL'].nlargest(5, 'Quantity Sold (9 Months)')[['Product Name', 'Quantity Sold (9 Months)', 'S4 Actual Sales Total', 'ZASP Extra Profit']]
for idx, row in top_sellers_2025.iterrows():
    print(f"  {row['Product Name']:<50} | {row['Quantity Sold (9 Months)']:.0f} units | ${row['S4 Actual Sales Total']:,.2f} | Extra: ${row['ZASP Extra Profit']:,.2f}")
print()

# 4. RECOMMENDED ORDER QUANTITIES
print("\n4. RECOMMENDED ORDER QUANTITIES")
print("-"*100)
print("\nCalculation Method:")
print("  - Based on 35-month average monthly sales velocity")
print("  - Adjusted for 2025 trends (9-month data)")
print("  - Recommended: 6-month supply for high movers, 4-month for medium, 3-month for slower")
print()

# Calculate recommendations
recommendations = []
for idx, row in sales_35[sales_35['Product Name'] != 'TOTAL'].iterrows():
    sku = row['S4 SKU']
    name = row['Product Name']
    qty_35 = row['Quantity Sold (35 Months)']
    monthly_35 = qty_35 / 35

    # Get 9-month data if available
    match_9 = sales_9[sales_9['S4 SKU'] == sku]
    if not match_9.empty:
        qty_9 = match_9.iloc[0]['Quantity Sold (9 Months)']
        monthly_9 = qty_9 / 9
        # Weight recent data more heavily
        avg_monthly = (monthly_35 * 0.4 + monthly_9 * 0.6)
    else:
        avg_monthly = monthly_35

    # Determine months of supply based on velocity
    if avg_monthly >= 15:  # High velocity
        months_supply = 6
    elif avg_monthly >= 5:  # Medium velocity
        months_supply = 4
    else:  # Lower velocity
        months_supply = 3

    recommended_qty = round(avg_monthly * months_supply)

    # Round to nice numbers (multiples of 5 or 10)
    if recommended_qty >= 50:
        recommended_qty = round(recommended_qty / 10) * 10
    elif recommended_qty >= 10:
        recommended_qty = round(recommended_qty / 5) * 5

    recommendations.append({
        'SKU': sku,
        'Product': name,
        'Avg Monthly': avg_monthly,
        'Months Supply': months_supply,
        'Recommended Qty': recommended_qty,
        'ZASP CPU': row['ZASP CPU'],
        'Total Cost': recommended_qty * row['ZASP CPU']
    })

rec_df = pd.DataFrame(recommendations).sort_values('Avg Monthly', ascending=False)

print("\nRecommended Order Quantities:")
print(f"{'Product':<50} | {'Avg/Mo':<8} | {'Supply':<7} | {'Order Qty':<9} | {'Unit Cost':<10} | {'Total Cost':<12}")
print("-" * 120)
total_units = 0
total_cost = 0
for _, row in rec_df.iterrows():
    print(f"{row['Product']:<50} | {row['Avg Monthly']:>7.1f} | {row['Months Supply']:>6}mo | {row['Recommended Qty']:>8.0f} | ${row['ZASP CPU']:>8.2f} | ${row['Total Cost']:>11,.2f}")
    total_units += row['Recommended Qty']
    total_cost += row['Total Cost']

print("-" * 120)
print(f"{'TOTAL':<50} | {'':>7} | {'':>7} | {total_units:>8.0f} | {'':>10} | ${total_cost:>11,.2f}")
print()

# 5. MONTHLY IMPACT ANALYSIS
print("\n5. MONTHLY IMPACT ANALYSIS")
print("-"*100)
monthly_units_35 = sales_35[sales_35['Product Name'] == 'Monthly']['Quantity Sold (35 Months)'].iloc[0]
monthly_units_9 = sales_9[sales_9['Product Name'] == 'Monthly']['Quantity Sold (9 Months)'].iloc[0]

monthly_profit_1800_35 = sales_35[sales_35['Product Name'] == 'Monthly']['S4 Profit w 1800 CPU'].iloc[0]
monthly_profit_zasp_35 = sales_35[sales_35['Product Name'] == 'Monthly']['S4 Profit w ZASP CPU'].iloc[0]
monthly_extra_35 = sales_35[sales_35['Product Name'] == 'Monthly']['ZASP Extra Profit'].iloc[0]

monthly_profit_1800_9 = sales_9[sales_9['Product Name'] == 'Monthly']['S4 Profit w 1800 CPU'].iloc[0]
monthly_profit_zasp_9 = sales_9[sales_9['Product Name'] == 'Monthly']['S4 Profit w ZASP CPU'].iloc[0]
monthly_extra_9 = sales_9[sales_9['Product Name'] == 'Monthly']['ZASP Extra Profit'].iloc[0]

print(f"\nHistorical Average (35 months):")
print(f"  Monthly Units Sold:     {monthly_units_35:.1f}")
print(f"  Monthly Profit (1800):  ${monthly_profit_1800_35:,.2f}")
print(f"  Monthly Profit (ZASP):  ${monthly_profit_zasp_35:,.2f}")
print(f"  Extra Monthly Profit:   ${monthly_extra_35:,.2f}")
print(f"  Annual Extra Profit:    ${monthly_extra_35 * 12:,.2f}")

print(f"\nRecent Average (2025 - 9 months):")
print(f"  Monthly Units Sold:     {monthly_units_9:.1f}")
print(f"  Monthly Profit (1800):  ${monthly_profit_1800_9:,.2f}")
print(f"  Monthly Profit (ZASP):  ${monthly_profit_zasp_9:,.2f}")
print(f"  Extra Monthly Profit:   ${monthly_extra_9:,.2f}")
print(f"  Annual Extra Profit:    ${monthly_extra_9 * 12:,.2f}")

print()
print("="*100)
print("END OF ANALYSIS")
print("="*100)

# Save recommendations to CSV
rec_df.to_csv(r"C:\Users\blkw\OneDrive\Documents\Claude Code\Source 4 Industries\Bulk Bollards\recommended_order.csv", index=False)
print("\nRecommendations saved to: recommended_order.csv")
