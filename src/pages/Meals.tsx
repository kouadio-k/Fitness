import { useMemo, useRef, useState } from 'react';
import { useStore, useTargets } from '../store';
import { BUILTIN_FOODS, MEAL_IDEAS, MEAL_SLOT_LABELS, MEAL_SLOTS, SLOT_SHARE, FOOD_BY_ID } from '../data/foods';
import { macrosFor, sumEntries, type Macros } from '../lib/nutrition';
import { addDays, relativeDay, toISODate } from '../lib/dates';
import { uid } from '../lib/id';
import { lookupBarcode, searchOpenFoodFacts } from '../lib/openfoodfacts';
import { Icon, MacroBar, NumberInput, Ring, Sheet, Tabs, toast } from '../components/ui';
import type { AppState, Food, FoodEntry, MealSlot } from '../types';
import { MealPhotoCard } from './MealPhoto';

const SLOT_EMOJI: Record<MealSlot, string> = { breakfast: '🥣', lunch: '🥗', snack: '🍎', dinner: '🍲' };

export function Meals() {
  const { state, update } = useStore();
  const targets = useTargets();
  const [date, setDate] = useState(toISODate());
  const [picker, setPicker] = useState<MealSlot | null>(null);
  const [editing, setEditing] = useState<FoodEntry | null>(null);
  const entries = state.entries.filter((e) => e.date === date);
  const totals = sumEntries(entries);

  const copyYesterday = (slot: MealSlot) => {
    const prev = state.entries.filter((e) => e.date === addDays(date, -1) && e.slot === slot);
    if (!prev.length) return toast('Rien à copier pour ce repas hier');
    update((s) => ({ ...s, entries: [...s.entries, ...prev.map((e) => ({ ...e, id: uid(), date }))] }));
    toast(`${prev.length} aliment(s) copié(s)`);
  };

  const saveMeal = (slot: MealSlot) => {
    const items = entries.filter((e) => e.slot === slot);
    if (!items.length) return;
    const name = window.prompt('Nom de ce repas (pour le réutiliser plus tard) :', MEAL_SLOT_LABELS[slot]);
    if (!name) return;
    update((s) => ({ ...s, savedMeals: [...s.savedMeals, { id: uid(), name, items: items.map((e) => ({ food: e.food, grams: e.grams })) }] }));
    toast('Repas enregistré');
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>Repas</h1>
      </div>
      <div className="row between card" style={{ padding: 8, flexDirection: 'row' }}>
        <button className="icon-btn" onClick={() => setDate(addDays(date, -1))} aria-label="Jour précédent">
          <Icon name="chevronLeft" />
        </button>
        <label className="bold" style={{ position: 'relative', cursor: 'pointer' }}>
          {relativeDay(date)}
          <input type="date" value={date} onChange={(e) => e.target.value && setDate(e.target.value)} style={{ position: 'absolute', inset: 0, opacity: 0 }} aria-label="Choisir une date" />
        </label>
        <button className="icon-btn" onClick={() => setDate(addDays(date, 1))} aria-label="Jour suivant">
          <Icon name="chevronRight" />
        </button>
      </div>

      {targets && <DaySummary totals={totals} targets={targets} />}
      <MealPhotoCard date={date} />
      <WaterCard date={date} />

      {MEAL_SLOTS.map((slot) => {
        const items = entries.filter((e) => e.slot === slot);
        const t = sumEntries(items);
        return (
          <div key={slot} className="card">
            <div className="card-title">
              <h3>
                {SLOT_EMOJI[slot]} {MEAL_SLOT_LABELS[slot]}
              </h3>
              <span className="small muted kbd-num">
                {Math.round(t.kcal)}
                {targets ? ` / ${Math.round(targets.kcal * SLOT_SHARE[slot])}` : ''} kcal
              </span>
            </div>
            {items.length > 0 && (
              <div className="list">
                {items.map((e) => {
                  const m = macrosFor(e.food, e.grams);
                  return (
                    <button key={e.id} className="list-item" onClick={() => setEditing(e)}>
                      <div className="grow">
                        <div className="ellipsis">{e.food.name}</div>
                        <div className="small muted">
                          {e.grams} g · P {m.protein.toFixed(0)} · G {m.carbs.toFixed(0)} · L {m.fat.toFixed(0)}
                        </div>
                      </div>
                      <span className="kbd-num small bold">{Math.round(m.kcal)}</span>
                    </button>
                  );
                })}
              </div>
            )}
            <div className="row wrap">
              <button className="btn secondary small" onClick={() => setPicker(slot)}>
                <Icon name="plus" size={16} /> Ajouter
              </button>
              {items.length === 0 ? (
                <button className="btn ghost small" onClick={() => copyYesterday(slot)}>
                  <Icon name="copy" size={16} /> Copier d'hier
                </button>
              ) : (
                <button className="btn ghost small" onClick={() => saveMeal(slot)}>
                  <Icon name="save" size={16} /> Enregistrer ce repas
                </button>
              )}
            </div>
          </div>
        );
      })}
      <p className="tiny muted center">
        Valeurs des aliments de base : moyennes indicatives (tables Ciqual/ANSES et USDA). Pour un produit précis, utilise la recherche Open Food Facts ou l'étiquette.
      </p>

      {picker && <FoodPicker slot={picker} date={date} onClose={() => setPicker(null)} />}
      {editing && <EntryEditor entry={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}

export function DaySummary({ totals, targets, compact }: { totals: Macros; targets: { kcal: number; protein: number; carbs: number; fat: number; fiber: number }; compact?: boolean }) {
  const left = Math.round(targets.kcal - totals.kcal);
  return (
    <div className="card">
      <div className="row" style={{ gap: 16 }}>
        <Ring value={totals.kcal} max={targets.kcal} size={compact ? 100 : 116}>
          <div className="bold kbd-num" style={{ fontSize: compact ? '1.1rem' : '1.3rem' }}>
            {Math.abs(left)}
          </div>
          <div className="tiny muted">{left >= 0 ? 'kcal restantes' : 'kcal en plus'}</div>
        </Ring>
        <div className="col grow" style={{ gap: 8 }}>
          <MacroBar label="Protéines" value={totals.protein} target={targets.protein} color="var(--protein)" />
          <MacroBar label="Glucides" value={totals.carbs} target={targets.carbs} color="var(--carbs)" />
          <MacroBar label="Lipides" value={totals.fat} target={targets.fat} color="var(--fat)" />
          {!compact && <MacroBar label="Fibres" value={totals.fiber} target={targets.fiber} color="var(--success)" />}
        </div>
      </div>
      <div className="small muted center kbd-num">
        {Math.round(totals.kcal)} kcal consommées sur {targets.kcal}
      </div>
    </div>
  );
}

export function WaterCard({ date }: { date: string }) {
  const { state, update } = useStore();
  const targets = useTargets();
  const ml = state.water[date] ?? 0;
  const goal = targets?.waterMl ?? 2000;
  const glasses = Math.ceil(goal / 250);
  const setMl = (v: number) => update((s) => ({ ...s, water: { ...s.water, [date]: Math.max(0, v) } }));
  return (
    <div className="card">
      <div className="card-title">
        <h3>
          <Icon name="water" size={20} /> Hydratation
        </h3>
        <span className="small muted kbd-num">
          {(ml / 1000).toFixed(2).replace('.', ',')} / {(goal / 1000).toFixed(1).replace('.', ',')} L
        </span>
      </div>
      <div className="water-glasses">
        {Array.from({ length: Math.max(glasses, Math.ceil(ml / 250)) }, (_, i) => (
          <button key={i} className={`glass ${i < Math.round(ml / 250) ? 'full' : ''}`} aria-label={`${(i + 1) * 250} ml`} onClick={() => setMl((i + 1) * 250 === ml ? i * 250 : (i + 1) * 250)} />
        ))}
      </div>
      <div className="row">
        <button className="btn secondary small" onClick={() => setMl(ml + 250)}>
          + 1 verre (250 ml)
        </button>
        <button className="btn ghost small" onClick={() => setMl(ml + 500)}>
          + 500 ml
        </button>
        {ml > 0 && (
          <button className="btn ghost small" onClick={() => setMl(ml - 250)}>
            − 250
          </button>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------

type PickerTab = 'search' | 'online' | 'saved' | 'ideas' | 'create';

function norm(s: string) {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function addEntries(items: { food: Food; grams: number }[], date: string, slot: MealSlot) {
  return (s: AppState): AppState => {
    const foods = [...s.foods];
    for (const { food } of items) {
      if (food.source !== 'builtin' && !foods.some((f) => f.id === food.id)) foods.push(food);
    }
    return {
      ...s,
      foods,
      entries: [...s.entries, ...items.map(({ food, grams }) => ({ id: uid(), date, slot, foodId: food.id, food, grams }))],
    };
  };
}

function FoodPicker({ slot, date, onClose }: { slot: MealSlot; date: string; onClose: () => void }) {
  const { update } = useStore();
  const [tab, setTab] = useState<PickerTab>('search');
  const [selected, setSelected] = useState<Food | null>(null);
  return (
    <Sheet title={`Ajouter · ${MEAL_SLOT_LABELS[slot]}`} onClose={onClose} full>
      <Tabs<PickerTab>
        tabs={[
          { value: 'search', label: 'Aliments' },
          { value: 'online', label: 'Produits' },
          { value: 'saved', label: 'Mes repas' },
          { value: 'ideas', label: 'Idées' },
          { value: 'create', label: 'Créer' },
        ]}
        value={tab}
        onChange={setTab}
      />
      {tab === 'search' && <LocalSearch onSelect={setSelected} />}
      {tab === 'online' && <OnlineSearch onSelect={setSelected} />}
      {tab === 'saved' && <SavedMeals slot={slot} date={date} onDone={onClose} />}
      {tab === 'ideas' && <MealIdeas slot={slot} date={date} onDone={onClose} />}
      {tab === 'create' && <CreateFood onCreated={setSelected} />}
      {selected && (
        <QuantitySheet
          food={selected}
          onClose={() => setSelected(null)}
          onConfirm={(grams) => {
            update(addEntries([{ food: selected, grams }], date, slot));
            toast('Ajouté');
            setSelected(null);
            onClose();
          }}
        />
      )}
    </Sheet>
  );
}

function FoodRow({ food, onClick }: { food: Food; onClick: () => void }) {
  return (
    <button className="list-item" onClick={onClick}>
      <div className="grow">
        <div className="ellipsis">{food.name}</div>
        <div className="small muted ellipsis">
          {food.brand ? `${food.brand} · ` : ''}
          {food.kcal} kcal · P {food.protein} · G {food.carbs} · L {food.fat} <span className="tiny">/100 g</span>
        </div>
      </div>
      {food.source === 'custom' && <span className="badge neutral">perso</span>}
      <Icon name="plus" />
    </button>
  );
}

function LocalSearch({ onSelect }: { onSelect: (f: Food) => void }) {
  const { state } = useStore();
  const [q, setQ] = useState('');
  const recent = useMemo(() => {
    const seen = new Set<string>();
    const out: Food[] = [];
    for (const e of [...state.entries].reverse()) {
      if (seen.has(e.foodId)) continue;
      seen.add(e.foodId);
      out.push(e.food);
      if (out.length >= 12) break;
    }
    return out;
  }, [state.entries]);
  const all = useMemo(() => [...state.foods, ...BUILTIN_FOODS], [state.foods]);
  const results = q.trim() ? all.filter((f) => norm(f.name + ' ' + (f.brand ?? '')).includes(norm(q.trim()))) : [];
  const byCategory = useMemo(() => {
    const m = new Map<string, Food[]>();
    for (const f of BUILTIN_FOODS) m.set(f.category ?? 'Autres', [...(m.get(f.category ?? 'Autres') ?? []), f]);
    return [...m.entries()];
  }, []);

  return (
    <>
      <div className="input-suffix">
        <input className="input" placeholder="Rechercher (poulet, riz, skyr…)" value={q} onChange={(e) => setQ(e.target.value)} autoFocus />
        <span>
          <Icon name="search" size={18} />
        </span>
      </div>
      {q.trim() ? (
        <div className="list">
          {results.map((f) => (
            <FoodRow key={f.id} food={f} onClick={() => onSelect(f)} />
          ))}
          {!results.length && <div className="empty">Aucun résultat. Essaie l'onglet « Produits » (Open Food Facts) ou crée l'aliment.</div>}
        </div>
      ) : (
        <>
          {recent.length > 0 && (
            <div className="col">
              <h3>Récents</h3>
              <div className="list">
                {recent.map((f) => (
                  <FoodRow key={f.id} food={f} onClick={() => onSelect(FOOD_BY_ID[f.id] ?? f)} />
                ))}
              </div>
            </div>
          )}
          {state.foods.filter((f) => f.source === 'custom').length > 0 && (
            <details className="disclosure">
              <summary>Mes aliments</summary>
              <div className="list">
                {state.foods
                  .filter((f) => f.source === 'custom')
                  .map((f) => (
                    <FoodRow key={f.id} food={f} onClick={() => onSelect(f)} />
                  ))}
              </div>
            </details>
          )}
          {byCategory.map(([cat, foods]) => (
            <details key={cat} className="disclosure">
              <summary>{cat}</summary>
              <div className="list">
                {foods.map((f) => (
                  <FoodRow key={f.id} food={f} onClick={() => onSelect(f)} />
                ))}
              </div>
            </details>
          ))}
        </>
      )}
    </>
  );
}

function OnlineSearch({ onSelect }: { onSelect: (f: Food) => void }) {
  const [q, setQ] = useState('');
  const [code, setCode] = useState('');
  const [results, setResults] = useState<Food[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abort = useRef<AbortController | null>(null);

  const run = async (fn: (signal: AbortSignal) => Promise<Food[]>) => {
    abort.current?.abort();
    const ctrl = new AbortController();
    abort.current = ctrl;
    setLoading(true);
    setError(null);
    try {
      setResults(await fn(ctrl.signal));
    } catch (e) {
      if ((e as Error).name !== 'AbortError') setError(navigator.onLine ? 'La recherche a échoué. Réessaie dans un instant.' : 'Pas de connexion internet.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <p className="small muted">
        Recherche parmi les produits du commerce grâce à <b>Open Food Facts</b>, la base collaborative et gratuite. Nécessite une connexion internet. Les données sont saisies par des contributeurs : vérifie-les avec l'étiquette en cas de doute.
      </p>
      <form
        className="row"
        onSubmit={(e) => {
          e.preventDefault();
          if (q.trim()) run((s) => searchOpenFoodFacts(q.trim(), s));
        }}
      >
        <input className="input grow" placeholder="Nom ou marque (ex. skyr Siggi's)" value={q} onChange={(e) => setQ(e.target.value)} />
        <button className="btn" type="submit" disabled={!q.trim() || loading}>
          <Icon name="search" size={18} />
        </button>
      </form>
      <form
        className="row"
        onSubmit={(e) => {
          e.preventDefault();
          if (code.trim())
            run(async (s) => {
              const f = await lookupBarcode(code, s);
              return f ? [f] : [];
            });
        }}
      >
        <input className="input grow" inputMode="numeric" placeholder="Code-barres (chiffres sous le code)" value={code} onChange={(e) => setCode(e.target.value)} />
        <button className="btn secondary" type="submit" disabled={!code.trim() || loading}>
          <Icon name="barcode" size={18} />
        </button>
      </form>
      {loading && <div className="empty">Recherche…</div>}
      {error && <div className="notice danger">{error}</div>}
      {results && !loading && (
        <div className="list">
          {results.map((f) => (
            <FoodRow key={f.id} food={f} onClick={() => onSelect(f)} />
          ))}
          {!results.length && <div className="empty">Aucun produit trouvé (ou valeurs nutritionnelles manquantes).</div>}
        </div>
      )}
    </>
  );
}

function SavedMeals({ slot, date, onDone }: { slot: MealSlot; date: string; onDone: () => void }) {
  const { state, update } = useStore();
  if (!state.savedMeals.length) return <div className="empty">Aucun repas enregistré. Après avoir rempli un repas, touche « Enregistrer ce repas » pour le réutiliser en un clic.</div>;
  return (
    <div className="list">
      {state.savedMeals.map((m) => {
        const t = sumEntries(m.items);
        return (
          <div key={m.id} className="list-item static">
            <div className="grow">
              <div className="bold">{m.name}</div>
              <div className="small muted">
                {m.items.length} aliment(s) · {Math.round(t.kcal)} kcal · P {Math.round(t.protein)} g
              </div>
            </div>
            <button
              className="icon-btn plain"
              aria-label="Supprimer"
              onClick={() => window.confirm(`Supprimer « ${m.name} » ?`) && update((s) => ({ ...s, savedMeals: s.savedMeals.filter((x) => x.id !== m.id) }))}
            >
              <Icon name="trash" />
            </button>
            <button
              className="icon-btn"
              aria-label="Ajouter"
              onClick={() => {
                update(addEntries(m.items, date, slot));
                toast(`${m.name} ajouté`);
                onDone();
              }}
            >
              <Icon name="plus" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

function MealIdeas({ slot, date, onDone }: { slot: MealSlot; date: string; onDone: () => void }) {
  const { state, update } = useStore();
  const targets = useTargets();
  const diet = state.profile?.diet ?? 'omnivore';
  const ideas = MEAL_IDEAS.filter((i) => i.slot === slot && i.diets.includes(diet));
  const goal = targets ? targets.kcal * SLOT_SHARE[slot] : undefined;

  return (
    <>
      <p className="small muted">
        Idées de repas équilibrés adaptées à ton régime{goal ? `, quantités ajustées pour viser environ ${Math.round(goal)} kcal` : ''}. Tu pourras modifier chaque aliment ensuite.
      </p>
      {ideas.map((idea) => {
        const base = idea.items.map((i) => ({ food: FOOD_BY_ID[i.foodId], grams: i.grams })).filter((i) => i.food);
        const baseKcal = sumEntries(base).kcal;
        const factor = goal ? Math.min(1.6, Math.max(0.6, goal / baseKcal)) : 1;
        const items = base.map((i) => ({ ...i, grams: Math.round((i.grams * factor) / 5) * 5 }));
        const t = sumEntries(items);
        return (
          <div key={idea.id} className="card flat">
            <div className="row between">
              <h3>{idea.name}</h3>
              <span className="small bold kbd-num">{Math.round(t.kcal)} kcal</span>
            </div>
            <div className="small muted">
              {items.map((i) => `${i.food.name} ${i.grams} g`).join(' · ')}
            </div>
            <div className="small kbd-num">
              P {Math.round(t.protein)} g · G {Math.round(t.carbs)} g · L {Math.round(t.fat)} g · fibres {Math.round(t.fiber)} g
            </div>
            <button
              className="btn secondary small"
              style={{ alignSelf: 'flex-start' }}
              onClick={() => {
                update(addEntries(items, date, slot));
                toast('Repas ajouté');
                onDone();
              }}
            >
              <Icon name="plus" size={16} /> Ajouter ce repas
            </button>
          </div>
        );
      })}
      {!ideas.length && <div className="empty">Pas d'idée pour ce repas.</div>}
    </>
  );
}

function CreateFood({ onCreated }: { onCreated: (f: Food) => void }) {
  const { update } = useStore();
  const [f, setF] = useState<{ name: string; kcal?: number; protein?: number; carbs?: number; fat?: number; fiber?: number; portionG?: number }>({ name: '' });
  const valid = f.name.trim() && f.kcal !== undefined;
  const computedKcal = (f.protein ?? 0) * 4 + (f.carbs ?? 0) * 4 + (f.fat ?? 0) * 9 + (f.fiber ?? 0) * 2;
  return (
    <>
      <p className="small muted">Recopie les valeurs « pour 100 g » de l'étiquette.</p>
      <label className="field">
        Nom
        <input className="input" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Ex. Granola maison" />
      </label>
      <div className="grid-2">
        <label className="field">
          Énergie
          <NumberInput value={f.kcal} onChange={(v) => setF({ ...f, kcal: v })} suffix="kcal" />
        </label>
        <label className="field">
          Protéines
          <NumberInput value={f.protein} onChange={(v) => setF({ ...f, protein: v })} suffix="g" step={0.1} />
        </label>
        <label className="field">
          Glucides
          <NumberInput value={f.carbs} onChange={(v) => setF({ ...f, carbs: v })} suffix="g" step={0.1} />
        </label>
        <label className="field">
          Lipides
          <NumberInput value={f.fat} onChange={(v) => setF({ ...f, fat: v })} suffix="g" step={0.1} />
        </label>
        <label className="field">
          Fibres <span className="hint">(facultatif)</span>
          <NumberInput value={f.fiber} onChange={(v) => setF({ ...f, fiber: v })} suffix="g" step={0.1} />
        </label>
        <label className="field">
          Portion <span className="hint">(facultatif)</span>
          <NumberInput value={f.portionG} onChange={(v) => setF({ ...f, portionG: v })} suffix="g" />
        </label>
      </div>
      {f.kcal !== undefined && computedKcal > 0 && Math.abs(computedKcal - f.kcal) > Math.max(25, f.kcal * 0.15) && (
        <div className="notice warning small">
          Les macros donnent environ {Math.round(computedKcal)} kcal (4 kcal/g protéines et glucides, 9 kcal/g lipides) : vérifie les valeurs saisies.
        </div>
      )}
      <button
        className="btn block"
        disabled={!valid}
        onClick={() => {
          const food: Food = {
            id: `custom-${uid()}`,
            name: f.name.trim(),
            kcal: f.kcal!,
            protein: f.protein ?? 0,
            carbs: f.carbs ?? 0,
            fat: f.fat ?? 0,
            fiber: f.fiber,
            portionG: f.portionG,
            source: 'custom',
          };
          update((s) => ({ ...s, foods: [...s.foods, food] }));
          toast('Aliment créé');
          onCreated(food);
        }}
      >
        Créer et ajouter
      </button>
    </>
  );
}

function QuantitySheet({ food, onClose, onConfirm }: { food: Food; onClose: () => void; onConfirm: (grams: number) => void }) {
  const [grams, setGrams] = useState<number | undefined>(food.portionG ?? 100);
  const m = macrosFor(food, grams ?? 0);
  const presets = Array.from(new Set([food.portionG, food.portionG ? food.portionG * 2 : undefined, 50, 100, 150, 200].filter((x): x is number => !!x))).slice(0, 6);
  return (
    <Sheet title={food.name} onClose={onClose}>
      {food.brand && <div className="small muted">{food.brand}</div>}
      <label className="field">
        Quantité
        <NumberInput value={grams} onChange={setGrams} suffix="g" min={0} />
      </label>
      <div className="chips">
        {presets.map((g) => (
          <button key={g} className={`chip ${grams === g ? 'active' : ''}`} onClick={() => setGrams(g)}>
            {g === food.portionG && food.portionLabel ? `${food.portionLabel} (${g} g)` : g === (food.portionG ?? 0) * 2 && food.portionLabel ? `×2 (${g} g)` : `${g} g`}
          </button>
        ))}
      </div>
      <div className="grid-2">
        <div className="stat">
          <span className="value">{Math.round(m.kcal)}</span>
          <span className="label">kcal</span>
        </div>
        <div className="stat">
          <span className="value" style={{ color: 'var(--protein)' }}>
            {m.protein.toFixed(1)} g
          </span>
          <span className="label">protéines</span>
        </div>
        <div className="stat">
          <span className="value" style={{ color: 'var(--carbs)' }}>
            {m.carbs.toFixed(1)} g
          </span>
          <span className="label">glucides</span>
        </div>
        <div className="stat">
          <span className="value" style={{ color: 'var(--fat)' }}>
            {m.fat.toFixed(1)} g
          </span>
          <span className="label">lipides</span>
        </div>
      </div>
      <button
        className="btn block"
        disabled={!grams}
        onClick={() => onConfirm(grams!)}
      >
        Ajouter
      </button>
    </Sheet>
  );
}

function EntryEditor({ entry, onClose }: { entry: FoodEntry; onClose: () => void }) {
  const { update } = useStore();
  const [grams, setGrams] = useState<number | undefined>(entry.grams);
  const [slot, setSlot] = useState<MealSlot>(entry.slot);
  const m = macrosFor(entry.food, grams ?? 0);
  return (
    <Sheet title={entry.food.name} onClose={onClose}>
      <label className="field">
        Quantité
        <NumberInput value={grams} onChange={setGrams} suffix="g" min={0} />
      </label>
      <div className="small muted kbd-num">
        {Math.round(m.kcal)} kcal · P {m.protein.toFixed(1)} g · G {m.carbs.toFixed(1)} g · L {m.fat.toFixed(1)} g
      </div>
      <div className="field">
        <span className="bold small">Repas</span>
        <div className="chips">
          {MEAL_SLOTS.map((s) => (
            <button key={s} className={`chip ${slot === s ? 'active' : ''}`} onClick={() => setSlot(s)}>
              {MEAL_SLOT_LABELS[s]}
            </button>
          ))}
        </div>
      </div>
      <div className="row">
        <button
          className="btn danger"
          onClick={() => {
            update((s) => ({ ...s, entries: s.entries.filter((e) => e.id !== entry.id) }));
            onClose();
          }}
        >
          <Icon name="trash" size={18} /> Supprimer
        </button>
        <button
          className="btn grow"
          disabled={!grams}
          onClick={() => {
            update((s) => ({ ...s, entries: s.entries.map((e) => (e.id === entry.id ? { ...e, grams: grams!, slot } : e)) }));
            onClose();
          }}
        >
          Enregistrer
        </button>
      </div>
    </Sheet>
  );
}
