from docx import Document

doc = Document(r'C:\Users\blkw\OneDrive\Documents\Claude Code\Source 4 Industries\Bulk Bollards\Bollard_Keyword_Research_Report_Sorted.docx')

with open(r'C:\Users\blkw\OneDrive\Documents\Claude Code\Source 4 Industries\Bulk Bollards\keyword_research.txt', 'w', encoding='utf-8') as f:
    for para in doc.paragraphs:
        if para.text.strip():
            f.write(para.text + '\n')

print("Keyword research extracted to keyword_research.txt")
