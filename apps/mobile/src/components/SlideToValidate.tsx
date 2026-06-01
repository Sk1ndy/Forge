import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Animated,
  PanResponder,
  LayoutChangeEvent,
  Platform,
} from 'react-native';
import { HapticService } from '../services/HapticService';

interface SlideToValidateProps {
  onValidate: () => void;
}

/**
 * SlideToValidate - Bouton glissant haut de gamme de validation (Cupertino style).
 * Utilise PanResponder et Animated.spring sur le GPU pour une fluidité absolue.
 * S'assombrit/s'éclaire et dispose d'un retour haptique physique à l'activation.
 */
export const SlideToValidate: React.FC<SlideToValidateProps> = ({ onValidate }) => {
  const [containerWidth, setContainerWidth] = useState(0);
  const [validated, setValidated] = useState(false);
  const panX = useRef(new Animated.Value(0)).current;

  const onLayout = (e: LayoutChangeEvent) => {
    setContainerWidth(e.nativeEvent.layout.width);
  };

  const maxMove = containerWidth > 0 ? containerWidth - 48 - 8 : 0; // w-12 is 48px, padding px-1 is 4px * 2

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        if (validated) return;
        HapticService.select().catch(() => {});
      },
      onPanResponderMove: (_, gestureState) => {
        if (validated || maxMove <= 0) return;
        const moveX = Math.max(0, Math.min(gestureState.dx, maxMove));
        panX.setValue(moveX);
      },
      onPanResponderRelease: (_, gestureState) => {
        if (validated || maxMove <= 0) return;
        
        // Seuil de validation : 90% du chemin parcouru
        if (gestureState.dx >= maxMove * 0.9) {
          setValidated(true);
          // Animer jusqu'au bout
          Animated.timing(panX, {
            toValue: maxMove,
            duration: 100,
            useNativeDriver: true,
          }).start(async () => {
            await HapticService.success();
            onValidate();
          });
        } else {
          // Effet de ressort Cupertino (Spring Back)
          Animated.spring(panX, {
            toValue: 0,
            friction: 6,
            tension: 60,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  // Interpolation de l'opacité du texte en fonction du glissement
  const textOpacity = maxMove > 0
    ? panX.interpolate({
        inputRange: [0, maxMove * 0.6],
        outputRange: [0.6, 0],
        extrapolate: 'clamp',
      })
    : 0.6;

  // Interpolation de la couleur du fond du slider à l'activation
  const bgOpacity = maxMove > 0
    ? panX.interpolate({
        inputRange: [0, maxMove],
        outputRange: ['rgba(255, 255, 255, 0.03)', 'rgba(255, 255, 255, 0.1)'],
        extrapolate: 'clamp',
      })
    : 'rgba(255, 255, 255, 0.03)';

  return (
    <View
      style={styles.container}
      onLayout={onLayout}
    >
      {/* Fond interactif */}
      <Animated.View
        style={[
          styles.track,
          { backgroundColor: bgOpacity }
        ]}
      >
        {/* Texte flottant au centre */}
        <Animated.View style={[styles.textWrapper, { opacity: textOpacity }]} pointerEvents="none">
          <Text style={styles.text}>SLIDE TO VALIDATE</Text>
        </Animated.View>

        {/* Poignée en verre dépoli (Handle) */}
        <Animated.View
          style={[
            styles.handle,
            { transform: [{ translateX: panX }] }
          ]}
          {...panResponder.panHandlers}
        >
          <View style={styles.dot} />
        </Animated.View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 56,
    position: 'relative',
    justifyContent: 'center',
  },
  track: {
    width: '100%',
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    position: 'relative',
    overflow: 'hidden',
  },
  textWrapper: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: '#a1a1aa',
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontWeight: '700',
    letterSpacing: 4,
  },
  handle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    // Micro-glow
    shadowColor: '#ffffff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ffffff',
  },
});
