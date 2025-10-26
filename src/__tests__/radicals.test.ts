import { KanjiVG } from '../kanjivg';
import { KanjiInfo } from '../types';

describe('Radical Extraction', () => {
  let kanjivg: KanjiVG;
  let kinKanji: KanjiInfo | null;
  let tenKanji: KanjiInfo | null;

  beforeAll(async () => {
    // Load test data
    const data = await import('../../data/kanjivg-data.json');
    kanjivg = new KanjiVG(data.default as any);
    
    // Load test kanji
    kinKanji = await kanjivg.lookup('姉');
    tenKanji = await kanjivg.lookup('転');
  });

  describe('姉 (older sister) radical extraction', () => {
    test('should extract correct number of components', () => {
      expect(kinKanji).not.toBeNull();
      expect(kinKanji!.components).toHaveLength(5);
    });

    test('should identify 女 as a radical', () => {
      const radicals = kinKanji!.radicals;
      expect(radicals).toHaveLength(1);
      
      const womanRadical = radicals.find(r => r.element === '女');
      expect(womanRadical).toBeDefined();
      expect(womanRadical!.isRadical).toBe(true);
      expect(womanRadical!.position).toBe('left');
      expect(womanRadical!.radicalNumber).toBe('general');
    });

    test('should have correct component structure', () => {
      const components = kinKanji!.components;
      
      // Check all components
      expect(components[0].element).toBe('姉');
      expect(components[0].isRadical).toBe(false);
      
      expect(components[1].element).toBe('女');
      expect(components[1].isRadical).toBe(true);
      expect(components[1].position).toBe('left');
      expect(components[1].radicalNumber).toBe('general');
      
      expect(components[2].element).toBe('市');
      expect(components[2].isRadical).toBe(false);
      expect(components[2].position).toBe('right');
      
      expect(components[3].element).toBe('亠');
      expect(components[3].isRadical).toBe(false);
      
      expect(components[4].element).toBe('巾');
      expect(components[4].isRadical).toBe(false);
    });
  });

  describe('転 (turn/change) radical extraction', () => {
    test('should extract correct number of components', () => {
      expect(tenKanji).not.toBeNull();
      expect(tenKanji!.components.length).toBeGreaterThan(0);
    });

    test('should identify 車 as a radical', () => {
      const radicals = tenKanji!.radicals;
      expect(radicals).toHaveLength(1);
      
      const carRadical = radicals.find(r => r.element === '車');
      expect(carRadical).toBeDefined();
      expect(carRadical!.isRadical).toBe(true);
      expect(carRadical!.position).toBe('left');
      expect(carRadical!.radicalNumber).toBe('general');
    });

    test('should have correct component structure', () => {
      const components = tenKanji!.components;
      
      // Find the main components
      const carComponent = components.find(c => c.element === '車');
      const cloudComponent = components.find(c => c.element === '云');
      
      expect(carComponent).toBeDefined();
      expect(carComponent!.isRadical).toBe(true);
      expect(carComponent!.position).toBe('left');
      
      expect(cloudComponent).toBeDefined();
      expect(cloudComponent!.isRadical).toBe(false);
      expect(cloudComponent!.position).toBe('right');
    });
  });

  describe('Radical filtering', () => {
    test('should correctly separate radicals from components', () => {
      // 姉 should have 1 radical (女) and 4 non-radical components
      const kinRadicals = kinKanji!.radicals;
      const kinComponents = kinKanji!.components;
      
      expect(kinRadicals.length).toBe(1);
      expect(kinComponents.filter(c => c.isRadical).length).toBe(1);
      expect(kinComponents.filter(c => !c.isRadical).length).toBe(4);
      
      // 転 should have 1 radical (車) and multiple non-radical components
      const tenRadicals = tenKanji!.radicals;
      const tenComponents = tenKanji!.components;
      
      expect(tenRadicals.length).toBe(1);
      expect(tenComponents.filter(c => c.isRadical).length).toBe(1);
      expect(tenComponents.filter(c => !c.isRadical).length).toBeGreaterThan(0);
    });

    test('should have consistent radical information', () => {
      // Check that radicals array matches isRadical=true components
      const kinRadicals = kinKanji!.radicals;
      const kinRadicalComponents = kinKanji!.components.filter(c => c.isRadical);
      
      expect(kinRadicals.length).toBe(kinRadicalComponents.length);
      kinRadicals.forEach(radical => {
        const matchingComponent = kinRadicalComponents.find(c => c.element === radical.element);
        expect(matchingComponent).toBeDefined();
        expect(matchingComponent!.isRadical).toBe(true);
        expect(matchingComponent!.radicalNumber).toBe(radical.radicalNumber);
        expect(matchingComponent!.position).toBe(radical.position);
      });
    });
  });
});
