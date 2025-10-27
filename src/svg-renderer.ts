import { KanjiInfo, StrokeOrderOptions, AnimationState } from './types';

/**
 * SVG renderer with stroke order animation capabilities
 */
export class SVGRenderer {
  private options: Required<StrokeOrderOptions>;
  private animationState: AnimationState;
  private animationTimer?: NodeJS.Timeout;
  private hasRadicalStyling: boolean;

  constructor(options: StrokeOrderOptions = {}) {
    this.options = {
      strokeDuration: 800,
      strokeDelay: 200,
      showNumbers: false,
      flashNumbers: true,
      showTrace: false,
      strokeStyling: {
        strokeColour: '#000000',
        strokeThickness: 3,
        strokeRadius: 0,
        ...options.strokeStyling
      },
      radicalStyling: {
        radicalColour: '#000000',
        radicalThickness: 3,
        radicalRadius: 0,
        ...options.radicalStyling
      },
      traceStyling: {
        traceColour: '#cccccc',
        traceThickness: 2,
        traceRadius: 0,
        ...options.traceStyling
      },
      numberStyling: {
        font: 'Arial, sans-serif',
        fontWeight: 'normal',
        fontColour: '#666',
        fontSize: '12',
        ...options.numberStyling
      },
      loop: false,
      className: 'kanjivg-svg',
      width: 109,
      height: 109,
      viewBox: '0 0 109 109',
      ...options
    };
    
    // Set flag after options are merged
    this.hasRadicalStyling = !!options.radicalStyling;

    this.animationState = {
      currentStroke: 0,
      isPlaying: false,
      isPaused: false,
      totalStrokes: 0,
      progress: 0
    };
  }

  /**
   * Render kanji as SVG with stroke order animation
   */
  render(kanji: KanjiInfo, options: Partial<StrokeOrderOptions> = {}): string {
    const opts = { ...this.options, ...options };
    const { strokeTypes, character, code, svg: svgData } = kanji;
    
    this.animationState.totalStrokes = strokeTypes.length;
    this.animationState.currentStroke = 0;

    // If we have SVG data, use it directly with animation modifications
    if (svgData) {
      return this.addAnimationToSVG(svgData, strokeTypes, code, opts, kanji);
    }

    // Fallback: generate SVG from stroke types (for backward compatibility)
    // Note: Removed style attribute from root SVG to prevent inheritance issues with text elements
    let svg = `<svg xmlns="http://www.w3.org/2000/svg" 
      width="${opts.width}" 
      height="${opts.height}" 
      viewBox="${opts.viewBox}" 
      class="${opts.className}">\n`;

    // Add stroke paths - set stroke to transparent and stroke-width to 0 so it doesn't override text fill and font-weight
    svg += `<g id="kvg:StrokePaths_${code}" stroke="transparent" stroke-width="0">\n`;
    
    // Add trace outline if enabled
    if (opts.showTrace && svgData) {
      svg += this.createTraceOutline(code, strokeTypes, svgData, opts);
    }
    
    for (let i = 0; i < strokeTypes.length; i++) {
      const strokeId = `kvg:${code}-s${i + 1}`;
      const strokeType = strokeTypes[i];
      
      // Create animated path
      svg += this.createAnimatedPath(strokeId, strokeType, i, opts, kanji);
    }

    // Add stroke numbers if enabled
    if (opts.showNumbers || opts.flashNumbers) {
      // Get stroke data for positioning
      const allStrokes = this.getAllStrokesFromKanji(kanji);
      svg += this.createStrokeNumbers(code, strokeTypes.length, allStrokes, opts);
    }

    svg += `</g>\n</svg>`;
    return svg;
  }

