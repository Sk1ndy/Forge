import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { HapticService } from '../services/HapticService';

interface TacticalStepperProps {
  value: number;
  onIncrement: () => void;
  onDecrement: () => void;
  suffix?: string;
  min?: number;
  max?: number;
  onChange?: (val: number) => void;
  onEditStateChange?: (editing: boolean) => void;
}

export function TacticalStepper({
  value,
  onIncrement,
  onDecrement,
  suffix = '',
  min = 0,
  max = 100,
  onChange,
  onEditStateChange,
}: TacticalStepperProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(value.toString());

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

  const handleSubmit = () => {
    setIsEditing(false);
    onEditStateChange?.(false);
    const parsed = parseInt(inputValue.trim(), 10);
    if (!isNaN(parsed) && onChange) {
      const clamped = Math.max(min, Math.min(max, parsed));
      onChange(clamped);
      HapticService.select().catch(() => {});
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        activeOpacity={0.7} 
        onPress={handleDec} 
        style={[styles.btn, value <= min && styles.btnDisabled]}
      >
        <Feather name="minus" size={18} color={value <= min ? 'rgba(255,255,255,0.15)' : '#ffffff'} />
      </TouchableOpacity>
      
      <View style={styles.valueContainer}>
        {isEditing ? (
          <TextInput
            style={[styles.input, { width: Math.max(40, inputValue.length * 14) }]}
            value={inputValue}
            onChangeText={setInputValue}
            onBlur={handleSubmit}
            onSubmitEditing={handleSubmit}
            autoFocus
            keyboardType="numeric"
            returnKeyType="done"
            selectTextOnFocus
          />
        ) : (
          <TouchableOpacity
            onPress={() => {
              setInputValue(value.toString());
              setIsEditing(true);
              onEditStateChange?.(true);
              HapticService.select().catch(() => {});
            }}
            activeOpacity={0.7}
            style={styles.valueWrapper}
          >
            <Text style={styles.value}>{value}</Text>
          </TouchableOpacity>
        )}
        {suffix ? <Text style={styles.suffix}>{suffix.toUpperCase()}</Text> : null}
      </View>

      <TouchableOpacity 
        activeOpacity={0.7} 
        onPress={handleInc} 
        style={[styles.btn, value >= max && styles.btnDisabled]}
      >
        <Feather name="plus" size={18} color={value >= max ? 'rgba(255,255,255,0.15)' : '#ffffff'} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    paddingHorizontal: 12,
    height: 60,
    width: '100%',
  },
  btn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  btnDisabled: {
    opacity: 0.3,
  },
  valueContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
  },
  valueWrapper: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.3)',
    paddingBottom: 2,
  },
  value: {
    fontSize: 22,
    fontFamily: 'JetBrainsMono-Bold',
    fontWeight: '700',
    color: '#ffffff',
    lineHeight: 26,
  },
  input: {
    fontSize: 22,
    fontFamily: 'JetBrainsMono-Bold',
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    padding: 0,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.6)',
  },
  suffix: {
    fontSize: 7,
    fontFamily: 'JetBrainsMono',
    color: 'rgba(255, 255, 255, 0.25)',
    letterSpacing: 1,
    marginTop: 1,
  },
});

export default TacticalStepper;
