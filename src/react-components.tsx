import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  KanjiInfo, 
  StrokeOrderOptions, 
  AnimationState, 
  KanjiSVGProps, 
  KanjiCardProps 
} from './types';
import { SVGRenderer } from './svg-renderer';

/**
 * React component for rendering kanji with stroke order animation
 */
export const KanjiSVG: React.FC<KanjiSVGProps> = ({
  kanji,
  options = {},
  autoPlay = false,
  onAnimationStateChange,
  className,
  style
}) => {
  const [renderer] = useState(() => new SVGRenderer(options));
  const [svgContent, setSvgContent] = useState('');
  const [animationState, setAnimationState] = useState<AnimationState>({
    currentStroke: 0,
    isPlaying: false,
    isPaused: false,
    totalStrokes: 0,
    progress: 0
  });

  const containerRef = useRef<HTMLDivElement>(null);

  // Update SVG content when kanji or options change
  useEffect(() => {
    const newSvgContent = renderer.render(kanji, options);
    setSvgContent(newSvgContent);
  }, [kanji, options, renderer]);

  // Auto-play animation if enabled
  useEffect(() => {
    if (autoPlay && kanji) {
      renderer.startAnimation(kanji, (state) => {
        setAnimationState(state);
        onAnimationStateChange?.(state);
      });
    }

    return () => {
      renderer.stopAnimation();
    };
  }, [autoPlay, kanji, renderer, onAnimationStateChange]);


  return (
    <div ref={containerRef} className={className} style={style}>
      <div dangerouslySetInnerHTML={{ __html: svgContent }} />
    </div>
  );
};




/**
 * React component for displaying a complete kanji card with animation and info
 */
export const KanjiCard: React.FC<KanjiCardProps> = ({
  kanji,
  animationOptions = {},
  showInfo = true,
  className
}) => {
  return (
    <div className={`kanjivg-card ${className || ''}`}>
      <div className="kanjivg-kanji-display">
        <KanjiSVG
          kanji={kanji}
          options={animationOptions}
        />
      </div>

      {showInfo && (
        <div className="kanjivg-info">
          <h3 className="kanjivg-character">{kanji.character}</h3>
          <div className="kanjivg-details">
            <p><strong>Code:</strong> U+{kanji.code.toUpperCase()}</p>
            <p><strong>Strokes:</strong> {kanji.strokeCount}</p>
            {kanji.components.length > 0 && (
              <div className="kanjivg-components">
                <strong>Components:</strong>
                <ul>
                  {kanji.components.map((comp, index) => (
                    <li key={index}>
                      {comp.element}
                      {comp.position && ` (${comp.position})`}
                      {comp.isRadical && ' [Radical]'}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Hook for using KanjiVG in React components
 */
export const useKanjiVG = (kanji: KanjiInfo, options: StrokeOrderOptions = {}) => {
  const [renderer] = useState(() => new SVGRenderer(options));
  const [animationState, setAnimationState] = useState<AnimationState>({
    currentStroke: 0,
    isPlaying: false,
    isPaused: false,
    totalStrokes: 0,
    progress: 0
  });

  const svgContent = renderer.render(kanji, options);

  return {
    svgContent,
    animationState
  };
};

