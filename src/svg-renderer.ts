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
    const { strokeTypes, character, code } = kanji;
    
    this.animationState.totalStrokes = strokeTypes.length;
    this.animationState.currentStroke = 0;

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
      svg += this.createStrokeNumbers(code, strokeTypes.length);
    }

    svg += `</g>\n</svg>`;
    return svg;
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
   * Create stroke number elements
   */
  private createStrokeNumbers(code: string, strokeCount: number): string {
    let numbers = '';
    
    for (let i = 1; i <= strokeCount; i++) {
      const delay = (i - 1) * (this.options.strokeDuration + this.options.strokeDelay);
      numbers += `  <text id="kvg:${code}-n${i}" 
        x="50" y="50" 
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
