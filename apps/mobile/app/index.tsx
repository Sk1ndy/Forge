import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, Text, TouchableOpacity, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import tw from '../src/styles/tailwind';
import { useOnboardingStore } from '../src/stores/onboarding.store';
import { GlassCard } from '../src/components/GlassCard';
import { TacticalFlicker } from '../src/components/TacticalFlicker';
import { HapticService } from '../src/services/HapticService';
import { Ionicons } from '@expo/vector-icons';
import { CyberGrid } from '../src/components/CyberGrid';

/**
 * IndexRouter - Tactical Telemetry Entry Point of Forge Mobile.
 * Automatically handles routing to onboarding calibration if incomplete,
 * otherwise presents the premium performance dashboard.
 */
export default function IndexRouter() {
  const router = useRouter();
  const { completed, reset, anthropometry } = useOnboardingStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    if (!completed) {
      router.replace('/onboarding');
    }
  }, [completed, mounted]);

  const handleResetCalibration = async () => {
    await HapticService.warning();
    reset();
  };

  if (!mounted || !completed) {
    return (
      <View style={tw`flex-1 bg-black justify-center items-center`}>
        <ActivityIndicator size="large" color="#ffffff" />
      </View>
    );
  }

  return (
    <SafeAreaView style={tw`flex-1 bg-black`}>
      <CyberGrid />
      <View style={tw`flex-1 justify-center p-4`}>
        <GlassCard style={tw`p-6 items-center gap-5 bg-white/3 border border-white/8 rounded-2xl`}>
          <TacticalFlicker style={tw`text-[18px] font-bold text-white tracking-[0.15em] text-center`} fontType="sans">
            FORGE // TELEMETRY_HUD
          </TacticalFlicker>
          
          <View style={tw`flex-row items-center gap-2`}>
            <View style={tw`w-1.5 h-1.5 rounded-full bg-[#10b981]`} />
            <TacticalFlicker style={tw`text-[10px] text-zinc-400 tracking-[0.15em] font-mono`} fontType="mono">
              SYSTEM: ONLINE // CALIBRATION_COMPLETE
            </TacticalFlicker>
          </View>

          <View style={tw`w-full p-4 border border-white/5 rounded-lg bg-white/1 gap-2`}>
            <Text style={tw`text-zinc-400 font-mono text-[11px] text-center`}>
              G: {anthropometry?.gender === 'male' ? 'MASCULIN' : 'FÉMININ'} // A: {anthropometry?.age} ANS
            </Text>
            <Text style={tw`text-zinc-400 font-mono text-[11px] text-center`}>
              T: {anthropometry?.heightCm} CM // P: {anthropometry?.weightKg} KG
            </Text>
            <Text style={tw`text-zinc-400 font-mono text-[11px] text-center`}>
              LEVIERS SQUELETTIQUES : FÉMUR {anthropometry?.femurRatio?.toUpperCase()}
            </Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.9}
            onPress={handleResetCalibration}
            style={tw`flex-row h-12 w-full rounded-lg border border-red-500/20 bg-red-500/3 items-center justify-center`}
          >
            <Ionicons name="refresh" size={16} color="#ef4444" style={tw`mr-1.5`} />
            <Text style={tw`text-[#ef4444] font-bold text-[12px] tracking-wider`}>RÉINITIALISER LA CALIBRATION</Text>
          </TouchableOpacity>
        </GlassCard>
      </View>
    </SafeAreaView>
  );
}
