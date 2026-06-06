import React, { useState } from 'react';
import { StyleSheet, View, LayoutChangeEvent } from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

interface SlideToValidateProps {
  onValidate: () => void;
}

export const SlideToValidate: React.FC<SlideToValidateProps> = ({ onValidate }) => {
  const translateX = useSharedValue(0);
  const isSliding = useSharedValue(false);
  const isSuccess = useSharedValue(false);
  const maxTranslate = useSharedValue(0);
  const [isFinished, setIsFinished] = useState(false);

  const onLayout = (e: LayoutChangeEvent) => {
    const width = e.nativeEvent.layout.width;
    maxTranslate.value = width - 38 - 8; // handle is 38px, padding is 4px on each side
  };

  const triggerLightHaptic = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  };

  const triggerHeavyHaptic = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
  };

  const triggerSuccessCallback = () => {
    setIsFinished(true);
    onValidate();
  };

  // Modern Gesture API: Gesture.Pan()
  const panGesture = Gesture.Pan()
    .onStart(() => {
      if (isSuccess.value) return;
      isSliding.value = true;
      runOnJS(triggerLightHaptic)();
    })
    .onUpdate((event) => {
      if (isSuccess.value) return;
      translateX.value = Math.max(0, Math.min(event.translationX, maxTranslate.value));
    })
    .onEnd(() => {
      if (isSuccess.value) return;
      isSliding.value = false;

      // Threshold: 90%
      if (translateX.value >= maxTranslate.value * 0.90) {
        isSuccess.value = true;
        translateX.value = withTiming(maxTranslate.value, { duration: 80 }, () => {
          runOnJS(triggerHeavyHaptic)();
          runOnJS(triggerSuccessCallback)();
        });
      } else {
        translateX.value = withSpring(0, { damping: 12 });
      }
    });

  const thumbStyle = useAnimatedStyle(() => {
    const scale = withSpring(isSliding.value ? 1.05 : 1.0, { damping: 15 });
    // Halo glow opacity during sliding
    const shadowOpacity = interpolate(
      translateX.value,
      [0, maxTranslate.value || 100],
      [0.15, 0.45],
      'clamp'
    );
    // Expand shadow radius during sliding
    const shadowRadius = interpolate(
      translateX.value,
      [0, maxTranslate.value || 100],
      [4, 12],
      'clamp'
    );

    return {
      transform: [
        { translateX: translateX.value },
        { scale },
      ],
      shadowOpacity: isSliding.value ? shadowOpacity : 0.15,
      shadowRadius: isSliding.value ? shadowRadius : 4,
    };
  });

  const textStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      translateX.value,
      [0, maxTranslate.value * 0.6 || 50],
      [0.6, 0], // Starts at 0.6 (Zinc-400), fades completely to 0
      'clamp'
    );
    return {
      opacity,
    };
  });

  const trackStyle = useAnimatedStyle(() => {
    const opacity = withTiming(isSuccess.value ? 0 : 1, { duration: 150 });
    return {
      opacity,
    };
  });

  const successCheckStyle = useAnimatedStyle(() => {
    const opacity = withTiming(isSuccess.value ? 1 : 0, { duration: 200 });
    const scale = withSpring(isSuccess.value ? 1.0 : 0.5);
    return {
      opacity,
      transform: [{ scale }],
    };
  });

  return (
    <View style={styles.outerContainer}>
      {/* Success Check Icon (Fade In / Scale Up) */}
      <Animated.View style={[styles.successContainer, successCheckStyle]} pointerEvents="none">
        <View style={styles.successCircle}>
          <Feather name="check" size={20} color="#ffffff" />
        </View>
      </Animated.View>

      {/* Slider Track (Fade Out on Success) */}
      <Animated.View 
        style={[styles.track, trackStyle]} 
        onLayout={onLayout}
        pointerEvents={isFinished ? 'none' : 'auto'}
      >
        <View style={styles.textContainer} pointerEvents="none">
          <Animated.Text style={[styles.instructionText, textStyle]}>
            SLIDE TO COMMIT
          </Animated.Text>
        </View>

        <GestureDetector gesture={panGesture}>
          <Animated.View style={[styles.thumb, thumbStyle]}>
            <View style={styles.thumbCenterMarker} />
          </Animated.View>
        </GestureDetector>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    width: '100%',
    height: 48,
    position: 'relative',
    justifyContent: 'center',
  },
  track: {
    width: '100%',
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#27272a', // Zinc-800
    backgroundColor: '#18181b', // Zinc-900
    paddingHorizontal: 4,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  thumb: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#fafafa', // Zinc-50
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    // Specular Halo Glow
    shadowColor: '#ffffff',
    shadowOffset: { width: 0, height: 0 },
    elevation: 3,
  },
  thumbCenterMarker: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#000000',
    opacity: 0.15,
  },
  textContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  instructionText: {
    fontFamily: 'JetBrainsMono',
    fontSize: 10,
    color: '#a1a1aa', // Zinc-400
    letterSpacing: 1.5,
  },
  successContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
  },
  successCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default SlideToValidate;
