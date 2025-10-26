/**
 * Alternative approach: Load kanji data directly from SVG files
 * This mimics the original Python approach but works in JavaScript
 */

import { Kanji, KanjiData } from './types';

export class SVGFileLoader {
  private baseUrl: string;
  private index: Record<string, string[]> = {};

  constructor(baseUrl: string = '/kanji/') {
    this.baseUrl = baseUrl;
  }

  /**
   * Load the index file to map characters to SVG files
   */
  async loadIndex(): Promise<void> {
    const response = await fetch(`${this.baseUrl}../kvg-index.json`);
    this.index = await response.json();
  }

  /**
   * Load a single kanji from its SVG file (like Python's commandFindSvg)
   */
  async loadKanjiFromSVG(character: string): Promise<Kanji | null> {
    const canonicalId = this.getCanonicalId(character);
    const svgFiles = this.index[character] || [];
    
    if (svgFiles.length === 0) {
      return null;
    }

    // Load the first variant (like Python does)
    const svgFile = svgFiles[0];
    const svgUrl = `${this.baseUrl}${svgFile}`;
    
    try {
      const response = await fetch(svgUrl);
      const svgContent = await response.text();
      return this.parseSVG(svgContent, canonicalId);
    } catch (error) {
      console.error(`Error loading SVG ${svgFile}:`, error);
      return null;
    }
  }

  /**
   * Convert character to canonical ID (like Python's canonicalId function)
   */
  private getCanonicalId(input: string | number): string {
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
   * Parse SVG content to extract kanji data (like Python's SVGHandler)
   */
  private parseSVG(svgContent: string, code: string): Kanji | null {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(svgContent, 'image/svg+xml');
      
      const strokeGroup = doc.querySelector('g[id^="kvg:StrokePaths_"]');
      if (!strokeGroup) {
        return null;
      }

      const character = String.fromCharCode(parseInt(code, 16));
      
      // Parse stroke groups and strokes (simplified version)
      const strokes = this.parseStrokeGroup(strokeGroup);
      
      return {
        code,
        character,
        variant: undefined,
        strokes
      };
    } catch (error) {
      console.error('Error parsing SVG:', error);
      return null;
    }
  }

  /**
   * Parse stroke group from DOM element
   */
  private parseStrokeGroup(element: Element): any {
    // Implementation would parse the SVG structure
    // This is a simplified version
    return {
      id: element.getAttribute('id') || '',
      groups: [],
      strokes: []
    };
  }

  /**
   * Get all available characters (like Python's listSvgFiles)
   */
  getAllCharacters(): string[] {
    return Object.keys(this.index);
  }
}

// Usage example:
/*
const loader = new SVGFileLoader('/kanji/');
await loader.loadIndex();
const kanji = await loader.loadKanjiFromSVG('並');
*/


