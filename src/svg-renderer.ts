import { KanjiInfo, StrokeOrderOptions, AnimationState } from './types';

/**
 * SVG renderer with stroke order animation capabilities
 */
export class SVGRenderer {
  private options: Required<StrokeOrderOptions>;
  private animationState: AnimationState;
  private animationTimer?: NodeJS.Timeout;

  constructor(options: StrokeOrderOptions = {}) {
    this.options = {
      strokeDuration: 800,
      strokeDelay: 200,
      showNumbers: true,
      loop: false,
      className: 'kanjivg-svg',
      width: 109,
      height: 109,
      viewBox: '0 0 109 109',
      ...options
    };

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
      return this.addAnimationToSVG(svgData, strokeTypes, code, opts);
    }

    // Fallback: generate SVG from stroke types (for backward compatibility)
    let svg = `<svg xmlns="http://www.w3.org/2000/svg" 
      width="${opts.width}" 
      height="${opts.height}" 
      viewBox="${opts.viewBox}" 
      class="${opts.className}"
      style="fill:none;stroke:#000000;stroke-width:3;stroke-linecap:round;stroke-linejoin:round;">\n`;

    // Add stroke paths
    svg += `<g id="kvg:StrokePaths_${code}">\n`;
    
    for (let i = 0; i < strokeTypes.length; i++) {
      const strokeId = `kvg:${code}-s${i + 1}`;
      const strokeType = strokeTypes[i];
      
      // Create animated path
      svg += this.createAnimatedPath(strokeId, strokeType, i, opts);
    }

    // Add stroke numbers if enabled
    if (opts.showNumbers) {
      // Get stroke data for positioning
      const allStrokes = this.getAllStrokesFromKanji(kanji);
      svg += this.createStrokeNumbers(code, strokeTypes.length, allStrokes);
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
    options: Required<StrokeOrderOptions>
  ): string {
    // Parse the SVG and add animation to each path
    let animatedSVG = svgData;
    
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
        
        // Create animated path
        const animatedPath = `<path id="kvg:${code}-s${correctStrokeIndex + 1}" kvg:type="${existingStrokeType}"${attributes}
          style="stroke-dasharray: 1000; stroke-dashoffset: 1000; fill: none; stroke: #000000; stroke-width: 3; stroke-linecap: round; stroke-linejoin: round;">
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
    if (options.showNumbers) {
      // Extract stroke data from the SVG for positioning
      const strokeData = this.extractStrokeDataFromSVG(animatedSVG);
      const numbersSVG = this.createStrokeNumbers(code, strokeTypes.length, strokeData);
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
    options: Required<StrokeOrderOptions>
  ): string {
    const delay = strokeIndex * (options.strokeDuration + options.strokeDelay);
    const duration = options.strokeDuration;

    return `  <path id="${id}" 
      kvg:type="${strokeType}" 
      d="M0,0" 
      style="stroke-dasharray: 1000; stroke-dashoffset: 1000; fill: none; stroke: #000000; stroke-width: 3; stroke-linecap: round; stroke-linejoin: round;">
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
   * Create stroke number elements
   */
  private createStrokeNumbers(code: string, strokeCount: number, strokes: any[] = []): string {
    let numbers = '';
    
    for (let i = 1; i <= strokeCount; i++) {
      const delay = (i - 1) * (this.options.strokeDuration + this.options.strokeDelay);
      
      // Calculate position for this stroke number
      let x = 50, y = 50; // Default center position
      
      if (strokes[i - 1] && strokes[i - 1].path) {
        const coords = this.calculateStrokeNumberPosition(strokes[i - 1].path, i, strokeCount);
        x = coords.x;
        y = coords.y;
      }
      
      numbers += `  <text id="kvg:${code}-n${i}" 
        x="${x}" y="${y}" 
        text-anchor="middle" 
        font-family="Arial, sans-serif" 
        font-size="12" 
        fill="#666" 
        opacity="0">
        <animate attributeName="opacity" 
          values="0;1;0" 
          dur="${this.options.strokeDuration}ms" 
          begin="${delay}ms" 
          fill="freeze" />
        ${i}
      </text>\n`;
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
