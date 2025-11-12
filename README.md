# Source 4 Industries

Enterprise operations platform with automated data processing, sales dashboards, and business intelligence tools.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ (for dashboard)
- Python 3.9+ (for data processing)
- Supabase account (database)
- Git (version control)

### Setup
1. Clone the repository:
   ```bash
   git clone https://github.com/fullstackaiautomation/s4
   cd "Source 4 Industries"
   ```

2. Install dashboard dependencies:
   ```bash
   cd "Source 4 Dashboard/web"
   npm install
   ```

3. Configure environment:
   - Copy `.env.example` to `.env`
   - Add your Supabase credentials

4. Start the dashboard:
   ```bash
   npm run dev
   ```
   Access at: http://localhost:3000

## 📁 Project Structure

```
Source 4 Industries/
├── Skills & Automations/        # Automation skills & processors
│   ├── ad-spend-processor/      # Monthly ad spend data processing
│   └── all-time-sales-processor/# Sales data ETL pipeline
│
├── Source 4 Dashboard/          # Web dashboard application
│   └── web/                     # Next.js 15 app with Supabase integration
│
├── Reporting/                   # Reports and data exports
│   ├── Monthly Product Ad Spends/
│   └── All Time Sales/
│
└── Document Storage/           # All documentation & resources
    ├── Data/                   # Data files and exports
    ├── Documentation/          # Project documentation
    │   ├── Archive/           # Historical docs
    │   ├── Deployment/        # Deployment guides
    │   ├── Supabase/         # Database documentation
    │   └── Workflows/        # Process documentation
    ├── Scripts/               # Import and utility scripts
    └── SQL/                   # Database queries and schemas
```

## 🎯 Key Features

### Dashboard
- **Sales Performance**: Real-time sales metrics and trends
- **Rep Dashboard**: Individual rep performance tracking
- **Product Ad Spend**: ROI analysis for advertising campaigns
- **Home Runs**: High-value deal tracking

### Data Processing Skills
- **Ad Spend Processor**: Processes Google Ads & Bing Ads data monthly
- **All Time Sales Processor**: ETL pipeline for CBOS sales data
- **SKU Master Management**: Centralized product catalog

### Integrations
- **Supabase**: Real-time database with Row Level Security
- **Google Ads API**: Automated ad performance data
- **Bing Ads**: Campaign data integration
- **CBOS ERP**: Sales order processing

## 🛠️ Skills & Automations

### Available Skills
Located in `Skills & Automations/` directory:

1. **ad-spend-processor**
   - Processes monthly advertising data
   - Auto-categorizes products
   - Generates vendor/category analysis

2. **all-time-sales-processor**
   - Transforms CBOS exports to dashboard format
   - Enriches with Master SKU data
   - Calculates margins and ROI

See Skills & Automations README for detailed documentation.

## 📊 Database Schema

The project uses Supabase with the following main tables:
- `sku_ad_spend` - Monthly advertising performance
- `all_time_sales` - Historical sales data
- `sku_master` - Product catalog

## 🔧 Development

### Git Workflow
```bash
# Start of session
git pull

# End of session
git add .
git commit -m "Description of changes"
git push
```

### Running Tests
```bash
npm test          # Dashboard tests
python -m pytest  # Python skill tests
```

## 📚 Documentation

- [Deployment Guide](Documentation/Deployment/DEPLOYMENT_GUIDE.md)
- [Supabase Setup](Documentation/Supabase/SUPABASE_IMPORT_README.md)
- [Architecture Overview](Documentation/Workflows/AUTOMATION_ARCHITECTURE_GUIDE.md)
- [Historical Documentation](Documentation/Archive/)

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## 📝 License

Private repository - All rights reserved

## 🆘 Support

For issues or questions:
- Check [Documentation](Documentation/) folder
- Review [CLAUDE.md](CLAUDE.md) for AI assistance context
- Contact the development team

---

**Repository:** https://github.com/fullstackaiautomation/s4
**Last Updated:** November 2025