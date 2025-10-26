# KanjiVG Data Generation

This directory contains everything needed to generate the JavaScript data files for the KanjiVG library.

**Note:** Python is only used for data conversion. The main library is TypeScript/JavaScript and requires no Python runtime.

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
- `../data/kanjivg-data.json` (53MB) - All kanji data
- `../data/kanjivg-index.json` (2.1MB) - Character lookup index

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

- **kanjivg-data.json**: ~53MB (11,661 kanji with variants)
- **kanjivg-index.json**: ~2.1MB (character lookup)

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
- `examples/index.html` - Interactive demo with full dataset

## License

Same as KanjiVG project - Creative Commons Attribution-Share Alike 3.0 License.
