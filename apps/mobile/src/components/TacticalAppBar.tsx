import React from 'react';
import { View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import tw from '../styles/tailwind';
import { Button } from './ui/Button';

interface TacticalAppBarProps {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
}

export const TacticalAppBar: React.FC<TacticalAppBarProps> = ({
  title = 'FORGE // THE VESSEL',
  showBack = true,
  onBack,
}) => {
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  return (
    <View style={tw`flex-row justify-between items-center h-16 px-5 border-b border-white/5 z-10`}>
      {showBack ? (
        <Button 
          variant="ghost" 
          onPress={handleBack}
          style={tw`flex-row items-center justify-center w-10 h-10 px-0 py-0`}
        >
          <Feather name="chevron-left" size={22} color="white" />
        </Button>
      ) : (
        <View style={tw`w-12`} />
      )}
      <Text style={[tw`text-white text-xs tracking-widest`, { fontFamily: 'JetBrainsMono-Bold' }]}>
        {title.toUpperCase()}
      </Text>
    </View>
  );
};

export default TacticalAppBar;
