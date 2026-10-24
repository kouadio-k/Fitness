import type { AnalyzedItem, CriterionId, Food, Goal, MealAnalysis, NutritionTargets, Profile } from '../types';
import type { Macros } from './nutrition';
import { GOAL_LABELS } from './generator';
import { uid } from './id';

// ---------------------------------------------------------------------------
// Réglages (clé API) — stockés à part de l'état principal pour ne jamais
// se retrouver dans une sauvegarde exportée.
// ---------------------------------------------------------------------------

const SETTINGS_KEY = 'fitness-coach-ai';

export type AiModel = 'claude-opus-5-5' | 'claude-haiku-5-5';

export const AI_MODELS: { value: AiModel; label: string; hint: string }[] = [
  { value: 'claude-opus-5-5', label: 'Précise (Claude Opus 5.5)', hint: 'Analyse la plus fiable · environ 3 à 7 centimes par photo' },
  { value: 'claude-haiku-5-5', label: 'Économique (Claude Haiku 5.5)', hint: 'Moins précise · moins d\'un centime par photo' },
];

export interface AiSettings {
  apiKey: string;
  model: AiModel;
}

export function loadAiSettings(): AiSettings | null {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as Partial<AiSettings>;
    if (!s.apiKey) return null;
    return { apiKey: s.apiKey, model: s.model === 'claude-haiku-5-5' ? 'claude-haiku-5-5' : 'claude-opus-5-5' };
  } catch {
    return null;
  }
}

export function saveAiSettings(s: AiSettings | null): boolean {
  try {
    if (s) localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
    else localStorage.removeItem(SETTINGS_KEY);
    return true;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Grille de notation (sur 10)
// ---------------------------------------------------------------------------

/**
 * Grille construite à partir des repères de Santé publique France (PNNS 2019 :
 * plus de fruits, légumes, légumineuses, féculents complets et fruits à coque ;
 * moins de charcuterie, de produits sucrés, salés et ultra-transformés), de la
 * classification NOVA du degré de transformation et du principe de l'assiette
 * équilibrée (½ légumes, ¼ protéines, ¼ féculents). La pondération est un choix
 * de l'application, ce n'est pas un score officiel.
 */
export const CRITERIA: { id: CriterionId; label: string; max: number; rule: string }[] = [
  {
    id: 'legumes_fruits',
    label: 'Légumes & fruits',
    max: 3,
    rule: '3 = légumes/fruits occupent environ la moitié de l\'assiette, variés ; 1,5 = présents mais en petite quantité ; 0 = absents.',
  },
  {
    id: 'proteines',
    label: 'Protéines',
    max: 2,
    rule: '2 = source de protéines en quantité suffisante et de bonne qualité (légumineuses, poisson, volaille, œufs, laitiers, tofu) ; 1 = faible quantité, ou viande rouge en grande quantité ; 0 = absente ou surtout charcuterie/viande transformée.',
  },
  {
    id: 'feculents_fibres',
    label: 'Féculents & fibres',
    max: 2,
    rule: '2 = féculents complets ou légumineuses, portion adaptée ; 1 = féculents raffinés (pain blanc, pâtes, riz blanc) ou portion très excessive ; 0 = aucun apport de fibres. Un repas sans féculent mais riche en légumes et légumineuses peut avoir 2.',
  },
  {
    id: 'transformation',
    label: 'Degré de transformation',
    max: 1.5,
    rule: '1,5 = aliments bruts ou cuisinés maison (NOVA 1-3) ; 0,75 = un élément ultra-transformé ; 0 = repas majoritairement ultra-transformé (NOVA 4 : plats industriels, fast-food, snacks).',
  },
  {
    id: 'gras_sucre_sel',
    label: 'Gras, sucre & sel',
    max: 1.5,
    rule: '1,5 = matières grasses modérées et de bonne qualité (huile d\'olive/colza, oléagineux, poisson gras), peu de sucre ajouté et de sel ; 0,75 = un excès visible (friture, sauce riche, dessert sucré, boisson sucrée, fromage abondant) ; 0 = plusieurs excès.',
  },
];

export const CRITERION_BY_ID = Object.fromEntries(CRITERIA.map((c) => [c.id, c])) as Record<CriterionId, (typeof CRITERIA)[number]>;

export function scoreLabel(score: number): { label: string; tone: 'success' | 'warning' | 'danger' } {
  if (score >= 7.5) return { label: 'Très équilibré', tone: 'success' };
  if (score >= 5) return { label: 'Plutôt équilibré', tone: 'warning' };
  return { label: 'À rééquilibrer', tone: 'danger' };
}

// ---------------------------------------------------------------------------
// Requête
// ---------------------------------------------------------------------------

/** Schéma JSON imposé à la réponse (structured outputs). */
export const ANALYSIS_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['is_food', 'meal_name', 'items', 'criteria', 'strengths', 'improvements', 'confidence', 'caveats', 'goal_comment'],
  properties: {
    is_food: { type: 'boolean', description: 'false si la photo ne montre pas de nourriture' },
    meal_name: { type: 'string', description: 'Nom court du repas en français' },
    items: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['name', 'grams', 'kcal', 'protein', 'carbs', 'fat', 'fiber'],
        properties: {
          name: { type: 'string', description: 'Aliment en français, avec son mode de cuisson si visible' },
          grams: { type: 'number', description: 'Quantité estimée en grammes (ou ml)' },
          kcal: { type: 'number', description: 'Calories pour la quantité estimée' },
          protein: { type: 'number', description: 'Protéines (g) pour la quantité estimée' },
          carbs: { type: 'number', description: 'Glucides (g) pour la quantité estimée' },
          fat: { type: 'number', description: 'Lipides (g) pour la quantité estimée' },
          fiber: { type: 'number', description: 'Fibres (g) pour la quantité estimée' },
        },
      },
    },
    criteria: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['id', 'score', 'comment'],
        properties: {
          id: { type: 'string', enum: CRITERIA.map((c) => c.id) },
          score: { type: 'number' },
          comment: { type: 'string', description: 'Une phrase qui justifie la note à partir de ce qui est visible' },
        },
      },
    },
    strengths: { type: 'array', items: { type: 'string' } },
    improvements: { type: 'array', items: { type: 'string' } },
    confidence: { type: 'string', enum: ['faible', 'moyenne', 'bonne'] },
    caveats: { type: 'string', description: 'Ce que la photo ne permet pas de savoir (huile, sauce, sucre, quantités cachées…)' },
    goal_comment: { type: 'string', description: 'Une ou deux phrases sur ce repas par rapport à l\'objectif et à la journée' },
  },
} as const;

