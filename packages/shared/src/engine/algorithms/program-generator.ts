import { z } from 'zod';
import { WeeklyBlueprint, UserProfile, Exercise, PlannedSet } from '../../types';
import { DEFAULT_EXERCISE_LIBRARY } from '../../constants';
import { runMesocycleSimulation } from '../index';
import { OnboardingPayloadSchema } from '../../schemas';

// =====================================================================================
// SCHÉMAS D'ENTRÉE ET DE SORTIE DU PROGRAM GENERATOR (DRY FIX)
// =====================================================================================

// Héritage strict depuis le schéma officiel de l'Onboarding
export const ProgramGeneratorInputSchema = OnboardingPayloadSchema.extend({
  frequency: z.number().int().min(2).max(6)
});

export type ProgramGeneratorInput = z.infer<typeof ProgramGeneratorInputSchema>;

// =====================================================================================
// FONCTIONS UTILES ET LOGIQUE PHYSIOLOGIQUE
// =====================================================================================

function estimate1RM(weight: number, reps: number): number {
  if (reps === 1) return weight;
  return weight * (1 + reps / 30);
}

function getDefaultPRs(pdc: number, gender: 'male' | 'female', level: 'beginner' | 'intermediate' | 'advanced') {
  const coeff = gender === 'male' ? 1.0 : 0.7;
  const levelCoeff = level === 'beginner' ? 0.8 : level === 'intermediate' ? 1.2 : 1.6;

  return {
    squat: Math.round(pdc * 1.0 * coeff * levelCoeff),
    bench: Math.round(pdc * 0.8 * coeff * levelCoeff),
    deadlift: Math.round(pdc * 1.2 * coeff * levelCoeff),
    ohp: Math.round(pdc * 0.5 * coeff * levelCoeff)
  };
}

// Helper : Retourne l'ID approprié pour le tirage vertical selon le niveau/poids
function getVerticalPullId(pdc: number, level: string): string {
  // Un débutant ou quelqu'un de lourd ne devrait pas faire de tractions PDC directes
  if (level === 'beginner' || pdc > 85) return 'lat_pulldown';
  return 'pull_ups';
}

// =====================================================================================
// CONSTRUCTEUR DU BLUEPRINT
// =====================================================================================

