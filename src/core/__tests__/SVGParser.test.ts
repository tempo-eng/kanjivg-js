import { SVGParser } from '../SVGParser';
import { KanjiData, StrokeData, GroupData } from '../../types';

describe('SVGParser', () => {
  let parser: SVGParser;

  beforeEach(() => {
    parser = new SVGParser();
  });

  describe('parseSVG', () => {
    it('should parse a simple kanji (一) with one stroke', () => {
      const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="109" height="109" viewBox="0 0 109 109">
<g id="kvg:StrokePaths_04e00">
<g id="kvg:04e00" kvg:element="一" kvg:radical="general">
	<path id="kvg:04e00-s1" kvg:type="㇐" d="M11,54.25c3.19,0.62,6.25,0.75,9.73,0.5c20.64-1.5,50.39-5.12,68.58-5.24c3.6-0.02,5.77,0.24,7.57,0.49"/>
</g>
</g>
<g id="kvg:StrokeNumbers_04e00">
	<text transform="matrix(1 0 0 1 4.25 54.13)">1</text>
</g>
</svg>`;

      const result = parser.parseSVG(svgContent, '04e00');

      expect(result).toBeDefined();
      expect(result.character).toBe('一');
      expect(result.unicode).toBe('04e00');
      expect(result.strokes.length).toBe(1);
      expect(result.strokeCount).toBe(1);
      expect(result.isVariant).toBe(false);

      const stroke = result.strokes[0];
      expect(stroke.strokeNumber).toBe(1);
      expect(stroke.strokeType).toBe('㇐');
      expect(stroke.path).toBe('M11,54.25c3.19,0.62,6.25,0.75,9.73,0.5c20.64-1.5,50.39-5.12,68.58-5.24c3.6-0.02,5.77,0.24,7.57,0.49');
      expect(stroke.numberPosition).toEqual({ x: 4.25, y: 54.13 });
    });

    it('should parse a kanji with groups and radicals (上)', () => {
      const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="109" height="109" viewBox="0 0 109 109">
<g id="kvg:StrokePaths_04e0a">
<g id="kvg:04e0a" kvg:element="上">
	<g id="kvg:04e0a-g1" kvg:element="卜" kvg:radical="nelson">
		<path id="kvg:04e0a-s1" kvg:type="㇑a" d="M52.31,15.88c1.15,1.15,2.01,3.12,2.01,5.12c0,0.82-0.22,63.62-0.25,64.63"/>
		<path id="kvg:04e0a-s2" kvg:type="㇐b/㇔" d="M58,44.75c7-0.62,14.25-2.5,17.75-3c1.38-0.2,3.5-0.38,4.75,0"/>
	</g>
	<g id="kvg:04e0a-g2" kvg:element="一" kvg:radical="tradit">
		<path id="kvg:04e0a-s3" kvg:type="㇐" d="M13.38,88.28c3.6,1.15,7.45,0.62,11.13,0.34c16.23-1.23,41.16-2.66,60.24-2.92c3.65-0.05,7.47-0.32,11,0.82"/>
	</g>
</g>
</g>
<g id="kvg:StrokeNumbers_04e0a">
	<text transform="matrix(1 0 0 1 43.50 16.28)">1</text>
	<text transform="matrix(1 0 0 1 60.25 41.50)">2</text>
	<text transform="matrix(1 0 0 1 5.50 88.50)">3</text>
</g>
</svg>`;

      const result = parser.parseSVG(svgContent, '04e0a');

      expect(result).toBeDefined();
      expect(result.character).toBe('上');
      expect(result.unicode).toBe('04e0a');
      expect(result.strokes.length).toBe(3);
      expect(result.strokeCount).toBe(3);
      
      // Check groups
      expect(result.groups.length).toBeGreaterThan(0);
      const radicalGroup = result.groups.find((g: GroupData) => g.radical === 'nelson');
      expect(radicalGroup).toBeDefined();
      expect(radicalGroup?.element).toBe('卜');
      
      // Check radical info
      expect(result.radicalInfo).toBeDefined();
      
      // Check stroke 1
      expect(result.strokes[0].strokeNumber).toBe(1);
      expect(result.strokes[0].strokeType).toBe('㇑a');
      expect(result.strokes[0].numberPosition).toEqual({ x: 43.50, y: 16.28 });
      
      // Check stroke 2
      expect(result.strokes[1].strokeNumber).toBe(2);
      expect(result.strokes[1].strokeType).toBe('㇐b/㇔');
      expect(result.strokes[1].numberPosition).toEqual({ x: 60.25, y: 41.50 });
      
      // Check stroke 3
      expect(result.strokes[2].strokeNumber).toBe(3);
      expect(result.strokes[2].strokeType).toBe('㇐');
      expect(result.strokes[2].numberPosition).toEqual({ x: 5.50, y: 88.50 });
    });

    it('should cache parsed results', () => {
      const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="109" height="109" viewBox="0 0 109 109">
<g id="kvg:StrokePaths_04e00">
<g id="kvg:04e00" kvg:element="一" kvg:radical="general">
	<path id="kvg:04e00-s1" kvg:type="㇐" d="M11,54.25c3.19"/>
</g>
</g>
</svg>`;

      const result1 = parser.parseSVG(svgContent, '04e00');
      const result2 = parser.parseSVG(svgContent, '04e00');

      expect(result1).toBe(result2); // Should return same cached object
    });

    it('should handle missing stroke numbers gracefully', () => {
      const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="109" height="109" viewBox="0 0 109 109">
<g id="kvg:StrokePaths_test">
<g id="kvg:test" kvg:element="一">
	<path id="kvg:test-s1" kvg:type="㇐" d="M11,54.25c3.19"/>
</g>
</g>
</svg>`;

      const result = parser.parseSVG(svgContent, 'test');

      expect(result.strokes[0].numberPosition).toBeUndefined();
    });

    it('should extract components from groups', () => {
      const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="109" height="109" viewBox="0 0 109 109">
<g id="kvg:StrokePaths_04e0a">
<g id="kvg:04e0a" kvg:element="上">
	<g id="kvg:04e0a-g1" kvg:element="卜" kvg:radical="nelson">
		<path id="kvg:04e0a-s1" kvg:type="㇑a" d="M52.31"/>
	</g>
	<g id="kvg:04e0a-g2" kvg:element="一" kvg:radical="tradit">
		<path id="kvg:04e0a-s2" kvg:type="㇐" d="M13.38"/>
	</g>
</g>
</g>
</svg>`;

      const result = parser.parseSVG(svgContent, '04e0a');

      expect(result.components).toBeDefined();
      expect(result.components?.length).toBeGreaterThanOrEqual(2);
      expect(result.components).toContain('卜');
      expect(result.components).toContain('一');
    });

    it('should handle radical strokes correctly', () => {
      const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="109" height="109" viewBox="0 0 109 109">
<g id="kvg:StrokePaths_04e0a">
<g id="kvg:04e0a" kvg:element="上">
	<g id="kvg:04e0a-g1" kvg:element="卜" kvg:radical="nelson">
		<path id="kvg:04e0a-s1" kvg:type="㇑a" d="M52.31"/>
		<path id="kvg:04e0a-s2" kvg:type="㇐b/㇔" d="M58"/>
	</g>
	<g id="kvg:04e0a-g2" kvg:element="一" kvg:radical="tradit">
		<path id="kvg:04e0a-s3" kvg:type="㇐" d="M13.38"/>
	</g>
</g>
</g>
</svg>`;

      const result = parser.parseSVG(svgContent, '04e0a');

      // Strokes in radical groups should be marked as radical strokes
      const radicalStrokes = result.strokes.filter((s: StrokeData) => s.isRadicalStroke);
      expect(radicalStrokes.length).toBeGreaterThan(0);
    });
  });

  describe('clearCache', () => {
    it('should clear all cached results', () => {
      const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="109" height="109" viewBox="0 0 109 109">
<g id="kvg:StrokePaths_test">
<g id="kvg:test" kvg:element="一">
	<path id="kvg:test-s1" kvg:type="㇐" d="M11,54.25c3.19"/>
</g>
</g>
</svg>`;

      const result1 = parser.parseSVG(svgContent, 'test');
      expect(result1).toBeDefined();

      parser.clearCache();

      const result2 = parser.parseSVG(svgContent, 'test');
      expect(result1).not.toBe(result2); // Should create new object
    });
  });
});
