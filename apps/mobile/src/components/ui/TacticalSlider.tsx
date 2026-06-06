import React from 'react';
import { View, Text } from 'react-native';
import tw from 'twrnc';

interface TacticalSliderProps {
  value: number;
  min?: number;
  max?: number;
  label: string;
}

export const TacticalSlider: React.FC<TacticalSliderProps> = ({ value, min = 0, max = 100, label }) => {
  const percentage = Math.min(Math.max((value - min) / (max - min) * 100, 0), 100);

  return (
    <View style={tw`w-full mb-4`}>
      <View style={tw`flex-row justify-between mb-2`}>
        <Text style={tw`font-['Geist'] text-zinc-400 text-xs uppercase tracking-widest`}>{label}</Text>
        <Text style={tw`font-['JetBrainsMono-Bold'] text-white text-xs`}>{value}</Text>
      </View>
      <View style={tw`h-1 bg-[rgba(255,255,255,0.08)] rounded-full w-full relative overflow-hidden`}>
        <View style={[tw`absolute left-0 top-0 bottom-0 bg-white`, { width: `${percentage}%` }]} />
      </View>
    </View>
  );
};
