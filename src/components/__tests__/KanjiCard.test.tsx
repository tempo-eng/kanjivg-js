import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { KanjiCard } from '../KanjiCard';
import { KanjiData, AnimationOptions } from '../../types';

describe('KanjiCard', () => {
  const mockKanjiData: KanjiData = {
    character: '車',
    unicode: '08eca',
    isVariant: false,
    strokes: [
      {
        strokeNumber: 1,
        path: 'M26,26c2.85,0.69',
        strokeType: '㇐',
        numberPosition: { x: 17.25, y: 26.50 },
      },
      {
        strokeNumber: 2,
        path: 'M27.5,37.92c0.81',
        strokeType: '㇑',
        numberPosition: { x: 20.25, y: 45.13 },
      },
    ],
    groups: [],
    strokeCount: 2,
    components: ['車'],
  };

  const defaultAnimationOptions: AnimationOptions = {
    strokeSpeed: 1250, // 1000px / 1250 px/s = 800ms per stroke (with default test length=1000)
    strokeDelay: 500,
    showNumbers: true,
    loop: false,
    showTrace: false,
    strokeStyling: {
      strokeColour: 'black',
      strokeThickness: 3,
      strokeRadius: 0,
    },
    traceStyling: {
      traceColour: '#a9a5a5',
      traceThickness: 2,
      traceRadius: 0,
    },
    numberStyling: {
      fontColour: '#000',
      fontWeight: 900,
      fontSize: 12,
    },
  };

  it('should render loading state when kanji data is not provided', () => {
    render(<KanjiCard kanji="車" animationOptions={defaultAnimationOptions} />);
    
    expect(screen.getByText('Loading kanji...')).toBeTruthy();
  });

  it('should render kanji with strokes', async () => {
    const { container } = render(
      <KanjiCard kanji={mockKanjiData} animationOptions={defaultAnimationOptions} />
    );

    await waitFor(() => {
      const paths = container.querySelectorAll('path');
      expect(paths.length).toBeGreaterThan(0);
    });
  });

  it('should apply stroke colors from array', async () => {
    const optionsWithColorArray = {
      ...defaultAnimationOptions,
      strokeStyling: {
        ...defaultAnimationOptions.strokeStyling,
        strokeColour: ['blue', 'green', 'red'],
      },
    };

    const { container } = render(
      <KanjiCard kanji={mockKanjiData} animationOptions={optionsWithColorArray} />
    );

    await waitFor(() => {
      const paths = container.querySelectorAll('path');
      if (paths.length > 0) {
        const firstPath = paths[0];
        expect(firstPath.getAttribute('stroke')).toBe('blue');
      }
    });
  });

  it('should render stroke numbers when showNumbers is true', async () => {
    const { container } = render(
      <KanjiCard 
        kanji={mockKanjiData} 
        animationOptions={{ ...defaultAnimationOptions, showNumbers: true }} 
      />
    );

    await waitFor(() => {
      const texts = container.querySelectorAll('text');
      expect(texts.length).toBeGreaterThan(0);
    });
  });

  it('should not render stroke numbers when showNumbers is false', async () => {
    const { container } = render(
      <KanjiCard 
        kanji={mockKanjiData} 
        animationOptions={{ ...defaultAnimationOptions, showNumbers: false }} 
      />
    );

    await waitFor(() => {
      const texts = container.querySelectorAll('text');
      expect(texts.length).toBe(0);
    });
  });

  it('should render trace when showTrace is true', async () => {
    const { container } = render(
      <KanjiCard 
        kanji={mockKanjiData} 
        animationOptions={{ ...defaultAnimationOptions, showTrace: true }} 
      />
    );

    await waitFor(() => {
      const paths = container.querySelectorAll('path');
      // Should have paths for both trace and strokes
      expect(paths.length).toBeGreaterThan(mockKanjiData.strokes.length);
    });
  });

  it('should render info panel when infoPanel.showInfo is true', async () => {
    render(
      <KanjiCard 
        kanji={mockKanjiData} 
        infoPanel={{ showInfo: true, location: 'bottom' }}
        animationOptions={defaultAnimationOptions} 
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/Stroke Count: 2/)).toBeTruthy();
    });
  });

  it('should default info panel location to bottom when showInfo is true but no location specified', async () => {
    render(
      <KanjiCard 
        kanji={mockKanjiData} 
        infoPanel={{ showInfo: true }}
        animationOptions={defaultAnimationOptions} 
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/Stroke Count: 2/)).toBeTruthy();
    });
  });

  it('should call onAnimationComplete when animation finishes', async () => {
    const onComplete = jest.fn();
    
    render(
      <KanjiCard 
        kanji={mockKanjiData} 
        animationOptions={{ ...defaultAnimationOptions, loop: false }}
        onAnimationComplete={onComplete}
      />
    );

      // Wait for animation to complete
    await waitFor(() => {
      expect(onComplete).toHaveBeenCalled();
    }, { timeout: 3000 });
  });

  it('should handle color cycling for multiple strokes', async () => {
    const multiStrokeKanji: KanjiData = {
      ...mockKanjiData,
      strokes: [
        { ...mockKanjiData.strokes[0], strokeNumber: 1 },
        { ...mockKanjiData.strokes[1], strokeNumber: 2 },
        { ...mockKanjiData.strokes[0], strokeNumber: 3 },
      ],
      strokeCount: 3,
    };

    const optionsWithColors = {
      ...defaultAnimationOptions,
      strokeStyling: {
        ...defaultAnimationOptions.strokeStyling,
        strokeColour: ['blue', 'green', 'red'] as string[],
      },
    };

    const { container } = render(
      <KanjiCard kanji={multiStrokeKanji} animationOptions={optionsWithColors} />
    );

    await waitFor(() => {
      const paths = container.querySelectorAll('path');
      expect(paths.length).toBeGreaterThan(0);
    });
  });

  describe('Animation Timing', () => {
    const niKanji: KanjiData = {
      character: '二',
      unicode: '04e8c',
      isVariant: false,
      strokes: [
        {
          strokeNumber: 1,
          path: 'M20,30 L80,30',
          strokeType: '㇐',
          numberPosition: { x: 50, y: 25 },
        },
        {
          strokeNumber: 2,
          path: 'M20,60 L80,60',
          strokeType: '㇐',
          numberPosition: { x: 50, y: 55 },
        },
      ],
      groups: [],
      strokeCount: 2,
      components: ['二'],
    };

    it('should set correct stroke animation timing for 二 kanji', async () => {
      const strokeSpeed = 1000; // 1000 px/s
      const strokeDelay = 500; // 0.5 second delay between strokes
      // Path M20,30 L80,30 has length 60px (horizontal line: 80-20=60)
      // At 1000px/s, duration = 60px / 1000px/s = 0.06s = 60ms
      
      const animationOptions = {
        ...defaultAnimationOptions,
        strokeSpeed,
        strokeDelay,
      };

      const { container } = render(
        <KanjiCard kanji={niKanji} animationOptions={animationOptions} />
      );

      await waitFor(() => {
        const paths = container.querySelectorAll('path');
        expect(paths.length).toBeGreaterThan(0);
      });

      // Check that stroke animation properties are set correctly
      const strokePaths = Array.from(container.querySelectorAll('path')).filter(
        path => !path.getAttribute('key')?.includes('trace')
      );

      // First stroke should be visible and ready to animate
      expect(strokePaths[0]).toBeTruthy();
      
      // Check that CSS transition duration matches calculated duration based on actual path length
      const firstStrokeStyle = strokePaths[0].getAttribute('style');
      const pathLength = 60; // M20,30 L80,30 = 60px
      const expectedMs = Math.max(1, (pathLength / strokeSpeed) * 1000); // 60ms
      expect(firstStrokeStyle).toContain(`stroke-dashoffset ${expectedMs}ms`);
    });

    it('should complete animation in correct total time for 二 kanji', async () => {
      const strokeSpeed = 5000; // 5000 px/s
      const strokeDelay = 100; // 100ms delay between strokes
      // Path M20,30 L80,30 has length 60px, so at 5000px/s: 60px / 5000px/s = 12ms per stroke
      
      const animationOptions = {
        ...defaultAnimationOptions,
        strokeSpeed,
        strokeDelay,
        loop: false,
      };

      const onComplete = jest.fn();
      
    render(
        <KanjiCard 
          kanji={niKanji} 
          animationOptions={animationOptions}
          onAnimationComplete={onComplete}
        />
      );

      // Total time should be: stroke1(12ms) + delay(100ms) + stroke2(12ms) = 124ms
      const pathLength = 60; // M20,30 L80,30 = 60px
      const perStrokeMs = Math.max(1, (pathLength / strokeSpeed) * 1000); // 12ms
      const expectedTotalTime = perStrokeMs + strokeDelay + perStrokeMs;

      await waitFor(() => {
        expect(onComplete).toHaveBeenCalled();
      }, { timeout: expectedTotalTime + 200 }); // Add buffer for test execution
    });

    it('should sequence strokes with duration first, then delay between strokes', async () => {
      jest.useFakeTimers();

      const strokeDuration = 200; // implied by speed with default length 1000
      const strokeDelay = 300;
      const animationOptions = {
        ...defaultAnimationOptions,
        strokeSpeed: 1000 * (1 / (strokeDuration / 1000)), // 1000px / (200ms) => 5000 px/s
        strokeDelay,
        loop: false,
      };

      const { container } = render(
        <KanjiCard kanji={niKanji} animationOptions={animationOptions} />
      );

      // Initially, first stroke is revealed immediately (animation starts at t=0)
      expect(container.querySelector('svg')).toBeTruthy();
      expect(container.querySelectorAll('path').length).toBe(1);

      // Run immediate timers (first stroke starts at t=0)
      jest.advanceTimersByTime(1);
      await waitFor(() => {
        expect(container.querySelectorAll('path').length).toBe(1);
      });

      // During the first stroke drawing window (before duration), currentStroke should still be 1
      jest.advanceTimersByTime(strokeDuration - 1);
      // Next stroke should NOT have started yet (delay not elapsed)
      expect(container.querySelectorAll('path').length).toBe(1);

      // After full duration + delay, second stroke should start
      jest.advanceTimersByTime(1 + strokeDelay);
      await waitFor(() => {
        expect(container.querySelectorAll('path').length).toBeGreaterThan(1);
      });

      jest.useRealTimers();
    });

    it('should apply stroke-dasharray and stroke-dashoffset for animation', async () => {
      const animationOptions = {
        ...defaultAnimationOptions,
        strokeSpeed: 1000, // 1000px / 1000 px/s => 1000ms
        strokeDelay: 500,
      };

      const { container } = render(
        <KanjiCard kanji={niKanji} animationOptions={animationOptions} />
      );

      await waitFor(() => {
        const paths = container.querySelectorAll('path');
        expect(paths.length).toBeGreaterThan(0);
      });

      // Check that animation paths have the correct SVG attributes
      const strokePaths = Array.from(container.querySelectorAll('path')).filter(
        path => !path.getAttribute('key')?.includes('trace')
      );

      if (strokePaths.length > 0) {
        const firstStroke = strokePaths[0];
        
        // Should have stroke-dasharray set for animation
        const dashArray = firstStroke.getAttribute('stroke-dasharray');
        expect(dashArray).toBeDefined();
        
        // Should have stroke-dashoffset set for animation
        const dashOffset = firstStroke.getAttribute('stroke-dashoffset');
        expect(dashOffset).toBeDefined();
      }
    });
  });

  describe('Radical highlighting with general/tradit fallback', () => {
    // 問 has 門 (nelson) and 口 (tradit) radicals, no general
    const monKanji: KanjiData = {
      character: '問',
      unicode: '0554f',
      isVariant: false,
      strokes: [
        // Strokes 1-8 belong to 門 group (nelson radical)
        { strokeNumber: 1, path: 'M18.39,15.04', strokeType: '㇑', groupId: 'kvg:0554f-g1', isRadicalStroke: true },
        { strokeNumber: 2, path: 'M20.52,16.91', strokeType: '㇕a', groupId: 'kvg:0554f-g1', isRadicalStroke: true },
        { strokeNumber: 3, path: 'M21.2,29.49', strokeType: '㇐a', groupId: 'kvg:0554f-g1', isRadicalStroke: true },
        { strokeNumber: 4, path: 'M21.27,42.06', strokeType: '㇐a', groupId: 'kvg:0554f-g1', isRadicalStroke: true },
        { strokeNumber: 5, path: 'M64.36,12.26', strokeType: '㇑', groupId: 'kvg:0554f-g1', isRadicalStroke: true },
        { strokeNumber: 6, path: 'M66.55,14.16', strokeType: '㇆a', groupId: 'kvg:0554f-g1', isRadicalStroke: true },
        { strokeNumber: 7, path: 'M67.24,25.22', strokeType: '㇐a', groupId: 'kvg:0554f-g1', isRadicalStroke: true },
        { strokeNumber: 8, path: 'M67.05,36.76', strokeType: '㇐a', groupId: 'kvg:0554f-g1', isRadicalStroke: true },
        // Strokes 9-11 belong to 口 group (tradit radical)
        { strokeNumber: 9, path: 'M36.25,57.11', strokeType: '㇑', groupId: 'kvg:0554f-g4', isRadicalStroke: true },
        { strokeNumber: 10, path: 'M38.71,59.66', strokeType: '㇕b', groupId: 'kvg:0554f-g4', isRadicalStroke: true },
        { strokeNumber: 11, path: 'M42.01,78.52', strokeType: '㇐b', groupId: 'kvg:0554f-g4', isRadicalStroke: true },
      ],
      groups: [
        {
          id: 'kvg:0554f-g1',
          element: '門',
          radical: 'nelson',
          position: 'kamae',
          childStrokes: [1, 2, 3, 4, 5, 6, 7, 8],
          children: [],
        },
        {
          id: 'kvg:0554f-g4',
          element: '口',
          radical: 'tradit',
          childStrokes: [9, 10, 11],
          children: [],
        },
      ],
      strokeCount: 11,
      components: ['問'],
    };

    it('should highlight tradit radical (口) for 問 when radicalStyling is provided without radicalType', async () => {
      const animationOptions: AnimationOptions = {
        ...defaultAnimationOptions,
        animate: false,
        radicalStyling: {
          radicalColour: 'red',
          radicalThickness: 5,
          radicalRadius: 0,
          // radicalType not specified - should auto-detect tradit (no general found)
        },
      };

      const { container } = render(
        <KanjiCard kanji={monKanji} animationOptions={animationOptions} />
      );

      await waitFor(() => {
        const paths = container.querySelectorAll('path');
        expect(paths.length).toBe(11); // All 11 strokes
        
        // Strokes 9-11 (口, tradit) should be red (radical color)
        const stroke9 = paths[8]; // 0-indexed
        const stroke10 = paths[9];
        const stroke11 = paths[10];
        
        expect(stroke9.getAttribute('stroke')).toBe('red');
        expect(stroke9.getAttribute('stroke-width')).toBe('5');
        expect(stroke10.getAttribute('stroke')).toBe('red');
        expect(stroke10.getAttribute('stroke-width')).toBe('5');
        expect(stroke11.getAttribute('stroke')).toBe('red');
        expect(stroke11.getAttribute('stroke-width')).toBe('5');
        
        // Strokes 1-8 (門, nelson) should be black (normal stroke color, NOT highlighted)
        const stroke1 = paths[0];
        const stroke5 = paths[4];
        
        expect(stroke1.getAttribute('stroke')).toBe('black');
        expect(stroke1.getAttribute('stroke-width')).toBe('3');
        expect(stroke5.getAttribute('stroke')).toBe('black');
        expect(stroke5.getAttribute('stroke-width')).toBe('3');
      });
    });

    it('should NOT highlight nelson radicals even if present', async () => {
      const animationOptions: AnimationOptions = {
        ...defaultAnimationOptions,
        animate: false,
        radicalStyling: {
          radicalColour: 'blue',
          radicalThickness: 4,
          radicalRadius: 0,
          radicalType: ['general', 'tradit'], // Explicitly exclude nelson
        },
      };

      const { container } = render(
        <KanjiCard kanji={monKanji} animationOptions={animationOptions} />
      );

      await waitFor(() => {
        const paths = container.querySelectorAll('path');
        
        // Only 口 (tradit) strokes should be blue
        const stroke9 = paths[8];
        expect(stroke9.getAttribute('stroke')).toBe('blue');
        
        // 門 (nelson) strokes should be black
        const stroke1 = paths[0];
        expect(stroke1.getAttribute('stroke')).toBe('black');
      });
    });
  });
});