  /**
   * Add animation to existing SVG data
   */
  private addAnimationToSVG(
    svgData: string, 
    strokeTypes: string[], 
    code: string, 
    options: Required<StrokeOrderOptions>,
    kanji: KanjiInfo
  ): string {
    // Parse the SVG and add animation to each path
    let animatedSVG = svgData;
    
    // Remove style attribute from root SVG element to prevent inheritance issues
    animatedSVG = animatedSVG.replace(/<svg([^>]*?)style="[^"]+"([^>]*?)>/g, '<svg$1$2>');
    
    // Find the <g id="kvg:StrokePaths_..."> element and remove the style attribute that contains stroke colors
    // This prevents inheritance from overriding text fill and stroke-width
    animatedSVG = animatedSVG.replace(/<g([^>]*?)id="kvg:StrokePaths_[^"]+"([^>]*?)style="[^"]+"([^>]*?)>/g, '<g$1id="kvg:StrokePaths_$2$3>');
    animatedSVG = animatedSVG.replace(/<g([^>]*?)style="[^"]+"([^>]*?)id="kvg:StrokePaths_[^"]+"([^>]*?)>/g, '<g$1$2id="kvg:StrokePaths_$3>');
    
    console.log('Modified SVG root element:', animatedSVG.match(/<svg[^>]*>/)?.[0]);
    console.log('Modified SVG group element:', animatedSVG.match(/<g[^>]*id="kvg:StrokePaths_[^"]+"[^>]*>/)?.[0]);
    
    // Add trace outline if enabled
    if (options.showTrace) {
      const traceSVG = this.createTraceOutline(code, strokeTypes, svgData, options);
      // Insert trace before the first path element
      animatedSVG = animatedSVG.replace(/<path/, `${traceSVG}<path`);
    }
    
    // Find all path elements and add animation
    const pathRegex = /<path([^>]*?)>/g;
    const pathMatches = [...svgData.matchAll(pathRegex)];
    
    // Create a map to track which stroke types we've already processed
    const processedStrokeTypes = new Map<string, number>();
    
    // Process each path and replace with animated version
    pathMatches.forEach((match, index) => {
      const fullMatch = match[0];
      const attributes = match[1];
      
      if (index < strokeTypes.length) {
        // Extract the existing stroke type from kvg:type attribute
        const typeMatch = attributes.match(/kvg:type="([^"]*)"/);
        const existingStrokeType = typeMatch ? typeMatch[1] : strokeTypes[index];
        
        // Find the correct stroke index - handle duplicates by finding the first occurrence
        let correctStrokeIndex = strokeTypes.indexOf(existingStrokeType);
        
        // If this stroke type has been processed before, find the next occurrence
        if (processedStrokeTypes.has(existingStrokeType)) {
          const lastIndex = processedStrokeTypes.get(existingStrokeType)!;
          correctStrokeIndex = strokeTypes.indexOf(existingStrokeType, lastIndex + 1);
        }
        
        // Update the processed count for this stroke type
        processedStrokeTypes.set(existingStrokeType, correctStrokeIndex);
        
        const delay = correctStrokeIndex * (options.strokeDuration + options.strokeDelay);
        const duration = options.strokeDuration;
        const { color, isRadical } = this.getEffectiveStrokeColorAndIsRadical(correctStrokeIndex, 0, kanji, options);
        const strokeStyle = this.createStrokeStyle(options, color, isRadical);
        
        // Create animated path
        const animatedPath = `<path id="kvg:${code}-s${correctStrokeIndex + 1}" kvg:type="${existingStrokeType}"${attributes}
          style="stroke-dasharray: 1000; stroke-dashoffset: 1000; ${strokeStyle}">
          <animate attributeName="stroke-dashoffset" 
            values="1000;0" 
            dur="${duration}ms" 
            begin="${delay}ms" 
            fill="freeze" />
        </path>`;
        
        // Replace only the first occurrence to avoid duplicates
        animatedSVG = animatedSVG.replace(fullMatch, animatedPath);
      }
    });
    
    // Add stroke numbers if enabled
    if (options.showNumbers || options.flashNumbers) {
      // Extract stroke data from the SVG for positioning
      const strokeData = this.extractStrokeDataFromSVG(animatedSVG);
      const numbersSVG = this.createStrokeNumbers(code, strokeTypes.length, strokeData, options);
      // Insert stroke numbers before closing </g> tag
      animatedSVG = animatedSVG.replace('</g>', `${numbersSVG}</g>`);
    }
    
    return animatedSVG;
  }

