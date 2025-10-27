import { KanjiVG } from '../kanjivg';
import { KanjiData } from '../types';

describe('KanjiVG', () => {
  const mockData: KanjiData = {
    kanji: {
      '04e26': {
        code: '04e26',
        character: '並',
        variant: undefined,
        strokes: {
          id: 'kvg:04e26',
          element: '並',
          groups: [],
          strokes: [
            { type: '㇔', path: 'M34.77,17.84c3.56,2.48,9.2,9.7,10.09,13.56' },
            { type: '㇒', path: 'M69.52,14.01c0.08,1.19-0.03,1.87-0.52,2.98c-2.05,4.61-5.25,9.76-11.34,17.11' },
            { type: '㇐', path: 'M24.25,39.65c3,0.6,5.46,0.3,8,0c10.37-1.23,34.22-4.13,44.25-4.9c2.37-0.18,4.67-0.32,6.99,0.25' }
          ]
        }
      }
    },
    index: {
      '並': ['04e26']
    }
  };

  let kanjivg: KanjiVG;

  beforeEach(() => {
    kanjivg = new KanjiVG(mockData);
  });

  describe('search', () => {
    it('should search kanji by character', async () => {
      const results = await kanjivg.search('並');
      expect(results).toHaveLength(1);
      expect(results[0].character).toBe('並');
      expect(results[0].code).toBe('04e26');
      expect(results[0].strokeCount).toBe(3);
    });

    it('should search kanji by code', async () => {
      const results = await kanjivg.search('04e26');
      expect(results).toHaveLength(1);
      expect(results[0].character).toBe('並');
      expect(results[0].code).toBe('04e26');
    });

    it('should return empty array for non-existent kanji', async () => {
      const results = await kanjivg.search('nonexistent');
      expect(results).toHaveLength(0);
    });

    it('should handle invalid input', async () => {
      const results = await kanjivg.search('invalid-input');
      expect(results).toHaveLength(0);
    });

    it('should respect limit option', async () => {
      const results = await kanjivg.search('並', { limit: 1 });
      expect(results).toHaveLength(1);
    });
  });


  describe('getAllCharacters', () => {
    it('should return all available characters', () => {
      const characters = kanjivg.getAllCharacters();
      expect(characters).toContain('並');
    });
  });

  describe('getTotalCount', () => {
    it('should return total number of kanji', () => {
      const count = kanjivg.getTotalCount();
      expect(count).toBe(1);
    });
  });

  describe('variant search', () => {
    it('should demonstrate variant search with mock data', async () => {
      // This test uses the mock data to show the concept
      // Real variant testing is in variant-search.test.ts
      const results = await kanjivg.search('並');
      expect(results).toHaveLength(1);
      expect(results[0].character).toBe('並');
    });
  });
});
