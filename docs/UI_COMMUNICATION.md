# 🎛️ FORGE - DOCKER COMMUNICATION ENGINE ↔ UI (SPECIFICATION MAÎTRESSE v3.1)

Ce document est la spécification technique et visuelle ultime pour le développement de l'interface utilisateur (**Web Next.js** et **Mobile Expo**). En tant qu'agent UI/UX ou développeur Front-End, **vous n'avez pas besoin de lire ou d'analyser le code du moteur biomécanique**. Toutes les structures d'entrée, de sortie, les modèles physiologiques et les règles visuelles sont documentés ici de manière exhaustive.

---

## 🏛️ 1. ARCHITECTURE PROPRE & CONTRAT DE COUCHES

Le moteur biomécanique de Forge est conçu comme une **Boîte Noire pure**. Il ne fait aucun appel réseau, n'interagit pas avec la base de données et ne contient aucun texte traduit côté UI.
* **Le flux est strictement asymétrique :**
  - **Le Web Next.js (Le Cerveau)** exécute la simulation lourde prédictive pour calculer des bilans complets sur 4 à 6 semaines.
  - **Le Mobile Expo (Le Muscle)** affiche ces calculs pré-configurés, gère la saisie locale offline des séances réelles et synchronise les journaux vers Supabase.
* **Aucun composant UI** ne doit importer `supabase/client` ou exécuter des formules mathématiques de fatigue. Les composants UI consomment des hooks ou des services qui appellent le moteur et présentent les résultats sous forme de jetons (Tokens) visuels.

---

## 📥 2. CONTRAT DE DONNÉES EN ENTRÉE (INPUTS)

Pour exécuter une simulation, le moteur a besoin de quatre structures principales, fortement typées et validées par Zod.

### A. `UserProfile` (Le profil athlète)
Définit les capacités de base de l'utilisateur, ses records personnels (PRs) et ses facteurs biologiques individuels.
```typescript
interface UserProfile {
  pdc: number;                   // Poids de corps en kg (30 - 300)
  prs: {                         // Records Personnels sur les mouvements principaux (Optionnels)
    squat?: number;              // en kg (0 - 1500)
    bench?: number;              // en kg (0 - 1000)
    deadlift?: number;           // en kg (0 - 2000)
    ohp?: number;                // en kg (0 - 500)
  };
  maxSnc: number;                // Capacité de stress du Système Nerveux Central max (1 - 100, défaut: 15.0)
  isBeginner?: boolean;          // true = débutant (sensibilité accrue à la fatigue)
  age?: number;                  // Âge en années (14 - 100)
  sleepHours?: number;           // Heures de sommeil moyennes (0 - 24)
  dailyVFC?: number;             // Variabilité de la Fréquence Cardiaque (VFC/HRV en ms, optionnel)
  caloricStatus?: 'deficit' | 'maintenance' | 'surplus';
  stressLevel?: 'low' | 'moderate' | 'high';
  biometricConstants?: {         // Modificateurs de cinétique avancés (Optionnels)
    baseTauMetabolic?: number;   // Temps de dissipation métabolique (jours, défaut: 1.0)
    baseTauDamage?: number;      // Temps de réparation structurelle (jours, défaut: 3.0)
    baseTauChronicSnc?: number;  // Temps de résorption du burnout chronique (jours, défaut: 21.0)
    baseTauFitness?: number;     // Rétention des acquis / forme (jours, défaut: 45.0)
    k1?: number;                 // Coefficient de gains hypertrophiques (défaut: 1.0)
    k2?: number;                 // Coefficient d'impact de la fatigue locale (défaut: 2.0)
    cnsResilience?: number;      // Résilience nerveuse systémique (défaut: 1.0)
  };
}
```

### B. `WeeklyBlueprint` (Le programme planifié)
Représente la structure hebdomadaire d'entraînement. C'est un dictionnaire indexé par les clés de jours (`mon`-`sun`).
```typescript
type WeeklyBlueprint = Record<
  'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun',
  PlannedExercise[]
>;

interface PlannedExercise {
  id: string;                    // UUID ou identifiant unique d'instance dans la journée
  exerciseId: string;            // ID de l'exercice dans la bibliothèque de référence (ex: 'squat')
  sets: PlannedSet[];            // Tableau des séries prévues
  active: boolean;               // Permet de désactiver temporairement un exercice
}

interface PlannedSet {
  series: number;                // Nombre de séries à exécuter (1 - 50)
  reps: number;                  // Répétitions par série (1 - 100)
  poids: number;                 // Poids de charge en kg (0 - 1000)
  rpe: number;                   // Indice d'effort perçu RPE (1 - 10)
  active: boolean;               // Permet de désactiver une série spécifique
}
```

