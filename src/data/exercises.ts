import type { Exercise } from '../types';

/**
 * Bibliothèque d'exercices.
 * equipment : tout ce qui est listé doit être disponible ([] = poids du corps).
 * avoidIf : l'exercice n'est pas proposé automatiquement si la zone est signalée sensible.
 */
export const EXERCISES: Exercise[] = [
  // ---------- SQUAT ----------
  {
    id: 'box-squat', name: 'Squat sur chaise', pattern: 'squat', muscles: ['quadriceps', 'fessiers'],
    equipment: [], level: 1, avoidIf: [], compound: true,
    cues: ['Pieds largeur d\'épaules, assieds-toi en arrière jusqu\'à effleurer la chaise', 'Genoux dans l\'axe des pieds', 'Pousse dans les talons pour remonter'],
  },
  {
    id: 'bw-squat', name: 'Squat au poids du corps', pattern: 'squat', muscles: ['quadriceps', 'fessiers'],
    equipment: [], level: 1, avoidIf: [], compound: true,
    cues: ['Dos droit, poitrine ouverte', 'Descends aussi bas que possible sans arrondir le bas du dos', 'Genoux dans l\'axe des orteils'],
  },
  {
    id: 'goblet-squat', name: 'Goblet squat (haltère)', pattern: 'squat', muscles: ['quadriceps', 'fessiers', 'abdos'],
    equipment: ['dumbbells'], level: 1, avoidIf: [], compound: true, loadable: true,
    cues: ['Tiens l\'haltère contre la poitrine', 'Coudes entre les genoux en bas du mouvement', 'Garde le buste fier'],
  },
  {
    id: 'kb-goblet-squat', name: 'Goblet squat (kettlebell)', pattern: 'squat', muscles: ['quadriceps', 'fessiers', 'abdos'],
    equipment: ['kettlebell'], level: 1, avoidIf: [], compound: true, loadable: true,
    cues: ['Kettlebell tenue par les cornes contre la poitrine', 'Descends entre tes jambes, buste droit', 'Remonte en poussant le sol'],
  },
  {
    id: 'sumo-squat', name: 'Squat sumo (haltère)', pattern: 'squat', muscles: ['fessiers', 'adducteurs', 'quadriceps'],
    equipment: ['dumbbells'], level: 1, avoidIf: [], compound: true, loadable: true,
    cues: ['Pieds écartés, pointes vers l\'extérieur', 'Haltère tenue bras tendus entre les jambes', 'Genoux poussés vers l\'extérieur'],
  },
  {
    id: 'band-squat', name: 'Squat avec élastique', pattern: 'squat', muscles: ['quadriceps', 'fessiers'],
    equipment: ['bands'], level: 1, avoidIf: [], compound: true,
    cues: ['Élastique sous les pieds, poignées aux épaules', 'Descends en gardant la tension', 'Ou mini-band au-dessus des genoux et pousse les genoux vers l\'extérieur'],
  },
  {
    id: 'leg-press', name: 'Presse à cuisses', pattern: 'squat', muscles: ['quadriceps', 'fessiers'],
    equipment: ['gym'], level: 1, avoidIf: [], compound: true, loadable: true,
    cues: ['Bas du dos collé au dossier', 'Ne verrouille pas complètement les genoux en haut', 'Pieds hauts sur la plateforme = plus de fessiers'],
  },
  {
    id: 'back-squat', name: 'Squat barre', pattern: 'squat', muscles: ['quadriceps', 'fessiers', 'lombaires'],
    equipment: ['gym'], level: 2, avoidIf: ['lower_back'], compound: true, loadable: true,
    cues: ['Barre sur le haut du dos, gainage serré', 'Descends sous contrôle, remonte en expirant', 'Commence léger pour maîtriser la technique'],
  },
  {
    id: 'wall-sit', name: 'Chaise contre le mur', pattern: 'squat', muscles: ['quadriceps', 'fessiers'],
    equipment: [], level: 1, avoidIf: ['knees'], timed: true,
    cues: ['Dos plaqué au mur, cuisses parallèles au sol', 'Genoux au-dessus des chevilles', 'Respire calmement'],
  },

  // ---------- HINGE (charnière de hanche) ----------
  {
    id: 'db-rdl', name: 'Soulevé de terre roumain (haltères)', pattern: 'hinge', muscles: ['ischios', 'fessiers', 'lombaires'],
    equipment: ['dumbbells'], level: 1, avoidIf: ['lower_back'], compound: true, loadable: true,
    cues: ['Genoux légèrement fléchis, pousse les fesses en arrière', 'Haltères proches des jambes, dos plat', 'Remonte en serrant les fessiers'],
  },
  {
    id: 'kb-deadlift', name: 'Soulevé de terre (kettlebell)', pattern: 'hinge', muscles: ['ischios', 'fessiers', 'lombaires'],
    equipment: ['kettlebell'], level: 1, avoidIf: ['lower_back'], compound: true, loadable: true,
    cues: ['Kettlebell entre les pieds', 'Hanches en arrière, dos plat, saisis la poignée', 'Pousse le sol et termine debout, fessiers serrés'],
  },
  {
    id: 'kb-swing', name: 'Kettlebell swing', pattern: 'hinge', muscles: ['fessiers', 'ischios', 'cardio'],
    equipment: ['kettlebell'], level: 2, avoidIf: ['lower_back'], compound: true, loadable: true,
    cues: ['Le mouvement vient des hanches, pas des bras', 'Projette les hanches vers l\'avant', 'La kettlebell monte à hauteur de poitrine maximum'],
  },
  {
    id: 'band-good-morning', name: 'Good morning (élastique)', pattern: 'hinge', muscles: ['ischios', 'fessiers', 'lombaires'],
    equipment: ['bands'], level: 1, avoidIf: ['lower_back'], compound: true,
    cues: ['Élastique sous les pieds et derrière la nuque', 'Penche-toi en poussant les fesses en arrière, dos plat', 'Remonte en contractant les fessiers'],
  },
  {
    id: 'sl-rdl', name: 'Soulevé de terre unilatéral', pattern: 'hinge', muscles: ['ischios', 'fessiers'],
    equipment: [], level: 2, avoidIf: [], unilateral: true,
    cues: ['Bascule le buste en levant la jambe arrière', 'Hanches parallèles au sol', 'Tiens-toi à un mur au début si besoin'],
  },
  {
    id: 'barbell-rdl', name: 'Soulevé de terre roumain (barre)', pattern: 'hinge', muscles: ['ischios', 'fessiers', 'lombaires'],
    equipment: ['gym'], level: 2, avoidIf: ['lower_back'], compound: true, loadable: true,
    cues: ['Barre glissant le long des cuisses', 'Dos plat, regard neutre', 'Arrête la descente quand tu sens l\'étirement des ischios'],
  },
  {
    id: 'leg-curl', name: 'Leg curl (machine)', pattern: 'hinge', muscles: ['ischios'],
    equipment: ['gym'], level: 1, avoidIf: [], loadable: true,
    cues: ['Contrôle la phase de retour', 'Bassin collé au banc', 'Mouvement complet sans à-coups'],
  },
  {
    id: 'superman', name: 'Superman', pattern: 'hinge', muscles: ['lombaires', 'fessiers', 'dos'],
    equipment: [], level: 1, avoidIf: [],
    cues: ['Allongée sur le ventre, décolle bras et jambes', 'Regard vers le sol, nuque neutre', 'Tiens 2 secondes en haut'],
  },

  // ---------- FENTES ----------
  {
    id: 'reverse-lunge', name: 'Fente arrière', pattern: 'lunge', muscles: ['quadriceps', 'fessiers'],
    equipment: [], level: 1, avoidIf: [], unilateral: true, compound: true,
    cues: ['Recule une jambe et descends le genou vers le sol', 'Le genou avant reste au-dessus de la cheville', 'Pousse sur le talon avant pour remonter'],
  },
  {
    id: 'db-reverse-lunge', name: 'Fente arrière (haltères)', pattern: 'lunge', muscles: ['quadriceps', 'fessiers'],
    equipment: ['dumbbells'], level: 1, avoidIf: [], unilateral: true, compound: true, loadable: true,
    cues: ['Haltères le long du corps', 'Buste légèrement penché vers l\'avant = plus de fessiers', 'Contrôle la descente'],
  },
  {
    id: 'split-squat', name: 'Fente statique', pattern: 'lunge', muscles: ['quadriceps', 'fessiers'],
    equipment: [], level: 1, avoidIf: [], unilateral: true, compound: true,
    cues: ['Pieds décalés, monte et descends sur place', 'Les deux genoux à 90° en bas', 'Buste droit'],
  },
  {
    id: 'step-up', name: 'Montée sur marche', pattern: 'lunge', muscles: ['quadriceps', 'fessiers'],
    equipment: [], level: 1, avoidIf: [], unilateral: true, compound: true,
    cues: ['Utilise une marche ou un banc stable', 'Pousse avec la jambe sur la marche, pas avec celle du sol', 'Redescends lentement'],
  },
  {
    id: 'bulgarian-split-squat', name: 'Squat bulgare', pattern: 'lunge', muscles: ['quadriceps', 'fessiers'],
    equipment: [], level: 2, avoidIf: ['knees'], unilateral: true, compound: true,
    cues: ['Pied arrière posé sur une chaise ou un canapé', 'Descends verticalement', 'Commence sans charge'],
  },
  {
    id: 'db-bulgarian-split-squat', name: 'Squat bulgare (haltères)', pattern: 'lunge', muscles: ['quadriceps', 'fessiers'],
    equipment: ['dumbbells'], level: 2, avoidIf: ['knees'], unilateral: true, compound: true, loadable: true,
    cues: ['Pied arrière sur un banc ou une chaise', 'Haltères le long du corps', 'Contrôle la descente sur 2 secondes'],
  },
  {
    id: 'walking-lunge', name: 'Fentes marchées (haltères)', pattern: 'lunge', muscles: ['quadriceps', 'fessiers'],
    equipment: ['dumbbells'], level: 2, avoidIf: ['knees'], unilateral: true, compound: true, loadable: true,
    cues: ['Grands pas, genou arrière proche du sol', 'Buste droit', 'Avance en enchaînant les fentes'],
  },
  {
    id: 'lateral-lunge', name: 'Fente latérale', pattern: 'lunge', muscles: ['adducteurs', 'fessiers', 'quadriceps'],
    equipment: [], level: 1, avoidIf: ['knees'], unilateral: true,
    cues: ['Grand pas sur le côté, fesses en arrière', 'L\'autre jambe reste tendue', 'Pied à plat au sol'],
  },
  {
    id: 'curtsy-lunge', name: 'Fente croisée (révérence)', pattern: 'lunge', muscles: ['fessiers', 'quadriceps', 'adducteurs'],
    equipment: [], level: 2, avoidIf: ['knees'], unilateral: true,
    cues: ['Croise une jambe en arrière en diagonale', 'Hanches de face', 'Descends contrôlée'],
  },

  // ---------- FESSIERS (isolation) ----------
  {
    id: 'glute-bridge', name: 'Pont fessier', pattern: 'glute', muscles: ['fessiers', 'ischios'],
    equipment: [], level: 1, avoidIf: [],
    cues: ['Allongée, pieds à plat proches des fesses', 'Monte le bassin en serrant les fessiers', 'Ne cambre pas le bas du dos en haut'],
  },
  {
    id: 'sl-glute-bridge', name: 'Pont fessier unilatéral', pattern: 'glute', muscles: ['fessiers', 'ischios'],
    equipment: [], level: 2, avoidIf: [], unilateral: true,
    cues: ['Une jambe tendue ou genou ramené vers la poitrine', 'Bassin bien horizontal', 'Pause d\'1 seconde en haut'],
  },
  {
    id: 'db-hip-thrust', name: 'Hip thrust (haltère)', pattern: 'glute', muscles: ['fessiers', 'ischios'],
    equipment: ['dumbbells'], level: 1, avoidIf: [], loadable: true, compound: true,
    cues: ['Haut du dos sur un canapé ou un banc', 'Haltère posée sur les hanches', 'Menton rentré, monte jusqu\'à l\'alignement genoux-hanches-épaules'],
  },
  {
    id: 'barbell-hip-thrust', name: 'Hip thrust (barre / machine)', pattern: 'glute', muscles: ['fessiers', 'ischios'],
    equipment: ['gym'], level: 1, avoidIf: [], loadable: true, compound: true,
    cues: ['Protège les hanches avec un pad', 'Tibias verticaux en haut', 'Contracte fort les fessiers 1 seconde'],
  },
  {
    id: 'band-hip-abduction', name: 'Abduction de hanches (élastique)', pattern: 'glute', muscles: ['fessiers'],
    equipment: ['bands'], level: 1, avoidIf: [],
    cues: ['Assise, mini-band au-dessus des genoux', 'Écarte les genoux contre la résistance', 'Reviens lentement'],
  },
  {
    id: 'clamshell', name: 'Clamshell (coquillage)', pattern: 'glute', muscles: ['fessiers'],
    equipment: [], level: 1, avoidIf: [], unilateral: true,
    cues: ['Allongée sur le côté, genoux fléchis', 'Ouvre le genou du dessus sans bouger le bassin', 'Ajoute un mini-band pour plus de difficulté'],
  },
  {
    id: 'donkey-kick', name: 'Kickback à quatre pattes', pattern: 'glute', muscles: ['fessiers'],
    equipment: [], level: 1, avoidIf: ['wrists'], unilateral: true,
    cues: ['À quatre pattes, dos plat', 'Pousse le talon vers le plafond, genou à 90°', 'Ne cambre pas'],
  },
  {
    id: 'band-kickback', name: 'Kickback debout (élastique)', pattern: 'glute', muscles: ['fessiers'],
    equipment: ['bands'], level: 1, avoidIf: [], unilateral: true,
    cues: ['Élastique aux chevilles, tiens-toi à un appui', 'Pousse la jambe en arrière en serrant le fessier', 'Buste immobile'],
  },
  {
    id: 'cable-kickback', name: 'Kickback à la poulie', pattern: 'glute', muscles: ['fessiers'],
    equipment: ['gym'], level: 1, avoidIf: [], unilateral: true, loadable: true,
    cues: ['Sangle à la cheville', 'Légère inclinaison du buste', 'Contracte le fessier en fin de mouvement'],
  },
  {
    id: 'abductor-machine', name: 'Machine à abducteurs', pattern: 'glute', muscles: ['fessiers'],
    equipment: ['gym'], level: 1, avoidIf: [], loadable: true,
    cues: ['Buste légèrement penché vers l\'avant = plus de fessiers', 'Ouvre en contrôlant', 'Ne relâche pas d\'un coup'],
  },

  // ---------- POUSSÉE HORIZONTALE ----------
  {
    id: 'incline-pushup', name: 'Pompes inclinées (mains surélevées)', pattern: 'push_h', muscles: ['pectoraux', 'triceps', 'epaules'],
    equipment: [], level: 1, avoidIf: ['wrists'], compound: true,
    cues: ['Mains sur une table, un plan de travail ou un banc', 'Corps gainé en planche', 'Plus le support est bas, plus c\'est difficile'],
  },
  {
    id: 'knee-pushup', name: 'Pompes sur les genoux', pattern: 'push_h', muscles: ['pectoraux', 'triceps', 'epaules'],
    equipment: [], level: 1, avoidIf: ['wrists'], compound: true,
    cues: ['Alignement genoux-hanches-épaules', 'Coudes à environ 45° du corps', 'Poitrine près du sol'],
  },
  {
    id: 'pushup', name: 'Pompes', pattern: 'push_h', muscles: ['pectoraux', 'triceps', 'epaules', 'abdos'],
    equipment: [], level: 2, avoidIf: ['wrists'], compound: true,
    cues: ['Corps parfaitement gainé', 'Descends la poitrine jusqu\'à quelques cm du sol', 'Expire en poussant'],
  },
  {
    id: 'db-floor-press', name: 'Développé au sol (haltères)', pattern: 'push_h', muscles: ['pectoraux', 'triceps'],
    equipment: ['dumbbells'], level: 1, avoidIf: [], compound: true, loadable: true,
    cues: ['Allongée au sol, genoux fléchis', 'Les coudes touchent le sol en bas (amplitude protectrice pour les épaules)', 'Pousse vers le plafond'],
  },
  {
    id: 'db-bench-press', name: 'Développé couché (haltères)', pattern: 'push_h', muscles: ['pectoraux', 'triceps', 'epaules'],
    equipment: ['dumbbells', 'bench'], level: 1, avoidIf: ['shoulders'], compound: true, loadable: true,
    cues: ['Omoplates serrées sur le banc', 'Descends les haltères au niveau de la poitrine', 'Pieds bien ancrés au sol'],
  },
  {
    id: 'band-chest-press', name: 'Développé poitrine (élastique)', pattern: 'push_h', muscles: ['pectoraux', 'triceps'],
    equipment: ['bands'], level: 1, avoidIf: [], compound: true,
    cues: ['Élastique accroché derrière toi', 'Pousse vers l\'avant en expirant', 'Reviens lentement'],
  },
  {
    id: 'machine-chest-press', name: 'Chest press (machine)', pattern: 'push_h', muscles: ['pectoraux', 'triceps'],
    equipment: ['gym'], level: 1, avoidIf: [], compound: true, loadable: true,
    cues: ['Poignées à hauteur de poitrine', 'Dos collé au dossier', 'Ne verrouille pas les coudes'],
  },

  // ---------- POUSSÉE VERTICALE ----------
  {
    id: 'pike-pushup', name: 'Pompes piquées (pike)', pattern: 'push_v', muscles: ['epaules', 'triceps'],
    equipment: [], level: 2, avoidIf: ['wrists', 'shoulders'], compound: true,
    cues: ['Fesses hautes, corps en V inversé', 'Descends la tête entre les mains', 'Commence avec une petite amplitude'],
  },
  {
    id: 'db-shoulder-press', name: 'Développé épaules (haltères)', pattern: 'push_v', muscles: ['epaules', 'triceps'],
    equipment: ['dumbbells'], level: 1, avoidIf: ['shoulders'], compound: true, loadable: true,
    cues: ['Assise ou debout, abdos serrés', 'Pousse les haltères au-dessus de la tête', 'Ne cambre pas le bas du dos'],
  },
  {
    id: 'band-shoulder-press', name: 'Développé épaules (élastique)', pattern: 'push_v', muscles: ['epaules', 'triceps'],
    equipment: ['bands'], level: 1, avoidIf: ['shoulders'], compound: true,
    cues: ['Élastique sous les pieds', 'Pousse vers le haut, bras presque tendus', 'Gainage actif'],
  },
  {
    id: 'machine-shoulder-press', name: 'Développé épaules (machine)', pattern: 'push_v', muscles: ['epaules', 'triceps'],
    equipment: ['gym'], level: 1, avoidIf: ['shoulders'], compound: true, loadable: true,
    cues: ['Règle le siège : poignées à hauteur d\'épaules', 'Pousse sans verrouiller', 'Contrôle la descente'],
  },

  // ---------- TIRAGE HORIZONTAL ----------
  {
    id: 'db-row', name: 'Rowing haltère unilatéral', pattern: 'pull_h', muscles: ['dos', 'biceps'],
    equipment: ['dumbbells'], level: 1, avoidIf: [], unilateral: true, compound: true, loadable: true,
    cues: ['Une main et un genou en appui sur une chaise ou un banc', 'Tire le coude vers la hanche', 'Dos plat'],
  },
  {
    id: 'kb-row', name: 'Rowing kettlebell', pattern: 'pull_h', muscles: ['dos', 'biceps'],
    equipment: ['kettlebell'], level: 1, avoidIf: [], unilateral: true, compound: true, loadable: true,
    cues: ['Buste penché, dos plat', 'Tire la kettlebell vers la hanche', 'Serre l\'omoplate en haut'],
  },
  {
    id: 'band-row', name: 'Tirage horizontal (élastique)', pattern: 'pull_h', muscles: ['dos', 'biceps'],
    equipment: ['bands'], level: 1, avoidIf: [], compound: true,
    cues: ['Élastique accroché devant toi ou autour des pieds', 'Tire les coudes en arrière', 'Serre les omoplates'],
  },
  {
    id: 'cable-row', name: 'Tirage horizontal (poulie)', pattern: 'pull_h', muscles: ['dos', 'biceps'],
    equipment: ['gym'], level: 1, avoidIf: [], compound: true, loadable: true,
    cues: ['Buste droit, ne te balance pas', 'Tire la poignée vers le nombril', 'Laisse les épaules s\'étirer vers l\'avant au retour'],
  },
  {
    id: 'prone-ytw', name: 'Y-T-W allongée', pattern: 'pull_h', muscles: ['dos', 'epaules'],
    equipment: [], level: 1, avoidIf: [],
    cues: ['Allongée sur le ventre, front au sol', 'Décolle les bras en formant un Y, puis un T, puis un W', 'Pouces vers le plafond, mouvements lents'],
  },

  // ---------- TIRAGE VERTICAL ----------
  {
    id: 'lat-pulldown', name: 'Tirage vertical (poulie)', pattern: 'pull_v', muscles: ['dos', 'biceps'],
    equipment: ['gym'], level: 1, avoidIf: [], compound: true, loadable: true,
    cues: ['Tire la barre vers le haut de la poitrine', 'Poitrine sortie, léger recul du buste', 'Remonte en contrôlant'],
  },
  {
    id: 'band-pulldown', name: 'Tirage vertical (élastique)', pattern: 'pull_v', muscles: ['dos', 'biceps'],
    equipment: ['bands'], level: 1, avoidIf: [], compound: true,
    cues: ['Élastique accroché en hauteur (porte)', 'Tire les coudes vers les côtes', 'Serre les dorsaux'],
  },
  {
    id: 'assisted-pullup-machine', name: 'Tractions assistées (machine)', pattern: 'pull_v', muscles: ['dos', 'biceps'],
    equipment: ['gym'], level: 1, avoidIf: [], compound: true, loadable: true,
    cues: ['Plus le contrepoids est élevé, plus c\'est facile', 'Monte le menton au-dessus de la barre', 'Descends lentement'],
  },
  {
    id: 'negative-pullup', name: 'Tractions négatives', pattern: 'pull_v', muscles: ['dos', 'biceps'],
    equipment: ['pullup_bar'], level: 2, avoidIf: ['shoulders'], compound: true,
    cues: ['Monte en haut avec une chaise', 'Descends le plus lentement possible (3-5 s)', 'Gainage actif'],
  },
  {
    id: 'band-assisted-pullup', name: 'Tractions assistées (élastique)', pattern: 'pull_v', muscles: ['dos', 'biceps'],
    equipment: ['pullup_bar', 'bands'], level: 2, avoidIf: ['shoulders'], compound: true,
    cues: ['Élastique accroché à la barre, pied ou genou dedans', 'Tire la poitrine vers la barre', 'Contrôle la descente'],
  },
  {
    id: 'pullup', name: 'Tractions', pattern: 'pull_v', muscles: ['dos', 'biceps'],
    equipment: ['pullup_bar'], level: 3, avoidIf: ['shoulders'], compound: true,
    cues: ['Prise un peu plus large que les épaules', 'Pars bras tendus, épaules engagées', 'Menton au-dessus de la barre'],
  },

  // ---------- GAINAGE / ABDOS ----------
  {
    id: 'plank', name: 'Planche (gainage ventral)', pattern: 'core', muscles: ['abdos'],
    equipment: [], level: 1, avoidIf: [], timed: true,
    cues: ['Sur les avant-bras, corps aligné', 'Serre fessiers et abdos', 'Sur les genoux pour débuter'],
  },
  {
    id: 'side-plank', name: 'Gainage latéral', pattern: 'core', muscles: ['abdos'],
    equipment: [], level: 1, avoidIf: ['shoulders'], timed: true, unilateral: true,
    cues: ['Coude sous l\'épaule', 'Bassin haut, corps aligné', 'Genoux au sol pour débuter'],
  },
  {
    id: 'dead-bug', name: 'Dead bug', pattern: 'core', muscles: ['abdos'],
    equipment: [], level: 1, avoidIf: [],
    cues: ['Allongée, bas du dos plaqué au sol', 'Tends bras et jambe opposés lentement', 'Expire en tendant'],
  },
  {
    id: 'bird-dog', name: 'Bird dog', pattern: 'core', muscles: ['abdos', 'lombaires', 'fessiers'],
    equipment: [], level: 1, avoidIf: ['wrists'], unilateral: true,
    cues: ['À quatre pattes', 'Tends bras et jambe opposés', 'Bassin immobile, comme un plateau'],
  },
  {
    id: 'crunch', name: 'Crunch', pattern: 'core', muscles: ['abdos'],
    equipment: [], level: 1, avoidIf: [],
    cues: ['Enroule le buste en décollant les omoplates', 'Ne tire pas sur la nuque', 'Expire en montant'],
  },
  {
    id: 'reverse-crunch', name: 'Crunch inversé', pattern: 'core', muscles: ['abdos'],
    equipment: [], level: 1, avoidIf: [],
    cues: ['Genoux à 90°', 'Enroule le bassin pour ramener les genoux vers la poitrine', 'Redescends lentement'],
  },
  {
    id: 'hollow-hold', name: 'Hollow body', pattern: 'core', muscles: ['abdos'],
    equipment: [], level: 2, avoidIf: ['lower_back'], timed: true,
    cues: ['Bas du dos collé au sol', 'Bras et jambes tendus décollés', 'Plie les genoux pour simplifier'],
  },
  {
    id: 'pallof-press', name: 'Pallof press (élastique)', pattern: 'core', muscles: ['abdos'],
    equipment: ['bands'], level: 1, avoidIf: [], unilateral: true,
    cues: ['Élastique accroché sur le côté', 'Pousse les mains devant toi sans tourner le buste', 'Résiste à la rotation'],
  },
  {
    id: 'leg-raise', name: 'Relevés de jambes allongée', pattern: 'core', muscles: ['abdos'],
    equipment: [], level: 2, avoidIf: ['lower_back'],
    cues: ['Mains sous les fesses', 'Bas du dos plaqué', 'Descends les jambes sans toucher le sol'],
  },
  {
    id: 'russian-twist', name: 'Russian twist', pattern: 'core', muscles: ['abdos'],
    equipment: [], level: 2, avoidIf: ['lower_back'],
    cues: ['Assise, buste incliné, dos droit', 'Tourne les épaules de chaque côté', 'Pieds au sol pour débuter'],
  },

  // ---------- BRAS ----------
  {
    id: 'db-curl', name: 'Curl biceps (haltères)', pattern: 'arms_bi', muscles: ['biceps'],
    equipment: ['dumbbells'], level: 1, avoidIf: [], loadable: true,
    cues: ['Coudes collés au corps', 'Monte sans balancer', 'Descends lentement'],
  },
  {
    id: 'hammer-curl', name: 'Curl marteau', pattern: 'arms_bi', muscles: ['biceps'],
    equipment: ['dumbbells'], level: 1, avoidIf: [], loadable: true,
    cues: ['Paumes face à face', 'Coudes fixes', 'Contrôle la descente'],
  },
  {
    id: 'band-curl', name: 'Curl biceps (élastique)', pattern: 'arms_bi', muscles: ['biceps'],
    equipment: ['bands'], level: 1, avoidIf: [],
    cues: ['Élastique sous les pieds', 'Coudes immobiles', 'Serre en haut'],
  },
  {
    id: 'cable-curl', name: 'Curl à la poulie', pattern: 'arms_bi', muscles: ['biceps'],
    equipment: ['gym'], level: 1, avoidIf: [], loadable: true,
    cues: ['Poulie basse', 'Coudes collés', 'Tension constante'],
  },
  {
    id: 'bench-dip', name: 'Dips sur chaise', pattern: 'arms_tri', muscles: ['triceps', 'epaules'],
    equipment: [], level: 1, avoidIf: ['shoulders', 'wrists'],
    cues: ['Mains au bord d\'une chaise stable', 'Descends jusqu\'à 90° aux coudes, pas plus', 'Genoux fléchis pour simplifier'],
  },
  {
    id: 'db-overhead-extension', name: 'Extension triceps au-dessus de la tête', pattern: 'arms_tri', muscles: ['triceps'],
    equipment: ['dumbbells'], level: 1, avoidIf: ['shoulders'], loadable: true,
    cues: ['Haltère tenue à deux mains derrière la tête', 'Coudes pointés vers le haut', 'Tends les bras'],
  },
  {
    id: 'db-kickback', name: 'Kickback triceps (haltère)', pattern: 'arms_tri', muscles: ['triceps'],
    equipment: ['dumbbells'], level: 1, avoidIf: [], loadable: true,
    cues: ['Buste penché, coude collé au corps', 'Tends le bras vers l\'arrière', 'Pause 1 s bras tendu'],
  },
  {
    id: 'band-pushdown', name: 'Extension triceps (élastique)', pattern: 'arms_tri', muscles: ['triceps'],
    equipment: ['bands'], level: 1, avoidIf: [],
    cues: ['Élastique accroché en hauteur', 'Coudes collés au corps', 'Pousse vers le bas jusqu\'à extension'],
  },
  {
    id: 'cable-pushdown', name: 'Extension triceps (poulie)', pattern: 'arms_tri', muscles: ['triceps'],
    equipment: ['gym'], level: 1, avoidIf: [], loadable: true,
    cues: ['Coudes fixes', 'Extension complète', 'Remonte lentement'],
  },

  // ---------- ÉPAULES (isolation) ----------
  {
    id: 'db-lateral-raise', name: 'Élévations latérales (haltères)', pattern: 'shoulders_iso', muscles: ['epaules'],
    equipment: ['dumbbells'], level: 1, avoidIf: [], loadable: true,
    cues: ['Coudes légèrement fléchis', 'Monte jusqu\'à hauteur d\'épaules', 'Charge légère, mouvement propre'],
  },
  {
    id: 'band-lateral-raise', name: 'Élévations latérales (élastique)', pattern: 'shoulders_iso', muscles: ['epaules'],
    equipment: ['bands'], level: 1, avoidIf: [],
    cues: ['Élastique sous les pieds', 'Monte les bras sur les côtés', 'Ne hausse pas les épaules'],
  },
  {
    id: 'band-pull-apart', name: 'Pull-apart (élastique)', pattern: 'shoulders_iso', muscles: ['epaules', 'dos'],
    equipment: ['bands'], level: 1, avoidIf: [],
    cues: ['Bras tendus devant toi', 'Écarte l\'élastique jusqu\'à la poitrine', 'Serre les omoplates'],
  },
  {
    id: 'face-pull', name: 'Face pull (poulie)', pattern: 'shoulders_iso', muscles: ['epaules', 'dos'],
    equipment: ['gym'], level: 1, avoidIf: [], loadable: true,
    cues: ['Corde à hauteur du visage', 'Tire vers le front en écartant les mains', 'Coudes hauts'],
  },

  // ---------- MOLLETS ----------
  {
    id: 'calf-raise', name: 'Extensions des mollets', pattern: 'calves', muscles: ['mollets'],
    equipment: [], level: 1, avoidIf: [], loadable: true,
    cues: ['Sur une marche pour plus d\'amplitude', 'Monte sur la pointe des pieds', 'Pause 1 s en haut'],
  },

  // ---------- CARDIO / CONDITIONING ----------
  {
    id: 'step-jacks', name: 'Jumping jacks sans saut', pattern: 'conditioning', muscles: ['cardio'],
    equipment: [], level: 1, avoidIf: [], timed: true,
    cues: ['Écarte une jambe sur le côté en montant les bras', 'Alterne les côtés rapidement', 'Faible impact pour les articulations'],
  },
  {
    id: 'march-high-knees', name: 'Montées de genoux marchées', pattern: 'conditioning', muscles: ['cardio'],
    equipment: [], level: 1, avoidIf: [], timed: true,
    cues: ['Monte les genoux à hauteur de hanches', 'Rythme soutenu sans sauter', 'Bras actifs'],
  },
  {
    id: 'shadow-boxing', name: 'Shadow boxing', pattern: 'conditioning', muscles: ['cardio', 'epaules'],
    equipment: [], level: 1, avoidIf: [], timed: true,
    cues: ['Garde haute, sautille ou reste en appui', 'Enchaîne directs et crochets', 'Expire à chaque coup'],
  },
  {
    id: 'jumping-jacks', name: 'Jumping jacks', pattern: 'conditioning', muscles: ['cardio'],
    equipment: [], level: 1, avoidIf: ['no_jumping', 'knees'], timed: true,
    cues: ['Réception souple sur l\'avant du pied', 'Bras au-dessus de la tête', 'Rythme régulier'],
  },
  {
    id: 'mountain-climber', name: 'Mountain climbers', pattern: 'conditioning', muscles: ['cardio', 'abdos'],
    equipment: [], level: 1, avoidIf: ['wrists'], timed: true,
    cues: ['Position de pompe, ramène les genoux alternativement', 'Hanches basses', 'Mains sur un banc pour simplifier'],
  },
  {
    id: 'squat-jump', name: 'Squats sautés', pattern: 'conditioning', muscles: ['cardio', 'quadriceps', 'fessiers'],
    equipment: [], level: 2, avoidIf: ['no_jumping', 'knees'], timed: true,
    cues: ['Descends en squat puis saute', 'Réception amortie, genoux dans l\'axe', 'Enchaîne sans te précipiter'],
  },
  {
    id: 'skater', name: 'Patineur', pattern: 'conditioning', muscles: ['cardio', 'fessiers'],
    equipment: [], level: 2, avoidIf: ['no_jumping', 'knees'], timed: true,
    cues: ['Bonds latéraux d\'une jambe sur l\'autre', 'Réception stable', 'Version sans saut : pas croisé'],
  },
  {
    id: 'burpee', name: 'Burpees', pattern: 'conditioning', muscles: ['cardio'],
    equipment: [], level: 2, avoidIf: ['no_jumping', 'knees', 'wrists'], timed: true,
    cues: ['Mains au sol, jambes en arrière, reviens, saute', 'Version facile : sans pompe ni saut', 'Garde un rythme que tu peux tenir'],
  },
  {
    id: 'kb-swing-cardio', name: 'Swings kettlebell (cardio)', pattern: 'conditioning', muscles: ['cardio', 'fessiers'],
    equipment: ['kettlebell'], level: 2, avoidIf: ['lower_back'], timed: true,
    cues: ['Puissance des hanches', 'Dos plat', 'Charge modérée, rythme régulier'],
  },
];

