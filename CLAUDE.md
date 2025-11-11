# CLAUDE.md - Source 4 Industries Project

## Project Overview

Source 4 Industries project directory containing multiple sub-projects and analysis work.

## Project Structure

```
Source 4 Industries/
├── Ads Report/                    # Ad spending analysis and reporting
│   └── Monthly Product Ad Spends/
├── ad-spend-processor-extracted/  # Ad spend data processing
├── s4-ad-spend-processor.skill    # Skill definition for ad processing
├── Source 4 Dashboard/            # Dashboard application
├── Bulk Bollards/                 # Bulk product management
└── FIRST ONE (IDK)/               # Legacy/exploratory project
```

## Key Directories & Purpose

### Ads Report
- Monthly product ad spend analysis and documentation
- Contains analysis files like `OCTOBER_2025_ANALYSIS.md`
- Purpose: Track and analyze advertising spend across products

### ad-spend-processor
- Data processing logic for ad spending data
- Handles file transformations and data normalization

### Source 4 Dashboard
- Main dashboard application
- Displays key metrics and analytics

## Common Tasks

### Working with Ad Spend Data
1. Navigate to appropriate monthly report directory
2. Review and update analysis markdown files
3. Process raw data through ad-spend-processor

## Tools & Dependencies

- Python 3: For data processing scripts
- Node.js/npm: For dashboard and web applications
- Git: Version control

## Important Notes

- This is a Windows development environment
- Multiple sub-projects with different purposes
- Documentation should be kept up-to-date in progress.md, decisions.md, and bugs.md

## Git Sync Workflow

**At the START of every session:**
```bash
git sync-start
```
This pulls the latest changes from your other machines.

**At the END of every session:**
```bash
git sync-end
```
This automatically stages, commits, and pushes all changes with a timestamp.

**Manual commands (if aliases not available):**
- Start: `git pull`
- End: `git add . && git commit -m "describe changes" && git push`

## Repository

This project is hosted on GitHub:
- **Repository:** https://github.com/fullstackaiautomation/s4
- **Branch:** main

**Note on .gitignore:**
Sensitive files (`.env`, `credentials.json`, API keys) are excluded from git tracking via `.gitignore`. Each machine maintains its own copy of these files locally.