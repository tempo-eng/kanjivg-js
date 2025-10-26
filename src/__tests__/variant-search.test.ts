import { KanjiVG } from '../kanjivg';
import { KanjiData } from '../types';

describe('KanjiVG Variant Tests', () => {
  // Load real data for comprehensive testing
  let kanjivg: KanjiVG;
  let realData: KanjiData;

  beforeAll(async () => {
    // Load the actual data file
    const fs = await import('fs');
    const path = await import('path');
    const dataPath = path.join(process.cwd(), 'data', 'kanjivg-data.json');
    realData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    kanjivg = new KanjiVG(realData);
  });

  describe('Variant Search Functionality', () => {
    test('should find multiple variants for 且 (moreover)', () => {
      const results = kanjivg.search('且');
      
      expect(results.length).toBeGreaterThanOrEqual(2);
      
      // Check that we have both base and variant
      const baseForm = results.find(r => !r.variant);
      const kaishoForm = results.find(r => r.variant === 'Kaisho');
      
      expect(baseForm).toBeDefined();
      expect(kaishoForm).toBeDefined();
      
      // Both should have same character and code
      expect(baseForm!.character).toBe('且');
      expect(kaishoForm!.character).toBe('且');
      expect(baseForm!.code).toBe('04e14');
      expect(kaishoForm!.code).toBe('04e14');
    });

    test('should have different stroke data for 且 variants', () => {
      const results = kanjivg.search('且');
      const baseForm = results.find(r => !r.variant);
      const kaishoForm = results.find(r => r.variant === 'Kaisho');
      
      // Both should have same stroke count but different stroke types
      expect(baseForm!.strokeCount).toBe(kaishoForm!.strokeCount);
      expect(baseForm!.strokeTypes).not.toEqual(kaishoForm!.strokeTypes);
      
      // Base form has more complex stroke types
      expect(baseForm!.strokeTypes).toContain('㇑a');
      expect(baseForm!.strokeTypes).toContain('㇕b');
      
      // Kaisho form has simpler stroke types
      expect(kaishoForm!.strokeTypes).toContain('㇑');
      expect(kaishoForm!.strokeTypes).toContain('㇕');
    });

    test('should find multiple variants for 碚 (stone)', () => {
      const results = kanjivg.search('碚');
      
      expect(results.length).toBeGreaterThanOrEqual(2);
      
      const baseForm = results.find(r => !r.variant);
      const kaishoForm = results.find(r => r.variant === 'Kaisho');
      
      expect(baseForm).toBeDefined();
      expect(kaishoForm).toBeDefined();
      
      expect(baseForm!.character).toBe('碚');
      expect(kaishoForm!.character).toBe('碚');
      expect(baseForm!.code).toBe('0789a');
      expect(kaishoForm!.code).toBe('0789a');
    });

    test('should find three variants for 宙 (space/universe)', () => {
      const results = kanjivg.search('宙');
      
      expect(results.length).toBeGreaterThanOrEqual(3);
      
      const baseForm = results.find(r => !r.variant);
      const kaishoForm = results.find(r => r.variant === 'Kaisho');
      const kaishoVtLstForm = results.find(r => r.variant === 'KaishoVtLst');
      
      expect(baseForm).toBeDefined();
      expect(kaishoForm).toBeDefined();
      expect(kaishoVtLstForm).toBeDefined();
      
      // All should have same character and code
      expect(baseForm!.character).toBe('宙');
      expect(kaishoForm!.character).toBe('宙');
      expect(kaishoVtLstForm!.character).toBe('宙');
      expect(baseForm!.code).toBe('05b99');
      expect(kaishoForm!.code).toBe('05b99');
      expect(kaishoVtLstForm!.code).toBe('05b99');
    });

    test('should find three variants for 罩 (cover)', () => {
      const results = kanjivg.search('罩');
      
      expect(results.length).toBeGreaterThanOrEqual(3);
      
      const variants = results.map(r => r.variant || 'base');
      expect(variants).toContain('base');
      expect(variants).toContain('Kaisho');
      expect(variants).toContain('KaishoHzFst');
    });
  });

  describe('Variant Lookup Functionality', () => {
    test('should handle lookup by variant key', () => {
      const result = kanjivg.lookup('04e14-Kaisho');
      expect(result).toBeDefined();
      expect(result!.character).toBe('且');
      expect(result!.variant).toBe('Kaisho');
    });

    test('should handle lookup by base key', () => {
      const result = kanjivg.lookup('04e14');
      expect(result).toBeDefined();
      expect(result!.character).toBe('且');
      expect(result!.variant).toBeNull();
    });

    test('should handle characters with no variants', () => {
      const results = kanjivg.search('一');
      expect(results).toHaveLength(1);
      expect(results[0].variant).toBeNull();
    });
  });

  describe('Variant Data Validation', () => {
    test('should have correct total entries', () => {
      const totalEntries = Object.keys(realData.kanji).length;
      expect(totalEntries).toBe(11661);
    });

    test('should have correct variant distribution', () => {
      const allKeys = Object.keys(realData.kanji);
      const variantKeys = allKeys.filter(key => key.includes('-'));
      const baseKeys = allKeys.filter(key => !key.includes('-'));
      
      expect(variantKeys.length).toBe(4959);
      expect(baseKeys.length).toBe(6702);
    });

    test('should have characters with multiple variant types', () => {
      const index = realData.index;
      const charactersWithVariants = Object.keys(index).filter(char => 
        index[char].length > 1
      );
      
      expect(charactersWithVariants.length).toBeGreaterThan(0);
      
      // Check that we have characters with different numbers of variants
      const variantCounts = charactersWithVariants.map(char => index[char].length);
      const maxVariants = Math.max(...variantCounts);
      expect(maxVariants).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Variant Search Edge Cases', () => {
    test('should respect limit option with variants', () => {
      const results = kanjivg.search('且', { limit: 1 });
      expect(results).toHaveLength(1);
    });

    test('should return empty array for non-existent character', () => {
      const results = kanjivg.search('nonexistent');
      expect(results).toHaveLength(0);
    });

    test('should have consistent stroke count across variants', () => {
      const results = kanjivg.search('宙');
      
      const strokeCounts = results.map(r => r.strokeCount);
      expect(strokeCounts.every(count => count === strokeCounts[0])).toBe(true);
    });

    test('should have different stroke implementations for variants', () => {
      const results = kanjivg.search('宙');
      
      // All variants should have different stroke types
      const strokeTypes = results.map(r => r.strokeTypes);
      const uniqueStrokeTypes = new Set(strokeTypes.map(types => types.join(',')));
      expect(uniqueStrokeTypes.size).toBe(3);
    });
  });
});
