# KanjiVG-js Phase 2 Planning Document

## Overview

This document outlines the complete plan for building `kanjivg-js` - a TypeScript/React library for searching and animating kanji characters. The library will be distributed as an npm package that can be imported into web applications and React Native projects.

The library folder will be called `kanjivg_js` (not `kanjivg_js` to match the existing convention in the repository).

## Project Structure

```
kanjivg/
├── kanjivg_js/                   # New TypeScript/React library (NEW)
│   ├── src/
│   │   ├── core/             # Core library functionality
│   │   │   ├── KanjiVG.ts       # Main class
│   │   │   ├── SVGParser.ts     # SVG parsing and extraction
│   │   │   ├── KanjiData.ts     # Data models/interfaces
│   │   │   └── index.ts         # Core exports
│   │   ├── components/      # React components
│   │   │   ├── KanjiCard.tsx    # Main animation component
│   │   │   ├── KanjiInfo.tsx    # Info panel component
│   │   │   └── index.ts         # Component exports
│   │   ├── types/            # TypeScript definitions
│   │   │   └── index.ts
│   │   ├── __tests__/        # Test suite
│   │   │   ├── KanjiVG.test.ts
│   │   │   ├── SVGParser.test.ts
│   │   │   ├── KanjiCard.test.tsx
│   │   │   └── stroke-order.test.ts
│   │   └── utils/            # Utility functions
│   │       ├── fileUtils.ts
│   │       └── colorUtils.ts
│   ├── kanji/               # SVG files (copied from parent kanji/)
│   ├── kvg-index.json       # Index file
│   ├── package.json
│   ├── tsconfig.json
│   ├── .gitignore
│   ├── .cursorignore
│   └── .npmignore
├── kanji/                   # Original SVG files (keep as-is)
├── kvg-index.json           # Original index (keep as-is)
└── [other existing files]
```

## Core API Design

### 1. KanjiVG Class

```typescript
class KanjiVG {
  constructor()
  
  /**
   * Get kanji data including all variants
   * @param kanji - Character (e.g., "車") or unicode (e.g., "04e0b")
   * @returns Array of KanjiData objects (at least one, more if variants exist)
   */
  async getKanji(kanji: string): Promise<KanjiData[]>
  
  /**
   * Search for kanji containing a specific radical
   * @param radical - The radical character (e.g., "女")
   * @returns Array of KanjiData objects
   */
  async searchRadical(radical: string): Promise<KanjiData[]>
  
  /**
   * Get a random kanji
   * @returns Single KanjiData object
   */
  async getRandom(): Promise<KanjiData>
}
```

### 2. Data Interfaces

```typescript
interface KanjiData {
  // Core identifiers
  character: string;           // The kanji character (e.g., "車")
  unicode: string;              // Unicode codepoint (e.g., "08eca")
  variant?: string;             // Variant identifier if present (e.g., "Kaisho")
  isVariant: boolean;           // True if this is a variant form
  
  // Structure
  strokes: StrokeData[];        // All strokes in order
  groups: GroupData[];          // Group hierarchy for radical identification
  radicalInfo?: RadicalInfo;     // Radical information if available
  
  // Metadata
  strokeCount: number;          // Total number of strokes
  components?: string[];         // Component decomposition
}

interface StrokeData {
  strokeNumber: number;          // 1-based stroke order
  path: string;                 // SVG path data (d attribute)
  strokeType: string;          // kvg:type (e.g., "㇐", "㇑")
  numberPosition?: {             // Position for stroke number annotation
    x: number;
    y: number;
  };
  groupId?: string;             // Which group this stroke belongs to
  isRadicalStroke?: boolean;    // True if part of a radical group
}

interface GroupData {
  id: string;                    // Group identifier
  element?: string;              // Component kanji (e.g., "木")
  radical?: string;              // Radical type (e.g., "general")
  position?: string;            // Spatial position (e.g., "left", "right")
  childStrokes: number[];        // Array of stroke numbers in this group
  children: GroupData[];         // Sub-groups
}

interface RadicalInfo {
  radical: string;              // The radical character
  positions: string[];          // Where the radical appears (e.g., ["left"])
  strokeRanges: number[][];    // Which strokes are part of the radical
}

interface AnimationOptions {
  strokeDuration: number;       // Duration of each stroke animation (ms)
  strokeDelay: number;          // Delay between strokes (ms)
  showNumbers: boolean;         // Show stroke order numbers
  loop: boolean;                // Loop the animation
  showTrace: boolean;           // Show outline trace
  strokeStyling: StrokeStyling;
  radicalStyling?: RadicalStyling;
  traceStyling?: TraceStyling;
  numberStyling?: NumberStyling;
}

interface StrokeStyling {
  strokeColour: string | string[];  // Single colour or array for cycling
  strokeThickness: number;
  strokeRadius: number;
}

interface RadicalStyling {
  radicalColour: string | string[];  // Overrides stroke styling for radicals
  radicalThickness: number;
  radicalRadius: number;
}

interface TraceStyling {
  traceColour: string;
  traceThickness: number;
  traceRadius: number;
}

interface NumberStyling {
  fontColour: string;
  fontWeight: number;
  fontSize: number;
}
```

