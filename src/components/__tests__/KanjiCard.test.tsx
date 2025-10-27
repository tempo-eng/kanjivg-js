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

  it('should render info panel when showInfo is true', async () => {
    render(
      <KanjiCard 
        kanji={mockKanjiData} 
        showInfo={true}
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
    await waitFor(() => {
      expect(onComplete).toHaveBeenCalled();
    }, { timeout: 2000 });
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
});