export function generateTrainingProgram(input: ProgramGeneratorInput): WeeklyBlueprint {
  const validated = ProgramGeneratorInputSchema.parse(input);
  const { pdc, gender, experience_level, frequency } = validated;

  const basePRs = getDefaultPRs(pdc, gender, experience_level);
  const prs = {
    squat: validated.known_prs?.squat ?? basePRs.squat,
    bench: validated.known_prs?.bench ?? basePRs.bench,
    deadlift: validated.known_prs?.deadlift ?? basePRs.deadlift,
    ohp: validated.known_prs?.ohp ?? basePRs.ohp,
  };

  if (validated.recent_lifts) {
    validated.recent_lifts.forEach(lift => {
      const estimated = estimate1RM(lift.poids, lift.reps);
      if (lift.exo === 'squat' && estimated > prs.squat) prs.squat = estimated;
      if (lift.exo === 'bench' && estimated > prs.bench) prs.bench = estimated;
      if (lift.exo === 'deadlift' && estimated > prs.deadlift) prs.deadlift = estimated;
      if (lift.exo === 'ohp' && estimated > prs.ohp) prs.ohp = estimated;
    });
  }

  const setVolume = experience_level === 'beginner' ? 3 : experience_level === 'intermediate' ? 4 : 5;
  const repsRange = experience_level === 'beginner' ? 10 : experience_level === 'intermediate' ? 8 : 6;
  const targetRPE = experience_level === 'beginner' ? 7.0 : experience_level === 'intermediate' ? 8.0 : 8.5;
  const intensityPct = experience_level === 'beginner' ? 0.65 : experience_level === 'intermediate' ? 0.72 : 0.78;

  let blueprint: WeeklyBlueprint = {
    mon: [], tue: [], wed: [], thu: [], fri: [], sat: [], sun: []
  };

  const verticalPullId = getVerticalPullId(pdc, experience_level);

  const calcWeight = (oneRepMax: number, isPdcEx: boolean, tier: number) => {
    if (isPdcEx) return 0;
    const tierMultiplier = tier === 1 ? 0.90 : tier === 3 ? 1.05 : 1.0;
    return Math.round(oneRepMax * intensityPct * tierMultiplier);
  };

  // Helper pour instancier un exercice
  const buildEx = (idCode: string, exId: string, prReference: number, isPdc: boolean, seriesAdjust: number, repsAdjust: number = 0) => {
    const totalSets = Math.max(1, setVolume + seriesAdjust);
    const exerciseDef = DEFAULT_EXERCISE_LIBRARY.find(e => e.id === exId) || DEFAULT_EXERCISE_LIBRARY[0];
    const tier = exerciseDef.tier_snc;
    
    // Le système nerveux crashe plus vite sur un Tier 1 lourd (ex: Deadlift), on diminue le RPE prescrit
    const adjustedRPE = tier === 1 ? targetRPE - 0.5 : targetRPE;

    return {
      id: idCode, exerciseId: exId, active: true,
      sets: Array(totalSets).fill(null).map((): PlannedSet => ({
        series: 1, reps: repsRange + repsAdjust, poids: calcWeight(prReference, isPdc, tier), rpe: adjustedRPE, active: true
      }))
    };
  };

  if (frequency === 2) {
    blueprint.mon = [
      buildEx('mon_ex1', 'squat', prs.squat, false, 0),
      buildEx('mon_ex2', 'bench_press', prs.bench, false, 0),
      buildEx('mon_ex3', verticalPullId, prs.bench * 0.7, verticalPullId === 'pull_ups', 0),
      buildEx('mon_ex4', 'plank', 0, true, -1, 0)
    ];
    blueprint.thu = [
      buildEx('thu_ex1', 'deadlift', prs.deadlift, false, -1),
      buildEx('thu_ex2', 'ohp', prs.ohp, false, 0),
      buildEx('thu_ex3', 'barbell_row', prs.bench * 0.7, false, 0),
      buildEx('thu_ex4', 'crunchs', 0, true, -1, 5)
    ];
  } 
  else if (frequency === 3) {
    blueprint.mon = [
      buildEx('mon_ex1', 'bench_press', prs.bench, false, 0),
      buildEx('mon_ex2', 'ohp', prs.ohp, false, -1),
      buildEx('mon_ex3', 'triceps_pushdown', prs.bench * 0.25, false, -1, 2)
    ];
    blueprint.wed = [
      buildEx('wed_ex1', verticalPullId, prs.bench * 0.7, verticalPullId === 'pull_ups', 0),
      buildEx('wed_ex2', 'barbell_row', prs.bench * 0.7, false, 0),
      buildEx('wed_ex3', 'biceps_curl', prs.bench * 0.2, false, -1, 2)
    ];
    blueprint.fri = [
      buildEx('fri_ex1', 'squat', prs.squat, false, 0),
      buildEx('fri_ex2', 'romanian_deadlift', prs.deadlift * 0.75, false, -1),
      buildEx('fri_ex3', 'crunchs', 0, true, -1, 5)
    ];
  } 
  else if (frequency === 4) {
    blueprint.mon = [
      buildEx('mon_ex1', 'bench_press', prs.bench, false, 0),
      buildEx('mon_ex2', 'lat_pulldown', prs.bench * 0.65, false, 0),
      buildEx('mon_ex3', 'lateral_raise', prs.bench * 0.12, false, -1, 4)
    ];
    blueprint.tue = [
      buildEx('tue_ex1', 'squat', prs.squat, false, 0),
      buildEx('tue_ex2', 'leg_curl', prs.squat * 0.35, false, -1, 2),
      buildEx('tue_ex3', 'plank', 0, true, -1, 0)
    ];
    blueprint.thu = [
      buildEx('thu_ex1', 'ohp', prs.ohp, false, 0),
      buildEx('thu_ex2', verticalPullId, prs.bench * 0.7, verticalPullId === 'pull_ups', 0),
      buildEx('thu_ex3', 'pec_deck', prs.bench * 0.45, false, -1, 2)
    ];
    blueprint.fri = [
      buildEx('fri_ex1', 'romanian_deadlift', prs.deadlift * 0.75, false, 0),
      buildEx('fri_ex2', 'leg_press', prs.squat * 0.8, false, -1, 2),
      buildEx('fri_ex3', 'calf_raise', prs.squat * 0.25, false, -1, 4)
    ];
  } 
  else {
    const activeDays = frequency === 5 ? ['mon', 'tue', 'wed', 'thu', 'fri'] : ['mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    activeDays.forEach((day, index) => {
      const mode = index % 3;
      if (mode === 0) {
        blueprint[day as keyof WeeklyBlueprint] = [
          buildEx(`${day}_ex1`, 'bench_press', prs.bench, false, -1),
          buildEx(`${day}_ex2`, 'lateral_raise', prs.bench * 0.12, false, -2, 4)
        ];
      } 
      else if (mode === 1) {
        blueprint[day as keyof WeeklyBlueprint] = [
          buildEx(`${day}_ex1`, 'lat_pulldown', prs.bench * 0.65, false, -1),
          buildEx(`${day}_ex2`, 'biceps_curl', prs.bench * 0.2, false, -2, 2)
        ];
      } 
      else {
        blueprint[day as keyof WeeklyBlueprint] = [
          buildEx(`${day}_ex1`, 'leg_press', prs.squat * 0.8, false, -1),
          buildEx(`${day}_ex2`, 'plank', 0, true, -1, 0)
        ];
      }
    });
  }

  // =====================================================================================
  // 5. BOUCLE DE RÉTROACTION CHIRURGICALE (AUTO-RÉGULATION CIBLÉE)
  // =====================================================================================
  
  const mockProfile: UserProfile = {
    pdc,
    prs,
    maxSnc: 15.0,
    age: 28,
    sleepHours: 8,
    caloricStatus: 'maintenance',
    stressLevel: 'moderate',
    isBeginner: experience_level === 'beginner'
  };

  let maxAttempts = 3;
  let simulatedResult = runMesocycleSimulation(blueprint, mockProfile, {}, undefined, undefined, 1, []);

  // Critères de surcharge plus réalistes pour 1 semaine de simulation
  const isOverloaded = () => simulatedResult.systemicReadiness < 40 || 
                             simulatedResult.cnsFailure || 
                             simulatedResult.globalAcwr > 1.3;

  while (maxAttempts > 0 && isOverloaded()) {
    Object.keys(blueprint).forEach(day => {
      blueprint[day as keyof WeeklyBlueprint].forEach(ex => {
        // Obtenir les infos de l'exercice pour savoir si c'est un composé majeur
        const exerciseDef = DEFAULT_EXERCISE_LIBRARY.find(e => e.id === ex.exerciseId);
        const isCompound = exerciseDef ? exerciseDef.tier_snc <= 2 : false;
        
        // On cible la réduction de fatigue sur les mouvements lourds principalement
        if (isCompound) {
          // Si on a plus d'une série, on supprime carrément une série pour préserver l'intensité (meilleur pour l'adaptation)
          if (ex.sets.length > 2) {
            ex.sets.pop(); 
          } else {
            // Sinon on réduit la charge de 5%
            ex.sets.forEach(set => {
              if (set.poids > 10) set.poids = Math.round(set.poids * 0.95);
            });
          }
        }
      });
    });

    simulatedResult = runMesocycleSimulation(blueprint, mockProfile, {}, undefined, undefined, 1, []);
    maxAttempts--;
  }

  return blueprint;
}
