import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, View, Text, LayoutChangeEvent } from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

interface TacticalSliderProps {
  min: number;
  max: number;
  value: number;
  onChange: (val: number) => void;
  unit: string;
}

export const TacticalSlider: React.FC<TacticalSliderProps> = ({
  min,
  max,
  value,
  onChange,
  unit,
}) => {
  const [width, setWidth] = useState(0);
  const translateX = useSharedValue(0);
  const startX = useSharedValue(0);

  // Synchronize transition value when value changes externally
  useEffect(() => {
    if (width > 0) {
      const percent = (value - min) / (max - min);
      translateX.value = percent * width;
    }
  }, [value, min, max, width]);

  const onLayout = (e: LayoutChangeEvent) => {
    const layoutWidth = e.nativeEvent.layout.width;
    const activeWidth = layoutWidth - 40; // account for paddingHorizontal: 20
    setWidth(activeWidth);
    
    // Initial position setup
    const percent = (value - min) / (max - min);
    translateX.value = percent * activeWidth;
  };

  const lastActiveVal = useRef(value);

  const handleValueChange = (val: number) => {
    if (val !== lastActiveVal.current) {
      lastActiveVal.current = val;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      onChange(val);
    }
  };

  const panGesture = Gesture.Pan()
    .onStart(() => {
      startX.value = translateX.value;
    })
    .onUpdate((event) => {
      if (width <= 0) return;
      const nextX = startX.value + event.translationX;
      const clampedX = Math.max(0, Math.min(nextX, width));
      translateX.value = clampedX;

      // Calculate step values
      const percent = clampedX / width;
      const rawValue = min + percent * (max - min);
      const roundedValue = unit.toLowerCase() === 'kg' || unit.toLowerCase() === 'lbs'
        ? Math.round(rawValue * 10) / 10
        : Math.round(rawValue);

      runOnJS(handleValueChange)(roundedValue);
    });

  const thumbStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  const midValue = Math.round((min + max) / 2);

  return (
    <GestureDetector gesture={panGesture}>
      <View 
        style={styles.sliderContainer}
        onLayout={onLayout}
      >
        {/* Interactive Slider Area */}
        <View style={styles.trackContainer} pointerEvents="none">
          {/* Horizontal Track Line */}
          <View style={styles.track} />

          {/* Micro-Precision Tick Indicator */}
          <Animated.View
            style={[
              styles.tick,
              thumbStyle,
            ]}
          />
        </View>

        {/* Bounds Labels Underneath */}
        <View style={styles.boundsRow} pointerEvents="none">
          <Text style={styles.limitText}>{Math.round(min)}</Text>
          <Text style={[styles.limitText, { textAlign: 'center' }]}>{midValue}</Text>
          <Text style={[styles.limitText, { textAlign: 'right' }]}>{Math.round(max)}</Text>
        </View>
      </View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  sliderContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.01)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    borderRadius: 16,
    paddingHorizontal: 20,
    height: 60,
    justifyContent: 'center',
    width: '100%',
    // Subtle border glow
    shadowColor: '#ffffff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  trackContainer: {
    height: 16,
    justifyContent: 'center',
    position: 'relative',
    width: '100%',
  },
  track: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    width: '100%',
  },
  tick: {
    position: 'absolute',
    width: 2,
    height: 14,
    borderRadius: 1,
    backgroundColor: '#ffffff',
    left: 0, // Starts aligned at the inner track padding boundary
    // Active needle glow
    shadowColor: '#ffffff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 3,
  },
  boundsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 6,
  },
  limitText: {
    fontFamily: 'JetBrainsMono',
    fontSize: 9.5,
    color: 'rgba(255, 255, 255, 0.38)',
    fontWeight: '500',
    flex: 1,
  },
});

export default TacticalSlider;
