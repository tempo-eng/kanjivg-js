/**
 * Test for styling options functionality
 * 
 * This test verifies that all styling options work correctly:
 * - Stroke styling with single colors and color arrays
 * - Radical styling that overrides stroke colors
 * - Trace styling with custom colors and thickness
 * - Combined styling scenarios
 */

import { KanjiVG } from '../kanjivg';
import { SVGRenderer } from '../svg-renderer';
import { KanjiInfo, KanjiData } from '../types';

describe('Styling Options', () => {
  let kanjivg: KanjiVG;
  let svgRenderer: SVGRenderer;
  let kinKanji: KanjiInfo | null;
  let kinKanjiAne: KanjiInfo | null; // 姉 (older sister)
  let tenKanji: KanjiInfo | null; // 転 (turn/change)

  beforeAll(async () => {
    // Load the KanjiVG data using the same approach as existing tests
    const data = await import('../../data/kanjivg-data.json');
    kanjivg = new KanjiVG(data.default as KanjiData);
    svgRenderer = new SVGRenderer();
    
    // Get test kanji
    const results = await kanjivg.search('金');
    kinKanji = results.length > 0 ? results[0] : null;
    
    // Get specific kanji for radical testing
    kinKanjiAne = await kanjivg.lookup('姉');
    tenKanji = await kanjivg.lookup('転');
    
    expect(kinKanji).toBeTruthy();
    expect(kinKanjiAne).toBeTruthy();
    expect(tenKanji).toBeTruthy();
  });

  beforeEach(() => {
    svgRenderer = new SVGRenderer();
  });

  describe('Stroke Styling', () => {
    test('should apply single stroke color to all strokes', () => {
      if (!kinKanji) return;
      
      const svg = svgRenderer.render(kinKanji, {
        strokeStyling: {
          strokeColour: '#ff0000',
          strokeThickness: 5,
          strokeRadius: 2
        }
      });
      
      // Check that all strokes use the red color
      expect(svg).toContain('stroke: #ff0000');
      expect(svg).toContain('stroke-width: 5');
    });

    test('should cycle through stroke colors array', () => {
      if (!kinKanji) return;
      
      const svg = svgRenderer.render(kinKanji, {
        strokeStyling: {
          strokeColour: ['#ff0000', '#00ff00', '#0000ff'],
          strokeThickness: 4,
          strokeRadius: 1
        }
      });
      
      // Check that different colors are used
      expect(svg).toContain('stroke: #ff0000');
      expect(svg).toContain('stroke: #00ff00');
      expect(svg).toContain('stroke: #0000ff');
      expect(svg).toContain('stroke-width: 4');
    });

    test('should use default stroke styling when not specified', () => {
      if (!kinKanji) return;
      
      const svg = svgRenderer.render(kinKanji);
      
      // Should use default black color and thickness
      expect(svg).toContain('stroke: #000000');
      expect(svg).toContain('stroke-width: 3');
    });
  });

  describe('Radical Styling', () => {
    test('should override stroke colors with single radical color', () => {
      if (!kinKanji) return;
      
      const svg = svgRenderer.render(kinKanji, {
        strokeStyling: {
          strokeColour: ['#ff0000', '#00ff00', '#0000ff'],
          strokeThickness: 3,
          strokeRadius: 0
        },
        radicalStyling: {
          radicalColour: '#purple'
        }
      });
      
      // Should use radical color instead of stroke colors
      expect(svg).toContain('stroke: #purple');
      expect(svg).not.toContain('stroke: #ff0000');
    });

    test('should cycle through radical colors array', () => {
      if (!kinKanji) return;
      
      const svg = svgRenderer.render(kinKanji, {
        radicalStyling: {
          radicalColour: ['#ff0000', '#00ff00']
        }
      });
      
      // Should use radical colors
      expect(svg).toContain('stroke: #ff0000');
      expect(svg).toContain('stroke: #00ff00');
    });
  });

  describe('Trace Styling', () => {
    test('should apply custom trace styling', () => {
      if (!kinKanji) return;
      
      const svg = svgRenderer.render(kinKanji, {
        showTrace: true,
        traceStyling: {
          traceColour: '#ff0000',
          traceThickness: 4,
          traceRadius: 2
        }
      });
      
      // Check trace styling
      expect(svg).toContain(`kvg:${kinKanji.code}-trace-1`);
      expect(svg).toContain('stroke: #ff0000');
      expect(svg).toContain('stroke-width: 4');
      expect(svg).toContain('opacity: 0.3');
    });

    test('should use default trace styling when not specified', () => {
      if (!kinKanji) return;
      
      const svg = svgRenderer.render(kinKanji, { showTrace: true });
      
      // Should use default trace styling
      expect(svg).toContain('stroke: #cccccc');
      expect(svg).toContain('stroke-width: 2');
    });
  });

  describe('Combined Styling', () => {
    test('should work with all styling options together', () => {
      if (!kinKanji) return;
      
      const svg = svgRenderer.render(kinKanji, {
        showTrace: true,
        showNumbers: true,
        strokeStyling: {
          strokeColour: ['#ff0000', '#00ff00'],
          strokeThickness: 5,
          strokeRadius: 2
        },
        traceStyling: {
          traceColour: '#0000ff',
          traceThickness: 3,
          traceRadius: 1
        }
      });
      
      // Should have all styling applied
      expect(svg).toContain('stroke: #ff0000');
      expect(svg).toContain('stroke: #00ff00');
      expect(svg).toContain('stroke-width: 5');
      expect(svg).toContain('stroke: #0000ff');
      expect(svg).toContain(`kvg:${kinKanji.code}-trace-1`);
      expect(svg).toContain(`kvg:${kinKanji.code}-n1`);
    });

    test('radical styling should override stroke styling', () => {
      if (!kinKanji) return;
      
      const svg = svgRenderer.render(kinKanji, {
        strokeStyling: {
          strokeColour: '#ff0000',
          strokeThickness: 5,
          strokeRadius: 2
        },
        radicalStyling: {
          radicalColour: '#00ff00'
        }
      });
      
      // Should use radical color, not stroke color
      expect(svg).toContain('stroke: #00ff00');
      expect(svg).not.toContain('stroke: #ff0000');
      // Should still use stroke thickness and radius
      expect(svg).toContain('stroke-width: 5');
    });
  });

  describe('Specific Kanji Radical Styling', () => {
    test('should color 姉 radical (女) differently from other components', () => {
      if (!kinKanjiAne) return;
      
      const svg = svgRenderer.render(kinKanjiAne, {
        strokeStyling: {
          strokeColour: '#0000ff', // Blue for non-radical strokes
          strokeThickness: 4,
          strokeRadius: 1
        },
        radicalStyling: {
          radicalColour: '#ff0000' // Red for radical strokes
        }
      });
      
      // Should contain both colors
      expect(svg).toContain('stroke: #ff0000'); // Radical color
      expect(svg).toContain('stroke: #0000ff'); // Non-radical color
      expect(svg).toContain('stroke-width: 4');
      
      // Verify the radical component (女) is present
      expect(kinKanjiAne.radicals).toHaveLength(1);
      expect(kinKanjiAne.radicals[0].element).toBe('女');
    });

    test('should color 転 radical (車) differently from other components', () => {
      if (!tenKanji) return;
      
      const svg = svgRenderer.render(tenKanji, {
        strokeStyling: {
          strokeColour: '#00ff00', // Green for non-radical strokes
          strokeThickness: 5,
          strokeRadius: 2
        },
        radicalStyling: {
          radicalColour: '#ff00ff' // Magenta for radical strokes
        }
      });
      
      // Should contain both colors
      expect(svg).toContain('stroke: #ff00ff'); // Radical color
      expect(svg).toContain('stroke: #00ff00'); // Non-radical color
      expect(svg).toContain('stroke-width: 5');
      
      // Verify the radical component (車) is present
      expect(tenKanji.radicals).toHaveLength(1);
      expect(tenKanji.radicals[0].element).toBe('車');
    });

    test('should cycle through radical colors for multiple radicals', () => {
      if (!kinKanjiAne) return;
      
      const svg = svgRenderer.render(kinKanjiAne, {
        strokeStyling: {
          strokeColour: '#000000', // Black for non-radical strokes
          strokeThickness: 3,
          strokeRadius: 0
        },
        radicalStyling: {
          radicalColour: ['#ff0000', '#00ff00', '#0000ff'] // Cycle through colors
        }
      });
      
      // Should use the first radical color (since there's only one radical)
      expect(svg).toContain('stroke: #ff0000');
      expect(svg).toContain('stroke: #000000'); // Non-radical strokes
      
      // Verify radical information
      expect(kinKanjiAne.radicals[0].element).toBe('女');
      expect(kinKanjiAne.radicals[0].position).toBe('left');
    });

    test('should apply radical styling with trace mode', () => {
      if (!tenKanji) return;
      
      const svg = svgRenderer.render(tenKanji, {
        showTrace: true,
        strokeStyling: {
          strokeColour: '#888888', // Gray for non-radical strokes
          strokeThickness: 4,
          strokeRadius: 1
        },
        radicalStyling: {
          radicalColour: '#ff6600' // Orange for radical strokes
        },
        traceStyling: {
          traceColour: '#cccccc',
          traceThickness: 2,
          traceRadius: 0
        }
      });
      
      // Should have radical color, non-radical color, and trace
      expect(svg).toContain('stroke: #ff6600'); // Radical color
      expect(svg).toContain('stroke: #888888'); // Non-radical color
      expect(svg).toContain('stroke: #cccccc'); // Trace color
      expect(svg).toContain(`kvg:${tenKanji.code}-trace-1`);
      
      // Verify radical information
      expect(tenKanji.radicals[0].element).toBe('車');
      expect(tenKanji.radicals[0].position).toBe('left');
    });
  });
});
