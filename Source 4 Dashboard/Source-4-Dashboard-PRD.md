---
title: Source 4 Dashboard – Product Requirements Document
version: 1.0 (Final)
date: 2025-10-22
author: Droid (Factory AI)
stakeholders:
  - Adam – Chief Sales Officer
  - Allyn – Owner
  - Michael – Sales Representative
  - Rick – Sales Representative
  - Taylor Grassmick – Product Manager
status: Ready for approval
---

# 1. Executive Summary
The Source 4 Dashboard will be a unified web application that centralizes marketing, sales, automation, and operational data for Source 4 Industries. The initial release focuses on consolidating disparate Google Sheets, marketing platform insights, and automation tracking into a single Supabase-backed experience with clean, modern visuals. Phase one prioritizes a foundational dashboard, data ingestion workflows, and visibility tooling for key stakeholders while laying groundwork for future role-based accounts and additional modules.

# 2. Goals & Success Metrics
- **Primary Goals**
  - Consolidate critical Source 4 performance data (marketing, sales, automations) into one Supabase-backed application.
  - Deliver actionable dashboards for executives and sales reps with minimal manual spreadsheet work.
  - Establish scalable data ingestion flows (manual uploads first, automated agents later).
  - Provide tailored insights and recommendations to improve campaign, SEO, and automation performance.
- **Success Metrics (Phase 1)**
  - 100% of existing Google Sheet data used in stakeholder reviews migrated or mirrored into Supabase tables.
  - Reduce manual spreadsheet preparation time for monthly business reviews by ≥50%.
  - Deliver dedicated dashboard views for at least four focus areas (Marketing > Google & Bing Ads, Sales > Quotes, Dashboard > Sales Dashboard, Automations > Live Automations).
  - Achieve stakeholder satisfaction score ≥8/10 during pilot review with Adam, Allyn, Michael, and Rick.

# 3. Background & Problem Statement
Source 4 manages marketing, sales, and automation performance across multiple Google Sheets, Looker Studio dashboards, and third-party tools. This fragmentation drives duplicate effort, inconsistent reporting cadences, and limited shared visibility. The Source 4 Dashboard will centralize data, standardize analytics, and support decision-making while creating a foundation for future automations and role-based experiences.

# 4. Target Users & Stakeholders
- **Primary Users (Phase 1)**: Adam (CSO), Allyn (Owner), Michael & Rick (Sales Reps), Taylor (internal operator).
- **Extended Users (Future)**: Broader sales team, marketing managers, automation engineers, finance (for P&L).
- **User Needs**
  - Executives: holistic view of marketing & sales performance, automation ROI, strategic insights.
  - Sales reps: individual performance dashboards, quotes pipeline, abandoned cart follow-up tracking.
  - Operators: streamlined data uploads, automated report generation, error monitoring for automations.

# 5. Scope Overview
- **In Scope (Phase 1)**
  - Marketing dashboards for Google/Bing Ads, SEO, Email, SMS, Blog performance with Supabase-backed data and integrations roadmap.
  - Sales dashboards (Quotes, Abandoned Carts, Sales Dashboard, Reps Dashboard, Home Runs Dashboard) using consolidated data sources.
  - Upload workflows for CBOS (monthly), Google/Bing Ads CSVs, and review generation inputs.
  - Automation dashboards (Live Automations status, automation impact metrics, automation project tracking).
  - Core Supabase schema design and initial data migration from provided Google Sheets.
  - Initial authentication for single account (`tgrassmick@gmail.com` with secure storage of credential hash).
- **Out of Scope (Phase 1)**
  - Shopify Dashboard, Vendor Report Card, P&L modules (documented for future phases).
  - Role-based access control beyond the initial admin account.
  - Automated blog and campaign generation beyond presenting recommendations.

# 6. Functional Requirements

