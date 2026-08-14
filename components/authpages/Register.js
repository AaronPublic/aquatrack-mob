import React, { useState } from 'react';
import { 
  View, 
  Text, 
  Image, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator, 
  KeyboardAvoidingView, 
  Platform, 
  ScrollView,
  Alert
} from 'react-native';
import { supabase } from '../../src/config/supabase';
import { api } from '../../src/config/api';
import styles from './Login.styles';
import { useAuthStore } from '../../src/store/useAuthStore';
import AppIcon from '../../components/AppIcon';

export default function Register({ navigation }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const validatePassword = (pwd) => {
    const hasUpper = /[A-Z]/.test(pwd);
    const hasLower = /[a-z]/.test(pwd);
    const hasNumber = /[0-9]/.test(pwd);
    const hasAsterisk = /\*/.test(pwd);
    return hasUpper && hasLower && hasNumber && hasAsterisk && pwd.length >= 8;
  };

  const handleRegisterSubmit = async () => {
    if (!name || !email || !password || !confirmPassword) {
      setError("All mandatory fields are required.");
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

      if (data?.user?.identities && data.user.identities.length === 0) {
        setError("An account with this email address already exists.");
        setLoading(false);
        return;
      }

      await api.post('/api/auth/register', {
        id: data.user.id,
        email: email,
        fullName: name,
      });

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
    <View style={styles.outerContainer}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardContainer}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ================= 70% TOP BRANDING SECTION (#2196F3) ================= */}
          <View style={styles.topSection}>
            {/* Realistic Water Droplets Overlay Graphic */}
            <Image 
              source={require('../../assets/water_droplets.png')}
              style={styles.waterDropletsOverlay}
              resizeMode="cover"
            />

            <View style={styles.decorCircle1} />
            <View style={styles.decorCircle2} />
            <View style={styles.decorCircle3} />

            {/* BIG TRANSPARENT PNG LOGO DIRECTLY ON BLUE */}
            <Image 
              source={require('../../assets/Logo.png')}
              style={styles.bigLogoImage}
              resizeMode="contain"
            />

            <View style={styles.cityBadge}>
              <AppIcon name="water-outline" size={13} color="#E0F2FE" style={{ marginRight: 4 }} />
              <Text style={styles.brandSubtitle}>CITY OF SAN FERNANDO</Text>
            </View>

            <Text style={styles.brandDescription}>
              Join the community network to receive instant advisories, track pipe maintenance, and report water issues.
            </Text>

            {/* Swirl Boundary Junction */}
            <View style={styles.swirlWrapper}>
              <Image 
                source={require('../../assets/swirl_accent.png')}
                style={styles.swirlAccentImage}
                resizeMode="cover"
              />
              <Image 
                source={require('../../assets/swirl_boundary.png')}
                style={styles.swirlBoundaryImage}
                resizeMode="cover"
              />
            </View>
          </View>

          {/* ================= 30% BOTTOM ACTION SECTION (WHITE) ================= */}
          <View style={styles.bottomSection}>
            
            {/* Form Header with Back Navigation */}
            <View style={styles.formHeaderRow}>
              <TouchableOpacity 
                style={styles.backBtn}
                onPress={() => navigation.navigate('Login')}
              >
                <AppIcon name="arrow-back" size={20} color="#2196F3" />
                <Text style={styles.backBtnText}>Back</Text>
              </TouchableOpacity>
              <Text style={styles.formHeaderTitle}>REGISTER</Text>
            </View>

            {error && (
              <View style={styles.errorBox}>
                <AppIcon name="alert-circle-outline" size={18} color="#D32F2F" style={{ marginRight: 6 }} />
                <Text style={styles.errorBoxText}>{error}</Text>
              </View>
            )}

            <View style={styles.formContainer}>
              {/* Full Name */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>FULL NAME</Text>
                <View style={styles.fieldInputWrapper}>
                  <AppIcon name="person-outline" size={18} color="#64748B" style={styles.fieldIconLeft} />
                  <TextInput
                    style={styles.fieldInput}
                    placeholder="Juan dela Cruz"
                    placeholderTextColor="#94A3B8"
                    value={name}
                    onChangeText={setName}
                  />
                </View>
              </View>

              {/* Email Address */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>EMAIL ADDRESS</Text>
                <View style={styles.fieldInputWrapper}>
                  <AppIcon name="mail-outline" size={18} color="#64748B" style={styles.fieldIconLeft} />
                  <TextInput
                    style={styles.fieldInput}
                    placeholder="juan@domain.com"
                    placeholderTextColor="#94A3B8"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />
                </View>
              </View>

              {/* Password */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>PASSWORD</Text>
                <View style={styles.fieldInputWrapper}>
                  <AppIcon name="lock-closed-outline" size={18} color="#64748B" style={styles.fieldIconLeft} />
                  <TextInput
                    style={styles.fieldInput}
                    placeholder="Must include A, a, 1, and *"
                    placeholderTextColor="#94A3B8"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity 
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.fieldIconRight}
                  >
                    <AppIcon 
                      name={showPassword ? "eye-off-outline" : "eye-outline"} 
                      size={20} 
                      color="#64748B" 
                    />
                  </TouchableOpacity>
                </View>
                <Text style={styles.passwordHintText}>
                  Must contain 8+ characters, uppercase, lowercase, digit, and asterisk (*).
                </Text>
              </View>

              {/* Confirm Password */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>CONFIRM PASSWORD</Text>
                <View style={styles.fieldInputWrapper}>
                  <AppIcon name="checkmark-circle-outline" size={18} color="#64748B" style={styles.fieldIconLeft} />
                  <TextInput
                    style={styles.fieldInput}
                    placeholder="Confirm account password"
                    placeholderTextColor="#94A3B8"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                  />
                </View>
              </View>

              {/* Submit Action */}
              <TouchableOpacity 
                style={styles.primaryActionButton}
                onPress={handleRegisterSubmit}
                disabled={loading}
                activeOpacity={0.9}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <Text style={styles.primaryActionText}>CREATE ACCOUNT</Text>
                    <AppIcon name="person-add-outline" size={18} color="#FFFFFF" />
                  </>
                )}
              </TouchableOpacity>
            </View>

            <Text style={styles.supportFooterText}>
              Technical Support: CSFWD IT Division (045) 961-3546
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
