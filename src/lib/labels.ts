import type { CardioPreference, DietPreference, Equipment, Experience, Focus, Goal, Limitation } from '../types';

export const GOAL_OPTIONS: { value: Goal; label: string; hint: string; emoji: string }[] = [
  { value: 'lose_fat', label: 'Perdre du poids', hint: 'Déficit calorique modéré + renforcement + cardio', emoji: '🔥' },
  { value: 'tone', label: 'Tonifier / raffermir', hint: 'Se renforcer et affiner sa silhouette', emoji: '✨' },
  { value: 'build_muscle', label: 'Prendre du muscle', hint: 'Léger surplus calorique et plus de volume', emoji: '💪' },
  { value: 'strength', label: 'Devenir plus forte', hint: 'Charges plus lourdes, moins de répétitions', emoji: '🏋️' },
  { value: 'fitness', label: 'Être en forme', hint: 'Endurance, énergie et santé au quotidien', emoji: '🌿' },
];

export const EXPERIENCE_OPTIONS: { value: Experience; label: string; hint: string; emoji: string }[] = [
  { value: 'beginner', label: 'Débutante', hint: 'Peu ou pas de sport depuis longtemps', emoji: '🌱' },
  { value: 'intermediate', label: 'Intermédiaire', hint: 'Entraînement régulier depuis quelques mois', emoji: '🌿' },
  { value: 'advanced', label: 'Confirmée', hint: 'Plus d\'un an de musculation régulière', emoji: '🌳' },
];

export const EQUIPMENT_OPTIONS: { value: Equipment; label: string; emoji: string }[] = [
  { value: 'gym', label: 'Salle de sport', emoji: '🏢' },
  { value: 'dumbbells', label: 'Haltères', emoji: '🏋️' },
  { value: 'bands', label: 'Élastiques', emoji: '🎗️' },
  { value: 'kettlebell', label: 'Kettlebell', emoji: '🔔' },
  { value: 'bench', label: 'Banc de musculation', emoji: '🪑' },
  { value: 'pullup_bar', label: 'Barre de traction', emoji: '➖' },
];

export const LIMITATION_OPTIONS: { value: Limitation; label: string }[] = [
  { value: 'knees', label: 'Genoux' },
  { value: 'lower_back', label: 'Bas du dos' },
  { value: 'shoulders', label: 'Épaules' },
  { value: 'wrists', label: 'Poignets' },
  { value: 'no_jumping', label: 'Pas de sauts (voisins, impact…)' },
];

export const FOCUS_OPTIONS: { value: Focus; label: string; hint: string; emoji: string }[] = [
  { value: 'balanced', label: 'Équilibré', hint: 'Tout le corps de façon harmonieuse', emoji: '⚖️' },
  { value: 'glutes_legs', label: 'Fessiers & jambes', hint: 'Plus d\'exercices pour le bas du corps', emoji: '🍑' },
  { value: 'upper_body', label: 'Haut du corps', hint: 'Dos, épaules, bras', emoji: '💪' },
  { value: 'core', label: 'Ventre & gainage', hint: 'Plus de gainage et d\'abdos', emoji: '🎯' },
];

export const CARDIO_OPTIONS: { value: CardioPreference; label: string }[] = [
  { value: 'walking', label: 'Marche' },
  { value: 'running', label: 'Course' },
  { value: 'cycling', label: 'Vélo' },
  { value: 'swimming', label: 'Natation' },
  { value: 'hiit', label: 'HIIT' },
  { value: 'none', label: 'Pas de préférence' },
];

export const DIET_OPTIONS: { value: DietPreference; label: string }[] = [
  { value: 'omnivore', label: 'Je mange de tout' },
  { value: 'pescatarian', label: 'Pescétarienne' },
  { value: 'vegetarian', label: 'Végétarienne' },
  { value: 'vegan', label: 'Végane' },
];

export const LIMITATION_LABEL = Object.fromEntries(LIMITATION_OPTIONS.map((o) => [o.value, o.label])) as Record<Limitation, string>;
export const EQUIPMENT_LABEL = Object.fromEntries(EQUIPMENT_OPTIONS.map((o) => [o.value, o.label])) as Record<Equipment, string>;
