import csv
import decimal
from pathlib import Path

path = Path(r'C:\Users\blkw\OneDrive\Documents\Github\Source 4 Industries\Reporting\All Time Sales Files\ALL TIME SALES DATABASE - Sheet1.csv')

total = decimal.Decimal('0')
with path.open(encoding='utf-8-sig') as f:
    reader = csv.DictReader(f)
    for row in reader:
        val = row.get('Shipping', '').replace('$', '').replace(',', '').strip()
        if val:
            total += decimal.Decimal(val)

print(total)
