/**
 * Test for stroke order validation
 * 
 * This test verifies that the stroke order for kanji "金" and "語" matches the expected order
 * as shown in the reference images
 */

import { KanjiVG } from '../kanjivg';
import { SVGRenderer } from '../svg-renderer';
import { KanjiInfo } from '../types';
import { loadTestKanjiData } from '../test-utils/test-helpers';

// Expected stroke order for 金 (gold) based on actual KanjiVG SVG data
const EXPECTED_STROKE_ORDER_金 = [
  '㇒', // Stroke 1: Top-left diagonal
  '㇏', // Stroke 2: Top-right diagonal
  '㇐', // Stroke 3: First horizontal (top group)
  '㇐', // Stroke 4: Second horizontal (top group)
  '㇑a', // Stroke 5: Vertical stroke
  '㇔', // Stroke 6: Left diagonal
  '㇒', // Stroke 7: Right diagonal
  '㇐'  // Stroke 8: Bottom horizontal
];

// Expected stroke order for 語 (language/word) based on actual KanjiVG SVG data
// Left radical 言 (gon-ben): strokes 1-7
// Right radical 吾 (go): strokes 8-14
const EXPECTED_STROKE_ORDER_語 = [
  '㇔',  // Stroke 1: Top-left diagonal (言 radical)
  '㇐',  // Stroke 2: Top horizontal (言 radical)
  '㇐',  // Stroke 3: Second horizontal (言 radical)
  '㇐',  // Stroke 4: Third horizontal (言 radical)
  '㇑',  // Stroke 5: Vertical stroke (言 radical 口)
  '㇕b', // Stroke 6: Top and right of 口 (言 radical)
  '㇐b', // Stroke 7: Bottom of 口 (言 radical)
  '㇐',  // Stroke 8: Top horizontal (吾 radical 五)
  '㇑a', // Stroke 9: Vertical stroke (吾 radical 五)
  '㇕c', // Stroke 10: Horizontal crossing vertical (吾 radical 五)
  '㇐',  // Stroke 11: Bottom horizontal (吾 radical 五)
  '㇑',  // Stroke 12: Vertical stroke (吾 radical 口)
  '㇕b', // Stroke 13: Top and right of 口 (吾 radical)
  '㇐b'  // Stroke 14: Bottom of 口 (吾 radical)
];

