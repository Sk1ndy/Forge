import React from 'react';
import { Text, TextStyle } from 'react-native';
import tw from '../../styles/tailwind';

interface LabelProps extends React.ComponentPropsWithoutRef<typeof Text> {
  style?: TextStyle;
}

export const Label: React.FC<LabelProps> = ({ style, ...props }) => (
  <Text style={[tw`text-[10px] text-zinc-500 tracking-widest uppercase`, { fontFamily: 'JetBrainsMono-Bold' }, style]} {...props} />
);
