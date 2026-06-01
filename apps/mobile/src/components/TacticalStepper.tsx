import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { HapticService } from '../services/HapticService';

interface TacticalStepperProps {
  label: string;
  value: number;
  onIncrement: () => void;
  onDecrement: () => void;
  suffix?: string;
  min?: number;
  max?: number;
}

export function TacticalStepper({ label, value, onIncrement, onDecrement, suffix = '', min = 0, max = 100 }: TacticalStepperProps) {
  const handleDec = () => {
    if (value > min) {
      HapticService.step().catch(() => {});
      onDecrement();
    } else {
      HapticService.warning().catch(() => {});
    }
  };

  const handleInc = () => {
    if (value < max) {
      HapticService.step().catch(() => {});
      onIncrement();
    } else {
      HapticService.warning().catch(() => {});
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.stepperControls}>
        <TouchableOpacity 
          activeOpacity={0.7} 
          onPress={handleDec} 
          style={[styles.btn, value <= min && styles.btnDisabled]}
        >
          <Ionicons name="remove" size={24} color={value <= min ? 'rgba(255,255,255,0.2)' : '#ffffff'} />
        </TouchableOpacity>
        
        <View style={styles.valueContainer}>
          <Text style={styles.value}>{value}</Text>
          {suffix ? <Text style={styles.suffix}>{suffix}</Text> : null}
        </View>

        <TouchableOpacity 
          activeOpacity={0.7} 
          onPress={handleInc} 
          style={[styles.btn, value >= max && styles.btnDisabled]}
        >
          <Ionicons name="add" size={24} color={value >= max ? 'rgba(255,255,255,0.2)' : '#ffffff'} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 16,
    gap: 12,
  },
  label: {
    fontSize: 9,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: '#a1a1aa',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  stepperControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#000000',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 6,
    padding: 4,
  },
  btn: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 4,
  },
  btnDisabled: {
    backgroundColor: 'transparent',
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  value: {
    fontSize: 24,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontWeight: '700',
    color: '#ffffff',
  },
  suffix: {
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: '#a1a1aa',
  },
});
