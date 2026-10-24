import { describe, expect, it } from 'vitest';
import { checkProduct, energyFromMacros, filterProducts, type OffProduct } from '../openfoodfacts';

const good: OffProduct = {
  code: '3033490506629',
  product_name_fr: 'Skyr nature',
  brands: 'Marque A,Groupe B',
  countries_tags: ['en:france'],
  completeness: 0.9,
  nutriscore_grade: 'a',
  nova_group: 1,
  data_quality_errors_tags: [],
  nutriments: { 'energy-kcal_100g': 63, proteins_100g: 10.5, carbohydrates_100g: 4, fat_100g: 0.2, fiber_100g: 0 },
};

describe('energyFromMacros', () => {
  it('applique les coefficients européens', () => {
    expect(energyFromMacros({ protein: 10, carbs: 10, fat: 10, fiber: 5 })).toBe(40 + 40 + 90 + 10);
    // 20 g de glucides dont 10 g de polyols : 10×4 + 10×2,4
    expect(energyFromMacros({ protein: 0, carbs: 20, fat: 0, polyols: 10 })).toBeCloseTo(64);
  });
});

describe('checkProduct', () => {
  it('accepte une fiche complète et cohérente', () => {
    const r = checkProduct(good);
    expect(r.food).not.toBeNull();
    expect(r.food!.brand).toBe('Marque A');
    expect(r.food!.nutriscore).toBe('a');
    expect(r.food!.nova).toBe(1);
  });
  it('convertit les kJ quand les kcal manquent', () => {
    const r = checkProduct({ ...good, nutriments: { energy_100g: 264, proteins_100g: 10.5, carbohydrates_100g: 4, fat_100g: 0.2 } });
    expect(r.food!.kcal).toBe(63);
  });
  it('écarte une fiche incomplète', () => {
    const r = checkProduct({ ...good, nutriments: { 'energy-kcal_100g': 63, proteins_100g: 10 } });
    expect(r.food).toBeNull();
    expect(r.reason).toBe('incomplet');
    expect(checkProduct({ ...good, product_name_fr: '', product_name: '' }).reason).toBe('incomplet');
    expect(checkProduct({ ...good, no_nutrition_data: 'on' }).reason).toBe('incomplet');
  });
  it('écarte des kJ saisis à la place des kcal', () => {
    const r = checkProduct({ ...good, nutriments: { ...good.nutriments, 'energy-kcal_100g': 264 } });
    expect(r.reason).toBe('incohérent');
  });
  it('écarte des valeurs impossibles', () => {
    expect(checkProduct({ ...good, nutriments: { 'energy-kcal_100g': 500, proteins_100g: 60, carbohydrates_100g: 60, fat_100g: 0 } }).reason).toBe('incohérent');
    expect(checkProduct({ ...good, nutriments: { 'energy-kcal_100g': 10, proteins_100g: -1, carbohydrates_100g: 3, fat_100g: 0 } }).reason).toBe('incohérent');
  });
  it('tolère les petits écarts d\'arrondi', () => {
    // Boisson light : 1 kcal déclarée, macros nulles
    expect(checkProduct({ ...good, nutriments: { 'energy-kcal_100g': 1, proteins_100g: 0, carbohydrates_100g: 0, fat_100g: 0 } }).food).not.toBeNull();
    // Chocolat noir : écart de 4 %
    expect(checkProduct({ ...good, nutriments: { 'energy-kcal_100g': 580, proteins_100g: 8, carbohydrates_100g: 33, fat_100g: 43, fiber_100g: 11 } }).food).not.toBeNull();
  });
  it('écarte une fiche signalée par les contrôles qualité', () => {
    expect(checkProduct({ ...good, data_quality_errors_tags: ['en:energy-value-in-kcal-does-not-match-value-in-kj'] }).reason).toBe('signalé');
  });
});

describe('filterProducts', () => {
  it('compte les fiches écartées, dédoublonne et met les produits vendus en France en premier', () => {
    const r = filterProducts([
      { ...good, code: '1', countries_tags: ['en:germany'], completeness: 1 },
      { ...good, code: '2', completeness: 0.5 },
      { ...good, code: '2', completeness: 0.5 },
      { ...good, code: '3', nutriments: {} },
    ]);
    expect(r.rejected).toBe(1);
    expect(r.foods.map((f) => f.barcode)).toEqual(['2', '1']);
  });
});