### C. `ExerciseLog[]` (Historique réel ou en cours - Mode Séance)
Lorsque l'athlète effectue sa séance, l'UI Mobile enregistre des journaux de performances réelles. Si fournis, le moteur remplace les valeurs planifiées du blueprint par les performances réelles pour calibrer précisément l'état de fatigue en temps réel.
```typescript
interface ExerciseLog {
  id?: string;
  session_id?: string;
  user_id?: string;
  exercise_id: string;           // ex: 'bench_press' (snake_case strict)
  day: 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';
  week?: number;                 // Semaine indexée (1 - 6, défaut: 1)
  set_index: number;             // Index de la série dans la séance (0 - 50)
  planned_weight?: number;
  planned_reps?: number;
  planned_rpe?: number;
  actual_weight?: number;        // Performance mesurée en kg
  actual_reps?: number;          // Répétitions complétées
  actual_rpe?: number;           // RPE déclaré par l'athlète
  is_completed?: boolean;        // false si la série a été sautée
  skipped_reason?: 'fatigue' | 'injury' | 'time' | 'form' | 'other' | null;
}
```

### D. `RawWearableData` (Intégration d'objets connectés)
Permet d'injecter des données physiologiques externes brutes (Whoop, Apple Health, Garmin) dans le calibrateur d'adaptation.
```typescript
interface RawWearableData {
  source: 'apple' | 'garmin' | 'whoop' | 'manual';
  timestamp?: string;            // ISO String
  hrv_ms?: number;               // Variabilité Cardiaque brute en ms
  resting_hr?: number;           // Rythme cardiaque au repos
  sleep_total_minutes?: number;
  sleep_deep_minutes?: number;
  sleep_rem_minutes?: number;
  readiness_score?: number;      // Score global d'énergie externe (0 - 100)
  stress_score?: number;         // Score de stress mental ou environnemental (0 - 100)
}
```

---

## 📤 3. CONTRAT DE DONNÉES EN SORTIE (OUTPUTS)

L'appel à `runMesocycleSimulation` retourne un objet `SimulationResult`. **L'UI doit simplement refléter et styliser les propriétés de cet objet.**

```typescript
interface SimulationResult {
  // 🟢 RÉSULTATS PHYSIOLOGIQUES LOCAUX (PAR MUSCLE)
  muscles: Record<MuscleId, MuscleStatus>;

  // 🔴 ÉTAT DU SYSTÈME NERVEUX CENTRAL (SNC)
  sncScore: number;              // Fatigue nerveuse absolue accumulée
  sncPercentage: number;         // Fatigue nerveuse relative en % (0 - 100%)
  cnsFailure: boolean;           // Indicateur de surmenage aigu / Crash système
  chronicSncStress: number;      // Indicateur d'épuisement nerveux à long terme (Risque Burnout)

  // 📈 CAPACITÉ ET DISPONIBILITÉ SYSTÉMIQUES
  globalWorkCapacity: number;    // Capacité de l'athlète à absorber du volume (0 - 100)
  systemicReadiness: number;     // Taux de Readiness global gamifié (0 - 100)
  topSurcharged: MuscleStatus[]; // Top 3 des muscles en surcharge critique (priorité de repos)
  topNeglected: MuscleStatus[];  // Top 3 des muscles délaissés (opportunités d'entraînement)
  pushPullLegsRatio: {           // Pourcentages d'équilibre de force (Push / Pull / Legs)
    push: number;
    pull: number;
    legs: number;
  };

  // 📊 SYNTHÈSE DE FIN DE CYCLE
  weeklyMacro: WeeklyMacro;
  weeklyTraumas: WeeklyTrauma[];
  progressiveOverload: Record<string, { weekOverWeekGrowthPct: number }>;

  // ⚠️ ALERTES BIOLOGIQUES ET RISQUES DE TRAUMATISME
  junkVolumeAlerts: Array<{ muscleId: string; inolScore: number; code: string }>;
  injuryPredictions: Array<{ muscleId: string; acwr: number; code: string }>;
  monotonyAlerts: Array<{ week: number; code: string }>;

  // 🧠 DONNÉES MACHINE LEARNING ET REPRISE D'ÉTAT
  tensors?: Record<string, number[]>; // Courbe de fatigue normalisée [0,1] pour chaque muscle
  stochasticBands?: {            // Intervalle de confiance Monte Carlo (si stochasticMode actif)
    systemicReadiness: {
      low: number;               // Readiness minimale dans le pire des scénarios
      high: number;              // Readiness maximale dans le meilleur des scénarios
    }
  };
  finalState?: any;              // État sérialisé pour reprise de simulation
}
```

