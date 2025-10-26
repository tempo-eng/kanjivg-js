#!/usr/bin/env python3
"""
Convert KanjiVG Python data to JavaScript format
This script reads the SVG files and index, then generates JavaScript data files
"""

import os
import json
import sys
from pathlib import Path

# Add current directory to path to import kanjivg modules
sys.path.insert(0, str(Path(__file__).parent))

from kanjivg import SVGHandler
from utils import listSvgFiles, readXmlFile

def convert_svg_to_js_data(svg_file_path, output_dir):
    """Convert a single SVG file to JavaScript data format"""
    try:
        from utils import SvgFileInfo
        sfi = SvgFileInfo(os.path.basename(svg_file_path), os.path.dirname(svg_file_path))
        if not sfi.OK:
            return None
            
        kanji = sfi.read()
        if not kanji:
            return None
            
        # Convert to JavaScript format
        js_data = {
            "code": kanji.code,
            "character": chr(int(kanji.code, 16)),
            "variant": kanji.variant,
            "strokes": convert_stroke_group(kanji.strokes)
        }
        
        # Add flattened strokes for easier access
        js_data["all_strokes"] = flatten_all_strokes(kanji.strokes)
        
        return js_data
    except Exception as e:
        print(f"Error converting {svg_file_path}: {e}")
        return None

def convert_stroke_group(group):
    """Convert a stroke group to JavaScript format"""
    js_group = {
        "id": group.ID or "",
        "groups": [],
        "strokes": []
    }
    
    # Convert attributes
    if group.element:
        js_group["element"] = group.element
    if group.original:
        js_group["original"] = group.original
    if group.part is not None:
        js_group["part"] = group.part
    if group.number is not None:
        js_group["number"] = group.number
    if group.variant:
        js_group["variant"] = group.variant
    if group.partial:
        js_group["partial"] = group.partial
    if group.tradForm:
        js_group["tradForm"] = group.tradForm
    if group.radicalForm:
        js_group["radicalForm"] = group.radicalForm
    if group.position:
        js_group["position"] = group.position
    if group.radical:
        js_group["radical"] = group.radical
    if group.phon:
        js_group["phon"] = group.phon
    
    # Convert child groups
    for child in group.childs:
        if hasattr(child, 'childs'):  # It's a StrokeGr
            js_group["groups"].append(convert_stroke_group(child))
        else:  # It's a Stroke
            js_group["strokes"].append({
                "type": child.stype,
                "path": child.svg or "",
                "numberPos": child.numberPos
            })
    
    return js_group

def flatten_all_strokes(group):
    """Flatten all strokes from a stroke group into a single list in correct order"""
    all_strokes = []
    
    # Process children in order (mimics Python's childs iteration)
    for child in group.childs:
        if hasattr(child, 'childs'):  # It's a StrokeGr
            all_strokes.extend(flatten_all_strokes(child))
        else:  # It's a Stroke
            all_strokes.append({
                "type": child.stype,
                "path": child.svg or "",
                "numberPos": child.numberPos
            })
    
    return all_strokes

def get_unicode_range(code):
    """Get Unicode range name for a kanji code"""
    code_point = int(code, 16)
    
    if 0x4E00 <= code_point <= 0x9FFF:
        return 'basic'
    elif 0x3400 <= code_point <= 0x4DBF:
        return 'extended-a'
    elif 0x20000 <= code_point <= 0x2A6DF:
        return 'extended-b'
    elif 0x2A700 <= code_point <= 0x2B73F:
        return 'extended-c'
    elif 0x2B740 <= code_point <= 0x2B81F:
        return 'extended-d'
    elif 0x2B820 <= code_point <= 0x2CEAF:
        return 'extended-e'
    elif 0xF900 <= code_point <= 0xFAFF:
        return 'compatibility'
    else:
        return 'other'

def main():
    """Main conversion function"""
    # Paths
    script_dir = Path(__file__).parent
    kanji_dir = script_dir / "kanji"
    index_file = script_dir / "kvg-index.json"
    output_dir = script_dir.parent / "data"
    individual_dir = output_dir / "individual"
    
    # Create output directories
    output_dir.mkdir(exist_ok=True)
    individual_dir.mkdir(exist_ok=True)
    
    print("Converting KanjiVG data to JavaScript format...")
    
    # Load index
    print("Loading index...")
    with open(index_file, 'r', encoding='utf-8') as f:
        index = json.load(f)
    
    # Convert SVG files (all files)
    print("Converting SVG files...")
    kanji_data = {}
    character_index = {}  # New index: character -> list of variant keys
    svg_files = listSvgFiles(str(kanji_dir))
    
    # Process all files
    for i, sfi in enumerate(svg_files):
        if i % 100 == 0:
            print(f"Processing {i+1}/{len(svg_files)}...")
            
        try:
            kanji = sfi.read()
            if kanji:
                js_data = {
                    "code": kanji.code,
                    "character": chr(int(kanji.code, 16)),
                    "variant": kanji.variant,
                    "strokes": convert_stroke_group(kanji.strokes),
                    "all_strokes": flatten_all_strokes(kanji.strokes)
                }
                variant_key = kanji.kId()
                kanji_data[variant_key] = js_data
                
                # Save individual kanji file
                individual_file = individual_dir / f"{variant_key}.json"
                with open(individual_file, 'w', encoding='utf-8') as f:
                    json.dump(js_data, f, ensure_ascii=False, indent=2)
                
                # Add to character index
                character = chr(int(kanji.code, 16))
                if character not in character_index:
                    character_index[character] = []
                character_index[character].append(variant_key)
        except Exception as e:
            print(f"Error processing {sfi.path}: {e}")
            continue
    
    # Create lookup index: kanji code -> file path
    lookup_index = {}
    for variant_key in kanji_data.keys():
        lookup_index[variant_key] = f"individual/{variant_key}.json"
    
    # Save lookup index
    lookup_index_path = output_dir / "lookup-index.json"
    with open(lookup_index_path, 'w', encoding='utf-8') as f:
        json.dump(lookup_index, f, ensure_ascii=False, indent=2)
    
    # Save character index (for backward compatibility)
    with open(output_dir / "kanjivg-index.json", 'w', encoding='utf-8') as f:
        json.dump(character_index, f, ensure_ascii=False, indent=2)
    
    print(f"\nConversion complete!")
    print(f"Total kanji converted: {len(kanji_data)}")
    print(f"Individual files created: {len(kanji_data)}")
    print(f"Data saved to: {output_dir}")
    print(f"Files created:")
    print(f"  - individual/ (directory with {len(kanji_data)} individual kanji files)")
    print(f"  - lookup-index.json (kanji code -> file path mapping)")
    print(f"  - kanjivg-index.json (character index)")
    
    # Show file size distribution
    print(f"\nFile size distribution:")
    total_size = 0
    for variant_key in list(kanji_data.keys())[:10]:  # Show first 10 as sample
        individual_file = individual_dir / f"{variant_key}.json"
        if individual_file.exists():
            size = individual_file.stat().st_size
            total_size += size
            print(f"  {variant_key}.json: {size:,} bytes")
    
    if len(kanji_data) > 10:
        print(f"  ... and {len(kanji_data) - 10} more files")
    
    print(f"Average file size: {total_size // min(10, len(kanji_data)):,} bytes")

if __name__ == "__main__":
    main()
