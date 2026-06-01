import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  PanResponder,
  LayoutChangeEvent,
  Platform,
} from 'react-native';

interface TacticalSliderProps {
  min: number;
  max: number;
  value: number;
  onChange: (val: number) => void;
  unit: string;
}

/**
 * TacticalSlider - Un curseur de visée tactile haute-fidélité.
 * Utilise PanResponder pour une réactivité gestuelle à 120Hz sans dépendances complexes.
 * Affiche une aiguille verticale blanche ultra-fine de 2px sur une piste millimétrique.
 */
export const TacticalSlider: React.FC<TacticalSliderProps> = ({
  min,
  max,
  value,
  onChange,
  unit,
}) => {
  const [width, setWidth] = useState(0);
  const startVal = useRef(0);

  const onLayout = (e: LayoutChangeEvent) => {
    setWidth(e.nativeEvent.layout.width);
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        startVal.current = value;
      },
      onPanResponderMove: (_, gestureState) => {
        if (width <= 0) return;
        const deltaX = gestureState.dx;
        const deltaValue = (deltaX / width) * (max - min);
        const newValue = startVal.current + deltaValue;
        const clampedValue = Math.max(min, Math.min(newValue, max));
        // Arrondir à 1 décimale pour le poids (kg) ou à l'entier pour la taille
        const roundedValue = unit.toLowerCase() === 'kg' || unit.toLowerCase() === 'lbs'
          ? Math.round(clampedValue * 10) / 10
          : Math.round(clampedValue);
        onChange(roundedValue);
      },
    })
  ).current;

  // Calcul du pourcentage de progression pour positionner l'aiguille
  const percent = max > min ? (value - min) / (max - min) : 0;
  const clampedPercent = Math.max(0, Math.min(percent, 1));
  const handleLeft = clampedPercent * width;

  const midValue = (min + max) / 2;

  return (
    <View style={styles.sliderWrapper}>
      {/* Zone active du geste */}
      <View
        style={styles.touchArea}
        onLayout={onLayout}
        {...panResponder.panHandlers}
      >
        {/* Rail Horizontal */}
        <View style={styles.track} />

        {/* Aiguille de Visée (Needle Handle) */}
        <View
          style={[
            styles.needle,
            { left: handleLeft - 1 }, // Décale de la moitié de la largeur (2px) pour centrer
          ]}
        />
      </View>

      {/* Graduation HUD / Ticks */}
      <View style={styles.ticksContainer}>
        <Text style={[styles.tickText, { textAlign: 'left' }]}>{Math.round(min)}</Text>
        <Text style={[styles.tickText, { textAlign: 'center' }]}>{Math.round(midValue)}</Text>
        <Text style={[styles.tickText, { textAlign: 'right' }]}>{Math.round(max)}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  sliderWrapper: {
    width: '100%',
    paddingVertical: 8,
  },
  touchArea: {
    width: '100%',
    height: 48,
    justifyContent: 'center',
    position: 'relative',
  },
  track: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    width: '100%',
  },
  needle: {
    position: 'absolute',
    width: 2,
    height: 24,
    backgroundColor: '#ffffff',
    // Halo lumineux blanc premium
    shadowColor: '#ffffff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 4,
  },
  ticksContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 2,
    marginTop: -4,
  },
  tickText: {
    fontSize: 9,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: 'rgba(255, 255, 255, 0.3)',
    fontWeight: '700',
    flex: 1,
  },
});
