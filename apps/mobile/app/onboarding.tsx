import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Dimensions, Animated, Easing, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Defs, RadialGradient, Stop, Rect, LinearGradient } from 'react-native-svg';
import tw from '../src/styles/tailwind';
import { HapticService } from '../src/services/HapticService';

import { useOnboardingStore } from '../src/stores/onboarding.store';
import { TacticalSlider } from '../src/components/TacticalSlider';
import { SlideToValidate } from '../src/components/SlideToValidate';
import { GlassCard } from '../src/components/GlassCard';
import { CyberGrid } from '../src/components/CyberGrid';
import { AnthropometricSchema } from '../src/schemas/onboarding.schema';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * OnboardingScreen - Two-step onboarding wizard for Forge "Work".
 * - Step 1: "A.01 The Spark" (Tactical HUD Cockpit)
 * - Step 2: "A.02 The Vessel" (Biomechanical Calibration V4)
 */
export default function OnboardingScreen() {
  const router = useRouter();
  const store = useOnboardingStore();

  // Navigation steps: 1 (Spark) or 2 (Vessel)
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);

  // Animated Scan Beam for Step 1
  const scanAnim = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    if (currentStep === 1) {
      scanAnim.setValue(-100);
      Animated.loop(
        Animated.timing(scanAnim, {
          toValue: SCREEN_HEIGHT,
          duration: 8000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();
    }
  }, [currentStep, scanAnim]);

  // ==========================================
  // STEP 2 STATE : THE VESSEL V4
  // ==========================================
  const [unitSystem, setUnitSystem] = useState<'metric' | 'imperial'>('metric');
  const [genderState, setGenderState] = useState<'man' | 'women' | 'other'>('man');
  const [age, setAge] = useState<number>(28);
  const [heightCm, setHeightCm] = useState<number>(185);
  const [weightKg, setWeightKg] = useState<number>(84.2);
  const [femurRatio, setFemurRatio] = useState<'short' | 'average' | 'long'>('average');
  const [armRatio, setArmRatio] = useState<'short' | 'average' | 'long'>('average');
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleStartCalibration = async () => {
    await HapticService.select();
    setCurrentStep(2);
  };

  const handleSaveVessel = async () => {
    // Map visual gender for strict Zod schema validation (male/female)
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

  // Unit display helpers
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
    <SafeAreaView style={tw`flex-1 bg-black`}>
      {currentStep === 1 ? (
        /* SCREEN A.01 : THE SPARK (Full-screen HUD Cockpit) */
        <View style={tw`flex-1 w-full h-full bg-black relative justify-center items-center`}>
          {/* Background Skeletal Scan */}
          <Image
            source={require('../assets/images/spark_background.png')}
            style={tw`absolute w-full h-full opacity-40`}
            resizeMode="cover"
          />

          {/* SVG Radial Gradient Vignette Overlay */}
          <Svg style={tw`absolute inset-0`} pointerEvents="none">
            <Defs>
              <RadialGradient
                id="radial-vignette"
                cx="50%"
                cy="50%"
                rx="65%"
                ry="65%"
                fx="50%"
                fy="50%"
              >
                <Stop offset="0%" stopColor="#000000" stopOpacity="0" />
                <Stop offset="45%" stopColor="#000000" stopOpacity="0.25" />
                <Stop offset="80%" stopColor="#000000" stopOpacity="0.85" />
                <Stop offset="100%" stopColor="#000000" stopOpacity="1" />
              </RadialGradient>
            </Defs>
            <Rect x="0" y="0" width="100%" height="100%" fill="url(#radial-vignette)" />
          </Svg>

          {/* HUD Overlay Layers */}
          <View style={tw`absolute inset-0 pointer-events-none z-10 overflow-hidden`} pointerEvents="none">
            {/* Center Crosshairs */}
            <View style={tw`absolute left-0 right-0 top-1/2 h-[1px] bg-white/10`} />
            <View style={tw`absolute top-0 bottom-0 left-1/2 w-[1px] bg-white/10`} />
            
            {/* 60 FPS Vector Scanline Animation */}
            <Animated.View
              style={[
                tw`absolute left-0 right-0 h-[100px]`,
                {
                  transform: [{ translateY: scanAnim }],
                  pointerEvents: 'none',
                }
              ]}
            >
              <Svg height="100" width="100%">
                <Defs>
                  <LinearGradient id="scanGrad" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
                    <Stop offset="50%" stopColor="#ffffff" stopOpacity="0.05" />
                    <Stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
                  </LinearGradient>
                </Defs>
                <Rect width="100%" height="100%" fill="url(#scanGrad)" />
              </Svg>
            </Animated.View>
            
            {/* Frame Corners */}
            <View style={tw`absolute top-4 right-4 w-12 h-12 border-t-2 border-r-2 border-white`} />
            <View style={tw`absolute bottom-4 left-4 w-12 h-12 border-b-2 border-l-2 border-white`} />
            <View style={tw`absolute bottom-4 right-4 w-12 h-12 border-b-2 border-r-2 border-white`} />
          </View>

          {/* Central Branding */}
          <View style={tw`flex-1 justify-center items-center z-20 px-5 pb-24`}>
            <View style={tw`items-center w-full`}>
              <Text style={[tw`text-white text-[48px] font-bold tracking-[0.4em] mb-2 text-center`, { fontFamily: 'Geist' }]}>FORGE</Text>
              <View style={tw`w-48 h-[1px] bg-white/30 mb-6`} />
              <Text style={[tw`text-white/60 text-[10px] tracking-[0.3em] text-center uppercase`, { fontFamily: 'JetBrainsMono' }]}>BIOMECHANICAL SIMULATION ENGINE</Text>
            </View>
          </View>

          {/* Bottom Left Telemetry */}
          <View style={tw`absolute bottom-28 left-6 z-40`} pointerEvents="none">
            <Text style={[tw`text-zinc-400/60 text-[9px] tracking-[0.2em] uppercase`, { fontFamily: 'JetBrainsMono' }]}>UPLINK: SECURE</Text>
          </View>

          {/* Fixed Glass Footer */}
          <View style={tw`absolute bottom-0 left-0 right-0 p-6 md:p-8 bg-black/40 border-t border-white/10 z-30`}>
            <View style={tw`max-w-md mx-auto w-full flex flex-col items-center gap-6`}>
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={handleStartCalibration}
                style={[
                  tw`w-full h-14 bg-white items-center justify-center rounded-full relative`,
                  {
                    shadowColor: '#ffffff',
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 0.35,
                    shadowRadius: 15,
                    elevation: 6,
                  }
                ]}
              >
                <Text style={[tw`text-black font-bold text-sm tracking-[0.2em]`, { fontFamily: 'Geist' }]}>INITIATE EVALUATION</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={async () => {
                  await HapticService.select();
                  router.push('/login');
                }}
                style={tw`py-2`}
              >
                <Text style={[tw`text-white/60 text-[10px] tracking-[0.2em] uppercase`, { fontFamily: 'JetBrainsMono' }]}>Existing Member / Login</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      ) : (
        /* SCREEN A.02 : THE VESSEL (Biomechanical Calibration V4) */
        <View style={tw`flex-1 bg-black`}>
          <CyberGrid />

          <ScrollView contentContainerStyle={tw`px-6 pt-6 pb-20`} showsVerticalScrollIndicator={false}>
            {/* Header Section */}
            <View style={tw`items-center mb-6`}>
              <Text style={[tw`text-[24px] font-bold text-white tracking-tighter text-center uppercase`, { fontFamily: 'Geist' }]}>
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

              {/* ANATOMICAL REFERENCE IMAGE PANEL (V4) */}
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

              {/* RATIOS */}
              <View style={tw`flex-row gap-4`}>
                <View style={tw`flex-1 flex flex-col gap-3`}>
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
                          tw`py-2.5 items-center justify-center rounded-lg mb-1`,
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

                <View style={tw`flex-1 flex flex-col gap-3`}>
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
                          tw`py-2.5 items-center justify-center rounded-lg mb-1`,
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
              </View>

              {/* SURGICAL ALERT (shown dynamically when Femur Ratio is LONG) */}
              {femurRatio === 'long' && (
                <View style={tw`py-3 px-4 bg-red-950/20 border border-chirurgical-red/30 rounded-lg flex-row items-center justify-center gap-2 mt-3`}>
                  <Ionicons name="warning" size={14} color="#ef4444" />
                  <Text style={[tw`font-bold text-chirurgical-red text-[10px] tracking-tighter uppercase`, { fontFamily: 'JetBrainsMono' }]}>
                    WARN: HIGH LUMBAR SHEAR DETECTED
                  </Text>
                </View>
              )}

              {validationError && (
                <Text style={[tw`text-red-500 text-[11px] mt-2`, { fontFamily: 'JetBrainsMono' }]}>
                  {validationError}
                </Text>
              )}

              {/* Slide to Confirm Action */}
              <View style={tw`mt-6`}>
                <SlideToValidate onValidate={handleSaveVessel} />
              </View>
            </View>
          </ScrollView>
        </View>
      )}
    </SafeAreaView>
  );
}