### Structures enfants :

```typescript
interface MuscleStatus {
  name: string;                  // Nom technique interne du muscle
  inol: number;                  // Score de fatigue de Prilepin quotidien cumulé
  sets: number;                  // Nombre de séries hebdomadaires accumulées (pondéré par tension)
  color: 'grey' | 'green' | 'orange' | 'red'; // Drapeau de statut visuel pour le rendu direct
  statusLabel: 'REST' | 'OPTIMAL' | 'OVERLOAD' | 'DANGER'; // Jauge physiologique
  remainingCapacity: number;     // Volume tolérable restant (0.0 - 1.0)
  jointStress: number;           // Stress tendineux accumulé
  readiness: number;             // Forme locale (fitness - fatigue)
  fatigueHistory?: number[];     // Tableau des niveaux de fatigue jour après jour (utile pour graphiques)
  contributors: Array<{ nom: string; percentage: number }>; // Exercices responsables de l'impact
}

interface WeeklyMacro {
  peakFatigue: Record<string, { value: number; day: number }>; // Jour (0-6) et intensité du pic de fatigue
  weeklyEffectiveSets: Record<string, number>;                 // Séries effectives par grand groupe musculaire
  pushPullRatio: { push: number; pull: number };               // Ratio d'équilibre agoniste/antagoniste
  axialSncLoad: number;                                        // Fatigue de compression de la colonne vertébrale
  traumaAlerts: string[];                                      // Tableau de messages d'avertissements physiologiques
}

interface WeeklyTrauma {
  muscleId: string;              // Identifiant du muscle affecté
  peakInol: number;              // Intensité du pic de stress
  dayIndex: number;              // Jour de la semaine (0 = Lundi, 6 = Dimanche)
}
```

---

## 🎨 4. LES 9 UNIQUE SELLING POINTS (USPs) : INTÉGRATION UI/UX

Voici comment implémenter visuellement et de manière premium les 9 technologies de pointe de Forge dans votre interface web ou mobile.

### USP #1 : Simulation Mésocycle Prédictive (4 à 6 semaines)
* **Concept :** L'athlète voit sa fatigue et sa progression simulées avant même de soulever sa première charge.
* **Intégration UI :**
  - Affichez un graphique temporel (Line Chart de Recharts ou React Native Gifted Charts).
  - Axe X : Jours ou Semaines ($1$ à $6$).
  - Axe Y : `systemicReadiness` (0 à 100).
  - **Premium UI (Monte Carlo) :** Si `stochasticBands` est présent, dessinez une bande semi-transparente autour de la ligne principale (représentant la fourchette basse `low` et haute `high`). Cela montre visuellement la marge d'incertitude stochastique selon le stress de l'utilisateur.

### USP #2 : Fatigue bi-phasique (Métabolique vs Dommage structurel)
* **Concept :** Le muscle subit deux types de fatigue : une fatigue métabolique acide qui disparaît en moins de 24h, et des micro-déchirures structurelles qui demandent 72h+.
* **Intégration UI :**
  - Dans la vue détaillée d'un muscle, ne vous contentez pas de donner un chiffre.
  - Affichez un mini-graphique empilé de la fatigue accumulée.
  - Utilisez deux nuances : vert clair ou jaune transparent pour le *Métabolique* (court terme) et rouge/orange pour le *Dommage* (long terme).

