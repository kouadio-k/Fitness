import type { Food } from '../types';

/**
 * Open Food Facts : base de données collaborative et libre (licence ODbL) de produits alimentaires.
 * https://world.openfoodfacts.org — aucune clé d'API nécessaire.
 *
 * Les fiches sont saisies par des contributeurs : avant d'afficher un produit, l'application
 * vérifie que ses valeurs nutritionnelles sont complètes et cohérentes (voir `checkProduct`).
 */
const BASE = 'https://world.openfoodfacts.org';
const FIELDS = [
  'code',
  'product_name',
  'product_name_fr',
  'brands',
  'nutriments',
  'serving_quantity',
  'no_nutrition_data',
  'data_quality_errors_tags',
  'countries_tags',
  'completeness',
  'nutriscore_grade',
  'nova_group',
].join(',');

export interface OffProduct {
  code?: string;
  product_name?: string;
  product_name_fr?: string;
  brands?: string;
  serving_quantity?: number | string;
  no_nutrition_data?: string;
  data_quality_errors_tags?: string[];
  countries_tags?: string[];
  completeness?: number | string;
  nutriscore_grade?: string;
  nova_group?: number | string;
  nutriments?: Record<string, number | string | undefined>;
}

function num(v: unknown): number | undefined {
  const n = typeof v === 'string' ? parseFloat(v) : typeof v === 'number' ? v : NaN;
  return Number.isFinite(n) ? n : undefined;
}

function round1(v: number) {
  return Math.round(v * 10) / 10;
}

export type RejectReason = 'incomplet' | 'incohérent' | 'signalé';

export interface CheckResult {
  food: Food | null;
  reason?: RejectReason;
  frenchMarket: boolean;
  completeness: number;
}

/**
 * Énergie recalculée à partir des macronutriments avec les coefficients du règlement
 * européen INCO n° 1169/2011 (annexe XIV) : protéines et glucides 4 kcal/g, lipides 9,
 * fibres 2, alcool 7, polyols 2,4 (les polyols étant comptés dans les glucides).
 */
export function energyFromMacros(n: { protein: number; carbs: number; fat: number; fiber?: number; alcohol?: number; polyols?: number }): number {
  // Sur les étiquettes européennes, les polyols font partie des glucides.
  const polyols = Math.min(n.polyols ?? 0, n.carbs);
  return n.protein * 4 + (n.carbs - polyols) * 4 + polyols * 2.4 + n.fat * 9 + (n.fiber ?? 0) * 2 + (n.alcohol ?? 0) * 7;
}

/**
 * Ne garde qu'un produit dont la fiche est exploitable :
 * - nom, code-barres, énergie, protéines, glucides et lipides renseignés pour 100 g ;
 * - valeurs plausibles (aucune valeur négative, ≤ 900 kcal, macros ≤ 100 g, somme ≤ 105 g) ;
 * - énergie déclarée cohérente avec l'énergie recalculée (écart ≤ 20 % ou ≤ 15 kcal) ;
 * - aucune erreur relevée par les contrôles qualité d'Open Food Facts.
 */
export function checkProduct(p: OffProduct): CheckResult {
  const frenchMarket = (p.countries_tags ?? []).includes('en:france');
  const completeness = num(p.completeness) ?? 0;
  const reject = (reason: RejectReason): CheckResult => ({ food: null, reason, frenchMarket, completeness });

  const name = (p.product_name_fr || p.product_name || '').trim();
  if (!name || !p.code || p.no_nutrition_data === 'on') return reject('incomplet');

  const n = p.nutriments ?? {};
  let kcal = num(n['energy-kcal_100g']);
  if (kcal === undefined) {
    const kj = num(n['energy-kj_100g']) ?? num(n['energy_100g']);
    if (kj !== undefined) kcal = kj / 4.184;
  }
  const protein = num(n['proteins_100g']);
  const carbs = num(n['carbohydrates_100g']);
  const fat = num(n['fat_100g']);
  if (kcal === undefined || protein === undefined || carbs === undefined || fat === undefined) return reject('incomplet');

  const fiber = num(n['fiber_100g']);
  const alcohol = num(n['alcohol_100g']);
  const polyols = num(n['polyols_100g']);
  const values = [kcal, protein, carbs, fat, fiber ?? 0, alcohol ?? 0, polyols ?? 0];
  if (values.some((v) => v < 0)) return reject('incohérent');
  if (kcal > 900 || protein > 100 || carbs > 100 || fat > 100) return reject('incohérent');
  if (protein + carbs + fat + (fiber ?? 0) > 105) return reject('incohérent');

  const computed = energyFromMacros({ protein, carbs, fat, fiber, alcohol, polyols });
  if (Math.abs(kcal - computed) > Math.max(15, 0.2 * Math.max(kcal, computed))) return reject('incohérent');

  if ((p.data_quality_errors_tags ?? []).length > 0) return reject('signalé');

  const serving = num(p.serving_quantity);
  const grade = (p.nutriscore_grade ?? '').toLowerCase();
  const nova = num(p.nova_group);
  return {
    frenchMarket,
    completeness,
    food: {
      id: `off-${p.code}`,
      name,
      brand: p.brands?.split(',')[0]?.trim() || undefined,
      barcode: p.code,
      kcal: Math.round(kcal),
      protein: round1(protein),
      carbs: round1(carbs),
      fat: round1(fat),
      fiber: fiber !== undefined ? round1(fiber) : undefined,
      portionG: serving && serving > 0 && serving < 2000 ? serving : undefined,
      nutriscore: (['a', 'b', 'c', 'd', 'e'] as const).find((g) => g === grade),
      nova: nova === 1 || nova === 2 || nova === 3 || nova === 4 ? nova : undefined,
      source: 'openfoodfacts',
    },
  };
}

