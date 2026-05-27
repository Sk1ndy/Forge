import { Model } from '@nozbe/watermelondb';
import { field, readonly, date } from '@nozbe/watermelondb/decorators';

export class ExerciseLog extends Model {
  static table = 'exercise_logs';

  @field('session_id') session_id?: string;
  @field('user_id') user_id!: string;
  @field('exercise_id') exercise_id!: string;
  @field('day') day!: string;
  @field('week') week!: number;
  @field('set_index') set_index!: number;
  
  @field('planned_weight') planned_weight?: number;
  @field('planned_reps') planned_reps?: number;
  @field('planned_rpe') planned_rpe?: number;
  
  @field('actual_weight') actual_weight?: number;
  @field('actual_reps') actual_reps?: number;
  @field('actual_rpe') actual_rpe?: number;
  
  @field('is_completed') is_completed!: boolean;
  @field('skipped_reason') skipped_reason?: string;

  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}
