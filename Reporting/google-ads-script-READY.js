/**
 * GOOGLE ADS SCRIPT - Monthly Campaign Performance Export
 * This script runs INSIDE Google Ads (no API token needed!)
 * Exports campaign data to Google Sheets automatically
 *
 * READY TO USE - Just copy and paste into Google Ads Scripts
 */

// ====== CONFIGURATION ======
const SPREADSHEET_URL = 'https://docs.google.com/spreadsheets/d/1jj3I4pXMbtZr4DmycxE8B6s-vLAk0C-g_N6LDptWNPs/edit';
const SHEET_NAME = 'New Month Google';

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
  Logger.log('📊 Starting Google Ads Campaign Export...');
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

    // Add headers
    const headers = [
      'Export Date',
      'Date Range',
      'Campaign ID',
      'Campaign Name',
      'Campaign Status',
      'Impressions',
      'Clicks',
      'Cost',
      'CTR',
      'Avg CPC',
      'Conversions',
      'Conversion Value',
      'Cost Per Conversion',
      'ROI %'
    ];

    sheet.appendRow(headers);

    // Format header row
    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#4285f4');
    headerRange.setFontColor('#ffffff');

    // Query campaign performance
    const query = `
      SELECT
        campaign.id,
        campaign.name,
        campaign.status,
        metrics.impressions,
        metrics.clicks,
        metrics.cost_micros,
        metrics.ctr,
        metrics.average_cpc,
        metrics.conversions,
        metrics.conversions_value
      FROM campaign
      WHERE segments.date BETWEEN '${DATE_RANGE.start}' AND '${DATE_RANGE.end}'
      ORDER BY metrics.cost_micros DESC
    `;

    Logger.log('🔍 Running query...');
    const report = AdsApp.report(query);
    const rows = report.rows();

    let rowCount = 0;
    const exportDate = Utilities.formatDate(new Date(), 'America/New_York', 'yyyy-MM-dd HH:mm');
    const dateRangeStr = DATE_RANGE.start + ' to ' + DATE_RANGE.end;

    // Process each campaign
    while (rows.hasNext()) {
      const row = rows.next();

      const cost = row['metrics.cost_micros'] / 1000000;
      const conversions = parseFloat(row['metrics.conversions']) || 0;
      const conversionValue = parseFloat(row['metrics.conversions_value']) || 0;
      const costPerConversion = conversions > 0 ? cost / conversions : 0;
      const roi = cost > 0 ? ((conversionValue - cost) / cost * 100) : 0;

      const dataRow = [
        exportDate,
        dateRangeStr,
        row['campaign.id'],
        row['campaign.name'],
        row['campaign.status'],
        parseInt(row['metrics.impressions']),
        parseInt(row['metrics.clicks']),
        parseFloat(cost.toFixed(2)),
        parseFloat((parseFloat(row['metrics.ctr']) * 100).toFixed(2)),
        parseFloat((row['metrics.average_cpc'] / 1000000).toFixed(2)),
        parseFloat(conversions.toFixed(2)),
        parseFloat(conversionValue.toFixed(2)),
        parseFloat(costPerConversion.toFixed(2)),
        parseFloat(roi.toFixed(2))
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

      sheet.getRange(summaryRow, 6).setFormula(`=SUM(F${dataStartRow}:F${dataEndRow})`); // Impressions
      sheet.getRange(summaryRow, 7).setFormula(`=SUM(G${dataStartRow}:G${dataEndRow})`); // Clicks
      sheet.getRange(summaryRow, 8).setFormula(`=SUM(H${dataStartRow}:H${dataEndRow})`); // Cost
      sheet.getRange(summaryRow, 11).setFormula(`=SUM(K${dataStartRow}:K${dataEndRow})`); // Conversions
      sheet.getRange(summaryRow, 12).setFormula(`=SUM(L${dataStartRow}:L${dataEndRow})`); // Conv Value

      // Overall ROI formula
      sheet.getRange(summaryRow, 14).setFormula(
        `=IF(H${summaryRow}>0, (L${summaryRow}-H${summaryRow})/H${summaryRow}*100, 0)`
      );

      // Format summary row
      sheet.getRange(summaryRow, 1, 1, headers.length).setBackground('#f3f3f3').setFontWeight('bold');
    }

    // Format currency columns
    sheet.getRange(2, 8, sheet.getLastRow() - 1, 1).setNumberFormat('$#,##0.00'); // Cost
    sheet.getRange(2, 10, sheet.getLastRow() - 1, 1).setNumberFormat('$#,##0.00'); // Avg CPC
    sheet.getRange(2, 12, sheet.getLastRow() - 1, 1).setNumberFormat('$#,##0.00'); // Conv Value
    sheet.getRange(2, 13, sheet.getLastRow() - 1, 1).setNumberFormat('$#,##0.00'); // Cost/Conv

    // Format percentage columns
    sheet.getRange(2, 9, sheet.getLastRow() - 1, 1).setNumberFormat('0.00%'); // CTR
    sheet.getRange(2, 14, sheet.getLastRow() - 1, 1).setNumberFormat('0.00%'); // ROI

    // Auto-resize columns
    sheet.autoResizeColumns(1, headers.length);

    // Freeze header row
    sheet.setFrozenRows(1);

    Logger.log('✅ Export complete! ' + rowCount + ' campaigns exported');
    Logger.log('📊 View your data: ' + SPREADSHEET_URL);

  } catch (error) {
    Logger.log('❌ Error: ' + error.message);
    Logger.log('Stack trace: ' + error.stack);
    throw error;
  }
}
