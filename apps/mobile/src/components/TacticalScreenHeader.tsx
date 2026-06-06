import React from 'react';
import { View, Text } from 'react-native';
import tw from '../styles/tailwind';

interface TacticalScreenHeaderProps {
  title: string;
  subtitle?: string;
}

export const TacticalScreenHeader: React.FC<TacticalScreenHeaderProps> = ({
  title,
  subtitle,
}) => {
  return (
    <View style={tw`gap-1 mb-2`}>
      <Text style={[tw`text-white text-2xl tracking-tighter`, { fontFamily: 'Geist-Bold' }]}>
        {title.toUpperCase()}
      </Text>
      {subtitle ? (
        <Text style={[tw`text-zinc-500 text-[9px] tracking-widest uppercase`, { fontFamily: 'JetBrainsMono' }]}>
          {subtitle.toUpperCase()}
        </Text>
      ) : null}
    </View>
  );
};

export default TacticalScreenHeader;