### 3. React Component

```typescript
interface KanjiCardProps {
  kanji: string | KanjiData;        // Character or KanjiData object
  showInfo?: boolean;                // Show info panel
  animationOptions?: Partial<AnimationOptions>;
  onAnimationComplete?: () => void;
  className?: string;
}

<KanjiCard
  kanji="車"
  showInfo={false}
  animationOptions={{
    strokeDuration: 800,
    strokeDelay: 500,
    showNumbers: true,
    loop: false,
    showTrace: true,
    strokeStyling: {
      strokeColour: 'black',
      strokeThickness: 6,
      strokeRadius: 10,
    },
    radicalStyling: {
      radicalColour: '#ff0000',
      radicalThickness: 2,
      radicalRadius: 0,
    },
    traceStyling: {
      traceColour: '#a9a5a5',
      traceThickness: 2,
      traceRadius: 0,
    },
    numberStyling: {
      fontColour: '#10d6a1',
      fontWeight: 900,
      fontSize: 12,
    }
  }}
/>
```

## Implementation Strategy

### A. Data Handling Decision

**Decision: Keep SVG files as-is (do NOT convert to JSON)**

**Rationale:**
1. Maintains data integrity and stroke order
2. No data loss during conversion
3. SVG parsing in browser is straightforward with DOMParser
4. On-demand loading ensures memory efficiency
5. Can optimize later if needed

**SVG Processing Pipeline:**
1. Load SVG file on-demand via fetch/import
2. Parse with DOMParser
3. Extract all `<path>` elements in order
4. Extract group metadata from `<g>` elements
5. Strip inline styles (fill, stroke, stroke-width, etc.)
6. Extract stroke numbers from `kvg:StrokeNumbers` section
7. Transform to `KanjiData` object
8. Cache parsed result for subsequent calls

### B. Memory Efficiency

**Strategy: On-Demand Loading with Caching**

```typescript
class SVGParser {
  private cache = new Map<string, KanjiData[]>();
  
  async parseKanji(unicode: string): Promise<KanjiData[]> {
    // Check cache first
    if (this.cache.has(unicode)) {
      return this.cache.get(unicode)!;
    }
    
    // Load and parse
    const svgContent = await this.loadSVGFile(unicode);
    const kanjiData = this.parseSVG(svgContent);
    
    // Cache result
    this.cache.set(unicode, kanjiData);
    
    return kanjiData;
  }
  
  private async loadSVGFile(unicode: string): Promise<string> {
    // In browser: import raw SVG as text
    // OR use dynamic import with .svg?raw
    const module = await import(`../kanji/${unicode}.svg?raw`);
    return module.default;
  }
}
```

### C. Bundling Strategy

**Package Contents:**
- All 11,661 SVG files in `kanji/` directory
- `kvg-index.json` for fast lookups
- Compiled TypeScript to JavaScript
- Type definitions (.d.ts files)

**Webpack/Build Configuration:**
```javascript
// webpack.config.js or vite.config.js
export default {
  build: {
    rollupOptions: {
      input: 'src/index.ts',
      output: {
        // Keep SVG files as separate assets
        assetFileNames: 'kanji/[name][extname]',
      },
    },
  },
}
```

