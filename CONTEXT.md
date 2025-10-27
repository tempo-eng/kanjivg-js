# KanjiVG JavaScript Library - Context & Rules

## Project Overview
This is a TypeScript/JavaScript library that provides kanji lookup with SVG stroke order, extracts stroke order/radicals/component data, implements SVG rendering and animation, and adds integration helpers for React/Next.js.

## Project Purpose & Scope

### Target Use Case
- **Primary Purpose**: Adding animated kanji components into web applications
- **Supported Platforms**: React, Next.js, TypeScript, and JavaScript projects only
- **Not Supported**: Other application types (mobile apps, desktop apps, etc.)

### What This Project Provides
1. **KanjiCard Component**: A React component for creating animated kanji displays
2. **Search & Retrieval Functions**: 
   - Search kanji by character (e.g., '金')
   - Search kanji by character code (e.g., '04e26')
3. **Rich Data Information**:
   - Stroke counts and stroke types
   - Character variants
   - Radical information
4. **Backend Features**:
   - Caching system (default: 50 results)
   - Configurable cache size (user can set higher or lower)

### Core Requirements & Rules

### What We Care About (Priority Requirements)
1. **Data Bundling**: Data must be bundled into the package so users don't have to load their own data
2. **Framework Compatibility**: Package must work with typical React, Next.js, TypeScript, and JavaScript projects
3. **Node.js Compatibility**: Package must operate with Node.js (without DOM) but is expected to run in React-type apps
4. **Lightweight Package**: Package must be as light as possible
5. **Memory Efficiency**: Package must not cause memory issues by unnecessarily loading all kanji characters into memory

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
- **LRU Cache**: Least Recently Used cache with configurable max size (default: 50 kanji)
- **Memory Usage**: ~270KB max cache (vs 79MB for full dataset)
- **On-demand Loading**: Each kanji loaded only when requested
- **Configurable**: Users can set cache size higher or lower based on their needs

### Build System
- **Package Manager**: This project uses **yarn** - always use `yarn` commands instead of `npm`
  - Use `yarn test` instead of `npm test`
  - Use `yarn add` instead of `npm install`
  - Use `yarn build` instead of `npm run build`
- **Rollup**: Bundles TypeScript to JavaScript
- **Single Output**: One focused package for React/web applications with all data included

### AI Assistant Rules
- **Do Only What Is Asked**: When asked to make a change to a file, make ONLY that change. Do not "also" update other files (like README, docs, etc.) unless explicitly requested
- **Ask First**: If considering additional changes beyond what was requested, ask the user if those changes are appropriate before making them
- **Scope Limitation**: Focus on the specific task requested without adding "helpful" extras that weren't asked for

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
- Removed KanjiAnimationControls component and animation control methods from React components
- Simplified KanjiCard to only use animationOptions for configuration
- Added showNumbers and flashNumbers options for stroke number display control
- Added showTrace option for displaying light grey kanji outline during animation

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

### Main Package (Recommended)
```typescript
import { KanjiCard, createKanjiVG } from 'kanjivg-js';
const kanjivg = await createKanjiVG(50); // Max cache size (default: 50)
const kanji = await kanjivg.lookup('金');
```

## Notes for Future Development
- Always maintain the bundled version as the primary distribution method
- Ensure all data is included in the bundle - no external file dependencies
- Keep memory efficiency as a core requirement
- Maintain backward compatibility with existing APIs
- Test thoroughly with Next.js applications to avoid memory issues

