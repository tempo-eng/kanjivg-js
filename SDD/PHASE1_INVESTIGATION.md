# KanjiVG Phase 1 Investigation Report

## Repository Structure and Overview

The KanjiVG repository contains a collection of 11,661+ SVG files representing kanji characters with stroke order information. This document outlines the data structure and functionality for creating a TypeScript/React library to search and animate kanji.

### Core Files and Their Functions

| File | Purpose |
|------|---------|
| `kanjivg.py` | Core Python library with data classes for Kanji, StrokeGr (stroke groups), and Stroke objects. Handles SVG/XML parsing. |
| `kvg.py` | Generates legacy kanjivg.xml format and provides utilities for splitting/merging SVG paths |
| `kvg_lookup.py` | Command-line tool for searching and viewing kanji data |
| `utils.py` | File handling utilities, canonical ID conversion, SVG file reading |
| `xmlhandler.py` | XML/SVG parsing handlers (BasicHandler, KanjisHandler, SVGHandler) |
| `make-index.py` | Generates kvg-index.json mapping kanji characters to SVG files |
| `kvg-index.json` | Index mapping characters to their SVG file names |

## SVG File Structure

### File Naming Convention
- Base files: `[5-digit-hex-unicode].svg` (e.g., `04e00.svg` for 一)
- Variants: `[5-digit-hex-unicode]-[variant-name].svg` (e.g., `04e14-Kaisho.svg`)
- Total files: 11,661+ files
- Base kanji (non-variants): 6,702 files
- Variant files: ~4,959 additional files

### SVG Structure Analysis

Each SVG file contains two main sections:

#### 1. Stroke Paths Section
```xml
<g id="kvg:StrokePaths_[unicode]" style="fill:none;stroke:#000000;stroke-width:3;stroke-linecap:round;stroke-linejoin:round;">
  <g id="kvg:[unicode]" kvg:element="[kanji-character]" kvg:radical="[radical-type]">
    <!-- Stroke groups and individual strokes -->
  </g>
</g>
```

**Important Styling Note:** The SVG files contain hardcoded inline styles:
- `fill:none;stroke:#000000;stroke-width:3;stroke-linecap:round;stroke-linejoin:round;`
- These styles must be **stripped out** during parsing to allow custom styling via animation options
- All styling should be controlled through the React component's styling system

**Key SVG Attributes:**
- `kvg:element` - The kanji character or sub-component (e.g., "上", "木")
- `kvg:radical` - Radical information (e.g., "general", "nelson", "tradit")
- `kvg:variant` - Indicates if this is a variant form (e.g., "Kaisho" = cursive style)
- `kvg:partial` - Boolean indicating partial forms
- `kvg:original` - More common/simplified version of the component
- `kvg:position` - Spatial position in the kanji (e.g., "left", "right", "top", "bottom")
- `kvg:number` - Stroke number for components
- `kvg:part` - Part number for multi-part groups
- `kvg:tradForm` - Traditional form indicator
- `kvg:radicalForm` - Radical form indicator
- `kvg:phon` - Phonetic component information

#### 2. Stroke Numbers Section
```xml
<g id="kvg:StrokeNumbers_[unicode]" style="font-size:8;fill:#808080">
  <text transform="matrix(1 0 0 1 [x] [y])">1</text>
  <!-- Additional stroke numbers -->
</g>
```

### Stroke Type Classification

The `kvg:type` attribute on `<path>` elements represents stroke types:
- `㇐` - Horizontal stroke
- `㇑` - Vertical stroke  
- `㇐a`, `㇐b` - Horizontal variants
- `㇕a` - Hook downward
- `㇔/㇏` - Left diagonal/dot
- `㇚` - Vertical line
- `㇇` - Leftward stroke
- `㇒` - Downward right diagonal
- `㇏` - Right downward diagonal
- `㇆` - Right hook
- `㇖` - Horizontal line with downward curve
- `㇁` - Vertical line with hook right

## Data Model

### Python Class Hierarchy

From `kanjivg.py`:

```python
class Kanji:
    - code: unicode character ID (hexadecimal string)
    - variant: variant identifier if present
    - strokes: StrokeGr (root stroke group)
    
    Methods:
    - getStrokes() -> list of all Stroke objects
    - components(simplified, recursive) -> list of component kanji

class StrokeGr:  # Stroke Group
    - element: the kanji component
    - original: simplified version if applicable
    - position: spatial position
    - radical: radical information
    - phon: phonetic component
    - variant, partial, tradForm, radicalForm: boolean flags
    - number: stroke number
    - part: part number for multi-part groups
    - childs: list of child StrokeGr or Stroke objects
    
    Methods:
    - components() -> list of component elements
    - getStrokes() -> list of all strokes in group
    - simplify() -> merges single-child groups

class Stroke:
    - stype: stroke type (e.g., "㇐", "㇑")
    - svg: path data (d attribute)
    - numberPos: position for stroke number annotation
```

### Key Patterns Observed

1. **Nested Structure**: Groups can contain other groups (recursive)
2. **Stroke Order**: Determined by document order of `<path>` elements
3. **Radical Identification**: Some groups marked with `kvg:radical` attribute
4. **Component Decomposition**: Kanji broken down into sub-k Components with `kvg:element`
5. **Position Information**: Spatial organization via `kvg:position`

## Stroke Order Preservation

### How Stroke Order is Encoded

1. **Document Order**: The sequence of `<path>` elements in the SVG file
2. **Stroke Numbers**: Explicit numbering in the `kvg:StrokeNumbers` section
3. **Hierarchical Groups**: Groups maintain internal stroke order

### Example: Complex Kanji (06c34 - 水 / water)

```xml
<path id="kvg:06c34-s1" kvg:type="㇚" d="M52.77,15.08c1.08,1.08,1.67,2.49..."/>  <!-- Stroke 1 -->
<path id="kvg:06c34-s2" kvg:type="㇇" d="M17.5,45.75c1.75,0.62..."/>              <!-- Stroke 2 -->
<path id="kvg:06c34-s3" kvg:type="㇒" d="M81.22,27.5c-0.22,1.25..."/>              <!-- Stroke 3 -->
<path id="kvg:06c34-s4" kvg:type="㇏" d="M57,46c8.82,10.73..."/>                   <!-- Stroke 4 -->
```

Stroke order is confirmed by the `StrokeNumbers` section with explicit coordinates for each number.

### Groups and Stroke Order

For complex kanji with sub-components (e.g., 栃 / 06803):

```
Root: 栃 (9 strokes)
├─ Group 1: 木 (left position) - Strokes 1-4
│  ├─ ㇐ (stroke 1)
│  ├─ ㇑ (stroke 2)
│  ├─ ㇒ (stroke 3)
│  └─ ㇔/㇏ (stroke 4)
└─ Group 2: right position - Strokes 5-9
   ├─ Group 3: 厂 (variant) - Strokes 5-6
   └─ Group 4: 万
      ├─ Group 5: 一 - Stroke 7
      ├─ ㇆ (stroke 8)
      └─ ㇒ (stroke 9)
```

## Key Functions Available

### From `kanjivg.py`:

1. **Parse SVG Files**: `SVGHandler` can parse individual SVG files
2. **Extract Components**: `components(simplified, recursive)` - get component breakdown
3. **Get Strokes**: `getStrokes()` - flatten to list of all strokes in order
4. **Stroke Grouping**: Hierarchical groups preserve component structure
5. **Simplify Structure**: `simplify()` merges redundant groups

### From `kvg_lookup.py`:

1. **Find Files**: Search by unicode codepoint or character
2. **Character Summary**: Get structured breakdown of kanji components

### From `kvg.py`:

1. **Generate Releases**: Creates aggregated XML files
2. **Path Management**: Split/merge path data

### From `make-index.py`:

1. **Build Index**: Creates `kvg-index.json` mapping characters to files
2. **Handle Variants**: Index includes all variants

## Key Insights for Implementation

### 1. Memory Efficiency
- **Current**: ~11,661 SVG files (~1-3KB each)
- **Total**: ~15-35 MB uncompressed
- **Strategy**: Load on-demand per kanji request
- **Index**: Use `kvg-index.json` for fast lookups without loading all files

### 2. Data Access Patterns
- Primary: getKanji(character) - needs fast lookup
- Secondary: searchRadical(radical) - requires parsing/structure analysis
- Tertiary: getRandom() - can use index file

