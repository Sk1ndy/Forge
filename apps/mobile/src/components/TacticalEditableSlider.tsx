import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput } from 'react-native';
import tw from '../styles/tailwind';
import { Label } from './ui/Label';
import { TacticalSlider } from './TacticalSlider';
import { HapticService } from '../services/HapticService';

interface TacticalEditableSliderProps {
  label: string;
  displayValue: React.ReactNode; // Can be string or React nodes (e.g. styled units)
  value: number; // Current value passed to the slider
  min: number;
  max: number;
  unit: string;
  onChange: (val: number) => void;
  onKeyboardSubmit: (text: string) => void;
  keyboardType?: 'numeric' | 'default' | 'decimal-pad';
  getInitialInputValue: () => string; // Function to get value to prefill in input
  onEditStateChange?: (editing: boolean) => void;
}

export const TacticalEditableSlider: React.FC<TacticalEditableSliderProps> = ({
  label,
  displayValue,
  value,
  min,
  max,
  unit,
  onChange,
  onKeyboardSubmit,
  keyboardType = 'numeric',
  getInitialInputValue,
  onEditStateChange,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState('');

  const handlePressEdit = () => {
    setInputValue(getInitialInputValue());
    setIsEditing(true);
    if (onEditStateChange) onEditStateChange(true);
    HapticService.select().catch(() => {});
  };

  const handleSubmit = () => {
    setIsEditing(false);
    if (onEditStateChange) onEditStateChange(false);
    onKeyboardSubmit(inputValue);
  };

  return (
    <View style={tw`gap-3`}>
      <View style={tw`flex-row justify-between items-center`}>
        <Label>{label}</Label>
        {isEditing ? (
          <TextInput
            style={[
              tw`text-right text-sm font-bold text-white px-1 py-0.5 border-b border-zinc-500`,
              { 
                fontFamily: 'JetBrainsMono-Bold',
                width: Math.max(32, inputValue.length * 9.5)
              }
            ]}
            value={inputValue}
            onChangeText={setInputValue}
            onBlur={handleSubmit}
            onSubmitEditing={handleSubmit}
            autoFocus
            keyboardType={keyboardType}
            returnKeyType="done"
            selectTextOnFocus
          />
        ) : (
          <TouchableOpacity
            onPress={handlePressEdit}
            activeOpacity={0.7}
            style={tw`border-b border-zinc-700 pb-0.5`}
          >
            <Text style={[tw`text-sm font-bold text-white`, { fontFamily: 'JetBrainsMono-Bold' }]}>
              {displayValue}
            </Text>
          </TouchableOpacity>
        )}
      </View>
      <TacticalSlider
        min={min}
        max={max}
        value={value}
        unit={unit}
        onChange={onChange}
      />
    </View>
  );
};

export default TacticalEditableSlider;
