import React from 'react';
import { View, Text, TouchableOpacity, ViewStyle } from 'react-native';
import tw from '../../styles/tailwind';

interface TabsProps {
  style?: ViewStyle;
  children: React.ReactNode;
}

export const Tabs: React.FC<TabsProps> = ({ style, children }) => (
  <View style={[tw`flex-row bg-transparent p-1 border border-white/5 rounded-xl h-11`, style]}>
    {children}
  </View>
);

interface TabsTriggerProps {
  isActive: boolean;
  onPress: () => void;
  children: React.ReactNode;
  style?: ViewStyle;
}

export const TabsTrigger: React.FC<TabsTriggerProps> = ({ isActive, onPress, children, style }) => (
  <TouchableOpacity
    activeOpacity={0.8}
    onPress={onPress}
    style={[
      tw`flex-1 items-center justify-center rounded-lg h-8`,
      isActive ? tw`bg-zinc-900 border border-white/10` : tw`bg-transparent border border-transparent`,
      style
    ]}
  >
    <Text
      style={[
        tw`text-[10px] font-bold tracking-widest`,
        isActive ? tw`text-white` : tw`text-zinc-500`,
        { fontFamily: 'JetBrainsMono-Bold' }
      ]}
    >
      {children}
    </Text>
  </TouchableOpacity>
);