### USP #3 : Quantification en temps réel du Junk Volume (Rendements Décroissants)
* **Concept :** Faire trop de séries n'apporte plus rien et détruit la capacité de récupération (loi des rendements décroissants).
* **Intégration UI :**
  - Si un muscle apparaît dans `junkVolumeAlerts` :
  - Affichez un badge d'avertissement jaune néon près de l'exercice fautif.
  - **Micro-interaction :** Au survol ou clic, affichez une explication : *"Alerte Junk Volume : Faire plus de séries sur ce muscle aujourd'hui n'engendrera plus aucune croissance, mais quadruplera votre temps de récupération."*

### USP #4 : ACWR Musculation (Injury Prediction)
* **Concept :** Le ratio de charge aiguë sur chronique (ACWR) détecte si vous augmentez le volume trop brusquement, provoquant des blessures tendineuses.
* **Intégration UI :**
  - Parcourez `result.injuryPredictions`.
  - Si `acwr > 1.5` : Affichez une icône de carton rouge clignotant sur l'avatar anatomique ou la carte d'exercice.
  - Affichez un jauge d'aiguille graduée de $0.0$ à $2.5$. La zone verte s'arrête à $1.3$, la zone orange (attention) s'étend de $1.3$ à $1.5$, et la zone rouge (danger de blessure imminent) s'étend au-delà de $1.5$.

### USP #5 : Plafond Génétique (Loi de Verhulst)
* **Concept :** Plus l'athlète est proche de sa limite naturelle, plus il est difficile de progresser.
* **Intégration UI :**
  - Dans la section profil ou bilan, affichez une jauge élégante de "Plafond Génétique".
  - Proximité = `fitness / geneticCeiling`.
  - Si `weekOverWeekGrowthPct` dans `progressiveOverload` tend vers 0, ajoutez le message : *"Adaptation Saturation : Vous approchez de votre plafond génétique. Pour continuer à progresser, le moteur recommande d'activer le mode stochastique ou d'introduire des semaines de deload planifiées."*

### USP #6 : Gouverneur Central (Inhibition Nerveuse)
* **Concept :** Si un muscle est détruit, le cerveau refuse d'envoyer un signal fort pour le protéger, ce qui augmente le stress du Système Nerveux Central (SNC) de $+50\%$.
* **Intégration UI :**
  - Affichez un indicateur d'efficacité du recrutement moteur.
  - Si la fatigue locale d'un muscle clé est $> 2.0$, affichez un message : *"Gouverneur Central Actif : Le système nerveux bloque le recrutement complet des fibres musculaires sur le [Nom du Muscle] pour éviter une rupture structurelle."*

### USP #7 : Catabolisme du Cortisol (Burnout du SNC)
* **Concept :** Un surentraînement nerveux prolongé provoque un pic de cortisol qui dégrade activement vos muscles.
* **Intégration UI :**
  - Affichez une jauge de "Stress Hormonal / Cortisol".
  - Si `chronicSncStress > 3.0` :
  - **Visual Wow :** L'interface doit appliquer un effet visuel dramatique (glow rouge ou filtre sombre). Affichez en grand : *"STATUT CATABOLIQUE CRITIQUE : Burnout nerveux détecté. Le cortisol détruit vos fibres musculaires. L'entraînement lourd est verrouillé, deload obligatoire."*

### USP #8 : Matrices de tension sur 70+ Exercices (Heatmap Anatomique)
* **Concept :** Une cartographie précise des charges distribuées sur l'avatar.
* **Intégration UI :**
  - Reliez les données de `result.muscles` aux éléments SVG de votre `HumanAvatar`.
  - Colorez directement les zones du corps de l'avatar selon la propriété `color` du muscle (`grey`, `green`, `orange`, `red`).
  - **Effet Premium :** Pour les muscles en couleur `red`, ajoutez une lueur pulsée (`animate-pulse` ou `drop-shadow-[0_0_8px_rgba(239,68,68,0.7)]`).

### USP #9 : Tenseurs ML-Ready (IA & Recherche)
* **Concept :** Des données prêtes à être exportées pour être partagées ou injectées dans un modèle d'apprentissage profond.
* **Intégration UI :**
  - Permettez à l'utilisateur, d'un clic, d'exporter sa "Signature Biomécanique".
  - Exportez au format JSON ou CSV les tableaux contenus dans `result.tensors` pour les scientifiques ou les passionnés d'IA.

