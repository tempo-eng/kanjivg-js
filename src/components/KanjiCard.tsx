import React, { useState, useEffect, useRef } from 'react';
import { KanjiCardProps, KanjiData, AnimationOptions } from '../types';
import { KanjiInfo } from './KanjiInfo';

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

  // Load kanji data and reset animation state when kanji changes
  useEffect(() => {
    // Reset animation state when kanji changes
    setCurrentStroke(0);
    setIsAnimating(false);
    setStrokeAnimations({});
    
    // Clear any pending animations
    animationRef.current.forEach(timer => clearTimeout(timer));
    animationRef.current = [];
    
    const loadKanji = async () => {
      if (typeof kanji === 'string') {
        // TODO: Load from KanjiVG instance
        // For now, we'll use placeholder data
        console.log('Loading kanji:', kanji);
      } else {
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
    const strokeDuration = animationOptions.strokeDuration || 800;
    const strokeCount = kanjiData.strokes.length;

    // Animate each stroke
    for (let i = 0; i < strokeCount; i++) {
      // Start time for this stroke: i * (strokeDuration + strokeDelay)
      const strokeStartTime = i * (strokeDuration + strokeDelay);
      
      // Start drawing this stroke
      const startTimer = setTimeout(() => {
        setCurrentStroke(i + 1);
        setStrokeAnimations(prev => ({ ...prev, [i]: true }));
        
        // Trigger the CSS animation by updating strokeDashoffset after a brief delay
        setTimeout(() => {
          setStrokeAnimations(prev => ({ ...prev, [`${i}_animating`]: true }));
        }, 10);
      }, strokeStartTime);
      
      animationRef.current.push(startTimer);
      
      // Finish drawing this stroke after strokeDuration
      const finishTimer = setTimeout(() => {
        setStrokeAnimations(prev => ({ ...prev, [i]: false, [`${i}_animating`]: false }));
        
        // Check if this is the last stroke
        if (i === strokeCount - 1) {
          setIsAnimating(false);
          if (animationOptions.loop !== true) {
            onAnimationComplete?.();
          }
        }
      }, strokeStartTime + strokeDuration);
      
      animationRef.current.push(finishTimer);
    }

    // Handle looping
    if (animationOptions.loop) {
      const totalDuration = strokeCount * (strokeDuration + strokeDelay);
      const loopTimer = setTimeout(() => {
        setCurrentStroke(0);
        setIsAnimating(false);
        setStrokeAnimations({});
        startAnimation();
      }, totalDuration);
      animationRef.current.push(loopTimer);
    }
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
          const strokeDuration = animationOptions?.strokeDuration || 800;
          
          return (
            <path
              key={`stroke-${i}`}
              d={stroke.path}
              fill="none"
              stroke={getStrokeColor(i + 1, isRadical)}
              strokeWidth={getStrokeWidth(isRadical)}
              strokeLinecap={strokeRadius && strokeRadius > 0 ? 'round' : 'square'}
              strokeLinejoin={strokeRadius && strokeRadius > 0 ? 'round' : 'miter'}
              strokeDasharray={isAnimating ? "1000" : "0"}
              strokeDashoffset={isDrawing ? "0" : "1000"}
              style={{
                transition: isAnimating ? `stroke-dashoffset ${strokeDuration}ms linear` : 'none'
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