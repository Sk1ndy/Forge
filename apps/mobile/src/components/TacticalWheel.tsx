import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';

interface TacticalWheelProps {
  min: number;
  max: number;
  value: number;
  step: number;
  onChange: (val: number) => void;
  formatValue?: (val: number) => string;
}

const ITEM_WIDTH = 60;

export const TacticalWheel: React.FC<TacticalWheelProps> = ({
  min,
  max,
  value,
  step,
  onChange,
  formatValue = (val) => val.toString(),
}) => {
  const [containerWidth, setContainerWidth] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const isUserScrolling = useRef(false);

  // Generate array of numbers safely avoiding float rounding errors
  const items: number[] = [];
  const count = Math.round((max - min) / step);
  for (let i = 0; i <= count; i++) {
    items.push(Math.round((min + i * step) * 10) / 10);
  }

  // Scroll to correct position on mount or external value changes
  useEffect(() => {
    if (containerWidth > 0 && !isUserScrolling.current) {
      const index = items.indexOf(value);
      if (index !== -1) {
        const offset = index * ITEM_WIDTH;
        scrollViewRef.current?.scrollTo({ x: offset, animated: false });
      }
    }
  }, [value, min, max, step, containerWidth]);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!isUserScrolling.current) return;
    const x = event.nativeEvent.contentOffset.x;
    const index = Math.round(x / ITEM_WIDTH);
    if (index >= 0 && index < items.length) {
      const selectedValue = items[index];
      if (selectedValue !== value) {
        onChange(selectedValue);
      }
    }
  };

  const handleScrollBegin = () => {
    isUserScrolling.current = true;
  };

  const handleScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    isUserScrolling.current = false;
    const x = event.nativeEvent.contentOffset.x;
    const index = Math.round(x / ITEM_WIDTH);
    if (index >= 0 && index < items.length) {
      const selectedValue = items[index];
      onChange(selectedValue);
      
      // Force snapping to the center
      const offset = index * ITEM_WIDTH;
      scrollViewRef.current?.scrollTo({ x: offset, animated: true });
    }
  };

  const paddingSide = containerWidth > 0 ? (containerWidth - ITEM_WIDTH) / 2 : 0;

  return (
    <View 
      style={styles.container}
      onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
    >
      {/* Central Precision Needle */}
      <View style={styles.centerLine} pointerEvents="none" />

      {containerWidth > 0 && (
        <View style={styles.scrollWrapper}>
          <ScrollView
            ref={scrollViewRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={ITEM_WIDTH}
            snapToAlignment="center"
            decelerationRate="fast"
            scrollEventThrottle={16}
            onScroll={handleScroll}
            onScrollBeginDrag={handleScrollBegin}
            onScrollEndDrag={handleScrollEnd}
            onMomentumScrollEnd={handleScrollEnd}
            contentContainerStyle={{
              paddingHorizontal: paddingSide,
            }}
          >
            {items.map((item) => {
              const isActive = Math.abs(item - value) < (step / 2.01);
              return (
                <View key={item} style={styles.itemWrapper}>
                  <Text 
                    style={[
                      styles.itemText,
                      isActive ? styles.itemTextActive : styles.itemTextInactive
                    ]}
                  >
                    {formatValue(item)}
                  </Text>
                </View>
              );
            })}
          </ScrollView>

          {/* Left and Right Fade Gradients */}
          <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
            <Defs>
              <LinearGradient id="pickerFade" x1="0" y1="0" x2="1" y2="0">
                <Stop offset="0%" stopColor="#131313" stopOpacity="1" />
                <Stop offset="20%" stopColor="#131313" stopOpacity="0.8" />
                <Stop offset="40%" stopColor="#131313" stopOpacity="0" />
                <Stop offset="60%" stopColor="#131313" stopOpacity="0" />
                <Stop offset="80%" stopColor="#131313" stopOpacity="0.8" />
                <Stop offset="100%" stopColor="#131313" stopOpacity="1" />
              </LinearGradient>
            </Defs>
            <Rect width="100%" height="100%" fill="url(#pickerFade)" />
          </Svg>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 40,
    position: 'relative',
    justifyContent: 'center',
  },
  scrollWrapper: {
    flex: 1,
    height: 40,
    position: 'relative',
  },
  centerLine: {
    position: 'absolute',
    left: '50%',
    transform: [{ translateX: -0.5 }],
    width: 1,
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    zIndex: 20,
  },
  itemWrapper: {
    width: ITEM_WIDTH,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemText: {
    fontFamily: 'JetBrainsMono',
  },
  itemTextActive: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  itemTextInactive: {
    color: 'rgba(255, 255, 255, 0.25)',
    fontSize: 13,
    fontWeight: '500',
  },
});

export default TacticalWheel;
