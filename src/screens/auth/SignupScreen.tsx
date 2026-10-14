import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PrimaryButton from '../../components/PrimaryButton';
import { useThemeColors } from '../../store/ThemeContext';
import { FONT, type ThemeColors } from '../../theme';
import type { RootScreenProps } from '../../types/navigation';
import { isValidEmail } from '../../utils/validation';
import {
  getAuthErrorMessage,
  signInWithGoogle,
  signUp,
  type SleepPersona,
} from '../../config/firebaseSetup';

const personas: { id: SleepPersona; title: string; subtitle: string; icon: string }[] = [
  {
    id: 'early',
    title: 'Early Bird',
    subtitle: 'Rise with the sun',
    icon: '☀',
  },
  {
    id: 'deep',
    title: 'Deep Sleeper',
    subtitle: 'Hard to wake',
    icon: '☾',
  },
  {
    id: 'napper',
    title: 'Power Napper',
    subtitle: 'Quick recharge',
    icon: '⚡',
  },
];

export default function SignupScreen({ navigation }: RootScreenProps<'Signup'>) {
  const [selectedPersona, setSelectedPersona] = useState<SleepPersona>('early');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const goBackToApp = () => {
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.navigate('Main');
  };

  const handleSignup = async () => {
    const normalizedName = fullName.trim();
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedName || !normalizedEmail || !password) {
      Alert.alert('Missing details', 'Please enter your name, email, and password.');
      return;
    }
    if (!isValidEmail(normalizedEmail)) {
      Alert.alert('Invalid email', 'Enter a valid email address, for example name@example.com.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Password too short', 'Use at least 6 characters.');
      return;
    }
    if (!acceptedTerms) {
      Alert.alert('Terms required', 'Please accept the terms and privacy policy.');
      return;
    }
    setLoading(true);
    try {
      await signUp(normalizedName, normalizedEmail, password, selectedPersona);
      Alert.alert('Account created', 'Your Wakely account is ready.', [
        { text: 'Continue', onPress: goBackToApp },
      ]);
    } catch (error: unknown) {
      Alert.alert('Signup failed', getAuthErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    if (!acceptedTerms) {
      Alert.alert('Terms required', 'Please accept the terms and privacy policy.');
      return;
    }
    setLoading(true);
    try {
      const user = await signInWithGoogle(selectedPersona);
      if (!user) return; // The account chooser was dismissed.
      Alert.alert('Account ready', `Welcome${user.displayName ? `, ${user.displayName}` : ''}!`, [
        { text: 'Continue', onPress: goBackToApp },
      ]);
    } catch (error) {
      Alert.alert('Google sign in failed', getAuthErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrength = () => {
    if (password.length === 0) return '';
    if (password.length < 6) return 'Weak';
    if (password.length < 10) return 'Medium';
    return 'Strong';
  };

  const passwordStrength = getPasswordStrength();
  const colors = useThemeColors();
  const styles = createStyles(colors);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Close sign up"
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          onPress={() => navigation.goBack()}
          style={styles.close}
        >
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
        {/* Header */}
        <Text style={styles.title}>Create Account</Text>

        <Text style={styles.subtitle}>Build a morning routine that sticks</Text>

        {/* Social Login */}
        <View style={styles.socialRow}>
          <TouchableOpacity
            style={styles.socialButton}
            onPress={handleGoogleSignup}
            disabled={loading}
          >
            <Text style={styles.googleIcon}>G</Text>
            <Text style={styles.socialText}>Continue with Google</Text>
          </TouchableOpacity>
        </View>

        {/* Full Name */}
        <Text style={styles.label}>Full Name</Text>

        <View style={styles.inputWrapper}>
          <Text style={styles.inputIcon}>♙</Text>

          <TextInput
            style={styles.input}
            placeholder="Alex Morgan"
            placeholderTextColor={colors.muted}
            autoCapitalize="words"
            value={fullName}
            onChangeText={setFullName}
            editable={!loading}
          />
        </View>

        {/* Email */}
        <Text style={styles.label}>Email Address</Text>

        <View style={styles.inputWrapper}>
          <Text style={styles.inputIcon}>✉</Text>

          <TextInput
            style={styles.input}
            placeholder="alex@example.com"
            placeholderTextColor={colors.muted}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            value={email}
            onChangeText={setEmail}
            editable={!loading}
            textContentType="emailAddress"
          />
        </View>

        {/* Password */}
        <Text style={styles.label}>Create Password</Text>

        <View style={styles.inputWrapper}>
          <Text style={styles.inputIcon}>▣</Text>

          <TextInput
            style={styles.input}
            placeholder="••••••••"
            placeholderTextColor={colors.muted}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            editable={!loading}
            autoCapitalize="none"
            textContentType="newPassword"
          />
        </View>

        {/* Password strength */}
        {passwordStrength !== '' && (
          <View style={styles.passwordStrengthRow}>
            <Text style={styles.passwordStrengthLabel}>Password strength</Text>

            <Text
              style={[
                styles.passwordStrength,
                passwordStrength === 'Strong' && styles.strong,
                passwordStrength === 'Medium' && styles.medium,
                passwordStrength === 'Weak' && styles.weak,
              ]}
            >
              {passwordStrength}
            </Text>
          </View>
        )}

        {/* Sleep Persona */}
        <View style={styles.personaHeader}>
          <Text style={styles.sectionTitle}>Your sleep style</Text>

          <Text style={styles.tailorText}>Personalizes alarms</Text>
        </View>

        <View style={styles.personaRow}>
          {personas.map(persona => {
            const selected = selectedPersona === persona.id;

            return (
              <TouchableOpacity
                key={persona.id}
                style={[styles.personaCard, selected && styles.personaCardSelected]}
                onPress={() => setSelectedPersona(persona.id)}
                activeOpacity={0.8}
                disabled={loading}
              >
                <Text style={styles.personaIcon}>{persona.icon}</Text>

                <Text style={[styles.personaTitle, selected && styles.personaTitleSelected]}>
                  {persona.title}
                </Text>

                <Text style={styles.personaSubtitle}>{persona.subtitle}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Terms */}
        <TouchableOpacity
          style={styles.termsRow}
          onPress={() => setAcceptedTerms(!acceptedTerms)}
          activeOpacity={0.8}
          disabled={loading}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: acceptedTerms }}
          accessibilityLabel="Agree to Terms and Privacy Policy"
        >
          <View style={[styles.checkbox, acceptedTerms && styles.checkboxSelected]}>
            {acceptedTerms && <Text style={styles.check}>✓</Text>}
          </View>

          <Text style={styles.termsText}>I agree to Terms & Privacy Policy</Text>
        </TouchableOpacity>

        {/* Create Account */}
        <View style={styles.cta}>
          <PrimaryButton
            label="Create free account →"
            accessibilityLabel="Create free account"
            loading={loading}
            onPress={handleSignup}
            accessibilityHint="Creates your account and returns to the app"
          />
        </View>

        {/* Sign In */}
        <Text style={styles.bottomText}>
          Already registered?{' '}
          <Text
            style={styles.signInLink}
            onPress={() => navigation.goBack()}
            accessibilityRole="link"
          >
            Sign In
          </Text>
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: colors.background,
    },

    container: {
      flexGrow: 1,
      justifyContent: 'center',
      paddingHorizontal: 20,
      paddingVertical: 24,
    },

    close: { alignSelf: 'flex-end', padding: 12 },
    closeText: { fontSize: FONT.bodyLg, color: colors.muted, fontWeight: '700' },

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
      marginTop: 5,
      marginBottom: 20,
    },

    socialRow: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 16,
    },

    socialButton: {
      flex: 1,
      minHeight: 48,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 9,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 7,
      backgroundColor: colors.surface,
      paddingVertical: 12,
    },

    googleIcon: {
      fontSize: 14,
      fontWeight: '800',
      color: '#4285F4',
    },

    socialText: {
      fontSize: FONT.body,
      fontWeight: '600',
      color: colors.text,
    },

    label: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 5,
      marginTop: 3,
    },

    inputWrapper: {
      minHeight: 48,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 9,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 10,
      marginBottom: 9,
      backgroundColor: colors.surface,
    },

    inputIcon: {
      width: 22,
      fontSize: FONT.body,
      color: colors.tabInactive,
    },

    input: {
      flex: 1,
      height: '100%',
      fontSize: FONT.body,
      color: colors.text,
      paddingVertical: 0,
    },

    passwordStrengthRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: -4,
      marginBottom: 5,
    },

    passwordStrengthLabel: {
      fontSize: 12,
      color: colors.muted,
    },

    passwordStrength: {
      fontSize: 12,
      fontWeight: '700',
    },

    strong: {
      color: colors.success,
    },

    medium: {
      color: colors.accent,
    },

    weak: {
      color: colors.danger,
    },

    personaHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 5,
      marginBottom: 7,
    },

    sectionTitle: {
      fontSize: FONT.body,
      fontWeight: '700',
      color: colors.text,
    },

    tailorText: {
      fontSize: 12,
      color: colors.accent,
      fontWeight: '600',
    },

    personaRow: {
      flexDirection: 'row',
      gap: 7,
      marginBottom: 13,
    },

    personaCard: {
      flex: 1,
      minHeight: 62,
      borderWidth: 1,
      borderColor: colors.softBorder,
      borderRadius: 9,
      backgroundColor: colors.card,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 3,
    },

    personaCardSelected: {
      borderColor: colors.accent,
      backgroundColor: colors.accentSoft,
    },

    personaIcon: {
      fontSize: FONT.body,
      marginBottom: 3,
    },

    personaTitle: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.text,
      textAlign: 'center',
    },

    personaTitleSelected: {
      color: colors.accent,
    },

    personaSubtitle: {
      fontSize: 12,
      color: colors.muted,
      textAlign: 'center',
      marginTop: 2,
    },

    termsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 13,
      minHeight: 44,
    },

    checkbox: {
      width: 24,
      height: 24,
      borderWidth: 1,
      borderColor: colors.tabInactive,
      borderRadius: 6,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 7,
    },

    checkboxSelected: {
      backgroundColor: colors.accent,
      borderColor: colors.accent,
    },

    check: {
      color: colors.onAccent,
      fontSize: 12,
      fontWeight: '800',
    },

    termsText: {
      fontSize: 12,
      color: colors.muted,
    },

    cta: { marginTop: 4 },

    bottomText: {
      textAlign: 'center',
      color: colors.muted,
      marginTop: 17,
      fontSize: 12,
      paddingVertical: 12,
    },

    signInLink: {
      color: colors.accent,
      fontWeight: '700',
    },
  });
