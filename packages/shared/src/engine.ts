import { 
  MuscleId, Exercise, UserProfile, WeeklyBlueprint, 
  PlannedSetSchema, MuscleStatus, MuscleStatusToken, WeeklyMacro, WeeklyTrauma, SimulationResult, ExerciseLog 
} from './types';
import { 
  DEFAULT_EXERCISE_LIBRARY, DEFAULT_EXERCISE_TENSION_MATRICES, 
  MUSCLE_FATIGUE_DECAY, FITNESS_RETENTION_RATE, 
  PARENT_CHILD_WEIGHTS, MUSCLE_DETAILS 
} from './constants';
import { calculateSetImpact, normalize } from './biomechanics';

// ─── FAILLE 4 CORRIGÉE : Vrai algorithme LRU O(1) ──────────────────────────
// Remplace la Map + éviction FIFO aveugle par une structure LRU correcte.
// Chaque .get() déplace l'entrée en "tête" (la plus récemment utilisée).
// Chaque .set() au-delà de la capacité évince la "queue" (la moins récemment utilisée).
class LRUCache<K, V> {
  private capacity: number;
  private map: Map<K, V>;

  constructor(capacity: number) {
    this.capacity = capacity;
    this.map = new Map<K, V>();
  }

  has(key: K): boolean {
    return this.map.has(key);
  }

  get(key: K): V | undefined {
    if (!this.map.has(key)) return undefined;
    // Déplace en tête : supprimer + réinsérer (Map conserve l'ordre d'insertion)
    const value = this.map.get(key)!;
    this.map.delete(key);
    this.map.set(key, value);
    return value;
  }

  set(key: K, value: V): void {
    if (this.map.has(key)) {
      this.map.delete(key);
    } else if (this.map.size >= this.capacity) {
      // Évince le premier (le moins récemment utilisé)
      const lruKey = this.map.keys().next().value;
      if (lruKey !== undefined) this.map.delete(lruKey);
    }
    this.map.set(key, value);
  }

  get size(): number {
    return this.map.size;
  }
}

const simulationCache = new LRUCache<string, SimulationResult>(50);

