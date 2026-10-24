import type { Food, MealSlot } from '../types';

/**
 * Aliments de base — valeurs moyennes pour 100 g (ou 100 ml), arrondies.
 * Ordres de grandeur issus des tables publiques (Ciqual/ANSES, USDA FoodData Central).
 * Les valeurs réelles varient selon la marque et la cuisson : pour un produit précis,
 * se fier à l'étiquette ou à la recherche Open Food Facts intégrée.
 */
type F = Omit<Food, 'source'>;

const RAW: F[] = [
  // Protéines animales
  { id: 'chicken-breast-cooked', name: 'Blanc de poulet (cuit)', kcal: 165, protein: 31, carbs: 0, fat: 3.6, portionG: 120, portionLabel: '1 filet', category: 'Viandes & poissons' },
  { id: 'turkey-cooked', name: 'Escalope de dinde (cuite)', kcal: 135, protein: 29, carbs: 0, fat: 2, portionG: 120, portionLabel: '1 escalope', category: 'Viandes & poissons' },
  { id: 'beef-5-raw', name: 'Steak haché 5 % MG (cru)', kcal: 125, protein: 21, carbs: 0, fat: 5, portionG: 100, portionLabel: '1 steak', category: 'Viandes & poissons' },
  { id: 'ham', name: 'Jambon blanc découenné', kcal: 110, protein: 20, carbs: 1, fat: 3, portionG: 40, portionLabel: '1 tranche', category: 'Viandes & poissons' },
  { id: 'salmon-raw', name: 'Saumon (cru)', kcal: 190, protein: 20, carbs: 0, fat: 12, portionG: 125, portionLabel: '1 pavé', category: 'Viandes & poissons' },
  { id: 'cod-raw', name: 'Cabillaud (cru)', kcal: 80, protein: 18, carbs: 0, fat: 0.7, portionG: 150, portionLabel: '1 filet', category: 'Viandes & poissons' },
  { id: 'tuna-can', name: 'Thon au naturel (égoutté)', kcal: 110, protein: 25, carbs: 0, fat: 1, portionG: 100, portionLabel: '1 petite boîte', category: 'Viandes & poissons' },
  { id: 'shrimp-cooked', name: 'Crevettes (cuites)', kcal: 95, protein: 21, carbs: 0, fat: 1, portionG: 100, category: 'Viandes & poissons' },
  { id: 'egg', name: 'Œuf entier', kcal: 140, protein: 12.5, carbs: 0.7, fat: 10, portionG: 50, portionLabel: '1 œuf', category: 'Œufs & laitiers', vegetarian: true },
  { id: 'egg-white', name: 'Blanc d\'œuf', kcal: 48, protein: 11, carbs: 0.7, fat: 0.2, portionG: 33, portionLabel: '1 blanc', category: 'Œufs & laitiers', vegetarian: true },

  // Protéines végétales
  { id: 'tofu', name: 'Tofu ferme', kcal: 125, protein: 13, carbs: 1.5, fat: 7, fiber: 1, portionG: 100, category: 'Protéines végétales', vegan: true },
  { id: 'tempeh', name: 'Tempeh', kcal: 190, protein: 19, carbs: 9, fat: 11, fiber: 5, portionG: 100, category: 'Protéines végétales', vegan: true },
  { id: 'lentils-cooked', name: 'Lentilles (cuites)', kcal: 116, protein: 9, carbs: 17, fat: 0.4, fiber: 8, portionG: 150, category: 'Protéines végétales', vegan: true },
  { id: 'chickpeas-cooked', name: 'Pois chiches (cuits)', kcal: 145, protein: 8, carbs: 20, fat: 2.5, fiber: 7, portionG: 150, category: 'Protéines végétales', vegan: true },
  { id: 'kidney-beans-cooked', name: 'Haricots rouges (cuits)', kcal: 115, protein: 8.5, carbs: 15, fat: 0.5, fiber: 7, portionG: 150, category: 'Protéines végétales', vegan: true },

  // Laitiers
  { id: 'skyr', name: 'Skyr nature', kcal: 60, protein: 10, carbs: 4, fat: 0.2, portionG: 150, portionLabel: '1 pot', category: 'Œufs & laitiers', vegetarian: true },
  { id: 'fromage-blanc-0', name: 'Fromage blanc 0 %', kcal: 47, protein: 7.5, carbs: 4, fat: 0.2, portionG: 100, category: 'Œufs & laitiers', vegetarian: true },
  { id: 'fromage-blanc-3', name: 'Fromage blanc 3 %', kcal: 75, protein: 7, carbs: 4, fat: 3, portionG: 100, category: 'Œufs & laitiers', vegetarian: true },
  { id: 'yogurt-plain', name: 'Yaourt nature', kcal: 57, protein: 4.3, carbs: 5, fat: 2, portionG: 125, portionLabel: '1 pot', category: 'Œufs & laitiers', vegetarian: true },
  { id: 'milk-semi', name: 'Lait demi-écrémé', kcal: 46, protein: 3.3, carbs: 4.8, fat: 1.6, portionG: 250, portionLabel: '1 verre (250 ml)', category: 'Œufs & laitiers', vegetarian: true },
  { id: 'soy-drink', name: 'Boisson soja nature', kcal: 38, protein: 3.5, carbs: 1.5, fat: 2, portionG: 250, portionLabel: '1 verre (250 ml)', category: 'Œufs & laitiers', vegan: true },
  { id: 'almond-drink', name: 'Boisson amande sans sucre', kcal: 15, protein: 0.5, carbs: 0.3, fat: 1.2, portionG: 250, portionLabel: '1 verre (250 ml)', category: 'Œufs & laitiers', vegan: true },
  { id: 'emmental', name: 'Emmental', kcal: 375, protein: 28, carbs: 0, fat: 29, portionG: 30, portionLabel: '1 portion', category: 'Œufs & laitiers', vegetarian: true },
  { id: 'mozzarella', name: 'Mozzarella', kcal: 240, protein: 18, carbs: 1, fat: 18, portionG: 60, portionLabel: '½ boule', category: 'Œufs & laitiers', vegetarian: true },
  { id: 'feta', name: 'Feta', kcal: 265, protein: 15, carbs: 1, fat: 22, portionG: 30, category: 'Œufs & laitiers', vegetarian: true },

  // Féculents
  { id: 'rice-white-cooked', name: 'Riz blanc (cuit)', kcal: 130, protein: 2.7, carbs: 28, fat: 0.3, fiber: 0.4, portionG: 150, category: 'Féculents', vegan: true },
  { id: 'rice-brown-cooked', name: 'Riz complet (cuit)', kcal: 120, protein: 2.7, carbs: 24, fat: 1, fiber: 1.8, portionG: 150, category: 'Féculents', vegan: true },
  { id: 'pasta-cooked', name: 'Pâtes (cuites)', kcal: 150, protein: 5.5, carbs: 30, fat: 0.9, fiber: 1.8, portionG: 180, category: 'Féculents', vegan: true },
  { id: 'pasta-whole-cooked', name: 'Pâtes complètes (cuites)', kcal: 140, protein: 5.5, carbs: 26, fat: 1.5, fiber: 4, portionG: 180, category: 'Féculents', vegan: true },
  { id: 'quinoa-cooked', name: 'Quinoa (cuit)', kcal: 120, protein: 4.4, carbs: 18.5, fat: 1.9, fiber: 2.8, portionG: 150, category: 'Féculents', vegan: true },
  { id: 'couscous-cooked', name: 'Semoule (cuite)', kcal: 112, protein: 3.8, carbs: 22, fat: 0.2, fiber: 1.4, portionG: 150, category: 'Féculents', vegan: true },
  { id: 'potato-boiled', name: 'Pomme de terre (cuite à l\'eau)', kcal: 80, protein: 2, carbs: 17, fat: 0.1, fiber: 1.8, portionG: 200, category: 'Féculents', vegan: true },
  { id: 'sweet-potato', name: 'Patate douce (cuite)', kcal: 86, protein: 1.6, carbs: 17, fat: 0.1, fiber: 3, portionG: 200, category: 'Féculents', vegan: true },
  { id: 'oats', name: 'Flocons d\'avoine', kcal: 370, protein: 13, carbs: 58, fat: 7, fiber: 10, portionG: 40, portionLabel: '4 c. à soupe', category: 'Féculents', vegan: true },
  { id: 'bread-whole', name: 'Pain complet', kcal: 240, protein: 9, carbs: 41, fat: 2.5, fiber: 7, portionG: 40, portionLabel: '1 tranche', category: 'Féculents', vegan: true },
  { id: 'baguette', name: 'Baguette', kcal: 270, protein: 9, carbs: 55, fat: 1.3, fiber: 3, portionG: 50, portionLabel: '¼ de baguette', category: 'Féculents', vegan: true },
  { id: 'rice-cake', name: 'Galette de riz', kcal: 385, protein: 8, carbs: 81, fat: 2.8, fiber: 3, portionG: 8, portionLabel: '1 galette', category: 'Féculents', vegan: true },

  // Fruits
  { id: 'apple', name: 'Pomme', kcal: 53, protein: 0.3, carbs: 11.6, fat: 0.2, fiber: 2, portionG: 150, portionLabel: '1 pomme', category: 'Fruits', vegan: true },
  { id: 'banana', name: 'Banane', kcal: 90, protein: 1.1, carbs: 20, fat: 0.3, fiber: 2.6, portionG: 120, portionLabel: '1 banane', category: 'Fruits', vegan: true },
  { id: 'orange', name: 'Orange', kcal: 45, protein: 0.9, carbs: 9, fat: 0.1, fiber: 2, portionG: 150, portionLabel: '1 orange', category: 'Fruits', vegan: true },
  { id: 'strawberries', name: 'Fraises', kcal: 32, protein: 0.7, carbs: 6, fat: 0.3, fiber: 2, portionG: 150, category: 'Fruits', vegan: true },
  { id: 'blueberries', name: 'Myrtilles', kcal: 57, protein: 0.7, carbs: 12, fat: 0.3, fiber: 2.4, portionG: 100, category: 'Fruits', vegan: true },
  { id: 'kiwi', name: 'Kiwi', kcal: 60, protein: 1.1, carbs: 11.5, fat: 0.5, fiber: 3, portionG: 75, portionLabel: '1 kiwi', category: 'Fruits', vegan: true },
  { id: 'grapes', name: 'Raisin', kcal: 70, protein: 0.7, carbs: 16, fat: 0.2, fiber: 0.9, portionG: 100, category: 'Fruits', vegan: true },
  { id: 'mango', name: 'Mangue', kcal: 60, protein: 0.8, carbs: 13, fat: 0.4, fiber: 1.6, portionG: 150, category: 'Fruits', vegan: true },
  { id: 'avocado', name: 'Avocat', kcal: 160, protein: 2, carbs: 2, fat: 14.7, fiber: 6.7, portionG: 80, portionLabel: '½ avocat', category: 'Fruits', vegan: true },

  // Légumes
  { id: 'broccoli-cooked', name: 'Brocoli (cuit)', kcal: 35, protein: 2.4, carbs: 4, fat: 0.4, fiber: 3.3, portionG: 150, category: 'Légumes', vegan: true },
  { id: 'green-beans-cooked', name: 'Haricots verts (cuits)', kcal: 32, protein: 1.9, carbs: 4.5, fat: 0.2, fiber: 3, portionG: 150, category: 'Légumes', vegan: true },
  { id: 'zucchini-cooked', name: 'Courgette (cuite)', kcal: 17, protein: 1.2, carbs: 2, fat: 0.3, fiber: 1, portionG: 150, category: 'Légumes', vegan: true },
  { id: 'carrot', name: 'Carotte (crue)', kcal: 40, protein: 0.9, carbs: 7, fat: 0.2, fiber: 2.8, portionG: 100, category: 'Légumes', vegan: true },
  { id: 'tomato', name: 'Tomate', kcal: 18, protein: 0.9, carbs: 3, fat: 0.2, fiber: 1.2, portionG: 120, portionLabel: '1 tomate', category: 'Légumes', vegan: true },
  { id: 'lettuce', name: 'Salade verte', kcal: 15, protein: 1.3, carbs: 1.5, fat: 0.2, fiber: 1.3, portionG: 50, category: 'Légumes', vegan: true },
  { id: 'spinach-cooked', name: 'Épinards (cuits)', kcal: 23, protein: 3, carbs: 1, fat: 0.3, fiber: 2.4, portionG: 150, category: 'Légumes', vegan: true },
  { id: 'cucumber', name: 'Concombre', kcal: 15, protein: 0.7, carbs: 2.5, fat: 0.1, fiber: 0.5, portionG: 100, category: 'Légumes', vegan: true },
  { id: 'bell-pepper', name: 'Poivron', kcal: 30, protein: 1, carbs: 5, fat: 0.3, fiber: 1.8, portionG: 100, category: 'Légumes', vegan: true },
  { id: 'mushrooms', name: 'Champignons de Paris', kcal: 22, protein: 3, carbs: 0.5, fat: 0.3, fiber: 1, portionG: 100, category: 'Légumes', vegan: true },
  { id: 'peas-cooked', name: 'Petits pois (cuits)', kcal: 84, protein: 5.4, carbs: 10, fat: 0.4, fiber: 5.5, portionG: 150, category: 'Légumes', vegan: true },

  // Matières grasses & oléagineux
  { id: 'olive-oil', name: 'Huile d\'olive', kcal: 900, protein: 0, carbs: 0, fat: 100, portionG: 10, portionLabel: '1 c. à soupe', category: 'Matières grasses & oléagineux', vegan: true },
  { id: 'butter', name: 'Beurre', kcal: 745, protein: 0.7, carbs: 0.6, fat: 82, portionG: 10, portionLabel: '1 noisette', category: 'Matières grasses & oléagineux', vegetarian: true },
  { id: 'almonds', name: 'Amandes', kcal: 590, protein: 21, carbs: 9, fat: 50, fiber: 12.5, portionG: 30, portionLabel: '1 poignée', category: 'Matières grasses & oléagineux', vegan: true },
  { id: 'walnuts', name: 'Noix', kcal: 660, protein: 15, carbs: 7, fat: 65, fiber: 6.7, portionG: 30, portionLabel: '1 poignée', category: 'Matières grasses & oléagineux', vegan: true },
  { id: 'peanut-butter', name: 'Beurre de cacahuète', kcal: 600, protein: 25, carbs: 14, fat: 50, fiber: 6, portionG: 15, portionLabel: '1 c. à soupe', category: 'Matières grasses & oléagineux', vegan: true },
  { id: 'chia', name: 'Graines de chia', kcal: 490, protein: 17, carbs: 8, fat: 31, fiber: 34, portionG: 15, portionLabel: '1 c. à soupe', category: 'Matières grasses & oléagineux', vegan: true },
  { id: 'dark-chocolate', name: 'Chocolat noir 70 %', kcal: 590, protein: 8, carbs: 35, fat: 43, fiber: 11, portionG: 20, portionLabel: '2 carrés', category: 'Sucré', vegan: true },

  // Divers
  { id: 'honey', name: 'Miel', kcal: 320, protein: 0.4, carbs: 80, fat: 0, portionG: 10, portionLabel: '1 c. à café', category: 'Sucré', vegetarian: true },
  { id: 'jam', name: 'Confiture', kcal: 250, protein: 0.4, carbs: 60, fat: 0.1, portionG: 20, portionLabel: '1 c. à soupe', category: 'Sucré', vegan: true },
  { id: 'whey', name: 'Protéine whey (moyenne, voir étiquette)', kcal: 380, protein: 76, carbs: 8, fat: 6, portionG: 30, portionLabel: '1 dose', category: 'Compléments', vegetarian: true },
  { id: 'orange-juice', name: 'Jus d\'orange', kcal: 45, protein: 0.7, carbs: 10, fat: 0.2, portionG: 200, portionLabel: '1 verre', category: 'Boissons', vegan: true },
  { id: 'cola', name: 'Soda sucré (type cola)', kcal: 42, protein: 0, carbs: 10.6, fat: 0, portionG: 330, portionLabel: '1 canette', category: 'Boissons', vegan: true },
  { id: 'coffee', name: 'Café noir', kcal: 1, protein: 0.1, carbs: 0, fat: 0, portionG: 150, portionLabel: '1 tasse', category: 'Boissons', vegan: true },
];

