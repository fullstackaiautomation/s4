# Google Ads API Integration - Design Documentation
**Source 4 Industries**

---

## 1. PURPOSE

This integration accesses Google Ads API to automate monthly performance reporting and campaign analysis for Source 4 Industries' advertising accounts.

---

## 2. BUSINESS USE CASE

- **Monthly reporting**: Extract campaign performance metrics (impressions, clicks, costs, conversions)
- **ROI analysis**: Calculate return on investment across campaigns
- **Budget optimization**: Identify high-performing campaigns for budget allocation
- **Compliance**: Maintain records of advertising spend and performance

---

## 3. DATA ACCESSED

**Read-only access to:**
- Campaign names, IDs, and status
- Performance metrics (impressions, clicks, CTR, CPC, cost)
- Conversion data (conversions, conversion value)
- Date-segmented performance data

**NO access to:**
- User personal information
- Payment information
- Campaign modification capabilities

---

## 4. TECHNICAL IMPLEMENTATION

- **Language**: Node.js with `google-ads-api` library
- **Authentication**: OAuth 2.0 with refresh tokens
- **Frequency**: Monthly manual execution
- **Data Storage**: Local JSON exports for internal analysis
- **API Version**: Google Ads API v16+

**Sample Query:**
```
SELECT campaign.id, campaign.name, metrics.impressions,
       metrics.clicks, metrics.cost_micros, metrics.conversions
FROM campaign
WHERE segments.date BETWEEN 'START_DATE' AND 'END_DATE'
```

---

## 5. SECURITY & PRIVACY

- Credentials stored locally, not shared
- OAuth refresh tokens used (no password storage)
- **Read-only API access only**
- Data used internally only, not shared with third parties
- Complies with Google Ads API Terms of Service
- No automated campaign modifications

---

## 6. USER WORKFLOW

1. User runs monthly script: `node google-ads-fetcher.js [start-date] [end-date]`
2. Script authenticates via OAuth 2.0
3. Script queries campaign performance for specified date range
4. Script outputs formatted report and JSON export
5. User reviews data for business decisions and reporting
6. Data archived for historical analysis

---

## 7. ACCOUNT INFORMATION

- **Customer ID**: 689-496-3253
- **Business**: Source 4 Industries
- **Industry**: Industrial Equipment & Supplies
- **Use Case**: Internal performance reporting and analysis only
- **Access Level Needed**: Basic (read-only campaign data)
- **Estimated API Calls**: ~30-50 queries per month

---

## 8. COMPLIANCE

This integration:
- ✅ Does **NOT** modify campaigns, ads, or keywords
- ✅ Does **NOT** access user personal data
- ✅ Only accesses aggregated campaign metrics
- ✅ Follows Google Ads API best practices
- ✅ Implements proper error handling and rate limiting
- ✅ Respects API quotas and limitations
- ✅ Used for legitimate business analytics only

---

## 9. DATA RETENTION

- Raw API responses: Not stored permanently
- Processed reports: Stored locally for 12 months
- No data shared with external parties
- Complies with business record-keeping requirements

---

## 10. SUPPORT & MAINTENANCE

- **Developer Contact**: taylorg@source4industries.com
- **Company Website**: source4industries.com
- **Maintenance Schedule**: Updated quarterly or as needed
- **Support**: Internal IT team

---

**Document Version**: 1.0
**Date**: October 18, 2025
**Prepared by**: Taylor G., Source 4 Industries
