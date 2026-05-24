import React from 'react';
import { View, Text, StyleSheet, Pressable, Alert, ImageBackground, Dimensions } from 'react-native';
import { supabase } from '../src/lib/supabase';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

WebBrowser.maybeCompleteAuthSession();

const { width, height } = Dimensions.get('window');

export default function LoginScreen() {
  const performOAuth = async () => {
    try {
      // Pour Expo Go, ça génère exp://<ip>:8081
      // ASSUREZ-VOUS d'ajouter exp://* dans les Redirect URLs de Supabase !
      const redirectUrl = AuthSession.makeRedirectUri();

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
           await supabase.auth.getSession();
        }
      }
    } catch (error: any) {
      Alert.alert("Erreur de connexion", error.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Decorative Tech Grid/Lines */}
      <View style={styles.gridOverlay}>
        <View style={styles.gridLineHorizontal} />
        <View style={styles.gridLineVertical} />
      </View>

      <View style={styles.topSection}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>MODULE DE TRACKING</Text>
        </View>
        
        <Text style={styles.brandName}>FORGE</Text>
        <Text style={styles.tagline}>SPORTS CAD SIMULATOR</Text>
        
        <View style={styles.separator} />
        
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>STATUS</Text>
            <Text style={styles.statValueActive}>OFFLINE</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>SYNC</Text>
            <Text style={styles.statValue}>AWAITING AUTH</Text>
          </View>
        </View>
      </View>

      <View style={styles.bottomSection}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>AUTHENTIFICATION REQUISE</Text>
          <Text style={styles.cardDesc}>
            Veuillez connecter votre compte Google pour synchroniser les Blueprints et initialiser le moteur biomécanique.
          </Text>
          
          <Pressable 
            style={({ pressed }) => [styles.btn, pressed && styles.btnPressed]}
            onPress={performOAuth}
          >
            <MaterialCommunityIcons name="google" size={20} color="#fff" />
            <Text style={styles.btnText}>CONNEXION SÉCURISÉE</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'space-between',
  },
  gridOverlay: {
    ...(StyleSheet.absoluteFill as any),
    opacity: 0.1,
    zIndex: -1,
  },
  gridLineHorizontal: {
    position: 'absolute',
    top: '30%',
    width: '100%',
    height: 1,
    backgroundColor: '#3b82f6',
  },
  gridLineVertical: {
    position: 'absolute',
    left: '15%',
    height: '100%',
    width: 1,
    backgroundColor: '#3b82f6',
  },
  topSection: {
    flex: 1,
    paddingHorizontal: 32,
    paddingTop: height * 0.1,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderWidth: 1,
    borderColor: '#3b82f6',
    borderRadius: 4,
    marginBottom: 24,
  },
  badgeText: {
    color: '#3b82f6',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  brandName: {
    fontSize: 48,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 2,
  },
  tagline: {
    fontSize: 12,
    fontWeight: '600',
    color: '#a1a1aa', // zinc-400
    letterSpacing: 3,
    marginTop: 4,
  },
  separator: {
    width: 40,
    height: 2,
    backgroundColor: '#3b82f6',
    marginTop: 32,
    marginBottom: 32,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 32,
  },
  statBox: {},
  statLabel: {
    color: '#71717a', // zinc-500
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 4,
  },
  statValue: {
    color: '#a1a1aa',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  statValueActive: {
    color: '#ef4444', // red-500
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  bottomSection: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#09090b', // zinc-950
    borderWidth: 1,
    borderColor: '#27272a', // zinc-800
    padding: 24,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 1,
    marginBottom: 12,
  },
  cardDesc: {
    fontSize: 12,
    color: '#a1a1aa',
    lineHeight: 20,
    marginBottom: 32,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#3b82f6', // solid blue
    paddingVertical: 16,
    borderRadius: 4, // sharper corners
  },
  btnPressed: {
    backgroundColor: '#2563eb',
  },
  btnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
  }
});