## 6.1 Information Architecture
- Top-level navigation: Marketing, Sales, Dashboard, Uploads, Admin, Automations.
- Each top-level area contains sub-pages as detailed below.
- Provide global filters (time range, vendor, rep) where applicable; remember prior selections per session.

## 6.2 Marketing
### 6.2.1 Google & Bing Ads
- Integrate with Google Ads and Microsoft Ads APIs (initial read-only connection; iterative authentication plan).
- Surface campaign performance by channel, campaign type (PMAX, Shopping, etc.), product lines.
- Visualize monthly spend and KPIs (impressions, clicks, conversions, ROAS); plan daily granularity in backlog.
- Provide links to source spreadsheets for validation.
- Supabase tables ingest data from:
  - `1jj3I4pXMbtZr4DmycxE8B6s-vLAk0C-g_N6LDptWNPs` (performance tracking).
  - `1APPOOVFq8WYKaFjw0dHVkHRKYWhyui-vlTkJHqn5wTA` (monthly spend/results).
- Include future enhancement note: automate daily data sync via Supabase Edge Functions.

### 6.2.2 SEO
- Display top organic search terms, geographic performance, trend charts.
- Integrate with Google Search Console, Google Merchant Center, Microsoft Bing Webmaster Tools.
- Highlight “opportunity keywords” (low ranking, high volume) and recommended optimizations.
- Provide content recommendations prioritized by impact vs. effort.

### 6.2.3 Email Marketing
- Connect to Klaviyo to fetch campaign and flow performance.
- Show key KPIs (open rate, click rate, revenue attribution) with trend comparisons.
- Offer automated suggestions for new campaign blasts, A/B test ideas, and flow adjustments.
- Track campaign backlog and experiments within Supabase for auditability.

### 6.2.4 SMS Marketing
- Mirror Email Marketing module for SMS journeys.
- Include compliance reminders (opt-in status) and performance metrics.
- Provide AI-generated campaign ideas with quick export/download.

### 6.2.5 Blog
- Index existing blog posts with metadata (topic, publish date, URL).
- Display organic performance metrics (traffic, backlinks, keyword ranking) per post.
- Provide search/filtering across posts within the app; link to live site.
- Offer recommendations for new topics and drafts; include AI-generated outline workflow (future automation).

## 6.3 Sales
### 6.3.1 Quotes
- Present quotes performance by rep, vendor, status using data from spreadsheet `1alz5k-t2ty5GTJuyo3HQoJzmeO0K2-j_eGyVGLUmV8Y` (Quotes tab).
- Enable filtering by date range, vendor, assignee.
- Surface conversion rates and pipeline value.

### 6.3.2 Abandoned Carts
- Visualize abandoned carts by vendor, rep, and products using `1iljVeooOeZpKZ-eSoiRLmCTHdGs3L1AtLpl5iBXAUq4` (ALL ACS tab).
- Track follow-up status and outcomes (manual input initially, automation backlog).
- Provide alerting for high-value opportunities.

## 6.4 Dashboard Hub
### 6.4.1 Sales Dashboard
- Central performance view with filters for year, month, vendor, sales rep.
- Visuals: revenue trend, top vendors, top reps, product performance.
- Seed data from `1jtzgAytJ2CAl0mlO-gfaHOMGjUZENVbhHo1Z7pSgyVg` (ALL TIME tab).
- Consider embedding or re-creating Looker Studio visuals; capture requirements for data refresh cadence.

### 6.4.2 Reps Dashboard (Michael / Rick)
- Dedicated dashboards with individual KPIs, targets, and coaching insights.
- Ability to switch between reps or share direct links.

### 6.4.3 Home Runs Dashboard
- Track orders grouped by invoice magnitude.
- Data source: `1iljVeooOeZpKZ-eSoiRLmCTHdGs3L1AtLpl5iBXAUq4` (Home Runs V1 & HR Vendors tabs).
- Provide segmentation by vendor, product category, and time period.

### 6.4.4 Future Modules (Documented, not in Phase 1)
- Shopify Dashboard
- Vendor Report Card
- P&L Dashboard