export const SYSTEM_PROMPT = `Tu analyses la photo d'un repas pour une application de suivi nutritionnel en français. L'utilisatrice veut savoir si son repas est équilibré et pourquoi.

1. Identifie chaque aliment visible et estime sa quantité en grammes à partir des repères visuels (taille de l'assiette, des couverts, des mains). Estime ensuite calories, protéines, glucides, lipides et fibres pour chaque aliment à partir de valeurs nutritionnelles moyennes de référence (type table Ciqual). Si un aliment est incertain, choisis l'hypothèse la plus probable et signale-le dans "caveats".

2. Note le repas avec cette grille. Donne pour chaque critère une note entre 0 et son maximum (par pas de 0,25) et une phrase de justification fondée sur ce qui est visible :
${CRITERIA.map((c) => `- ${c.id} (${c.label}, sur ${c.max}) : ${c.rule}`).join('\n')}
Évalue le repas tel qu'il est servi : un dessert ou une boisson visible fait partie du repas. Ne note pas plus sévèrement un repas simplement parce qu'il est copieux si l'utilisatrice cherche à prendre du muscle.

3. "strengths" : 1 à 3 points forts concrets. "improvements" : 1 à 3 suggestions concrètes et faciles (ex. « ajouter une portion de crudités », « remplacer le pain blanc par du pain complet »).

4. "goal_comment" : relie ce repas à son objectif et à ce qu'elle a déjà mangé aujourd'hui (fourni dans le message).

Ton : bienveillant, factuel, jamais culpabilisant. Pas de vocabulaire moralisateur (« mauvais », « interdit », « craquer »). Un repas isolé ne fait pas une alimentation : rappelle-le si la note est basse. Ne donne pas de conseil médical.

Si la photo ne montre pas de nourriture, mets is_food à false, laisse items vide, mets 0 à chaque critère et explique-le dans caveats.`;

