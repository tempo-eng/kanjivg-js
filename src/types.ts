/**
 * Core types for KanjiVG JavaScript library
 * Based on the Python implementation structure
 */

export interface Stroke {
  /** Stroke type identifier (e.g., "㇔", "㇒", "㇐") */
  type?: string;
  /** SVG path data for the stroke */
  path: string;
  /** Position for stroke number display */
  numberPos?: [number, number];
}

export interface StrokeGroup {
  /** Unique identifier for the group */
  id: string;
  /** Element this group represents */
  element?: string;
  /** Original element this derives from */
  original?: string;
  /** Part number for multi-part elements */
  part?: number;
  /** Number for numbered elements */
  number?: number;
  /** Whether this is a variant form */
  variant?: boolean;
  /** Whether this is a partial element */
  partial?: boolean;
  /** Whether this is a traditional form */
  tradForm?: boolean;
  /** Whether this is a radical form */
  radicalForm?: boolean;
  /** Position within the kanji (e.g., "top", "bottom", "left", "right") */
  position?: string;
  /** Radical information */
  radical?: string;
  /** Phonetic information */
  phon?: string;
  /** Child stroke groups */
  groups: StrokeGroup[];
  /** Direct strokes in this group */
  strokes: Stroke[];
}

export interface Kanji {
  /** Unicode code point as hex string (e.g., "04e26") */
  code: string;
  /** Variant identifier if any */
  variant?: string;
  /** Root stroke group containing all strokes */
  strokes: StrokeGroup;
  /** Character representation */
  character: string;
  /** Flattened array of all strokes in correct order */
  all_strokes?: Stroke[];
}

export interface KanjiData {
  /** All available kanji indexed by code */
  kanji: Record<string, Kanji>;
  /** Index mapping characters to their codes */
  index: Record<string, string[]>;
}

export interface StrokeOrderOptions {
  /** Duration of each stroke in milliseconds */
  strokeDuration?: number;
  /** Delay between strokes in milliseconds */
  strokeDelay?: number;
  /** Whether to show stroke numbers permanently */
  showNumbers?: boolean;
  /** Whether to flash stroke numbers briefly during animation */
  flashNumbers?: boolean;
  /** Whether to loop the animation */
  loop?: boolean;
  /** Custom CSS class for styling */
  className?: string;
  /** Width of the SVG */
  width?: number;
  /** Height of the SVG */
  height?: number;
  /** ViewBox for the SVG */
  viewBox?: string;
}

export interface ComponentInfo {
  /** Element name */
  element: string;
  /** Position within the kanji */
  position?: string;
  /** Whether it's a radical */
  isRadical?: boolean;
  /** Radical number if applicable */
  radicalNumber?: string;
  /** Whether it's a traditional form */
  isTraditional?: boolean;
  /** Whether it's a variant form */
  isVariant?: boolean;
}

export interface KanjiInfo {
  /** The kanji character */
  character: string;
  /** Unicode code point */
  code: string;
  /** Variant identifier if any */
  variant?: string;
  /** Total number of strokes */
  strokeCount: number;
  /** List of stroke types in order */
  strokeTypes: string[];
  /** Component information */
  components: ComponentInfo[];
  /** Radical information */
  radicals: ComponentInfo[];
  /** SVG data */
  svg: string;
}

export interface LookupOptions {
  /** Whether to include variant forms */
  includeVariants?: boolean;
  /** Whether to include partial forms */
  includePartial?: boolean;
  /** Maximum number of results to return */
  limit?: number;
}

export interface AnimationState {
  /** Current stroke being animated */
  currentStroke: number;
  /** Whether animation is playing */
  isPlaying: boolean;
  /** Whether animation is paused */
  isPaused: boolean;
  /** Total number of strokes */
  totalStrokes: number;
  /** Progress (0-1) */
  progress: number;
}

// React Component Props
export interface KanjiSVGProps {
  /** Kanji information to render */
  kanji: KanjiInfo;
  /** Animation options */
  options?: StrokeOrderOptions;
  /** Whether to auto-start animation */
  autoPlay?: boolean;
  /** Callback when animation state changes */
  onAnimationStateChange?: (state: AnimationState) => void;
  /** Custom CSS class */
  className?: string;
  /** Custom styles */
  style?: React.CSSProperties;
}

export interface KanjiCardProps {
  /** Kanji information to display */
  kanji: KanjiInfo;
  /** Animation options */
  animationOptions?: StrokeOrderOptions;
  /** Whether to show kanji information */
  showInfo?: boolean;
  /** Custom CSS class */
  className?: string;
}