## 6.5 Uploads
### 6.5.1 Monthly Dashboard (CBOS to Dashboard)
- Provide guided upload wizard for CBOS CSVs plus Google/Bing Ads files.
- Validate file structure, map columns, and load into Supabase tables.
- Queue automated agents (future) to transform data post-upload.
- Document process breakdowns for later automation work.

### 6.5.2 Reviews Generator
- Allow upload of product lists (CSV) to auto-generate customer reviews using defined template.
- Store generated reviews with approval workflow before export.
- Provide download/export in required format.

## 6.6 Admin
### 6.6.1 SKU Master
- Display full SKU catalog from `1PSFl0o27VXax1_BqlctqkraKn_mbhIACqi4f08-ZyzU` (MASTER SKU tab).
- Enable search, filtering, and inline detail view.
- Highlight key attributes (vendor, category, pricing, availability).
- Future enhancements: editing, bulk updates, integration with PIM.

### 6.6.2 Branding / Logins (Future)
- Placeholder pages for future configuration of branding assets and role-based access controls.

## 6.7 Automations
### 6.7.1 Automation Dashboard
- List active automations with status (running, paused, error) referencing Notion database `S4 Automations`.
- Integrate n8n error tracker feed (`1DSylOEjWAjsPqubB0L9ix5obAAQ-pNGkhouItRYk2Xo`, ERRORS tab) for alerting UI.
- Track automation impact metrics with new Supabase table capturing Time Saved, Dollars Added, Dollars Saved.
- Provide quick links to runbooks and escalation steps.

### 6.7.2 Automation Projects Board
- Mirror Notion project board fields to track pipeline, status, owner, ROI estimates.
- Support color scheme parity with existing system.
- Enable tagging, filtering, and prioritization views.

# 7. Data & Integration Requirements
- **Supabase** will serve as the primary data platform. Define schemas for marketing metrics, sales performance, automations, SKUs, and user management.
- Initial data migration from specified Google Sheets via manual import scripts; store data lineage and last refresh timestamps.
- Plan API integrations (Google Ads, Microsoft Ads, Search Console, Klaviyo, n8n) with secure credential storage (Supabase secrets or encrypted vault).
- Ensure data normalization to support cross-dashboard filtering (e.g., consistent vendor and SKU identifiers).
- Document data refresh cadence (daily for marketing, weekly for sales, real-time for automations where possible).

# 8. UX & UI Guidelines
- Adopt clean, modern visual language with high readability (dark-on-light primary theme, accent colors aligned to Source 4 brand).
- Use responsive layouts optimized for desktop first; mobile support in backlog.
- Provide consistent card-based modules with summary metrics and deeper drilldowns.
- Incorporate alert banners for automation errors and data freshness warnings.
- Ensure accessibility standards (WCAG AA) for color contrast and keyboard navigation.

# 9. Security & Access Control
- Phase 1 authentication: single admin account for `tgrassmick@gmail.com`; password stored hashed (e.g., bcrypt) even if provided as `Grassmick1` for initial setup.
- Log all sign-in attempts and maintain audit trail for critical data changes.
- Plan role-based access control (RBAC) for future multi-user expansion (Admin, Executive, Sales Rep, Marketing Analyst).
- Enforce least privilege for third-party API credentials.

# 10. Non-Functional Requirements
- **Performance**: Dashboards should load within 3 seconds for core views on broadband connections.
- **Reliability**: 99% uptime target with graceful degradation if third-party APIs fail.
- **Scalability**: Architecture should support additional data sources and dashboards without major refactor.
- **Maintainability**: Modular codebase with clear separation for data ingestion, storage, and presentation layers.
- **Compliance**: Adhere to platform terms for marketing integrations; manage PII in line with privacy policies.