export interface AnalysisContext {
  goal: Goal;
  diet: Profile['diet'];
  targets: NutritionTargets;
  consumed: Macros;
}

export function buildUserText(ctx: AnalysisContext): string {
  const diet = { omnivore: 'mange de tout', pescatarian: 'pescétarienne', vegetarian: 'végétarienne', vegan: 'végane' }[ctx.diet];
  return [
    'Analyse ce repas.',
    `Objectif : ${GOAL_LABELS[ctx.goal].toLowerCase()}. Régime : ${diet}.`,
    `Objectifs du jour : ${ctx.targets.kcal} kcal, ${ctx.targets.protein} g de protéines, ${ctx.targets.fiber} g de fibres.`,
    `Déjà consommé aujourd'hui avant ce repas : ${Math.round(ctx.consumed.kcal)} kcal, ${Math.round(ctx.consumed.protein)} g de protéines, ${Math.round(ctx.consumed.fiber)} g de fibres.`,
  ].join('\n');
}

// ---------------------------------------------------------------------------
// Normalisation de la réponse
// ---------------------------------------------------------------------------

interface RawAnalysis {
  is_food: boolean;
  meal_name: string;
  items: { name: string; grams: number; kcal: number; protein: number; carbs: number; fat: number; fiber: number }[];
  criteria: { id: string; score: number; comment: string }[];
  strengths: string[];
  improvements: string[];
  confidence: string;
  caveats: string;
  goal_comment: string;
}

const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? Math.max(0, v) : 0);
const r1 = (v: number) => Math.round(v * 10) / 10;

/**
 * Valide et borne la réponse du modèle. La note finale est recalculée ici
 * (somme des critères bornés à leur maximum) plutôt que reprise telle quelle.
 */
export function normalizeAnalysis(raw: unknown, meta: { model: string; date: string; thumbnail?: string; now?: Date }): MealAnalysis {
  const r = (raw ?? {}) as Partial<RawAnalysis>;
  const isFood = r.is_food !== false;
  const criteria = CRITERIA.map((c) => {
    const found = (r.criteria ?? []).find((x) => x.id === c.id);
    const score = isFood ? Math.min(c.max, Math.round(num(found?.score) * 4) / 4) : 0;
    return { id: c.id, score, max: c.max, comment: found?.comment?.trim() || '—' };
  });
  const items: AnalyzedItem[] = isFood
    ? (r.items ?? [])
        .filter((i) => i && typeof i.name === 'string' && i.name.trim() !== '' && num(i.grams) > 0)
        .map((i) => ({
          name: i.name.trim(),
          grams: Math.round(num(i.grams)),
          kcal: Math.round(num(i.kcal)),
          protein: r1(num(i.protein)),
          carbs: r1(num(i.carbs)),
          fat: r1(num(i.fat)),
          fiber: r1(num(i.fiber)),
        }))
    : [];
  const confidence = r.confidence === 'bonne' || r.confidence === 'faible' ? r.confidence : 'moyenne';
  const strings = (a: unknown) => (Array.isArray(a) ? a.filter((x): x is string => typeof x === 'string' && x.trim() !== '').slice(0, 4) : []);
  return {
    id: uid(),
    date: meta.date,
    createdAt: (meta.now ?? new Date()).toISOString(),
    thumbnail: meta.thumbnail,
    isFood,
    mealName: (r.meal_name ?? '').trim() || (isFood ? 'Repas' : 'Pas de repas détecté'),
    // Les critères sont au quart de point près : la somme l'est aussi, sans arrondi supplémentaire.
    score: criteria.reduce((s, c) => s + c.score, 0),
    criteria,
    strengths: strings(r.strengths),
    improvements: strings(r.improvements),
    items,
    confidence,
    caveats: (r.caveats ?? '').trim(),
    goalComment: (r.goal_comment ?? '').trim(),
    model: meta.model,
  };
}

/** Convertit un aliment estimé en "aliment" du journal (valeurs ramenées à 100 g). */
export function itemToFood(item: AnalyzedItem): Food {
  const k = 100 / item.grams;
  return {
    id: `ai-${uid()}`,
    name: `${item.name} (estimé)`,
    kcal: Math.round(item.kcal * k),
    protein: r1(item.protein * k),
    carbs: r1(item.carbs * k),
    fat: r1(item.fat * k),
    fiber: r1(item.fiber * k),
    source: 'ai',
  };
}

