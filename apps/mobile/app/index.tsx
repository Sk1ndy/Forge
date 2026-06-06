import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Dimensions, Animated, Easing, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Svg, { Defs, RadialGradient, Stop, Rect, LinearGradient } from 'react-native-svg';
import tw from '../src/styles/tailwind';
import { HapticService } from '../src/services/HapticService';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * Dashboard (Spark) - Entrypoint screen (A.01 The Spark).
 * Represents the tactical simulation cockpit and welcome hub of Forge "Work".
 */
export default function SparkScreen() {
  const router = useRouter();
  
  // Animated Scan Beam
  const scanAnim = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    scanAnim.setValue(-100);
    Animated.loop(
      Animated.timing(scanAnim, {
        toValue: SCREEN_HEIGHT,
        duration: 8000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, [scanAnim]);

  const handleStartCalibration = async () => {
    await HapticService.select();
    router.push('/vessel');
  };

  return (
    <SafeAreaView style={tw`flex-1 bg-black`}>
      <View style={tw`flex-1 w-full h-full bg-black relative justify-center items-center`}>
        {/* Background Skeletal Scan - High Fidelity Premium Asset */}
        <Image
          source={require('../assets/images/spark_background.png')}
          style={tw`absolute w-full h-full opacity-40`}
          resizeMode="cover"
        />

        {/* SVG Radial Gradient Vignette Overlay (Perfect OLED Blending) */}
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
          <View style={[tw`items-center`, { alignSelf: 'center' }]}>
            <Text style={[tw`text-white text-[48px] tracking-[0.4em] mb-2 text-center leading-none`, { fontFamily: 'Geist-Bold' }]}>FORGE</Text>
            <View style={tw`w-full h-[1px] bg-white/30 mb-6`} />
            <Text style={[tw`text-white/60 text-[10px] tracking-[0.3em] text-center uppercase`, { fontFamily: 'JetBrainsMono-Bold' }]}>BIOMECHANICAL SIMULATION ENGINE</Text>
          </View>
        </View>

        {/* Bottom Left Telemetry */}
        <View style={tw`absolute bottom-28 left-6 z-40`} pointerEvents="none">
          <Text style={[tw`text-zinc-400/60 text-[9px] tracking-[0.2em] uppercase`, { fontFamily: 'JetBrainsMono-Bold' }]}>UPLINK: SECURE</Text>
        </View>

        {/* Fixed Glass Footer */}
        <View style={tw`absolute bottom-0 left-0 right-0 p-6 md:p-8 bg-black/40 border-t border-white/10 z-30`}>
          <View style={tw`max-w-md mx-auto w-full flex flex-col items-center gap-6`}>
            {/* Initiate button with premium white glow */}
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
              <Text style={[tw`text-black text-sm tracking-[0.2em]`, { fontFamily: 'Geist-Bold' }]}>INITIATE EVALUATION</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={async () => {
                await HapticService.select();
                console.log('LOGIN: Path to login triggered.');
              }}
              style={tw`py-2`}
            >
              <Text style={[tw`text-white/60 text-[10px] tracking-[0.2em] uppercase`, { fontFamily: 'JetBrainsMono-Bold' }]}>Existing Member / Login</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
