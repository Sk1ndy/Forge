import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Dimensions, Image, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import tw from '../src/styles/tailwind';
import { HapticService } from '../src/services/HapticService';

import { useOnboardingStore } from '../src/stores/onboarding.store';
import { TacticalSlider } from '../src/components/TacticalSlider';
import { SlideToValidate } from '../src/components/SlideToValidate';
import { GlassCard } from '../src/components/GlassCard';
import { CyberGrid } from '../src/components/CyberGrid';
import { AnthropometricSchema } from '../src/schemas/onboarding.schema';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * VesselScreen - "A.02 The Vessel - Biomechanical Calibration V4".
 * Dedicated standalone route screen.
 */
export default function VesselScreen() {
  const router = useRouter();
  const store = useOnboardingStore();

  // Step 2 Form States
  const [unitSystem, setUnitSystem] = useState<'metric' | 'imperial'>('metric');
  const [genderState, setGenderState] = useState<'man' | 'women' | 'other'>('man');
  const [age, setAge] = useState<number>(28);
  const [heightCm, setHeightCm] = useState<number>(185);
  const [weightKg, setWeightKg] = useState<number>(84.2);
  const [femurRatio, setFemurRatio] = useState<'short' | 'average' | 'long'>('average');
  const [armRatio, setArmRatio] = useState<'short' | 'average' | 'long'>('average');
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSaveVessel = async () => {
    // Map visual gender for Zod schema
    const genderMapped = genderState === 'women' ? 'female' : 'male';

    const rawData = {
      gender: genderMapped,
      age,
      heightCm: Math.round(heightCm),
      weightKg: Math.round(weightKg * 10) / 10,
      femurRatio,
      armRatio,
    };

    const validation = AnthropometricSchema.safeParse(rawData);

    if (!validation.success) {
      await HapticService.warning();
      setValidationError(validation.error.issues[0]?.message || 'Données invalides.');
      return;
    }

    await HapticService.success();
    setValidationError(null);
    store.setAnthropometry(validation.data);
    store.setCompleted(true);
    router.replace('/');
  };

  // Convert heights / weights based on system selection
  const displayHeight = unitSystem === 'metric' 
    ? heightCm 
    : Math.round(heightCm / 2.54);

  const displayWeight = unitSystem === 'metric' 
    ? weightKg 
    : Math.round(weightKg * 2.20462 * 10) / 10;

  const handleHeightChange = (val: number) => {
    if (unitSystem === 'metric') {
      setHeightCm(val);
    } else {
      setHeightCm(Math.round(val * 2.54));
    }
  };

  const handleWeightChange = (val: number) => {
    if (unitSystem === 'metric') {
      setWeightKg(val);
    } else {
      setWeightKg(val / 2.20462);
    }
  };

  return (
    <SafeAreaView style={tw`flex-1 bg-black`} edges={['top', 'left', 'right']}>
      {/* HUD Background Grid Reticles */}
      <CyberGrid />

      {/* TopAppBar - Recreated exactly from the mockup header */}
      <View style={tw`w-full h-16 border-b border-white/8 flex-row items-center px-5 bg-black z-50`}>
        <Text style={[tw`text-white text-xl font-bold tracking-tighter`, { fontFamily: 'Geist' }]}>
          FORGE
        </Text>
      </View>

      <ScrollView contentContainerStyle={tw`px-5 pt-6 pb-24`} showsVerticalScrollIndicator={false}>
        {/* Header Section */}
        <View style={tw`items-start mb-8`}>
          <Text style={[tw`text-[28px] font-bold text-white tracking-tighter uppercase`, { fontFamily: 'Geist' }]}>
            ANTHROPOMETRIC EVALUATION
          </Text>
        </View>

        <View style={tw`flex flex-col gap-6`}>
          {/* MEASUREMENT SYSTEM SWITCHER */}
          <View style={tw`flex flex-col gap-3`}>
            <Text style={[tw`text-[11px] text-zinc-400 tracking-[0.1em] font-bold`, { fontFamily: 'JetBrainsMono' }]}>MEASUREMENT SYSTEM</Text>
            <View style={tw`flex-row gap-1 bg-white/3 p-1 border border-white/8 rounded-xl h-12`}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={async () => {
                  await HapticService.select();
                  setUnitSystem('metric');
                }}
                style={[
                  tw`flex-1 items-center justify-center rounded-lg`,
                  unitSystem === 'metric' && tw`bg-white/10 border border-white/20`,
                ]}
              >
                <Text
                  style={[
                    tw`text-[10px] font-bold tracking-widest`,
                    { fontFamily: 'JetBrainsMono' },
                    unitSystem === 'metric' ? tw`text-white` : tw`text-zinc-400`,
                  ]}
                >
                  METRIC <Text style={tw`text-[8px] opacity-40`}>[KG/CM]</Text>
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={async () => {
                  await HapticService.select();
                  setUnitSystem('imperial');
                }}
                style={[
                  tw`flex-1 items-center justify-center rounded-lg`,
                  unitSystem === 'imperial' && tw`bg-white/10 border border-white/20`,
                ]}
              >
                <Text
                  style={[
                    tw`text-[10px] font-bold tracking-widest`,
                    { fontFamily: 'JetBrainsMono' },
                    unitSystem === 'imperial' ? tw`text-white` : tw`text-zinc-400`,
                  ]}
                >
                  IMPERIAL <Text style={tw`text-[8px] opacity-40`}>[LB/FT]</Text>
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* BIOLOGICAL ORIGIN */}
          <View style={tw`flex flex-col gap-3`}>
            <Text style={[tw`text-[11px] text-zinc-400 tracking-[0.1em] font-bold`, { fontFamily: 'JetBrainsMono' }]}>BIOLOGICAL ORIGIN</Text>
            <View style={tw`flex-row gap-2 bg-white/3 p-1 border border-white/8 rounded-xl`}>
              {(['man', 'women', 'other'] as const).map((g) => (
                <TouchableOpacity
                  key={g}
                  activeOpacity={0.8}
                  onPress={async () => {
                    await HapticService.select();
                    setGenderState(g);
                  }}
                  style={[
                    tw`flex-1 py-3 rounded-lg items-center justify-center`,
                    genderState === g && tw`bg-white/10 border border-white/20`,
                  ]}
                >
                  <Text
                    style={[
                      tw`text-[10px] font-bold tracking-widest uppercase`,
                      { fontFamily: 'JetBrainsMono' },
                      genderState === g ? tw`text-white` : tw`text-zinc-400`,
                    ]}
                  >
                    {g}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* CHRONOLOGICAL AGE */}
          <View style={tw`flex flex-col gap-3`}>
            <Text style={[tw`text-[11px] text-zinc-400 tracking-[0.1em] font-bold`, { fontFamily: 'JetBrainsMono' }]}>CHRONOLOGICAL AGE</Text>
            <GlassCard style={tw`flex-row items-center justify-between p-4 h-20 bg-white/3 border border-white/8 rounded-xl`}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={async () => {
                  await HapticService.step();
                  setAge((prev) => Math.max(14, prev - 1));
                }}
                style={tw`w-14 h-14 items-center justify-center bg-white/5 border border-white/10 rounded-full`}
              >
                <Ionicons name="remove" size={20} color="#ffffff" />
              </TouchableOpacity>
              
              <View style={tw`items-center justify-center`}>
                <Text style={[tw`text-4xl text-white font-bold leading-none`, { fontFamily: 'JetBrainsMono' }]}>{age}</Text>
                <Text style={[tw`text-[9px] text-zinc-400 mt-1 uppercase tracking-widest`, { fontFamily: 'JetBrainsMono' }]}>YEARS</Text>
              </View>

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={async () => {
                  await HapticService.step();
                  setAge((prev) => Math.min(100, prev + 1));
                }}
                style={tw`w-14 h-14 items-center justify-center bg-white/5 border border-white/10 rounded-full`}
              >
                <Ionicons name="add" size={20} color="#ffffff" />
              </TouchableOpacity>
            </GlassCard>
          </View>

          {/* STATURE */}
          <View style={tw`flex flex-col gap-3`}>
            <View style={tw`flex-row justify-between items-end`}>
              <Text style={[tw`text-[11px] text-zinc-400 tracking-[0.1em] font-bold`, { fontFamily: 'JetBrainsMono' }]}>STATURE</Text>
              <Text style={[tw`text-[14px] text-white font-bold`, { fontFamily: 'JetBrainsMono' }]}>
                {displayHeight}
                <Text style={tw`text-zinc-500 text-[11px] ml-1`}> {unitSystem === 'metric' ? 'cm' : 'in'}</Text>
              </Text>
            </View>
            <GlassCard style={tw`px-6 py-4 h-20 justify-center bg-white/3 border border-white/8 rounded-xl relative`}>
              <TacticalSlider
                min={unitSystem === 'metric' ? 140 : 55}
                max={unitSystem === 'metric' ? 220 : 86}
                value={displayHeight}
                onChange={handleHeightChange}
                unit={unitSystem === 'metric' ? 'cm' : 'in'}
              />
            </GlassCard>
          </View>

          {/* BODY MASS */}
          <View style={tw`flex flex-col gap-3`}>
            <View style={tw`flex-row justify-between items-end`}>
              <Text style={[tw`text-[11px] text-zinc-400 tracking-[0.1em] font-bold`, { fontFamily: 'JetBrainsMono' }]}>BODY MASS</Text>
              <Text style={[tw`text-[14px] text-white font-bold`, { fontFamily: 'JetBrainsMono' }]}>
                {displayWeight}
                <Text style={tw`text-zinc-500 text-[11px] ml-1`}> {unitSystem === 'metric' ? 'kg' : 'lbs'}</Text>
              </Text>
            </View>
            <GlassCard style={tw`px-6 py-4 h-20 justify-center bg-white/3 border border-white/8 rounded-xl relative`}>
              <TacticalSlider
                min={unitSystem === 'metric' ? 40 : 88}
                max={unitSystem === 'metric' ? 150 : 330}
                value={displayWeight}
                onChange={handleWeightChange}
                unit={unitSystem === 'metric' ? 'kg' : 'lbs'}
              />
            </GlassCard>
          </View>

          {/* ANATOMICAL REFERENCE (V4 image mockup layout) */}
          <View style={tw`flex flex-col gap-3`}>
            <Text style={[tw`text-[11px] text-zinc-400 tracking-[0.1em] font-bold`, { fontFamily: 'JetBrainsMono' }]}>ANATOMICAL REFERENCE</Text>
            <GlassCard style={tw`overflow-hidden bg-white/3 border border-white/8 rounded-xl items-center`}>
              <Image
                source={require('../assets/images/anatomical_reference_v4.png')}
                style={tw`w-full max-w-[280px] h-[340px] opacity-90`}
                resizeMode="contain"
              />
              <View style={tw`w-full py-2 bg-black/40 border-t border-white/8`}>
                <Text style={[tw`text-center text-[10px] text-zinc-400 tracking-widest uppercase`, { fontFamily: 'JetBrainsMono' }]}>
                  REAL-TIME KINETIC MODELING
                </Text>
              </View>
            </GlassCard>
          </View>

          {/* RATIOS & SURGICAL ALERT (Recreated exactly from CSS Grid structure) */}
          <View style={tw`flex-row flex-wrap gap-4`}>
            {/* Femur Ratio column (takes 47% width of parent) */}
            <View style={[tw`flex-col gap-3`, { width: '47%' }]}>
              <Text style={[tw`text-[10px] text-zinc-400 tracking-[0.1em] font-bold`, { fontFamily: 'JetBrainsMono' }]}>FEMUR RATIO</Text>
              <View style={tw`flex flex-col bg-white/3 border border-white/8 rounded-xl p-1`}>
                {(['short', 'average', 'long'] as const).map((r) => (
                  <TouchableOpacity
                    key={r}
                    activeOpacity={0.8}
                    onPress={async () => {
                      await HapticService.select();
                      setFemurRatio(r);
                    }}
                    style={[
                      tw`py-2 items-center justify-center rounded-lg mb-1`,
                      femurRatio === r && tw`bg-white/10 border border-white/20`,
                    ]}
                  >
                    <Text
                      style={[
                        tw`text-[10px] font-bold`,
                        { fontFamily: 'JetBrainsMono' },
                        femurRatio === r ? tw`text-white` : tw`text-zinc-400`,
                      ]}
                    >
                      {r === 'average' ? 'MED' : r.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Right side: Alert (if femur is long) or Humerus Ratio */}
            {femurRatio === 'long' ? (
              <>
                {/* Alert takes the second column slot in row 1 */}
                <View style={[tw`justify-center bg-red-950/20 border border-chirurgical-red/30 rounded-xl p-4 gap-2`, { width: '47%', height: 110 }]}>
                  <Ionicons name="warning" size={14} color="#ef4444" style={tw`self-center`} />
                  <Text style={[tw`font-bold text-chirurgical-red text-[8px] tracking-tighter uppercase text-center`, { fontFamily: 'JetBrainsMono' }]}>
                    WARN: HIGH LUMBAR SHEAR DETECTED
                  </Text>
                </View>

                {/* Humerus ratio wraps to row 2 column 1 */}
                <View style={[tw`flex-col gap-3 mt-4`, { width: '47%' }]}>
                  <Text style={[tw`text-[10px] text-zinc-400 tracking-[0.1em] font-bold`, { fontFamily: 'JetBrainsMono' }]}>HUMERUS RATIO</Text>
                  <View style={tw`flex flex-col bg-white/3 border border-white/8 rounded-xl p-1`}>
                    {(['short', 'average', 'long'] as const).map((r) => (
                      <TouchableOpacity
                        key={r}
                        activeOpacity={0.8}
                        onPress={async () => {
                          await HapticService.select();
                          setArmRatio(r);
                        }}
                        style={[
                          tw`py-2 items-center justify-center rounded-lg mb-1`,
                          armRatio === r && tw`bg-white/10 border border-white/20`,
                        ]}
                      >
                        <Text
                          style={[
                            tw`text-[10px] font-bold`,
                            { fontFamily: 'JetBrainsMono' },
                            armRatio === r ? tw`text-white` : tw`text-zinc-400`,
                          ]}
                        >
                          {r === 'average' ? 'MED' : r.toUpperCase()}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </>
            ) : (
              <>
                {/* Humerus ratio takes the second column slot in row 1 */}
                <View style={[tw`flex-col gap-3`, { width: '47%' }]}>
                  <Text style={[tw`text-[10px] text-zinc-400 tracking-[0.1em] font-bold`, { fontFamily: 'JetBrainsMono' }]}>HUMERUS RATIO</Text>
                  <View style={tw`flex flex-col bg-white/3 border border-white/8 rounded-xl p-1`}>
                    {(['short', 'average', 'long'] as const).map((r) => (
                      <TouchableOpacity
                        key={r}
                        activeOpacity={0.8}
                        onPress={async () => {
                          await HapticService.select();
                          setArmRatio(r);
                        }}
                        style={[
                          tw`py-2 items-center justify-center rounded-lg mb-1`,
                          armRatio === r && tw`bg-white/10 border border-white/20`,
                        ]}
                      >
                        <Text
                          style={[
                            tw`text-[10px] font-bold`,
                            { fontFamily: 'JetBrainsMono' },
                            armRatio === r ? tw`text-white` : tw`text-zinc-400`,
                          ]}
                        >
                          {r === 'average' ? 'MED' : r.toUpperCase()}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </>
            )}
          </View>

          {validationError && (
            <Text style={[tw`text-red-500 text-[11px] mt-2`, { fontFamily: 'JetBrainsMono' }]}>
              {validationError}
            </Text>
          )}

          {/* Slide to Confirm Action */}
          <View style={tw`mt-8`}>
            <SlideToValidate onValidate={handleSaveVessel} />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
