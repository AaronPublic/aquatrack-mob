import React, { useState, useRef, useEffect } from 'react';
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
  Alert,
  Keyboard
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../src/config/supabase';
import { api } from '../../src/config/api';
import styles from './Login.styles';
import { useAuthStore } from '../../src/store/useAuthStore';
import AppIcon from '../../components/AppIcon';

export default function Register({ navigation }) {
  const scrollViewRef = useRef(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setIsKeyboardVisible(true)
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setIsKeyboardVisible(false)
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

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
          ref={scrollViewRef}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: isKeyboardVisible ? 280 : 40 }
          ]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
          scrollEnabled={true}
        >
          {/* ================= TOP BRANDING SECTION (#0C4F8B -> #008CE3) ================= */}
          <LinearGradient 
            colors={['#0C4F8B', '#008CE3']} 
            start={{ x: 0, y: 0 }} 
            end={{ x: 0, y: 1 }} 
            style={isKeyboardVisible ? styles.topSectionCompact : styles.topSection}
          >
            {/* Realistic Water Droplets Overlay Graphic */}
            <Image 
              source={require('../../assets/water_droplets.png')}
              style={styles.waterDropletsOverlay}
              resizeMode="cover"
            />

            <View style={styles.decorCircle1} />
            <View style={styles.decorCircle2} />

            {/* BIG TRANSPARENT PNG LOGO DIRECTLY ON BLUE */}
            <View style={isKeyboardVisible ? styles.logoWrapperCompact : styles.logoWrapper}>
              <Image 
                source={require('../../assets/Logo.png')}
                style={isKeyboardVisible ? styles.bigLogoImageCompact : styles.bigLogoImage}
                resizeMode="contain"
              />
              <View style={isKeyboardVisible ? styles.singleLogoDropletCompact : styles.singleLogoDroplet}>
                <View style={isKeyboardVisible ? styles.dropletHighlightCompact : styles.dropletHighlight} />
              </View>
            </View>

            <View style={isKeyboardVisible ? styles.cityBadgeCompact : styles.cityBadge}>
              <AppIcon name="water-outline" size={isKeyboardVisible ? 11 : 13} color="#E0F2FE" style={{ marginRight: 4 }} />
              <Text style={isKeyboardVisible ? styles.brandSubtitleCompact : styles.brandSubtitle}>CITY OF SAN FERNANDO</Text>
            </View>

            <Text style={isKeyboardVisible ? styles.brandDescriptionCompact : styles.brandDescription}>
              {isKeyboardVisible
                ? "Join the community network for instant water advisories & anomaly reporting."
                : "Join the community network to receive instant advisories, track pipe maintenance, and report water issues."}
            </Text>

            {/* Swirl Boundary Junction */}
            <View style={isKeyboardVisible ? styles.swirlWrapperCompact : styles.swirlWrapper}>
              <Image 
                source={require('../../assets/swirl_accent.png')}
                style={isKeyboardVisible ? styles.swirlAccentImageCompact : styles.swirlAccentImage}
                resizeMode="cover"
              />
              <Image 
                source={require('../../assets/swirl_boundary.png')}
                style={isKeyboardVisible ? styles.swirlBoundaryImageCompact : styles.swirlBoundaryImage}
                resizeMode="cover"
              />
            </View>
          </LinearGradient>

          {/* ================= BOTTOM ACTION SECTION (WHITE) ================= */}
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
                    onFocus={() => {
                      setIsKeyboardVisible(true);
                      setTimeout(() => scrollViewRef.current?.scrollTo({ y: 80, animated: true }), 120);
                    }}
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
                    onFocus={() => {
                      setIsKeyboardVisible(true);
                      setTimeout(() => scrollViewRef.current?.scrollTo({ y: 140, animated: true }), 120);
                    }}
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
                    onFocus={() => {
                      setIsKeyboardVisible(true);
                      setTimeout(() => scrollViewRef.current?.scrollTo({ y: 200, animated: true }), 120);
                    }}
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
                    onFocus={() => {
                      setIsKeyboardVisible(true);
                      setTimeout(() => scrollViewRef.current?.scrollTo({ y: 260, animated: true }), 120);
                    }}
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

            {/* Technical Issues Support Contact Box under form */}
            <View style={[styles.techSupportBox, { marginTop: 16 }]}>
              <Text style={styles.techSupportTitle}>Technical issues? Contact CSFWD IT Division</Text>
              <Text style={styles.techSupportPhone}>(045) 961-3546</Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
