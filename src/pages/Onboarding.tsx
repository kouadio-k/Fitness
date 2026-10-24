import { useState } from 'react';
import type { ActivityLevel, Equipment, Limitation, Profile, Sex, Weekday } from '../types';
import { Chips, NumberInput, Options } from '../components/ui';
import { ACTIVITY_LABELS, bmi, bmiCategory, computeTargets, energyBreakdown, targetsFloorApplied } from '../lib/nutrition';
import {
  CARDIO_OPTIONS,
  DIET_OPTIONS,
  EQUIPMENT_OPTIONS,
  EXPERIENCE_OPTIONS,
  FOCUS_OPTIONS,
  GOAL_OPTIONS,
  LIMITATION_OPTIONS,
} from '../lib/labels';
import { WEEKDAY_SHORT } from '../lib/dates';

const DEFAULT: Profile = {
  name: '',
  sex: 'female',
  birthYear: new Date().getFullYear() - 28,
  heightCm: 165,
  weightKg: 62,
  activity: 'light',
  goal: 'tone',
  experience: 'beginner',
  trainingDays: [0, 2, 4],
  sessionMinutes: 45,
  equipment: ['bodyweight'],
  limitations: [],
  focus: 'balanced',
  cardio: 'walking',
  diet: 'omnivore',
  createdAt: new Date().toISOString(),
};

function toggle<T>(list: T[], v: T): T[] {
  return list.includes(v) ? list.filter((x) => x !== v) : [...list, v];
}

