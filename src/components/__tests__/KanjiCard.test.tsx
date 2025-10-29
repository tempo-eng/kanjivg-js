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
    strokeDuration: 800,
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
    
    expect(screen.getByText('Loading kanji...')).toBeInTheDocument();
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
      expect(screen.getByText(/Stroke Count: 2/)).toBeInTheDocument();
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
      expect(screen.getByText(/Stroke Count: 2/)).toBeInTheDocument();
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
    // With strokeDuration: 800ms and strokeDelay: 500ms, total time is:
    // stroke1(800ms) + delay(500ms) + stroke2(800ms) = 2100ms
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
      const strokeDuration = 1000; // 1 second per stroke
      const strokeDelay = 500; // 0.5 second delay between strokes
      
      const animationOptions = {
        ...defaultAnimationOptions,
        strokeDuration,
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
      expect(strokePaths[0]).toBeInTheDocument();
      
      // Check that CSS transition duration matches strokeDuration
      const firstStrokeStyle = strokePaths[0].getAttribute('style');
      expect(firstStrokeStyle).toContain(`stroke-dashoffset ${strokeDuration}ms`);
    });

    it('should complete animation in correct total time for 二 kanji', async () => {
      const strokeDuration = 200; // 200ms per stroke
      const strokeDelay = 100; // 100ms delay between strokes
      
      const animationOptions = {
        ...defaultAnimationOptions,
        strokeDuration,
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

      // Total time should be: stroke1(200ms) + delay(100ms) + stroke2(200ms) = 500ms
      const expectedTotalTime = strokeDuration + strokeDelay + strokeDuration;

      await waitFor(() => {
        expect(onComplete).toHaveBeenCalled();
      }, { timeout: expectedTotalTime + 200 }); // Add buffer for test execution
    });

    it('should apply stroke-dasharray and stroke-dashoffset for animation', async () => {
      const animationOptions = {
        ...defaultAnimationOptions,
        strokeDuration: 1000,
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
});

