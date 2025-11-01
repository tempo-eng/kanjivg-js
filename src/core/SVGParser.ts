import { KanjiData, StrokeData, GroupData, RadicalInfo } from '../types';

/**
 * SVG Parser for extracting stroke data from KanjiVG SVG files
 */
export class SVGParser {
  private cache: Map<string, KanjiData> = new Map();

  /**
   * Parse SVG content and extract all kanji data
   * @param svgContent - The SVG file content as string
   * @param unicode - The unicode codepoint (e.g., "04e00")
   * @returns Parsed KanjiData object
   */
  parseSVG(svgContent: string, unicode: string): KanjiData {
    // Check cache first
    const cacheKey = unicode;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    // Preprocess SVG: Strip DOCTYPE (which can cause parsing issues in some environments)
    // and ensure kvg namespace is declared
    let processedSvg = svgContent;
    
    // Strip DOCTYPE declaration - some DOMParser implementations can't handle external DTD references
    // DOCTYPE can have the format: <!DOCTYPE ... [...]> where [...] is the internal subset
    processedSvg = processedSvg.replace(/<!DOCTYPE[\s\S]*?]>/g, '');
    
    // Add the kvg namespace declaration to the SVG tag if it's missing
    // The DOCTYPE had the namespace declaration, so we need to add it back
    if (!processedSvg.includes('xmlns:kvg')) {
      processedSvg = processedSvg.replace(
        /<svg([^>]*)>/,
        '<svg$1 xmlns:kvg="http://kanjivg.tagaini.net">'
      );
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(processedSvg, 'image/svg+xml');
    
    // Check for parse errors
    const parseError = doc.querySelector('parsererror');
    if (parseError) {
      throw new Error(`Failed to parse SVG for ${unicode}: ${parseError.textContent?.substring(0, 200)}`);
    }

    // Extract character
    const character = this.extractCharacter(doc, unicode);
    
    // Extract all strokes in order
    const strokes = this.extractStrokes(doc);
    
    // Extract group hierarchy
    const groups = this.extractGroups(doc);
    
    // Extract radical information
    const radicalInfo = this.extractRadicalInfo(groups, strokes);
    
    // Mark strokes as radical strokes
    strokes.forEach(stroke => {
      stroke.isRadicalStroke = this.isRadicalStroke(stroke, groups);
      stroke.groupId = this.getStrokeGroupId(stroke.strokeNumber, groups);
    });
    
    // Extract stroke number positions
    const numberPositions = this.extractNumberPositions(doc, strokes.length);
    strokes.forEach((stroke, index) => {
      if (numberPositions[index]) {
        stroke.numberPosition = numberPositions[index];
      }
    });

    // Extract components from groups
    const components = this.extractComponents(groups);

    const kanjiData: KanjiData = {
      character,
      unicode,
      isVariant: false,
      strokes,
      groups,
      radicalInfo,
      strokeCount: strokes.length,
      components: components.length > 0 ? components : undefined,
    };

    // Cache result
    this.cache.set(cacheKey, kanjiData);

    return kanjiData;
  }

  /**
   * Extract the kanji character from the SVG
   */
  private extractCharacter(doc: Document, unicode: string): string {
    const mainGroup = doc.querySelector(`g[id^="kvg:${unicode}"]`);
    if (mainGroup) {
      const element = mainGroup.getAttribute('kvg:element');
      if (element) {
        return element;
      }
    }
    
    // Fallback: convert unicode to character
    return String.fromCodePoint(parseInt(unicode, 16));
  }

  /**
   * Extract all stroke path elements in order
   */
  private extractStrokes(doc: Document): StrokeData[] {
    const strokeGroup = doc.querySelector('g[id^="kvg:StrokePaths"]');
    if (!strokeGroup) {
      throw new Error('Cannot find StrokePaths group');
    }

    const paths = Array.from(strokeGroup.querySelectorAll('path')).filter(path => {
      const id = path.getAttribute('id');
      return id && id.includes('-s');
    });

    const strokes: StrokeData[] = [];
    
    paths.forEach((path, index) => {
      const id = path.getAttribute('id') || '';
      const pathData = path.getAttribute('d') || '';
      const strokeType = path.getAttribute('kvg:type') || '';

      strokes.push({
        strokeNumber: index + 1,
        path: pathData,
        strokeType,
      });
    });

    return strokes;
  }

