// Configuration for ads report automation

export const MONTH_MAPPINGS = {
  'JUNE 2025': { letter: 'ZF', short: 'JUNE 25' },
  'JULY 2025': { letter: 'ZG', short: 'JULY 25' },
  'AUGUST 2025': { letter: 'ZH', short: 'AUG 25' },
  'SEPTEMBER 2025': { letter: 'ZI', short: 'SEPT 25' },
  'OCTOBER 2025': { letter: 'ZJ', short: 'OCT 25' },
  'NOVEMBER 2025': { letter: 'ZK', short: 'NOV 25' },
  'DECEMBER 2025': { letter: 'ZL', short: 'DEC 25' }
};

export const PLATFORMS = {
  GOOGLE: 'GOOGLE',
  BING: 'BING'
};

export const MAIN_VENDORS = [
  'HANDLE IT',
  'CASTERS',
  'DURABLE',
  'DH INTERNATIONAL',
  'CASTER DEPOT',
  'LINCOLN',
  'NOBLELIFT',
  'S4 BOLLARDS',
  'EKKO LIFTS',
  'B&P MANUFACTURING',
  'LITTLE GIANT',
  'MECO-OMAHA',
  'VALLEY CRAFT',
  'DUTRO',
  'MERRICK MACHINE',
  'ADRIAN\'S',
  'WESCO',
  'APOLLO FORKLIFT',
  'BLUFF',
  'SUNCAST',
  'SENTRY',
  'RELIANCE'
];

export const CASTER_VENDORS = [
  'DURABLE',
  'DH INTERNATIONAL',
  'CASTER DEPOT'
];

// Column indices (0-based)
export const COLUMNS = {
  SKU: 0,           // Column A
  VENDOR: 1,        // Column B
  TITLE: 2,         // Column C
  // ... add more as needed
  LETTER: 10,       // Column K
  MONTH: 11,        // Column L
  PLATFORM: 12,     // Column M
  PRODUCT_CATEGORY: 13  // Column N
};

// File paths (to be set via environment or parameters)
export const FILE_PATHS = {
  GOOGLE_ADS_PRODUCT_SPEND: process.env.GOOGLE_ADS_FILE || 'GOOGLE ADS- PRODUCT SPEND.xlsx',
  CBO_DASH_EXPORT: process.env.CBO_FILE || 'CBOS TO DASH MONTHLY EXPORT.xlsx',
  ALL_SKUS_SHEET: 'ALL SKUS'
};

export const VLOOKUP_FORMULAS = {
  SKU: (titleCell, row) => `=VLOOKUP(${titleCell},'ALL SKUS'!A:C,2,FALSE)`,
  VENDOR: (titleCell, row) => `=VLOOKUP(${titleCell},'ALL SKUS'!A:C,3,FALSE)`
};

export const ROW_COLORS = {
  LIGHT_YELLOW: 'FFFFFF00'  // Excel color format
};