export const BUILTIN_FOODS: Food[] = RAW.map((f) => ({
  ...f,
  vegetarian: f.vegetarian || f.vegan,
  source: 'builtin' as const,
}));

export const FOOD_BY_ID: Record<string, Food> = Object.fromEntries(BUILTIN_FOODS.map((f) => [f.id, f]));

export const MEAL_SLOT_LABELS: Record<MealSlot, string> = {
  breakfast: 'Petit-déjeuner',
  lunch: 'Déjeuner',
  snack: 'Collation',
  dinner: 'Dîner',
};

export const MEAL_SLOTS: MealSlot[] = ['breakfast', 'lunch', 'snack', 'dinner'];

/** Répartition indicative des calories sur la journée (choix de l'application). */
export const SLOT_SHARE: Record<MealSlot, number> = { breakfast: 0.25, lunch: 0.35, snack: 0.1, dinner: 0.3 };

export interface MealIdea {
  id: string;
  name: string;
  slot: MealSlot;
  diets: ('omnivore' | 'pescatarian' | 'vegetarian' | 'vegan')[];
  items: { foodId: string; grams: number }[];
}

const ALL: MealIdea['diets'] = ['omnivore', 'pescatarian', 'vegetarian', 'vegan'];
const VEG: MealIdea['diets'] = ['omnivore', 'pescatarian', 'vegetarian'];
const PESC: MealIdea['diets'] = ['omnivore', 'pescatarian'];
const OMNI: MealIdea['diets'] = ['omnivore'];

