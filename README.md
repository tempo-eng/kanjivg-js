# KanjiVG JavaScript Library

A TypeScript/JavaScript library for looking up Japanese Kanji with stroke order animations and React integration.

This package is forked from [kanjiVG](https://github.com/KanjiVG/kanjivg), a python project for generating kanji vector graphics. KanjiVG-js makes KanjiVG available for integration into javascript/typescript based webapps. A live demonstration can be found at [kanji-companion](https://kanji-companion.com/flashcard/kanji).

## Features

- **Kanji Lookup**: Find kanji by character or Unicode code
- **Variant Support**: Access all writing style variants (Kaisho, VtLst, etc.)
- **SVG Rendering**: Render kanji as SVG with customizable styling
- **Stroke Order Animation**: Animate kanji stroke order with timing controls
- **React Integration**: Ready-to-use React components and hooks

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
│   ├── kanjivg-data.json  # All 11,661 kanji with variants (53MB)
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

The interactive demo is included in the `examples/` directory. Due to ES module CORS restrictions, it requires a local server to run.

**How to use the demo:**
1. Start a local server: `npx serve .` or `npx http-server -p 8000`
2. Open `http://localhost:8000/examples/` in your browser
3. Start searching and animating kanji immediately!

**Note:** The demo requires a local server due to ES module CORS restrictions. It uses the auto-loading functionality to access all 11,661 kanji with variants.

### Using the Full Dataset

To use the complete dataset with all 11,661 kanji (including variants) in your project:

```typescript
import { getKanjiVG } from '@kanjivg/js';

// Simple async initialization (recommended)
const kanjivg = await getKanjiVG();

// Now you have access to all 11,661 kanji with variants
const results = kanjivg.search('且'); // Returns all variants
console.log(`Found ${results.length} variants of 且`);

results.forEach(result => {
  console.log(`Variant: ${result.variant || 'base'}`);
  console.log(`Strokes: ${result.strokeCount}`);
});
```

**Quick Test:**

You can test the library immediately in your console:

```bash
# In your project directory
node -e "
import('./dist/core.esm.js').then(async (module) => {
  const kanjivg = await module.getKanjiVG();
  console.log('Total kanji:', kanjivg.getTotalCount());
  const results = kanjivg.search('且');
  console.log('且 variants:', results.length);
});
"
```

### Basic Usage

**Simple initialization (recommended):**

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

## API Reference

### Auto-Loading Functions

#### `getKanjiVG()`

Automatically loads the bundled kanji data and returns a KanjiVG instance.

```typescript
async function getKanjiVG(): Promise<KanjiVG>
```

**Example:**
```typescript
const kanjivg = await getKanjiVG();
const results = kanjivg.search('且');
```

#### `createKanjiVG()`

Creates a KanjiVG instance with provided data.

```typescript
function createKanjiVG(data: any): KanjiVG
```

**Example:**
```typescript
const kanjivg = createKanjiVG(customData); // Uses provided data
```

### Core Classes

#### `KanjiVG`

Main class for kanji lookup and data extraction.

```typescript
class KanjiVG {
  constructor(data: KanjiData)
  lookup(input: string | number, options?: LookupOptions): KanjiInfo | null
  search(character: string, options?: LookupOptions): KanjiInfo[] // Returns all variants
  getAllCharacters(): string[]
  getTotalCount(): number
}
```

#### `SVGRenderer`

Handles SVG rendering and animation.

```typescript
class SVGRenderer {
  constructor(options?: StrokeOrderOptions)
  render(kanji: KanjiInfo, options?: StrokeOrderOptions): string
  startAnimation(kanji: KanjiInfo, onProgress?: (state: AnimationState) => void): void
  pauseAnimation(): void
  resumeAnimation(kanji: KanjiInfo, onProgress?: (state: AnimationState) => void): void
  stopAnimation(): void
  getAnimationState(): AnimationState
}
```

#### `DataLoader`

Loads kanji data from various sources.

```typescript
class DataLoader {
  constructor(baseUrl?: string)
  loadKanjiData(indexUrl: string, svgBaseUrl?: string): Promise<KanjiData>
  loadKanjiFromSVG(svgUrl: string): Promise<Kanji | null>
  clearCache(): void
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

## License

This library is released under the Creative Commons Attribution-Share Alike 3.0 License, same as KanjiVG.

## Contributing

Contributions are welcome! Please see the main KanjiVG repository for contribution guidelines.

## Links

- [Kanji companion Website](https://kanji-companion.com)