  /**
   * Create an animated path element
   */
  private createAnimatedPath(
    id: string, 
    strokeType: string, 
    strokeIndex: number, 
    options: Required<StrokeOrderOptions>,
    kanji: KanjiInfo,
    radicalIndex: number = 0
  ): string {
    const delay = strokeIndex * (options.strokeDuration + options.strokeDelay);
    const duration = options.strokeDuration;
    const color = this.getEffectiveStrokeColor(strokeIndex, radicalIndex, kanji, options);
    const strokeStyle = this.createStrokeStyle(options, color);

    return `  <path id="${id}" 
      kvg:type="${strokeType}" 
      d="M0,0" 
      style="stroke-dasharray: 1000; stroke-dashoffset: 1000; ${strokeStyle}">
    <animate attributeName="stroke-dashoffset" 
      values="1000;0" 
      dur="${duration}ms" 
      begin="${delay}ms" 
      fill="freeze" />
  </path>\n`;
  }

  /**
   * Get all strokes from kanji data for positioning
   */
  private getAllStrokesFromKanji(kanji: KanjiInfo): any[] {
    // This is a simplified version - in a real implementation,
    // we'd need to access the original kanji data structure
    // For now, we'll extract from the SVG data
    if (kanji.svg) {
      return this.extractStrokeDataFromSVG(kanji.svg);
    }
    return [];
  }

