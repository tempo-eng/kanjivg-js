# KanjiVG JavaScript Library - Context & Rules

## Project Overview
This is a TypeScript/JavaScript library that provides kanji lookup with SVG stroke order, extracts stroke order/radicals/component data, implements SVG rendering and animation, and adds integration helpers for React/Next.js.

## Core Requirements & Rules

### Requirement 1: Bundled Package Must Include Compiled Files
- **Rule**: The bundled package must include ALL compiled files and data
- **Implementation**: End users must NOT be required to specify any file paths for data
- **Rationale**: Users should be able to install the library and use it immediately without external dependencies
- **Current Status**: ✅ Implemented - bundled version includes all 11,661 kanji in `bundled-kanji-data.json`

## Technical Architecture

### Data Structure
- **Individual Files**: 11,661 kanji stored as separate JSON files (~5KB each)
- **Lookup Index**: Maps kanji codes to file paths (~500KB)
- **Character Index**: Maps characters to kanji codes (~290KB)
- **Bundled Data**: Single JSON file with all kanji (~75MB)

### Memory Management
- **LRU Cache**: Least Recently Used cache with configurable max size (default: 100 kanji)
- **Memory Usage**: ~540KB max cache (vs 79MB for full dataset)
- **On-demand Loading**: Each kanji loaded only when requested

### Build System
- **Rollup**: Bundles TypeScript to JavaScript
- **Multiple Outputs**: 
  - `/bundled`: Complete library with all data included
  - `/browser`: Browser-only version (requires external data)
  - `/core`: Core functionality without React
  - `/react`: Full library with React components

## Current Implementation Status

### ✅ Completed
- Individual file loading with LRU cache
- Bundled version with all data included
- React components and hooks
- SVG rendering and animation
- TypeScript definitions
- Jest testing framework
- Memory-efficient data loading

### 🔄 In Progress
- User is planning large changes to the project

## File Structure
```
kanjivg_js/
├── src/                    # TypeScript source code
│   ├── kanjivg.ts         # Main KanjiVG class
│   ├── svg-renderer.ts    # SVG rendering and animation
│   ├── react-components.tsx # React components
│   ├── data-loader.ts     # Data loading utilities
│   ├── bundled.ts         # Bundled version with all data
│   ├── types.ts          # TypeScript type definitions
│   └── utils.ts          # Utility functions
├── dist/                  # Built JavaScript files
├── data/                  # Data files
│   ├── individual/        # Individual kanji files
│   ├── bundled-kanji-data.json # Complete bundled data
│   ├── lookup-index.json  # Kanji code -> file path mapping
│   └── kanjivg-index.json # Character lookup index
└── examples/              # Usage examples
```

## Usage Patterns

### Bundled Version (Recommended)
```typescript
import { createKanjiVG } from '@kanjivg/js/bundled';
const kanjivg = await createKanjiVG(100); // Max cache size
const kanji = await kanjivg.lookup('金');
```

### Individual File Loading (Advanced)
```typescript
import { KanjiVG } from '@kanjivg/js';
const kanjivg = await KanjiVG.createIndividual(
  './data/lookup-index.json',
  './data',
  100
);
```

## Notes for Future Development
- Always maintain the bundled version as the primary distribution method
- Ensure all data is included in the bundle - no external file dependencies
- Keep memory efficiency as a core requirement
- Maintain backward compatibility with existing APIs
- Test thoroughly with Next.js applications to avoid memory issues
