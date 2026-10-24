import { useRef, useState, type RefObject } from 'react';
import { useStore, useTargets } from '../store';
import { MEAL_SLOT_LABELS, MEAL_SLOTS } from '../data/foods';
import { sumEntries } from '../lib/nutrition';
import { uid } from '../lib/id';
import {
  AI_MODELS,
  analyzeMealPhoto,
  AnalysisError,
  CRITERIA,
  CRITERION_BY_ID,
  itemToFood,
  loadAiSettings,
  normalizeAnalysis,
  preparePhoto,
  saveAiSettings,
  scoreLabel,
  type AiModel,
} from '../lib/mealAnalysis';
import { Icon, Ring, Sheet, toast } from '../components/ui';
import type { MealAnalysis, MealSlot } from '../types';

/** Nombre d'analyses gardées dans l'historique (les miniatures occupent de la place). */
const MAX_HISTORY = 60;

function defaultSlot(): MealSlot {
  const h = new Date().getHours();
  if (h < 11) return 'breakfast';
  if (h < 15) return 'lunch';
  if (h < 18) return 'snack';
  return 'dinner';
}

export function MealPhotoCard({ date }: { date: string }) {
  const { state, update } = useStore();
  const targets = useTargets();
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const [setupOpen, setSetupOpen] = useState(false);
  const [pending, setPending] = useState<{ preview: string; error?: string } | null>(null);
  const [shown, setShown] = useState<MealAnalysis | null>(null);
  const abort = useRef<AbortController | null>(null);
  const analyses = state.mealAnalyses.filter((a) => a.date === date);

  const pick = (ref: RefObject<HTMLInputElement>) => {
    if (!loadAiSettings()) return setSetupOpen(true);
    ref.current?.click();
  };

  const onFile = async (file: File | undefined) => {
    const settings = loadAiSettings();
    if (!file || !settings || !state.profile || !targets) return;
    let photo: Awaited<ReturnType<typeof preparePhoto>>;
    try {
      photo = await preparePhoto(file);
    } catch {
      setPending({ preview: '', error: 'Impossible de lire cette image. Essaie avec une autre photo (JPEG ou PNG).' });
      return;
    }
    setPending({ preview: photo.dataUrl });
    const ctrl = new AbortController();
    abort.current = ctrl;
    try {
      const consumed = sumEntries(state.entries.filter((e) => e.date === date));
      const raw = await analyzeMealPhoto(settings, photo.base64, { goal: state.profile.goal, diet: state.profile.diet, targets, consumed }, ctrl.signal);
      const analysis = normalizeAnalysis(raw, { model: settings.model, date, thumbnail: photo.thumbnail });
      update((s) => ({ ...s, mealAnalyses: [...s.mealAnalyses, analysis].slice(-MAX_HISTORY) }));
      setPending(null);
      setShown(analysis);
    } catch (e) {
      if (ctrl.signal.aborted) return;
      setPending({ preview: photo.dataUrl, error: e instanceof AnalysisError ? e.message : 'L\'analyse a échoué. Réessaie.' });
    }
  };

  return (
    <div className="card">
      <div className="card-title">
        <h3>📷 Analyse de repas en photo</h3>
      </div>
      <p className="small muted">Prends ton assiette en photo : l'IA estime ce qu'elle contient et donne une note d'équilibre sur 10, critère par critère.</p>
      <div className="row wrap">
        <button className="btn secondary small" onClick={() => pick(cameraRef)}>
          📸 Prendre une photo
        </button>
        <button className="btn ghost small" onClick={() => pick(galleryRef)}>
          🖼️ Depuis la galerie
        </button>
      </div>
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        onChange={(e) => {
          onFile(e.target.files?.[0]);
          e.target.value = '';
        }}
      />
      <input
        ref={galleryRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          onFile(e.target.files?.[0]);
          e.target.value = '';
        }}
      />

      {analyses.length > 0 && (
        <div className="list">
          {analyses.map((a) => (
            <button key={a.id} className="list-item" onClick={() => setShown(a)}>
              {a.thumbnail ? (
                <img src={a.thumbnail} alt="" style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 10, flexShrink: 0 }} />
              ) : (
                <span style={{ width: 48, textAlign: 'center' }}>🍽️</span>
              )}
              <div className="grow">
                <div className="ellipsis bold">{a.mealName}</div>
                <div className="small muted">{a.isFood ? `${scoreLabel(a.score).label} · ~${Math.round(a.items.reduce((s, i) => s + i.kcal, 0))} kcal` : 'Pas de repas détecté'}</div>
              </div>
              {a.isFood && <span className={`badge ${scoreLabel(a.score).tone}`}>{fmtScore(a.score)}/10</span>}
            </button>
          ))}
        </div>
      )}

      {pending && (
        <Sheet
          title={pending.error ? 'Analyse impossible' : 'Analyse en cours…'}
          onClose={() => {
            abort.current?.abort();
            setPending(null);
          }}
        >
          {pending.preview && <img src={pending.preview} alt="Photo du repas" style={{ width: '100%', maxHeight: 280, objectFit: 'cover', borderRadius: 14 }} />}
          {pending.error ? (
            <>
              <div className="notice danger">{pending.error}</div>
              {pending.error.includes('Clé API') && (
                <button
                  className="btn secondary"
                  onClick={() => {
                    setPending(null);
                    setSetupOpen(true);
                  }}
                >
                  Modifier la clé API
                </button>
              )}
            </>
          ) : (
            <div className="empty">L'IA examine ton assiette… (10 à 40 secondes)</div>
          )}
        </Sheet>
      )}
      {shown && <AnalysisSheet analysis={shown} onClose={() => setShown(null)} />}
      {setupOpen && <AiSetupSheet onClose={() => setSetupOpen(false)} />}
    </div>
  );
}