### 3. Structure Preservation
- Maintain stroke order via array position
- Preserve group hierarchy for radical identification
- Keep variant information separate from base forms

### 4. Stroke Order Critical Points
- Order determined by XML/SVG parsing sequence
- Number annotations provide verification
- Group nesting doesn't affect overall stroke order (flattened by `getStrokes()`)

### 5. Component/RADICAL Identification
- Some groups marked with `kvg:radical` attribute
- Component decomposition via `kvg:element` on groups
- Can trace radicals through group hierarchy

### 6. Variant Handling
- Variants marked with suffixes (e.g., `-Kaisho`, `-HzFst`)
- Same base unicode, different visual forms
- Need to distinguish variants in `getKanji()` response

## File Format Considerations

### For JavaScript/TypeScript Implementation

**Option 1: Keep as SVG**
- Pros: Native format, already optimized, preserves stroke order perfectly
- Cons: Need XML parsing in browser, larger file size
- XML Parsing Issues:
  - Browser's native `DOMParser` is reliable and well-supported
  - Library options: `fast-xml-parser` or `xmldom` for more control
  - SVG parsing is straightforward - just need to extract attributes and path data
  - No significant performance issues for on-demand parsing (one file at a time)

**Option 2: Convert to JSON**
- Pros: Easier JavaScript parsing, can optimize structure, strip styling during conversion
- Cons: Conversion step required, potential data loss, need to write converter

**Recommendation**: Keep as SVG initially for accuracy and minimal processing overhead.

### Bundle Strategy
- Include all SVG files in package as static assets
- Bundle as-is in `/kanji` directory
- **Webpack/Rollup Considerations:**
  - ~11,661 SVG files (~15-35 MB total) is large but manageable
  - Use `asset/resource` or copy-webpack-plugin to treat SVGs as raw assets
  - Bundle will include all files but they're requested on-demand
  - Can set up code-splitting per kanji if bundle size becomes an issue
  - Alternative: host SVGs on CDN and fetch on-demand (more complexity)
  - For npm package: consumers can tree-shake or selectively copy files they need
- Use `kvg-index.json` for character-to-file mapping
- Parse SVG on-demand per request with `DOMParser`
- Strip inline styles during parsing to allow custom styling

## Stroke Animation Considerations

### Required Data Extraction
1. **Path Data**: `d` attribute from `<path>` elements (strip inline styles)
2. **Stroke Order**: Array sequence
3. **Stroke Type**: `kvg:type` attribute
4. **Group Membership**: For radical styling
5. **Number Positions**: From `kvg:StrokeNumbers` section
6. **Strip Styling**: Remove `fill`, `stroke`, `stroke-width`, `stroke-linecap`, `stroke-linejoin` attributes
7. **Apply Custom Styles**: Add styles programmatically via CSS or inline styles based on animation options

### Animation Flow
1. Parse SVG and extract path data, strip default styling
2. Extract all strokes in order with their metadata
3. Determine groups for radical highlighting (via group hierarchy)
4. Store each stroke with: path data, type, parent group info, number position
5. Render with custom styling based on:
   - Animation options (stroke color, thickness, etc.)
   - Group membership (radical vs regular strokes)
   - Animation state (current stroke, trace visibility)

### Trace Option
- Could pre-render full kanji as semi-transparent overlay
- Or store and display complete stroke paths at reduced opacity

## Summary for Phase 2 Planning

**Data Available:**
- 6,702 base kanji + 4,959 variants = 11,661 files
- Stroke order preserved via document order + number annotations
- Component breakdown via `kvg:element` attributes
- Radical information via `kvg:radical` attributes
- Spatial position information via `kvg:position`

**Key Challenges:**
1. Efficient SVG parsing in browser environment
2. **Stripping inline styles** and applying custom styling system
3. Extracting and formatting data for animation
4. Handling variants (determine which is "primary")
5. Memory management (loading strategy)
6. Stroke order preservation during transformation
7. Webpack bundling of ~11k SVG files (use asset plugins, consider tree-shaking)

**Key Opportunities:**
1. Existing Python code provides reference implementation
2. Well-structured SVG with metadata
3. Index file for fast lookups
4. Clear separation of variants

