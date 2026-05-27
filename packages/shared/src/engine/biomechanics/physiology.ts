import { UserProfile } from '../../types';

export const normalize = (val: number) => Math.round(val * 10000) / 10000;

export function calculateRecoveryProfile(profile: UserProfile): number {
  const userAge = profile.age ?? 28;
  const userSleep = profile.sleepHours ?? 8;
  const userCaloric = profile.caloricStatus ?? 'maintenance';
  const userStress = profile.stressLevel ?? 'moderate';

  let multiplier = 1.0;
  if (userAge > 40) multiplier *= Math.max(0.70, 1 - (userAge - 40) * 0.01);
  if (userSleep < 7.5) multiplier *= Math.max(0.60, 0.60 + (userSleep / 7.5) * 0.40);
  else if (userSleep >= 9) multiplier *= 1.05;
  if (userCaloric === 'deficit') multiplier *= 0.80;
  else if (userCaloric === 'surplus') multiplier *= 1.05;
  if (userStress === 'high') multiplier *= 0.80;
  else if (userStress === 'low') multiplier *= 1.05;

  return multiplier;
}

export function getProgressionMultiplier(week: number, isDeload: boolean, isLogged: boolean): number {
  if (isLogged) return 1.0;
  if (isDeload) return 0.70;
  if (week > 1) return Math.pow(1.025, week - 1);
  return 1.0;
}
