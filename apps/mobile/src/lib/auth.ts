import { supabase } from './supabase';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';

// Setup Google Signin configuration
GoogleSignin.configure({
  scopes: ['https://www.googleapis.com/auth/userinfo.email', 'https://www.googleapis.com/auth/userinfo.profile'],
  webClientId: 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com', // To be replaced by the actual Web Client ID from Supabase/Google Cloud
  offlineAccess: true, // if you want to access Google API on behalf of the user FROM YOUR SERVER
  forceCodeForRefreshToken: true, // [Android] related to `serverAuthCode`, read the docs link below *.
  iosClientId: 'YOUR_IOS_CLIENT_ID.apps.googleusercontent.com', // [iOS] optional, if you want to specify the client ID of type iOS (otherwise, it is taken from GoogleService-Info.plist)
});

export const signInWithGoogle = async () => {
  try {
    await GoogleSignin.hasPlayServices();
    const userInfo = await GoogleSignin.signIn();
    if (userInfo.type === 'success') {
      const idToken = userInfo.data.idToken;
      if (idToken) {
        const { data, error } = await supabase.auth.signInWithIdToken({
          provider: 'google',
          token: idToken,
        });
        if (error) throw error;
        return data;
      } else {
        throw new Error('no ID token present!');
      }
    } else {
      throw new Error('Sign in cancelled or failed');
    }
  } catch (error: any) {
    if (error.code === statusCodes.SIGN_IN_CANCELLED) {
      console.log('User cancelled the login flow');
    } else if (error.code === statusCodes.IN_PROGRESS) {
      console.log('Signing in');
    } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      console.error('Play services not available or outdated');
    } else {
      console.error('Some other error happened', error);
    }
    throw error;
  }
};
