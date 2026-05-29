import { RawWearableData, StressFactors } from '../../schemas';
import { UserProfile } from '../../types';

/**
 * Adapter pattern to convert messy wearable data from different sources
 * into pure mathematical StressFactors consumable by the Banister Engine.
 */
export class TelemetryAdapter {
  /**
   * Normalizes wearable data into StressFactors.
   */
  static normalize(data: RawWearableData, baselineProfile: UserProfile): StressFactors {
    let recoveryMultiplier = 1.0;
    let cnsStressDelta = 0;
    let confidence = 0.5;
    const logs: string[] = [];

    // 1. Evaluate HRV (Heart Rate Variability)
    if (data.hrv_ms !== undefined && baselineProfile.dailyVFC !== undefined) {
      confidence += 0.2; // High confidence in HRV data
      const hrvDelta = data.hrv_ms - baselineProfile.dailyVFC;
      const hrvRatio = data.hrv_ms / baselineProfile.dailyVFC;

      if (hrvRatio < 0.8) {
        recoveryMultiplier *= 0.8;
        cnsStressDelta += 0.5; // Adds acute stress
        logs.push(`HRV effondrée (-${(1 - hrvRatio) * 100}% par rapport à la baseline). Récupération freinée.`);
      } else if (hrvRatio > 1.2) {
        recoveryMultiplier *= 1.1;
        cnsStressDelta -= 0.5; // Removes stress
        logs.push(`HRV excellente (+${(hrvRatio - 1) * 100}%). Parasympathique dominant.`);
      } else {
        logs.push(`HRV dans la norme.`);
      }
    }

    // 2. Evaluate Sleep
    if (data.sleep_total_minutes !== undefined) {
      confidence += 0.2;
      const hours = data.sleep_total_minutes / 60;
      const baselineSleep = baselineProfile.sleepHours || 8;
      
      if (hours < baselineSleep - 1.5) {
        recoveryMultiplier *= 0.85;
        cnsStressDelta += 0.3;
        logs.push(`Dette de sommeil détectée (${hours.toFixed(1)}h vs ${baselineSleep}h).`);
      } else if (hours >= baselineSleep + 1.0) {
        recoveryMultiplier *= 1.05;
        cnsStressDelta -= 0.2;
        logs.push(`Nuit très récupératrice détectée.`);
      }
    }

    // 3. Fallback on manual Readiness or proprietary metrics (Garmin Body Battery)
    if (data.readiness_score !== undefined) {
      if (data.readiness_score < 40) {
        recoveryMultiplier *= 0.7;
        cnsStressDelta += 1.0;
        logs.push(`Score de readiness global critique (${data.readiness_score}/100).`);
      } else if (data.readiness_score > 80) {
        recoveryMultiplier *= 1.15;
        cnsStressDelta -= 0.5;
        logs.push(`Score de readiness excellent (${data.readiness_score}/100).`);
      }
    }

    // Cap values to prevent breaking the physics engine
    recoveryMultiplier = Math.max(0.3, Math.min(recoveryMultiplier, 1.8));
    confidence = Math.min(1.0, confidence);

    if (logs.length === 0) {
      logs.push("Aucune anomalie biométrique détectée, recoveryMultiplier à 1.0.");
    }

    return {
      recoveryMultiplier,
      cnsStressDelta,
      confidence,
      logs
    };
  }
}