---

## 🗺️ 5. DICTIONNAIRES DE TRADUCTION & LOCALISATION (i18n)

Le moteur biomécanique étant purement anglophone dans ses structures et ses codes, vous **devez** utiliser ces tables de correspondance pour afficher du français de qualité supérieure à l'utilisateur.

### A. Traduction des Muscle IDs (`MuscleId`)
| ID Interne (`MuscleId`) | Nom Anatomique Français |
| :--- | :--- |
| **`chest`** | Pectoraux |
| **`upperChest`** | Pectoraux Supérieurs |
| **`lowerChest`** | Pectoraux Inférieurs |
| **`upperBack`** | Grand Dorsal & Haut du Dos |
| **`lowerBack`** | Lombaires / Bas du Dos |
| **`rhomboids`** | Rhomboïdes |
| **`trapezius`** | Trapèzes |
| **`upperTrapezius`** | Trapèzes Supérieurs |
| **`lowerTrapezius`** | Trapèzes Inférieurs |
| **`deltoids`** | Deltoïdes Latéraux |
| **`frontDeltoid`** | Deltoïde Antérieur |
| **`rearDeltoid`** | Deltoïde Postérieur |
| **`biceps`** | Biceps Brachial |
| **`triceps`** | Triceps Brachial |
| **`quadriceps`** | Quadriceps |
| **`innerQuad`** | Quadriceps Interne (Vaste Interne) |
| **`outerQuad`** | Quadriceps Externe (Vaste Externe) |
| **`hamstring`** | Ischio-jambiers |
| **`gluteal`** | Fessiers |
| **`abs`** | Abdominaux (Grand Droit) |
| **`upperAbs`** | Abdominaux Supérieurs |
| **`lowerAbs`** | Abdominaux Inférieurs |
| **`obliques`** | Obliques |
| **`forearm`** | Avant-bras |
| **`calves`** | Mollets |
| **`tibialis`** | Jambier Antérieur |
| **`serratus`** | Dentelé Antérieur |
| **`rotatorCuff`** | Coiffe des Rotateurs |

### B. Traduction des Codes d'Alertes
| Code d'Alerte (`code`) | Niveau Visuel | Titre UI | Message Conseillé |
| :--- | :--- | :--- | :--- |
| **`INJURY_RISK_ACWR`** | 🔴 Rouge / Alerte | **Risque de Blessure Aigu** | Pic de charge brutal détecté sur ce muscle. Risque de tendinite ou déchirure élevé. Réduisez le volume de moitié ou reposez-vous. |
| **`INJURY_RISK_OVERTRAINING`** | 🔴 Rouge vif / Alerte | **Surentraînement Chronique** | Ce muscle subit un volume excessif depuis plus de 3 semaines. Vos articulations et tendons saturent. |
| **`JUNK_VOLUME_DETECTED`** | 🟡 Jaune / Warning | **Volume Inutile Détecté** | Vous avez dépassé le seuil d'assimilation productive aujourd'hui. Ces séries supplémentaires augmentent votre fatigue sans générer de gains. |
| **`MONOTONY_CRITICAL`** | 🟠 Orange / Warning | **Intensité Trop Monotone** | Absence de variation de l'intensité sur la semaine. Pensez à alterner séances lourdes et séances légères pour relancer l'adaptation. |

### C. Traduction des Jours de la Semaine
| Clé Anglaise | Jour Français |
| :---: | :--- |
| `mon` | Lundi |
| `tue` | Mardi |
| `wed` | Mercredi |
| `thu` | Jeudi |
| `fri` | Vendredi |
| `sat` | Samedi |
| `sun` | Dimanche |

---

## 💻 6. EXEMPLE RAPIDE D'INTÉGRATION REACT (HOOK CUSTOM)

Pour connecter l'application au moteur biomécanique en toute simplicité, utilisez le hook d'intégration suivant dans votre code client :

