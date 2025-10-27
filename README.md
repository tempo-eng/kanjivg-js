# kanjivg-js

TypeScript/React library for searching and animating kanji characters using the KanjiVG dataset.

## Installation

```bash
npm install kanjivg-js
```

## Setup for Web Applications

### Using the Vite Plugin (Recommended)

Add to `vite.config.js`:

```javascript
import { kvgJs } from 'kanjivg-js/vite-plugin';

export default defineConfig({
  plugins: [
    react(),
    kvgJs(), // Automatically copies files to public/kanji/
  ],
});
```

### Using the Webpack Plugin

Add to `webpack.config.js`:

```javascript
const KvgJsPlugin = require('kanjivg-js/webpack-plugin');

module.exports = {
  plugins: [
    new KvgJsPlugin(),
  ],
};
```

## Usage

## API Reference

### KanjiVG Methods

#### `getKanji(kanji: string): Promise<KanjiData[]>`

Get kanji data by character or unicode.

```typescript
const data = await kv.getKanji('車');
// Returns array with base kanji and any variants
```

#### `searchRadical(radical: string): Promise<KanjiData[]>`

Search for kanji containing a specific radical.

```typescript
const results = await kv.searchRadical('女');
// Returns all kanji with the "女" radical
```

#### `getRandom(): Promise<KanjiData>`

Get a random kanji.

```typescript
const randomKanji = await kv.getRandom();
```

### KanjiCard Component

### Basic Example

```typescript
import { KanjiVG } from 'kanjivg-js';
import { KanjiCard } from 'kanjivg-js/react';

// Create instance - initialization is automatic!
const kv = new KanjiVG();

// Get a random kanji
const kanji = await kv.getRandom();

// Render with animation
<KanjiCard 
  kanji={kanji} 
  showInfo={true}
  animationOptions={{
    strokeDuration: 800,
    strokeDelay: 500,
    showNumbers: true,
    showTrace: true,
    strokeStyling: {
      strokeColour: '#000000',
      strokeThickness: 3,
      strokeRadius: 0,
    }
  }}
/>
```

Animation options:

```typescript
{
  // Timing
  strokeDuration?: number;  // Duration per stroke (ms)
  strokeDelay?: number;    // Delay between strokes (ms)
  loop?: boolean;          // Loop animation
  
  // Display
  showNumbers?: boolean;   // Show stroke numbers
  showTrace?: boolean;      // Show outline trace
  
  // Styling
  strokeStyling?: {
    strokeColour: string | string[];  // Single color or array for cycling
    strokeThickness: number;
    strokeRadius: number;              // 0 = square, >0 = round
  };
  
  radicalStyling?: {
    radicalColour: string | string[];
    radicalThickness: number;
    radicalRadius: number;
  };
  
  traceStyling?: {
    traceColour: string;
    traceThickness: number;
    traceRadius: number;
  };
  
  numberStyling?: {
    fontColour: string;
    fontWeight: number;
    fontSize: number;
  };
}
```

## License

MIT
