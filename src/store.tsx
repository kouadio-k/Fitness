import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { AppState, NutritionTargets } from './types';
import { computeTargets } from './lib/nutrition';

const STORAGE_KEY = 'fitness-coach-v1';
export const STATE_VERSION = 1;

export const EMPTY_STATE: AppState = {
  version: STATE_VERSION,
  profile: null,
  targetsOverride: null,
  program: null,
  customSessions: [],
  workouts: [],
  cardio: [],
  foods: [],
  entries: [],
  savedMeals: [],
  water: {},
  weights: [],
  measurements: [],
  mealAnalyses: [],
  activeWorkout: null,
};

/** Complète un état chargé (ancienne version, import) avec les champs manquants. */
export function normalizeState(raw: unknown): AppState {
  if (!raw || typeof raw !== 'object') return EMPTY_STATE;
  const r = raw as Partial<AppState>;
  return {
    ...EMPTY_STATE,
    ...r,
    version: STATE_VERSION,
    customSessions: r.customSessions ?? [],
    workouts: r.workouts ?? [],
    cardio: r.cardio ?? [],
    foods: r.foods ?? [],
    entries: r.entries ?? [],
    savedMeals: r.savedMeals ?? [],
    water: r.water ?? {},
    weights: r.weights ?? [],
    measurements: r.measurements ?? [],
    mealAnalyses: r.mealAnalyses ?? [],
  };
}

function load(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? normalizeState(JSON.parse(raw)) : EMPTY_STATE;
  } catch {
    return EMPTY_STATE;
  }
}

interface Store {
  state: AppState;
  update: (fn: (s: AppState) => AppState) => void;
  replace: (s: AppState) => void;
  saveError: boolean;
}

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(load);
  const [saveError, setSaveError] = useState(false);
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      setSaveError(false);
    } catch {
      setSaveError(true);
    }
  }, [state]);

  const update = useCallback((fn: (s: AppState) => AppState) => setState((s) => fn(s)), []);
  const replace = useCallback((s: AppState) => setState(normalizeState(s)), []);
  const value = useMemo(() => ({ state, update, replace, saveError }), [state, update, replace, saveError]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const s = useContext(Ctx);
  if (!s) throw new Error('useStore doit être utilisé dans <StoreProvider>');
  return s;
}

/** Poids actuel = dernière pesée enregistrée, sinon poids du profil. */
export function currentWeight(state: AppState): number | undefined {
  if (state.weights.length) {
    return [...state.weights].sort((a, b) => a.date.localeCompare(b.date)).at(-1)!.kg;
  }
  return state.profile?.weightKg;
}

export function useTargets(): NutritionTargets | null {
  const { state } = useStore();
  return useMemo(() => {
    if (!state.profile) return null;
    const computed = computeTargets(state.profile, currentWeight(state));
    return { ...computed, ...(state.targetsOverride ?? {}) };
  }, [state]);
}
