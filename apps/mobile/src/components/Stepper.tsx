import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface StepperProps {
  value: number;
  onValueChange: (val: number) => void;
  step: number;
  min?: number;
  max?: number;
  unit?: string;
  formatValue?: (val: number) => string;
}

export function Stepper({ value, onValueChange, step, min = 0, max = 999, unit = '', formatValue }: StepperProps) {
  const handlePress = (increment: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newValue = increment ? value + step : value - step;
    if (newValue >= min && newValue <= max) {
      onValueChange(parseFloat(newValue.toFixed(2))); // Prevent float precision issues
    }
  };

  const displayValue = formatValue ? formatValue(value) : value.toString();

  return (
    <View style={styles.container}>
      <Pressable 
        style={({ pressed }) => [styles.btn, pressed && styles.btnPressed]}
        onPress={() => handlePress(false)}
      >
        <MaterialCommunityIcons name="minus" size={24} color="#10b981" />
      </Pressable>
      
      <View style={styles.valueContainer}>
        <Text style={styles.valueText}>{displayValue}</Text>
        {unit ? <Text style={styles.unitText}>{unit}</Text> : null}
      </View>

      <Pressable 
        style={({ pressed }) => [styles.btn, pressed && styles.btnPressed]}
        onPress={() => handlePress(true)}
      >
        <MaterialCommunityIcons name="plus" size={24} color="#10b981" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#18181b', // zinc-900
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#27272a', // zinc-800
    height: 56,
  },
  btn: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.05)', // Emerald tint
  },
  btnPressed: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  valueContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  valueText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  unitText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#71717a',
    marginTop: 6,
  }
});
