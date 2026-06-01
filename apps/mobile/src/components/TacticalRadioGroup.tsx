import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { HapticService } from '../services/HapticService';

export interface RadioOption {
  id: string;
  label: string;
}

interface TacticalRadioGroupProps {
  label: string;
  options: RadioOption[];
  selectedValue: string;
  onSelect: (value: string) => void;
  direction?: 'row' | 'column';
}

export function TacticalRadioGroup({ label, options, selectedValue, onSelect, direction = 'row' }: TacticalRadioGroupProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.optionsContainer, direction === 'column' ? styles.column : styles.row]}>
        {options.map((opt) => {
          const isActive = selectedValue === opt.id;
          return (
            <TouchableOpacity
              key={opt.id}
              activeOpacity={0.8}
              onPress={() => {
                if (!isActive) {
                  HapticService.select().catch(() => {});
                  onSelect(opt.id);
                }
              }}
              style={[
                styles.option,
                isActive && styles.optionActive,
                direction === 'row' && { flex: 1 },
              ]}
            >
              {isActive && <View style={styles.activeIndicator} />}
              <Text style={[styles.optionText, isActive && styles.optionTextActive]}>
                {opt.label.toUpperCase()}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  label: {
    fontSize: 9,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: '#a1a1aa',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  optionsContainer: {
    gap: 8,
  },
  row: {
    flexDirection: 'row',
  },
  column: {
    flexDirection: 'column',
  },
  option: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 8,
    paddingHorizontal: 16,
  },
  optionActive: {
    borderColor: '#ffffff',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  activeIndicator: {
    position: 'absolute',
    left: 12,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ffffff',
  },
  optionText: {
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontWeight: '700',
    color: '#a1a1aa',
    letterSpacing: 1.5,
  },
  optionTextActive: {
    color: '#ffffff',
  },
});
