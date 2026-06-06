import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';

interface TacticalPickerGalleryProps {
  min: number;
  max: number;
  value: number;
  step: number;
  onChange: (val: number) => void;
  formatValue: (val: number) => string;
  unit?: string;

  // Inline editing support
  isEditing?: boolean;
  editValue?: string;
  onStartEditing?: () => void;
  onChangeEditValue?: (val: string) => void;
  onSubmitEditing?: (val: string) => void;
  keyboardType?: 'number-pad' | 'decimal-pad';
}

const ITEM_WIDTH = 60;

export const TacticalPickerGallery: React.FC<TacticalPickerGalleryProps> = ({
  min,
  max,
  value,
  step,
  onChange,
  formatValue,
  unit = '',
  isEditing = false,
  editValue = '',
  onStartEditing,
  onChangeEditValue,
  onSubmitEditing,
  keyboardType = 'number-pad',
}) => {
  const [containerWidth, setContainerWidth] = useState(0);
  const [localText, setLocalText] = useState(editValue);
  const flatListRef = useRef<FlatList<number>>(null);
  const isUserScrolling = useRef(false);

  // Synchronize localText when editValue changes
  useEffect(() => {
    setLocalText(editValue);
  }, [editValue]);

  // Generate sequence of items safely
  const items: number[] = [];
  const count = Math.round((max - min) / step);
  for (let i = 0; i <= count; i++) {
    items.push(Math.round((min + i * step) * 10) / 10);
  }

  // Scroll offset effect when value changes externally
  useEffect(() => {
    if (containerWidth > 0 && !isUserScrolling.current && !isEditing) {
      const index = items.indexOf(value);
      if (index !== -1) {
        flatListRef.current?.scrollToOffset({ offset: index * ITEM_WIDTH, animated: false });
      }
    }
  }, [value, min, max, step, containerWidth, isEditing]);

  // Handle Horizontal Scroll
  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!isUserScrolling.current) return;
    const x = event.nativeEvent.contentOffset.x;
    const index = Math.round(x / ITEM_WIDTH);
    if (index >= 0 && index < items.length) {
      onChange(items[index]);
    }
  };

  const handleScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    isUserScrolling.current = false;
    const x = event.nativeEvent.contentOffset.x;
    const index = Math.round(x / ITEM_WIDTH);
    if (index >= 0 && index < items.length) {
      onChange(items[index]);
      flatListRef.current?.scrollToOffset({ offset: index * ITEM_WIDTH, animated: true });
    }
  };

  const paddingSide = containerWidth > 0 ? (containerWidth - ITEM_WIDTH) / 2 : 0;

  return (
    <View 
      style={styles.outerContainer}
      onLayout={(e) => {
        setContainerWidth(e.nativeEvent.layout.width);
      }}
    >
      {containerWidth > 0 && (
        <View style={styles.scrollWrapper}>
          {/* Unobstructed Clinical Ticks - 2px thick, Zinc-50 */}
          <View style={styles.ticksOverlay} pointerEvents="none">
            <View style={styles.tickTop} />
            <View style={styles.tickBottom} />
          </View>
          
          {isEditing ? (
            <TextInput
              value={localText}
              onChangeText={(text) => {
                setLocalText(text);
                onChangeEditValue?.(text);
              }}
              onBlur={() => onSubmitEditing?.(localText)}
              onSubmitEditing={() => onSubmitEditing?.(localText)}
              keyboardType={keyboardType}
              autoFocus
              style={styles.centerInput}
              selectTextOnFocus
            />
          ) : (
            <FlatList
              ref={flatListRef}
              data={items}
              horizontal
              keyExtractor={(item) => item.toString()}
              showsHorizontalScrollIndicator={false}
              snapToInterval={ITEM_WIDTH}
              snapToAlignment="center"
              decelerationRate="fast"
              scrollEventThrottle={16}
              onScroll={handleScroll}
              onScrollBeginDrag={() => { isUserScrolling.current = true; }}
              onScrollEndDrag={handleScrollEnd}
              onMomentumScrollEnd={handleScrollEnd}
              contentContainerStyle={{ paddingHorizontal: paddingSide }}
              renderItem={({ item }) => {
                const distance = Math.abs(item - value);
                const isActive = distance < (step / 2.01);
                
                // Edge-fade factor: fades to 0 opacity at distance >= 2.5
                const edgeFade = Math.max(0, 1 - distance * 0.4);
                
                // Base opacity: 1.0 for active (Zinc-50), 0.4 for inactive (Zinc-600)
                const baseOpacity = isActive ? 1.0 : 0.4;
                const opacity = baseOpacity * edgeFade;

                // Color: Zinc-50 (#fafafa) when active, Zinc-600 (#52525b) when inactive
                const color = isActive ? '#fafafa' : '#52525b';

                return (
                  <TouchableOpacity
                    activeOpacity={isActive ? 0.7 : 1}
                    disabled={!isActive}
                    onPress={onStartEditing}
                    style={[styles.itemWrapper, { opacity }]}
                  >
                    <Text style={[styles.itemText, { color, fontWeight: isActive ? '700' : '400' }]}>
                      {formatValue(item)}
                    </Text>
                  </TouchableOpacity>
                );
              }}
            />
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    width: '100%',
    height: 70,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  scrollWrapper: {
    flex: 1,
    width: '100%',
    position: 'relative',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  ticksOverlay: {
    position: 'absolute',
    left: '50%',
    transform: [{ translateX: -1 }], // Centers the 2px line
    width: 2,
    height: '100%',
    justifyContent: 'space-between',
    zIndex: 20,
    paddingVertical: 6,
  },
  tickTop: {
    width: 2,
    height: 8,
    backgroundColor: '#fafafa', // Zinc-50
    borderRadius: 1,
  },
  tickBottom: {
    width: 2,
    height: 8,
    backgroundColor: '#fafafa', // Zinc-50
    borderRadius: 1,
  },
  itemWrapper: {
    width: ITEM_WIDTH,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  itemText: {
    fontFamily: 'JetBrainsMono',
    fontSize: 18,
  },
  centerInput: {
    fontFamily: 'JetBrainsMono',
    fontSize: 18,
    color: '#fafafa',
    textAlign: 'center',
    width: ITEM_WIDTH,
    height: '100%',
    alignSelf: 'center',
  },
});

export default TacticalPickerGallery;
