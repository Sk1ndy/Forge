import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/**
 * Service Haptique Tactique de Forge.
 * Gère le retour de force physique (haptic feedback) de manière calibrée.
 * Désactivé silencieusement sur les plateformes non compatibles pour éviter les exceptions.
 */
export const HapticService = {
  /**
   * Retour ultra-léger pour les pas de steppers (poids, reps).
   * Simule un engrenage rotatif de haute précision.
   */
  step: async (): Promise<void> => {
    if (Platform.OS === 'web') return;
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // Échoue silencieusement si non supporté
    }
  },

  /**
   * Retour moyen lors de la sélection d'un exercice ou d'une validation d'option.
   * Simule un bouton physique métallique aéronautique.
   */
  select: async (): Promise<void> => {
    if (Platform.OS === 'web') return;
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {
      // Échoue silencieusement
    }
  },

  /**
   * Vibration de succès de fin de série ou d'objectif atteint.
   * Déclenché lorsque le slider de validation atteint 100%.
   */
  success: async (): Promise<void> => {
    if (Platform.OS === 'web') return;
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      // Échoue silencieusement
    }
  },

  /**
   * Vibration d'alerte biomécanique critique (CNS Overload, approche du point de rupture).
   * Strictement couplé à l'affichage de l'Exception Rouge (#ef4444).
   */
  warning: async (): Promise<void> => {
    if (Platform.OS === 'web') return;
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } catch {
      // Échoue silencieusement
    }
  },
};