```typescript
import { useState, useEffect } from 'react';
import { runMesocycleSimulation, SimulationResult } from '@forge/shared';
import { WeeklyBlueprint, UserProfile } from '@forge/shared/types';

export function useForgeSimulation(
  blueprint: WeeklyBlueprint,
  profile: UserProfile,
  totalWeeks: number = 4,
  stochasticMode: boolean = false
) {
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    try {
      setLoading(true);
      // Appel du moteur biomécanique synchrone
      const simResult = runMesocycleSimulation(
        blueprint,
        profile,
        {}, // aucun jour forcé inactif
        undefined,
        undefined, // bibliothèque par défaut
        totalWeeks,
        [], // pas de deload
        undefined, // pas de logs
        undefined,
        undefined,
        { stochasticMode }
      );
      setResult(simResult);
      setError(null);
    } catch (err) {
      console.error("Erreur de simulation biomécanique :", err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [blueprint, profile, totalWeeks, stochasticMode]);

  return { result, loading, error };
}
```

---

## 🗺️ 8. CONTRAT DashboardMetrics → SimulationResult

> **AVERTISSEMENT CRITIQUE** : Le blueprint mobile définit un type `DashboardMetrics` avec des noms de champs qui ne correspondent PAS directement aux champs de `SimulationResult`. Ce tableau liste les transformations exactes requises.

| Champ Blueprint | Champ Moteur | Transformation requise | Tier requis |
|---|---|---|---|
| `cnsStatus: number` | `result.sncPercentage` | Direct (0 → 100) | Free+ |
| `chronicStress: number` | `result.chronicSncStress` | Direct (0 → ~5) | Pro+ |
| `monotonyIndex: number` | `result.monotonyAlerts[last]?.monotonyIndex \|\| 0` | Extraire du dernier objet alerte | Pro+ |
| `acwrRatio: number` | `result.globalAcwr` | Direct (0.5 → 3.0) | Pro+ |
| `muscleDamage[id]: number` | `1 - result.muscles[id]?.remainingCapacity` | Inverser `remainingCapacity` | Free+ |
| `muscleReadiness[id]: number` | `result.muscles[id]?.readiness` | Direct | Free+ |
| `injuryRisk[id]: boolean` | `result.injuryPredictions.some(p => p.muscleId === id)` | Filtrage | Pro+ |
| `weeklyVolume[id]: number` | `result.weeklyMacro.weeklyEffectiveSets[id]` | Direct | Free+ |
| `pushPullBalance: number` | `result.weeklyMacro.pushPullRatio.push - result.weeklyMacro.pushPullRatio.pull` | Delta (idéal: 0) | Free+ |
| `axialLoad: number` | `result.weeklyMacro.axialSncLoad` | Direct | Pro+ |
| `todaySessionId` | **N/A — vient de Supabase, pas du moteur** | Requête `workout_sessions` séparée | - |
| `fitnessHistory[id]` | `result.muscles[id]?.fitnessHistory` | Direct (tableau de N flottants) | Elite |
| `fatigueHistory[id]` | `result.muscles[id]?.fatigueHistory` | Direct (tableau de N flottants) | Elite |

### Zones visuelles ACWR (`result.globalAcwr`)
| Plage | Couleur | Label |
|---|---|---|
| `< 0.8` | `zinc-400` (gris) | Sous-charge — augmente le stimulus |
| `0.8 – 1.3` | `emerald-500` (vert) | Zone optimale |
| `1.3 – 1.5` | `amber-400` (orange) | Attention — surveiller la récupération |
| `> 1.5` | `red-500` (rouge) | Danger — risque de blessure ACWR |

### Zones visuelles Monotonie (`monotonyIndex`)
| Plage | Couleur | Signification |
|---|---|---|
| `< 0.15` | `red-500` | Stimulus robotique — variabilité insuffisante |
| `0.15 – 0.4` | `amber-400` | Variabilité faible — à surveiller |
| `> 0.4` | `emerald-500` | Variabilité optimale |

---

## 📋 9. SCHÉMAS ZOD OFFICIELS — Ce que le Mobile DOIT utiliser

> **AVERTISSEMENT** : Les schémas définis dans le blueprint mobile (`AnthropometricSchema`, `StrengthProfileSchema`, `LoggedSetSchema`, `PhysiologicalConstantsSchema`) sont des **RÉFÉRENCES UX**, pas des schémas d'implémentation. Le mobile **DOIT** utiliser les schémas suivants exportés depuis `@forge/shared`.

