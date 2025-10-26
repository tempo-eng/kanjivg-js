import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  KanjiInfo, 
  StrokeOrderOptions, 
  AnimationState, 
  KanjiSVGProps, 
  KanjiAnimationControlsProps, 
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

  const handleStart = useCallback(() => {
    renderer.startAnimation(kanji, (state) => {
      setAnimationState(state);
      onAnimationStateChange?.(state);
    });
  }, [kanji, renderer, onAnimationStateChange]);

  const handlePause = useCallback(() => {
    renderer.pauseAnimation();
    setAnimationState(renderer.getAnimationState());
  }, [renderer]);

  const handleResume = useCallback(() => {
    renderer.resumeAnimation(kanji, (state) => {
      setAnimationState(state);
      onAnimationStateChange?.(state);
    });
  }, [kanji, renderer, onAnimationStateChange]);

  const handleStop = useCallback(() => {
    renderer.stopAnimation();
    setAnimationState(renderer.getAnimationState());
  }, [renderer]);

  return (
    <div ref={containerRef} className={className} style={style}>
      <div dangerouslySetInnerHTML={{ __html: svgContent }} />
    </div>
  );
};


/**
 * React component for controlling kanji animation
 */
export const KanjiAnimationControls: React.FC<KanjiAnimationControlsProps> = ({
  animationState,
  onStart,
  onPause,
  onResume,
  onStop,
  className,
  showProgress = true
}) => {
  return (
    <div className={`kanjivg-controls ${className || ''}`}>
      <div className="kanjivg-buttons">
        {!animationState.isPlaying && !animationState.isPaused && (
          <button onClick={onStart} className="kanjivg-btn kanjivg-btn-start">
            ▶️ Start
          </button>
        )}
        
        {animationState.isPlaying && (
          <button onClick={onPause} className="kanjivg-btn kanjivg-btn-pause">
            ⏸️ Pause
          </button>
        )}
        
        {animationState.isPaused && (
          <button onClick={onResume} className="kanjivg-btn kanjivg-btn-resume">
            ▶️ Resume
          </button>
        )}
        
        {(animationState.isPlaying || animationState.isPaused) && (
          <button onClick={onStop} className="kanjivg-btn kanjivg-btn-stop">
            ⏹️ Stop
          </button>
        )}
      </div>

      {showProgress && (
        <div className="kanjivg-progress">
          <div className="kanjivg-progress-bar">
            <div 
              className="kanjivg-progress-fill"
              style={{ width: `${animationState.progress * 100}%` }}
            />
          </div>
          <span className="kanjivg-progress-text">
            {animationState.currentStroke} / {animationState.totalStrokes}
          </span>
        </div>
      )}
    </div>
  );
};


/**
 * React component for displaying a complete kanji card with animation and info
 */
export const KanjiCard: React.FC<KanjiCardProps> = ({
  kanji,
  animationOptions = {},
  showControls = true,
  showInfo = true,
  className
}) => {
  const [animationState, setAnimationState] = useState<AnimationState>({
    currentStroke: 0,
    isPlaying: false,
    isPaused: false,
    totalStrokes: 0,
    progress: 0
  });

  const [renderer] = useState(() => new SVGRenderer(animationOptions));

  const handleStart = useCallback(() => {
    renderer.startAnimation(kanji, setAnimationState);
  }, [kanji, renderer]);

  const handlePause = useCallback(() => {
    renderer.pauseAnimation();
    setAnimationState(renderer.getAnimationState());
  }, [renderer]);

  const handleResume = useCallback(() => {
    renderer.resumeAnimation(kanji, setAnimationState);
  }, [kanji, renderer]);

  const handleStop = useCallback(() => {
    renderer.stopAnimation();
    setAnimationState(renderer.getAnimationState());
  }, [renderer]);

  return (
    <div className={`kanjivg-card ${className || ''}`}>
      <div className="kanjivg-kanji-display">
        <KanjiSVG
          kanji={kanji}
          options={animationOptions}
          onAnimationStateChange={setAnimationState}
        />
      </div>

      {showControls && (
        <KanjiAnimationControls
          animationState={animationState}
          onStart={handleStart}
          onPause={handlePause}
          onResume={handleResume}
          onStop={handleStop}
        />
      )}

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

  const startAnimation = useCallback(() => {
    renderer.startAnimation(kanji, setAnimationState);
  }, [kanji, renderer]);

  const pauseAnimation = useCallback(() => {
    renderer.pauseAnimation();
    setAnimationState(renderer.getAnimationState());
  }, [renderer]);

  const resumeAnimation = useCallback(() => {
    renderer.resumeAnimation(kanji, setAnimationState);
  }, [kanji, renderer]);

  const stopAnimation = useCallback(() => {
    renderer.stopAnimation();
    setAnimationState(renderer.getAnimationState());
  }, [renderer]);

  const svgContent = renderer.render(kanji, options);

  return {
    svgContent,
    animationState,
    startAnimation,
    pauseAnimation,
    resumeAnimation,
    stopAnimation
  };
};

