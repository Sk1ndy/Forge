import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';

import { schema } from './schema';
import { Blueprint } from './models/Blueprint';
import { ExerciseLog } from './models/ExerciseLog';

const adapter = new SQLiteAdapter({
  schema,
  // (You might want to pass migrations here later)
  jsi: true, /* JSI is faster but requires native setup */
  onSetUpError: error => {
    console.error("WatermelonDB setup error:", error);
  }
});

export const database = new Database({
  adapter,
  modelClasses: [Blueprint, ExerciseLog],
});