# 11. Analytics & Insights
- Track in-app usage analytics (page views, filter usage, export actions) for continuous improvement.
- Provide embedded insights or commentary (e.g., “Spend increased 12% MoM, driven by PMAX campaigns”).
- Surface recommendations in each module with rationale and suggested next steps.

# 12. Implementation Roadmap (Proposed)
1. **Foundation (Weeks 1-3)**
   - Supabase project setup, schema definition, authentication scaffold.
   - Initial data imports for key sheets (Google/Bing Ads monthly, Quotes, Sales Dashboard, Automations).
   - Layout scaffolding and navigation shell.
2. **Core Dashboards (Weeks 4-8)**
   - Marketing > Google & Bing Ads, Sales > Quotes, Dashboard > Sales Dashboard.
   - Automations > Live Automations with error alerts.
   - Uploads > Monthly Dashboard ingestion workflow.
3. **Extended Modules (Weeks 9-12)**
   - SEO, Email, SMS, Blog modules.
   - Abandoned Carts, Reps Dashboard, Home Runs Dashboard.
   - Reviews generator and SKU Master.
4. **Enhancements & Automation (Weeks 13+)**
   - API integrations for automated data refresh.
   - Additional dashboards (Shopify, Vendor Report Card, P&L).
   - Role-based access control and user onboarding.

# 13. Risks & Mitigations
- **Data Quality from Spreadsheets**: Inconsistent formatting may block migration. → Implement validation scripts and document data contracts.
- **API Access & Rate Limits**: OAuth setup and quotas could delay integration. → Start early with sandbox keys and batching strategies.
- **Change Management**: Stakeholders accustomed to spreadsheets might resist new workflows. → Provide training sessions and phased rollout.
- **Single Account Security**: Hard-coded credentials pose risk. → Hash password, enforce MFA in future release, rotate credentials post-launch.
- **Automation Alert Fatigue**: Excessive notifications reduce effectiveness. → Implement severity thresholds and digest summaries.

# 14. Open Questions
1. What visual branding assets (logos, color palette) should guide the initial UI design?
2. Are there defined KPIs or targets for marketing and sales that should be embedded (e.g., monthly revenue goals)?
3. Do stakeholders require offline export (PDF/CSV) capabilities for each dashboard in phase 1?
4. Should automation recommendations trigger task assignments or remain informational initially?
5. What authentication provider (Supabase Auth, custom SSO) is preferred for future multi-user rollout?

# 15. Approval & Next Steps
- Review this draft with Adam, Allyn, Michael, Rick, and Taylor for alignment.
- Confirm phase-one priorities and sequencing based on stakeholder feedback.
- Finalize Supabase schema design and begin data migration planning.
- Green-light UI wireframing once branding inputs are provided.

# 16. Acceptance Criteria (Phase 1)
- **Global Shell & Navigation**: App shell loads under 3 seconds, sidebar links functional for all in-scope sections, and global filters persist per session.
- **Marketing Dashboards**: Google/Bing Ads, SEO, Email, SMS, and Blog pages render charts/tables backed by Supabase data with fallback sample content disabled in production.
- **Sales Dashboards**: Quotes, Abandoned Carts, Sales Dashboard, Reps Dashboard, and Home Runs expose current-period metrics, support filtering, and export tabular data to CSV.
- **Uploads Workflows**: Monthly Dashboard and Reviews flows accept validated CSV uploads, display validation errors inline, and confirm successful ingestion.
- **Automations Module**: Automation Dashboard and Projects Board list data with status indicators, severity badges, and link-outs to runbooks.
- **Admin Module**: SKU Master renders searchable catalog with vendor filters; Branding/Logins surfaces "Coming Soon" placeholders with roadmap notes.
- **Authentication**: Single admin user created with hashed password, enforced 12-character minimum, and audit logging for sign-in/out.
- **Analytics & Telemetry**: Page views, filter events, and upload completions captured via preferred analytics provider with daily aggregation in Supabase.
- **Documentation & Handoff**: Data dictionary, environment setup guide, and runbook for uploads attached in project workspace.

