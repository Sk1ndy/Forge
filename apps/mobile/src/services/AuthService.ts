import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/auth.store';
import { LoginFormData, RegisterFormData } from '../schemas/auth.schema';
import { signInWithGoogle as googleSignInHelper } from '../lib/auth';

/**
 * AuthService - Service applicatif d'authentification de Forge Mobile.
 * Encapsule toute la logique Supabase Auth et Google Signin.
 * Met à jour le store réactif d'authentification.
 */
export const AuthService = {
  /**
   * Connexion par email et mot de passe.
   */
  login: async (credentials: LoginFormData): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (error) throw error;

      useAuthStore.getState().setSession(data.session);
      return { success: true };
    } catch (e: any) {
      console.error('AuthService: Login failed', e);
      return { success: false, error: e.message || 'Identifiants invalides.' };
    }
  },

  /**
   * Inscription par email et mot de passe.
   */
  register: async (data: RegisterFormData): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            first_name: data.firstName,
          },
        },
      });

      if (error) throw error;

      // Supabase envoie généralement un email de confirmation,
      // la session sera active après validation ou immédiatement selon la conf Supabase.
      return { success: true };
    } catch (e: any) {
      console.error('AuthService: Registration failed', e);
      return { success: false, error: e.message || "Erreur lors de l'inscription." };
    }
  },

  /**
   * Connexion via Google (Native SDK -> Supabase Federated).
   */
  loginWithGoogle: async (): Promise<{ success: boolean; error?: string }> => {
    try {
      const data = await googleSignInHelper();
      if (data && data.session) {
        useAuthStore.getState().setSession(data.session);
        return { success: true };
      }
      return { success: false, error: "Échec de récupération de la session Google." };
    } catch (e: any) {
      console.error('AuthService: Google Signin failed', e);
      return { success: false, error: e.message || 'Connexion Google annulée ou impossible.' };
    }
  },

  /**
   * Déconnexion complète du système.
   */
  logout: async (): Promise<void> => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn('AuthService: Supabase signOut failed, forcing state reset', e);
    } finally {
      useAuthStore.getState().setSession(null);
    }
  },

  /**
   * Recharge la session courante depuis Supabase pour validation active.
   */
  refreshSession: async (): Promise<void> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      useAuthStore.getState().setSession(session);
    } catch (e) {
      console.error('AuthService: Session refresh failed', e);
      useAuthStore.getState().setSession(null);
    }
  },
};
