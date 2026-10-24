import { useRef, useState } from 'react';
import { currentWeight, EMPTY_STATE, normalizeState, useStore, useTargets } from '../store';
import { ACTIVITY_LABELS, bmi, bmiCategory, computeTargets, energyBreakdown, PROTEIN_PER_KG } from '../lib/nutrition';
import { generateProgram, GOAL_LABELS } from '../lib/generator';
import { EQUIPMENT_LABEL, EXPERIENCE_OPTIONS, FOCUS_OPTIONS, LIMITATION_LABEL } from '../lib/labels';
import { WEEKDAY_SHORT, toISODate } from '../lib/dates';
import { Icon, NumberInput, Sheet, toast } from '../components/ui';
import { Onboarding } from './Onboarding';
import type { NutritionTargets, Profile as ProfileT } from '../types';

const TRAINING_KEYS: (keyof ProfileT)[] = ['goal', 'experience', 'trainingDays', 'sessionMinutes', 'equipment', 'limitations', 'focus', 'cardio'];

export function Profile() {
  const { state, update, replace } = useStore();
  const targets = useTargets()!;
  const [editing, setEditing] = useState(false);
  const [targetsOpen, setTargetsOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const p = state.profile!;
  const weight = currentWeight(state) ?? p.weightKg;
  const e = energyBreakdown(p, weight);

  if (editing) {
    return (
      <Onboarding
        initial={{ ...p, weightKg: weight }}
        onCancel={() => setEditing(false)}
        onDone={(np) => {
          const trainingChanged = TRAINING_KEYS.some((k) => JSON.stringify(np[k]) !== JSON.stringify(p[k]));
          const regen = trainingChanged && window.confirm('Tes paramètres d\'entraînement ont changé. Générer un nouveau programme adapté ? (ton historique est conservé)');
          update((s) => ({
            ...s,
            profile: np,
            program: regen ? generateProgram(np) : s.program,
            weights: np.weightKg !== weight ? [...s.weights.filter((w) => w.date !== toISODate()), { date: toISODate(), kg: np.weightKg }] : s.weights,
          }));
          setEditing(false);
          toast('Profil mis à jour');
        }}
      />
    );
  }

  const exportData = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fitness-sauvegarde-${toISODate()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importData = async (file: File) => {
    try {
      const data = JSON.parse(await file.text());
      if (!data || typeof data !== 'object' || !('profile' in data)) throw new Error('format');
      if (!window.confirm('Remplacer toutes les données actuelles par celles de la sauvegarde ?')) return;
      replace(normalizeState(data));
      toast('Données restaurées');
    } catch {
      window.alert('Ce fichier n\'est pas une sauvegarde valide de l\'application.');
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>Profil</h1>
      </div>

      <div className="card">
        <div className="card-title">
          <h2>{p.name}</h2>
          <button className="btn secondary small" onClick={() => setEditing(true)}>
            <Icon name="edit" size={16} /> Modifier
          </button>
        </div>
        <div className="grid-2 small">
          <div>
            <div className="muted">Âge</div>
            <div className="bold">{new Date().getFullYear() - p.birthYear} ans</div>
          </div>
          <div>
            <div className="muted">Taille · Poids</div>
            <div className="bold">
              {p.heightCm} cm · {weight.toFixed(1)} kg
            </div>
          </div>
          <div>
            <div className="muted">IMC</div>
            <div className="bold">
              {bmi(weight, p.heightCm).toFixed(1)} <span className="muted">({bmiCategory(bmi(weight, p.heightCm)).toLowerCase()})</span>
            </div>
          </div>
          <div>
            <div className="muted">Objectif</div>
            <div className="bold">{GOAL_LABELS[p.goal]}</div>
          </div>
          <div>
            <div className="muted">Niveau</div>
            <div className="bold">{EXPERIENCE_OPTIONS.find((o) => o.value === p.experience)?.label}</div>
          </div>
          <div>
            <div className="muted">Activité</div>
            <div className="bold">{ACTIVITY_LABELS[p.activity].label}</div>
          </div>
          <div>
            <div className="muted">Jours</div>
            <div className="bold">{p.trainingDays.map((d) => WEEKDAY_SHORT[d]).join(', ')}</div>
          </div>
          <div>
            <div className="muted">Durée</div>
            <div className="bold">{p.sessionMinutes} min</div>
          </div>
          <div>
            <div className="muted">Matériel</div>
            <div className="bold">{p.equipment.filter((x) => x !== 'bodyweight').map((x) => EQUIPMENT_LABEL[x]).join(', ') || 'Poids du corps'}</div>
          </div>
          <div>
            <div className="muted">Priorité</div>
            <div className="bold">{FOCUS_OPTIONS.find((o) => o.value === p.focus)?.label}</div>
          </div>
          {p.limitations.length > 0 && (
            <div>
              <div className="muted">Zones sensibles</div>
              <div className="bold">{p.limitations.map((l) => LIMITATION_LABEL[l]).join(', ')}</div>
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-title">
          <h3>🎯 Objectifs nutritionnels</h3>
          <button className="btn secondary small" onClick={() => setTargetsOpen(true)}>
            <Icon name="edit" size={16} /> Ajuster
          </button>
        </div>
        <div className="grid-3">
          <div className="stat">
            <span className="value">{targets.kcal}</span>
            <span className="label">kcal</span>
          </div>
          <div className="stat">
            <span className="value" style={{ color: 'var(--protein)' }}>
              {targets.protein} g
            </span>
            <span className="label">protéines</span>
          </div>
          <div className="stat">
            <span className="value" style={{ color: 'var(--carbs)' }}>
              {targets.carbs} g
            </span>
            <span className="label">glucides</span>
          </div>
          <div className="stat">
            <span className="value" style={{ color: 'var(--fat)' }}>
              {targets.fat} g
            </span>
            <span className="label">lipides</span>
          </div>
          <div className="stat">
            <span className="value">{targets.fiber} g</span>
            <span className="label">fibres</span>
          </div>
          <div className="stat">
            <span className="value">{(targets.waterMl / 1000).toFixed(1)} L</span>
            <span className="label">eau</span>
          </div>
        </div>
        {state.targetsOverride ? (
          <div className="notice small">Objectifs personnalisés manuellement.</div>
        ) : (
          <p className="small muted">
            Calcul automatique : métabolisme de base {Math.round(e.bmr)} kcal × {ACTIVITY_LABELS[p.activity].label.toLowerCase()} = {Math.round(e.tdee)} kcal
            {e.adjustment ? ` ${e.adjustment > 0 ? '+' : '−'} ${Math.abs(Math.round(e.adjustment * 100))} %` : ''}. Protéines {PROTEIN_PER_KG[p.goal]} g/kg. Recalculé à chaque nouvelle pesée.
          </p>
        )}
      </div>

      <details className="card disclosure">
        <summary>📚 Méthode & sources</summary>
        <div className="col small">
          <p>
            <b>Calories</b> — métabolisme de base estimé par l'équation de Mifflin-St Jeor (Mifflin et al., <i>Am J Clin Nutr</i>, 1990), multiplié par un facteur d'activité standard (1,2 à 1,9). Ajustement selon l'objectif : −20 % (perte de poids), −10 % (tonifier), +5 à +10 % (force, muscle). Plancher de sécurité : 1200 kcal (femme) / 1500 kcal (homme). Ce sont des estimations : la dépense réelle varie d'une personne à l'autre.
          </p>
          <p>
            <b>Protéines</b> — 1,4 à 1,8 g/kg/jour selon l'objectif, dans la fourchette de 1,4-2,0 g/kg recommandée pour les personnes qui s'entraînent (position de l'International Society of Sports Nutrition, Jäger et al., 2017).
          </p>
          <p>
            <b>Lipides</b> — 30 % des calories, dans l'intervalle de référence de l'EFSA (20-35 %). <b>Glucides</b> — le reste. <b>Fibres</b> — 30 g/jour (repère ANSES pour l'adulte).
          </p>
          <p>
            <b>Eau</b> — apports adéquats en eau totale de l'EFSA (2010) : 2,0 L/jour pour une femme, 2,5 L pour un homme (boissons + eau des aliments). À augmenter en cas de chaleur ou d'effort prolongé.
          </p>
          <p>
            <b>Entraînement</b> — fréquence, séries et répétitions inspirées de la position de l'American College of Sports Medicine sur la progression en musculation (ACSM, 2009) ; activité d'endurance selon les lignes directrices de l'OMS (2020) : 150-300 min/semaine d'intensité modérée + renforcement musculaire au moins 2 jours/semaine.
          </p>
          <p>
            <b>1RM estimé</b> — formule d'Epley, indicative uniquement. <b>Aliments</b> — valeurs moyennes arrondies (tables Ciqual/ANSES et USDA) ; produits du commerce via Open Food Facts (données collaboratives).
          </p>
          <p className="muted">Cette application donne des repères généraux et ne remplace pas l'avis d'un médecin, d'un·e diététicien·ne ou d'un·e coach diplômé·e.</p>
        </div>
      </details>

      <details className="card disclosure">
        <summary>📱 Installer l'application sur le téléphone</summary>
        <div className="col small">
          <p>
            <b>iPhone (Safari)</b> : bouton Partager → « Sur l'écran d'accueil ».
          </p>
          <p>
            <b>Android (Chrome)</b> : menu ⋮ → « Installer l'application » ou « Ajouter à l'écran d'accueil ».
          </p>
          <p className="muted">Une fois installée, l'application fonctionne aussi hors connexion (sauf la recherche de produits Open Food Facts).</p>
        </div>
      </details>

      <div className="card">
        <h3>💾 Mes données</h3>
        <p className="small muted">
          Toutes les données restent sur cet appareil, dans le navigateur. Fais une sauvegarde de temps en temps (et avant de changer de téléphone) : vider les données du navigateur les efface.
        </p>
        <div className="row wrap">
          <button className="btn secondary small" onClick={exportData}>
            <Icon name="download" size={16} /> Exporter
          </button>
          <button className="btn secondary small" onClick={() => fileRef.current?.click()}>
            <Icon name="upload" size={16} /> Importer
          </button>
          <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={(ev) => ev.target.files?.[0] && importData(ev.target.files[0])} />
        </div>
        <div className="divider" />
        <button
          className="btn danger small"
          style={{ alignSelf: 'flex-start' }}
          onClick={() => {
            if (window.confirm('Effacer TOUTES les données (profil, programme, historique, repas) ? Cette action est irréversible.')) {
              replace(EMPTY_STATE);
            }
          }}
        >
          <Icon name="trash" size={16} /> Tout effacer
        </button>
      </div>

      {targetsOpen && <TargetsSheet onClose={() => setTargetsOpen(false)} />}
    </div>
  );
}

function TargetsSheet({ onClose }: { onClose: () => void }) {
  const { state, update } = useStore();
  const auto = computeTargets(state.profile!, currentWeight(state));
  const [t, setT] = useState<NutritionTargets>({ ...auto, ...(state.targetsOverride ?? {}) });
  const fields: { key: keyof NutritionTargets; label: string; unit: string }[] = [
    { key: 'kcal', label: 'Calories', unit: 'kcal' },
    { key: 'protein', label: 'Protéines', unit: 'g' },
    { key: 'carbs', label: 'Glucides', unit: 'g' },
    { key: 'fat', label: 'Lipides', unit: 'g' },
    { key: 'fiber', label: 'Fibres', unit: 'g' },
    { key: 'waterMl', label: 'Eau', unit: 'ml' },
  ];
  const macroKcal = t.protein * 4 + t.carbs * 4 + t.fat * 9;
  return (
    <Sheet title="Ajuster mes objectifs" onClose={onClose}>
      <p className="small muted">
        Utile si tu suis les conseils d'un·e diététicien·ne, ou si ton poids n'évolue pas comme prévu après 2-3 semaines (ajuste alors les calories de 100 à 200 kcal).
      </p>
      <div className="grid-2">
        {fields.map((f) => (
          <label key={f.key} className="field">
            {f.label} <span className="hint">auto : {auto[f.key]}</span>
            <NumberInput value={t[f.key]} onChange={(v) => v !== undefined && setT({ ...t, [f.key]: v })} suffix={f.unit} />
          </label>
        ))}
      </div>
      {Math.abs(macroKcal - t.kcal) > 60 && (
        <div className="notice warning small">
          Les macros représentent {Math.round(macroKcal)} kcal, contre {t.kcal} kcal visées.
          <button className="btn ghost small" onClick={() => setT({ ...t, carbs: Math.max(0, Math.round((t.kcal - t.protein * 4 - t.fat * 9) / 4)) })}>
            Recalculer les glucides
          </button>
        </div>
      )}
      <div className="row">
        <button
          className="btn outline"
          onClick={() => {
            update((s) => ({ ...s, targetsOverride: null }));
            toast('Objectifs automatiques rétablis');
            onClose();
          }}
        >
          Automatique
        </button>
        <button
          className="btn grow"
          onClick={() => {
            update((s) => ({ ...s, targetsOverride: t }));
            toast('Objectifs enregistrés');
            onClose();
          }}
        >
          Enregistrer
        </button>
      </div>
    </Sheet>
  );
}
