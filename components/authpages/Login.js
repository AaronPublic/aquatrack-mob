import React, { useState, useRef } from 'react';
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
  Dimensions,
  Alert,
  Modal
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../src/config/supabase';
import { api } from '../../src/config/api';
import styles from './Login.styles';
import { useAuthStore } from '../../src/store/useAuthStore';
import { Ionicons } from '@expo/vector-icons';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function Login({ navigation, route }) {
  const scrollViewRef = useRef(null);

  // Mode state: 'IDLE' (clean 2-button view) | 'LOGIN' | 'REGISTER'
  const [authMode, setAuthMode] = useState('IDLE');

  // Login method: 'PASSWORD' | 'BILLING'
  const [authMethod, setAuthMethod] = useState('PASSWORD');

  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [billingId, setBillingId] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState(null);
  const [adminModalVisible, setAdminModalVisible] = useState(false);

  // Register form state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regShowPassword, setRegShowPassword] = useState(false);
  const [regLoading, setRegLoading] = useState(false);

  const validateEmail = () => {
    if (email && !/\S+@\S+\.\S+/.test(email)) {
      setEmailError("Invalid email address format");
      return false;
    } else {
      setEmailError(null);
      return true;
    }
  };

  const validatePassword = (pwd) => {
    const hasUpper = /[A-Z]/.test(pwd);
    const hasLower = /[a-z]/.test(pwd);
    const hasNumber = /[0-9]/.test(pwd);
    const hasAsterisk = /\*/.test(pwd);
    return hasUpper && hasLower && hasNumber && hasAsterisk && pwd.length >= 8;
  };

  const handleOpenLogin = () => {
    setAuthMode('LOGIN');
    setError(null);
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({ y: SCREEN_HEIGHT * 0.44, animated: true });
    }, 120);
  };

  const handleOpenRegister = () => {
    setAuthMode('REGISTER');
    setError(null);
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({ y: SCREEN_HEIGHT * 0.44, animated: true });
    }, 120);
  };

  const handleBackToLanding = () => {
    setAuthMode('IDLE');
    setError(null);
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
  };

  const handleQrScanSimulation = () => {
    setIsScanning(true);
    setError(null);
    setTimeout(() => {
      setBillingId("BILL-SF904128");
      setIsScanning(false);
    }, 1000);
  };

  const handleLoginSubmit = async () => {
    if (authMethod === 'BILLING') {
      setError("Billing ID credential access is reserved purely for physical self-service kiosk terminals. Please switch back to Password Login.");
      return;
    }

    const isEmailValid = validateEmail();

    if (!email || !password) {
      setError("Please fill in both Email Address and Password.");
      return;
    }
    if (!isEmailValid) {
      setError("Please enter a valid email address.");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      // 1. Pre-check user role in DB by email before initiating Supabase Auth session
      const { data: preCheckUser } = await supabase
        .from('User')
        .select('role')
        .ilike('email', email.trim())
        .maybeSingle();

      if (preCheckUser && preCheckUser.role === 'ADMIN') {
        setError(null);
        setAdminModalVisible(true);
        setLoading(false);
        return;
      }

      // 2. Authenticate credentials with Supabase Auth for non-admin accounts
      const { data, error: authErr } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authErr) {
        setError(
          authErr.status === 400
            ? "Invalid email address or password combination. Please try again."
            : authErr.message
        );
        setLoading(false);
        return;
      }

      const profile = await useAuthStore.getState().fetchProfile(data.user.id);

      if (profile && profile.role === 'ADMIN') {
        await supabase.auth.signOut();
        await useAuthStore.getState().signOut();
        setError(null);
        setAdminModalVisible(true);
        setLoading(false);
        return;
      }

      useAuthStore.getState().setSession(data.session);

      if (profile && profile.role === 'FIELD_ENGINEER_TECHNICIAN') {
        navigation.reset({
          index: 0,
          routes: [{ name: 'SubAdminTab' }],
        });
      } else {
        navigation.reset({
          index: 0,
          routes: [{ name: 'ConsumerTab' }],
        });
      }
    } catch (err) {
      console.error(err);
      setError(err.message || "An unexpected error occurred during login.");
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async () => {
    if (!regName || !regEmail || !regPassword || !regConfirmPassword) {
      setError("All mandatory registration fields are required.");
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (!validatePassword(regPassword)) {
      setError("Password must be at least 8 chars with uppercase, lowercase, number, and an asterisk (*).");
      return;
    }

    setError(null);
    setRegLoading(true);

    try {
      const { data, error: authErr } = await supabase.auth.signUp({
        email: regEmail,
        password: regPassword,
        options: {
          data: { full_name: regName }
        }
      });

      if (authErr) {
        setError(authErr.message);
        setRegLoading(false);
        return;
      }

      if (data?.user?.identities && data.user.identities.length === 0) {
        setError("An account with this email address already exists.");
        setRegLoading(false);
        return;
      }

      await api.post('/api/auth/register', {
        id: data.user.id,
        email: regEmail,
        fullName: regName,
      });

      if (data.session) {
        useAuthStore.getState().setSession(data.session);
        await useAuthStore.getState().fetchProfile(data.user.id);
      }

      setRegLoading(false);
      Alert.alert(
        "Registration Sent",
        "Please check your email inbox to confirm your registration link before logging in.",
        [{ text: "Go to Login", onPress: () => handleOpenLogin() }]
      );
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to complete registration.");
      setRegLoading(false);
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
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ================= 70% TOP BRANDING SECTION (BLUE GRADIENT) ================= */}
          <LinearGradient 
            colors={['#0C4F8B', '#008CE3']} 
            start={{ x: 0, y: 0 }} 
            end={{ x: 0, y: 1 }} 
            style={styles.topSection}
          >
            {/* Subtle Reduced Water Droplets Overlay Texture */}
            <Image 
              source={require('../../assets/water_droplets.png')}
              style={styles.waterDropletsOverlay}
              resizeMode="cover"
            />

            {/* Background Water Ripple Micro-Decorations */}
            <View style={styles.decorCircle1} />
            <View style={styles.decorCircle2} />

            {/* BIG TRANSPARENT PNG LOGO WITH SINGLE SHINY WATER DROPLET */}
            <View style={styles.logoWrapper}>
              <Image 
                source={require('../../assets/Logo.png')}
                style={styles.bigLogoImage}
                resizeMode="contain"
              />
              {/* ONE Single Shiny Realistic Water Droplet on the Logo */}
              <View style={styles.singleLogoDroplet}>
                <View style={styles.dropletHighlight} />
              </View>
            </View>

            <View style={styles.cityBadge}>
              <Ionicons name="water-outline" size={13} color="#E0F2FE" style={{ marginRight: 4 }} />
              <Text style={styles.brandSubtitle}>CITY OF SAN FERNANDO</Text>
            </View>

            <Text style={styles.brandDescription}>
              Empowering residents with real-time water quality tracking, automated anomaly reporting, and municipal advisories.
            </Text>

            {/* Swirl Boundary Transition */}
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
          </LinearGradient>

          {/* ================= 30% BOTTOM ACTION SECTION (WHITE) ================= */}
          <View style={styles.bottomSection}>

            {/* Global Error Banner */}
            {error && (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle-outline" size={18} color="#D32F2F" style={{ marginRight: 6 }} />
                <Text style={styles.errorBoxText}>{error}</Text>
              </View>
            )}

            {/* ================= INITIAL LANDING: ONLY 2 BUTTONS + SUPPORT INFO ================= */}
            {authMode === 'IDLE' && (
              <View style={styles.idleButtonsContainer}>
                <TouchableOpacity 
                  activeOpacity={0.88}
                  style={styles.idleLoginBtn}
                  onPress={handleOpenLogin}
                >
                  <Ionicons name="log-in-outline" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                  <Text style={styles.idleLoginBtnText}>LOGIN</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  activeOpacity={0.88}
                  style={styles.idleRegisterBtn}
                  onPress={handleOpenRegister}
                >
                  <Ionicons name="person-add-outline" size={20} color="#2196F3" style={{ marginRight: 8 }} />
                  <Text style={styles.idleRegisterBtnText}>REGISTER</Text>
                </TouchableOpacity>

                {/* "or" Divider */}
                <View style={styles.orDividerContainer}>
                  <View style={styles.orDividerLine} />
                  <Text style={styles.orDividerText}>or</Text>
                  <View style={styles.orDividerLine} />
                </View>

                {/* Technical Issues Support Contact Box */}
                <View style={styles.techSupportBox}>
                  <Text style={styles.techSupportTitle}>Technical issues? Contact CSFWD IT Division</Text>
                  <Text style={styles.techSupportPhone}>(045) 961-3546</Text>
                </View>
              </View>
            )}

            {/* ================= LOGIN MODE ================= */}
            {authMode === 'LOGIN' && (
              <View style={styles.formContainer}>
                {/* Form Header with Back Navigation */}
                <View style={styles.formHeaderRow}>
                  <TouchableOpacity 
                    style={styles.backBtn}
                    onPress={handleBackToLanding}
                  >
                    <Ionicons name="arrow-back" size={20} color="#2196F3" />
                    <Text style={styles.backBtnText}>Back</Text>
                  </TouchableOpacity>
                  <Text style={styles.formHeaderTitle}>LOGIN</Text>
                </View>

                {/* Sub-selector for Password Login vs Billing ID Login */}
                <View style={styles.subSelectorContainer}>
                  <TouchableOpacity 
                    activeOpacity={0.8}
                    style={[styles.subSelectorBtn, authMethod === 'PASSWORD' && styles.subSelectorBtnActive]}
                    onPress={() => { setAuthMethod('PASSWORD'); setError(null); }}
                  >
                    <Ionicons 
                      name="key-outline" 
                      size={14} 
                      color={authMethod === 'PASSWORD' ? '#2196F3' : '#64748B'} 
                      style={{ marginRight: 4 }}
                    />
                    <Text style={[styles.subSelectorTxt, authMethod === 'PASSWORD' && styles.subSelectorTxtActive]}>
                      Password Login
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    activeOpacity={0.8}
                    style={[styles.subSelectorBtn, authMethod === 'BILLING' && styles.subSelectorBtnActive]}
                    onPress={() => { setAuthMethod('BILLING'); setError(null); }}
                  >
                    <Ionicons 
                      name="qr-code-outline" 
                      size={14} 
                      color={authMethod === 'BILLING' ? '#2196F3' : '#64748B'} 
                      style={{ marginRight: 4 }}
                    />
                    <Text style={[styles.subSelectorTxt, authMethod === 'BILLING' && styles.subSelectorTxtActive]}>
                      Billing ID Login
                    </Text>
                  </TouchableOpacity>
                </View>

                {authMethod === 'PASSWORD' ? (
                  <>
                    {/* Email Address */}
                    <View style={styles.fieldGroup}>
                      <Text style={styles.fieldLabel}>EMAIL ADDRESS</Text>
                      <View style={styles.fieldInputWrapper}>
                        <Ionicons name="mail-outline" size={18} color="#64748B" style={styles.fieldIconLeft} />
                        <TextInput
                          style={styles.fieldInput}
                          placeholder="e.g. resident@sanfernando.gov.ph"
                          placeholderTextColor="#94A3B8"
                          value={email}
                          onChangeText={(val) => { setEmail(val); setEmailError(null); }}
                          onBlur={validateEmail}
                          autoCapitalize="none"
                          keyboardType="email-address"
                        />
                      </View>
                      {emailError && <Text style={styles.fieldErrorText}>{emailError}</Text>}
                    </View>

                    {/* Password */}
                    <View style={styles.fieldGroup}>
                      <Text style={styles.fieldLabel}>PASSWORD</Text>
                      <View style={styles.fieldInputWrapper}>
                        <Ionicons name="lock-closed-outline" size={18} color="#64748B" style={styles.fieldIconLeft} />
                        <TextInput
                          style={styles.fieldInput}
                          placeholder="Enter password"
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
                          <Ionicons 
                            name={showPassword ? "eye-off-outline" : "eye-outline"} 
                            size={20} 
                            color="#64748B" 
                          />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </>
                ) : (
                  <>
                    {/* Billing ID Input */}
                    <View style={styles.fieldGroup}>
                      <Text style={styles.fieldLabel}>BILLING ID</Text>
                      <View style={styles.fieldInputWrapper}>
                        <Ionicons name="receipt-outline" size={18} color="#64748B" style={styles.fieldIconLeft} />
                        <TextInput
                          style={[styles.fieldInput, { fontFamily: 'GeistMono-Regular' }]}
                          placeholder="BILL-SF904128"
                          placeholderTextColor="#94A3B8"
                          value={billingId}
                          onChangeText={setBillingId}
                          autoCapitalize="characters"
                        />
                      </View>
                    </View>

                    {/* QR Code Scan simulation button */}
                    <TouchableOpacity 
                      style={styles.qrScanBtn}
                      onPress={handleQrScanSimulation}
                      activeOpacity={0.8}
                      disabled={isScanning}
                    >
                      {isScanning ? (
                        <ActivityIndicator color="#FFFFFF" size="small" />
                      ) : (
                        <>
                          <Ionicons name="scan-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                          <Text style={styles.qrScanBtnText}>SIMULATE QR SCAN</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </>
                )}

                {/* Submit Action */}
                <TouchableOpacity 
                  style={styles.primaryActionButton}
                  onPress={handleLoginSubmit}
                  disabled={loading}
                  activeOpacity={0.9}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <>
                      <Text style={styles.primaryActionText}>SIGN IN</Text>
                      <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                    </>
                  )}
                </TouchableOpacity>

                {/* Technical Issues Support Contact Box under form */}
                <View style={[styles.techSupportBox, { marginTop: 16 }]}>
                  <Text style={styles.techSupportTitle}>Technical issues? Contact CSFWD IT Division</Text>
                  <Text style={styles.techSupportPhone}>(045) 961-3546</Text>
                </View>
              </View>
            )}

            {/* ================= REGISTER MODE ================= */}
            {authMode === 'REGISTER' && (
              <View style={styles.formContainer}>
                {/* Form Header with Back Navigation */}
                <View style={styles.formHeaderRow}>
                  <TouchableOpacity 
                    style={styles.backBtn}
                    onPress={handleBackToLanding}
                  >
                    <Ionicons name="arrow-back" size={20} color="#2196F3" />
                    <Text style={styles.backBtnText}>BACK</Text>
                  </TouchableOpacity>
                  <Text style={styles.formHeaderTitle}>REGISTER</Text>
                </View>

                {/* Full Name */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>FULL NAME</Text>
                  <View style={styles.fieldInputWrapper}>
                    <Ionicons name="person-outline" size={18} color="#64748B" style={styles.fieldIconLeft} />
                    <TextInput
                      style={styles.fieldInput}
                      placeholder="Juan dela Cruz"
                      placeholderTextColor="#94A3B8"
                      value={regName}
                      onChangeText={setRegName}
                    />
                  </View>
                </View>

                {/* Email Address */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>EMAIL ADDRESS</Text>
                  <View style={styles.fieldInputWrapper}>
                    <Ionicons name="mail-outline" size={18} color="#64748B" style={styles.fieldIconLeft} />
                    <TextInput
                      style={styles.fieldInput}
                      placeholder="juan@domain.com"
                      placeholderTextColor="#94A3B8"
                      value={regEmail}
                      onChangeText={setRegEmail}
                      autoCapitalize="none"
                      keyboardType="email-address"
                    />
                  </View>
                </View>

                {/* Password */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>PASSWORD</Text>
                  <View style={styles.fieldInputWrapper}>
                    <Ionicons name="lock-closed-outline" size={18} color="#64748B" style={styles.fieldIconLeft} />
                    <TextInput
                      style={styles.fieldInput}
                      placeholder="e.g. Pass1234*"
                      placeholderTextColor="#94A3B8"
                      value={regPassword}
                      onChangeText={setRegPassword}
                      secureTextEntry={!regShowPassword}
                      autoCapitalize="none"
                    />
                    <TouchableOpacity 
                      onPress={() => setRegShowPassword(!regShowPassword)}
                      style={styles.fieldIconRight}
                    >
                      <Ionicons 
                        name={regShowPassword ? "eye-off-outline" : "eye-outline"} 
                        size={20} 
                        color="#64748B" 
                      />
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.passwordHintText}>
                    Must be 8+ chars with uppercase, lowercase, digit, and asterisk (*).
                  </Text>
                </View>

                {/* Confirm Password */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>CONFIRM PASSWORD</Text>
                  <View style={styles.fieldInputWrapper}>
                    <Ionicons name="checkmark-circle-outline" size={18} color="#64748B" style={styles.fieldIconLeft} />
                    <TextInput
                      style={styles.fieldInput}
                      placeholder="Re-enter password"
                      placeholderTextColor="#94A3B8"
                      value={regConfirmPassword}
                      onChangeText={setRegConfirmPassword}
                      secureTextEntry={!regShowPassword}
                      autoCapitalize="none"
                    />
                  </View>
                </View>

                {/* Submit Action */}
                <TouchableOpacity 
                  style={styles.primaryActionButton}
                  onPress={handleRegisterSubmit}
                  disabled={regLoading}
                  activeOpacity={0.9}
                >
                  {regLoading ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <>
                      <Text style={styles.primaryActionText}>CREATE ACCOUNT</Text>
                      <Ionicons name="person-add-outline" size={18} color="#FFFFFF" />
                    </>
                  )}
                </TouchableOpacity>

                {/* Technical Issues Support Contact Box under form */}
                <View style={[styles.techSupportBox, { marginTop: 16 }]}>
                  <Text style={styles.techSupportTitle}>Technical issues? Contact CSFWD IT Division</Text>
                  <Text style={styles.techSupportPhone}>(045) 961-3546</Text>
                </View>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── Admin Access Restriction Modal ────────────────────────────── */}
      <Modal
        visible={adminModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setAdminModalVisible(false)}
      >
        <TouchableOpacity 
          style={{
            flex: 1,
            backgroundColor: 'rgba(11, 34, 64, 0.55)',
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: 24,
          }}
          activeOpacity={1}
          onPress={() => setAdminModalVisible(false)}
        >
          <TouchableOpacity 
            activeOpacity={1} 
            style={{
              backgroundColor: '#FFFFFF',
              width: '100%',
              borderRadius: 28,
              padding: 24,
              alignItems: 'center',
              shadowColor: '#0B2240',
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.15,
              shadowRadius: 24,
              elevation: 10,
            }}
          >
            {/* Warning Shield Icon */}
            <View 
              style={{
                width: 60,
                height: 60,
                borderRadius: 30,
                backgroundColor: '#FEE2E2',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
              }}
            >
              <Ionicons name="shield-outline" size={30} color="#EF4444" />
            </View>

            {/* Modal Title & Message */}
            <Text style={{ fontSize: 18, fontWeight: '800', color: '#0F172A', marginBottom: 8, textAlign: 'center' }}>
              Admin Access Restricted
            </Text>
            <Text style={{ fontSize: 13, color: '#64748B', textAlign: 'center', lineHeight: 19, marginBottom: 20 }}>
              Administrator accounts are restricted to the Web Administrative Portal and cannot log in on the mobile application.
            </Text>

            {/* Close Button */}
            <TouchableOpacity
              onPress={() => setAdminModalVisible(false)}
              activeOpacity={0.8}
              style={{
                height: 48,
                backgroundColor: '#0C4F8B',
                borderRadius: 14,
                width: '100%',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '700' }}>
                I Understand
              </Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}
