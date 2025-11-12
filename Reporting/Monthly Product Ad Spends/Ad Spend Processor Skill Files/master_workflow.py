#!/usr/bin/env python3
"""
Master Workflow Script - Monthly Ad Spend Processing
This script runs all 4 processing scripts in sequence to generate complete monthly reports.

Usage:
    python master_workflow.py

Before running:
    1. Download Google and Bing CSV exports
    2. Update config.json with month and filenames
    3. Run this script
    4. Check outputs in current directory
"""

import subprocess
import sys
import os
import json
from datetime import datetime

print("\n" + "=" * 120)
print("MASTER WORKFLOW - MONTHLY AD SPEND PROCESSING")
print("=" * 120)

# Load configuration
try:
    with open('config.json', 'r') as f:
        config = json.load(f)
    month = config['month']
    google_file = config['input_files']['google']
    bing_file = config['input_files']['bing']
    input_dir = config['paths']['input_dir']
    output_dir = config['paths']['output_dir'].replace("{month}", month)

    print(f"\nConfiguration loaded for: {month}")
    print(f"  Google file: {google_file}")
    print(f"  Bing file: {bing_file}")
except FileNotFoundError:
    print("\nERROR: config.json not found!")
    print("Please create config.json with month and filenames before running.")
    sys.exit(1)
except json.JSONDecodeError as e:
    print(f"\nERROR: Invalid config.json format: {e}")
    sys.exit(1)

# Create output directory if it doesn't exist
if not os.path.exists(output_dir):
    try:
        os.makedirs(output_dir)
        print(f"\nCreated output folder: {output_dir}")
    except Exception as e:
        print(f"\nERROR: Could not create output directory: {e}")
        sys.exit(1)

# Verify input files exist
print(f"\nVerifying input files...")
google_path = os.path.join(input_dir, google_file)
bing_path = os.path.join(input_dir, bing_file)
if not os.path.exists(google_path):
    print(f"ERROR: Google file not found: {google_path}")
    sys.exit(1)
if not os.path.exists(bing_path):
    print(f"ERROR: Bing file not found: {bing_path}")
    sys.exit(1)
print(f"  All input files found")

# List of scripts to run in order
scripts = [
    ("process_upload.py", "Processing raw data and creating upload sheet..."),
    ("create_excel_report.py", "Creating Excel report with vendor breakdown..."),
    ("create_summary_report.py", "Adding summary analysis sheet..."),
    ("create_pdf_report.py", "Generating PDF report with visualizations..."),
]

# Run each script
failed_scripts = []
for script_name, description in scripts:
    print(f"\n{'=' * 120}")
    print(f"STEP: {description}")
    print(f"Running: {script_name}")
    print("=" * 120)

    try:
        result = subprocess.run([sys.executable, script_name], check=True)
        print(f"\n✓ {script_name} completed successfully")
    except subprocess.CalledProcessError as e:
        print(f"\n✗ ERROR in {script_name}: {e}")
        failed_scripts.append(script_name)
    except FileNotFoundError:
        print(f"\n✗ ERROR: {script_name} not found")
        failed_scripts.append(script_name)

# Summary
print(f"\n" + "=" * 120)
print("WORKFLOW COMPLETE")
print("=" * 120)

if failed_scripts:
    print(f"\nFAILED: {len(failed_scripts)} script(s) failed:")
    for script in failed_scripts:
        print(f"  - {script}")
    print(f"\nPlease check the errors above and rerun.")
    sys.exit(1)
else:
    print(f"\nSUCCESS: All processing scripts completed!")
    print(f"\nGenerated files for {month} in: {output_dir}")
    print(f"  CSV Files:")
    print(f"    - {month} Product Spend Upload.csv")
    print(f"    - {month} Missing Product Categories.csv")
    print(f"    - {month} Missing SKUs.csv")
    print(f"\n  Reports:")
    print(f"    - {month} Product Spend Report.xlsx (4 sheets)")
    print(f"    - {month} Ad Spend Performance Report.pdf (6 pages)")
    print(f"\nWorkflow finished at {datetime.now().strftime('%I:%M %p on %B %d, %Y')}")
    print("=" * 120)
    sys.exit(0)