**For npm package:**
- Include all SVG files in package
- Use `files` field in package.json to include necessary files only
- Consumers get full dataset but load on-demand
- Bundle size: ~15-35 MB (uncompressed)
- Can be gzipped in actual deployment

### D. Core Implementation Details

#### 1. SVG Parser Implementation

```typescript
class SVGParser {
  parseSVG(svgContent: string, unicode: string): KanjiData[] {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgContent, 'image/svg+xml');
    
    // Find all path elements (strokes)
    const paths = doc.querySelectorAll('[id^="kvg:"] path');
    const strokes: StrokeData[] = [];
    
    paths.forEach((path, index) => {
      const id = path.getAttribute('id') || '';
      const d = path.getAttribute('d') || '';
      const type = path.getAttribute('kvg:type') || '';
      
      strokes.push({
        strokeNumber: index + 1,
        path: d,
        strokeType: type,
        numberPosition: this.extractNumberPosition(doc, index),
      });
    });
    
    // Extract group hierarchy
    const groups = this.extractGroups(doc);
    
    // Determine radical strokes
    const radicalInfo = this.extractRadicalInfo(groups, strokes);
    
    return {
      character: String.fromCodePoint(parseInt(unicode, 16)),
      unicode,
      isVariant: false,
      strokes,
      groups,
      radicalInfo,
      strokeCount: strokes.length,
    };
  }
  
  private extractNumberPosition(doc: Document, strokeNum: number): {x: number, y: number} {
    const numbers = doc.querySelector(`#kvg:StrokeNumbers_*`);
    // Extract transform matrix...
  }
  
  private extractGroups(doc: Document): GroupData[] {
    // Parse <g> elements with kvg:element, kvg:radical, etc.
  }
  
  private extractRadicalInfo(groups: GroupData[], strokes: StrokeData[]): RadicalInfo | undefined {
    // Identify which strokes belong to radical groups
  }
}
```

#### 2. KanjiVG Class Implementation

```typescript
class KanjiVG {
  private parser: SVGParser;
  private index: Map<string, string[]>;  // character -> file list
  
  constructor() {
    this.parser = new SVGParser();
    this.index = this.loadIndex();  // Load kvg-index.json
  }
  
  async getKanji(kanji: string): Promise<KanjiData[]> {
    // Convert input to unicode
    const unicode = this.toUnicode(kanji);
    
    // Get all variants for this character
    const files = this.index.get(kanji) || [];
    
    // Parse each variant
    const results = await Promise.all(
      files.map(file => this.parser.parseKanji(this.getUnicodeFromFile(file)))
    );
    
    return results.flat();
  }
  
  async searchRadical(radical: string): Promise<KanjiData[]> {
    // This requires parsing many files to find radical matches
    // Could cache results or do full scan
    const results: KanjiData[] = [];
    
    for (const [char, files] of this.index) {
      const kanjiData = await this.getKanji(char);
      if (this.hasRadical(kanjiData, radical)) {
        results.push(...kanjiData);
      }
    }
    
    return results;
  }
  
  async getRandom(): Promise<KanjiData> {
    const chars = Array.from(this.index.keys());
    const randomChar = chars[Math.floor(Math.random() * chars.length)];
    const results = await this.getKanji(randomChar);
    return results[0];  // Return primary (non-variant)
  }
  