### 9.1 — Onboarding → `OnboardingPayloadSchema`
```typescript
// Import depuis : @forge/shared
import { OnboardingPayloadSchema, type OnboardingPayload } from '@forge/shared';

// Structure réelle attendue par le moteur
interface OnboardingPayload {
  pdc: number;                       // Poids de corps (30–300 kg)
  gender: 'male' | 'female';         // Défaut: 'male'
  experience_level: 'beginner' | 'intermediate' | 'advanced';
  known_prs?: {                      // PRs optionnels
    squat?: number;
    bench?: number;
    deadlift?: number;
    ohp?: number;
  };
  recent_lifts?: Array<{             // Lifts récents pour estimation 1RM
    exo: 'squat' | 'bench' | 'deadlift' | 'ohp' | 'leg_press' | 'chest_press' | 'lat_pulldown';
    poids: number;
    reps: number;
  }>;
}
```

### 9.2 — Log de série → `ExerciseLogSchema`
```typescript
// Import depuis : @forge/shared
import { ExerciseLogSchema, type ExerciseLog } from '@forge/shared';

// Structure réelle pour logguer une série
interface ExerciseLog {
  exercise_id: string;               // snake_case, ex: 'squat_barre'
  day: 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun'; // ← JAMAIS 'Monday' etc.
  week?: 1 | 2 | 3 | 4 | 5 | 6;
  set_index: number;                 // 0-based
  actual_weight?: number;            // kg, 0 = poids de corps
  actual_reps?: number;
  actual_rpe?: number;               // 1.0 – 10.0
  is_completed?: boolean;            // false = série skippée
  skipped_reason?: 'fatigue' | 'injury' | 'time' | 'form' | 'other' | null;
}
```

### 9.3 — Profil utilisateur → `UserProfileSchema`
```typescript
// Import depuis : @forge/shared
import { UserProfileSchema, type UserProfile } from '@forge/shared';

// Champs que le moteur consomme réellement
interface UserProfile {
  pdc: number;
  prs: { squat?: number; bench?: number; deadlift?: number; ohp?: number };
  maxSnc: number;                    // Capacité SNC (1–100, défaut: 15.0)
  isBeginner?: boolean;
  age?: number;
  sleepHours?: number;               // ← ALIMENTE LA SIMULATION
  dailyVFC?: number;                 // ← ALIMENTE LA SIMULATION (HRV)
  caloricStatus?: 'deficit' | 'maintenance' | 'surplus'; // ← ALIMENTE LA SIMULATION
  stressLevel?: 'low' | 'moderate' | 'high'; // ← ALIMENTE LA SIMULATION
  biometricConstants?: UserBiometricConstants;
}
```

---

## 🎯 10. ONBOARDING — Ce qui alimente RÉELLEMENT le moteur

> **Règle d'or** : Ne collecter QUE ce que le moteur utilise. Chaque champ inutile = friction d'onboarding gaspillée.

### ✅ Données à collecter (impactent directement la simulation)

| Champ | Impact moteur | Écran suggéré |
|---|---|---|
| `pdc` (poids de corps) | Base de calcul de tous les PRs et charges | Onboarding étape 1 |
| `gender` | Ratios de force male/female dans ProfileCalibrator (±30%) | Onboarding étape 1 |
| `experience_level` | Volume de base, RPE cible, facteur de résilience SNC | Onboarding étape 1 |
| `known_prs` | Calcul des charges recommandées | Onboarding étape 2 |
| `caloricStatus` | Modificateur anabolique/catabolique (±20% sur les gains fitness) | Onboarding étape 2 |
| `sleepHours` | Modificateur de récupération SNC (±15% sur tauMetabolic) | Onboarding étape 2 |
| `stressLevel` | Modificateur de résilience SNC (±10% sur tauDamage) | Onboarding étape 2 |

### ❌ Données décoratives (ignorées par le moteur — à minimiser ou retirer)

| Champ | Statut | Recommandation |
|---|---|---|
| `heightCm` (taille) | ❌ Non consommé | À retirer — réduit la friction d'onboarding |
| `femurRatio` | ❌ Non consommé | À retirer — trop technique pour l'onboarding |
| `armRatio` | ❌ Non consommé | À retirer |
| `weakPoints` | ❌ Non consommé par le moteur | À garder uniquement si sert au ProgramGenerator (roadmap) |
| `strongPoints` | ❌ Non consommé | À retirer |
| `weeklyFrequency` | ❌ Non consommé par le moteur | À utiliser uniquement pour sélectionner la structure PPL/FB dans ProgramGenerator |
| `bodyFat` | ❌ Non consommé | À retirer |

