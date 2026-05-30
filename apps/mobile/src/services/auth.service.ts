import { supabase } from '../lib/supabase';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { LoginFormData, RegisterFormData } from '../schemas/auth.schema';

export class AuthService {
  static async loginWithEmail(data: LoginFormData) {
    const { error, data: authData } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });
    if (error) throw error;
    return authData;
  }

  static async registerUser(data: RegisterFormData) {
    const { error, data: authData } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          first_name: data.firstName,
        },
      },
    });
    if (error) throw error;
    return authData;
  }

  static async loginWithGoogle() {
    await GoogleSignin.hasPlayServices();
    const userInfo = await GoogleSignin.signIn() as any;
    const idToken = userInfo?.data?.idToken || userInfo?.idToken;
    if (!idToken) {
      throw new Error('Aucun ID token retourné par Google.');
    }
    
    const { error, data: authData } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: idToken,
    });
    
    if (error) throw error;
    return authData;
  }

  static async logout() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }
}
