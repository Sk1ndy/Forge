import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { PanGestureHandler } from 'react-native-gesture-handler';
import Animated, { useAnimatedGestureHandler, useAnimatedStyle, useSharedValue, withSpring, runOnJS } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

interface SwipeButtonProps {
  onComplete: () => void;
  title?: string;
}

const BUTTON_WIDTH = Dimensions.get('window').width - 32;
const BUTTON_HEIGHT = 64;
const KNOB_SIZE = 56;
const SWIPE_THRESHOLD = BUTTON_WIDTH - KNOB_SIZE - 8;

export function SwipeButton({ onComplete, title = "SLIDE TO COMPLETE" }: SwipeButtonProps) {
  const translateX = useSharedValue(0);
  const completed = useSharedValue(false);

  const gestureHandler = useAnimatedGestureHandler({
    onStart: (_, ctx: any) => {
      if (completed.value) return;
      ctx.startX = translateX.value;
    },
    onActive: (event, ctx) => {
      if (completed.value) return;
      let nextX = ctx.startX + event.translationX;
      translateX.value = Math.max(0, Math.min(nextX, SWIPE_THRESHOLD));
    },
    onEnd: () => {
      if (completed.value) return;
      if (translateX.value > SWIPE_THRESHOLD * 0.8) {
        translateX.value = withSpring(SWIPE_THRESHOLD);
        completed.value = true;
        runOnJS(onComplete)();
      } else {
        translateX.value = withSpring(0);
      }
    }
  });

  const animatedKnobStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }]
    };
  });

  const animatedTextStyle = useAnimatedStyle(() => {
    return {
      opacity: 1 - (translateX.value / SWIPE_THRESHOLD)
    };
  });

  return (
    <View style={styles.container}>
      <Animated.Text style={[styles.text, animatedTextStyle]}>
        {title}
      </Animated.Text>
      
      <PanGestureHandler onGestureEvent={gestureHandler}>
        <Animated.View style={[styles.knob, animatedKnobStyle]}>
          <Ionicons name="chevron-forward" size={24} color="#10b981" />
          <Ionicons name="chevron-forward" size={24} color="#10b981" style={{ marginLeft: -12 }} />
        </Animated.View>
      </PanGestureHandler>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: BUTTON_WIDTH,
    height: BUTTON_HEIGHT,
    backgroundColor: '#09090b', // zinc-950
    borderRadius: 32,
    borderWidth: 1,
    borderColor: '#27272a', // zinc-800
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  text: {
    color: '#a1a1aa',
    fontWeight: 'bold',
    letterSpacing: 2,
    marginLeft: KNOB_SIZE,
  },
  knob: {
    position: 'absolute',
    left: 4,
    width: KNOB_SIZE,
    height: KNOB_SIZE,
    borderRadius: KNOB_SIZE / 2,
    backgroundColor: '#27272a',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 4,
  }
});
