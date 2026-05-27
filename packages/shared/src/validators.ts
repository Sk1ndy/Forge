import { PlannedSetSchema, UserProfileSchema, ExerciseLogSchema, ExerciseLog } from './schemas';

// Alias pour la compatibilité avec le code existant qui importe ces constantes depuis validators
export const PlannedSetEngineSchema = PlannedSetSchema;
export const UserProfileEngineSchema = UserProfileSchema;
export const ExerciseLogEngineSchema = ExerciseLogSchema;

/**
 * Filtre et valide un tableau de logs bruts avant injection dans le moteur.
 * Les logs invalides sont silencieusement ignorés (logged en dev).
 */
export function sanitizeLogs(rawLogs: unknown[]): ExerciseLog[] {
  return rawLogs.reduce<ExerciseLog[]>((acc, log) => {
    const result = ExerciseLogEngineSchema.safeParse(log);
    if (result.success) {
      acc.push(result.data as ExerciseLog);
    } else if (process.env.NODE_ENV === 'development') {
      console.warn('[FORGE ENGINE] Log rejeté (validation):', result.error.flatten());
    }
    return acc;
  }, []);
}
