import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Platform, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Defs, RadialGradient, Stop, Rect } from 'react-native-svg';
import tw from '../src/styles/tailwind';
import { GlassCard } from '../src/components/GlassCard';
import { TacticalFlicker } from '../src/components/TacticalFlicker';
import { HapticService } from '../src/services/HapticService';
import { AuthService } from '../src/services/AuthService';
import { LoginSchema } from '../src/schemas/auth.schema';
import { CyberGrid } from '../src/components/CyberGrid';

/**
 * LoginScreen - Laboratory secure authentication portal.
 * Styled completely with twrnc Tailwind CSS, featuring high-fidelity skeletal spine backdrop.
 */
export default function LoginScreen() {
  const router = useRouter();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLogin = async () => {
    // 1. Zod Validation
    const validation = LoginSchema.safeParse({ email, password });
    
    if (!validation.success) {
      await HapticService.warning();
      const firstError = validation.error.issues[0]?.message || 'Saisie incorrecte.';
      setErrorMsg(firstError);
      return;
    }

    setErrorMsg(null);
    setLoading(true);
    await HapticService.select();

    // 2. Decoupled Authentication Service call
    const result = await AuthService.login(validation.data);

    setLoading(false);

    if (result.success) {
      await HapticService.success();
      router.replace('/');
    } else {
      await HapticService.warning();
      setErrorMsg(result.error || 'Une erreur est survenue lors de la connexion.');
    }
  };

  return (
    <SafeAreaView style={tw`flex-1 bg-black relative`}>
      {/* Background Skeletal Spine Scan */}
      <Image
        source={require('../assets/images/skeletal_spine.png')}
        style={tw`absolute w-full h-[65%] top-[10%] opacity-40`}
        resizeMode="contain"
      />
      
      {/* SVG Radial Gradient Vignette Overlay (Apple Cinematic Light) */}
      <Svg style={tw`absolute inset-0`} pointerEvents="none">
        <Defs>
          <RadialGradient
            id="login-vignette"
            cx="50%"
            cy="45%"
            rx="65%"
            ry="65%"
            fx="50%"
            fy="45%"
          >
            <Stop offset="0%" stopColor="#000000" stopOpacity="0" />
            <Stop offset="45%" stopColor="#000000" stopOpacity="0.3" />
            <Stop offset="85%" stopColor="#000000" stopOpacity="0.85" />
            <Stop offset="100%" stopColor="#000000" stopOpacity="0.98" />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#login-vignette)" />
      </Svg>

      <CyberGrid />
      
      {/* Header */}
      <View style={tw`h-16 flex-row items-center px-4 border-b border-white/10 z-20`}>
        <TouchableOpacity
          onPress={async () => {
            await HapticService.select();
            router.back();
          }}
          style={tw`p-1.5 -ml-1.5 mr-3`}
        >
          <Ionicons name="chevron-back" size={24} color="white" />
        </TouchableOpacity>
        <TacticalFlicker style={tw`text-[14px] text-white tracking-[0.15em] font-bold`} fontType="sans">
          MEMBER_AUTHENTICATION
        </TacticalFlicker>
      </View>

      {/* Main Content */}
      <View style={tw`flex-1 justify-center px-4 z-20`}>
        <GlassCard style={tw`p-6 gap-5 bg-white/3 border border-white/8 rounded-2xl`}>
          <TacticalFlicker style={tw`text-[10px] text-zinc-400 tracking-[0.15em] font-mono mb-2`} fontType="mono">
            SECURE_LOGIN // FORGE_DB
          </TacticalFlicker>

          {/* Email */}
          <View style={tw`gap-2`}>
            <Text style={tw`text-[9px] text-zinc-400 tracking-[0.15em] font-mono`}>EMAIL CLINIQUE</Text>
            <View style={tw`h-12 border border-white/10 rounded-lg bg-white/2 px-3 justify-center`}>
              <TextInput
                style={tw`color-white font-mono text-[13px]`}
                placeholder="nom.prenom@laboratoire.com"
                placeholderTextColor="rgba(255, 255, 255, 0.2)"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>
          </View>

          {/* Password */}
          <View style={tw`gap-2`}>
            <Text style={tw`text-[9px] text-zinc-400 tracking-[0.15em] font-mono`}>MOT DE PASSE ENCRYPTÉ</Text>
            <View style={tw`h-12 border border-white/10 rounded-lg bg-white/2 px-3 justify-center`}>
              <TextInput
                style={tw`color-white font-mono text-[13px]`}
                placeholder="••••••••"
                placeholderTextColor="rgba(255, 255, 255, 0.2)"
                secureTextEntry
                autoCapitalize="none"
                value={password}
                onChangeText={setPassword}
              />
            </View>
          </View>

          {errorMsg && (
            <View style={tw`flex-row items-center gap-2 border border-red-500 rounded-lg p-3 bg-red-500/5`}>
              <Ionicons name="alert-circle" size={16} color="#ef4444" />
              <Text style={tw`color-[#ef4444] text-[11px] font-mono flex-1`}>{errorMsg}</Text>
            </View>
          )}

          {/* Login Action Button */}
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={handleLogin}
            disabled={loading}
            style={tw`h-13 bg-white rounded-lg items-center justify-center mt-2`}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#000000" />
            ) : (
              <Text style={tw`color-black font-bold text-[13px] tracking-[0.15em]`}>ACCÉDER AU TERMINAL</Text>
            )}
          </TouchableOpacity>
        </GlassCard>
      </View>

      {/* Footer */}
      <View style={tw`py-5 items-center z-20`}>
        <Text style={tw`font-mono text-[8px] color-white/25 tracking-[0.2em]`}>
          SECURE_CONNECTION // SHA-256 // END_TO_END
        </Text>
      </View>
    </SafeAreaView>
  );
}