  private hasRadical(kanjiData: KanjiData[], radical: string): boolean {
    return kanjiData.some(data => 
      data.radicalInfo?.radical === radical ||
      data.groups.some(g => g.element === radical)
    );
  }
}
```

#### 3. React Component Implementation

```typescript
const KanjiCard: React.FC<KanjiCardProps> = ({
  kanji,
  showInfo = false,
  animationOptions,
  onAnimationComplete,
  className
}) => {
  const [kanjiData, setKanjiData] = useState<KanjiData | null>(null);
  const [currentStroke, setCurrentStroke] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  
  useEffect(() => {
    loadKanji();
  }, [kanji]);
  
  const loadKanji = async () => {
    const kv = new KanjiVG();
    const data = typeof kanji === 'string' 
      ? await kv.getKanji(kanji) 
      : kanji;
    setKanjiData(data);
  };
  
  useEffect(() => {
    if (kanjiData && animationOptions?.loop !== false) {
      startAnimation();
    }
  }, [kanjiData]);
  
  const startAnimation = () => {
    setIsAnimating(true);
    
    // Animate strokes based on strokeDuration and strokeDelay
    for (let i = 0; i < kanjiData.strokes.length; i++) {
      setTimeout(() => {
        setCurrentStroke(i + 1);
      }, i * (animationOptions?.strokeDelay || 500));
    }
    
    setTimeout(() => {
      setIsAnimating(false);
      onAnimationComplete?.();
    }, totalDuration);
  };
  
  const getStrokeColor = (strokeNum: number, isRadical: boolean): string => {
    const colors = isRadical 
      ? animationOptions?.radicalStyling?.radicalColour
      : animationOptions?.strokeStyling?.strokeColour;
    
    if (Array.isArray(colors)) {
      return colors[(strokeNum - 1) % colors.length];
    }
    return colors || 'black';
  };
  
  return (
    <div className={className}>
      <svg viewBox="0 0 109 109">
        {/* Trace (if enabled) */}
        {animationOptions?.showTrace && kanjiData.strokes.map((stroke, i) => (
          <path
            key={`trace-${i}`}
            d={stroke.path}
            fill="none"
            stroke={animationOptions?.traceStyling?.traceColour}
            strokeWidth={animationOptions?.traceStyling?.traceThickness}
          />
        ))}
        
        {/* Animated strokes */}
        {kanjiData.strokes.slice(0, currentStroke).map((stroke, i) => (
          <path
            key={`stroke-${i}`}
            d={stroke.path}
            fill="none"
            stroke={getStrokeColor(i + 1, stroke.isRadicalStroke)}
            strokeWidth={animationOptions?.strokeStyling?.strokeThickness}
            style={{
              opacity: isAnimating ? 1 : 1,
            }}
          />
        ))}
        
        {/* Stroke numbers - appear progressively as strokes are drawn, remain visible */}
        {animationOptions?.showNumbers && kanjiData.strokes
          .slice(0, currentStroke)
          .map((stroke, i) => (
            <text
              key={`number-${i}`}
              x={stroke.numberPosition?.x}
              y={stroke.numberPosition?.y}
              fontSize={animationOptions?.numberStyling?.fontSize}
              fill={animationOptions?.numberStyling?.fontColour}
              fontWeight={animationOptions?.numberStyling?.fontWeight}
            >
              {i + 1}
            </text>
          ))}
      </svg>
      
      {showInfo && <KanjiInfo kanjiData={kanjiData} />}
    </div>
  );
};
```

## Test Plan

### Unit Tests

#### 1. KanjiVG.getKanji() Tests
```typescript
describe('KanjiVG.getKanji()', () => {
  test('returns kanji data for valid character', async () => {
    const kv = new KanjiVG();
    const result = await kv.getKanji('車');
    expect(result).toBeDefined();
    expect(result[0].character).toBe('車');
    expect(result[0].strokes.length).toBeGreaterThan(0);
  });
  
  test('returns variant if available', async () => {
    const kv = new KanjiVG();
    const result = await kv.getKanji('04e14');
    // Should return base + Kaisho variant
    expect(result.length).toBeGreaterThanOrEqual(1);
    expect(result.some(r => r.isVariant)).toBe(true);
  });
  
  test('handles unicode input', async () => {
    const kv = new KanjiVG();
    const result = await kv.getKanji('08eca');
    expect(result[0].unicode).toBe('08eca');
  });
});
```

#### 2. KanjiVG.searchRadical() Tests
```typescript
describe('KanjiVG.searchRadical()', () => {
  test('returns kanji containing radical', async () => {
    const kv = new KanjiVG();
    const result = await kv.searchRadical('女');
    expect(result.length).toBeGreaterThan(0);
    expect(result.some(r => r.radicalInfo?.radical === '女')).toBe(true);
  });
  
  test('includes 姉 when searching for 女 radical', async () => {
    const kv = new KanjiVG();
    const result = await kv.searchRadical('女');
    const has姉 = result.some(r => r.character === '姉');
    expect(has姉).toBe(true);
  });
});
```

#### 3. KanjiVG.getRandom() Tests
```typescript
describe('KanjiVG.getRandom()', () => {
  test('returns a valid kanji', async () => {
    const kv = new KanjiVG();
    const result = await kv.getRandom();
    expect(result.character).toBeDefined();
    expect(result.strokes.length).toBeGreaterThan(0);
  });
  
  test('returns different results on multiple calls', async () => {
    const kv = new KanjiVG();
    const results = await Promise.all([
      kv.getRandom(),
      kv.getRandom(),
      kv.getRandom(),
    ]);
    // Should get at least one different result (high probability)
    const chars = results.map(r => r.character);
    const uniqueChars = [...new Set(chars)];
    expect(uniqueChars.length).toBeGreaterThan(1);
  });
});
```

### Component Tests

#### 4. KanjiCard Styling Tests
```typescript
describe('KanjiCard styling', () => {
  test('cycles through stroke colours array', async () => {
    const { getByTestId } = render(
      <KanjiCard
        kanji="車"
        animationOptions={{
          strokeStyling: {
            strokeColour: ['blue', 'green', 'red'],
            strokeThickness: 2,
            strokeRadius: 0,
          },
        }}
      />
    );
    
    const paths = screen.getAllByRole('path', { hidden: true });
    expect(paths[0]).toHaveAttribute('stroke', 'blue');
    expect(paths[1]).toHaveAttribute('stroke', 'green');
    expect(paths[2]).toHaveAttribute('stroke', 'red');
  });
  
  test('uses single colour when string provided', async () => {
    render(
      <KanjiCard
        kanji="車"
        animationOptions={{
          strokeStyling: {
            strokeColour: 'black',
            strokeThickness: 2,
            strokeRadius: 0,
          },
        }}
      />
    );
    
    const paths = screen.getAllByRole('path', { hidden: true });
    paths.forEach(path => {
      expect(path).toHaveAttribute('stroke', 'black');
    });
  });
  
  test('radical styling overrides stroke styling', async () => {
    render(
      <KanjiCard
        kanji="上"
        animationOptions={{
          strokeStyling: {
            strokeColour: 'black',
            strokeThickness: 2,
            strokeRadius: 0,
          },
          radicalStyling: {
            radicalColour: 'red',
            radicalThickness: 2,
            radicalRadius: 0,
          },
        }}
      />
    );
    
    // Radical strokes should be red
    // Regular strokes should be black
  });
  
  test('maintains correct stroke order', async () => {
    const kv = new KanjiVG();
    const kanjiData = await kv.getKanji('車');
    
    render(<KanjiCard kanji={kanjiData} />);
    
    // Verify strokes appear in correct order
    const paths = screen.getAllByRole('path', { hidden: true });
    kanjiData.strokes.forEach((expectedStroke, i) => {
      expect(paths[i]).toHaveAttribute('d', expectedStroke.path);
    });
  });
});
```

## Animation Behavior Details

### Stroke Number Display
When `showNumbers: true`, numbers appear progressively as strokes are drawn:
- **Stroke 1 drawn** → Number "1" appears
- **Stroke 2 drawn** → Number "2" appears (Number "1" remains visible)
- **Stroke 3 drawn** → Number "3" appears (Numbers "1" and "2" remain visible)
- And so on...
- By the end of animation, all stroke numbers are visible

All previously drawn numbers remain visible throughout the animation and after completion. Numbers only appear when their corresponding stroke is drawn.

### Radical Styling Behavior
When radical styling is provided:
- **Takes precedence** over stroke styling for strokes in radical groups
- If radical has color array, cycles through array like regular strokes
- If both stroke and radical styling provided → radicals use radical styling
- If only stroke styling provided → radicals use stroke styling
- If only radical styling provided → radicals use radical styling, regular strokes use default

### Color Cycling
When color arrays are provided for stroke or radical styling:
- Array is cycled through stroke-by-stroke
- Pattern: `strokeColour: ['blue', 'green', 'red']`
  - Stroke 1: blue
  - Stroke 2: green
  - Stroke 3: red
  - Stroke 4: blue (cycles back)
  - And so on...
- Same behavior for radical styling
- Single color strings apply that color to all strokes

## Additional Considerations

### A. Performance Optimizations

1. **Lazy Loading**: Load SVG files only when requested
2. **Caching**: Cache parsed results in memory
3. **Index File**: Pre-load kvg-index.json for fast lookups
4. **Animation Frame**: Use requestAnimationFrame for smooth animations
5. **Memoization**: Memoize expensive computations in React component

### B. Error Handling

```typescript
class KanjiVGError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'KanjiVGError';
  }
}

