import React, { useState, useEffect, useRef } from 'react';
import { KanjiCardProps, KanjiData, AnimationOptions } from '../types';
import { KanjiInfo } from './KanjiInfo';
import { getPathLength } from '../utils/kanjiUtils';

/**
 * KanjiCard - React component for displaying and animating kanji strokes
 */
export const KanjiCard: React.FC<KanjiCardProps> = ({
  kanji,
  animationOptions,
  onAnimationComplete,
  className,
  infoPanel
}) => {
  const [kanjiData, setKanjiData] = useState<KanjiData | null>(null);
  const [currentStroke, setCurrentStroke] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [strokeAnimations, setStrokeAnimations] = useState<{[key: string]: boolean}>({});
  const animationRef = useRef<NodeJS.Timeout[]>([]);
  const strokeLengthsRef = useRef<Record<number, number>>({});
  const durationsRef = useRef<Record<number, number>>({});

  // Load kanji data and reset animation state when kanji changes
  useEffect(() => {
    // Reset animation state when kanji changes
    setCurrentStroke(0);
    setIsAnimating(false);
    setStrokeAnimations({});
    
    // Clear any pending animations and stroke lengths
    animationRef.current.forEach(timer => clearTimeout(timer));
    animationRef.current = [];
    strokeLengthsRef.current = {};
    durationsRef.current = {};
    
    const loadKanji = async () => {
      if (typeof kanji === 'string') {
        // TODO: Load from KanjiVG instance
        // For now, we'll use placeholder data
      } else {
        // Calculate stroke lengths from path data
        kanji.strokes.forEach((stroke, index) => {
          strokeLengthsRef.current[index] = getPathLength(stroke.path);
        });
        setKanjiData(kanji);
      }
    };

    loadKanji();
  }, [kanji]);

  // Start animation when data is loaded
  useEffect(() => {
    if (kanjiData && !isAnimating && currentStroke === 0 && animationOptions) {
      startAnimation();
    }

    // Cleanup timers on unmount
    return () => {
      animationRef.current.forEach(timer => clearTimeout(timer));
    };
  }, [kanjiData]);

  const startAnimation = () => {
    if (!kanjiData || !animationOptions) return;

    setIsAnimating(true);
    const strokeDelay = animationOptions.strokeDelay || 500;
    const speed = animationOptions.strokeSpeed ?? 1200; // default speed px/s if not provided
    const strokeCount = kanjiData.strokes.length;

    const runStroke = (i: number) => {
      // Reveal this stroke
      setCurrentStroke(i + 1);
      // Set initial state (dashoffset at full length)
      setStrokeAnimations(prev => ({ ...prev, [i]: true, [`${i}_animating`]: false }));

      // Compute duration from pre-calculated length and start drawing
      const raf = () => {
        const startDrawing = () => {
          const len = strokeLengthsRef.current[i] ?? 1000;
          const effectiveDuration = Math.max(1, (len / speed) * 1000);
          durationsRef.current[i] = effectiveDuration;
          setStrokeAnimations(prev => ({ ...prev, [`${i}_animating`]: true }));

          // Finish this stroke after its duration
          const finishTimer = setTimeout(() => {
            // Keep isDrawing=true so stroke stays visible after animation completes
            // Only reset isAnimating flag
            setStrokeAnimations(prev => ({ ...prev, [i]: false }));

            if (i < strokeCount - 1) {
              // Start next stroke after delay
              const delayTimer = setTimeout(() => runStroke(i + 1), strokeDelay);
              animationRef.current.push(delayTimer);
            } else {
              setIsAnimating(false);
              if (animationOptions.loop === true) {
                const restartTimer = setTimeout(() => {
                  setCurrentStroke(0);
                  setStrokeAnimations({});
                  setIsAnimating(false);
                  runStroke(0);
                }, strokeDelay);
                animationRef.current.push(restartTimer);
              } else {
                onAnimationComplete?.();
              }
            }
          }, effectiveDuration);
          animationRef.current.push(finishTimer);
        };

        if (typeof window !== 'undefined' && 'requestAnimationFrame' in window) {
          requestAnimationFrame(() => startDrawing());
        } else {
          setTimeout(startDrawing, 16);
        }
      };

      if (typeof window !== 'undefined' && 'requestAnimationFrame' in window) {
        requestAnimationFrame(() => requestAnimationFrame(raf));
      } else {
        setTimeout(raf, 16);
      }
    };

    // Kick off first stroke
    runStroke(0);
  };

  const getStrokeColor = (strokeNum: number, isRadical: boolean = false): string => {
    if (!animationOptions) return 'black';

    const colors = isRadical && animationOptions.radicalStyling
      ? animationOptions.radicalStyling.radicalColour
      : animationOptions.strokeStyling?.strokeColour;

    if (!colors) return 'black';

    if (typeof colors === 'string') {
      return colors;
    }

    if (Array.isArray(colors)) {
      return colors[(strokeNum - 1) % colors.length];
    }

    return 'black';
  };

  const getStrokeWidth = (isRadical: boolean = false): number => {
    if (!animationOptions) return 3;

    const width = isRadical && animationOptions.radicalStyling
      ? animationOptions.radicalStyling.radicalThickness
      : animationOptions.strokeStyling?.strokeThickness;

    return width || 3;
  };

  // Determine if info panel should be shown
  const shouldShowInfo = infoPanel?.showInfo ?? false;
  
  // Get info panel styling
  const getInfoPanelStyle = (): React.CSSProperties | undefined => {
    return infoPanel?.style;
  };

  // Get container style based on info panel location
  const getContainerStyle = (): React.CSSProperties => {
    if (!shouldShowInfo) {
      return {};
    }

    // Default to 'bottom' if showInfo is true but no location is specified
    const location = infoPanel?.location || 'bottom';
    switch (location) {
      case 'left':
        return { display: 'flex', flexDirection: 'row', alignItems: 'flex-start', gap: '1rem' };
      case 'right':
        return { display: 'flex', flexDirection: 'row', alignItems: 'flex-start', gap: '1rem' };
      case 'top':
        return { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' };
      case 'bottom':
        return { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' };
      default:
        return {};
    }
  };

  if (!kanjiData) {
    return (
      <div className={className}>
        <div>Loading kanji...</div>
      </div>
    );
  }

  // Default to 'bottom' if showInfo is true but no location is specified
  const effectiveLocation = shouldShowInfo ? (infoPanel?.location || 'bottom') : null;
  const renderInfoBefore = shouldShowInfo && (effectiveLocation === 'left' || effectiveLocation === 'top');
  const renderInfoAfter = shouldShowInfo && (effectiveLocation === 'right' || effectiveLocation === 'bottom');

  return (
    <div className={className || 'kanji-card'} style={getContainerStyle()}>
      {renderInfoBefore && (
        <KanjiInfo 
          kanjiData={kanjiData} 
          style={getInfoPanelStyle()} 
        />
      )}

      <svg 
        viewBox="0 0 109 109" 
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: '100%', height: 'auto' }}
      >
        {/* Trace (if enabled) */}
        {animationOptions?.showTrace && kanjiData.strokes.map((stroke, i) => {
          const traceRadius = animationOptions?.traceStyling?.traceRadius || 0;
          return (
            <path
              key={`trace-${i}`}
              d={stroke.path}
              fill="none"
              stroke={animationOptions?.traceStyling?.traceColour || '#a9a5a5'}
              strokeWidth={animationOptions?.traceStyling?.traceThickness || 2}
              strokeLinecap={traceRadius > 0 ? 'round' : 'square'}
              strokeLinejoin={traceRadius > 0 ? 'round' : 'miter'}
              opacity={0.3}
            />
          );
        })}
        
        {/* Animated strokes */}
        {kanjiData.strokes.slice(0, currentStroke).map((stroke, i) => {
          const isRadical = stroke.isRadicalStroke;
          const strokeRadius = isRadical && animationOptions?.radicalStyling
            ? animationOptions.radicalStyling.radicalRadius
            : animationOptions?.strokeStyling?.strokeRadius;
          
          const isAnimating = strokeAnimations[i] === true;
          const isDrawing = strokeAnimations[`${i}_animating`] === true;
          const totalLen = strokeLengthsRef.current[i] ?? 1000;
          const strokeDuration = durationsRef.current[i] ?? Math.max(1, (totalLen / (animationOptions?.strokeSpeed ?? 1200)) * 1000);
          
          // Stroke should be visible if currently drawing (isDrawing = true means stroke has been revealed and should stay visible)
          return (
            <path
              key={`stroke-${i}`}
              d={stroke.path}
              fill="none"
              stroke={getStrokeColor(i + 1, isRadical)}
              strokeWidth={getStrokeWidth(isRadical)}
              strokeLinecap={strokeRadius && strokeRadius > 0 ? 'round' : 'square'}
              strokeLinejoin={strokeRadius && strokeRadius > 0 ? 'round' : 'miter'}
              strokeDasharray={totalLen}
              strokeDashoffset={isDrawing ? 0 : totalLen}
              style={{
                transition: isAnimating ? `stroke-dashoffset ${strokeDuration}ms linear` : 'none'
              }}
              ref={(el) => {
                if (el) {
                  try {
                    const len = el.getTotalLength();
                    if (!Number.isNaN(len) && len > 0) {
                      strokeLengthsRef.current[i] = len;
                    }
                  } catch (_) {
                    // ignore
                  }
                }
              }}
            />
          );
        })}
        
        {/* Stroke numbers - appear progressively, remain visible */}
        {animationOptions?.showNumbers && kanjiData.strokes
          .slice(0, currentStroke)
          .map((stroke, i) => (
            <text
              key={`number-${i}`}
              x={stroke.numberPosition?.x || 0}
              y={stroke.numberPosition?.y || 0}
              fontSize={animationOptions?.numberStyling?.fontSize || 12}
              fill={animationOptions?.numberStyling?.fontColour || '#000'}
              fontWeight={animationOptions?.numberStyling?.fontWeight || 900}
            >
              {i + 1}
            </text>
          ))}
      </svg>
      
      {renderInfoAfter && (
        <KanjiInfo 
          kanjiData={kanjiData} 
          style={getInfoPanelStyle()} 
        />
      )}
    </div>
  );
};