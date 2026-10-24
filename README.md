# Bémi's Fitness app

Application web mobile (installable sur téléphone) pour se mettre au sport : programme d'entraînement généré sur mesure, suivi des séances, suivi des repas et des progrès.

Tout fonctionne dans le navigateur, **sans compte ni serveur** : les données s'enregistrent automatiquement sur le téléphone. Un bouton flottant 💾 permet de faire une copie de sauvegarde (feuille de partage : Fichiers, iCloud Drive, e-mail…) et de la restaurer ; un point orange rappelle de le faire après 7 jours sans copie.

## Fonctionnalités

**Questionnaire de départ** : objectif, niveau, jours disponibles, durée des séances, matériel, zones sensibles (genoux, dos, épaules, poignets, pas de sauts), zone prioritaire, cardio préféré, régime alimentaire.

**Programme généré automatiquement**
- Découpage adapté au nombre de séances : full body (1-3 j), haut/bas (4 j), haut/bas + séance bonus (5 j), poussée/tirage/jambes (6 j).
- Exercices choisis dans une bibliothèque de 91 exercices selon le matériel, le niveau et les zones sensibles, avec consignes techniques.
- Séries, répétitions et temps de repos selon l'objectif ; nombre d'exercices ajusté à la durée souhaitée.
- Cycle de 4 semaines (semaine 3 un peu plus de volume, semaine 4 allégée).
- Possibilité de générer une autre variante, de modifier chaque séance (remplacer, ajouter, réordonner un exercice, changer séries/répétitions/repos) et de créer ses propres séances.

