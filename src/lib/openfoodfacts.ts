import type { Food } from '../types';

/**
 * Open Food Facts : base de données collaborative et libre (licence ODbL) de produits alimentaires.
 * https://world.openfoodfacts.org — aucune clé d'API nécessaire.
 */
const BASE = 'https://world.openfoodfacts.org';
const FIELDS = 'code,product_name,product_name_fr,brands,nutriments,serving_quantity';

interface OffProduct {
  code?: string;
  product_name?: string;
  product_name_fr?: string;
  brands?: string;
  serving_quantity?: number | string;
  nutriments?: Record<string, number | string | undefined>;
}

function num(v: unknown): number | undefined {
  const n = typeof v === 'string' ? parseFloat(v) : typeof v === 'number' ? v : NaN;
  return Number.isFinite(n) ? n : undefined;
}

export function offToFood(p: OffProduct): Food | null {
  const n = p.nutriments ?? {};
  let kcal = num(n['energy-kcal_100g']);
  if (kcal === undefined) {
    const kj = num(n['energy_100g']);
    if (kj !== undefined) kcal = kj / 4.184;
  }
  const name = (p.product_name_fr || p.product_name || '').trim();
  if (!name || kcal === undefined || !p.code) return null;
  const serving = num(p.serving_quantity);
  return {
    id: `off-${p.code}`,
    name,
    brand: p.brands?.split(',')[0]?.trim() || undefined,
    barcode: p.code,
    kcal: Math.round(kcal),
    protein: round1(num(n['proteins_100g']) ?? 0),
    carbs: round1(num(n['carbohydrates_100g']) ?? 0),
    fat: round1(num(n['fat_100g']) ?? 0),
    fiber: num(n['fiber_100g']) !== undefined ? round1(num(n['fiber_100g'])!) : undefined,
    portionG: serving && serving > 0 ? serving : undefined,
    source: 'openfoodfacts',
  };
}

function round1(v: number) {
  return Math.round(v * 10) / 10;
}

async function getJson(url: string, signal?: AbortSignal): Promise<unknown> {
  const res = await fetch(url, { signal, headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`Open Food Facts a répondu ${res.status}`);
  return res.json();
}

export async function searchOpenFoodFacts(query: string, signal?: AbortSignal): Promise<Food[]> {
  const url = `${BASE}/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=25&fields=${FIELDS}`;
  const data = (await getJson(url, signal)) as { products?: OffProduct[] };
  return (data.products ?? []).map(offToFood).filter((f): f is Food => f !== null);
}

export async function lookupBarcode(code: string, signal?: AbortSignal): Promise<Food | null> {
  const clean = code.replace(/\D/g, '');
  if (!clean) return null;
  const data = (await getJson(`${BASE}/api/v2/product/${clean}.json?fields=${FIELDS}`, signal)) as { status?: number; product?: OffProduct };
  if (!data.product) return null;
  return offToFood({ ...data.product, code: data.product.code ?? clean });
}
