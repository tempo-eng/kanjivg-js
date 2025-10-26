#!/usr/bin/env python3
"""
Test script to verify data generation works correctly
"""

import sys
import json
from pathlib import Path

# Add current directory to path
sys.path.insert(0, str(Path(__file__).parent))

from convert_data import convert_svg_to_js_data

def test_data_generation():
    """Test converting a few sample kanji"""
    print("Testing KanjiVG data generation...")
    
    # Test files
    test_files = [
        'kanji/04e00.svg',  # 一
        'kanji/04e01.svg',  # 丁  
        'kanji/04e03.svg',  # 万
    ]
    
    results = {}
    
    for svg_file in test_files:
        print(f"Converting {svg_file}...")
        result = convert_svg_to_js_data(svg_file, Path('../data'))
        
        if result:
            results[result['code']] = result
            print(f"  ✅ {result['character']} ({result['code']}) - {len(result['strokes']['strokes'])} strokes")
        else:
            print(f"  ❌ Failed to convert {svg_file}")
    
    print(f"\nSuccessfully converted {len(results)} kanji")
    
    # Test JSON serialization
    try:
        json_str = json.dumps(results, ensure_ascii=False, indent=2)
        print("✅ JSON serialization works")
    except Exception as e:
        print(f"❌ JSON serialization failed: {e}")
    
    return len(results) == len(test_files)

if __name__ == '__main__':
    success = test_data_generation()
    sys.exit(0 if success else 1)
