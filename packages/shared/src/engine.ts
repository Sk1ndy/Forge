import { 
  MuscleId, Exercise, UserProfile, WeeklyBlueprint, 
  PlannedSetSchema, MuscleStatus, WeeklyMacro, WeeklyTrauma, SimulationResult, ExerciseLog 
} from './types';
import { 
  DEFAULT_EXERCISE_LIBRARY, DEFAULT_EXERCISE_TENSION_MATRICES, 
  MUSCLE_FATIGUE_DECAY, FITNESS_RETENTION_RATE, 
  PARENT_CHILD_WEIGHTS, MUSCLE_DETAILS 
} from './constants';
import { calculateSetImpact, normalize } from './biomechanics';

// Cache LRU simpliste pour éviter les recalculs coûteux (memoization)
const simulationCache = new Map<string, SimulationResult>();
const MAX_CACHE_SIZE = 50;

/**
 * Exécute la simulation chronologique complète (Modèle Fitness-Fatigue Banister)
 * Retourne le snapshot de l'avatar pour le jour sélectionné (ou Dimanche par défaut)
 */
export function runWeeklySimulation(
  blueprint: WeeklyBlueprint,
  profile: UserProfile,
  toggledDays: { [day: string]: boolean } = {},
  selectedDay?: string,
  exerciseLibrary: Exercise[] = DEFAULT_EXERCISE_LIBRARY,
  week2Blueprint?: WeeklyBlueprint,
  sessionLogs?: ExerciseLog[]
): SimulationResult {
  // ─── MÉCANISME DE CACHE (MEMOIZATION) ───
  // Génération d'une empreinte unique basée sur les paramètres d'entrée stricts
  const cacheKey = JSON.stringify({ blueprint, profile, toggledDays, selectedDay, week2Blueprint, sessionLogs });

  if (simulationCache.has(cacheKey)) {
    return simulationCache.get(cacheKey)!;
  }

  const DAYS_OF_WEEK = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

  // Récupération et modulation des facteurs biologiques individuels
  const userAge = profile.age ?? 28;
  const userSleep = profile.sleepHours ?? 8;
  const userCaloric = profile.caloricStatus ?? 'maintenance';
  const userStress = profile.stressLevel ?? 'moderate';

  let recoveryMultiplier = 1.0;
  if (userAge > 40) {
    recoveryMultiplier *= Math.max(0.70, 1 - (userAge - 40) * 0.01);
  }
  if (userSleep < 7.5) {
    recoveryMultiplier *= Math.max(0.60, 0.60 + (userSleep / 7.5) * 0.40);
  } else if (userSleep >= 9) {
    recoveryMultiplier *= 1.05;
  }
  if (userCaloric === 'deficit') recoveryMultiplier *= 0.80;
  else if (userCaloric === 'surplus') recoveryMultiplier *= 1.05;
  
  if (userStress === 'high') recoveryMultiplier *= 0.80;
  else if (userStress === 'low') recoveryMultiplier *= 1.05;

  // Initialisation des états musculaires à T0
  const musclesMap: {
    [muscleId: string]: {
      fatigue: number;
      inol: number;
      fitness: number;
      sets: number;
      jointStress: number;
      contributions: { [exId: string]: number };
      setsContributions: { [exId: string]: number };
      fatigueHistory: number[];
      uniqueSets: Set<string>;
    };
  } = {};

  Object.keys(MUSCLE_DETAILS).forEach(id => {
    musclesMap[id] = { fatigue: 0, inol: 0, fitness: 0, sets: 0, jointStress: 0, contributions: {}, setsContributions: {}, fatigueHistory: [], uniqueSets: new Set<string>() };
  });

  // Copie légère, ciblée et performante de l'état musculaire pour le snapshot
  const createLightSnapshot = (source: typeof musclesMap): typeof musclesMap => {
    const snapshot: typeof musclesMap = {};
    for (const key in source) {
      const s = source[key];
      snapshot[key] = {
        fatigue: s.fatigue,
        inol: s.inol,
        fitness: s.fitness,
        sets: s.sets,
        jointStress: s.jointStress,
        contributions: { ...s.contributions },
        setsContributions: { ...s.setsContributions },
        fatigueHistory: [...s.fatigueHistory],
        uniqueSets: new Set<string>(s.uniqueSets)
      };
    }
    return snapshot;
  };

  let sncFatigue = 0;

  // Clones légers initialisés
  let snapshotMuscles = createLightSnapshot(musclesMap);
  let snapshotSnc = 0;

  // Suivi de l'INOL intra-séance pour détecter le Junk Volume (Intensité + Volume)
  const dailyInol: { [muscleId: string]: number } = {};

  // ─── PEAK TRAUMA TRACKER ─────────────────────────────────────────────────
  // Captures the highest fatigue spike per muscle during week 2 (with the exact day)
  const peakFatigue: Record<string, { value: number; day: string }> = {};
  // Counts integer effective sets per muscle during week 2 (reset each week)
  const weeklyEffectiveSetsRaw: Record<string, number> = {};
  // Axial SNC load: INOL from tier_snc===1 poids_libre exercises (week 2 only)
  let axialSncLoad = 0;

  // Simulation séquentielle sur 2 semaines
  for (let week = 1; week <= 2; week++) {
    // Réinitialisation des volumes de travail au début de la semaine
    Object.keys(musclesMap).forEach(id => {
      musclesMap[id].sets = 0;
      musclesMap[id].setsContributions = {};
      musclesMap[id].uniqueSets.clear();
    });

    DAYS_OF_WEEK.forEach(day => {
      // A. Dissipation quotidienne de la fatigue et de l'adaptation
      Object.keys(musclesMap).forEach(id => {
        const baseDecay = MUSCLE_FATIGUE_DECAY[id as MuscleId] ?? 0.5;
        const adjustedDecay = Math.max(0.05, Math.min(0.98, baseDecay + (1 - recoveryMultiplier) * (1 - baseDecay)));

        musclesMap[id].fatigue = normalize(musclesMap[id].fatigue * adjustedDecay);
        musclesMap[id].fitness = normalize(musclesMap[id].fitness * FITNESS_RETENTION_RATE);
        musclesMap[id].jointStress = normalize((musclesMap[id].jointStress || 0) * 0.90);

        if (musclesMap[id].contributions) {
          Object.keys(musclesMap[id].contributions).forEach(exNom => {
            musclesMap[id].contributions[exNom] = normalize(musclesMap[id].contributions[exNom] * adjustedDecay);
          });
        }
      });

      // Dissipation réaliste du SNC
      sncFatigue = normalize(sncFatigue * 0.55);

      // B. Application des séances du jour
      if (toggledDays[day] !== false) {
        const currentBlueprint = (week === 2 && week2Blueprint) ? week2Blueprint : blueprint;
        const plannedExercises = currentBlueprint[day] || [];
        plannedExercises.forEach(plannedEx => {
          if (!plannedEx.active) return;

          const exercise = exerciseLibrary.find(e => e.id === plannedEx.exerciseId);
          if (!exercise) return;

          const tensionMatrix = exercise.tension_matrix || DEFAULT_EXERCISE_TENSION_MATRICES[plannedEx.exerciseId] || { [exercise.muscle_primaire]: 1.0 };

          plannedEx.sets.forEach((set, setIndex) => {
            // Validation stricte via Zod avant simulation
            const parsedSet = PlannedSetSchema.safeParse(set);
            if (!parsedSet.success || !parsedSet.data.active) return;
            
            let validSet = parsedSet.data;

            // ─── SURCHARGE AVEC LES LOGS RÉELS DU MOBILE (SI DISPONIBLES) ───
            if (sessionLogs && sessionLogs.length > 0) {
              const logMatch = sessionLogs.find(
                l => l.exercise_id === plannedEx.exerciseId && 
                     l.day === day && 
                     l.set_index === setIndex
              );

              if (logMatch) {
                if (logMatch.is_completed === false) {
                  // La série a été sautée sur le mobile (fatigue/blessure/etc), elle ne génère aucune fatigue
                  return;
                }
                // Remplacement des prévisions par la performance réelle
                validSet = {
                  ...validSet,
                  reps: logMatch.actual_reps ?? validSet.reps,
                  poids: logMatch.actual_weight ?? validSet.poids,
                  rpe: logMatch.actual_rpe ?? validSet.rpe
                };
              }
            }

            const { inol, sncPoints } = calculateSetImpact(validSet, exercise, profile, profile.isBeginner);

            const setIdBase = `${week}-${day}-${plannedEx.exerciseId}-${setIndex}`;

            // Accumuler la fatigue centrale
            sncFatigue = normalize(sncFatigue + sncPoints);

            // Axial SNC Load: tier_snc===1 free weight exercises only (week 2)
            if (week === 2 && exercise.tier_snc === 1 && exercise.equipment === 'poids_libre') {
              axialSncLoad = normalize(axialSncLoad + inol);
            }

            // Distribuer la fatigue, l'adaptation et le stress articulaire
            Object.entries(tensionMatrix).forEach(([muscleId, coeff]) => {
              if (musclesMap[muscleId]) {
                const muscleLoad = inol * coeff;
                
                // Ajout strictement additif de la fatigue (Idempotence mathématique)
                musclesMap[muscleId].fatigue = normalize(musclesMap[muscleId].fatigue + muscleLoad);
                musclesMap[muscleId].inol = normalize((musclesMap[muscleId].inol || 0) + muscleLoad);
                
                // Inverted-U adaptation curve (affecte uniquement la fitness)
                let adaptationMultiplier = 1.0;
                const currentFatigue = musclesMap[muscleId].fatigue;
                if (currentFatigue > 1.5) {
                  adaptationMultiplier = Math.max(0.0, 1.0 - (currentFatigue - 1.5) * 0.6);
                }
                musclesMap[muscleId].fitness = normalize(musclesMap[muscleId].fitness + muscleLoad * 0.5 * adaptationMultiplier);
                
                musclesMap[muscleId].sets = normalize(musclesMap[muscleId].sets + validSet.series * coeff);
                musclesMap[muscleId].contributions[exercise.nom] = normalize((musclesMap[muscleId].contributions[exercise.nom] || 0) + muscleLoad);
                musclesMap[muscleId].setsContributions[exercise.nom] = normalize((musclesMap[muscleId].setsContributions[exercise.nom] || 0) + validSet.series * coeff);

                // Contrainte mécanique articulaire cumulative
                let jointStressIncrement = inol * coeff * 0.5;
                if (validSet.reps <= 5 && validSet.rpe >= 9) {
                  jointStressIncrement += inol * coeff * 1.5;
                }
                musclesMap[muscleId].jointStress = normalize((musclesMap[muscleId].jointStress || 0) + jointStressIncrement);
                
                // Weekly Effective Sets accumulator (week 2 only)
                if (week === 2) {
                  weeklyEffectiveSetsRaw[muscleId] = (weeklyEffectiveSetsRaw[muscleId] || 0) + validSet.series;
                }

                // Suivi de l'INOL intra-séance pour le jour cible
                if (week === 2 && selectedDay && day.toLowerCase() === selectedDay.toLowerCase()) {
                  dailyInol[muscleId] = normalize((dailyInol[muscleId] || 0) + muscleLoad);
                }
                
                // Track unique sets to completely prevent double counting in aggregation
                for (let i = 0; i < validSet.series; i++) {
                  musclesMap[muscleId].uniqueSets.add(`${setIdBase}-${i}`);
                }
              }
            });
          });
        });
      }

      // Fin de la journée : enregistrement de l'historique sur la semaine 2
      if (week === 2) {
        Object.keys(musclesMap).forEach(id => {
          const f = musclesMap[id].fatigue;
          musclesMap[id].fatigueHistory.push(f);

          // Peak Trauma: record if today's fatigue is the highest seen for this muscle
          if (!peakFatigue[id] || f > peakFatigue[id].value) {
            peakFatigue[id] = { value: parseFloat(f.toFixed(4)), day };
          }
        });
      }

      // C. Capture légère du snapshot uniquement lors de la semaine 2 stabilisée
      if (week === 2) {
        if (selectedDay && day.toLowerCase() === selectedDay.toLowerCase()) {
          snapshotMuscles = createLightSnapshot(musclesMap);
          snapshotSnc = sncFatigue;
        } else if (!selectedDay && day === 'Dimanche') {
          snapshotMuscles = createLightSnapshot(musclesMap);
          snapshotSnc = sncFatigue;
        }
      }
    });
  }

  const targetMuscles = selectedDay ? snapshotMuscles : musclesMap;
  const targetSnc = selectedDay ? snapshotSnc : sncFatigue;

  // ─── AGGREGATION DES SOUS-MUSCLES PHYSIOLOGIQUES AVEC SOMMATION PONDÉRÉE ───
  // La fatigue totale du parent est la somme des fatigues des enfants (pondérée par les coefficients PARENT_CHILD_WEIGHTS) + sa propre fatigue.
  const aggregateMuscle = (parentKey: MuscleId, childKeys: MuscleId[]) => {
    const parent = targetMuscles[parentKey] || { fatigue: 0, inol: 0, fitness: 0, sets: 0, jointStress: 0, contributions: {}, setsContributions: {}, fatigueHistory: [], uniqueSets: new Set<string>() };
    
    const weights = PARENT_CHILD_WEIGHTS[parentKey] || {};
    
    let totalFatigue = parent.fatigue;
    let totalInol = parent.inol || 0;
    let totalJointStress = parent.jointStress;
    let totalDailyInol = dailyInol[parentKey] || 0;
    
    let totalFatigueHistory = parent.fatigueHistory ? [...parent.fatigueHistory] : Array(7).fill(0);
    
    const combinedContributions = { ...parent.contributions };
    const combinedSetsContributions = { ...parent.setsContributions };
    const combinedUniqueSets = new Set<string>(parent.uniqueSets);

    childKeys.forEach(childKey => {
      const child = targetMuscles[childKey];
      if (child) {
        const coeff = weights[childKey] ?? 1.0;
        
        totalFatigue = normalize(totalFatigue + child.fatigue * coeff);
        totalInol = normalize(totalInol + (child.inol || 0) * coeff);
        // CORRECTION DE L'AGRÉGATION (CRITIQUE): Sommation cumulative pondérée au lieu de Math.max
        totalJointStress = normalize(totalJointStress + child.jointStress * coeff);
        totalDailyInol = normalize(totalDailyInol + (dailyInol[childKey] || 0) * coeff);

        if (child.fatigueHistory) {
          totalFatigueHistory = totalFatigueHistory.map((val, idx) => 
            normalize(val + (child.fatigueHistory[idx] || 0) * coeff)
          );
        }

        Object.entries(child.contributions || {}).forEach(([exNom, val]) => {
          combinedContributions[exNom] = normalize((combinedContributions[exNom] || 0) + val * coeff);
        });
        
        // Accumulate all set IDs to avoid counting the same physical set twice
        if (child.uniqueSets) {
          child.uniqueSets.forEach(setId => combinedUniqueSets.add(setId));
        }
      }
    });

    dailyInol[parentKey] = totalDailyInol;

    targetMuscles[parentKey] = {
      fatigue: totalFatigue,
      inol: totalInol,
      fitness: normalize(totalFatigue * 0.5),
      sets: combinedUniqueSets.size, // Exact count of unique series performed
      jointStress: totalJointStress,
      contributions: combinedContributions,
      setsContributions: combinedSetsContributions,
      fatigueHistory: totalFatigueHistory,
      uniqueSets: combinedUniqueSets
    };
  };

  // Consolider les contributions vers les groupes parents
  aggregateMuscle('chest', ['upperChest', 'lowerChest', 'serratus']);
  aggregateMuscle('quadriceps', ['innerQuad', 'outerQuad']);
  aggregateMuscle('abs', ['upperAbs', 'lowerAbs']);
  aggregateMuscle('trapezius', ['upperTrapezius', 'lowerTrapezius']);
  aggregateMuscle('upperBack', ['rhomboids', 'rotatorCuff']);
  aggregateMuscle('frontDeltoid', ['deltoids']);
  aggregateMuscle('rearDeltoid', ['deltoids']);

  // Système Nerveux Central (SNC)
  const maxSnc = profile.maxSnc || 15.0;
  const cnsFailure = targetSnc > maxSnc;

  // Statuts musculaires finaux
  const finalMuscles: { [muscleId in MuscleId]?: MuscleStatus } = {};

  Object.entries(targetMuscles).forEach(([id, data]) => {
    const mId = id as MuscleId;
    const fatigueScore = data.fatigue;
    const trueInol = data.inol || 0;

    // COLORIMÉTRIE "SAFE-FIRST" : La couleur de MuscleStatus dépend UNIQUEMENT de data.fatigue
    let color: 'grey' | 'green' | 'orange' | 'red' = 'grey';
    let statusLabel = 'Volume Insuffisant (Repos / Maintien)';

    if (fatigueScore < 0.5) {
      color = 'grey';
      statusLabel = 'Volume Insuffisant (Repos / Maintien)';
    } else if (fatigueScore >= 0.5 && fatigueScore <= 1.5) {
      color = 'green';
      statusLabel = 'Stimulus Optimal (Zone d\'Adaptation)';
    } else if (fatigueScore > 1.5 && fatigueScore <= 2.5) {
      color = 'orange';
      statusLabel = 'Surcharge Fonctionnelle (Attention)';
    } else {
      color = 'red';
      statusLabel = 'Risque Lésionnel (MRV Dépassé)';
    }

    const totalInolAccumulated = Object.values(data.contributions).reduce((sum, val) => sum + val, 0);
    const contributors = Object.entries(data.contributions)
      .map(([nom, val]) => ({
        nom,
        value: val,
        percentage: totalInolAccumulated > 0 ? Math.round((val / totalInolAccumulated) * 100) : 0
      }))
      .filter(c => c.percentage > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 3);

    // Normaliser les pourcentages (doit sommer à 100)
    const currentSum = contributors.reduce((sum, c) => sum + c.percentage, 0);
    if (currentSum > 0 && currentSum !== 100 && contributors.length > 0) {
      contributors[0].percentage += (100 - currentSum);
    }

    finalMuscles[mId] = {
      name: MUSCLE_DETAILS[mId],
      inol: parseFloat(trueInol.toFixed(2)), // INOL is decoupled from fatigue
      sets: data.sets, // No rounding, retain decimal values
      color,
      statusLabel,
      contributors,
      remainingCapacity: parseFloat(Math.max(0, 1 - (fatigueScore / 2.5)).toFixed(4)),
      jointStress: parseFloat((data.jointStress || 0).toFixed(2)),
      readiness: parseFloat((data.fitness - fatigueScore).toFixed(2)), // Readiness conservée et calculée proprement pour l'affichage
      fatigueHistory: data.fatigueHistory.map(v => parseFloat(v.toFixed(2)))
    };
  });

  // REFACTORING DU "JUNK VOLUME"
  // On détecte le volume poubelle en fonction de l'INOL généré dans la séance (Intensité + Volume).
  // Un INOL > 1.5 sur un même jour pour un muscle représente une surcharge inutile.
  const junkVolumeAlerts: string[] = [];
  const reportedParents = new Set<string>();

  // Trier par INOL décroissant pour alerter en priorité sur les gros muscles
  Object.entries(dailyInol)
    .sort((a, b) => b[1] - a[1])
    .forEach(([id, inolScore]) => {
      const isSubMuscle = !['chest', 'quadriceps', 'abs', 'trapezius', 'upperBack', 'frontDeltoid', 'rearDeltoid', 'biceps', 'triceps', 'lowerBack', 'gluteal', 'hamstring', 'calves', 'forearm'].includes(id);
      
      if (inolScore > 1.5 && finalMuscles[id as MuscleId] && !isSubMuscle) {
        junkVolumeAlerts.push(`${MUSCLE_DETAILS[id as MuscleId]} (INOL: ${inolScore.toFixed(1)})`);
        reportedParents.add(id);
      }
  });

  const sncPercentage = Math.min(100, Math.round((targetSnc / maxSnc) * 100));

  // Calcul de la capacité de récupération globale (globalWorkCapacity)
  const fiveBigMuscles: MuscleId[] = ['quadriceps', 'chest', 'upperBack', 'lowerBack', 'gluteal'];
  let totalMuscleFatiguePct = 0;
  fiveBigMuscles.forEach(id => {
    const muscle = targetMuscles[id];
    const fatigue = muscle ? muscle.fatigue : 0;
    // Fatigue max acceptable avant danger absolu est de 2.5
    const pct = Math.min(100, Math.max(0, (fatigue / 2.5) * 100));
    totalMuscleFatiguePct += pct;
  });
  const avgMuscleFatiguePct = totalMuscleFatiguePct / 5;
  const globalFatigueScore = (sncPercentage + avgMuscleFatiguePct) / 2;
  const globalWorkCapacity = Math.max(0, parseFloat((100 - globalFatigueScore).toFixed(1)));

  const MAJOR_GROUPS: MuscleId[] = [
    'chest', 'upperChest', 'lowerChest',
    'upperBack', 'lowerBack', 'rhomboids', 'trapezius', 'upperTrapezius', 'lowerTrapezius',
    'deltoids', 'frontDeltoid', 'rearDeltoid',
    'biceps', 'triceps', 'quadriceps', 'innerQuad', 'outerQuad',
    'hamstring', 'gluteal'
  ];

  const getCleanGroupName = (id: MuscleId): string => {
    switch (id) {
      case 'chest':
      case 'upperChest':
      case 'lowerChest':
        return 'Pectoraux';
      case 'upperBack':
      case 'lowerBack':
      case 'rhomboids':
      case 'trapezius':
      case 'upperTrapezius':
      case 'lowerTrapezius':
        return 'Dos';
      case 'deltoids':
      case 'frontDeltoid':
      case 'rearDeltoid':
        return 'Épaules';
      case 'biceps':
        return 'Biceps';
      case 'triceps':
        return 'Triceps';
      case 'quadriceps':
      case 'innerQuad':
      case 'outerQuad':
        return 'Quadriceps';
      case 'hamstring':
      case 'gluteal':
        return 'Ischios/Fessiers';
      default:
        return MUSCLE_DETAILS[id] || id;
    }
  };

  const rawSurcharged = Object.entries(finalMuscles)
    .filter((entry): entry is [string, MuscleStatus] => {
      const [id, m] = entry;
      return m !== undefined && MAJOR_GROUPS.includes(id as MuscleId) && (m.color === 'red' || m.color === 'orange');
    })
    .map(([id, m]) => ({
      ...m,
      name: getCleanGroupName(id as MuscleId)
    }))
    .sort((a, b) => b.inol - a.inol);

  const uniqueSurcharged: MuscleStatus[] = [];
  const seenSurcharged = new Set<string>();
  for (const item of rawSurcharged) {
    if (!seenSurcharged.has(item.name)) {
      seenSurcharged.add(item.name);
      uniqueSurcharged.push(item);
    }
  }
  const topSurcharged = uniqueSurcharged.slice(0, 3);

  const rawNeglected = Object.entries(finalMuscles)
    .filter((entry): entry is [string, MuscleStatus] => {
      const [id, m] = entry;
      return m !== undefined && MAJOR_GROUPS.includes(id as MuscleId) && m.color === 'grey';
    })
    .map(([id, m]) => ({
      ...m,
      name: getCleanGroupName(id as MuscleId)
    }))
    .sort((a, b) => a.inol - b.inol);

  const uniqueNeglected: MuscleStatus[] = [];
  const seenNeglected = new Set<string>();
  for (const item of rawNeglected) {
    if (!seenNeglected.has(item.name)) {
      seenNeglected.add(item.name);
      uniqueNeglected.push(item);
    }
  }
  const topNeglected = uniqueNeglected.slice(0, 3);



  let totalSets = 0;
  let pushSets = 0;
  let pullSets = 0;
  let legsSets = 0;

  Object.entries(blueprint).forEach(([day, dayExercises]) => {
    if (toggledDays[day] === false) return;
    
    dayExercises.forEach(plannedEx => {
      if (!plannedEx.active) return;
      
      const exDef = exerciseLibrary.find(e => e.id === plannedEx.exerciseId);
      if (!exDef) return;
      
      const cat = exDef.ppl_category;
      
      plannedEx.sets.forEach(set => {
        if (!set.active) return;
        
        const seriesCount = set.series;
        
        if (cat === 'push') { pushSets += seriesCount; totalSets += seriesCount; }
        else if (cat === 'pull') { pullSets += seriesCount; totalSets += seriesCount; }
        else if (cat === 'legs') { legsSets += seriesCount; totalSets += seriesCount; }
      });
    });
  });

  const pushPct = totalSets > 0 ? (pushSets / totalSets) * 100 : 0;
  const pullPct = totalSets > 0 ? (pullSets / totalSets) * 100 : 0;
  const legsPct = totalSets > 0 ? (legsSets / totalSets) * 100 : 0;

  // ─── WEEKLY MACRO COMPUTATION ──────────────────────────────────────────────
  // 7 grand groups only for textual feedback (mirrors the filtering in topSurcharged/topNeglected)
  const GRAND_GROUPS: Record<string, string> = {
    chest: 'Pectoraux',
    upperBack: 'Dos',
    frontDeltoid: 'Épaules',
    biceps: 'Biceps',
    triceps: 'Triceps',
    quadriceps: 'Quadriceps',
    hamstring: 'Ischios/Fessiers',
  };

  // Filter peakFatigue to grand groups only using fatigueHistory
  const filteredPeakFatigue: Record<string, { value: number; day: string }> = {};
  Object.keys(GRAND_GROUPS).forEach(id => {
    const history = finalMuscles[id as MuscleId]?.fatigueHistory;
    if (history && history.length > 0) {
      const maxVal = Math.max(...history);
      const dayIndex = history.indexOf(maxVal);
      filteredPeakFatigue[id] = { value: parseFloat(maxVal.toFixed(4)), day: DAYS_OF_WEEK[dayIndex] };
    }
  });

  // Build weeklyEffectiveSets for grand groups (integer, not coeff-weighted)
  const weeklyEffectiveSets: Record<string, number> = {};
  Object.keys(GRAND_GROUPS).forEach(id => {
    weeklyEffectiveSets[id] = Math.round(weeklyEffectiveSetsRaw[id] ?? 0);
  });

  // Trauma Alerts: muscles where peak fatigue exceeded 2.5 (danger zone)
  const TRAUMA_THRESHOLD = 2.5;
  const traumaAlerts: string[] = [];
  Object.entries(filteredPeakFatigue).forEach(([id, { value, day: peakDay }]) => {
    if (value > TRAUMA_THRESHOLD) {
      const muscleName = GRAND_GROUPS[id] ?? id;
      traumaAlerts.push(`${muscleName} — pic critique ${peakDay} (fatigue ${value.toFixed(2)})`);
    }
  });

  // Push/Pull ratio (binary, ignoring legs — for postural balance insight)
  const pushPullTotal = pushSets + pullSets;
  const pushPullRatio = {
    push: pushPullTotal > 0 ? Math.round((pushSets / pushPullTotal) * 100) : 50,
    pull: pushPullTotal > 0 ? Math.round((pullSets / pushPullTotal) * 100) : 50,
  };

  // Normalize axial SNC load to a 0-100 percentage relative to maxSnc
  const maxSncForAxial = profile.maxSnc || 15.0;
  const axialSncPct = Math.min(100, Math.round((axialSncLoad / maxSncForAxial) * 100));


  const weeklyMacro: WeeklyMacro = {
    peakFatigue: filteredPeakFatigue,
    weeklyEffectiveSets,
    pushPullRatio,
    axialSncLoad: axialSncPct,
    traumaAlerts,
  };

  // ─── WEEKLY TRAUMA DETECTION ─────────────────────────────────────────────────────
  // Scan fatigueHistory of each major-group muscle in finalMuscles.
  // If any single day exceeded the trauma threshold (2.5), emit an alert.
  // This is independent of the end-of-week state (dissipation does NOT hide past spikes).
  const TRAUMA_INOL_THRESHOLD = 2.5;
  const seenTraumaNames = new Set<string>();
  const weeklyTraumas: WeeklyTrauma[] = [];

  MAJOR_GROUPS.forEach(id => {
    const muscle = finalMuscles[id as MuscleId];
    if (!muscle || !muscle.fatigueHistory || muscle.fatigueHistory.length === 0) return;

    const peakInol = Math.max(...muscle.fatigueHistory);
    if (peakInol <= TRAUMA_INOL_THRESHOLD) return;

    const cleanName = getCleanGroupName(id as MuscleId);
    if (seenTraumaNames.has(cleanName)) return; // De-duplicate by grand group
    seenTraumaNames.add(cleanName);

    const dayIndex = muscle.fatigueHistory.indexOf(
      muscle.fatigueHistory.reduce((max, v) => (v > max ? v : max), 0)
    );

    weeklyTraumas.push({
      muscleName: cleanName,
      peakInol: parseFloat(peakInol.toFixed(2)),
      dayIndex,
    });
  });

  // Sort by severity descending
  weeklyTraumas.sort((a, b) => b.peakInol - a.peakInol);

  const result: SimulationResult = {
    muscles: finalMuscles,
    sncScore: parseFloat(targetSnc.toFixed(2)),
    sncPercentage,
    cnsFailure,
    junkVolumeAlerts,
    globalWorkCapacity,
    topSurcharged,
    topNeglected,
    pushPullLegsRatio: {
      push: pushPct,
      pull: pullPct,
      legs: legsPct > 0 ? legsPct : 0
    },
    weeklyMacro,
    weeklyTraumas,
  };

  // Sauvegarde dans le cache
  if (simulationCache.size >= MAX_CACHE_SIZE) {
    const firstKey = simulationCache.keys().next().value;
    if (firstKey) simulationCache.delete(firstKey);
  }
  simulationCache.set(cacheKey, result);

  return result;
}