export interface OffSearchResult {
  foods: Food[];
  rejected: number;
}

/** Filtre les produits et met en premier ceux vendus en France, puis les fiches les plus complètes. */
export function filterProducts(products: OffProduct[]): OffSearchResult {
  const checked = products.map(checkProduct);
  const kept = checked.filter((c): c is CheckResult & { food: Food } => c.food !== null);
  const seen = new Set<string>();
  const foods = kept
    .sort((a, b) => Number(b.frenchMarket) - Number(a.frenchMarket) || b.completeness - a.completeness)
    .map((c) => c.food)
    .filter((f) => (seen.has(f.id) ? false : (seen.add(f.id), true)));
  return { foods, rejected: checked.length - kept.length };
}

export class OffError extends Error {}

async function getJson(url: string, signal?: AbortSignal): Promise<unknown> {
  let res: Response;
  try {
    res = await fetch(url, { signal, headers: { Accept: 'application/json' } });
  } catch (e) {
    if ((e as Error).name === 'AbortError') throw e;
    throw new OffError(navigator.onLine ? 'Open Food Facts ne répond pas. Réessaie dans un instant.' : 'Pas de connexion internet.');
  }
  if (res.status === 429) throw new OffError('Trop de recherches en peu de temps (limite d\'Open Food Facts). Attends une minute.');
  if (!res.ok) throw new OffError(`Open Food Facts a répondu par une erreur (${res.status}). Réessaie plus tard.`);
  return res.json();
}

const searchCache = new Map<string, OffSearchResult>();

export async function searchOpenFoodFacts(query: string, signal?: AbortSignal): Promise<OffSearchResult> {
  const key = query.trim().toLowerCase();
  const cached = searchCache.get(key);
  if (cached) return cached;
  const url = `${BASE}/cgi/search.pl?search_terms=${encodeURIComponent(key)}&search_simple=1&action=process&json=1&page_size=40&fields=${FIELDS}`;
  const data = (await getJson(url, signal)) as { products?: OffProduct[] };
  const result = filterProducts(data.products ?? []);
  searchCache.set(key, result);
  return result;
}

export interface BarcodeResult {
  food: Food | null;
  /** Produit trouvé mais écarté par les contrôles */
  reason?: RejectReason;
  found: boolean;
}

export async function lookupBarcode(code: string, signal?: AbortSignal): Promise<BarcodeResult> {
  const clean = code.replace(/\D/g, '');
  if (!clean) return { food: null, found: false };
  const data = (await getJson(`${BASE}/api/v2/product/${clean}.json?fields=${FIELDS}`, signal)) as { status?: number; product?: OffProduct };
  if (!data.product) return { food: null, found: false };
  const r = checkProduct({ ...data.product, code: data.product.code ?? clean });
  return { food: r.food, reason: r.reason, found: true };
}

export const REJECT_LABELS: Record<RejectReason, string> = {
  incomplet: 'valeurs nutritionnelles incomplètes',
  incohérent: 'valeurs incohérentes (calories et macronutriments ne correspondent pas)',
  signalé: 'erreurs signalées par les contrôles qualité d\'Open Food Facts',
};
