import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, Platform, TextInputProps } from 'react-native';
import { HapticService } from '../services/HapticService';

interface TacticalInputProps extends TextInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  suffix?: string;
}

export function TacticalInput({ label, value, onChangeText, suffix, ...rest }: TacticalInputProps) {
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = (e: any) => {
    HapticService.select().catch(() => {});
    setIsFocused(true);
    if (rest.onFocus) rest.onFocus(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    if (rest.onBlur) rest.onBlur(e);
  };

  return (
    <View style={[styles.container, isFocused && styles.containerFocused]}>
      <Text style={[styles.label, isFocused && styles.labelFocused]}>{label}</Text>
      <View style={styles.inputWrapper}>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholderTextColor="rgba(255, 255, 255, 0.2)"
          {...rest}
        />
        {suffix && <Text style={styles.suffix}>{suffix}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 64,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 6,
    justifyContent: 'center',
  },
  containerFocused: {
    borderColor: 'rgba(255, 255, 255, 0.6)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  label: {
    fontSize: 9,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: '#a1a1aa',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  labelFocused: {
    color: '#ffffff',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 2,
  },
  input: {
    flex: 1,
    color: '#ffffff',
    fontSize: 18,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontWeight: '700',
    padding: 0,
    margin: 0,
  },
  suffix: {
    color: '#a1a1aa',
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginLeft: 8,
  },
});
