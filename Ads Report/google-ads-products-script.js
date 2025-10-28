/**
 * GOOGLE ADS SCRIPT - Monthly PRODUCT Performance Export
 * Pulls product-level data (Shopping campaigns)
 * Matches your manual export: Campaigns → Products
 */

// ====== CONFIGURATION ======
const SPREADSHEET_URL = 'https://docs.google.com/spreadsheets/d/1jj3I4pXMbtZr4DmycxE8B6s-vLAk0C-g_N6LDptWNPs/edit';
const SHEET_NAME = 'Google Dirty';

// Date range - set to last month
const today = new Date();
const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);

const DATE_RANGE = {
  start: Utilities.formatDate(lastMonth, 'America/New_York', 'yyyyMMdd'),
  end: Utilities.formatDate(lastMonthEnd, 'America/New_York', 'yyyyMMdd')
};

// ====== MAIN FUNCTION ======
function main() {
  Logger.log('📊 Starting Google Ads PRODUCT Export...');
  Logger.log('📅 Date Range: ' + DATE_RANGE.start + ' to ' + DATE_RANGE.end);

  try {
    // Get the spreadsheet
    const spreadsheet = SpreadsheetApp.openByUrl(SPREADSHEET_URL);
    let sheet = spreadsheet.getSheetByName(SHEET_NAME);

    // Create sheet if it doesn't exist
    if (!sheet) {
      sheet = spreadsheet.insertSheet(SHEET_NAME);
      Logger.log('✅ Created new sheet: ' + SHEET_NAME);
    }

    // Clear existing data
    sheet.clear();

    // Add headers (matching your manual export)
    const headers = [
      'Export Date',
      'Date Range',
      'Product Title',
      'Item ID',
      'Merchant ID',
      'Campaign Name',
      'Status',
      'Cost',
      'Clicks',
      'Impressions',
      'CTR',
      'Avg CPC',
      'Conversions',
      'Conversion Value',
      'Conv. Value/Cost',
      'Brand',
      'Custom Label 0',
      'Custom Label 1',
      'Custom Label 2',
      'Custom Label 3',
      'Custom Label 4'
    ];

    sheet.appendRow(headers);

    // Format header row
    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#4285f4');
    headerRange.setFontColor('#ffffff');

    // Query for Shopping product performance
    const query = `
      SELECT
        segments.product_title,
        segments.product_item_id,
        segments.product_merchant_id,
        campaign.name,
        campaign.status,
        metrics.cost_micros,
        metrics.clicks,
        metrics.impressions,
        metrics.ctr,
        metrics.average_cpc,
        metrics.conversions,
        metrics.conversions_value,
        segments.product_brand,
        segments.product_custom_attribute0,
        segments.product_custom_attribute1,
        segments.product_custom_attribute2,
        segments.product_custom_attribute3,
        segments.product_custom_attribute4
      FROM shopping_performance_view
      WHERE segments.date BETWEEN '${DATE_RANGE.start}' AND '${DATE_RANGE.end}'
        AND metrics.cost_micros > 0
      ORDER BY metrics.cost_micros DESC
    `;

    Logger.log('🔍 Running product query...');
    const report = AdsApp.report(query);
    const rows = report.rows();

    let rowCount = 0;
    const exportDate = Utilities.formatDate(new Date(), 'America/New_York', 'yyyy-MM-dd HH:mm');
    const dateRangeStr = DATE_RANGE.start + ' to ' + DATE_RANGE.end;

    // Process each product
    while (rows.hasNext()) {
      const row = rows.next();

      const cost = row['metrics.cost_micros'] / 1000000;
      const conversions = parseFloat(row['metrics.conversions']) || 0;
      const conversionValue = parseFloat(row['metrics.conversions_value']) || 0;
      const convValuePerCost = cost > 0 ? conversionValue / cost : 0;

      const dataRow = [
        exportDate,
        dateRangeStr,
        row['segments.product_title'] || '',
        row['segments.product_item_id'] || '',
        row['segments.product_merchant_id'] || '',
        row['campaign.name'] || '',
        row['campaign.status'] || '',
        parseFloat(cost.toFixed(2)),
        parseInt(row['metrics.clicks']),
        parseInt(row['metrics.impressions']),
        parseFloat((parseFloat(row['metrics.ctr']) * 100).toFixed(2)),
        parseFloat((row['metrics.average_cpc'] / 1000000).toFixed(2)),
        parseFloat(conversions.toFixed(2)),
        parseFloat(conversionValue.toFixed(2)),
        parseFloat(convValuePerCost.toFixed(2)),
        row['segments.product_brand'] || '',
        row['segments.product_custom_attribute0'] || '',
        row['segments.product_custom_attribute1'] || '',
        row['segments.product_custom_attribute2'] || '',
        row['segments.product_custom_attribute3'] || '',
        row['segments.product_custom_attribute4'] || ''
      ];

      sheet.appendRow(dataRow);
      rowCount++;
    }

    // Add summary row
    if (rowCount > 0) {
      const summaryRow = sheet.getLastRow() + 2;
      sheet.getRange(summaryRow, 1).setValue('TOTALS:').setFontWeight('bold');

      // Add formulas for totals
      const dataStartRow = 2;
      const dataEndRow = sheet.getLastRow();

      sheet.getRange(summaryRow, 8).setFormula(`=SUM(H${dataStartRow}:H${dataEndRow})`); // Cost
      sheet.getRange(summaryRow, 9).setFormula(`=SUM(I${dataStartRow}:I${dataEndRow})`); // Clicks
      sheet.getRange(summaryRow, 10).setFormula(`=SUM(J${dataStartRow}:J${dataEndRow})`); // Impressions
      sheet.getRange(summaryRow, 13).setFormula(`=SUM(M${dataStartRow}:M${dataEndRow})`); // Conversions
      sheet.getRange(summaryRow, 14).setFormula(`=SUM(N${dataStartRow}:N${dataEndRow})`); // Conv Value

      // Overall Conv Value/Cost
      sheet.getRange(summaryRow, 15).setFormula(
        `=IF(H${summaryRow}>0, N${summaryRow}/H${summaryRow}, 0)`
      );

      // Format summary row
      sheet.getRange(summaryRow, 1, 1, headers.length).setBackground('#f3f3f3').setFontWeight('bold');
    }

    // Format currency columns
    sheet.getRange(2, 8, sheet.getLastRow() - 1, 1).setNumberFormat('$#,##0.00'); // Cost
    sheet.getRange(2, 12, sheet.getLastRow() - 1, 1).setNumberFormat('$#,##0.00'); // Avg CPC
    sheet.getRange(2, 14, sheet.getLastRow() - 1, 1).setNumberFormat('$#,##0.00'); // Conv Value

    // Format percentage column
    sheet.getRange(2, 11, sheet.getLastRow() - 1, 1).setNumberFormat('0.00%'); // CTR

    // Auto-resize columns
    sheet.autoResizeColumns(1, headers.length);

    // Freeze header row
    sheet.setFrozenRows(1);

    Logger.log('✅ Export complete! ' + rowCount + ' products exported');
    Logger.log('📊 View your data: ' + SPREADSHEET_URL);

  } catch (error) {
    Logger.log('❌ Error: ' + error.message);
    Logger.log('Stack trace: ' + error.stack);
    throw error;
  }
}
