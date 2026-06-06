import React from 'react';
import { TouchableOpacity, Text, ViewStyle, TextStyle } from 'react-native';
import tw from '../../styles/tailwind';

interface ButtonProps {
  onPress: () => void;
  children: React.ReactNode;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost';
  style?: ViewStyle;
  textStyle?: TextStyle;
  disabled?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  onPress,
  children,
  variant = 'default',
  style,
  textStyle,
  disabled = false,
}) => {
  let bgStyle = tw`bg-white border border-transparent`;
  let labelColor = tw`text-black`;

  if (variant === 'outline') {
    bgStyle = tw`bg-transparent border border-white/10`;
    labelColor = tw`text-white`;
  } else if (variant === 'secondary') {
    bgStyle = tw`bg-zinc-900 border border-white/5`;
    labelColor = tw`text-zinc-300`;
  } else if (variant === 'ghost') {
    bgStyle = tw`bg-transparent border border-transparent`;
    labelColor = tw`text-zinc-400`;
  }

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      disabled={disabled}
      onPress={onPress}
      style={[
        tw`w-full h-12 rounded-full items-center justify-center flex-row gap-2`,
        bgStyle,
        disabled && tw`opacity-50`,
        style,
      ]}
    >
      <Text style={[tw`text-xs tracking-widest font-bold uppercase`, labelColor, { fontFamily: 'JetBrainsMono-Bold' }, textStyle]}>
        {children}
      </Text>
    </TouchableOpacity>
  );
};
export default Button;