  /**
   * Extract stroke data from SVG string
   */
  private extractStrokeDataFromSVG(svgData: string): any[] {
    const strokes: any[] = [];
    const pathRegex = /<path[^>]*d="([^"]*)"[^>]*>/g;
    let match;
    
    while ((match = pathRegex.exec(svgData)) !== null) {
      strokes.push({
        path: match[1]
      });
    }
    
    return strokes;
  }

  /**
   * Calculate the best position for a stroke number based on the stroke path
   */
  private calculateStrokeNumberPosition(strokePath: string, strokeIndex: number, totalStrokes: number): { x: number, y: number } {
    // Extract starting coordinates from the path
    const coords = strokePath.match(/M([0-9.]+),([0-9.]+)/);
    if (!coords) {
      return { x: 50, y: 50 }; // Default center position
    }
    
    const startX = parseFloat(coords[1]);
    const startY = parseFloat(coords[2]);
    
    // Calculate offset based on stroke position and type
    let offsetX = 0;
    let offsetY = 0;
    
    // Determine offset based on stroke index and position
    if (strokeIndex <= 2) {
      // Top strokes - position above
      offsetY = -15;
      offsetX = strokeIndex === 1 ? -8 : 8; // Left/right offset
    } else if (strokeIndex <= 4) {
      // Middle strokes - position to the side
      offsetX = strokeIndex === 3 ? -12 : 12; // Left/right offset
      offsetY = -5;
    } else if (strokeIndex <= 6) {
      // Lower middle strokes - position to the side
      offsetX = strokeIndex === 5 ? -12 : 12; // Left/right offset
      offsetY = 5;
    } else {
      // Bottom strokes - position below
      offsetY = 15;
      offsetX = strokeIndex === 7 ? -8 : 8; // Left/right offset
    }
    
    // Ensure the number stays within the SVG bounds
    const x = Math.max(10, Math.min(99, startX + offsetX));
    const y = Math.max(10, Math.min(99, startY + offsetY));
    
    return { x, y };
  }

  /**
   * Get stroke color for a given stroke index
   */
  private getStrokeColor(strokeIndex: number, strokeStyling: Required<StrokeOrderOptions>['strokeStyling']): string {
    if (typeof strokeStyling.strokeColour === 'string') {
      return strokeStyling.strokeColour;
    }
    
    // Cycle through colors array
    const colors = strokeStyling.strokeColour;
    return colors[strokeIndex % colors.length];
  }

  /**
   * Get radical color for a given radical index
   */
  private getRadicalColor(radicalIndex: number, radicalStyling: Required<StrokeOrderOptions>['radicalStyling']): string {
    if (typeof radicalStyling.radicalColour === 'string') {
      return radicalStyling.radicalColour;
    }
    
    // Cycle through colors array
    const colors = radicalStyling.radicalColour;
    return colors[radicalIndex % colors.length];
  }

  /**
   * Get stroke color considering radical styling override
   * Returns both color and whether this stroke is a radical
   */
  private getEffectiveStrokeColorAndIsRadical(strokeIndex: number, radicalIndex: number, kanji: KanjiInfo, options: Required<StrokeOrderOptions>): { color: string, isRadical: boolean } {
    // Check if radical styling was provided in the current options
    const hasRadicalStyling = options.radicalStyling && 
      (options.radicalStyling.radicalColour !== '#000000' || 
       (Array.isArray(options.radicalStyling.radicalColour) && options.radicalStyling.radicalColour.length > 0));
    
    // If radical styling was explicitly provided, check if this stroke belongs to a radical
    if (hasRadicalStyling) {
      // Find which component this stroke belongs to
      const strokeComponent = this.findStrokeComponent(strokeIndex, kanji);
      
      // If this stroke belongs to a radical component, use radical color
      if (strokeComponent && strokeComponent.isRadical) {
        // Find the radical's index in the radicals array
        const radicalIndex = kanji.radicals.findIndex(r => r.element === strokeComponent.element);
        return { 
          color: this.getRadicalColor(radicalIndex !== -1 ? radicalIndex : 0, options.radicalStyling),
          isRadical: true
        };
      }
    }
    
    // Otherwise use stroke styling
    return {
      color: this.getStrokeColor(strokeIndex, options.strokeStyling),
      isRadical: false
    };
  }

  /**
   * Get stroke color considering radical styling override (legacy method for compatibility)
   */
  private getEffectiveStrokeColor(strokeIndex: number, radicalIndex: number, kanji: KanjiInfo, options: Required<StrokeOrderOptions>): string {
    return this.getEffectiveStrokeColorAndIsRadical(strokeIndex, radicalIndex, kanji, options).color;
  }

  /**
   * Find which component a stroke belongs to based on stroke index
   */
  private findStrokeComponent(strokeIndex: number, kanji: KanjiInfo): any {
    // Try to find which component this stroke belongs to
    // We use a heuristic based on common radical stroke counts
    
    // Build a map of radical positions
    let currentStrokeIndex = 0;
    const radicalRanges: Array<{component: any, start: number, end: number}> = [];
    
    for (const component of kanji.components) {
      if (component.isRadical) {
        const radicalStrokeCount = this.getRadicalStrokeCount(component.element, kanji);
        radicalRanges.push({
          component,
          start: currentStrokeIndex,
          end: currentStrokeIndex + radicalStrokeCount
        });
      }
      // Move to the next component (assume each component has its stroke count)
      const componentStrokeCount = this.getRadicalStrokeCount(component.element || '', kanji);
      currentStrokeIndex += componentStrokeCount;
    }
    
    // Check if this stroke index falls within any radical range
    for (const range of radicalRanges) {
      if (strokeIndex >= range.start && strokeIndex < range.end) {
        return range.component;
      }
    }
    
    return null;
  }

  /**
   * Get approximate stroke count for a radical component
   * This is a simplified heuristic - in reality we'd need proper component mapping
   */
  private getRadicalStrokeCount(element: string, kanji: KanjiInfo): number {
    // Simple heuristic based on common radicals
    const radicalStrokeCounts: { [key: string]: number } = {
      '女': 3,  // 姉 has 女 radical with 3 strokes
      '車': 7,  // 転 has 車 radical with 7 strokes
      '糹': 6,  // 纛 has 糹 radical with 6 strokes
      '人': 2,
      '口': 3,
      '日': 4,
      '月': 4,
      '水': 4,
      '火': 4,
      '木': 4,
      '金': 8,
      '土': 3,
      '山': 3,
      '川': 3,
      '田': 5,
      '大': 3,
      '小': 3,
      '中': 4,
      '上': 3,
      '下': 3,
      '左': 5,
      '右': 5,
      '斉': 8,
      '士': 3,
      '己': 3
    };
    
    return radicalStrokeCounts[element] || 1;
  }

  /**
   * Create stroke style string
   */
  private createStrokeStyle(options: Required<StrokeOrderOptions>, color: string, isRadical: boolean = false): string {
    let thickness: number;
    let radius: number;
    
    if (isRadical && options.radicalStyling) {
      thickness = options.radicalStyling.radicalThickness || options.strokeStyling.strokeThickness;
      radius = options.radicalStyling.radicalRadius || options.strokeStyling.strokeRadius;
    } else {
      thickness = options.strokeStyling.strokeThickness;
      radius = options.strokeStyling.strokeRadius;
    }
    
    const linecap = radius > 0 ? 'round' : 'butt';
    const linejoin = radius > 0 ? 'round' : 'miter';
    return `fill: none; stroke: ${color}; stroke-width: ${thickness}; stroke-linecap: ${linecap}; stroke-linejoin: ${linejoin};`;
  }

  /**
   * Create trace style string
   */
  private createTraceStyle(options: Required<StrokeOrderOptions>): string {
    const { traceStyling } = options;
    const linecap = traceStyling.traceRadius > 0 ? 'round' : 'butt';
    const linejoin = traceStyling.traceRadius > 0 ? 'round' : 'miter';
    return `fill: none; stroke: ${traceStyling.traceColour}; stroke-width: ${traceStyling.traceThickness}; stroke-linecap: ${linecap}; stroke-linejoin: ${linejoin}; opacity: 0.3;`;
  }
  private createTraceOutline(code: string, strokeTypes: string[], svgData: string, options: Required<StrokeOrderOptions>): string {
    let trace = '';
    
    // Extract all path elements from the SVG data
    const pathRegex = /<path([^>]*?)>/g;
    const pathMatches = [...svgData.matchAll(pathRegex)];
    
    // Create trace paths for each stroke
    pathMatches.forEach((match, index) => {
      if (index < strokeTypes.length) {
        const attributes = match[1];
        const strokeId = `kvg:${code}-trace-${index + 1}`;
        const traceStyle = this.createTraceStyle(options);
        
        // Create trace path with custom styling
        trace += `  <path id="${strokeId}"${attributes}
          style="${traceStyle}" />
`;
      }
    });

    return trace;
  }
  private createStrokeNumbers(code: string, strokeCount: number, strokes: any[] = [], options: Required<StrokeOrderOptions>): string {
    let numbers = '';
    
    for (let i = 1; i <= strokeCount; i++) {
      const delay = (i - 1) * (options.strokeDuration + options.strokeDelay);
      
      // Calculate position for this stroke number
      let x = 50, y = 50; // Default center position
      
      if (strokes[i - 1] && strokes[i - 1].path) {
        const coords = this.calculateStrokeNumberPosition(strokes[i - 1].path, i, strokeCount);
        x = coords.x;
        y = coords.y;
      }
      
      // Determine the animation behavior based on options
      let animationElement = '';
      let initialOpacity = '0';
      
      if (options.showNumbers) {
        // showNumbers takes precedence - numbers stay visible
        initialOpacity = '1';
        // No animation needed for permanent display
      } else if (options.flashNumbers) {
        // flashNumbers - current behavior (flash briefly)
        animationElement = `<animate attributeName="opacity" 
          values="0;1;0" 
          dur="${options.strokeDuration}ms" 
          begin="${delay}ms" 
          fill="freeze" />`;
      }
      
      // Apply number styling
      const fontFamily = options.numberStyling.font || 'Arial, sans-serif';
      const fontWeight = options.numberStyling.fontWeight || 'normal';
      const fontSize = options.numberStyling.fontSize || '12';
      const fontColour = options.numberStyling.fontColour || '#666';
      
      console.log(`Creating stroke number ${i} with styling:`, { fontFamily, fontWeight, fontSize, fontColour });
      
      const textElement = `  <text id="kvg:${code}-n${i}" 
        x="${x}" y="${y}" 
        text-anchor="middle" 
        font-family="${fontFamily}" 
        font-weight="${fontWeight}" 
        font-size="${fontSize}" 
        fill="${fontColour}" 
        opacity="${initialOpacity}">
        ${animationElement}
        ${i}
      </text>\n`;
      
      console.log('Generated text element:', textElement.substring(0, 100));
      
      numbers += textElement;
    }

    return numbers;
  }

  /**
   * Start stroke order animation
   */
  startAnimation(kanji: KanjiInfo, onProgress?: (state: AnimationState) => void): void {
    if (this.animationState.isPlaying) {
      this.stopAnimation();
    }

    this.animationState = {
      currentStroke: 0,
      isPlaying: true,
      isPaused: false,
      totalStrokes: kanji.strokeCount,
      progress: 0
    };

    this.animateStrokes(kanji, onProgress);
  }

  /**
   * Stop the current animation
   */
  stopAnimation(): void {
    if (this.animationTimer) {
      clearTimeout(this.animationTimer);
      this.animationTimer = undefined;
    }

    this.animationState = {
      currentStroke: 0,
      isPlaying: false,
      isPaused: false,
      totalStrokes: 0,
      progress: 0
    };
  }

  /**
   * Pause the current animation
   */
  pauseAnimation(): void {
    if (this.animationState.isPlaying) {
      this.animationState.isPaused = true;
      this.animationState.isPlaying = false;
      
      if (this.animationTimer) {
        clearTimeout(this.animationTimer);
        this.animationTimer = undefined;
      }
    }
  }

  /**
   * Resume the paused animation
   */
  resumeAnimation(kanji: KanjiInfo, onProgress?: (state: AnimationState) => void): void {
    if (this.animationState.isPaused) {
      this.animationState.isPaused = false;
      this.animationState.isPlaying = true;
      this.animateStrokes(kanji, onProgress);
    }
  }

  /**
   * Animate strokes with timing
   */
  private animateStrokes(kanji: KanjiInfo, onProgress?: (state: AnimationState) => void): void {
    if (this.animationState.currentStroke >= kanji.strokeCount) {
      if (this.options.loop) {
        this.animationState.currentStroke = 0;
        this.animationState.progress = 0;
      } else {
        this.animationState.isPlaying = false;
        return;
      }
    }

    if (onProgress) {
      onProgress({ ...this.animationState });
    }

    this.animationState.currentStroke++;
    this.animationState.progress = this.animationState.currentStroke / kanji.strokeCount;

    const delay = this.options.strokeDuration + this.options.strokeDelay;
    this.animationTimer = setTimeout(() => {
      if (this.animationState.isPlaying && !this.animationState.isPaused) {
        this.animateStrokes(kanji, onProgress);
      }
    }, delay);
  }

  /**
   * Get current animation state
   */
  getAnimationState(): AnimationState {
    return { ...this.animationState };
  }

  /**
   * Update renderer options
   */
  updateOptions(options: Partial<StrokeOrderOptions>): void {
    this.options = { ...this.options, ...options };
  }
}
