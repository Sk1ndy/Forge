import React from 'react';
import { View, ViewProps } from 'react-native';
import tw from 'twrnc';

interface SquarcleCardProps extends ViewProps {
  children: React.ReactNode;
}

export const SquarcleCard: React.FC<SquarcleCardProps> = ({ children, style, ...props }) => {
  return (
    <View
      style={[
        tw`bg-[#131313] border border-[rgba(255,255,255,0.08)] rounded-3xl p-4`,
        style
      ]}
      {...props}
    >
      {children}
    </View>
  );
};
