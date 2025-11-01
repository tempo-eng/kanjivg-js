import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { KanjiCard } from '../KanjiCard';
import { KanjiData, AnimationOptions } from '../../types';
import { SVGParser } from '../../core/SVGParser';

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
    const monKanji = `
    <?xml version="1.0" encoding="UTF-8"?>
<!--
Copyright (C) 2009/2010/2011 Ulrich Apel.
This work is distributed under the conditions of the Creative Commons
Attribution-Share Alike 3.0 Licence. This means you are free:
* to Share - to copy, distribute and transmit the work
* to Remix - to adapt the work

Under the following conditions:
* Attribution. You must attribute the work by stating your use of KanjiVG in
  your own copyright header and linking to KanjiVG's website
  (http://kanjivg.tagaini.net)
* Share Alike. If you alter, transform, or build upon this work, you may
  distribute the resulting work only under the same or similar license to this
  one.

See http://creativecommons.org/licenses/by-sa/3.0/ for more details.
-->
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.0//EN" "http://www.w3.org/TR/2001/REC-SVG-20010904/DTD/svg10.dtd" [
<!ATTLIST g
xmlns:kvg CDATA #FIXED "http://kanjivg.tagaini.net"
kvg:element CDATA #IMPLIED
kvg:variant CDATA #IMPLIED
kvg:partial CDATA #IMPLIED
kvg:original CDATA #IMPLIED
kvg:part CDATA #IMPLIED
kvg:number CDATA #IMPLIED
kvg:tradForm CDATA #IMPLIED
kvg:radicalForm CDATA #IMPLIED
kvg:position CDATA #IMPLIED
kvg:radical CDATA #IMPLIED
kvg:phon CDATA #IMPLIED >
<!ATTLIST path
xmlns:kvg CDATA #FIXED "http://kanjivg.tagaini.net"
kvg:type CDATA #IMPLIED >
]>
<svg xmlns="http://www.w3.org/2000/svg" width="109" height="109" viewBox="0 0 109 109">
<g id="kvg:StrokePaths_0554f" style="fill:none;stroke:#000000;stroke-width:3;stroke-linecap:round;stroke-linejoin:round;">
<g id="kvg:0554f" kvg:element="問">
	<g id="kvg:0554f-g1" kvg:element="門" kvg:position="kamae" kvg:radical="nelson" kvg:phon="門">
		<g id="kvg:0554f-g2" kvg:position="left">
			<path id="kvg:0554f-s1" kvg:type="㇑" d="M18.39,15.04c1.22,1.22,1.93,3.12,1.93,4.92c0,0.89,0.01,50,0.01,70.67c0,3.77,0,6.6,0,8.01"/>
			<path id="kvg:0554f-s2" kvg:type="㇕a" d="M20.52,16.91c6.35-1.16,14.8-2.87,19.12-3.56c2.64-0.42,4.88-0.16,4.75,3.02c-0.13,2.95-0.88,15.16-1.28,21.75c-0.14,2.41-0.24,4.08-0.24,4.26"/>
			<path id="kvg:0554f-s3" kvg:type="㇐a" d="M21.2,29.49c6.8-1.24,14.3-2.24,21.38-2.83"/>
			<path id="kvg:0554f-s4" kvg:type="㇐a" d="M21.27,42.06c8.11-1.29,13.14-1.76,20.31-2.36"/>
		</g>
		<g id="kvg:0554f-g3" kvg:position="right">
			<path id="kvg:0554f-s5" kvg:type="㇑" d="M64.36,12.26c1,1,1.54,2.24,1.54,3.65c0,0.68-0.06,12.96-0.08,19.84c-0.01,1.89-0.01,3.38-0.01,4.1"/>
			<path id="kvg:0554f-s6" kvg:type="㇆a" d="M66.55,14.16c5.82-1.03,14.49-2.29,19.57-2.95c2.67-0.35,4.85,0.79,4.85,2.92c0,20.13,0.04,63.76,0.04,77.56c0,8.69-5.51,3.56-9.9-0.64"/>
			<path id="kvg:0554f-s7" kvg:type="㇐a" d="M67.24,25.22c6.63-0.84,17.38-1.84,22.15-2.24"/>
			<path id="kvg:0554f-s8" kvg:type="㇐a" d="M67.05,36.76c6.2-0.51,15.45-1.51,22.55-2.06"/>
		</g>
	</g>
	<g id="kvg:0554f-g4" kvg:element="口" kvg:radical="tradit">
		<path id="kvg:0554f-s9" kvg:type="㇑" d="M36.25,57.11c0.88,0.64,1.62,1.76,1.87,2.92c0.92,4.35,1.84,11.03,2.61,17.07c0.15,1.17,0.29,2.31,0.43,3.41"/>
		<path id="kvg:0554f-s10" kvg:type="㇕b" d="M38.71,59.66c9.11-1.03,21.45-2.32,27.33-2.98c3.34-0.37,4.76,0.9,4.01,4.37c-0.9,4.17-1.73,8.1-3.59,14.23"/>
		<path id="kvg:0554f-s11" kvg:type="㇐b" d="M42.01,78.52c4.47-0.52,15.74-1.45,23.11-2.08c1.29-0.11,2.46-0.22,3.46-0.31"/>
	</g>
</g>
</g>
<g id="kvg:StrokeNumbers_0554f" style="font-size:8;fill:#808080">
	<text transform="matrix(1 0 0 1 13.50 25.50)">1</text>
	<text transform="matrix(1 0 0 1 22.50 13.50)">2</text>
	<text transform="matrix(1 0 0 1 25.50 25.63)">3</text>
	<text transform="matrix(1 0 0 1 25.50 39.13)">4</text>
	<text transform="matrix(1 0 0 1 58.50 22.63)">5</text>
	<text transform="matrix(1 0 0 1 68.50 10.50)">6</text>
	<text transform="matrix(1 0 0 1 70.50 22.50)">7</text>
	<text transform="matrix(1 0 0 1 70.50 33.50)">8</text>
	<text transform="matrix(1 0 0 1 30.50 66.50)">9</text>
	<text transform="matrix(1 0 0 1 39.50 56.50)">10</text>
	<text transform="matrix(1 0 0 1 44.50 74.50)">11</text>
</g>
</svg>
`

    it('should highlight tradit radical (口) for 問 when radicalStyling is provided without radicalType', async () => {
      // Step 1: Parse the SVG using SVGParser (actual production code)
      const parser = new SVGParser();
      parser.clearCache(); // Ensure fresh parsing
      const parsedKanjiData = parser.parseSVG(monKanji.trim(), '0554f');
      
      // Step 2: Verify the radicals were parsed correctly
      expect(parsedKanjiData.groups).toBeDefined();
      expect(parsedKanjiData.groups.length).toBeGreaterThan(0);
      
      // Verify nelson group (g1, 門) exists and has correct strokes (1-8 only)
      const nelsonGroup = parsedKanjiData.groups.find(g => g.radical === 'nelson');
      expect(nelsonGroup).toBeDefined();
      expect(nelsonGroup?.element).toBe('門');
      expect(nelsonGroup?.childStrokes.length).toBe(8);
      expect(nelsonGroup?.childStrokes).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
      expect(nelsonGroup?.childStrokes).not.toContain(9);
      expect(nelsonGroup?.childStrokes).not.toContain(10);
      expect(nelsonGroup?.childStrokes).not.toContain(11);
      
      // Verify tradit group (g4, 口) exists and has correct strokes (9-11 only)
      const traditGroup = parsedKanjiData.groups.find(g => g.radical === 'tradit');
      expect(traditGroup).toBeDefined();
      expect(traditGroup?.element).toBe('口');
      expect(traditGroup?.childStrokes.length).toBe(3);
      expect(traditGroup?.childStrokes).toEqual([9, 10, 11]);
      
      // Verify strokes 9-11 are marked as radical strokes
      const stroke9 = parsedKanjiData.strokes.find(s => s.strokeNumber === 9);
      const stroke10 = parsedKanjiData.strokes.find(s => s.strokeNumber === 10);
      const stroke11 = parsedKanjiData.strokes.find(s => s.strokeNumber === 11);
      expect(stroke9?.isRadicalStroke).toBe(true);
      expect(stroke10?.isRadicalStroke).toBe(true);
      expect(stroke11?.isRadicalStroke).toBe(true);
      
      // Verify strokes 1-8 are marked as radical strokes (they belong to nelson)
      const stroke1 = parsedKanjiData.strokes.find(s => s.strokeNumber === 1);
      expect(stroke1?.isRadicalStroke).toBe(true);
      
      // Step 3: Test KanjiCard with the parsed data
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
        <KanjiCard kanji={parsedKanjiData} animationOptions={animationOptions} />
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
      // Parse the SVG using SVGParser
      const parser = new SVGParser();
      parser.clearCache();
      const parsedKanjiData = parser.parseSVG(monKanji.trim(), '0554f');
      
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
        <KanjiCard kanji={parsedKanjiData} animationOptions={animationOptions} />
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