---

## 🔥 11. USP #10 — Burnout Tracker (`chronicSncStress`)

**Ce champ est déjà calculé et retourné par le moteur.** Zéro effort supplémentaire requis.

```typescript
// Accès depuis SimulationResult
result.chronicSncStress // number (0.0 → ~5.0+)
```

### Seuils visuels
| Plage | Couleur Forge | Label | Signification biomédicale |
|---|---|---|---|
| `0.0 – 1.0` | `emerald-500` vert | **Normal** | Stress nerveux résorbé — récupération optimale |
| `1.0 – 2.0` | `amber-400` orange | **Vigilance** | Accumulation légère — surveiller le sommeil |
| `2.0 – 3.0` | `red-400` rouge | **Fatigue Chronique** | Surentraînement installé — réduire le volume |
| `> 3.0` | `red-600` rouge clignotant | **CATABOLISME ACTIF** | Le moteur pénalise les gains fitness activement |

### Règles d'affichage
- **Afficher uniquement quand `chronicSncStress > 1.0`** — ne pas alarmer inutilement les utilisateurs en bonne santé
- Composant suggéré : jauge circulaire avec label "Stress Cortisol" + tooltip explicatif
- Position sur le Dashboard (Screen C.1) : sous l'indicateur SNC, au-dessus des Top Muscles
- **Tier requis : Pro+** (champ masqué pour les utilisateurs Free)

### Triggers de Notifications Push associés
```
chronicSncStress > 3.0 → "Alerte burnout — ton SNC est en catabolisme. Planifie 2 jours de repos actif."
chronicSncStress < 1.0 (après avoir été > 2.0) → "Tu as récupéré ! Ton stress cortisol est revenu à la normale."
```

---

## 🔔 12. TRIGGERS DE NOTIFICATIONS PUSH

> Ces événements sont détectables depuis `SimulationResult` après chaque simulation ou synchronisation.

| Condition moteur | Message push | Fréquence max |
|---|---|---|
| `result.sncPercentage > 90` | "Ton SNC est rechargé à {X}%. Prêt à forger ?" | 1x/semaine |
| `result.chronicSncStress > 3.0` | "Alerte burnout — planifie un repos actif cette semaine" | 1x/semaine |
| `result.monotonyAlerts.length > 0` | "Ton programme manque de variabilité — change le stimulus" | 1x/semaine |
| `result.injuryPredictions.length > 0` | "Risque ACWR détecté sur {muscle} — réduis le volume" | 1x/3 jours |
| Séance prévue non enregistrée après 20h local | "Ta séance de {jour} t'attend — 5 min suffisent" | 1x/jour max |
| `result.globalAcwr > 1.5` | "Surcharge détectée — considère une semaine de déload" | 1x/semaine |

---

## 🔮 13. FEATURE : Simulation "What-If" (`initialState`)

Le moteur supporte maintenant la simulation chaînée pour les projections futures.

```typescript
// Etape 1 : Simulation de la semaine actuelle
const currentResult = await runMesocycleSimulationAsync(
  blueprint, profile, {}, undefined, undefined, 4, []
);

// Etape 2 : Projection "Et si je ratais 2 entraînements ?"
const projectedResult = await runMesocycleSimulationAsync(
  blueprint,
  profile,
  { mon: false, wed: false }, // jours toggles désactivés
  undefined, undefined, 2, [],
  undefined, undefined, undefined,
  { stochasticMode: false },
  currentResult.finalState    // ← Reprise depuis l'état final actuel
);
```

### Use cases débloqués
- **Screen E.1 (Banister Lab)** : projeter la fitness/fatigue sur N semaines futures
- **"Que se passe-t-il si je dors mal cette semaine ?"** : passer `stressLevel: 'high'` dans le profil modifié
- **"Et si je faisais un deload maintenant ?"** : `deloadWeeks: [1, 2]` + `initialState: currentResult.finalState`