// ─── FAILLE 3 CORRIGÉE : Génération de clé de cache légère ─────────────────
// Remplace JSON.stringify(tout) par une clé composite O(1).
// Invalide le cache si : blueprint change, profil change, séance ajoutée
// (length ou timestamp du dernier log change), ou jour sélectionné change.
function generateCacheKey(
  blueprint: WeeklyBlueprint,
  profile: UserProfile,
  toggledDays: { [day: string]: boolean },
  selectedDay: string | undefined,
  week2Blueprint: WeeklyBlueprint | undefined,
  sessionLogs: ExerciseLog[] | undefined,
  blueprintId: string | undefined,
): string {
  const blueprintFingerprint = blueprintId ?? JSON.stringify(blueprint);
  const week2Fingerprint = week2Blueprint ? (JSON.stringify(week2Blueprint)) : 'none';
  const logsFingerprint = sessionLogs && sessionLogs.length > 0
    ? `${sessionLogs.length}:${sessionLogs[sessionLogs.length - 1]?.created_at ?? ''}`
    : '0';

  return [
    blueprintFingerprint,
    week2Fingerprint,
    selectedDay ?? 'ALL',
    profile.pdc,
    profile.maxSnc,
    profile.age ?? 28,
    profile.sleepHours ?? 8,
    profile.caloricStatus ?? 'maintenance',
    profile.stressLevel ?? 'moderate',
    profile.isBeginner ? '1' : '0',
    JSON.stringify(toggledDays),
    logsFingerprint,
  ].join('|');
}

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
  sessionLogs?: ExerciseLog[],
  blueprintId?: string
): SimulationResult {
  // ─── MÉCANISME DE CACHE (LRU) ───
  const cacheKey = generateCacheKey(
    blueprint, profile, toggledDays, selectedDay,
    week2Blueprint, sessionLogs, blueprintId
  );

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
  const peakFatigue: Record<string, { value: number; day: string }> = {};
  const weeklyEffectiveSetsRaw: Record<string, number> = {};
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

            // ─── FAILLE 1 CORRIGÉE : Injection des logs réels avec filtre de semaine ──────
            // AVANT (bugué) : l.day === day  →  un log "Lundi S1" écrasait les prévisions "Lundi S2"
            // APRÈS : le filtre inclut la semaine courante.
            //   - Si le log a un champ `week`, on exige l.week === week (correspondance stricte).
            //   - Si le log n'a PAS de champ `week` (anciens logs mobiles), on ne l'applique
            //     QU'en semaine 1 (comportement rétrocompatible et sûr).
            if (sessionLogs && sessionLogs.length > 0) {
              const logMatch = sessionLogs.find(
                l => l.exercise_id === plannedEx.exerciseId &&
                     l.day === day &&
                     l.set_index === setIndex &&
                     (l.week !== undefined ? l.week === week : week === 1)
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
      sets: combinedUniqueSets.size,
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

  // ─── FAILLE 2 CORRIGÉE : Statuts musculaires avec tokens machine agnostiques ─
  // AVANT : statusLabel = 'Stimulus Optimal (Zone d\'Adaptation)' — string FR couplée à l'UI
  // APRÈS : statusLabel = 'OPTIMAL' — token machine traduit côté UI via muscleLabels.ts
  const finalMuscles: { [muscleId in MuscleId]?: MuscleStatus } = {};

  Object.entries(targetMuscles).forEach(([id, data]) => {
    const mId = id as MuscleId;
    const fatigueScore = data.fatigue;
    const trueInol = data.inol || 0;

    // Colorimétrie + token : dépend UNIQUEMENT de data.fatigue (logique pure)
    let color: 'grey' | 'green' | 'orange' | 'red';
    let statusLabel: MuscleStatusToken;

    if (fatigueScore < 0.5) {
      color = 'grey';
      statusLabel = 'REST';
    } else if (fatigueScore <= 1.5) {
      color = 'green';
      statusLabel = 'OPTIMAL';
    } else if (fatigueScore <= 2.5) {
      color = 'orange';
      statusLabel = 'OVERLOAD';
    } else {
      color = 'red';
      statusLabel = 'DANGER';
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
      inol: parseFloat(trueInol.toFixed(2)),
      sets: data.sets,
      color,
      statusLabel,
      contributors,
      remainingCapacity: parseFloat(Math.max(0, 1 - (fatigueScore / 2.5)).toFixed(4)),
      jointStress: parseFloat((data.jointStress || 0).toFixed(2)),
      readiness: parseFloat((data.fitness - fatigueScore).toFixed(2)),
      fatigueHistory: data.fatigueHistory.map(v => parseFloat(v.toFixed(2)))
    };
  });

  // Détection du Junk Volume (INOL intra-séance > 1.5)
  const junkVolumeAlerts: string[] = [];
  const reportedParents = new Set<string>();

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

  // ─── FAILLE 2 CORRIGÉE : topSurcharged / topNeglected retournent l'ID brut ─
  // AVANT : getCleanGroupName() traduisait en français dans le moteur mathématique
  // APRÈS : on retourne l'ID (`muscleId` = ex: 'chest') et le nom anatomique technique
  //         via MUSCLE_DETAILS. La traduction UI est dans apps/web/src/lib/muscleLabels.ts
  const rawSurcharged = Object.entries(finalMuscles)
    .filter((entry): entry is [string, MuscleStatus] => {
      const [id, m] = entry;
      return m !== undefined && MAJOR_GROUPS.includes(id as MuscleId) && (m.color === 'red' || m.color === 'orange');
    })
    .map(([, m]) => ({ ...m }))
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
    .map(([, m]) => ({ ...m }))
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
  // FAILLE 2 CORRIGÉE : GRAND_GROUPS utilise maintenant les IDs bruts comme clés.
  // Les noms traduits (valeurs) sont toujours présents pour weeklyMacro.traumaAlerts
  // (ce champ reste en texte FR car il est consommé tel quel dans l'UI actuelle —
  //  la migration complète vers des tokens pour traumaAlerts est hors scope de ce refactoring).
  const GRAND_GROUP_IDS: MuscleId[] = ['chest', 'upperBack', 'frontDeltoid', 'biceps', 'triceps', 'quadriceps', 'hamstring'];

  // Filter peakFatigue to grand groups only using fatigueHistory
  const filteredPeakFatigue: Record<string, { value: number; day: string }> = {};
  GRAND_GROUP_IDS.forEach(id => {
    const history = finalMuscles[id]?.fatigueHistory;
    if (history && history.length > 0) {
      const maxVal = Math.max(...history);
      const dayIndex = history.indexOf(maxVal);
      filteredPeakFatigue[id] = { value: parseFloat(maxVal.toFixed(4)), day: DAYS_OF_WEEK[dayIndex] };
    }
  });

  // Build weeklyEffectiveSets for grand groups (integer, not coeff-weighted)
  const weeklyEffectiveSets: Record<string, number> = {};
  GRAND_GROUP_IDS.forEach(id => {
    weeklyEffectiveSets[id] = Math.round(weeklyEffectiveSetsRaw[id] ?? 0);
  });

  // Trauma Alerts (texte FR conservé pour rétrocompatibilité avec l'UI actuelle)
  const TRAUMA_THRESHOLD = 2.5;
  const traumaAlerts: string[] = [];
  Object.entries(filteredPeakFatigue).forEach(([id, { value, day: peakDay }]) => {
    if (value > TRAUMA_THRESHOLD) {
      const muscleName = MUSCLE_DETAILS[id as MuscleId] ?? id;
      traumaAlerts.push(`${muscleName} — pic critique ${peakDay} (fatigue ${value.toFixed(2)})`);
    }
  });

  // Push/Pull ratio
  const pushPullTotal = pushSets + pullSets;
  const pushPullRatio = {
    push: pushPullTotal > 0 ? Math.round((pushSets / pushPullTotal) * 100) : 50,
    pull: pushPullTotal > 0 ? Math.round((pullSets / pushPullTotal) * 100) : 50,
  };

  // Normalize axial SNC load to a 0-100 percentage
  const maxSncForAxial = profile.maxSnc || 15.0;
  const axialSncPct = Math.min(100, Math.round((axialSncLoad / maxSncForAxial) * 100));

  const weeklyMacro: WeeklyMacro = {
    peakFatigue: filteredPeakFatigue,
    weeklyEffectiveSets,
    pushPullRatio,
    axialSncLoad: axialSncPct,
    traumaAlerts,
  };

  // ─── WEEKLY TRAUMA DETECTION ─────────────────────────────────────────────
  // FAILLE 2 CORRIGÉE : weeklyTraumas retourne muscleId (ID brut) au lieu de muscleName (string FR)
  // Rétrocompatibilité : le champ s'appelait `muscleName` dans l'ancien type, maintenant `muscleId`.
  const TRAUMA_INOL_THRESHOLD = 2.5;
  const seenTraumaIds = new Set<string>();
  const weeklyTraumas: WeeklyTrauma[] = [];

  MAJOR_GROUPS.forEach(id => {
    const muscle = finalMuscles[id as MuscleId];
    if (!muscle || !muscle.fatigueHistory || muscle.fatigueHistory.length === 0) return;

    const peakInol = Math.max(...muscle.fatigueHistory);
    if (peakInol <= TRAUMA_INOL_THRESHOLD) return;

    // Déduplication par nom anatomique technique (MUSCLE_DETAILS)
    const technicalName = MUSCLE_DETAILS[id] || id;
    if (seenTraumaIds.has(technicalName)) return;
    seenTraumaIds.add(technicalName);

    const dayIndex = muscle.fatigueHistory.indexOf(
      muscle.fatigueHistory.reduce((max, v) => (v > max ? v : max), 0)
    );

    weeklyTraumas.push({
      muscleId: id,  // ID brut — traduit côté UI via muscleLabels.ts
      peakInol: parseFloat(peakInol.toFixed(2)),
      dayIndex,
    });
  });

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

  // Sauvegarde dans le cache LRU
  simulationCache.set(cacheKey, result);

  return result;
}
