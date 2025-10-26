# KanjiVG Data Generation

This directory contains everything needed to generate the JavaScript data files for the KanjiVG library.

## Contents

- `convert-data.py` - Main conversion script
- `kanjivg.py` - KanjiVG Python library (SVGHandler class)
- `utils.py` - Utility functions for SVG file handling
- `kvg-index.json` - Character to SVG file mapping index
- `kanji/` - Directory containing all 11,661 SVG files
- `requirements.txt` - Python dependencies (none required)

## Requirements

- **Python 3.6+** (uses only standard library)
- **Disk Space**: ~500MB for all SVG files
- **Memory**: ~2GB RAM recommended for processing all files

## Usage

### Generate All Data (6,702 kanji)

```bash
cd data-generation
python3 convert-data.py
```

This will create:
- `../data/kanjivg-data.json` (28MB) - All kanji data
- `../data/kanjivg-index.json` (329KB) - Character lookup index
- `../data/kanjivg-sample.json` (2.6KB) - Sample data for testing

### Generate Sample Data Only

```bash
cd data-generation
python3 -c "
import sys
sys.path.append('.')
from convert_data import convert_svg_to_js_data
from pathlib import Path

# Convert just a few kanji for testing
sample_files = ['kanji/04e00.svg', 'kanji/04e01.svg', 'kanji/04e02.svg']
output_dir = Path('../data')
output_dir.mkdir(exist_ok=True)

kanji_data = {}
for svg_file in sample_files:
    result = convert_svg_to_js_data(svg_file, output_dir)
    if result:
        kanji_data[result['code']] = result

import json
with open('../data/sample.json', 'w') as f:
    json.dump({'kanji': kanji_data}, f, ensure_ascii=False, indent=2)
"
```

## Data Structure

The generated JSON follows this structure:

```json
{
  "kanji": {
    "04e00": {
      "code": "04e00",
      "character": "一",
      "variant": null,
      "strokes": {
        "id": "",
        "groups": [...],
        "strokes": [...]
      }
    }
  },
  "index": {
    "一": ["04e00.svg"],
    "二": ["04e01.svg"]
  }
}
```

## File Sizes

- **kanjivg-data.json**: ~28MB (6,702 kanji)
- **kanjivg-index.json**: ~329KB (character lookup)
- **kanjivg-sample.json**: ~2.6KB (sample data)

## Troubleshooting

### Memory Issues
If you get memory errors, process files in batches:
```python
# Modify convert-data.py to process 1000 files at a time
svg_files = listSvgFiles(kanji_dir)[:1000]  # First 1000 files
```

### Missing Files
Ensure all files are present:
```bash
ls -la kanji/ | wc -l  # Should show 11661 files
ls -la kvg-index.json  # Should exist
```

### Python Version
Check Python version:
```bash
python3 --version  # Should be 3.6+
```

## Integration

The generated data files are used by:
- `src/data-loader.ts` - Loads data in browser/Node.js
- `examples/full-dataset.html` - Demonstrates full dataset
- `examples/basic-usage.html` - Uses sample data

## License

Same as KanjiVG project - Creative Commons Attribution-Share Alike 3.0 License.
