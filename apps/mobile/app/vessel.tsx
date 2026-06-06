import React, { useState } from 'react';
import { View, Text, ScrollView, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import tw from '../src/styles/tailwind';
import { HapticService } from '../src/services/HapticService';
import { useOnboardingStore } from '../src/stores/onboarding.store';
import { AnthropometricSchema } from '../src/schemas/onboarding.schema';
import { SlideToValidate } from '../src/components/SlideToValidate';
import { CyberGrid } from '../src/components/CyberGrid';

// Custom components
import { TacticalStepper } from '../src/components/TacticalStepper';
import { TacticalAppBar } from '../src/components/TacticalAppBar';
import { TacticalScreenHeader } from '../src/components/TacticalScreenHeader';
import { TacticalEditableSlider } from '../src/components/TacticalEditableSlider';
import { useAuthStore } from '../src/stores/auth.store';
import { saveUserProfile } from '../src/lib/supabase';

// React Native Reusables styled components
import { Label } from '../src/components/ui/Label';
import { Tabs, TabsTrigger } from '../src/components/ui/Tabs';
import { Button } from '../src/components/ui/Button';

export default function VesselScreen() {
  const router = useRouter();
  const { setAnthropometry } = useOnboardingStore();

  // Local Form States
  const [isMetric, setIsMetric] = useState(true);
  const [genderChoice, setGenderChoice] = useState<'MAN' | 'WOMEN' | 'OTHER'>('MAN');
  const [age, setAge] = useState(28);
  const [heightCm, setHeightCm] = useState(185);
  const [weightKg, setWeightKg] = useState(84.2);

  // Keyboard Edit States
  const [isEditingHeight, setIsEditingHeight] = useState(false);
  const [isEditingWeight, setIsEditingWeight] = useState(false);
  const [isEditingAge, setIsEditingAge] = useState(false);

  const parseHeightInput = (input: string): number | null => {
    const trimmed = input.trim();
    if (!isMetric) {
      const ftInRegex = /^(\d+)'(\d+)"?$/;
      const match = trimmed.match(ftInRegex);
      if (match) {
        const feet = parseInt(match[1], 10);
        const inches = parseInt(match[2], 10);
        const totalInches = feet * 12 + inches;
        return totalInches * 2.54;
      }
      const num = parseFloat(trimmed);
      if (!isNaN(num) && num > 0) {
        return num * 2.54;
      }
      return null;
    } else {
      const num = parseFloat(trimmed);
      if (!isNaN(num) && num > 0) {
        return num;
      }
      return null;
    }
  };

  const handleHeightSubmit = (text: string) => {
    const parsed = parseHeightInput(text);
    if (parsed !== null) {
      const clampedVal = Math.max(100, Math.min(250, parsed));
      setHeightCm(Math.round(clampedVal));
      HapticService.select().catch(() => {});
    }
  };

  const parseWeightInput = (input: string): number | null => {
    const trimmed = input.trim();
    const num = parseFloat(trimmed);
    if (!isNaN(num) && num > 0) {
      if (!isMetric) {
        return num / 2.20462;
      }
      return num;
    }
    return null;
  };

  const handleWeightSubmit = (text: string) => {
    const parsed = parseWeightInput(text);
    if (parsed !== null) {
      const clampedVal = Math.max(30, Math.min(300, parsed));
      setWeightKg(clampedVal);
      HapticService.select().catch(() => {});
    }
  };

  // Conversion Helpers
  const cmToFtIn = (cm: number) => {
    const inches = cm / 2.54;
    const feet = Math.floor(inches / 12);
    const remainingInches = Math.round(inches % 12);
    return `${feet}'${remainingInches}"`;
  };

  const kgToLbs = (kg: number) => {
    return Math.round(kg * 2.20462);
  };

  const handleSaveVessel = async () => {
    const rawData = {
      gender: genderChoice === 'WOMEN' ? 'female' : 'male',
      age,
      heightCm: Math.round(heightCm),
      weightKg: parseFloat(weightKg.toFixed(1)),
    };

    const validation = AnthropometricSchema.safeParse(rawData);
    if (!validation.success) {
      console.warn("Validation Error:", validation.error.format());
      return;
    }

    await HapticService.success();
    setAnthropometry(validation.data);

    // Persist profile locally in SQLite and trigger background sync
    const onboardingState = useOnboardingStore.getState();
    const strength = onboardingState.strengthProfile;
    const experience = strength?.experience || 'beginner';
    const weeklyFrequency = strength?.weeklyFrequency || 3;
    const pr_squat = strength?.squat1RM || 0;
    const pr_bench = strength?.bench1RM || 0;
    const pr_deadlift = strength?.deadlift1RM || 0;

    const session = useAuthStore.getState().session;
    const userId = session?.user?.id || 'guest';

    await saveUserProfile({
      id: userId,
      pdc: validation.data.weightKg,
      gender: validation.data.gender,
      age: validation.data.age,
      height_cm: validation.data.heightCm,
      experience,
      weekly_frequency: weeklyFrequency,
      pr_squat,
      pr_bench,
      pr_deadlift,
      pr_ohp: 50, // default ohp
    });

    alert("BIOMECHANICAL CALIBRATION V4 COMPLETED\nAnthropometric profiles successfully computed.");
  };

  return (
    <SafeAreaView style={[tw`flex-1 bg-black`, { height: Dimensions.get('screen').height, position: 'absolute', top: 0, left: 0, right: 0 }]}>
      <CyberGrid />

      {/* Top AppBar */}
      <TacticalAppBar title="FORGE // THE VESSEL" />

      <ScrollView 
        contentContainerStyle={tw`p-6 pb-8 gap-6 z-10`}
        scrollEnabled={!(isEditingHeight || isEditingWeight || isEditingAge)}
        automaticallyAdjustKeyboardInsets={false}
      >
        {/* Header Section */}
        <TacticalScreenHeader
          title="VESSEL CALIBRATION"
        />

        {/* 1. Biological Origin Selector (Swapped to top) */}
        <View style={tw`gap-3`}>
          <Label>BIOLOGICAL ORIGIN</Label>
          <Tabs>
            {(['MAN', 'WOMEN', 'OTHER'] as const).map((choice) => (
              <TabsTrigger
                key={choice}
                isActive={genderChoice === choice}
                onPress={() => {
                  HapticService.select().catch(() => {});
                  setGenderChoice(choice);
                }}
              >
                {choice}
              </TabsTrigger>
            ))}
          </Tabs>
        </View>

        {/* 2. Measurement System Selector (Swapped to bottom) */}
        <View style={tw`gap-3`}>
          <Label>MEASUREMENT SYSTEM</Label>
          <Tabs>
            <TabsTrigger
              isActive={isMetric}
              onPress={() => {
                HapticService.select().catch(() => {});
                setIsMetric(true);
              }}
            >
              METRIC <Text style={tw`text-[8px] opacity-40`}>[KG/CM]</Text>
            </TabsTrigger>
            <TabsTrigger
              isActive={!isMetric}
              onPress={() => {
                HapticService.select().catch(() => {});
                setIsMetric(false);
              }}
            >
              IMPERIAL <Text style={tw`text-[8px] opacity-40`}>[LB/FT]</Text>
            </TabsTrigger>
          </Tabs>
        </View>

        {/* 3. Chronological Age Stepper */}
        <View style={tw`gap-3`}>
          <Label>CHRONOLOGICAL AGE</Label>
          <TacticalStepper
            value={age}
            suffix="years"
            min={14}
            max={100}
            onIncrement={() => setAge((prev) => Math.min(100, prev + 1))}
            onDecrement={() => setAge((prev) => Math.max(14, prev - 1))}
            onChange={setAge}
            onEditStateChange={setIsEditingAge}
          />
        </View>

        {/* 4. Stature Slider */}
        <TacticalEditableSlider
          label="STATURE"
          displayValue={isMetric ? (
            <>
              {heightCm} <Text style={tw`text-[10px] text-zinc-500 font-normal`}>cm</Text>
            </>
          ) : (
            cmToFtIn(heightCm)
          )}
          value={isMetric ? heightCm : Math.round(heightCm / 2.54)}
          min={isMetric ? 140 : 55}
          max={isMetric ? 220 : 86}
          unit={isMetric ? 'cm' : 'in'}
          onChange={(val: number) => {
            if (isMetric) {
              setHeightCm(val);
            } else {
              setHeightCm(Math.round(val * 2.54));
            }
          }}
          onKeyboardSubmit={handleHeightSubmit}
          keyboardType={isMetric ? 'numeric' : 'default'}
          getInitialInputValue={() => {
            if (isMetric) {
              return heightCm.toString();
            } else {
              const inches = heightCm / 2.54;
              const feet = Math.floor(inches / 12);
              const remainingInches = Math.round(inches % 12);
              return `${feet}'${remainingInches}`;
            }
          }}
          onEditStateChange={setIsEditingHeight}
        />

        {/* 5. Body Mass Slider */}
        <TacticalEditableSlider
          label="BODY MASS"
          displayValue={isMetric ? (
            <>
              {weightKg.toFixed(1)} <Text style={tw`text-[10px] text-zinc-500 font-normal`}>kg</Text>
            </>
          ) : (
            <>
              {kgToLbs(weightKg)} <Text style={tw`text-[10px] text-zinc-500 font-normal`}>lbs</Text>
            </>
          )}
          value={isMetric ? parseFloat(weightKg.toFixed(1)) : kgToLbs(weightKg)}
          min={isMetric ? 40 : 88}
          max={isMetric ? 150 : 330}
          unit={isMetric ? 'kg' : 'lbs'}
          onChange={(val: number) => {
            if (isMetric) {
              setWeightKg(val);
            } else {
              setWeightKg(val / 2.20462);
            }
          }}
          onKeyboardSubmit={handleWeightSubmit}
          keyboardType="decimal-pad"
          getInitialInputValue={() => {
            return isMetric 
              ? weightKg.toFixed(1) 
              : kgToLbs(weightKg).toString();
          }}
          onEditStateChange={setIsEditingWeight}
        />

        {/* Action Buttons */}
        <View style={tw`mt-4 gap-4`}>
          <SlideToValidate onValidate={handleSaveVessel} />
          
          <Button variant="outline" onPress={handleSaveVessel}>
            [BYPASS SLIDER] PRESS TO VALIDATE
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