/** Idées de repas équilibrés ; les quantités sont ajustées à l'objectif calorique. */
export const MEAL_IDEAS: MealIdea[] = [
  { id: 'porridge', name: 'Porridge banane & skyr', slot: 'breakfast', diets: VEG, items: [{ foodId: 'oats', grams: 50 }, { foodId: 'milk-semi', grams: 200 }, { foodId: 'banana', grams: 100 }, { foodId: 'skyr', grams: 100 }] },
  { id: 'porridge-vegan', name: 'Porridge soja, myrtilles & chia', slot: 'breakfast', diets: ALL, items: [{ foodId: 'oats', grams: 50 }, { foodId: 'soy-drink', grams: 250 }, { foodId: 'blueberries', grams: 100 }, { foodId: 'chia', grams: 10 }] },
  { id: 'eggs-toast', name: 'Œufs brouillés & pain complet', slot: 'breakfast', diets: VEG, items: [{ foodId: 'egg', grams: 100 }, { foodId: 'bread-whole', grams: 60 }, { foodId: 'tomato', grams: 120 }, { foodId: 'kiwi', grams: 75 }] },
  { id: 'fromage-blanc-bowl', name: 'Bol fromage blanc, fruits & amandes', slot: 'breakfast', diets: VEG, items: [{ foodId: 'fromage-blanc-0', grams: 200 }, { foodId: 'strawberries', grams: 150 }, { foodId: 'oats', grams: 30 }, { foodId: 'almonds', grams: 15 }] },

  { id: 'chicken-rice', name: 'Poulet, riz & brocoli', slot: 'lunch', diets: OMNI, items: [{ foodId: 'chicken-breast-cooked', grams: 120 }, { foodId: 'rice-white-cooked', grams: 150 }, { foodId: 'broccoli-cooked', grams: 150 }, { foodId: 'olive-oil', grams: 10 }] },
  { id: 'salmon-quinoa', name: 'Saumon, quinoa & haricots verts', slot: 'lunch', diets: PESC, items: [{ foodId: 'salmon-raw', grams: 120 }, { foodId: 'quinoa-cooked', grams: 150 }, { foodId: 'green-beans-cooked', grams: 150 }] },
  { id: 'lentil-bowl', name: 'Bowl lentilles, patate douce & avocat', slot: 'lunch', diets: ALL, items: [{ foodId: 'lentils-cooked', grams: 180 }, { foodId: 'sweet-potato', grams: 150 }, { foodId: 'avocado', grams: 50 }, { foodId: 'lettuce', grams: 50 }] },
  { id: 'tuna-pasta', name: 'Salade de pâtes au thon', slot: 'lunch', diets: PESC, items: [{ foodId: 'pasta-whole-cooked', grams: 160 }, { foodId: 'tuna-can', grams: 100 }, { foodId: 'tomato', grams: 120 }, { foodId: 'olive-oil', grams: 10 }] },

  { id: 'skyr-fruit', name: 'Skyr & fruit', slot: 'snack', diets: VEG, items: [{ foodId: 'skyr', grams: 150 }, { foodId: 'apple', grams: 150 }] },
  { id: 'nuts-fruit', name: 'Fruit & poignée d\'amandes', slot: 'snack', diets: ALL, items: [{ foodId: 'banana', grams: 120 }, { foodId: 'almonds', grams: 20 }] },
  { id: 'ricecake-pb', name: 'Galettes de riz & beurre de cacahuète', slot: 'snack', diets: ALL, items: [{ foodId: 'rice-cake', grams: 16 }, { foodId: 'peanut-butter', grams: 15 }, { foodId: 'kiwi', grams: 75 }] },

  { id: 'cod-potato', name: 'Cabillaud, pommes de terre & courgettes', slot: 'dinner', diets: PESC, items: [{ foodId: 'cod-raw', grams: 150 }, { foodId: 'potato-boiled', grams: 200 }, { foodId: 'zucchini-cooked', grams: 150 }, { foodId: 'olive-oil', grams: 10 }] },
  { id: 'tofu-stirfry', name: 'Wok tofu, légumes & riz complet', slot: 'dinner', diets: ALL, items: [{ foodId: 'tofu', grams: 150 }, { foodId: 'rice-brown-cooked', grams: 130 }, { foodId: 'bell-pepper', grams: 100 }, { foodId: 'broccoli-cooked', grams: 100 }, { foodId: 'olive-oil', grams: 5 }] },
  { id: 'omelette', name: 'Omelette champignons, salade & pain', slot: 'dinner', diets: VEG, items: [{ foodId: 'egg', grams: 150 }, { foodId: 'mushrooms', grams: 100 }, { foodId: 'lettuce', grams: 60 }, { foodId: 'bread-whole', grams: 40 }] },
  { id: 'turkey-pasta', name: 'Dinde, pâtes complètes & épinards', slot: 'dinner', diets: OMNI, items: [{ foodId: 'turkey-cooked', grams: 120 }, { foodId: 'pasta-whole-cooked', grams: 150 }, { foodId: 'spinach-cooked', grams: 150 }] },
  { id: 'chickpea-curry', name: 'Curry de pois chiches & semoule', slot: 'dinner', diets: ALL, items: [{ foodId: 'chickpeas-cooked', grams: 180 }, { foodId: 'couscous-cooked', grams: 130 }, { foodId: 'tomato', grams: 150 }, { foodId: 'spinach-cooked', grams: 100 }] },
];
