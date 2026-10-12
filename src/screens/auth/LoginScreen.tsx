import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PrimaryButton from '../../components/PrimaryButton';
import { useThemeColors } from '../../store/ThemeContext';
import { FONT, type ThemeColors } from '../../theme';
import type { RootScreenProps } from '../../types/navigation';
import {
  getAuthErrorMessage,
  sendPasswordReset,
  signIn,
  signInWithGoogle,
} from '../../config/firebaseSetup';

type Props = RootScreenProps<'Login'>;

export default function LoginScreen({ navigation }: Props) {
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const goBackToApp = () => {
    // Login is pushed on top of Main (guest flow): return to where the
    // user came from, or to Main if there is nowhere to go back to.
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.navigate('Main');
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
      goBackToApp();
    } catch (error) {
      Alert.alert('Google sign in failed', getAuthErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      Alert.alert('Reset password', 'Type your account email above first, then tap Forgot?.');
      return;
    }
    Alert.alert('Reset password', `Send a reset link to ${normalizedEmail}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Send link',
        onPress: async () => {
          setLoading(true);
          try {
            await sendPasswordReset(normalizedEmail);
            Alert.alert('Link sent', 'Check your inbox for the password reset email.');
          } catch (error) {
            Alert.alert('Reset failed', getAuthErrorMessage(error));
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  const handleSignIn = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !password) {
      Alert.alert('Missing details', 'Please enter your email and password.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      Alert.alert('Invalid email', 'Please enter a valid email address.');
      return;
    }
    setLoading(true);
    try {
      await signIn(normalizedEmail, password);
      goBackToApp();
    } catch (error) {
      Alert.alert('Sign in failed', getAuthErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.container}>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Close sign in"
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            onPress={() => navigation.goBack()}
            style={styles.close}
          >
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
          <View style={styles.logo}>
            <Text style={styles.logoText}>✦</Text>
          </View>

          <Text style={styles.title}>Welcome to Wakely</Text>
          <Text style={styles.subtitle}>Wake up when it matters.</Text>

          <TouchableOpacity
            style={styles.socialButton}
            onPress={handleGoogleSignIn}
            disabled={loading}
          >
            <Text style={styles.socialText}>Continue with Google</Text>
          </TouchableOpacity>

          <Text style={styles.or}>OR EMAIL</Text>

          <Text style={styles.label}>Email Address</Text>
          <TextInput
            style={styles.input}
            placeholder="alex@morningmind.com"
            placeholderTextColor={colors.muted}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!loading}
            textContentType="emailAddress"
          />

          <View style={styles.passwordRow}>
            <Text style={styles.label}>Password</Text>
            <TouchableOpacity
              onPress={handleForgotPassword}
              disabled={loading}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Text style={styles.forgot}>Forgot password?</Text>
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.input}
            placeholder="••••••••"
            placeholderTextColor={colors.muted}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            editable={!loading}
            autoCapitalize="none"
            textContentType="password"
          />

          <View style={styles.cta}>
            <PrimaryButton
              label="Sign in to Wakely →"
              accessibilityLabel="Sign in to Wakely"
              loading={loading}
              onPress={handleSignIn}
              accessibilityHint="Signs in and returns to the app"
            />
          </View>

          <Text style={styles.signupText}>
            Don't have an account?{' '}
            <Text
              style={styles.signupLink}
              onPress={() => navigation.navigate('Signup')}
              accessibilityRole="link"
            >
              Sign Up Free
            </Text>
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    flex: { flex: 1 },
    container: {
      flexGrow: 1,
      justifyContent: 'center',
      paddingHorizontal: 20,
      paddingVertical: 30,
    },
    close: { alignSelf: 'flex-end', padding: 12 },
    closeText: { fontSize: FONT.bodyLg, color: colors.muted, fontWeight: '700' },
    logo: {
      alignSelf: 'center',
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.accentSoft,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12,
    },
    logoText: { fontSize: 24, color: colors.accent },
    title: {
      textAlign: 'center',
      fontSize: FONT.title,
      fontWeight: '700',
      color: colors.text,
    },
    subtitle: {
      textAlign: 'center',
      fontSize: FONT.body,
      color: colors.muted,
      marginTop: 6,
      marginBottom: 22,
    },
    socialButton: {
      minHeight: 48,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 10,
      paddingVertical: 12,
    },
    socialText: { color: colors.text, fontSize: FONT.body, fontWeight: '600' },
    or: {
      textAlign: 'center',
      color: colors.muted,
      fontSize: 12,
      fontWeight: '700',
      marginVertical: 15,
    },
    label: {
      color: colors.text,
      fontSize: 12,
      fontWeight: '600',
      marginBottom: 6,
    },
    input: {
      minHeight: 48,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      paddingHorizontal: 12,
      fontSize: FONT.body,
      color: colors.text,
      marginBottom: 14,
    },
    passwordRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    forgot: { color: colors.accent, fontSize: 12, paddingVertical: 12 },
    cta: { marginTop: 4 },
    signupText: {
      textAlign: 'center',
      color: colors.muted,
      marginTop: 22,
      fontSize: 12,
      paddingVertical: 12,
    },
    signupLink: { color: colors.accent, fontWeight: '700' },
  });
