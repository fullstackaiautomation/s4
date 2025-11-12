# Source 4 Industries - Skills & Automations

This directory contains all skills and automation tools for Source 4 Industries operations.

## Directory Structure

Each skill/automation should have its own folder containing:
- Scripts and source code
- Documentation (SKILL.md or README.md)
- Reference materials
- Configuration files

## Available Skills

### 1. Ad Spend Processor (`ad-spend-processor/`)
**Purpose:** Monthly advertising data processing for Google Ads and Bing Ads
**Key Features:**
- Processes CSV exports from Google Ads and Bing Ads
- Combines data from multiple platforms
- Auto-suggests product categories with confidence scores
- Detects missing SKUs not in master list
- Generates vendor/category spend analysis
- Creates monthly upload sheets

**Usage:** Run when processing monthly ad spend data, assigning product categories, reconciling SKUs, or generating spend reports.

## Adding New Skills

When adding a new skill or automation:

1. Create a new folder with a descriptive name
2. Include a README.md or SKILL.md with:
   - Purpose and description
   - Installation/setup instructions
   - Usage examples
   - Dependencies
3. Keep all related scripts and files within the skill's folder
4. Document any external dependencies or API requirements

## Skill Files

- `s4-ad-spend-processor.skill` - Packaged version of ad-spend-processor
- Individual skill folders contain the extracted/working versions