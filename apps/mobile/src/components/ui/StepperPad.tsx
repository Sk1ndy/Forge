import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface StepperPadProps {
  label: string;
  value: number;
  unit?: string;
  step: number;
  min?: number;
  max?: number;
  onChange: (newValue: number) => void;
}

export function StepperPad({ label, value, unit = '', step, min = 0, max = 1000, onChange }: StepperPadProps) {
  const handleDecrement = () => {
    if (value - step >= min) {
      onChange(value - step);
    } else {
      onChange(min);
    }
  };

  const handleIncrement = () => {
    if (value + step <= max) {
      onChange(value + step);
    } else {
      onChange(max);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      
      <View style={styles.controls}>
        <TouchableOpacity 
          style={[styles.button, styles.decrement]} 
          onPress={handleDecrement}
          activeOpacity={0.7}
        >
          <Text style={styles.buttonText}>-{step}</Text>
        </TouchableOpacity>

        <View style={styles.valueContainer}>
          <Text style={styles.valueText}>{value}</Text>
          {unit ? <Text style={styles.unitText}>{unit}</Text> : null}
        </View>

        <TouchableOpacity 
          style={[styles.button, styles.increment]} 
          onPress={handleIncrement}
          activeOpacity={0.7}
        >
          <Text style={styles.buttonText}>+{step}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#09090b', // zinc-950
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#27272a', // zinc-800
    marginBottom: 16,
  },
  label: {
    color: '#a1a1aa', // zinc-400
    fontSize: 14,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
    fontWeight: '600',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  button: {
    width: 80,
    height: 80,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  decrement: {
    backgroundColor: '#27272a', // zinc-800
  },
  increment: {
    backgroundColor: '#10b981', // emerald-500
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  valueContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  valueText: {
    color: '#ffffff',
    fontSize: 48,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  unitText: {
    color: '#a1a1aa',
    fontSize: 16,
    fontWeight: '600',
    marginTop: -4,
  }
});
