# KanjiVG JavaScript Library

A TypeScript/JavaScript library for looking up Japanese Kanji with stroke order animations and React integration.

This package is forked from [kanjiVG](https://github.com/KanjiVG/kanjivg), a python project for generating kanji vector graphics. KanjiVG-js makes KanjiVG available for integration into javascript/typescript based webapps. A live demonstration can be found at [kanji companion](https://kanji-companion.com/flashcard/kanji).

## Features

- **Kanji Lookup**: Find kanji by character or Unicode code
- **Variant Support**: Access all writing style variants (Kaisho, VtLst, etc.)
- **SVG Rendering**: Render kanji as SVG with customizable styling
- **Stroke Order Animation**: Animate kanji stroke order with timing controls
- **React Integration**: Ready-to-use React components and hooks
- **Memory-Efficient Loading**: Chunked data loading to reduce memory usage

## Installation

```bash
npm install kanjivg-js
or
yarn add kanjivg-js
```

**Library Requirements:**
- Node.js 14+ or modern browser
- TypeScript (optional, for type definitions)
- React 16.8+ (optional, for React components)

**Data Generation Requirements (Optional):**
- Python 3.6+ (only if you want to regenerate data files)

## Project Structure

```
kanjivg_js/
├── src/                    # TypeScript source code
│   ├── kanjivg.ts         # Main KanjiVG class
│   ├── svg-renderer.ts    # SVG rendering and animation
│   ├── react-components.tsx # React components
│   ├── data-loader.ts     # Data loading utilities
│   ├── types.ts          # TypeScript type definitions
│   └── utils.ts          # Utility functions
├── dist/                  # Built JavaScript files
├── data/                  # Pre-generated data files
│   ├── individual/        # Individual kanji files (ultra memory-efficient)
│   │   ├── 04e00.json    # Individual kanji files (~5KB each)
│   │   ├── 04e01.json    # 11,661 total files
│   │   └── ...           # One file per kanji variant
│   ├── lookup-index.json  # Kanji code -> file path mapping
│   └── kanjivg-index.json # Character lookup index
├── examples/              # Usage examples
│   └── index.html         # Interactive demo with full dataset
└── data-generation/        # Complete data generation package
    ├── convert_data.py     # Main conversion script
    ├── kanjivg.py         # KanjiVG Python library
    ├── utils.py           # SVG file utilities
    ├── kanji/             # All 11,661 SVG files (75MB)
    ├── kvg-index.json     # Character lookup index
    └── README.md          # Data generation documentation
```

## Demo

The interactive demo is included in the `examples/` directory.

**How to use the demo:**
1. Start a local server: `npx serve .` or `npx http-server -p 8000`
2. Open `http://localhost:8000/examples/` in your browser
3. Start searching and animating kanji


### Basic Usage


```typescript
import { getKanjiVG, createKanjiVG } from 'kanjivg-js';

// Async initialization (works in both browser and Node.js)
const kanjivg = await getKanjiVG();

// Sync initialization (requires data parameter)
const kanjivg = createKanjiVG(customData);

// Use the library
const results = kanjivg.search('且'); // Returns all variants
console.log(`Found ${results.length} variants of 且`);

results.forEach(result => {
  console.log(`Variant: ${result.variant || 'base'}`);
  console.log(`Strokes: ${result.strokeCount}`);
});
```

## API Reference

### Core Functions

#### **Lookup & Search**

**`kanjivg.lookup(input, options?)`**
- **Purpose**: Look up a single kanji by character, Unicode code, or variant key
- **Parameters**: 
  - `input`: `string | number` - Character (e.g., '金'), hex code (e.g., '04e26'), or variant key
  - `options`: `LookupOptions` - Optional lookup configuration
- **Returns**: `Promise<KanjiInfo | null>` - Single kanji information or null if not found
- **Example**: `const kanji = await kanjivg.lookup('金');`

**`kanjivg.search(character, options?)`**
- **Purpose**: Search for all variants of a character
- **Parameters**:
  - `character`: `string` - Single kanji character
  - `options`: `LookupOptions` - Optional search configuration (e.g., `{ limit: 5 }`)
- **Returns**: `Promise<KanjiInfo[]>` - Array of all variants found
- **Example**: `const variants = await kanjivg.search('金');`

**`kanjivg.getRandom()`**
- **Purpose**: Get a random kanji from the database
- **Returns**: `Promise<KanjiInfo | null>` - Random kanji information or null if database is empty
- **Example**: `const randomKanji = await kanjivg.getRandom();`

#### **Data & Statistics**

**`kanjivg.getAllCharacters()`**
- **Purpose**: Get all available kanji characters in the database
- **Returns**: `string[]` - Array of all kanji characters
- **Example**: `const allChars = kanjivg.getAllCharacters();`

**`kanjivg.getTotalCount()`**
- **Purpose**: Get total number of kanji in the database
- **Returns**: `number` - Total count of kanji
- **Example**: `const total = kanjivg.getTotalCount(); // Returns 11661`

#### **Cache Management**

**`kanjivg.getCacheSize()`**
- **Purpose**: Get current number of cached kanji
- **Returns**: `number` - Current cache size
- **Example**: `const size = kanjivg.getCacheSize();`

**`kanjivg.getCacheMemoryUsage()`**
- **Purpose**: Get estimated memory usage of cached kanji
- **Returns**: `number` - Memory usage in KB (~5.4KB per kanji)
- **Example**: `const memory = kanjivg.getCacheMemoryUsage();`

**`kanjivg.getCacheStats()`**
- **Purpose**: Get comprehensive cache statistics
- **Returns**: `{ currentSize: number, maxSize: number, memoryUsage: number }`
- **Example**: `const stats = kanjivg.getCacheStats();`

**`kanjivg.clearCache()`**
- **Purpose**: Clear all cached kanji from memory
- **Returns**: `void`
- **Example**: `kanjivg.clearCache();`

**`kanjivg.getMaxCacheSize()`**
- **Purpose**: Get maximum cache size limit
- **Returns**: `number` - Maximum cache size
- **Example**: `const maxSize = kanjivg.getMaxCacheSize();`

**`kanjivg.setMaxCacheSize(size)`**
- **Purpose**: Set maximum cache size limit
- **Parameters**: `size: number` - New maximum cache size
- **Returns**: `void`
- **Example**: `kanjivg.setMaxCacheSize(100);`

### Factory Functions

**`createKanjiVG(maxCacheSize?)`**
- **Purpose**: Create KanjiVG instance with bundled data
- **Parameters**: `maxCacheSize?: number` - Optional cache size (default: 50)
- **Returns**: `Promise<KanjiVG>` - New KanjiVG instance
- **Example**: `const kanjivg = await createKanjiVG(100);`

**`getKanjiVG(maxCacheSize?)`**
- **Purpose**: Legacy compatibility function (same as createKanjiVG)
- **Parameters**: `maxCacheSize?: number` - Optional cache size (default: 50)
- **Returns**: `Promise<KanjiVG>` - New KanjiVG instance
- **Example**: `const kanjivg = await getKanjiVG();`

### Utility Functions

#### **Character & Code Conversion**

**`canonicalId(input)`**
- **Purpose**: Convert character/hex to canonical ID format
- **Parameters**: `input: string | number` - Character or hex code
- **Returns**: `string` - Canonical ID (5-digit hex)
- **Example**: `const id = canonicalId('金'); // Returns '091d1'`

**`isKanji(char)`**
- **Purpose**: Check if character is a kanji
- **Parameters**: `char: string` - Single character
- **Returns**: `boolean` - True if character is kanji
- **Example**: `const isKanjiChar = isKanji('金'); // Returns true`

**`getUnicodeCodePoint(char)`**
- **Purpose**: Get Unicode code point from character
- **Parameters**: `char: string` - Single character
- **Returns**: `string` - Unicode code point (5-digit hex)
- **Example**: `const code = getUnicodeCodePoint('金'); // Returns '091d1'`

**`getCharacterFromCodePoint(code)`**
- **Purpose**: Get character from Unicode code point
- **Parameters**: `code: string` - Unicode code point
- **Returns**: `string` - Character
- **Example**: `const char = getCharacterFromCodePoint('091d1'); // Returns '金'`

**`formatUnicodeCodePoint(code)`**
- **Purpose**: Format code point for display
- **Parameters**: `code: string` - Unicode code point
- **Returns**: `string` - Formatted code point (U+XXXXX)
- **Example**: `const formatted = formatUnicodeCodePoint('091d1'); // Returns 'U+091D1'`

#### **Kanji Information Extractors**

**`getStrokeCount(kanji)`**
- **Purpose**: Get stroke count from kanji info
- **Parameters**: `kanji: KanjiInfo` - Kanji information object
- **Returns**: `number` - Number of strokes
- **Example**: `const strokes = getStrokeCount(kanji);`

**`getStrokeTypes(kanji)`**
- **Purpose**: Get all stroke types from kanji info
- **Parameters**: `kanji: KanjiInfo` - Kanji information object
- **Returns**: `string[]` - Array of stroke types
- **Example**: `const types = getStrokeTypes(kanji);`

**`getRadicals(kanji)`**
- **Purpose**: Get all radicals from kanji info
- **Parameters**: `kanji: KanjiInfo` - Kanji information object
- **Returns**: `ComponentInfo[]` - Array of radical components
- **Example**: `const radicals = getRadicals(kanji);`

**`getComponents(kanji)`**
- **Purpose**: Get all components from kanji info
- **Parameters**: `kanji: KanjiInfo` - Kanji information object
- **Returns**: `ComponentInfo[]` - Array of all components
- **Example**: `const components = getComponents(kanji);`

**`isRadical(component)`**
- **Purpose**: Check if component is a radical
- **Parameters**: `component: ComponentInfo` - Component information
- **Returns**: `boolean` - True if component is a radical
- **Example**: `const isRadicalComp = isRadical(component);`

**`getComponentsByPosition(kanji, position)`**
- **Purpose**: Get components by position
- **Parameters**: 
  - `kanji: KanjiInfo` - Kanji information object
  - `position: string` - Position (e.g., 'left', 'right', 'top', 'bottom')
- **Returns**: `ComponentInfo[]` - Array of components at specified position
- **Example**: `const leftComponents = getComponentsByPosition(kanji, 'left');`

**`getComponentsByElement(kanji, element)`**
- **Purpose**: Get components by element
- **Parameters**:
  - `kanji: KanjiInfo` - Kanji information object
  - `element: string` - Element name (e.g., '女', '車')
- **Returns**: `ComponentInfo[]` - Array of components with specified element
- **Example**: `const womanComponents = getComponentsByElement(kanji, '女');`

#### **Search & Filter Functions**

**`searchByStrokeCount(kanjiList, strokeCount)`**
- **Purpose**: Filter kanji by stroke count
- **Parameters**:
  - `kanjiList: KanjiInfo[]` - Array of kanji to filter
  - `strokeCount: number` - Target stroke count
- **Returns**: `KanjiInfo[]` - Filtered array
- **Example**: `const fiveStrokeKanji = searchByStrokeCount(allKanji, 5);`

**`searchByRadical(kanjiList, radical)`**
- **Purpose**: Filter kanji by radical
- **Parameters**:
  - `kanjiList: KanjiInfo[]` - Array of kanji to filter
  - `radical: string` - Radical character (e.g., '女', '車')
- **Returns**: `KanjiInfo[]` - Filtered array
- **Example**: `const womanRadicalKanji = searchByRadical(allKanji, '女');`

**`searchByComponent(kanjiList, component)`**
- **Purpose**: Filter kanji by component
- **Parameters**:
  - `kanjiList: KanjiInfo[]` - Array of kanji to filter
  - `component: string` - Component character
- **Returns**: `KanjiInfo[]` - Filtered array
- **Example**: `const waterComponentKanji = searchByComponent(allKanji, '水');`

**`getRandomKanji(kanjiList)`**
- **Purpose**: Get random kanji from list
- **Parameters**: `kanjiList: KanjiInfo[]` - Array of kanji
- **Returns**: `KanjiInfo | null` - Random kanji or null if list is empty
- **Example**: `const randomKanji = getRandomKanji(kanjiList);`

#### **Sorting Functions**

**`sortByStrokeCount(kanjiList, ascending?)`**
- **Purpose**: Sort kanji by stroke count
- **Parameters**:
  - `kanjiList: KanjiInfo[]` - Array of kanji to sort
  - `ascending?: boolean` - Sort order (default: true)
- **Returns**: `KanjiInfo[]` - Sorted array
- **Example**: `const sortedByStrokes = sortByStrokeCount(kanjiList, true);`

**`sortByCharacter(kanjiList, ascending?)`**
- **Purpose**: Sort kanji by character
- **Parameters**:
  - `kanjiList: KanjiInfo[]` - Array of kanji to sort
  - `ascending?: boolean` - Sort order (default: true)
- **Returns**: `KanjiInfo[]` - Sorted array
- **Example**: `const sortedByChar = sortByCharacter(kanjiList, true);`

#### **SVG Generation**

**`generateSimpleSVG(kanji, options?)`**
- **Purpose**: Generate simple SVG without animation
- **Parameters**:
  - `kanji: KanjiInfo` - Kanji information object
  - `options?: object` - SVG options (width, height, viewBox, className)
- **Returns**: `string` - SVG markup
- **Example**: `const svg = generateSimpleSVG(kanji, { width: 200, height: 200 });`

**`createDataURL(kanji, options?)`**
- **Purpose**: Create data URL for SVG
- **Parameters**:
  - `kanji: KanjiInfo` - Kanji information object
  - `options?: object` - SVG options
- **Returns**: `string` - Data URL
- **Example**: `const dataUrl = createDataURL(kanji);`

#### **Performance Functions**

**`debounce(func, wait)`**
- **Purpose**: Debounce function calls for performance
- **Parameters**:
  - `func: Function` - Function to debounce
  - `wait: number` - Wait time in milliseconds
- **Returns**: `Function` - Debounced function
- **Example**: `const debouncedSearch = debounce(searchFunction, 300);`

**`throttle(func, limit)`**
- **Purpose**: Throttle function calls for performance
- **Parameters**:
  - `func: Function` - Function to throttle
  - `limit: number` - Time limit in milliseconds
- **Returns**: `Function` - Throttled function
- **Example**: `const throttledUpdate = throttle(updateFunction, 100);`

### React Components

#### **`<KanjiCard>`**
Complete kanji display with animation and information.

```tsx
<KanjiCard
  kanji={kanji}
  animationOptions={{
    strokeDuration: 800,
    strokeDelay: 200,
    showNumbers: true,
    flashNumbers: false,
    showTrace: true,
    loop: false,
    strokeStyling: {
      strokeColour: '#000000',
      strokeThickness: 3,
      strokeRadius: 1
    },
    radicalStyling: {
      radicalColour: '#ff0000'
    },
    traceStyling: {
      traceColour: '#cccccc',
      traceThickness: 2,
      traceRadius: 0
    }
  }}
  showInfo={true}
/>
```

#### **`<KanjiSVG>`**
Simple SVG rendering component.

```tsx
<KanjiSVG
  kanji={kanji}
  animationOptions={options}
  autoPlay={false}
  onAnimationStateChange={(state) => console.log(state)}
/>
```

#### **`useKanjiVG()`**
React hook for KanjiVG instance management.

```tsx
const {
  svgContent,
  startAnimation,
  pauseAnimation,
  resumeAnimation,
  stopAnimation
} = useKanjiVG(kanji, animationOptions);
```

**Manual data loading (if you generate your own specific data):**

```typescript
import { KanjiVG, DataLoader } from 'kanjivg-js';

// Only needed if you want to load custom data files
const loader = new DataLoader();
const data = await loader.loadKanjiDataFromJSON('/path/to/kanjivg-data.json', '/path/to/kanjivg-index.json');

// Create KanjiVG instance
const kanjivg = new KanjiVG(data);

// Look up a kanji
const kanji = kanjivg.lookup('並'); // or kanjivg.lookup('04e26')
console.log(kanji.character); // 並
console.log(kanji.strokeCount); // 8
console.log(kanji.strokeTypes); // ['㇔', '㇒', '㇐', ...]
```

## Bundled Library (Recommended)

For most applications, use the bundled version that includes all data:

```typescript
import { createKanjiVG, KanjiCard } from 'kanjivg-js';

// Simple initialization - no external files needed!
const kanjivg = await createKanjiVG(100); // Max cache size (optional)

// Use the library (methods are async)
const kanji = await kanjivg.lookup('金');
const results = await kanjivg.search('語');

console.log(kanji?.character); // 金
console.log(results.length);   // Number of variants found
```

**Benefits of Bundled Library:**
- ✅ **Zero Configuration**: No external files or paths needed
- ✅ **Memory Efficient**: Only loads ~5KB per kanji with LRU cache
- ✅ **Perfect for Next.js**: No memory warnings or server restarts
- ✅ **Instant Startup**: Loads only the lookup index (~500KB)
- ✅ **On-demand Loading**: Each kanji loaded only when requested
- ✅ **Cache Management**: Automatic LRU eviction with configurable size

**Cache Management:**
```typescript
// Get cache statistics
const stats = kanjivg.getCacheStats();
console.log(`Cache: ${stats.currentSize}/${stats.maxSize} kanji (${stats.memoryUsage}KB)`);

// Configure cache size
kanjivg.setMaxCacheSize(50); // Reduce to 50 kanji (~270KB max)

// Clear cache if needed
kanjivg.clearCache();
```

## Individual File Loading (Advanced)

For applications that need custom data loading or want to host their own data:

```typescript
import { KanjiVG } from 'kanjivg-js';

// Async initialization with individual file loading
const kanjivg = await KanjiVG.createIndividual(
  './data/lookup-index.json',  // Lookup index file
  './data',                    // Data directory (optional)
  100                          // Max cache size (optional, default: 100)
);
```

**File Organization:**
- `individual/`: 11,661 individual kanji files (~5KB each)
- `lookup-index.json`: Maps kanji codes to file paths (~500KB)
- `kanjivg-index.json`: Character to kanji code mapping (~290KB)

### React Components

```tsx
import React from 'react';
import { KanjiCard, KanjiSVG } from 'kanjivg-js';

function MyComponent() {
  const kanji = kanjivg.lookup('並');
  
  return (
    <div>
      {/* Simple SVG display */}
      <KanjiSVG kanji={kanji} />
      
      {/* Full card with controls */}
      <KanjiCard 
        kanji={kanji}
        showControls={true}
        showInfo={true}
        animationOptions={{
          strokeDuration: 800,
          strokeDelay: 200,
          showNumbers: true
        }}
      />
    </div>
  );
}
```

### Animation Controls

```tsx
import React, { useState } from 'react';
import { KanjiSVG, KanjiAnimationControls, useKanjiVG } from 'kanjivg-js';

function AnimatedKanji() {
  const [animationState, setAnimationState] = useState(null);
  const kanji = kanjivg.lookup('並');
  
  const {
    svgContent,
    startAnimation,
    pauseAnimation,
    resumeAnimation,
    stopAnimation
  } = useKanjiVG(kanji, {
    strokeDuration: 1000,
    strokeDelay: 300
  });
  
  return (
    <div>
      <div dangerouslySetInnerHTML={{ __html: svgContent }} />
      <KanjiAnimationControls
        animationState={animationState}
        onStart={startAnimation}
        onPause={pauseAnimation}
        onResume={resumeAnimation}
        onStop={stopAnimation}
      />
    </div>
  );
}
```
### React Components

#### `KanjiSVG`

Renders a kanji with optional animation.

```tsx
<KanjiSVG
  kanji={kanji}
  options={animationOptions}
  autoPlay={false}
  onAnimationStateChange={(state) => console.log(state)}
/>
```

#### `KanjiCard`

Complete kanji display with controls and information.

```tsx
<KanjiCard
  kanji={kanji}
  animationOptions={options}
  showControls={true}
  showInfo={true}
/>
```

### Hooks

#### `useKanjiVG`


### Types

```typescript
interface KanjiInfo {
  character: string;
  code: string;
  strokeCount: number;
  strokeTypes: string[];
  components: ComponentInfo[];
  radicals: ComponentInfo[];
  svg: string;
}

interface StrokeOrderOptions {
  strokeDuration?: number;
  strokeDelay?: number;
  showNumbers?: boolean;
  loop?: boolean;
  className?: string;
  width?: number;
  height?: number;
  viewBox?: string;
}

```

## Styling

The library includes basic CSS classes for styling:

```css
.kanjivg-svg {
  /* SVG container styles */
}


.kanjivg-card {
  /* Card container styles */
}

.kanjivg-progress {
  /* Progress bar styles */
}
```

### Custom Data

For users who want to create custom data files:

### Converting Data

The package includes a complete data generation system in the `data-generation/` directory:

```bash
# Navigate to data generation directory
cd data-generation

# Run setup verification
./setup.sh

# Generate all data files
python3 convert_data.py
```

This will create data files in the `../data/` directory with all kanji. Modify `convert_data.py` if you want to create a custom dataset.




## License

This library is released under the [Creative Commons Attribution-Share Alike 4.0 License](https://creativecommons.org/licenses/by-sa/4.0/deed.en).

## Contributing

Contributions are welcome! Please put up a PR for review.

## Links

- [Kanji companion Website](https://kanji-companion.com)
