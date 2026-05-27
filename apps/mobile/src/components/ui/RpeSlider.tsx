import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PanGestureHandler } from 'react-native-gesture-handler';
import Animated, { useAnimatedGestureHandler, useAnimatedStyle, useSharedValue, runOnJS, withSpring } from 'react-native-reanimated';

interface RpeSliderProps {
  value: number;
  onChange: (rpe: number) => void;
}

export function RpeSlider({ value, onChange }: RpeSliderProps) {
  const SLIDER_WIDTH = 300;
  const KNOB_SIZE = 48; // Grosse zone de touch pour les sweaty hands

  const translateX = useSharedValue(((value - 1) / 9) * (SLIDER_WIDTH - KNOB_SIZE));

  const gestureHandler = useAnimatedGestureHandler({
    onStart: (_, ctx: any) => {
      ctx.startX = translateX.value;
    },
    onActive: (event, ctx) => {
      let nextX = ctx.startX + event.translationX;
      nextX = Math.max(0, Math.min(nextX, SLIDER_WIDTH - KNOB_SIZE));
      translateX.value = nextX;
    },
    onEnd: () => {
      // Calcul du RPE (1 à 10)
      const ratio = translateX.value / (SLIDER_WIDTH - KNOB_SIZE);
      let rpe = Math.round(1 + ratio * 9);
      
      // Snap au chiffre exact
      translateX.value = withSpring(((rpe - 1) / 9) * (SLIDER_WIDTH - KNOB_SIZE));
      
      runOnJS(onChange)(rpe);
    }
  });

  const animatedKnobStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }]
    };
  });

  const getRpeColor = (rpe: number) => {
    if (rpe <= 6) return '#10b981'; // emerald-500
    if (rpe <= 8) return '#f59e0b'; // amber-500
    return '#ef4444'; // red-500
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>RPE (Difficulté) : <Text style={{ color: getRpeColor(value) }}>{value}/10</Text></Text>
      
      <View style={[styles.track, { width: SLIDER_WIDTH }]}>
        <View style={styles.markers}>
          {[1, 5, 8, 10].map(m => (
            <Text key={m} style={[styles.markerText, { left: ((m - 1) / 9) * (SLIDER_WIDTH - KNOB_SIZE) }]}>
              {m}
            </Text>
          ))}
        </View>
        
        <PanGestureHandler onGestureEvent={gestureHandler}>
          <Animated.View style={[styles.knob, animatedKnobStyle, { backgroundColor: getRpeColor(value) }]}>
            <Text style={styles.knobText}>{value}</Text>
          </Animated.View>
        </PanGestureHandler>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#09090b',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#27272a',
    marginBottom: 16,
    alignItems: 'center',
  },
  label: {
    color: '#a1a1aa',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 24,
    alignSelf: 'flex-start',
  },
  track: {
    height: 8,
    backgroundColor: '#27272a',
    borderRadius: 4,
    justifyContent: 'center',
    marginBottom: 16,
  },
  markers: {
    position: 'absolute',
    top: -24,
    width: '100%',
    flexDirection: 'row',
  },
  markerText: {
    position: 'absolute',
    color: '#52525b', // zinc-600
    fontSize: 12,
    fontWeight: 'bold',
  },
  knob: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  knobText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  }
});
