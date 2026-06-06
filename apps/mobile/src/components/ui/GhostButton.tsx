import React from 'react';
import { TouchableOpacity, Text, TouchableOpacityProps } from 'react-native';
import tw from 'twrnc';

interface GhostButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'default' | 'danger' | 'success';
}

export const GhostButton: React.FC<GhostButtonProps> = ({ title, variant = 'default', style, ...props }) => {
  const getTextColor = () => {
    switch (variant) {
      case 'danger':
        return tw`text-[#EF4444]`;
      case 'success':
        return tw`text-[#10B981]`;
      default:
        return tw`text-white`;
    }
  };

  return (
    <TouchableOpacity
      style={[
        tw`bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] rounded-2xl py-4 px-6 items-center justify-center flex-row`,
        style
      ]}
      activeOpacity={0.7}
      {...props}
    >
      <Text style={[tw`font-['Geist-Bold'] text-sm tracking-widest uppercase`, getTextColor()]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
};
