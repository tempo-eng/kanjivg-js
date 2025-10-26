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
npm install @kanjivg/js
or
yarn add @kanjivg/js
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
import { getKanjiVG, createKanjiVG } from '@kanjivg/js';

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

**Manual data loading (if you generate your own specific data):**

```typescript
import { KanjiVG, DataLoader } from '@kanjivg/js';

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
import { createKanjiVG, KanjiCard } from '@kanjivg/js/bundled';

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
import { KanjiVG } from '@kanjivg/js';

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
import { KanjiCard, KanjiSVG } from '@kanjivg/js';

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
import { KanjiSVG, KanjiAnimationControls, useKanjiVG } from '@kanjivg/js';

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

#### `KanjiAnimationControls`

Control buttons for animation.

```tsx
<KanjiAnimationControls
  animationState={state}
  onStart={start}
  onPause={pause}
  onResume={resume}
  onStop={stop}
/>
```

### Hooks

#### `useKanjiVG`

Custom hook for kanji animation.

```typescript
const {
  svgContent,
  animationState,
  startAnimation,
  pauseAnimation,
  resumeAnimation,
  stopAnimation
} = useKanjiVG(kanji, options);
```

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

interface AnimationState {
  currentStroke: number;
  isPlaying: boolean;
  isPaused: boolean;
  totalStrokes: number;
  progress: number;
}
```

## Styling

The library includes basic CSS classes for styling:

```css
.kanjivg-svg {
  /* SVG container styles */
}

.kanjivg-controls {
  /* Animation control styles */
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
