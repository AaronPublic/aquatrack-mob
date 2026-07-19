import React, { useState } from 'react';
import { View, Text, Image, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { supabase } from '../../src/config/supabase';
import { api } from '../../src/config/api';
import styles from './Register.styles';
import { useAuthStore } from '../../src/store/useAuthStore';

export default function Register({ navigation }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const validatePassword = (pwd) => {
    // Password must contain uppercase, lowercase, numbers, and an asterisk (*)
    const hasUpper = /[A-Z]/.test(pwd);
    const hasLower = /[a-z]/.test(pwd);
    const hasNumber = /[0-9]/.test(pwd);
    const hasAsterisk = /\*/.test(pwd);
    return hasUpper && hasLower && hasNumber && hasAsterisk && pwd.length >= 8;
  };

  const handleRegister = async () => {
    if (!name || !email || !password || !confirmPassword) {
      setError("All fields are mandatory.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (!validatePassword(password)) {
      setError("Password must be at least 8 characters and contain: uppercase, lowercase, digit, and an asterisk (*).");
      return;
    }
    setError(null);
    setLoading(true);

    try {
      // 1. Sign Up in Supabase Auth
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
          }
        }
      });

      if (authError) {
        setError(authError.message);
        setLoading(false);
        return;
      }

      // Check if identities is empty (Supabase duplicate email indicator)
      if (data?.user?.identities && data.user.identities.length === 0) {
        setError("An account with this email already exists.");
        setLoading(false);
        return;
      }

      // 2. Sync to local database via Next.js api/auth/register endpoint
      const syncResult = await api.post('/api/auth/register', {
        id: data.user.id,
        email: email,
        fullName: name,
      });

      // Synchronize session and fetch profile if logged in immediately
      if (data.session) {
        useAuthStore.getState().setSession(data.session);
        await useAuthStore.getState().fetchProfile(data.user.id);
      }

      setLoading(false);
      Alert.alert(
        "Registration Sent",
        "Please check your email inbox to confirm your registration link before logging in.",
        [{ text: "Go to Login", onPress: () => navigation.navigate('Login') }]
      );
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to complete registration.");
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Image 
              source={{ uri: 'https://eivmilbjlkanxclysczl.supabase.co/storage/v1/object/public/complaint-media/LOGO2.png' }} 
              style={styles.logo}
              defaultSource={require('../../assets/icon.png')}
            />
            <Text style={styles.title}>AQUA<Text style={{ color: '#00aeef' }}>TRACK</Text></Text>
            <Text style={styles.subtitle}>Create a resident consumer account</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Juan dela Cruz"
                placeholderTextColor="#94a3b8"
                value={name}
                onChangeText={setName}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address</Text>
              <TextInput
                style={styles.input}
                placeholder="juan@domain.com"
                placeholderTextColor="#94a3b8"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Must include A, a, 1, and *"
                placeholderTextColor="#94a3b8"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirm Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Confirm password"
                placeholderTextColor="#94a3b8"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>

            {error && <Text style={styles.errorText}>{error}</Text>}

            <TouchableOpacity 
              style={[styles.button, loading && { opacity: 0.8 }]}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.buttonText}>Register</Text>
              )}
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account?</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.footerLink}>Login</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
