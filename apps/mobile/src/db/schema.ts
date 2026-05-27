import { appSchema, tableSchema } from '@nozbe/watermelondb';

export const schema = appSchema({
  version: 1,
  tables: [
    tableSchema({
      name: 'blueprints',
      columns: [
        { name: 'nom', type: 'string' },
        { name: 'user_id', type: 'string' },
        { name: 'state', type: 'string' }, // JSON stringified WeeklyBlueprint
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'exercise_logs',
      columns: [
        { name: 'session_id', type: 'string', isOptional: true },
        { name: 'user_id', type: 'string' },
        { name: 'exercise_id', type: 'string' },
        { name: 'day', type: 'string' },
        { name: 'week', type: 'number' },
        { name: 'set_index', type: 'number' },
        { name: 'planned_weight', type: 'number', isOptional: true },
        { name: 'planned_reps', type: 'number', isOptional: true },
        { name: 'planned_rpe', type: 'number', isOptional: true },
        { name: 'actual_weight', type: 'number', isOptional: true },
        { name: 'actual_reps', type: 'number', isOptional: true },
        { name: 'actual_rpe', type: 'number', isOptional: true },
        { name: 'is_completed', type: 'boolean' },
        { name: 'skipped_reason', type: 'string', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
  ],
});
