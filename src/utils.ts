import { KanjiInfo, ComponentInfo } from './types';

/**
 * Utility functions for KanjiVG
 */

/**
 * Convert a character or hex code to canonical ID format
 */
export function canonicalId(input: string | number): string {
  let code: number;
  
  if (typeof input === 'string') {
    if (input.length === 1) {
      code = input.charCodeAt(0);
    } else if (input.length >= 2 && input.length <= 5) {
      code = parseInt(input, 16);
    } else {
      throw new Error('Character id must be a 1-character string or 2-5 hex digit unicode codepoint');
    }
  } else {
    code = input;
  }

  if (code > 0xf && code <= 0xfffff) {
    return code.toString(16).padStart(5, '0');
  }
  
  throw new Error('Character id out of range');
}

/**
 * Check if a character is a kanji
 */
export function isKanji(char: string): boolean {
  const code = char.charCodeAt(0);
  return (
    (code >= 0x4e00 && code <= 0x9fc3) || // CJK Unified Ideographs
    (code >= 0x3400 && code <= 0x4dbf) || // CJK Extension A
    (code >= 0xf900 && code <= 0xfad9) || // CJK Compatibility Ideographs
    (code >= 0x2e80 && code <= 0x2eff) || // CJK Radicals Supplement
    (code >= 0x20000 && code <= 0x2a6df)  // CJK Extension B
  );
}

/**
 * Get the Unicode code point from a character
 */
export function getUnicodeCodePoint(char: string): string {
  return char.charCodeAt(0).toString(16).padStart(5, '0');
}

/**
 * Get the character from a Unicode code point
 */
export function getCharacterFromCodePoint(code: string): string {
  return String.fromCharCode(parseInt(code, 16));
}

/**
 * Format a Unicode code point for display
 */
export function formatUnicodeCodePoint(code: string): string {
  return `U+${code.toUpperCase()}`;
}

/**
 * Get stroke count from kanji info
 */
export function getStrokeCount(kanji: KanjiInfo): number {
  return kanji.strokeCount;
}

/**
 * Get all stroke types from kanji info
 */
export function getStrokeTypes(kanji: KanjiInfo): string[] {
  return kanji.strokeTypes;
}

/**
 * Get radicals from kanji info
 */
export function getRadicals(kanji: KanjiInfo): ComponentInfo[] {
  return kanji.radicals;
}

/**
 * Get components from kanji info
 */
export function getComponents(kanji: KanjiInfo): ComponentInfo[] {
  return kanji.components;
}

/**
 * Check if a component is a radical
 */
export function isRadical(component: ComponentInfo): boolean {
  return component.isRadical || false;
}

/**
 * Get components by position
 */
export function getComponentsByPosition(kanji: KanjiInfo, position: string): ComponentInfo[] {
  return kanji.components.filter(comp => comp.position === position);
}

/**
 * Get components by element
 */
export function getComponentsByElement(kanji: KanjiInfo, element: string): ComponentInfo[] {
  return kanji.components.filter(comp => comp.element === element);
}

/**
 * Generate a simple SVG for a kanji (without animation)
 */
export function generateSimpleSVG(kanji: KanjiInfo, options: {
  width?: number;
  height?: number;
  viewBox?: string;
  className?: string;
} = {}): string {
  const {
    width = 109,
    height = 109,
    viewBox = '0 0 109 109',
    className = 'kanjivg-simple'
  } = options;

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" 
    width="${width}" 
    height="${height}" 
    viewBox="${viewBox}" 
    class="${className}"
    style="fill:none;stroke:#000000;stroke-width:3;stroke-linecap:round;stroke-linejoin:round;">\n`;

  svg += `<g id="kvg:StrokePaths_${kanji.code}">\n`;
  
  for (let i = 0; i < kanji.strokeTypes.length; i++) {
    const strokeType = kanji.strokeTypes[i];
    svg += `  <path id="kvg:${kanji.code}-s${i + 1}" 
      kvg:type="${strokeType}" 
      d="M0,0" 
      style="fill:none;stroke:#000000;stroke-width:3;stroke-linecap:round;stroke-linejoin:round;"/>\n`;
  }
  
  svg += `</g>\n</svg>`;
  return svg;
}

/**
 * Create a data URL for a kanji SVG
 */
export function createDataURL(kanji: KanjiInfo, options: {
  width?: number;
  height?: number;
  viewBox?: string;
  className?: string;
} = {}): string {
  const svg = generateSimpleSVG(kanji, options);
  const encoded = encodeURIComponent(svg);
  return `data:image/svg+xml,${encoded}`;
}

/**
 * Debounce function for performance optimization
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Throttle function for performance optimization
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Generate a random kanji from a list
 */
export function getRandomKanji(kanjiList: KanjiInfo[]): KanjiInfo | null {
  if (kanjiList.length === 0) return null;
  const randomIndex = Math.floor(Math.random() * kanjiList.length);
  return kanjiList[randomIndex];
}

/**
 * Search kanji by stroke count
 */
export function searchByStrokeCount(kanjiList: KanjiInfo[], strokeCount: number): KanjiInfo[] {
  return kanjiList.filter(kanji => kanji.strokeCount === strokeCount);
}

/**
 * Search kanji by radical
 */
export function searchByRadical(kanjiList: KanjiInfo[], radical: string): KanjiInfo[] {
  return kanjiList.filter(kanji => 
    kanji.radicals.some(r => r.element === radical)
  );
}

/**
 * Search kanji by component
 */
export function searchByComponent(kanjiList: KanjiInfo[], component: string): KanjiInfo[] {
  return kanjiList.filter(kanji => 
    kanji.components.some(c => c.element === component)
  );
}

/**
 * Sort kanji by stroke count
 */
export function sortByStrokeCount(kanjiList: KanjiInfo[], ascending: boolean = true): KanjiInfo[] {
  return [...kanjiList].sort((a, b) => {
    return ascending ? a.strokeCount - b.strokeCount : b.strokeCount - a.strokeCount;
  });
}

/**
 * Sort kanji by character
 */
export function sortByCharacter(kanjiList: KanjiInfo[], ascending: boolean = true): KanjiInfo[] {
  return [...kanjiList].sort((a, b) => {
    return ascending ? a.character.localeCompare(b.character) : b.character.localeCompare(a.character);
  });
}


