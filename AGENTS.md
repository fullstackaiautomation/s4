# Build & Test

## Source 4 Dashboard (Next.js 15)
- Prereq: Node.js 18+ and npm.
- `cd "Source 4 Industries/Source 4 Dashboard/web"`
- Install deps once: `npm install`
- Local dev: `npm run dev` (http://localhost:3000)
- Lint/typecheck: `npm run lint`
- Production build: `npm run build`
- Preview build: `npm run start`
- Static export for GitHub Pages: `npm run export` (writes to `out/` and runs `postexport` to add `.nojekyll`).

## Python Data Pipelines
- Use Python 3.10+ (v3.13 installed here).
- Create venv: `python -m venv .venv && .\.venv\Scripts\activate`
- Install shared deps:
  `pip install pandas numpy openpyxl python-dotenv supabase seaborn matplotlib reportlab`
  (install `xlsxwriter` if Excel styling fails).
- All scripts assume Windows paths under OneDrive; update constants if running elsewhere.
- No pytest suite yet—manually validate generated CSV/XLSX/PDF outputs.

# Data Pipelines & Scripts
- Monthly ad spend workflow (preferred):
  1. Update `Reporting/Monthly Product Ad Spends/Ad Spend Processor Skill Files/config.json` with `month` and input filenames.
  2. Place source files in the folder defined by `paths.input_dir`.
  3. From that directory, run `python master_workflow.py` (calls `process_upload.py`, `create_excel_report.py`, `create_summary_report.py`, `create_pdf_report.py`). Outputs land in `../<month>/`.
- Quick load check: `python Skills & Automations/ad-spend-processor/run_processor.py` (reads first Google/Bing files under `Ads Report/Monthly Product Ad Spends`).
- Supabase import: `python Document Storage/Scripts/import_ad_spend_to_supabase.py --test` (dry run) then rerun without `--test`. Requires `SUPABASE_URL`/`SUPABASE_KEY` in environment or `.env`.
- CBOS → dashboard ETL: `python "Skills & Automations/CBOS TO DASH/dashboard_processor.py"` (expects CBOS exports in `Ads Report/Dashboard/Monthly Imports` and master SKU at `Ads Report/SKU Documents/`). Generates Excel outputs and logs.

# Deployment
- For static dashboard hosting: from `Source 4 Dashboard/web`, run `npm run export` then `bash "Document Storage/Scripts/deploy.sh"` (Git Bash). Script copies `out/` contents, commits, and pushes `gh-pages`.
- Vercel-style deployment can use `.vercel/` config; ensure environment variables match `.env.local` before promoting.

# Environment & Secrets
- Copy `.env.example` → `.env` for shared secrets (database, AWS, Supabase). Never commit populated files.
- The dashboard reads Supabase keys from `.env.local`; treat the service-role key as sensitive and keep it local only.
- Python scripts read `.env` automatically when missing env vars—keep secrets synchronized manually across machines.

# Conventions & Patterns
- Dashboard uses Next.js App Router (`src/app`), TypeScript, Tailwind CSS (`tailwind.config.ts`), and shadcn-style component wrappers under `src/components`.
- Prefer modular utilities in `src/lib` and keep server/client components separated by file suffix (`page.tsx`, `layout.tsx`, `route.ts`).
- Python processors rely on pandas DataFrames; avoid altering column names without updating downstream formatting logic.
- Large generated artifacts (CSV/XLSX/PDF) belong under `Reporting/` or `Ads Report/` folders—do not commit unless explicitly requested.

# Git Workflow
- Start session: `git sync-start` (alias for `git pull`).
- End session: `git sync-end` (stages, commits, pushes with timestamp). If aliases missing, run `git add . && git commit -m "..." && git push`.
- Work in feature branches when touching dashboard code; keep main clean for deploys.

# Gotchas
- Paths include spaces (`Source 4 Dashboard`); always quote when running commands.
- `master_workflow.py` spawns child scripts using the active Python interpreter—activate your venv first to ensure pandas/reportlab availability.
- Some scripts expect CSV/Excel headers exactly as exported from Google/Bing/CBOS; avoid manually reformatting source files.
- OneDrive sync can lock Excel/PDF outputs; close them before rerunning generators.
