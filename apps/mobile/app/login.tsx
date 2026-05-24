import React from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { supabase } from '../src/lib/supabase';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const performOAuth = async () => {
    try {
      const redirectUrl = AuthSession.makeRedirectUri({
        path: '/auth/callback'
      });

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true,
        },
      });

      if (error) throw error;
      if (!data.url) throw new Error("No URL returned");

      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);

      if (result.type === 'success' && result.url) {
        // Parse the URL to extract the token
        // supabase.auth.setSession is handled automatically by the URL polyfill if we use createSessionFromUrl
        // or we can manually parse it if needed. Let's let Supabase try to handle the URL.
        const urlParams = new URL(result.url).hash
          .substring(1)
          .split('&')
          .reduce((acc, current) => {
            const [key, value] = current.split('=');
            acc[key] = value;
            return acc;
          }, {} as Record<string, string>);

        if (urlParams.access_token && urlParams.refresh_token) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: urlParams.access_token,
            refresh_token: urlParams.refresh_token,
          });
          if (sessionError) throw sessionError;
        } else {
           // Si pas de hash, vérifier s'il y a un code
           await supabase.auth.getSession();
        }
      }
    } catch (error: any) {
      Alert.alert("Erreur de connexion", error.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Background Effects (DA) */}
      <View style={styles.bgGlow} />

      <View style={styles.content}>
        <View style={styles.logoBox}>
          <Text style={styles.logoText}>F</Text>
        </View>

        <Text style={styles.title}>FORGE</Text>
        <Text style={styles.subtitle}>Tracker d'Exécution</Text>

        <Pressable 
          style={({ pressed }) => [styles.btn, pressed && styles.btnPressed]}
          onPress={performOAuth}
        >
          <MaterialCommunityIcons name="google" size={24} color="#000" />
          <Text style={styles.btnText}>Continuer avec Google</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000', // DA: Black background
    alignItems: 'center',
    justifyContent: 'center',
  },
  bgGlow: {
    position: 'absolute',
    width: 400,
    height: 400,
    backgroundColor: 'rgba(59, 130, 246, 0.15)', // DA: Blue-500 glow for WORK
    borderRadius: 200,
    top: '20%',
    left: '50%',
    transform: [{ translateX: -200 }],
  },
  content: {
    alignItems: 'center',
    width: '100%',
    padding: 20,
    zIndex: 10,
  },
  logoBox: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: '#3b82f6', // DA: Blue-500
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  logoText: {
    color: '#000',
    fontSize: 40,
    fontWeight: '900',
  },
  title: {
    color: '#fff',
    fontSize: 48,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 8,
  },
  subtitle: {
    color: '#a1a1aa', // DA: zinc-400
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 60,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#fff',
    width: '100%',
    maxWidth: 320,
    paddingVertical: 16,
    borderRadius: 16,
  },
  btnPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  btnText: {
    color: '#000',
    fontSize: 18,
    fontWeight: 'bold',
  }
});
