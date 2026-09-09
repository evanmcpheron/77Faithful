"""Extract the draft's exact WEB readings from eBible.org's engwebp VPL archive."""
import hashlib
import json
from pathlib import Path
import re
import sys
import zipfile

root = Path(__file__).resolve().parent.parent
content = root / 'content/provisional-course'
manuscript = json.loads((content / 'manuscript.json').read_text())
with zipfile.ZipFile(sys.argv[1]) as archive:
    raw = archive.read('engwebp_vpl.txt')
    source_date = '-'.join(f'{part:02}' for part in archive.getinfo('engwebp_vpl.txt').date_time[:3])
verses = {}
for line in raw.decode('utf-8-sig').splitlines():
    match = re.fullmatch(r'(\w+) (\d+):(\d+) (.*)', line)
    if not match:
        raise ValueError(f'Unrecognized source line: {line[:80]}')
    book, chapter, verse, text = match.groups()
    verses.setdefault(book, []).append((int(chapter), int(verse), text))
books = {'John': 'JOH', 'Matthew': 'MAT', 'Psalm': 'PSA', 'Colossians': 'COL',
         '2 Timothy': '2TI', 'Luke': 'LUK', 'Nehemiah': 'NEH', 'Mark': 'MAR',
         'James': 'JAM', 'Hebrews': 'HEB', 'Philippians': 'PHI', 'Romans': 'ROM',
         'Ezekiel': 'EZE', 'Ephesians': 'EPH', 'Galatians': 'GAL', '1 Peter': '1PE',
         '1 John': '1JO', '1 Corinthians': '1CO', '2 Corinthians': '2CO',
         '1 Timothy': '1TI', 'Acts': 'ACT', 'Jude': 'JUD'}
readings = {}
for day in manuscript['days']:
    reference = day['passage']
    match = re.fullmatch(r'(.+?) (\d+)(?::(\d+))?(?:–(?:(\d+):)?(\d+))?', reference)
    if not match:
        raise ValueError(f'Unrecognized passage: {reference}')
    book, chapter, start, endchapter, end = match.groups()
    chapter = int(chapter)
    if book == 'Jude':
        start = chapter
        chapter = 1
    start = int(start) if start else 1
    endchapter = int(endchapter) if endchapter else chapter
    end = int(end) if end else max(v for c, v, text in verses[books[book]] if c == chapter)
    selected = [{'verseLabel': f'{c}:{v}', 'text': text} for c, v, text in verses[books[book]]
                if (chapter, start) <= (c, v) <= (endchapter, end)]
    if not selected or selected[0]['verseLabel'] != f'{chapter}:{start}' or selected[-1]['verseLabel'] != f'{endchapter}:{end}':
        raise ValueError(f'Incomplete passage: {reference}')
    readings[reference] = selected
source = {
    'editionName': 'World English Bible, Protestant edition (engwebp)',
    'sourceUrl': 'https://ebible.org/Scriptures/engwebp_vpl.zip',
    'rightsUrl': 'https://ebible.org/bible/details.php?all=1&id=engwebp',
    'sourceRevision': 'sha256:' + hashlib.sha256(raw).hexdigest(),
    'sourceFileDate': source_date,
    'acknowledgments': ['Scripture quotations are from the World English Bible (engwebp), public domain. Source: eBible.org. Verse text is reproduced without alteration.'],
    'readings': readings,
}
(content / 'scripture-web.json').write_text(json.dumps(source, ensure_ascii=False, indent=2) + '\n')
print(f'Imported {len(readings)} readings and {sum(len(v) for v in readings.values())} verses.')