**Démos d'exercices** : pour 57 des 91 exercices, deux dessins (les deux positions du mouvement) affichés en alternance, issus d'[Everkinetic](https://github.com/everkinetic/data) (Greg Priday, licence [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/deed.fr) — voir `public/demos/LICENCE.txt`). Chaque correspondance a été vérifiée visuellement ; les variantes sont signalées. Pour tous les exercices, des liens YouTube mettent en avant des démonstrations par des femmes (Sissy Mua, Juju Fitcats, recherche « exercice femme »), puis Tibo InShape et Nassim Sahili.

**Pendant la séance** : échauffement, saisie charge/répétitions par série, chrono de repos automatique (bip + vibration), chrono d'effort pour le gainage, suggestion de charge basée sur la séance précédente (double progression), remplacement d'un exercice, ressenti (RPE) et notes.

**Repas** : objectifs calories/protéines/glucides/lipides/fibres/eau, ~70 aliments de base, recherche de produits du commerce intégrée à la recherche d'aliments et par code-barres via [Open Food Facts](https://world.openfoodfacts.org), avec Nutri-Score et groupe NOVA — seules les fiches complètes et cohérentes sont gardées (calories, protéines, glucides, lipides renseignés ; valeurs plausibles ; énergie déclarée cohérente à ±20 % avec l'énergie recalculée selon les coefficients du règlement UE 1169/2011 ; aucune erreur relevée par les contrôles qualité d'Open Food Facts), aliments personnalisés, repas enregistrés, « copier d'hier », idées de repas adaptées au régime et ajustées à l'objectif calorique, suivi de l'hydratation.

**Analyse de repas en photo (IA, optionnelle)** : photo de l'assiette → liste des aliments et quantités estimées, note d'équilibre sur 10 détaillée critère par critère (légumes & fruits /3, protéines /2, féculents & fibres /2, degré de transformation /1,5, gras-sucre-sel /1,5), points forts, pistes d'amélioration, ajout au journal en un geste. Utilise l'API Claude d'Anthropic avec une clé personnelle saisie dans *Profil → Analyse photo* (stockée uniquement sur le téléphone, jamais dans les sauvegardes exportées). Payant à l'usage : environ 3 à 7 centimes par photo avec Claude Opus 5.5, moins d'un centime avec Claude Haiku 5.5 (estimations d'après les tarifs publics d'octobre 2026).

**Progrès** : courbe de poids avec moyenne sur 7 jours, mensurations, calories des 7 derniers jours, minutes de cardio de la semaine, records personnels, séries de semaines actives.

## Utilisation

```bash
npm install
npm run dev      # développement : http://localhost:5173
npm test         # tests unitaires (calculs nutritionnels, générateur, progression)
npm run build    # version de production dans dist/
```

### Mettre l'application sur son téléphone

1. Publier le dossier `dist/` sur n'importe quel hébergement statique en HTTPS. Le workflow `.github/workflows/deploy.yml` le fait automatiquement sur **GitHub Pages** à chaque push sur `main` (à activer une fois : *Settings → Pages → Source : GitHub Actions*). Netlify, Vercel ou Cloudflare Pages fonctionnent aussi.
2. Ouvrir l'adresse sur le téléphone puis :
   - **iPhone (Safari)** : Partager → « Sur l'écran d'accueil » ;
   - **Android (Chrome)** : menu ⋮ → « Installer l'application ».

Une fois installée, l'application fonctionne hors connexion (sauf la recherche Open Food Facts).

## Méthode et sources

| Élément | Méthode | Source |
|---|---|---|
| Métabolisme de base | Équation de Mifflin-St Jeor | Mifflin MD, St Jeor ST et al. *Am J Clin Nutr* 1990;51(2):241-247 |
| Dépense totale | Métabolisme × facteur d'activité (1,2 / 1,375 / 1,55 / 1,725 / 1,9) | Facteurs usuels associés à cette équation |
| Objectif calorique | −20 % (perte de poids), −10 % (tonifier), 0 (forme), +5 % (force), +10 % (muscle) ; plancher 1200 kcal (F) / 1500 kcal (H) | **Choix de l'application** (déficit/surplus modérés), modifiables par l'utilisatrice |
| Protéines | 1,4 à 1,8 g/kg/jour selon l'objectif (poids de référence à IMC 25 si IMC > 30) | Position de l'ISSN : 1,4-2,0 g/kg/j pour les personnes qui s'entraînent (Jäger et al., *JISSN* 2017) |
| Lipides | 30 % de l'énergie | Intervalle de référence EFSA : 20-35 % |
| Fibres | 30 g/jour | Repère ANSES pour l'adulte |
| Eau | 2,0 L (F) / 2,5 L (H) par jour | Apports adéquats en eau totale, EFSA 2010 (boissons + aliments) |
| IMC | Seuils 18,5 / 25 / 30 | OMS |
| Séries / répétitions / fréquence | 8-12 rép. pour débuter/hypertrophie, ≤ 6 rép. et repos longs pour la force, 12-20 rép. pour l'endurance ; 2-3 séances/semaine par groupe musculaire | ACSM Position Stand « Progression models in resistance training for healthy adults », *Med Sci Sports Exerc* 2009 |
| Activité d'endurance | 150-300 min/semaine d'intensité modérée + renforcement ≥ 2 j/semaine | Lignes directrices de l'OMS sur l'activité physique, 2020 |
| Note des repas en photo | Grille sur 10 appliquée par l'IA, total recalculé par l'application | Inspirée des repères de Santé publique France (PNNS 2019), de la classification NOVA et du principe de l'assiette équilibrée — **pondération choisie par l'application**, pas un score officiel ; quantités et calories estimées sur photo = ordre de grandeur |
| 1RM estimé | Formule d'Epley : charge × (1 + rép./30) | Indicatif uniquement |
| Valeurs des aliments de base | Moyennes arrondies | Tables Ciqual (ANSES) et USDA FoodData Central — ordres de grandeur, à vérifier sur l'étiquette pour un produit précis |

Les valeurs nutritionnelles de la base intégrée sont des **moyennes arrondies** et non des valeurs exactes pour un produit donné. Les données Open Food Facts sont collaboratives et peuvent contenir des erreurs.

> ⚠️ L'application donne des repères généraux et ne remplace pas l'avis d'un médecin, d'un·e diététicien·ne ou d'un·e coach diplômé·e — en particulier en cas de grossesse, de problème de santé, de blessure ou de trouble du comportement alimentaire.

## Structure du code

```
src/
  data/exercises.ts     bibliothèque d'exercices (matériel, niveau, zones à éviter, consignes)
  data/foods.ts         aliments de base et idées de repas
  data/exerciseDemos.ts correspondance exercices → dessins (public/demos)
  data/exerciseVideos.ts créatrices / créateurs vidéo et liens de recherche YouTube
  lib/nutrition.ts      métabolisme, objectifs, calcul des macros
  lib/generator.ts      génération du programme, prescription, progression
  lib/actions.ts        séance en cours, records, statistiques
  lib/openfoodfacts.ts  recherche produits / code-barres et contrôles de fiabilité
  lib/backup.ts         copie de sauvegarde, restauration, stockage persistant
  lib/mealAnalysis.ts   analyse photo : grille de notation, appel à l'API Claude
  store.tsx             état global persisté dans le localStorage
  pages/                écrans (accueil, repas, séances, progrès, profil, séance en cours)
public/sw.js            service worker (hors connexion)
```
