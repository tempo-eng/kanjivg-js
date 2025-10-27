import {
  getStrokeCount,
  getStrokeTypes,
  getRadicals,
  getComponents,
  isRadical,
  getComponentsByPosition,
  getComponentsByElement,
  generateSimpleSVG,
  createDataURL,
  debounce,
  throttle,
  getRandomKanji,
  searchByStrokeCount,
  searchByRadical,
  searchByComponent,
  sortByStrokeCount,
  sortByCharacter
} from '../utils';
import { KanjiInfo, ComponentInfo } from '../types';

describe('Utils', () => {

  describe('Kanji info utilities', () => {
    const mockKanji: KanjiInfo = {
      character: '並',
      code: '04e26',
      strokeCount: 3,
      strokeTypes: ['㇔', '㇒', '㇐'],
      components: [
        { element: '八', position: 'top', isRadical: false },
        { element: '一', position: 'top', isRadical: true, radicalNumber: '1' }
      ],
      radicals: [
        { element: '一', position: 'top', isRadical: true, radicalNumber: '1' }
      ],
      svg: '<svg>...</svg>'
    };

    it('should get stroke count', () => {
      expect(getStrokeCount(mockKanji)).toBe(3);
    });

    it('should get stroke types', () => {
      expect(getStrokeTypes(mockKanji)).toEqual(['㇔', '㇒', '㇐']);
    });

    it('should get radicals', () => {
      expect(getRadicals(mockKanji)).toHaveLength(1);
      expect(getRadicals(mockKanji)[0].element).toBe('一');
    });

    it('should get components', () => {
      expect(getComponents(mockKanji)).toHaveLength(2);
    });

    it('should check if component is radical', () => {
      const radical: ComponentInfo = { element: '一', isRadical: true };
      const nonRadical: ComponentInfo = { element: '八', isRadical: false };
      
      expect(isRadical(radical)).toBe(true);
      expect(isRadical(nonRadical)).toBe(false);
    });

    it('should get components by position', () => {
      const topComponents = getComponentsByPosition(mockKanji, 'top');
      expect(topComponents).toHaveLength(2);
    });

    it('should get components by element', () => {
      const eightComponents = getComponentsByElement(mockKanji, '八');
      expect(eightComponents).toHaveLength(1);
    });
  });

  describe('SVG utilities', () => {
    const mockKanji: KanjiInfo = {
      character: '並',
      code: '04e26',
      strokeCount: 3,
      strokeTypes: ['㇔', '㇒', '㇐'],
      components: [],
      radicals: [],
      svg: '<svg>...</svg>'
    };

    it('should generate simple SVG', () => {
      const svg = generateSimpleSVG(mockKanji);
      expect(svg).toContain('<svg');
      expect(svg).toContain('04e26');
    });

    it('should create data URL', () => {
      const dataUrl = createDataURL(mockKanji);
      expect(dataUrl).toMatch(/^data:image\/svg\+xml,/);
    });
  });

  describe('Performance utilities', () => {
    it('should debounce function calls', (done) => {
      let callCount = 0;
      const debouncedFn = debounce(() => {
        callCount++;
      }, 100);

      debouncedFn();
      debouncedFn();
      debouncedFn();

      setTimeout(() => {
        expect(callCount).toBe(1);
        done();
      }, 150);
    });

    it('should throttle function calls', (done) => {
      let callCount = 0;
      const throttledFn = throttle(() => {
        callCount++;
      }, 100);

      throttledFn();
      throttledFn();
      throttledFn();

      setTimeout(() => {
        expect(callCount).toBe(1);
        done();
      }, 50);
    });
  });

  describe('Search utilities', () => {
    const mockKanjiList: KanjiInfo[] = [
      {
        character: '一',
        code: '04e00',
        strokeCount: 1,
        strokeTypes: ['㇐'],
        components: [],
        radicals: [{ element: '一', isRadical: true }],
        svg: '<svg>...</svg>'
      },
      {
        character: '二',
        code: '04e8c',
        strokeCount: 2,
        strokeTypes: ['㇐', '㇐'],
        components: [],
        radicals: [],
        svg: '<svg>...</svg>'
      },
      {
        character: '三',
        code: '04e09',
        strokeCount: 3,
        strokeTypes: ['㇐', '㇐', '㇐'],
        components: [],
        radicals: [],
        svg: '<svg>...</svg>'
      }
    ];

    it('should get random kanji', () => {
      const random = getRandomKanji(mockKanjiList);
      expect(random).toBeTruthy();
      expect(mockKanjiList).toContain(random);
    });

    it('should search by stroke count', () => {
      const twoStroke = searchByStrokeCount(mockKanjiList, 2);
      expect(twoStroke).toHaveLength(1);
      expect(twoStroke[0].character).toBe('二');
    });

    it('should search by radical', () => {
      const radicalResults = searchByRadical(mockKanjiList, '一');
      expect(radicalResults).toHaveLength(1);
      expect(radicalResults[0].character).toBe('一');
    });

    it('should search by component', () => {
      const componentResults = searchByComponent(mockKanjiList, '一');
      expect(componentResults).toHaveLength(0); // No components in mock data
    });

    it('should sort by stroke count', () => {
      const sorted = sortByStrokeCount(mockKanjiList, true);
      expect(sorted[0].strokeCount).toBe(1);
      expect(sorted[2].strokeCount).toBe(3);
    });

    it('should sort by character', () => {
      const sorted = sortByCharacter(mockKanjiList, true);
      expect(sorted[0].character).toBe('一');
      expect(sorted[1].character).toBe('三');
      expect(sorted[2].character).toBe('二');
    });
  });
});
