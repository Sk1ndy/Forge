import * as fs from 'fs';
import * as path from 'path';
import { DEFAULT_EXERCISE_LIBRARY, DEFAULT_EXERCISE_TENSION_MATRICES } from '../packages/shared/src/constants';

function generateSeed() {
  let sql = `-- =====================================================================================\n`;
  sql += `-- FORGE SEED DATA\n`;
  sql += `-- Auto-generated from packages/shared/src/constants.ts\n`;
  sql += `-- =====================================================================================\n\n`;

  sql += `INSERT INTO public.exercises (id, nom, tier_snc, muscle_primaire, muscles_secondaires, equipment, ppl_category, tension_matrix) VALUES\n`;

  // We will build a complete list of exercises.
  // First, all 42 exercises from DEFAULT_EXERCISE_LIBRARY
  const exercisesToInsert = [...DEFAULT_EXERCISE_LIBRARY];
  const libraryIds = new Set(exercisesToInsert.map(e => e.id));

  // Now let's try to infer the missing ones from tension matrices
  const allMatrixIds = Object.keys(DEFAULT_EXERCISE_TENSION_MATRICES);
  
  for (const matrixId of allMatrixIds) {
    if (!libraryIds.has(matrixId)) {
      // It's missing in the library, we will stub it out so the database has it
      exercisesToInsert.push({
        id: matrixId,
        nom: matrixId.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
        tier_snc: 2, // default stub
        muscle_primaire: Object.keys(DEFAULT_EXERCISE_TENSION_MATRICES[matrixId] || {})[0] || 'unknown',
        muscles_secondaires: [],
        equipment: 'unknown',
        ppl_category: 'unknown'
      } as any);
    }
  }

  const values = exercisesToInsert.map((ex, index) => {
    const tensionMatrix = DEFAULT_EXERCISE_TENSION_MATRICES[ex.id] || {};
    
    // Format array for SQL
    const musclesSec = (ex.muscles_secondaires || []).map(m => `'${m}'`).join(', ');
    const arrayStr = `ARRAY[${musclesSec}]::text[]`;
    
    // Format JSONB
    const jsonStr = `'${JSON.stringify(tensionMatrix)}'`;
    
    let line = `('${ex.id}', '${ex.nom.replace(/'/g, "''")}', ${ex.tier_snc}, '${ex.muscle_primaire}', ${arrayStr}, '${ex.equipment}', '${ex.ppl_category || 'unknown'}', ${jsonStr}::jsonb)`;
    
    if (index === exercisesToInsert.length - 1) {
      return line + ';';
    }
    return line + ',';
  });

  sql += values.join('\n');
  sql += '\n';

  fs.writeFileSync(path.join(__dirname, '../supabase/seed.sql'), sql, 'utf8');
  console.log(`Generated supabase/seed.sql with ${exercisesToInsert.length} exercises.`);
}

generateSeed();
