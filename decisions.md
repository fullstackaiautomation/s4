# Architectural & Implementation Decisions

## Decision Log

### 2025-11-17: Sales Data Lower Bound Enforcement
- **Decision**: Enforce a canonical minimum date (Nov 1, 2022) for all `all_time_sales` queries and client aggregations
- **Rationale**: Prevents historical gaps and incorrect comparisons caused by pre-migration records (e.g., Oct 2022 rows) appearing in dashboards
- **Impact**: All future data access must reference `SALES_DATA_START_*` constants in `src/lib/data-service.ts`; dashboards and analytics ignore rows before Nov 2022

### 2025-11-12: GitHub Pages Static Export Workflow
- **Decision**: Replace manual `.nojekyll` management with an automated post-export script run by `npm run export`
- **Rationale**: Ensures `_next` assets load on GitHub Pages deployments and removes manual steps before pushing to `gh-pages`
- **Impact**: Developers run `npm run export` before deploying; `.nojekyll` is generated automatically alongside the latest static build

### 2025-10-27: Documentation Structure
- **Decision**: Implement CLAUDE.md, progress.md, decisions.md, and bugs.md
- **Rationale**: Centralize project documentation, track progress, log decisions, and maintain bug reports for better project management and context for Claude Code
- **Impact**: Improved project organization and future Claude Code context management

## Active Decisions

(Add active decision tracking items here)

## Deferred Decisions

(Add decisions that have been deferred for later consideration)

---
**Last Updated:** 2025-11-17