  /**
   * Extract group hierarchy
   */
  private extractGroups(doc: Document): GroupData[] {
    const strokeGroup = doc.querySelector('g[id^="kvg:StrokePaths"]');
    if (!strokeGroup) {
      return [];
    }

    const groups: GroupData[] = [];
    const groupElements = Array.from(strokeGroup.querySelectorAll('g'));

    groupElements.forEach(groupEl => {
      const id = groupEl.getAttribute('id');
      if (!id || !id.includes('-g')) {
        return;
      }

      const element = groupEl.getAttribute('kvg:element') || undefined;
      const radical = groupEl.getAttribute('kvg:radical') || undefined;
      const position = groupEl.getAttribute('kvg:position') || undefined;
      
      // Find child paths to determine stroke numbers
      // CRITICAL: Only get direct child paths, NOT paths from nested radical groups
      // We need to traverse nested position groups (g2, g3) but NOT nested radical groups (g4, etc.)
      // A radical group is identified by having both -g in the id AND a kvg:radical attribute
      const directChildPaths: Element[] = [];
      
      // Recursively find paths that are NOT inside nested radical group elements
      const collectDirectPaths = (el: Element) => {
        for (const child of Array.from(el.children)) {
          if (child.tagName === 'path') {
            directChildPaths.push(child);
          } else if (child.tagName === 'g') {
            // Check if this is a nested radical group (has -g in id AND kvg:radical attribute)
            // Position groups (like g2, g3) only have kvg:position, not kvg:radical
            const childId = child.getAttribute('id') || '';
            const childRadical = child.getAttribute('kvg:radical');
            
            if (childId.includes('-g') && childRadical) {
              // This is a nested radical group - stop here, don't include its paths
              // Paths inside nested radical groups belong to those groups, not this one
            } else {
              // This is a position group or other non-radical group - continue traversing
              collectDirectPaths(child);
            }
          } else {
            // Other element types, continue traversing
            collectDirectPaths(child);
          }
        }
      };
      
      collectDirectPaths(groupEl);
      
      const childStrokes: number[] = [];
      
      // Determine stroke numbers based on path order in the document
      const allPaths = Array.from(strokeGroup.querySelectorAll('path'));
      directChildPaths.forEach(childPath => {
        // Find the index of this path element in the allPaths array
        // We need to compare by element identity, not just attributes
        const pathIndex = allPaths.findIndex(p => p === childPath);
        if (pathIndex !== -1) {
          childStrokes.push(pathIndex + 1);
        }
      });

      groups.push({
        id,
        element,
        radical,
        position,
        childStrokes,
        children: [],
      });
    });

    return groups;
  }

  /**
   * Determine radical information from groups
   */
  private extractRadicalInfo(groups: GroupData[], strokes: StrokeData[]): RadicalInfo | undefined {
    const radicals = groups.filter(g => g.radical);
    
    if (radicals.length === 0) {
      return undefined;
    }

    // For simplicity, take the first radical found
    const mainRadical = radicals[0];
    
    return {
      radical: mainRadical.element || mainRadical.radical || 'unknown',
      positions: mainRadical.position ? [mainRadical.position] : [],
      strokeRanges: [mainRadical.childStrokes],
    };
  }

  /**
   * Extract stroke number positions from StrokeNumbers section
   */
  private extractNumberPositions(doc: Document, strokeCount: number): Array<{ x: number; y: number } | undefined> {
    const numberGroup = doc.querySelector('g[id^="kvg:StrokeNumbers"]');
    if (!numberGroup) {
      return new Array(strokeCount).fill(undefined);
    }

    const textElements = Array.from(numberGroup.querySelectorAll('text'));
    const positions: Array<{ x: number; y: number } | undefined> = new Array(strokeCount).fill(undefined);

    textElements.forEach(textEl => {
      const transform = textEl.getAttribute('transform');
      const textContent = textEl.textContent?.trim();
      
      if (!transform || !textContent) return;

      // Parse transform matrix: matrix(1 0 0 1 x y)
      const matrixMatch = transform.match(/matrix\([^)]*\)/);
      if (matrixMatch) {
        const values = matrixMatch[0].match(/[\d.-]+/g) || [];
        if (values.length >= 6) {
          const x = parseFloat(values[4]);
          const y = parseFloat(values[5]);
          const strokeNum = parseInt(textContent, 10);
          
          if (strokeNum > 0 && strokeNum <= strokeCount) {
            positions[strokeNum - 1] = { x, y };
          }
        }
      }
    });

    return positions;
  }

  /**
   * Extract component list from groups
   */
  private extractComponents(groups: GroupData[]): string[] {
    const components = new Set<string>();
    
    groups.forEach(group => {
      if (group.element) {
        components.add(group.element);
      }
    });

    return Array.from(components);
  }

  /**
   * Check if a stroke belongs to a radical group
   */
  private isRadicalStroke(stroke: StrokeData, groups: GroupData[]): boolean {
    return groups.some(group => 
      group.radical && 
      group.childStrokes.includes(stroke.strokeNumber)
    );
  }

  /**
   * Get the group ID for a stroke
   */
  private getStrokeGroupId(strokeNumber: number, groups: GroupData[]): string | undefined {
    const group = groups.find(g => g.childStrokes.includes(strokeNumber));
    return group?.id;
  }

  /**
   * Clear the cache
   */
  clearCache(): void {
    this.cache.clear();
  }
}
