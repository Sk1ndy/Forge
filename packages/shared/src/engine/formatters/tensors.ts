import { MusclesMap } from '../core/state';

export interface NormalizedTensors {
  [muscleId: string]: number[];
}

/**
 * Normalise les historiques de fatigue en tenseurs [0,1] pour injection 
 * directe dans un modèle Machine Learning (TensorFlow/PyTorch).
 * Applique un Min-Max Scaling par muscle.
 */
export function normalizeFatigueHistoryToTensors(musclesMap: MusclesMap): NormalizedTensors {
  const tensors: NormalizedTensors = {};

  Object.entries(musclesMap).forEach(([muscleId, state]) => {
    const history = state.fatigueHistory || [];
    if (history.length === 0) {
      tensors[muscleId] = [];
      return;
    }

    const min = history.reduce((a, b) => Math.min(a, b), Infinity);
    const max = history.reduce((a, b) => Math.max(a, b), -Infinity);
    const range = max - min;

    tensors[muscleId] = history.map(val => {
      if (range === 0) return 0; // Avoid division by zero
      return Math.round(((val - min) / range) * 10000) / 10000; // Round to 4 decimals
    });
  });

  return tensors;
}
