import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ActivityIndicator,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { supabase } from '../src/lib/supabase';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';

export default function LoginScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  // États des modales/tiroirs
  const [emailModalVisible, setEmailModalVisible] = useState(false);
  const [registerModalVisible, setRegisterModalVisible] = useState(false);
  
  // Formulaires
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [regFirstName, setRegFirstName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);

  // Déclencher un feedback tactile léger sur clic de bouton
  const triggerHaptic = (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
    Haptics.impactAsync(style).catch(() => {});
  };

  // Connexion Email + Password
  const handleEmailLogin = async () => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    if (!email || !password) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      alert("Veuillez remplir tous les champs.");
      return;
    }
    
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setEmailModalVisible(false);
      // Expo Router gèrera la redirection automatique grâce au state dans _layout.tsx
    } catch (e: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      alert(e.message || "Erreur de connexion");
    } finally {
      setLoading(false);
    }
  };

  // Inscription
  const handleRegister = async () => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    if (!regFirstName || !regEmail || !regPassword || !regConfirmPassword) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      alert("Veuillez remplir tous les champs.");
      return;
    }

    if (regPassword !== regConfirmPassword) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      alert("Les mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);
    try {
      // Inscription Supabase
      const { error } = await supabase.auth.signUp({
        email: regEmail,
        password: regPassword,
        options: {
          data: {
            first_name: regFirstName
          }
        }
      });
      if (error) throw error;

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      alert("Inscription réussie ! Vous pouvez maintenant vous connecter.");
      setRegisterModalVisible(false);
      setEmailModalVisible(true); // Redirige directement vers la modale email
    } catch (e: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      alert(e.message || "Erreur d'inscription");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Background Subtle Grid Effect */}
      <View style={styles.gridOverlay} pointerEvents="none" />

      {/* Brand Section */}
      <View style={styles.brandContainer}>
        <Text style={styles.brandTitle}>FORGE</Text>
        <Text style={styles.brandSubtitle}>MOTEUR D&apos;OPTIMISATION BIOMÉCANIQUE</Text>
      </View>

      {/* Action Stack Section */}
      <View style={styles.actionContainer}>
        
        {/* Apple Sign In (Mocked / Native Auth redirection point) */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => {
            triggerHaptic();
            alert("Intégration Apple Sign-In native requise pour la production.");
          }}
          style={styles.appleButton}
        >
          <Ionicons name="logo-apple" size={20} color="black" style={styles.buttonIcon} />
          <Text style={styles.appleButtonText}>Continuer avec Apple</Text>
        </TouchableOpacity>

        {/* Google Sign In (Mocked / Native Auth redirection point) */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => {
            triggerHaptic();
            alert("Intégration Google Sign-In native requise pour la production.");
          }}
          style={styles.googleButton}
        >
          <Ionicons name="logo-google" size={18} color="white" style={styles.buttonIcon} />
          <Text style={styles.googleButtonText}>Continuer avec Google</Text>
        </TouchableOpacity>

        {/* Link: Use Email */}
        <TouchableOpacity
          onPress={() => {
            triggerHaptic();
            setEmailModalVisible(true);
          }}
          style={styles.linkWrapper}
        >
          <Text style={styles.emailLinkText}>Utiliser un email</Text>
        </TouchableOpacity>

        {/* Link: Register */}
        <TouchableOpacity
          onPress={() => {
            triggerHaptic();
            setRegisterModalVisible(true);
          }}
          style={styles.linkWrapper}
        >
          <Text style={styles.registerLinkText}>
            Pas encore de compte ? <Text style={styles.underline}>S&apos;inscrire</Text>
          </Text>
        </TouchableOpacity>

      </View>

      {/* Dynamic Tactical Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>V.2.4.0-STABLE | ENCRYPTED CONNECTION</Text>
      </View>

      {/* ─── MODALE CONNEXION EMAIL (Stitch Spec) ─── */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={emailModalVisible}
        onRequestClose={() => setEmailModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <Pressable style={styles.backdropPressable} onPress={() => setEmailModalVisible(false)} />
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalKeyboardAvoiding}
          >
            <View style={styles.modalContent}>
              {/* Header */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Connectez-vous avec votre email</Text>
                <TouchableOpacity
                  onPress={() => {
                    triggerHaptic();
                    setEmailModalVisible(false);
                  }}
                  style={styles.closeButton}
                >
                  <Ionicons name="close" size={24} color="#a1a1aa" />
                </TouchableOpacity>
              </View>

              {/* Form */}
              <ScrollView contentContainerStyle={styles.modalScrollContent} keyboardShouldPersistTaps="handled">
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>EMAIL</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="votre@email.com"
                    placeholderTextColor="#3f3f46"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    value={email}
                    onChangeText={setEmail}
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>MOT DE PASSE</Text>
                  <View style={styles.passwordInputWrapper}>
                    <TextInput
                      style={styles.passwordInput}
                      placeholder="••••••••"
                      placeholderTextColor="#3f3f46"
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      autoCorrect={false}
                      value={password}
                      onChangeText={setPassword}
                    />
                    <TouchableOpacity
                      onPress={() => {
                        triggerHaptic();
                        setShowPassword(!showPassword);
                      }}
                      style={styles.visibilityButton}
                    >
                      <Ionicons
                        name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                        size={20}
                        color="#a1a1aa"
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Submit button */}
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={handleEmailLogin}
                  disabled={loading}
                  style={styles.submitButton}
                >
                  {loading ? (
                    <ActivityIndicator color="black" />
                  ) : (
                    <Text style={styles.submitButtonText}>SE CONNECTER</Text>
                  )}
                </TouchableOpacity>

                {/* Forgot Password */}
                <TouchableOpacity
                  onPress={() => {
                    triggerHaptic();
                    alert("Redirection vers la récupération de mot de passe...");
                  }}
                  style={styles.forgotPasswordWrapper}
                >
                  <Text style={styles.forgotPasswordText}>Mot de passe oublié ?</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* ─── MODALE INSCRIPTION (Stitch Spec) ─── */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={registerModalVisible}
        onRequestClose={() => setRegisterModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <Pressable style={styles.backdropPressable} onPress={() => setRegisterModalVisible(false)} />
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalKeyboardAvoiding}
          >
            <View style={styles.modalContent}>
              {/* Header */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Créer votre compte</Text>
                <TouchableOpacity
                  onPress={() => {
                    triggerHaptic();
                    setRegisterModalVisible(false);
                  }}
                  style={styles.closeButton}
                >
                  <Ionicons name="close" size={24} color="#a1a1aa" />
                </TouchableOpacity>
              </View>

              {/* Form */}
              <ScrollView contentContainerStyle={styles.modalScrollContent} keyboardShouldPersistTaps="handled">
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>PRÉNOM</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Votre prénom"
                    placeholderTextColor="#3f3f46"
                    value={regFirstName}
                    onChangeText={setRegFirstName}
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>EMAIL</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="votre@email.com"
                    placeholderTextColor="#3f3f46"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    value={regEmail}
                    onChangeText={setRegEmail}
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>MOT DE PASSE</Text>
                  <View style={styles.passwordInputWrapper}>
                    <TextInput
                      style={styles.passwordInput}
                      placeholder="••••••••"
                      placeholderTextColor="#3f3f46"
                      secureTextEntry={!showRegPassword}
                      autoCapitalize="none"
                      autoCorrect={false}
                      value={regPassword}
                      onChangeText={setRegPassword}
                    />
                    <TouchableOpacity
                      onPress={() => {
                        triggerHaptic();
                        setShowRegPassword(!showRegPassword);
                      }}
                      style={styles.visibilityButton}
                    >
                      <Ionicons
                        name={showRegPassword ? 'eye-off-outline' : 'eye-outline'}
                        size={20}
                        color="#a1a1aa"
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>CONFIRMER LE MOT DE PASSE</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="••••••••"
                    placeholderTextColor="#3f3f46"
                    secureTextEntry={true}
                    autoCapitalize="none"
                    autoCorrect={false}
                    value={regConfirmPassword}
                    onChangeText={setRegConfirmPassword}
                  />
                </View>

                {/* Submit button */}
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={handleRegister}
                  disabled={loading}
                  style={[styles.submitButton, { backgroundColor: '#ffffff', borderRadius: 9999 }]}
                >
                  {loading ? (
                    <ActivityIndicator color="black" />
                  ) : (
                    <Text style={[styles.submitButtonText, { color: '#000000' }]}>CRÉER MON COMPTE</Text>
                  )}
                </TouchableOpacity>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'space-between',
    paddingHorizontal: 16
  },
  gridOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.05,
    borderWidth: 0,
    backgroundColor: 'transparent',
    // Mock technique de grille (en React Native on utilise des bordures ou textures, mais simple couleur noire de base suffit pour le brutalisme)
  },
  brandContainer: {
    alignItems: 'center',
    marginTop: 80
  },
  brandTitle: {
    fontSize: 72,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: -4,
    lineHeight: 80
  },
  brandSubtitle: {
    fontSize: 10,
    color: '#a1a1aa',
    letterSpacing: 2,
    fontWeight: '700',
    marginTop: 8,
    textTransform: 'uppercase'
  },
  actionContainer: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
    gap: 16,
    marginBottom: 100
  },
  appleButton: {
    width: '100%',
    height: 56,
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9999
  },
  buttonIcon: {
    marginRight: 10
  },
  appleButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600'
  },
  googleButton: {
    width: '100%',
    height: 56,
    backgroundColor: 'rgba(24, 24, 27, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9999
  },
  googleButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600'
  },
  linkWrapper: {
    alignItems: 'center',
    paddingVertical: 6
  },
  emailLinkText: {
    color: '#a1a1aa',
    fontSize: 14,
    textDecorationLine: 'underline',
    fontWeight: '500'
  },
  registerLinkText: {
    color: '#a1a1aa',
    fontSize: 14,
    fontWeight: '500'
  },
  underline: {
    textDecorationLine: 'underline',
    color: '#ffffff'
  },
  footer: {
    position: 'absolute',
    bottom: 24,
    left: 0,
    right: 0,
    alignItems: 'center'
  },
  footerText: {
    fontSize: 10,
    color: '#71717a',
    letterSpacing: 1.5,
    fontWeight: '500'
  },
  
  // Styles des Modales
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end'
  },
  backdropPressable: {
    flex: 1
  },
  modalKeyboardAvoiding: {
    width: '100%'
  },
  modalContent: {
    width: '100%',
    backgroundColor: '#12131a',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    paddingBottom: Platform.OS === 'ios' ? 40 : 24
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffffff',
    flex: 1,
    marginRight: 10
  },
  closeButton: {
    padding: 4
  },
  modalScrollContent: {
    paddingHorizontal: 24,
    paddingTop: 8,
    gap: 16
  },
  inputContainer: {
    gap: 8
  },
  inputLabel: {
    fontSize: 10,
    color: '#a1a1aa',
    fontWeight: '700',
    letterSpacing: 1.5
  },
  textInput: {
    width: '100%',
    height: 48,
    backgroundColor: 'rgba(24, 24, 27, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    paddingHorizontal: 16,
    color: '#ffffff',
    fontSize: 16
  },
  passwordInputWrapper: {
    width: '100%',
    height: 48,
    backgroundColor: 'rgba(24, 24, 27, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden'
  },
  passwordInput: {
    flex: 1,
    height: '100%',
    paddingHorizontal: 16,
    color: '#ffffff',
    fontSize: 16
  },
  visibilityButton: {
    paddingHorizontal: 16,
    height: '100%',
    justifyContent: 'center'
  },
  submitButton: {
    width: '100%',
    height: 48,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16
  },
  submitButtonText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1.5
  },
  forgotPasswordWrapper: {
    alignItems: 'center',
    marginTop: 8
  },
  forgotPasswordText: {
    color: '#a1a1aa',
    fontSize: 14,
    textDecorationLine: 'underline',
    fontWeight: '500'
  }
});