/** Affiche une note au quart de point : 7 · 7,5 · 7,75 */
function fmtScore(n: number) {
  const digits = Number.isInteger(n) ? 0 : Number.isInteger(n * 2) ? 1 : 2;
  return n.toFixed(digits).replace('.', ',');
}

function AnalysisSheet({ analysis: a, onClose }: { analysis: MealAnalysis; onClose: () => void }) {
  const { update } = useStore();
  const [slot, setSlot] = useState<MealSlot>(defaultSlot());
  const [selected, setSelected] = useState<boolean[]>(a.items.map(() => true));
  const label = scoreLabel(a.score);
  const totals = a.items.reduce(
    (t, i, idx) => (selected[idx] ? { kcal: t.kcal + i.kcal, protein: t.protein + i.protein, carbs: t.carbs + i.carbs, fat: t.fat + i.fat } : t),
    { kcal: 0, protein: 0, carbs: 0, fat: 0 },
  );
  const color = { success: 'var(--success)', warning: 'var(--carbs)', danger: 'var(--danger)' }[label.tone];

  const addToJournal = () => {
    const items = a.items.filter((_, i) => selected[i]);
    update((s) => ({
      ...s,
      entries: [
        ...s.entries,
        ...items.map((item) => {
          const food = itemToFood(item);
          return { id: uid(), date: a.date, slot, foodId: food.id, food, grams: item.grams };
        }),
      ],
    }));
    toast(`${items.length} aliment(s) ajouté(s) au ${MEAL_SLOT_LABELS[slot].toLowerCase()}`);
    onClose();
  };

  return (
    <Sheet title={a.mealName} onClose={onClose} full>
      {a.thumbnail && <img src={a.thumbnail} alt="" style={{ width: '100%', maxHeight: 200, objectFit: 'cover', borderRadius: 14 }} />}

      {!a.isFood ? (
        <div className="notice warning">{a.caveats || 'Je ne vois pas de repas sur cette photo.'}</div>
      ) : (
        <>
          <div className="card" style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
            <Ring value={a.score} max={10} size={104} stroke={11} color={color}>
              <div className="bold kbd-num" style={{ fontSize: '1.6rem' }}>
                {fmtScore(a.score)}
              </div>
              <div className="tiny muted">sur 10</div>
            </Ring>
            <div className="col grow" style={{ gap: 4 }}>
              <span className={`badge ${label.tone}`} style={{ alignSelf: 'flex-start' }}>
                {label.label}
              </span>
              <span className="small muted">Fiabilité de l'estimation : {a.confidence}</span>
              <span className="tiny muted">Une note concerne un repas : c'est l'équilibre sur la semaine qui compte.</span>
            </div>
          </div>

          <div className="card">
            <h3>Détail de la note</h3>
            {a.criteria.map((c) => (
              <div key={c.id} className="col" style={{ gap: 4 }}>
                <div className="row between small">
                  <span className="bold">{CRITERION_BY_ID[c.id].label}</span>
                  <span className="kbd-num muted">
                    {fmtScore(c.score)} / {fmtScore(c.max)}
                  </span>
                </div>
                <div className="bar">
                  <div style={{ width: `${(c.score / c.max) * 100}%`, background: c.score / c.max >= 0.75 ? 'var(--success)' : c.score / c.max >= 0.4 ? 'var(--carbs)' : 'var(--danger)' }} />
                </div>
                <span className="small muted">{c.comment}</span>
              </div>
            ))}
          </div>

          {(a.strengths.length > 0 || a.improvements.length > 0) && (
            <div className="card">
              {a.strengths.length > 0 && (
                <>
                  <h3>👍 Points forts</h3>
                  <ul className="clean small">
                    {a.strengths.map((s) => (
                      <li key={s}>{s}</li>
                    ))}
                  </ul>
                </>
              )}
              {a.improvements.length > 0 && (
                <>
                  <h3>💡 Pistes d'amélioration</h3>
                  <ul className="clean small">
                    {a.improvements.map((s) => (
                      <li key={s}>{s}</li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          )}

          {a.goalComment && (
            <div className="notice small">
              🎯 <b>Par rapport à ton objectif :</b> {a.goalComment}
            </div>
          )}

          <div className="card">
            <h3>Ce que l'IA voit dans l'assiette</h3>
            <div className="list">
              {a.items.map((i, idx) => (
                <label key={idx} className="list-item" style={{ cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={selected[idx]}
                    onChange={(e) => setSelected((sel) => sel.map((v, j) => (j === idx ? e.target.checked : v)))}
                    style={{ width: 20, height: 20 }}
                  />
                  <div className="grow">
                    <div className="small">{i.name}</div>
                    <div className="tiny muted kbd-num">
                      ~{i.grams} g · P {Math.round(i.protein)} · G {Math.round(i.carbs)} · L {Math.round(i.fat)}
                    </div>
                  </div>
                  <span className="small bold kbd-num">{i.kcal}</span>
                </label>
              ))}
            </div>
            <div className="row between small bold kbd-num">
              <span>Total estimé</span>
              <span>
                ~{Math.round(totals.kcal)} kcal · P {Math.round(totals.protein)} · G {Math.round(totals.carbs)} · L {Math.round(totals.fat)}
              </span>
            </div>
            {a.caveats && <div className="tiny muted">⚠️ {a.caveats}</div>}
            <div className="tiny muted">Quantités et calories estimées à partir de la photo : l'huile, les sauces et le sucre ajouté sont souvent invisibles. Corrige les grammes dans le journal si tu les connais.</div>
          </div>

          {a.items.length > 0 && (
            <div className="card">
              <h3>Ajouter au journal</h3>
              <div className="chips">
                {MEAL_SLOTS.map((s) => (
                  <button key={s} className={`chip ${slot === s ? 'active' : ''}`} onClick={() => setSlot(s)}>
                    {MEAL_SLOT_LABELS[s]}
                  </button>
                ))}
              </div>
              <button className="btn block" disabled={!selected.some(Boolean)} onClick={addToJournal}>
                <Icon name="plus" size={18} /> Ajouter {selected.filter(Boolean).length} aliment(s)
              </button>
            </div>
          )}
        </>
      )}

      <button
        className="btn danger small"
        style={{ alignSelf: 'flex-start' }}
        onClick={() => {
          update((s) => ({ ...s, mealAnalyses: s.mealAnalyses.filter((x) => x.id !== a.id) }));
          onClose();
        }}
      >
        <Icon name="trash" size={16} /> Supprimer cette analyse
      </button>
      <details className="disclosure small">
        <summary>Comment la note est calculée</summary>
        <div className="col">
          {CRITERIA.map((c) => (
            <p key={c.id}>
              <b>
                {c.label} (sur {fmtScore(c.max)})
              </b>{' '}
              — {c.rule}
            </p>
          ))}
          <p className="muted">
            Grille inspirée des repères de Santé publique France (PNNS), de la classification NOVA du degré de transformation des aliments et du principe de l'assiette équilibrée. La pondération est un choix de l'application, pas un score officiel. Analyse : {AI_MODELS.find((m) => m.value === a.model)?.label ?? a.model}, le {new Date(a.createdAt).toLocaleDateString('fr-FR')}.
          </p>
        </div>
      </details>
    </Sheet>
  );
}

export function AiSetupSheet({ onClose }: { onClose: () => void }) {
  return (
    <Sheet title="Activer l'analyse photo" onClose={onClose}>
      <AiSettingsForm onSaved={onClose} />
    </Sheet>
  );
}

export function AiSettingsForm({ onSaved }: { onSaved?: () => void }) {
  const current = loadAiSettings();
  const [key, setKey] = useState(current?.apiKey ?? '');
  const [model, setModel] = useState<AiModel>(current?.model ?? 'claude-opus-5-5');
  const [show, setShow] = useState(false);
  const valid = key.trim().startsWith('sk-ant-') && key.trim().length > 20;

  return (
    <div className="col" style={{ gap: 12 }}>
      <p className="small">
        L'analyse utilise Claude, l'IA d'Anthropic. Elle nécessite une <b>clé API personnelle</b> (payante, à l'usage) :
      </p>
      <ol className="clean small" style={{ paddingLeft: 20 }}>
        <li>
          Crée un compte sur <b>console.anthropic.com</b> et ajoute quelques euros de crédit (Billing).
        </li>
        <li>Fixe une limite de dépense mensuelle (Limits) pour rester tranquille.</li>
        <li>Crée une clé (API keys → Create key) et colle-la ci-dessous.</li>
      </ol>
      <label className="field">
        Clé API
        <div className="row">
          <input
            id="ai-key"
            className="input grow"
            type={show ? 'text' : 'password'}
            autoComplete="off"
            spellCheck={false}
            placeholder="sk-ant-…"
            value={key}
            onChange={(e) => setKey(e.target.value)}
          />
          <button className="btn ghost small" type="button" onClick={() => setShow(!show)}>
            {show ? 'Masquer' : 'Afficher'}
          </button>
        </div>
      </label>
      <div className="field">
        <span className="bold small">Modèle</span>
        <div className="options">
          {AI_MODELS.map((m) => (
            <button key={m.value} type="button" className={`option ${model === m.value ? 'active' : ''}`} onClick={() => setModel(m.value)}>
              <span className="grow">
                <div className="option-label">{m.label}</div>
                <div className="option-hint">{m.hint}</div>
              </span>
            </button>
          ))}
        </div>
      </div>
      <div className="notice small">
        🔒 La clé reste sur ce téléphone (elle n'est pas incluse dans les sauvegardes exportées). À chaque analyse, la photo, ton objectif et tes apports du jour sont envoyés à Anthropic pour être analysés. Coûts indiqués : estimations selon les tarifs publics d'Anthropic d'octobre 2026, à vérifier sur leur site.
      </div>
      <div className="row">
        {current && (
          <button
            className="btn danger"
            onClick={() => {
              saveAiSettings(null);
              setKey('');
              toast('Clé supprimée');
            }}
          >
            Supprimer la clé
          </button>
        )}
        <button
          className="btn grow"
          disabled={!valid}
          onClick={() => {
            if (saveAiSettings({ apiKey: key.trim(), model })) {
              toast('Analyse photo activée');
              onSaved?.();
            } else {
              toast('Impossible d\'enregistrer sur cet appareil');
            }
          }}
        >
          Enregistrer
        </button>
      </div>
      {key && !valid && <div className="tiny muted">Une clé Anthropic commence par « sk-ant- ».</div>}
    </div>
  );
}
