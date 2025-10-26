# KanjiVG JavaScript Library

A TypeScript/JavaScript library for KanjiVG with stroke order animation and React integration.

## Features

- 🔍 **Kanji Lookup**: Find kanji by character or Unicode code point
- 🎨 **SVG Rendering**: Render kanji as SVG with customizable styling
- ✨ **Stroke Order Animation**: Animate kanji stroke order with timing controls
- ⚛️ **React Integration**: Ready-to-use React components and hooks
- 📊 **Component Analysis**: Extract radicals, components, and stroke information
- 🎯 **TypeScript Support**: Full type definitions included

## Installation

```bash
npm install @kanjivg/js
```

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
│   ├── kanjivg-data.json  # All 6,702 kanji (28MB)
│   ├── kanjivg-index.json # Character lookup index
│   └── kanjivg-sample.json # Sample data for testing
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

Try the interactive demo with the full dataset:

```bash
# Start a local server
cd examples
python3 -m http.server 8000

# Open http://localhost:8000 in your browser
```

The demo includes:
- 🔍 Search any of 6,702 kanji
- 🎲 Random kanji generator  
- ✨ Stroke order animation
- 📊 Complete metadata display
- 🎮 Interactive controls

### Basic Usage

```typescript
import { KanjiVG, DataLoader } from '@kanjivg/js';

// Load data
const loader = new DataLoader();
const data = await loader.loadKanjiData('/path/to/index.json', '/path/to/svg/');

// Create KanjiVG instance
const kanjivg = new KanjiVG(data);

// Look up a kanji
const kanji = kanjivg.lookup('並'); // or kanjivg.lookup('04e26')
console.log(kanji.character); // 並
console.log(kanji.strokeCount); // 8
console.log(kanji.strokeTypes); // ['㇔', '㇒', '㇐', ...]
```

### React Usage

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

### Core Classes

#### `KanjiVG`

Main class for kanji lookup and data extraction.

```typescript
class KanjiVG {
  constructor(data: KanjiData)
  lookup(input: string | number, options?: LookupOptions): KanjiInfo | null
  search(character: string, options?: LookupOptions): KanjiInfo[]
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

## Data Setup

The library requires KanjiVG data files. You can either:

1. **Use the provided sample data** (included in the package)
2. **Convert your own data** using the provided conversion script
3. **Load data from a server** using the DataLoader

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

This will create data files in the `../data/` directory with all 6,702 kanji.

**Requirements:**
- Python 3.6+ (uses only standard library)
- ~75MB disk space for SVG files
- ~2GB RAM for full conversion

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

## Browser Support

- Modern browsers with ES2020 support
- React 16.8+ (for React components)
- TypeScript 4.0+ (for TypeScript support)

## License

This library is released under the Creative Commons Attribution-Share Alike 3.0 License, same as KanjiVG.

## Contributing

Contributions are welcome! Please see the main KanjiVG repository for contribution guidelines.

## Links

- [KanjiVG Website](https://kanjivg.tagaini.net)
- [GitHub Repository](https://github.com/KanjiVG/kanjivg)
- [Documentation](https://kanjivg.tagaini.net/documentation)