describe('Stroke Order Validation', () => {
  let kanjivg: KanjiVG;
  let svgRenderer: SVGRenderer;
  let kinKanji: KanjiInfo | null;
  let goKanji: KanjiInfo | null;

  beforeAll(async () => {
    // Load individual kanji files: 金 (091d1), 語 (08a9e)
    const data = await loadTestKanjiData(['091d1', '08a9e']);
    kanjivg = new KanjiVG(data);
    svgRenderer = new SVGRenderer();
    
    const kinResults = await kanjivg.search('金');
    const goResults = await kanjivg.search('語');
    kinKanji = kinResults[0] || null;
    goKanji = goResults[0] || null;
  });

  describe('金 (Gold) Kanji', () => {
    test('should find 金 kanji', () => {
      expect(kinKanji).toBeTruthy();
      expect(kinKanji?.character).toBe('金');
    });

    test('should have correct number of strokes for 金', () => {
      expect(kinKanji?.strokeCount).toBe(8);
      expect(kinKanji?.strokeTypes.length).toBe(8);
    });

    test('should have correct stroke order for 金', () => {
      expect(kinKanji?.strokeTypes).toEqual(EXPECTED_STROKE_ORDER_金);
    });

    test('should generate SVG with correct stroke order for 金', () => {
      if (!kinKanji) return;
      
      const svg = svgRenderer.render(kinKanji, { showNumbers: true });
      
      // Check that SVG contains the correct number of strokes
      const strokeMatches = svg.match(/<path[^>]*>/g);
      expect(strokeMatches).toHaveLength(8);
      
      // Check that stroke numbers are present - count text elements
      const textElements = svg.match(/<text[^>]*>/g) || [];
      expect(textElements).toHaveLength(8);
      
      // Verify stroke order in SVG
      for (let i = 0; i < 8; i++) {
        const strokeId = `kvg:${kinKanji.code}-s${i + 1}`;
        const strokeType = EXPECTED_STROKE_ORDER_金[i];
        
        expect(svg).toContain(`id="${strokeId}"`);
        expect(svg).toContain(`kvg:type="${strokeType}"`);
      }
    });

    test('should have correct animation timing for 金 strokes', () => {
      if (!kinKanji) return;
      
      const svg = svgRenderer.render(kinKanji, { showNumbers: true });
      
      // Extract only stroke-dashoffset animations (not opacity animations for numbers)
      const strokeAnimateMatches = svg.match(/<animate[^>]*attributeName="stroke-dashoffset"[^>]*begin="([^"]*)"[^>]*>/g);
      expect(strokeAnimateMatches).toHaveLength(8);
      
      // Check that animation timing follows stroke order (sequential timing)
      const expectedDelays = [0, 1000, 2000, 3000, 4000, 5000, 6000, 7000]; // 800ms + 200ms delay
      
      strokeAnimateMatches?.forEach((match, index) => {
        const beginMatch = match.match(/begin="([^"]*)"/);
        const actualDelay = beginMatch ? parseInt(beginMatch[1]) : -1;
        expect(actualDelay).toBe(expectedDelays[index]);
      });
    });

    test('should have stroke numbers positioned correctly for 金', () => {
      if (!kinKanji) return;
      
      const svg = svgRenderer.render(kinKanji, { showNumbers: true });
      
      // Check that stroke numbers are present
      const textElements = svg.match(/<text[^>]*>/g) || [];
      expect(textElements).toHaveLength(8);
      
      // Check that numbers are positioned around the kanji (not all at center)
      const centerX = 50, centerY = 50;
      const tolerance = 5;
      
      let numbersAwayFromCenter = 0;
      
      textElements.forEach(textElement => {
        const xMatch = textElement.match(/x="([0-9.]+)"/);
        const yMatch = textElement.match(/y="([0-9.]+)"/);
        
        if (xMatch && yMatch) {
          const x = parseFloat(xMatch[1]);
          const y = parseFloat(yMatch[1]);
          
          const distanceFromCenter = Math.sqrt(
            Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2)
          );
          
          if (distanceFromCenter > tolerance) {
            numbersAwayFromCenter++;
          }
        }
      });
      
      // Most numbers should be positioned away from center
      expect(numbersAwayFromCenter).toBeGreaterThan(4);
    });
  });

  describe('語 (Language) Kanji', () => {
    test('should find 語 kanji', () => {
      expect(goKanji).toBeTruthy();
      expect(goKanji?.character).toBe('語');
    });

    test('should have correct number of strokes for 語', () => {
      expect(goKanji?.strokeCount).toBe(14);
      expect(goKanji?.strokeTypes.length).toBe(14);
    });

    test('should have correct stroke order for 語', () => {
      expect(goKanji?.strokeTypes).toEqual(EXPECTED_STROKE_ORDER_語);
    });

    test('should generate SVG with correct stroke order for 語', () => {
      if (!goKanji) return;
      
      const svg = svgRenderer.render(goKanji, { showNumbers: true });
      
      // Check that SVG contains the correct number of strokes
      const strokeMatches = svg.match(/<path[^>]*>/g);
      expect(strokeMatches).toHaveLength(14);
      
      // Check that stroke numbers are present - count text elements
      const textElements = svg.match(/<text[^>]*>/g) || [];
      expect(textElements).toHaveLength(14);
      
      // Verify stroke order in SVG
      for (let i = 0; i < 14; i++) {
        const strokeId = `kvg:${goKanji.code}-s${i + 1}`;
        const strokeType = EXPECTED_STROKE_ORDER_語[i];
        
        expect(svg).toContain(`id="${strokeId}"`);
        expect(svg).toContain(`kvg:type="${strokeType}"`);
      }
    });

    test('should have correct animation timing for 語 strokes', () => {
      if (!goKanji) return;
      
      const svg = svgRenderer.render(goKanji, { showNumbers: true });
      
      // Extract only stroke-dashoffset animations (not opacity animations for numbers)
      const strokeAnimateMatches = svg.match(/<animate[^>]*attributeName="stroke-dashoffset"[^>]*begin="([^"]*)"[^>]*>/g);
      expect(strokeAnimateMatches).toHaveLength(14);
      
      // Check that animation timing follows stroke order (sequential timing)
      const expectedDelays = [0, 1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000, 9000, 10000, 11000, 12000, 13000]; // 800ms + 200ms delay
      
      strokeAnimateMatches?.forEach((match, index) => {
        const beginMatch = match.match(/begin="([^"]*)"/);
        const actualDelay = beginMatch ? parseInt(beginMatch[1]) : -1;
        expect(actualDelay).toBe(expectedDelays[index]);
      });
    });

    test('should have stroke numbers positioned correctly for 語', () => {
      if (!goKanji) return;
      
      const svg = svgRenderer.render(goKanji, { showNumbers: true });
      
      // Check that stroke numbers are present
      const textElements = svg.match(/<text[^>]*>/g) || [];
      expect(textElements).toHaveLength(14);
      
      // Check that numbers are positioned around the kanji (not all at center)
      const centerX = 50, centerY = 50;
      const tolerance = 5;
      
      let numbersAwayFromCenter = 0;
      
      textElements.forEach(textElement => {
        const xMatch = textElement.match(/x="([0-9.]+)"/);
        const yMatch = textElement.match(/y="([0-9.]+)"/);
        
        if (xMatch && yMatch) {
          const x = parseFloat(xMatch[1]);
          const y = parseFloat(yMatch[1]);
          
          const distanceFromCenter = Math.sqrt(
            Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2)
          );
          
          if (distanceFromCenter > tolerance) {
            numbersAwayFromCenter++;
          }
        }
      });
      
      // Most numbers should be positioned away from center
      expect(numbersAwayFromCenter).toBeGreaterThan(7);
    });
  });
});