export function Onboarding({ initial, onDone, onCancel }: { initial?: Profile; onDone: (p: Profile) => void; onCancel?: () => void }) {
  const [p, setP] = useState<Profile>(initial ?? DEFAULT);
  const [step, setStep] = useState(initial ? 1 : 0);
  const [accepted, setAccepted] = useState(!!initial);
  const set = <K extends keyof Profile>(k: K, v: Profile[K]) => setP((x) => ({ ...x, [k]: v }));

  const year = new Date().getFullYear();
  const age = year - p.birthYear;
  const bodyValid = age >= 16 && age <= 90 && p.heightCm >= 130 && p.heightCm <= 220 && p.weightKg >= 35 && p.weightKg <= 250;

  const steps = [
    {
      valid: p.name.trim().length > 0,
      content: (
        <>
          <div className="hero-emoji">👋</div>
          <h1>Bienvenue !</h1>
          <p className="muted">
            Quelques questions pour te créer un programme d'entraînement et des objectifs nutritionnels sur mesure. Ça prend 2 minutes, et tu pourras tout modifier ensuite.
          </p>
          <label className="field">
            Ton prénom
            <input className="input" value={p.name} onChange={(e) => set('name', e.target.value)} placeholder="Prénom" autoFocus />
          </label>
        </>
      ),
    },
    {
      valid: bodyValid,
      content: (
        <>
          <h1>Ton profil</h1>
          <p className="muted small">Ces données servent uniquement à estimer tes besoins énergétiques. Elles restent sur ton téléphone.</p>
          <div className="field">
            <span className="bold small">Sexe (pour le calcul du métabolisme)</span>
            <Chips<Sex>
              options={[
                { value: 'female', label: 'Femme' },
                { value: 'male', label: 'Homme' },
              ]}
              value={p.sex}
              onChange={(v) => set('sex', v)}
            />
          </div>
          <div className="grid-2">
            <label className="field">
              Année de naissance
              <NumberInput value={p.birthYear} onChange={(v) => v && set('birthYear', v)} min={1930} max={year} />
            </label>
            <label className="field">
              Taille
              <NumberInput value={p.heightCm} onChange={(v) => v && set('heightCm', v)} suffix="cm" />
            </label>
            <label className="field">
              Poids actuel
              <NumberInput value={p.weightKg} onChange={(v) => v && set('weightKg', v)} suffix="kg" step={0.1} />
            </label>
            <label className="field">
              Poids souhaité <span className="hint">(facultatif)</span>
              <NumberInput value={p.targetWeightKg} onChange={(v) => set('targetWeightKg', v)} suffix="kg" step={0.1} />
            </label>
          </div>
          {!bodyValid && <div className="notice warning">Vérifie les valeurs (âge 16-90 ans, taille 130-220 cm, poids 35-250 kg).</div>}
          {bodyValid && (
            <div className="notice">
              IMC : <b>{bmi(p.weightKg, p.heightCm).toFixed(1)}</b> — {bmiCategory(bmi(p.weightKg, p.heightCm))}{' '}
              <span className="muted">(repère OMS, ne tient pas compte de la masse musculaire)</span>
            </div>
          )}
        </>
      ),
    },
    {
      valid: true,
      content: (
        <>
          <h1>Ton objectif</h1>
          <Options options={GOAL_OPTIONS} value={p.goal} onChange={(v) => set('goal', v)} />
          <h2 style={{ marginTop: 8 }}>Ton activité au quotidien</h2>
          <p className="muted small">Hors séances prévues dans l'application, choisis ce qui ressemble le plus à ta semaine type.</p>
          <Options<ActivityLevel>
            options={(Object.keys(ACTIVITY_LABELS) as ActivityLevel[]).map((k) => ({ value: k, label: ACTIVITY_LABELS[k].label, hint: ACTIVITY_LABELS[k].hint }))}
            value={p.activity}
            onChange={(v) => set('activity', v)}
          />
        </>
      ),
    },
    {
      valid: p.trainingDays.length > 0,
      content: (
        <>
          <h1>Ton entraînement</h1>
          <Options options={EXPERIENCE_OPTIONS} value={p.experience} onChange={(v) => set('experience', v)} />
          <div className="field">
            <span className="bold">Quels jours peux-tu t'entraîner ?</span>
            <Chips<Weekday>
              options={WEEKDAY_SHORT.map((l, i) => ({ value: i as Weekday, label: l }))}
              value={p.trainingDays}
              onChange={(d) => set('trainingDays', toggle(p.trainingDays, d).sort((a, b) => a - b))}
            />
            <span className="muted small">
              {p.trainingDays.length} séance(s) / semaine
              {p.experience === 'beginner' && p.trainingDays.length > 4 && ' — pour débuter, 2 à 4 séances suffisent largement et laissent le temps de récupérer.'}
            </span>
          </div>
          <div className="field">
            <span className="bold">Durée d'une séance</span>
            <Chips<number>
              options={[20, 30, 45, 60, 75].map((m) => ({ value: m, label: `${m} min` }))}
              value={p.sessionMinutes}
              onChange={(v) => set('sessionMinutes', v)}
            />
          </div>
        </>
      ),
    },
    {
      valid: true,
      content: (
        <>
          <h1>Ton matériel</h1>
          <p className="muted small">Sélectionne tout ce à quoi tu as accès. Rien sélectionné = séances au poids du corps.</p>
          <Options<Equipment>
            options={EQUIPMENT_OPTIONS}
            value={p.equipment}
            onChange={(v) => set('equipment', toggle(p.equipment.filter((e) => e !== 'bodyweight'), v).concat('bodyweight'))}
          />
          <h2 style={{ marginTop: 8 }}>Zones sensibles</h2>
          <p className="muted small">Les exercices déconseillés seront écartés. Si tu as une douleur ou une blessure, demande l'avis d'un médecin ou d'un kiné.</p>
          <Chips<Limitation> options={LIMITATION_OPTIONS} value={p.limitations} onChange={(v) => set('limitations', toggle(p.limitations, v))} />
        </>
      ),
    },
    {
      valid: true,
      content: (
        <>
          <h1>Tes préférences</h1>
          <h3>Zone à travailler en priorité</h3>
          <Options options={FOCUS_OPTIONS} value={p.focus} onChange={(v) => set('focus', v)} />
          <h3 style={{ marginTop: 8 }}>Cardio préféré</h3>
          <Chips options={CARDIO_OPTIONS} value={p.cardio} onChange={(v) => set('cardio', v)} />
          <h3 style={{ marginTop: 8 }}>Alimentation</h3>
          <Chips options={DIET_OPTIONS} value={p.diet} onChange={(v) => set('diet', v)} />
        </>
      ),
    },
    {
      valid: accepted,
      content: <Recap profile={p} accepted={accepted} setAccepted={setAccepted} />,
    },
  ];

  const current = steps[step];
  const last = step === steps.length - 1;

  return (
    <div className="app">
      <div className="onboarding">
        <div className="row">
          {(step > (initial ? 1 : 0) || onCancel) && (
            <button className="btn ghost small" onClick={() => (step > (initial ? 1 : 0) ? setStep(step - 1) : onCancel?.())}>
              ‹ {step > (initial ? 1 : 0) ? 'Retour' : 'Annuler'}
            </button>
          )}
          <div className="steps grow">
            {steps.map((_, i) => (
              <div key={i} className={i <= step ? 'on' : ''} />
            ))}
          </div>
        </div>
        <div className="col" style={{ gap: 14 }}>
          {current.content}
        </div>
        <div className="onboarding-footer">
          <button
            className="btn block"
            disabled={!current.valid}
            onClick={() => (last ? onDone({ ...p, name: p.name.trim() }) : setStep(step + 1))}
          >
            {last ? (initial ? 'Enregistrer' : 'Créer mon programme 🚀') : 'Continuer'}
          </button>
        </div>
      </div>
    </div>
  );
}

