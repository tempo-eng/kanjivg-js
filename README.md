# kanjivg-js

TypeScript/React library for searching and animating kanji characters using the KanjiVG dataset. This library was forked from the python library [kanjiVG](https://github.com/KanjiVG/kanjivg) and built to support similar functionality in a webapp environment. 

This library was created using largely a spec-driven-development approach - this is my first attempt at using this approach. The spec files produced during development of this library can be found under `/SDD` and include:

- initial requirements (project-requirements.md)
- phase 1 investigation
- phase 2 planning
- phase 3 implementation
- and final requirements review

## Installation

```bash
npm install @tempo-eng/kanjivg-js
```

## Setup for Web Applications

### Using the Vite Plugin (Recommended)

Add to `vite.config.js`:

```javascript
import { kvgJs } from '@tempo-eng/kanjivg-js/vite-plugin';

export default defineConfig({
  plugins: [
    react(),
    kvgJs(), // Automatically copies files to public/kanji/
  ],
});
```

### Using the Webpack Plugin (Next.js supported)

Add to `webpack.config.js`:

```javascript
const KvgJsPlugin = require('@tempo-eng/kanjivg-js/webpack-plugin');

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

### KanjiData Interface

The `KanjiData` interface represents a complete kanji character with all its structural and visual information:

```typescript
interface KanjiData {
  // Core identifiers
  character: string;           // The kanji character (e.g., "車")
  unicode: string;             // Unicode codepoint (e.g., "08eca")
  variant?: string;            // Variant identifier if present (e.g., "Kaisho")
  isVariant: boolean;          // True if this is a variant form
  
  // Structure
  strokes: StrokeData[];        // All strokes in order
  groups: GroupData[];         // Group hierarchy for radical identification
  radicalInfo?: RadicalInfo;   // Radical information if available
  
  // Metadata
  strokeCount: number;         // Total number of strokes
  components?: string[];       // Component decomposition
}
```

#### StrokeData
Each stroke contains the visual path and metadata:
```typescript
interface StrokeData {
  strokeNumber: number;        // 1-based stroke order
  path: string;               // SVG path data (d attribute)
  strokeType: string;         // kvg:type (e.g., "㇐", "㇑")
  numberPosition?: {          // Position for stroke number annotation
    x: number;
    y: number;
  };
  groupId?: string;          // Which group this stroke belongs to
  isRadicalStroke?: boolean;  // True if part of a radical group
}
```

#### GroupData
Groups represent the hierarchical structure of kanji components:
```typescript
interface GroupData {
  id: string;                 // Group identifier
  element?: string;           // Component kanji (e.g., "木")
  radical?: string;           // Radical type (e.g., "general")
  position?: string;          // Spatial position (e.g., "left", "right")
  childStrokes: number[];     // Array of stroke numbers in this group
  children: GroupData[];      // Sub-groups
}
```

#### RadicalInfo
Information about the kanji's radical:
```typescript
interface RadicalInfo {
  radical: string;            // The radical character
  positions: string[];        // Where the radical appears (e.g., ["left"])
  strokeRanges: number[][];   // Which strokes are part of the radical
}
```

### KanjiCard Component

### Basic Example

```typescript
import { KanjiVG } from '@tempo-eng/kanjivg-js';
import { KanjiCard } from '@tempo-eng/kanjivg-js/react';

// Create instance - initialization is automatic!
const kv = new KanjiVG();

// Get a random kanji
const kanji = await kv.getRandom();

// Render with animation
<KanjiCard 
  kanji={kanji} 
  infoPanel={{
    showInfo: true,
    location: 'bottom', // default
    style: { backgroundColor: '#f0f0f0', borderRadius: '8px' }
  }}
  animationOptions={{
    strokeSpeed: 1200, // pixels per second (uniform speed)
    strokeDelay: 500,  // delay between strokes (ms)
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
  strokeSpeed?: number;     // SVG pixels per second (uniform speed per stroke)
  strokeDelay?: number;     // Delay between strokes (ms)
  loop?: boolean;           // Loop animation
  
  // Display
  showNumbers?: boolean;    // Show stroke numbers
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

### KanjiCard Props

```typescript
interface InfoPanelConfig {
  showInfo: boolean;
  style?: React.CSSProperties;
  location?: 'left' | 'right' | 'top' | 'bottom';
}

interface KanjiCardProps {
  kanji: string | KanjiData;        // Character or KanjiData object
  animationOptions?: Partial<AnimationOptions>;
  onAnimationComplete?: () => void;
  className?: string;               // CSS class for the main container
  infoPanel?: InfoPanelConfig;      // Info panel configuration
}
```

**Info Panel Configuration:**
- `showInfo`: Whether to display the info panel
- `style`: Inline styles for the info panel (merges with default styles)
- `location`: Position of the info panel relative to the kanji (`'left' | 'right' | 'top' | 'bottom'`)

**Examples:**

Basic usage with info panel on the right:
```typescript
<KanjiCard 
  kanji={kanji} 
  infoPanel={{
    showInfo: true,
    location: 'right',
    style: { backgroundColor: '#f5f5f5', borderRadius: '12px' }
  }}
/>
```

Info panel on the left with custom styling:
```typescript
<KanjiCard 
  kanji={kanji} 
  infoPanel={{
    showInfo: true,
    location: 'left',
    style: { 
      backgroundColor: '#f0f8ff', 
      borderRadius: '8px',
      padding: '1.5rem',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      minWidth: '200px'
    }
  }}
/>
```

Info panel on top:
```typescript
<KanjiCard 
  kanji={kanji} 
  infoPanel={{
    showInfo: true,
    location: 'top',
    style: { textAlign: 'center', backgroundColor: '#f9f9f9' }
  }}
/>
```

## License

The kanjivg-js data used by this library is licensed under [Creative Commons Attribution-ShareAlike 4.0 International (CC BY-SA 4.0)](https://creativecommons.org/licenses/by-sa/4.0/deed.en).
