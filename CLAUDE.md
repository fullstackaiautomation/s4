# CLAUDE.md - Source 4 Industries Project

## Project Overview

Source 4 Industries enterprise operations platform with automated data processing, sales dashboards, and business intelligence tools.

## Project Structure (Updated Nov 2025)

```
Source 4 Industries/
├── README.md              # Main project documentation
├── CLAUDE.md             # This file - AI context and instructions
├── .env, .env.example    # Environment configuration
├── .gitignore            # Git ignore rules
├── bugs.md               # Bug tracking
├── decisions.md          # Architectural decisions
├── progress.md           # Progress tracking
│
├── Skills & Automations/  # Automation skills & processors
│   ├── ad-spend-processor/       # Google/Bing ads data processing
│   └── all-time-sales-processor/ # Sales data ETL pipeline
│
├── Source 4 Dashboard/   # Web dashboard application
│   └── web/              # Next.js 15 app with Supabase
│
├── Reporting/            # Reports and analysis
│   ├── Monthly Product Ad Spends/
│   ├── All Time Sales/
│   ├── Dashboard/
│   └── SKU Documents/
│
└── Document Storage/     # All documentation & resources
    ├── Data/            # CSV files, data exports
    ├── Documentation/   # Guides, workflows, archives
    │   ├── Archive/    # Historical docs
    │   ├── Deployment/ # Deploy guides
    │   ├── Supabase/   # Database docs
    │   └── Workflows/  # Process docs
    ├── Scripts/        # Import/setup scripts
    └── SQL/            # Database queries, schemas
```

## Key Components

### Skills & Automations
- **ad-spend-processor**: Processes monthly Google Ads & Bing Ads data
- **all-time-sales-processor**: Transforms CBOS sales data for dashboards
- Located in `Skills & Automations/` folder with their own documentation

### Source 4 Dashboard
- Next.js 15 web application
- Supabase real-time database integration
- Live dashboards: Sales, Reps, Product Ad Spend, Home Runs
- Located in `Source 4 Dashboard/web/`

### Reporting
- Monthly ad spend reports and analysis
- Sales data processing and exports
- Located in `Reporting/` with organized subfolders

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