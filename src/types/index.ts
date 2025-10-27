// Core data interfaces for KanjiVG library

export interface KanjiData {
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

export interface StrokeData {
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

export interface GroupData {
  id: string;                 // Group identifier
  element?: string;           // Component kanji (e.g., "木")
  radical?: string;           // Radical type (e.g., "general")
  position?: string;          // Spatial position (e.g., "left", "right")
  childStrokes: number[];     // Array of stroke numbers in this group
  children: GroupData[];      // Sub-groups
}

export interface RadicalInfo {
  radical: string;            // The radical character
  positions: string[];        // Where the radical appears (e.g., ["left"])
  strokeRanges: number[][];   // Which strokes are part of the radical
}

// Animation and styling interfaces
export interface AnimationOptions {
  strokeDuration: number;      // Duration of each stroke animation (ms)
  strokeDelay: number;        // Delay between strokes (ms)
  showNumbers: boolean;        // Show stroke order numbers
  loop: boolean;              // Loop the animation
  showTrace: boolean;         // Show outline trace
  strokeStyling: StrokeStyling;
  radicalStyling?: RadicalStyling;
  traceStyling?: TraceStyling;
  numberStyling?: NumberStyling;
}

export interface StrokeStyling {
  strokeColour: string | string[];  // Single colour or array for cycling
  strokeThickness: number;
  strokeRadius: number;
}

export interface RadicalStyling {
  radicalColour: string | string[];  // Overrides stroke styling for radicals
  radicalThickness: number;
  radicalRadius: number;
}

export interface TraceStyling {
  traceColour: string;
  traceThickness: number;
  traceRadius: number;
}

export interface NumberStyling {
  fontColour: string;
  fontWeight: number;
  fontSize: number;
}

// React component props
export interface KanjiCardProps {
  kanji: string | KanjiData;        // Character or KanjiData object
  showInfo?: boolean;               // Show info panel
  animationOptions?: Partial<AnimationOptions>;
  onAnimationComplete?: () => void;
  className?: string;
}

// Error handling
export class KanjiVGError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'KanjiVGError';
  }
}

// Error codes
export const ERROR_CODES = {
  KANJI_NOT_FOUND: 'KANJI_NOT_FOUND',
  INVALID_UNICODE: 'INVALID_UNICODE',
  SVG_PARSE_ERROR: 'SVG_PARSE_ERROR',
  FILE_LOAD_ERROR: 'FILE_LOAD_ERROR',
} as const;
