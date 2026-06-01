import React from 'react';
import { StyleSheet, View, ViewStyle, Platform } from 'react-native';
import { BlurView } from 'expo-blur';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  intensity?: number;
}

/**
 * GlassCard - Carte en verre dépoli premium de laboratoire.
 * Optimisée pour iOS (vrai flou physique) et Android (fallback performant).
 * Utilise des Specular Borders blanches micrométriques pour détacher le composant du fond noir absolu.
 */
export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  style,
  intensity = 10,
}) => {
  const isAndroid = Platform.OS === 'android';

  return (
    <View style={[styles.cardContainer, style]}>
      {isAndroid ? (
        // Fallback Android : Opacité augmentée pour compenser le manque de flou de fond fluide
        <View style={styles.androidFallbackWrapper}>
          {children}
        </View>
      ) : (
        // iOS : Flou physique réel (Native Blur)
        <BlurView intensity={intensity} tint="dark" style={styles.blurWrapper}>
          {children}
        </BlurView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    borderRadius: 8,
    overflow: 'hidden', // Requis pour clipser le BlurView aux angles
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)', // Specular Border ultra-fine
    backgroundColor: Platform.select({
      ios: 'rgba(24, 24, 27, 0.35)', // Zinc-900 à 35% d'opacité
      android: 'rgba(15, 15, 17, 0.85)', // Zinc-950 à 85% d'opacité (fallback solide de précision)
      default: 'rgba(24, 24, 27, 0.40)',
    }),
  },
  blurWrapper: {
    padding: 16,
  },
  androidFallbackWrapper: {
    padding: 16,
  },
});
