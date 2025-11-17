# Bug Reports & Issues

## Active Bugs

(List active bugs here with status, impact, and notes)

## Known Issues

(Known issues that don't necessarily need immediate fixing)

## Fixed Bugs

(Archive of resolved issues)

### 2025-11-17
- **Issue**: Sales dashboard pulled pre-Nov 2022 rows (e.g., Oct 2022) causing incorrect Last Month metrics and charts
- **Status**: Resolved by enforcing a global Nov 1, 2022 lower bound in all `all_time_sales` Supabase queries and client aggregations
- **Resolution**: Added `SALES_DATA_START_*` constants in `data-service.ts` and filtered client calculations to ignore older records

### 2025-11-12
- **Issue**: GitHub Pages deployment lost styling because `_next` assets were blocked by Jekyll processing
- **Status**: Resolved by adding a post-export script that generates `.nojekyll` during `npm run export`
- **Resolution**: Run `npm run export` before deploying with `git subtree push --prefix out origin gh-pages`

### 2025-10-27
- **Issue**: Claude Code approval dialogs don't have "Always Allow" option
- **Status**: Workaround identified - use specialized tools instead of bash commands
- **Resolution**: Documentation updated in CLAUDE.md

---
**Last Updated:** 2025-11-17