// ---------------------------------------------------------------------------
// Image
// ---------------------------------------------------------------------------

function loadImage(file: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Image illisible'));
    };
    img.src = url;
  });
}

function toJpeg(img: HTMLImageElement, maxEdge: number, quality: number): string {
  const scale = Math.min(1, maxEdge / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.max(1, Math.round(img.naturalWidth * scale));
  const h = Math.max(1, Math.round(img.naturalHeight * scale));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas indisponible');
  ctx.drawImage(img, 0, 0, w, h);
  return canvas.toDataURL('image/jpeg', quality);
}

/**
 * Prépare la photo : version réduite (1280 px de côté max) pour l'analyse — le coût
 * dépend du nombre de pixels — et miniature pour l'historique.
 */
export async function preparePhoto(file: Blob): Promise<{ base64: string; dataUrl: string; thumbnail: string }> {
  const img = await loadImage(file);
  const dataUrl = toJpeg(img, 1280, 0.85);
  const thumbnail = toJpeg(img, 240, 0.7);
  return { base64: dataUrl.slice(dataUrl.indexOf(',') + 1), dataUrl, thumbnail };
}

// ---------------------------------------------------------------------------
// Appel à l'API Claude
// ---------------------------------------------------------------------------

export class AnalysisError extends Error {}

export async function analyzeMealPhoto(settings: AiSettings, imageBase64: string, ctx: AnalysisContext, signal?: AbortSignal): Promise<RawAnalysis> {
  // Chargé à la demande : le SDK n'alourdit pas le reste de l'application.
  const { default: Anthropic } = await import('@anthropic-ai/sdk');
  // L'appel part directement du téléphone : la clé est celle de l'utilisatrice, stockée sur son appareil.
  const client = new Anthropic({ apiKey: settings.apiKey, dangerouslyAllowBrowser: true, maxRetries: 1 });

  try {
    const isOpus = settings.model === 'claude-opus-5-5';
    const response = await client.beta.messages.create(
      {
        model: settings.model,
        max_tokens: 16000,
        // Haiku 5.5 n'a pas de bascule automatique en cas de refus.
        ...(isOpus ? { betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default' as const } : {}),
        output_config: { effort: 'medium', format: { type: 'json_schema', schema: ANALYSIS_SCHEMA } },
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: imageBase64 } },
              { type: 'text', text: buildUserText(ctx) },
            ],
          },
        ],
      },
      { signal },
    );

    if (response.stop_reason === 'refusal') throw new AnalysisError('L\'analyse de cette photo a été refusée. Essaie avec une autre photo du repas.');
    if (response.stop_reason === 'max_tokens') throw new AnalysisError('La réponse a été coupée avant la fin. Réessaie.');
    const text = response.content.find((b) => b.type === 'text');
    if (!text || text.type !== 'text') throw new AnalysisError('Réponse vide. Réessaie.');
    try {
      return JSON.parse(text.text) as RawAnalysis;
    } catch {
      throw new AnalysisError('Réponse illisible. Réessaie.');
    }
  } catch (e) {
    if (e instanceof AnalysisError || e instanceof Anthropic.APIUserAbortError) throw e;
    if (e instanceof Anthropic.AuthenticationError) throw new AnalysisError('Clé API refusée : vérifie-la dans Profil → Analyse photo.');
    if (e instanceof Anthropic.PermissionDeniedError) throw new AnalysisError('Cette clé API n\'a pas accès à ce modèle.');
    if (e instanceof Anthropic.RateLimitError) throw new AnalysisError('Trop de demandes en peu de temps. Attends une minute et réessaie.');
    if (e instanceof Anthropic.BadRequestError) throw new AnalysisError(`Requête refusée par l'API : ${e.message}. Si le message parle de crédit, recharge ton compte sur console.anthropic.com.`);
    if (e instanceof Anthropic.APIConnectionError) throw new AnalysisError('Connexion impossible. Vérifie ta connexion internet.');
    if (e instanceof Anthropic.APIError) throw new AnalysisError(`Le service d'analyse est indisponible (erreur ${e.status ?? '?'}). Réessaie plus tard.`);
    throw e;
  }
}
