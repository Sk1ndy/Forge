import React from 'react';
import { View, Text, ViewStyle, TextStyle } from 'react-native';
import tw from '../../styles/tailwind';

interface CardProps extends React.ComponentPropsWithoutRef<typeof View> {
  style?: ViewStyle;
}

export const Card: React.FC<CardProps> = ({ style, ...props }) => (
  <View style={[tw`rounded-2xl border border-white/5 bg-zinc-900/40 shadow-sm overflow-hidden`, style]} {...props} />
);

export const CardHeader: React.FC<CardProps> = ({ style, ...props }) => (
  <View style={[tw`flex flex-col space-y-1.5 p-5 border-b border-white/5`, style]} {...props} />
);

export const CardTitle: React.FC<React.ComponentPropsWithoutRef<typeof Text> & { style?: TextStyle }> = ({ style, ...props }) => (
  <Text style={[tw`text-xs font-bold tracking-widest text-zinc-400`, { fontFamily: 'JetBrainsMono-Bold' }, style]} {...props} />
);

export const CardDescription: React.FC<React.ComponentPropsWithoutRef<typeof Text> & { style?: TextStyle }> = ({ style, ...props }) => (
  <Text style={[tw`text-[9px] text-zinc-600 tracking-wider uppercase`, { fontFamily: 'JetBrainsMono' }, style]} {...props} />
);

export const CardContent: React.FC<CardProps> = ({ style, ...props }) => (
  <View style={[tw`p-5 gap-5`, style]} {...props} />
);

export const CardFooter: React.FC<CardProps> = ({ style, ...props }) => (
  <View style={[tw`flex-row items-center justify-between p-5 pt-0 border-t border-white/5`, style]} {...props} />
);
