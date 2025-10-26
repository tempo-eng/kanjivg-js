/**
 * KanjiVG JavaScript Library
 * 
 * A TypeScript/JavaScript library for KanjiVG with stroke order animation and React integration.
 * 
 * @packageDocumentation
 */

// Core classes
export { KanjiVG } from './kanjivg';
export { SVGRenderer } from './svg-renderer';
export { DataLoader } from './data-loader';

// React components
export {
  KanjiSVG,
  KanjiAnimationControls,
  KanjiCard,
  useKanjiVG
} from './react-components';

// Types
export type {
  Kanji,
  KanjiInfo,
  KanjiData,
  Stroke,
  StrokeGroup,
  StrokeOrderOptions,
  AnimationState,
  ComponentInfo,
  LookupOptions,
  KanjiSVGProps,
  KanjiAnimationControlsProps,
  KanjiCardProps
} from './types';

// Version
export const VERSION = '1.0.0';