// Error codes:
// 'KANJI_NOT_FOUND'
// 'INVALID_UNICODE'
// 'SVG_PARSE_ERROR'
// 'FILE_LOAD_ERROR'
```

### C. TypeScript Strict Mode

- Enable strict mode in tsconfig.json
- Comprehensive type coverage
- No `any` types except where necessary

### D. Package Distribution

**package.json structure:**
```json
{
  "name": "kvg-js",
  "version": "0.1.0",
  "description": "TypeScript/React library for searching and animating kanji",
  "main": "dist/index.js",
  "module": "dist/index.esm.js",
  "types": "dist/index.d.ts",
  "files": [
    "dist",
    "kanji",
    "kvg-index.json"
  ],
  "exports": {
    ".": {
      "import": "./dist/index.esm.js",
      "require": "./dist/index.js",
      "types": "./dist/index.d.ts"
    },
    "./react": {
      "import": "./dist/react.esm.js",
      "require": "./dist/react.js",
      "types": "./dist/react.d.ts"
    }
  },
  "sideEffects": [
    "**/*.svg"
  ]
}
```

### E. Documentation

1. **API Documentation**: Generate with TypeDoc
2. **README.md**: Usage examples, installation instructions
3. **Storybook**: Interactive component examples
4. **Code Comments**: Inline documentation for complex logic

### F. Git/Project Management

- `.gitignore`: Ignore node_modules, dist, build artifacts
- `.cursorignore`: Already configured (ignore kanjivg_js/ during initial build)
- `.npmignore`: Exclude source files, tests, configs from package
- GitHub Actions: Automated testing on push

## Implementation Order

### Phase 2.1: Setup and Infrastructure
1. Create `kanjivg_js/` directory structure
2. Set up TypeScript configuration
3. Set up build tooling (Webpack/Vite)
4. Configure testing (Jest + React Testing Library)
5. Copy kanji files and kvg-index.json

### Phase 2.2: Core Library
1. Implement SVG parser
2. Implement KanjiVG class with getKanji()
3. Add data transformation logic
4. Implement caching

### Phase 2.3: Advanced Features
1. Implement searchRadical() (requires full scan or indexed approach)
2. Implement getRandom()
3. Handle variant detection
4. Radical extraction logic

### Phase 2.4: React Component
1. Basic KanjiCard component (no animation)
2. Animation system
3. Styling system (colour cycling, radical detection)
4. Info panel
5. Trace rendering

### Phase 2.5: Testing
1. Unit tests for core functionality
2. Component tests for styling
3. Stroke order verification tests
4. Integration tests

### Phase 2.6: Polish and Documentation
1. Error handling refinement
2. Performance optimization
3. Documentation
4. Prepare for npm publishing

## Success Criteria for Phase 2

- [ ] Complete API design document
- [ ] All interfaces and types defined
- [ ] Bundling strategy confirmed
- [ ] Test plan complete
- [ ] Implementation order approved
- [ ] POCs created for critical components (if needed)
- [ ] Ready to proceed to Phase 3 (Implementation)

## Decisions Made

### 1. Variant Selection

**Decision: Base file is the first file in the array (no variant suffix)**

Analysis of `kvg-index.json` shows:
- For character "且", files are: `["04e14-Kaisho.svg", "04e14.svg"]`
- The **base file is the one WITHOUT the dash suffix** (`04e14.svg`)
- Variants have suffixes like `-Kaisho`, `-VtLst`, `-HzFst`, `-Hyougai`
- In the array, sometimes variants appear first, sometimes base file appears first

**Implementation Strategy:**
- Sort files by name, base file (no dash) comes before variants (with dash)
- First file in sorted array = base/primary
- Other files = variants
- Set `isVariant: false` for base, `isVariant: true` for variants

### 2. searchRadical() Performance

**Decision: Build a radical index file during build process**

Considerations:
- Full scan would be too slow (11k+ files)
- Need to parse radical info from SVG during search = multiple file loads
- Better to pre-compute radical → kanji mapping

**Implementation Strategy:**
- Create a script `build-radical-index.ts` that:
  1. Loads kvg-index.json
  2. For each kanji, loads and parses the base SVG
  3. Extracts radical info from `kvg:radical` and `kvg:element` attributes on groups
  4. Builds map: `{ radical: string, kanji: string[] }`
  5. Outputs `radical-index.json`
- Radical index gets bundled with package
- `searchRadical()` uses index for instant lookups

### 3. Animation Library

**Decision: Use React state + setTimeout with CSS transitions**

Why this approach:
- ✅ Easiest for end users (standard React patterns)
- ✅ Good performance with hardware-accelerated CSS transitions
- ✅ Simple to implement and debug
- ✅ No additional dependencies
- ✅ Works in all browsers and React Native (SVG animations work there too)

**Implementation:**
- Use React `useState` for `currentStroke` counter (0 to strokeCount)
- Use `setTimeout` to increment counter based on `strokeDelay`
- Apply CSS transitions for smooth stroke drawing
- No `requestAnimationFrame` needed (overkill for this use case)
- CSS handles the actual animation rendering

### 4. Cache Eviction

**Decision: Defer to later phase**

Simple in-memory cache for now. Can add LRU cache later if memory becomes an issue.

### 5. React Native

**Decision: Defer to later phase**

Focus on web implementation first. SVG rendering works in React Native with `react-native-svg`.

### 6. Bundling POC

**Decision: Create minimal bundling proof-of-concept**

**POC Results: ✅ SUCCESSFUL**

Created and tested a minimal bundling POC in `POC/` directory that verifies:

**What was tested:**
1. **Library Import**: `kvg-js` library can be imported as a dependency
2. **TypeScript Compilation**: Both libraries compile correctly to CommonJS
3. **SVG File Bundling**: SVG files are copied to `dist/kanji/` during build
4. **File Access**: Actual SVG files can be read from the bundled location
5. **Data Structure**: Mock kanji data loading works as expected

**Test Results:**
- ✅ **4 SVG files** successfully bundled (04e00.svg, 04e0a.svg, 06c34.svg, 08eca.svg)
- ✅ **File sizes**: 1.8KB - 3KB per file (reasonable for bundling)
- ✅ **SVG content**: Contains all expected elements (stroke paths, stroke numbers, kanji elements)
- ✅ **Import/Export**: TypeScript interfaces and functions work correctly
- ✅ **Package structure**: Works with `file:../kanjivg_js` dependency reference

**POC Structure:**
```
POC/
├── src/index.ts          # Test script that imports kvg-js
├── package.json          # References kvg-js as local dependency
├── tsconfig.json         # TypeScript configuration
└── dist/                 # Compiled output
```

**Key Findings:**
- SVG files are accessible at runtime via file system
- TypeScript compilation works with CommonJS modules
- Package structure supports proper imports
- Build process correctly copies SVG files to dist/

**Confirmation:** The bundling strategy will work for the full implementation. Ready to proceed to Phase 3 with confidence.

## Ready to Proceed

All major decisions made and POC successfully completed. 

**Phase 2 Status: ✅ COMPLETE**
- [x] Complete API design document
- [x] All interfaces and types defined  
- [x] Bundling strategy confirmed via POC
- [x] Test plan complete
- [x] Implementation order approved
- [x] POCs created and tested successfully
- [x] Ready to proceed to Phase 3 (Implementation)

**Next step: Begin Phase 3.1 - Setup project structure with proper build tools and implement the real SVG parser and KanjiVG class.**