function Recap({ profile, accepted, setAccepted }: { profile: Profile; accepted: boolean; setAccepted: (v: boolean) => void }) {
  const t = computeTargets(profile);
  const e = energyBreakdown(profile);
  const floor = targetsFloorApplied(profile);
  return (
    <>
      <h1>Tes objectifs du jour</h1>
      <div className="card">
        <div className="row between">
          <span className="muted">Calories</span>
          <span className="bold kbd-num">{t.kcal} kcal</span>
        </div>
        <div className="row between">
          <span className="muted">Protéines</span>
          <span className="bold kbd-num">{t.protein} g</span>
        </div>
        <div className="row between">
          <span className="muted">Glucides</span>
          <span className="bold kbd-num">{t.carbs} g</span>
        </div>
        <div className="row between">
          <span className="muted">Lipides</span>
          <span className="bold kbd-num">{t.fat} g</span>
        </div>
        <div className="row between">
          <span className="muted">Eau</span>
          <span className="bold kbd-num">{(t.waterMl / 1000).toFixed(1)} L</span>
        </div>
        <div className="divider" />
        <p className="small muted">
          Métabolisme de base estimé {Math.round(e.bmr)} kcal (équation de Mifflin-St Jeor) × facteur d'activité = dépense estimée {Math.round(e.tdee)} kcal
          {e.adjustment !== 0 && `, ${e.adjustment > 0 ? '+' : ''}${Math.round(e.adjustment * 100)} % selon ton objectif`}.
        </p>
        {floor && <div className="notice warning">L'objectif a été relevé au minimum de sécurité de l'application ({t.kcal} kcal). Pour aller plus bas, fais-toi accompagner par un professionnel de santé.</div>}
        <p className="tiny muted">Ce sont des estimations : ajuste-les après 2 à 3 semaines selon l'évolution réelle de ton poids. Tu pourras les modifier dans ton profil.</p>
      </div>
      <label className="row" style={{ alignItems: 'flex-start', gap: 10 }}>
        <input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} style={{ width: 22, height: 22, marginTop: 2 }} />
        <span className="small">
          J'ai compris que cette application donne des conseils généraux et ne remplace pas un avis médical. En cas de grossesse, de problème de santé, de douleur ou de trouble du comportement alimentaire, je consulte un professionnel de santé avant de commencer.
        </span>
      </label>
    </>
  );
}
