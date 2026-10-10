import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../theme';
import type { RootScreenProps } from '../../types/navigation';

const personas = [
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
  const [selectedPersona, setSelectedPersona] = useState('early');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [password, setPassword] = useState('');

  const getPasswordStrength = () => {
    if (password.length === 0) return '';
    if (password.length < 6) return 'Weak';
    if (password.length < 10) return 'Medium';
    return 'Strong';
  };

  const passwordStrength = getPasswordStrength();

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Text style={styles.title}>Create Account</Text>

        <Text style={styles.subtitle}>Start your journey to energizing morning routines</Text>

        {/* Social Login */}
        <View style={styles.socialRow}>
          <TouchableOpacity style={styles.socialButton}>
            <Text style={styles.googleIcon}>G</Text>
            <Text style={styles.socialText}>Google</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.socialButton}>
            <Text style={styles.appleIcon}>●</Text>
            <Text style={styles.socialText}>Apple</Text>
          </TouchableOpacity>
        </View>

        {/* Full Name */}
        <Text style={styles.label}>Full Name</Text>

        <View style={styles.inputWrapper}>
          <Text style={styles.inputIcon}>♙</Text>

          <TextInput
            style={styles.input}
            placeholder="Indrabhan"
            placeholderTextColor="#AAAAAA"
            autoCapitalize="words"
          />
        </View>

        {/* Email */}
        <Text style={styles.label}>Email Address</Text>

        <View style={styles.inputWrapper}>
          <Text style={styles.inputIcon}>✉</Text>

          <TextInput
            style={styles.input}
            placeholder="indrabhan919@gmail.com"
            placeholderTextColor="#AAAAAA"
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        {/* Password */}
        <Text style={styles.label}>Create Password</Text>

        <View style={styles.inputWrapper}>
          <Text style={styles.inputIcon}>▣</Text>

          <TextInput
            style={styles.input}
            placeholder="••••••••"
            placeholderTextColor="#AAAAAA"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
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
          <Text style={styles.sectionTitle}>Select Your Sleep Persona</Text>

          <Text style={styles.tailorText}>Tailors Alarm</Text>
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
        >
          <View style={[styles.checkbox, acceptedTerms && styles.checkboxSelected]}>
            {acceptedTerms && <Text style={styles.check}>✓</Text>}
          </View>

          <Text style={styles.termsText}>I agree to Terms & Privacy Policy</Text>
        </TouchableOpacity>

        {/* Create Account */}
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => navigation.replace('Main')}
          activeOpacity={0.8}
        >
          <Text style={styles.primaryText}>Create Free Account →</Text>
        </TouchableOpacity>

        {/* Sign In */}
        <Text style={styles.bottomText}>
          Already registered?{' '}
          <Text style={styles.signInLink} onPress={() => navigation.goBack()}>
            Sign In
          </Text>
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  container: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingVertical: 24,
  },

  title: {
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
  },

  subtitle: {
    textAlign: 'center',
    fontSize: 12,
    color: COLORS.muted,
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
    height: 40,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 9,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    backgroundColor: COLORS.surface,
  },

  googleIcon: {
    fontSize: 14,
    fontWeight: '800',
    color: '#4285F4',
  },

  appleIcon: {
    fontSize: 12,
    color: '#222222',
  },

  socialText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
  },

  label: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 5,
    marginTop: 3,
  },

  inputWrapper: {
    height: 42,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 9,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    marginBottom: 9,
    backgroundColor: COLORS.surface,
  },

  inputIcon: {
    width: 22,
    fontSize: 13,
    color: '#777777',
  },

  input: {
    flex: 1,
    height: '100%',
    fontSize: 12,
    color: COLORS.text,
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
    color: COLORS.muted,
  },

  passwordStrength: {
    fontSize: 12,
    fontWeight: '700',
  },

  strong: {
    color: '#4F9B78',
  },

  medium: {
    color: '#C48A25',
  },

  weak: {
    color: '#B84A4A',
  },

  personaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 5,
    marginBottom: 7,
  },

  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text,
  },

  tailorText: {
    fontSize: 12,
    color: COLORS.accent,
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
    borderColor: COLORS.softBorder,
    borderRadius: 9,
    backgroundColor: '#FFFDF8',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },

  personaCardSelected: {
    borderColor: COLORS.accent,
    backgroundColor: '#FFF8E8',
  },

  personaIcon: {
    fontSize: 13,
    marginBottom: 3,
  },

  personaTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
  },

  personaTitleSelected: {
    color: COLORS.accent,
  },

  personaSubtitle: {
    fontSize: 7,
    color: COLORS.muted,
    textAlign: 'center',
    marginTop: 2,
  },

  termsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 13,
  },

  checkbox: {
    width: 15,
    height: 15,
    borderWidth: 1,
    borderColor: '#999999',
    borderRadius: 3,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 7,
  },

  checkboxSelected: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },

  check: {
    color: COLORS.surface,
    fontSize: 12,
    fontWeight: '800',
  },

  termsText: {
    fontSize: 12,
    color: COLORS.muted,
  },

  primaryButton: {
    height: 45,
    borderRadius: 10,
    backgroundColor: COLORS.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },

  primaryText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text,
  },

  bottomText: {
    textAlign: 'center',
    color: COLORS.muted,
    marginTop: 17,
    fontSize: 12,
  },

  signInLink: {
    color: COLORS.accent,
    fontWeight: '700',
  },
});