// Helper function to validate stroke order for any kanji
export function validateStrokeOrder(kanji: KanjiInfo, expectedOrder: string[]): boolean {
  return kanji.strokeTypes.every((strokeType, index) => 
    strokeType === expectedOrder[index]
  );
}

// Export the expected stroke orders for use in other tests
export { EXPECTED_STROKE_ORDER_金, EXPECTED_STROKE_ORDER_語 };

describe('Number Display Options', () => {
  let kanjivg: KanjiVG;
  let svgRenderer: SVGRenderer;
  let kinKanji: KanjiInfo | null;

  beforeAll(async () => {
    // Load the KanjiVG data using the same approach as existing tests
    const data = await loadTestKanjiData(['091d1']);
    kanjivg = new KanjiVG(data);
    svgRenderer = new SVGRenderer();
    
    const kinResults = await kanjivg.search('金');
    kinKanji = kinResults[0] || null;
    
    expect(kinKanji).toBeTruthy();
  });

  beforeEach(() => {
    svgRenderer = new SVGRenderer();
  });

  test('showNumbers: true should display numbers permanently', () => {
    if (!kinKanji) return;
    
    const svg = svgRenderer.render(kinKanji, { showNumbers: true, flashNumbers: false });
    
    // Check that numbers are present and have opacity="1"
    expect(svg).toContain('opacity="1"');
    expect(svg).toContain(`kvg:${kinKanji.code}-n1`);
    expect(svg).toContain(`kvg:${kinKanji.code}-n2`);
    // Should not contain animation elements
    expect(svg).not.toContain('<animate attributeName="opacity"');
  });

  test('flashNumbers: true should flash numbers briefly', () => {
    if (!kinKanji) return;
    
    const svg = svgRenderer.render(kinKanji, { showNumbers: false, flashNumbers: true });
    
    // Check that numbers are present with animation
    expect(svg).toContain('opacity="0"');
    expect(svg).toContain(`kvg:${kinKanji.code}-n1`);
    expect(svg).toContain(`kvg:${kinKanji.code}-n2`);
    expect(svg).toContain('<animate attributeName="opacity"');
    expect(svg).toContain('values="0;1;0"');
  });

  test('showNumbers: true takes precedence over flashNumbers', () => {
    if (!kinKanji) return;
    
    const svg = svgRenderer.render(kinKanji, { showNumbers: true, flashNumbers: true });
    
    // showNumbers should take precedence - numbers stay visible
    expect(svg).toContain('opacity="1"');
    expect(svg).toContain(`kvg:${kinKanji.code}-n1`);
    expect(svg).toContain(`kvg:${kinKanji.code}-n2`);
    // Should not contain animation elements when showNumbers is true
    expect(svg).not.toContain('<animate attributeName="opacity"');
  });

  test('both false should not show numbers at all', () => {
    if (!kinKanji) return;
    
    const svg = svgRenderer.render(kinKanji, { showNumbers: false, flashNumbers: false });
    
    // Should not contain any number elements
    expect(svg).not.toContain(`kvg:${kinKanji.code}-n1`);
    expect(svg).not.toContain(`kvg:${kinKanji.code}-n2`);
    expect(svg).not.toContain('<animate attributeName="opacity"');
  });

  test('default behavior should be flashNumbers: true, showNumbers: false', () => {
    if (!kinKanji) return;
    
    const svg = svgRenderer.render(kinKanji);
    
    // Default should be flashNumbers behavior
    expect(svg).toContain('opacity="0"');
    expect(svg).toContain(`kvg:${kinKanji.code}-n1`);
    expect(svg).toContain('<animate attributeName="opacity"');
    expect(svg).toContain('values="0;1;0"');
  });
});

