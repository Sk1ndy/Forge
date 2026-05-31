/**
 * FORGE — Script d'audit : divergences seed.sql vs constants.ts
 * 
 * Usage : npx tsx scripts/audit-seed-vs-constants.ts
 * 
 * Compare les exercices de DEFAULT_EXERCISE_LIBRARY (source de verite)
 * avec ceux du seed.sql et liste toutes les divergences.
 * Le rapport genere sert de base pour la migration 0005_fix_exercise_seed_data.sql
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { DEFAULT_EXERCISE_LIBRARY } from '../packages/shared/src/constants';
import type { Exercise } from '../packages/shared/src/schemas';

// ─── Lecture du seed SQL ───────────────────────────────────────────────────────
const seedPath = join(process.cwd(), 'supabase', 'seed.sql');
const seedContent = readFileSync(seedPath, 'utf-8');

// Extraction basique des lignes INSERT INTO exercises
const exerciseInsertRegex = /INSERT INTO public\.exercises[^;]+;/gs;
const matches = seedContent.match(exerciseInsertRegex) || [];

interface SeedExercise {
  id: string;
  nom: string;
  tier_snc: number | string;
  muscle_primaire: string;
  equipment: string;
  ppl_category?: string;
  muscles_secondaires?: string[];
}

// Parser minimal pour extraire les champs cles des VALUES
function parseSeedExercises(sql: string): SeedExercise[] {
  const rows: SeedExercise[] = [];
  const valueBlocks = sql.match(/\('([^']*)'[^)]*\)/g) || [];
  
  for (const block of valueBlocks) {
    // Extraction par position : (id, nom, tier_snc, muscle_primaire, ...)
    const parts = block
      .replace(/^\(|\)$/g, '')
      .split(/,(?=(?:[^']*'[^']*')*[^']*$)/)
      .map(p => p.trim().replace(/^'|'$/g, ''));
    
    if (parts.length >= 6) {
      rows.push({
        id: parts[0],
        nom: parts[1],
        tier_snc: Number(parts[2]),
        muscle_primaire: parts[3],
        muscles_secondaires: [],
        equipment: parts[4],
        ppl_category: parts[5] || 'unknown',
      });
    }
  }
  return rows;
}

const seedExercises = parseSeedExercises(matches.join('\n'));
const seedMap = new Map<string, SeedExercise>(seedExercises.map(e => [e.id, e]));
const engineMap = new Map<string, Exercise>(DEFAULT_EXERCISE_LIBRARY.map(e => [e.id, e]));

// ─── Rapport de divergences ────────────────────────────────────────────────────
console.log('\n========================================================');
console.log('  FORGE AUDIT — Seed SQL vs constants.ts');
console.log('========================================================\n');

let totalDivergences = 0;

// 1. Exercices dans le seed mais pas dans constants.ts
const seedOnly = [...seedMap.keys()].filter(id => !engineMap.has(id));
if (seedOnly.length > 0) {
  console.log(`\n[ORPHELINS SEED] ${seedOnly.length} exercice(s) dans seed.sql mais absents de constants.ts :`);
  seedOnly.forEach(id => {
    const ex = seedMap.get(id)!;
    console.log(`  - ${id} (${ex.nom})`);
    totalDivergences++;
  });
}

// 2. Exercices dans constants.ts mais pas dans le seed
const engineOnly = [...engineMap.keys()].filter(id => !seedMap.has(id));
if (engineOnly.length > 0) {
  console.log(`\n[MANQUANTS SEED] ${engineOnly.length} exercice(s) dans constants.ts mais absents du seed :`);
  engineOnly.forEach(id => {
    const ex = engineMap.get(id)!;
    console.log(`  - ${id} (${ex.nom}) [tier_snc=${ex.tier_snc}, ppl=${ex.ppl_category}, equip=${ex.equipment}]`);
    totalDivergences++;
  });
}

// 3. Divergences de champs pour les exercices presents des deux cotes
console.log(`\n[DIVERGENCES CHAMPS] Comparaison champ par champ :`);
let fieldDivergences = 0;

for (const [id, engineEx] of engineMap) {
  const seedEx = seedMap.get(id);
  if (!seedEx) continue;

  const diffs: string[] = [];

  if (Number(seedEx.tier_snc) !== engineEx.tier_snc) {
    diffs.push(`tier_snc: seed=${seedEx.tier_snc} vs engine=${engineEx.tier_snc}`);
  }
  if (seedEx.equipment !== engineEx.equipment) {
    diffs.push(`equipment: seed="${seedEx.equipment}" vs engine="${engineEx.equipment}"`);
  }
  if (seedEx.ppl_category && seedEx.ppl_category !== engineEx.ppl_category) {
    diffs.push(`ppl_category: seed="${seedEx.ppl_category}" vs engine="${engineEx.ppl_category}"`);
  }
  if (seedEx.muscle_primaire !== engineEx.muscle_primaire) {
    diffs.push(`muscle_primaire: seed="${seedEx.muscle_primaire}" vs engine="${engineEx.muscle_primaire}"`);
  }

  if (diffs.length > 0) {
    console.log(`  ${id} (${engineEx.nom}):`);
    diffs.forEach(d => console.log(`    -> ${d}`));
    fieldDivergences++;
    totalDivergences++;
  }
}

if (fieldDivergences === 0) {
  console.log('  Aucune divergence de champ detectee.');
}

// 4. Valeurs invalides dans le seed
console.log(`\n[VALEURS INVALIDES] Champs avec valeurs non-Zod-compatibles :`);
const VALID_EQUIPMENT = ['poids_libre', 'machine', 'pdc'];
const VALID_PPL = ['push', 'pull', 'legs', 'core', 'none'];

let invalidCount = 0;
for (const [id, seedEx] of seedMap) {
  const invalids: string[] = [];
  if (!VALID_EQUIPMENT.includes(seedEx.equipment)) {
    invalids.push(`equipment="${seedEx.equipment}" invalide (valeurs: ${VALID_EQUIPMENT.join(', ')})`);
  }
  if (seedEx.ppl_category && !VALID_PPL.includes(seedEx.ppl_category)) {
    invalids.push(`ppl_category="${seedEx.ppl_category}" invalide (valeurs: ${VALID_PPL.join(', ')})`);
  }
  if (invalids.length > 0) {
    console.log(`  ${id}: ${invalids.join('; ')}`);
    invalidCount++;
    totalDivergences++;
  }
}
if (invalidCount === 0) {
  console.log('  Aucune valeur invalide detectee.');
}

console.log('\n========================================================');
console.log(`  TOTAL DIVERGENCES : ${totalDivergences}`);
console.log(`  Seed exercises  : ${seedExercises.length}`);
console.log(`  Engine exercises: ${DEFAULT_EXERCISE_LIBRARY.length}`);
console.log('========================================================\n');

if (totalDivergences > 0) {
  console.log('ACTION REQUISE : Creer la migration 0005_fix_exercise_seed_data.sql');
  console.log('  avec les corrections listees ci-dessus.\n');
  process.exit(1);
} else {
  console.log('OK : Seed SQL aligne avec constants.ts. Aucune migration necessaire.\n');
  process.exit(0);
}
