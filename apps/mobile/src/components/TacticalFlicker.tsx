import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, TextStyle, Platform } from 'react-native';

interface TacticalFlickerProps {
  children: string;
  style?: TextStyle;
  fontType?: 'mono' | 'sans';
}

/**
 * TacticalFlicker - Affiche des métadonnées de télémétrie avec un micro-clignotement au montage.
 * Utilise le driver natif pour éviter les rafraîchissements CPU de React et garantir 120 FPS.
 * Se stabilise rapidement pour éviter la fatigue cognitive lors de l'effort physique.
 */
export const TacticalFlicker: React.FC<TacticalFlickerProps> = ({
  children,
  style,
  fontType = 'mono',
}) => {
  const opacityAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Séquence de micro-flicker tactique (cockpit militaire) au montage
    Animated.sequence([
      Animated.timing(opacityAnim, { toValue: 0.1, duration: 40, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 0.9, duration: 60, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 0.3, duration: 30, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 1.0, duration: 80, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 0.5, duration: 50, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 1.0, duration: 200, useNativeDriver: true }),
    ]).start();
  }, [opacityAnim]);

  const resolvedFont = fontType === 'mono' ? styles.fontMono : styles.fontSans;

  return (
    <Animated.Text style={[{ opacity: opacityAnim }, resolvedFont, style]}>
      {children}
    </Animated.Text>
  );
};

const SystemFont = Platform.select({
  ios: 'System',
  android: 'sans-serif',
  default: 'sans-serif',
});

const styles = StyleSheet.create({
  fontMono: {
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', // En production, JetBrains Mono
    color: '#ffffff',
  },
  fontSans: {
    fontFamily: SystemFont, // En production, Geist Sans ou System
    color: '#ffffff',
  },
});
