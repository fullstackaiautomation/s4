import csv
from pathlib import Path

path = Path(r"C:\\Users\\blkw\\OneDrive\\Documents\\Github\\Source 4 Industries\\Reporting\\All Time Sales Files\\ALL TIME SALES DATABASE - Sheet1.csv")
count = 0
samples = []
with path.open(encoding='utf-8-sig') as f:
    reader = csv.DictReader(f)
    for row in reader:
        val = row.get('Invoice Total', '')
        if val and ('(' in val or ')' in val):
            count += 1
            if len(samples) < 10:
                samples.append(val)
print('count', count)
for sample in samples:
    print(sample)