export const EXERCISE_BY_ID: Record<string, Exercise> = Object.fromEntries(EXERCISES.map((e) => [e.id, e]));

export function getExercise(id: string): Exercise | undefined {
  return EXERCISE_BY_ID[id];
}

export const PATTERN_LABELS: Record<Exercise['pattern'], string> = {
  squat: 'Squat',
  hinge: 'Charnière de hanche',
  lunge: 'Fentes',
  glute: 'Fessiers',
  push_h: 'Poussée horizontale',
  push_v: 'Poussée verticale',
  pull_h: 'Tirage horizontal',
  pull_v: 'Tirage vertical',
  core: 'Gainage / abdos',
  arms_bi: 'Biceps',
  arms_tri: 'Triceps',
  shoulders_iso: 'Épaules',
  calves: 'Mollets',
  conditioning: 'Cardio',
};

export const MUSCLE_LABELS: Record<string, string> = {
  quadriceps: 'Quadriceps',
  ischios: 'Ischio-jambiers',
  fessiers: 'Fessiers',
  mollets: 'Mollets',
  adducteurs: 'Adducteurs',
  dos: 'Dos',
  pectoraux: 'Pectoraux',
  epaules: 'Épaules',
  biceps: 'Biceps',
  triceps: 'Triceps',
  abdos: 'Abdos',
  lombaires: 'Lombaires',
  cardio: 'Cardio',
};