# 17. Supabase Schema Overview (Initial)
- **marketing_ads_performance**: `id (uuid)`, `channel`, `campaign_type`, `spend`, `impressions`, `clicks`, `conversions`, `revenue`, `roas`, `cpa`, `reported_at`.
- **marketing_ads_timeseries**: `id`, `date`, `value (revenue)`, `secondary (ad_spend)`, `source`.
- **marketing_opportunity_keywords**: `keyword`, `search_volume`, `current_rank`, `target_rank`, `difficulty`, `suggested_action`.
- **marketing_lifecycle_performance**: `id`, `name`, `channel`, `type`, `send_count`, `open_rate`, `click_rate`, `revenue`, `conversion_rate`, `status`, `updated_at`.
- **marketing_blog_insights**: `slug`, `title`, `published_at`, `url`, `sessions`, `backlinks`, `top_keyword`, `suggested_topic`.
- **sales_quotes**: `id`, `created_at`, `vendor`, `rep`, `status`, `value`, `close_date`, `notes`.
- **sales_abandoned_carts**: `id`, `vendor`, `rep`, `status`, `value`, `last_contacted_at`, `priority`.
- **sales_snapshots**: `id`, `period`, `revenue`, `orders`, `avg_order_value`, `top_vendors (jsonb)`.
- **sales_home_runs**: `id`, `invoice`, `vendor`, `rep`, `value`, `closed_at`, `products (jsonb)`.
- **sku_master**: `sku`, `vendor`, `category`, `description`, `price`, `availability`, `updated_at`.
- **operational_alerts**: `id`, `level`, `message`, `created_at`, `acknowledged_at`, `source`.
- **automations_live**: `id`, `name`, `status`, `owner`, `time_saved_hours`, `dollars_added`, `dollars_saved`, `last_run_at`, `runbook_url`.
- **automations_projects**: `id`, `title`, `status`, `priority`, `roi_estimate`, `owner`, `next_step`, `due_date`.
- **marketing_review_blueprints**: `id`, `product_sku`, `prompt`, `voice`, `created_at`, `approved_by`.
- **audit_log**: `id`, `user_id`, `event`, `metadata (jsonb)`, `created_at`, `ip_address`.

# 18. Launch Checklist
- [ ] Supabase environments configured (development, staging, production) with environment variables deployed.
- [ ] Sample data disabled for production builds; feature flag retained for staging demos.
- [ ] CI/CD pipeline running lint, type check, unit tests, and integration tests on pull requests.
- [ ] Accessibility review completed (keyboard navigation, contrast, screen reader sweeps).
- [ ] Security review executed (password hashing, secret storage, Supabase policies).
- [ ] Stakeholder walkthrough recorded with sign-off notes stored in shared drive.
- [ ] Runbooks prepared for data uploads, automation alert response, and credential rotation.
- [ ] Post-launch monitoring dashboards configured (Supabase logs, Vercel metrics, analytics events).

# 19. Ownership & RACI
- **Product Management (Taylor)**: Accountable (A) for requirements scope, Responsible (R) for stakeholder alignment, Consulted (C) on release timing.
- **Engineering Lead (Droid / Factory AI)**: Responsible (R) for architecture, dashboard implementation, and Supabase integration; Accountable (A) for technical delivery.
- **Data Operations (Adam)**: Consulted (C) on metrics definitions, Responsible (R) for spreadsheet exports during migration.
- **Sales Reps (Michael, Rick)**: Consulted (C) on dashboard usability, Informed (I) on release updates.
- **Marketing Ops (Allyn)**: Consulted (C) on campaign requirements, Responsible (R) for Klaviyo/API credential provisioning.
- **Automation Owner (Taylor)**: Responsible (R) for automation error triage and runbook maintenance, Informed (I) on roadmap changes.
- **Executive Sponsor (Allyn)**: Accountable (A) for final go/no-go decision and resource approvals.