describe('Trace Mode Options', () => {
  let kanjivg: KanjiVG;
  let svgRenderer: SVGRenderer;
  let kinKanji: KanjiInfo | null;

  beforeAll(async () => {
    // Load the KanjiVG data using the same approach as existing tests
    const data = await loadTestKanjiData(['091d1']);
    kanjivg = new KanjiVG(data);
    svgRenderer = new SVGRenderer();
    
    const kinResults = await kanjivg.search('金');
    kinKanji = kinResults[0] || null;
    
    expect(kinKanji).toBeTruthy();
  });

  beforeEach(() => {
    svgRenderer = new SVGRenderer();
  });

  test('showTrace: true should display light grey trace outline', () => {
    if (!kinKanji) return;
    
    const svg = svgRenderer.render(kinKanji, { showTrace: true });
    
    // Check that trace elements are present
    expect(svg).toContain(`kvg:${kinKanji.code}-trace-1`);
    expect(svg).toContain(`kvg:${kinKanji.code}-trace-2`);
    expect(svg).toContain('stroke: #cccccc');
    expect(svg).toContain('opacity: 0.3');
  });

  test('showTrace: false should not display trace outline', () => {
    if (!kinKanji) return;
    
    const svg = svgRenderer.render(kinKanji, { showTrace: false });
    
    // Should not contain any trace elements
    expect(svg).not.toContain(`kvg:${kinKanji.code}-trace-1`);
    expect(svg).not.toContain(`kvg:${kinKanji.code}-trace-2`);
    expect(svg).not.toContain('stroke: #cccccc');
  });

  test('default behavior should be showTrace: false', () => {
    if (!kinKanji) return;
    
    const svg = svgRenderer.render(kinKanji);
    
    // Default should not show trace
    expect(svg).not.toContain(`kvg:${kinKanji.code}-trace-1`);
    expect(svg).not.toContain('stroke: #cccccc');
  });

  test('trace should work with other options', () => {
    if (!kinKanji) return;
    
    const svg = svgRenderer.render(kinKanji, { 
      showTrace: true, 
      showNumbers: true, 
      flashNumbers: false 
    });
    
    // Should have both trace and numbers
    expect(svg).toContain(`kvg:${kinKanji.code}-trace-1`);
    expect(svg).toContain(`kvg:${kinKanji.code}-n1`);
    expect(svg).toContain('stroke: #cccccc');
    expect(svg).toContain('opacity="1"');
  });
});