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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING } from '../../theme';
import type { RootScreenProps } from '../../types/navigation';

type Props = RootScreenProps<'Login'>;

export default function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>✦</Text>
          </View>

          <Text style={styles.title}>Welcome to AlarmyApp</Text>
          <Text style={styles.subtitle}>
            Neutralize sleep inertia with smart circadian wake-up routines
          </Text>

          <TouchableOpacity style={styles.socialButton}>
            <Text style={styles.socialText}>G  Continue with Google</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.socialButton}>
            <Text style={styles.socialText}>●  Continue with Apple</Text>
          </TouchableOpacity>

          <Text style={styles.or}>OR EMAIL</Text>

          <Text style={styles.label}>Email Address</Text>
          <TextInput
            style={styles.input}
            placeholder="alex@morningmind.com"
            placeholderTextColor="#AAAAAA"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <View style={styles.passwordRow}>
            <Text style={styles.label}>Password</Text>
            <TouchableOpacity>
              <Text style={styles.forgot}>Forgot?</Text>
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.input}
            placeholder="••••••••"
            placeholderTextColor="#AAAAAA"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => navigation.replace('Main')}
          >
            <Text style={styles.primaryText}>Sign In to AlarmyApp  →</Text>
          </TouchableOpacity>

          <Text style={styles.signupText}>
            Don't have an account?{' '}
            <Text
              style={styles.signupLink}
              onPress={() => navigation.navigate('Signup')}
            >
              Sign Up Free
            </Text>
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  flex: { flex: 1 },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingVertical: 30,
  },
  logo: {
    alignSelf: 'center',
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  logoText: { fontSize: 24, color: COLORS.accent },
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
    marginTop: 6,
    marginBottom: 22,
  },
  socialButton: {
    height: 42,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  socialText: { color: COLORS.text, fontSize: 13, fontWeight: '600' },
  or: {
    textAlign: 'center',
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: '700',
    marginVertical: 15,
  },
  label: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 5,
  },
  input: {
    height: 43,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 13,
    color: COLORS.text,
    marginBottom: 14,
  },
  passwordRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  forgot: { color: COLORS.accent, fontSize: 12 },
  primaryButton: {
    height: 46,
    borderRadius: 11,
    backgroundColor: COLORS.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  primaryText: { color: COLORS.text, fontWeight: '700', fontSize: 13 },
  signupText: {
    textAlign: 'center',
    color: COLORS.muted,
    marginTop: 22,
    fontSize: 12,
  },
  signupLink: { color: COLORS.accent, fontWeight: '700' },
});
