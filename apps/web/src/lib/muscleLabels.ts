/**
 * muscleLabels.ts — Couche de traduction UI pour @forge/shared
 *
 * Ce fichier est la SEULE source de vérité pour les labels affichés à l'utilisateur.
 * Le moteur (@forge/shared/engine.ts) retourne des tokens machine agnostiques
 * (ex: 'OPTIMAL', 'DANGER'). Ce fichier les traduit en chaînes lisibles.
 *
 * Pour ajouter une langue :
 *   1. Ajouter une clé dans le Record de chaque constante (ex: 'en': '...')
 *   2. Passer la langue aux fonctions helpers (getStatusLabel, getMuscleGroupName)
 *   3. Brancher un contexte/store de langue dans l'app
 */

import type { MuscleStatusToken, MuscleId } from '@forge/shared';

// ─── TYPE LANGUE ─────────────────────────────────────────────────────────────
export type AppLanguage = 'fr'; // | 'en'  ← décommenter lors de l'ajout EN

// ─── STATUTS MUSCULAIRES ─────────────────────────────────────────────────────
// Traduit les tokens machine (`MuscleStatusToken`) en labels lisibles par l'utilisateur.

export const MUSCLE_STATUS_LABELS: Record<MuscleStatusToken, Record<AppLanguage, string>> = {
  REST:     { fr: 'Volume Insuffisant (Repos / Maintien)' },
  OPTIMAL:  { fr: "Stimulus Optimal (Zone d'Adaptation)" },
  OVERLOAD: { fr: 'Surcharge Fonctionnelle (Attention)' },
  DANGER:   { fr: 'Risque Lésionnel (MRV Dépassé)' },
};

export const MUSCLE_STATUS_SHORT: Record<MuscleStatusToken, Record<AppLanguage, string>> = {
  REST:     { fr: 'Repos' },
  OPTIMAL:  { fr: 'Optimal' },
  OVERLOAD: { fr: 'Surcharge' },
  DANGER:   { fr: 'Danger' },
};

/**
 * Retourne le label complet du statut musculaire dans la langue donnée.
 * @example getStatusLabel('OPTIMAL', 'fr') → "Stimulus Optimal (Zone d'Adaptation)"
 */
export function getStatusLabel(token: MuscleStatusToken, lang: AppLanguage = 'fr'): string {
  return MUSCLE_STATUS_LABELS[token]?.[lang] ?? token;
}

/**
 * Retourne le label court du statut musculaire (pour badges, tooltips).
 * @example getStatusShort('DANGER', 'fr') → "Danger"
 */
export function getStatusShort(token: MuscleStatusToken, lang: AppLanguage = 'fr'): string {
  return MUSCLE_STATUS_SHORT[token]?.[lang] ?? token;
}

// ─── NOMS DES GROUPES MUSCULAIRES ────────────────────────────────────────────
// Traduit les IDs bruts (`MuscleId`) en noms de groupes affichables.
// Ce mapping remplace getCleanGroupName() qui était couplé au moteur.

export const MUSCLE_GROUP_NAMES: Partial<Record<MuscleId, Record<AppLanguage, string>>> = {
  // Pectoraux
  chest:          { fr: 'Pectoraux' },
  upperChest:     { fr: 'Pectoraux Hauts' },
  lowerChest:     { fr: 'Pectoraux Bas' },
  serratus:       { fr: 'Grand Dentelé' },
  // Dos
  upperBack:      { fr: 'Grand Dorsal' },
  lowerBack:      { fr: 'Lombaires' },
  rhomboids:      { fr: 'Rhomboïdes' },
  trapezius:      { fr: 'Trapèzes' },
  upperTrapezius: { fr: 'Trapèzes Hauts' },
  lowerTrapezius: { fr: 'Trapèzes Bas' },
  rotatorCuff:    { fr: 'Coiffe des Rotateurs' },
  // Épaules
  deltoids:       { fr: 'Épaules' },
  frontDeltoid:   { fr: 'Deltoïdes Antérieurs' },
  rearDeltoid:    { fr: 'Deltoïdes Postérieurs' },
  // Bras
  biceps:         { fr: 'Biceps' },
  triceps:        { fr: 'Triceps' },
  forearm:        { fr: 'Avant-Bras' },
  // Abdos / Core
  abs:            { fr: 'Abdominaux' },
  upperAbs:       { fr: 'Abdos Hauts' },
  lowerAbs:       { fr: 'Abdos Bas' },
  obliques:       { fr: 'Obliques' },
  // Jambes
  quadriceps:     { fr: 'Quadriceps' },
  innerQuad:      { fr: 'Vaste Interne' },
  outerQuad:      { fr: 'Vaste Externe' },
  hamstring:      { fr: 'Ischio-Jambiers' },
  gluteal:        { fr: 'Fessiers' },
  calves:         { fr: 'Mollets' },
  adductors:      { fr: 'Adducteurs' },
  hipFlexors:     { fr: 'Fléchisseurs de Hanche' },
  tibialis:       { fr: 'Tibial Antérieur' },
  // Autres
  neck:           { fr: 'Cou' },
  ankles:         { fr: 'Chevilles' },
};

/**
 * Retourne le nom affichable d'un groupe musculaire.
 * Fallback sur l'ID brut si non trouvé.
 * @example getMuscleGroupName('chest', 'fr') → "Pectoraux"
 */
export function getMuscleGroupName(id: MuscleId, lang: AppLanguage = 'fr'): string {
  return MUSCLE_GROUP_NAMES[id]?.[lang] ?? id;
}

/**
 * Retourne le nom "propre" d'un groupe musculaire (parent consolidé).
 * Remplace getCleanGroupName() qui était dans engine.ts.
 * Les sous-muscles retournent le nom de leur parent.
 * @example getCleanGroupName('upperChest', 'fr') → "Pectoraux"
 */
export function getCleanGroupName(id: MuscleId, lang: AppLanguage = 'fr'): string {
  const PARENT_MAP: Partial<Record<MuscleId, MuscleId>> = {
    upperChest:     'chest',
    lowerChest:     'chest',
    serratus:       'chest',
    rhomboids:      'upperBack',
    rotatorCuff:    'upperBack',
    upperTrapezius: 'trapezius',
    lowerTrapezius: 'trapezius',
    deltoids:       'frontDeltoid',
    innerQuad:      'quadriceps',
    outerQuad:      'quadriceps',
    upperAbs:       'abs',
    lowerAbs:       'abs',
  };
  const parentId = PARENT_MAP[id] ?? id;
  return getMuscleGroupName(parentId, lang);
}
