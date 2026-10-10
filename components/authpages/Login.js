import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator, 
  KeyboardAvoidingView, 
  Platform, 
  ScrollView, 
  Dimensions, 
  Alert, 
  Modal, 
  Keyboard,
  Linking
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../src/config/supabase';
import { api } from '../../src/config/api';
import styles from './Login.styles';
import { useAuthStore } from '../../src/store/useAuthStore';
import AppIcon from '../../components/AppIcon';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function Login({ navigation, route }) {
  const scrollViewRef = useRef(null);

  // Mode state: 'IDLE' (clean 2-button view) | 'LOGIN' | 'REGISTER'
  const [authMode, setAuthMode] = useState('IDLE');

  // Login method: 'PASSWORD' | 'BILLING'
  const [authMethod, setAuthMethod] = useState('PASSWORD');

  // Track focused field for input styling
  const [focusedField, setFocusedField] = useState(null);

  // Track keyboard visibility for dynamic scrolling
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
  const [supportModalVisible, setSupportModalVisible] = useState(false);

  const handleDial = (phoneNumber) => {
    const cleanNum = phoneNumber.replace(/[^0-9+]/g, '');
    Linking.openURL(`tel:${cleanNum}`).catch(() => {
      Alert.alert("CSFWD Hotline", `Please dial ${phoneNumber}`);
    });
  };

  const handleEmail = (emailAddr) => {
    Linking.openURL(`mailto:${emailAddr}`).catch(() => {
      Alert.alert("CSFWD Email", `Please send email to ${emailAddr}`);
    });
  };

  // Register form state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regAddress, setRegAddress] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regShowPassword, setRegShowPassword] = useState(false);
  const [regShowConfirm, setRegShowConfirm] = useState(false);
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
    scrollViewRef.current?.scrollTo({ y: 0, animated: false });
  };

  const handleOpenRegister = () => {
    setAuthMode('REGISTER');
    setError(null);
    scrollViewRef.current?.scrollTo({ y: 0, animated: false });
  };

  const handleBackToLanding = () => {
    Keyboard.dismiss();
    setAuthMode('IDLE');
    setError(null);
    scrollViewRef.current?.scrollTo({ y: 0, animated: false });
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
        email: email.trim(),
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
    } catch (err) {
      console.error(err);
      setError(err.message || "An unexpected error occurred during login.");
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async () => {
    if (!regName.trim() || !regEmail.trim() || !regPhone.trim() || !regAddress.trim() || !regPassword || !regConfirmPassword) {
      setError("All fields are mandatory. Please fill in all details.");
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setError("Passwords do not match. Please try again.");
      return;
    }
    if (!validatePassword(regPassword)) {
      setError("Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and an asterisk (*).");
      return;
    }

    setError(null);
    setRegLoading(true);

    try {
      const { data, error: authErr } = await supabase.auth.signUp({
        email: regEmail.trim(),
        password: regPassword,
        options: {
          data: { 
            full_name: regName.trim(),
            phone: regPhone.trim(),
            address: regAddress.trim(),
          }
        }
      });

      if (authErr) {
        setError(authErr.message);
        setRegLoading(false);
        return;
      }

      if (data?.user?.identities && data.user.identities.length === 0) {
        setError("This email address is already registered. Please sign in or use a different email.");
        setRegLoading(false);
        return;
      }

      if (data.user?.id) {
        try {
          await api.post('/api/auth/register', {
            id: data.user.id,
            email: data.user.email || regEmail.trim(),
            fullName: regName.trim(),
            phone: regPhone.trim(),
            address: regAddress.trim(),
          });
        } catch (syncErr) {
          console.warn("DB profile sync failed; auth account created:", syncErr);
        }
      }

      if (data.session) {
        useAuthStore.getState().setSession(data.session);
        await useAuthStore.getState().fetchProfile(data.user.id);
      }

      setRegLoading(false);
      Alert.alert(
        "Registration Submitted",
        `A verification email has been sent to ${regEmail.trim()}. Please check your email inbox to confirm your registration link before logging in.`,
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
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: isKeyboardVisible ? 280 : 40 }
          ]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
          scrollEnabled={true}
        >
          {/* ================= TOP BRANDING SECTION (BLUE GRADIENT) ================= */}
          <LinearGradient 
            colors={['#0C4F8B', '#008CE3']} 
            start={{ x: 0, y: 0 }} 
            end={{ x: 0, y: 1 }} 
            style={isKeyboardVisible ? styles.topSectionCompact : styles.topSection}
          >
            {/* Subtle Reduced Water Droplets Overlay Texture */}
            <Image 
              source={require('../../assets/water_droplets.png')}
              style={styles.waterDropletsOverlay}
              contentFit="cover"
            />

            {/* Background Water Ripple Micro-Decorations */}
            <View style={styles.decorCircle1} />
            <View style={styles.decorCircle2} />

            {/* BIG TRANSPARENT PNG LOGO WITH SINGLE SHINY WATER DROPLET */}
            <View style={isKeyboardVisible ? styles.logoWrapperCompact : styles.logoWrapper}>
              <Image 
                source={require('../../assets/Logo.png')}
                style={isKeyboardVisible ? styles.bigLogoImageCompact : styles.bigLogoImage}
                contentFit="contain"
              />
              {/* ONE Single Shiny Realistic Water Droplet on the Logo */}
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
                ? "Real-time water quality tracking & municipal advisories."
                : "Empowering residents with real-time water quality tracking, automated anomaly reporting, and municipal advisories."}
            </Text>

            {/* Swirl Boundary Transition */}
            <View style={isKeyboardVisible ? styles.swirlWrapperCompact : styles.swirlWrapper}>
              <Image 
                source={require('../../assets/swirl_accent.png')}
                style={isKeyboardVisible ? styles.swirlAccentImageCompact : styles.swirlAccentImage}
                contentFit="cover"
              />
              <Image 
                source={require('../../assets/swirl_boundary.png')}
                style={isKeyboardVisible ? styles.swirlBoundaryImageCompact : styles.swirlBoundaryImage}
                contentFit="cover"
              />
            </View>
          </LinearGradient>

          {/* ================= 30% BOTTOM ACTION SECTION (WHITE) ================= */}
          <View style={styles.bottomSection}>

            {/* Global Error Banner */}
            {error && (
              <View style={styles.errorBox}>
                <AppIcon name="alert-circle-outline" size={18} color="#D32F2F" style={{ marginRight: 6 }} />
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
                  <AppIcon name="log-in-outline" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                  <Text style={styles.idleLoginBtnText}>LOGIN</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  activeOpacity={0.88}
                  style={styles.idleRegisterBtn}
                  onPress={handleOpenRegister}
                >
                  <AppIcon name="person-add-outline" size={20} color="#0284C7" style={{ marginRight: 8 }} />
                  <Text style={styles.idleRegisterBtnText}>REGISTER</Text>
                </TouchableOpacity>

                {/* "or" Divider */}
                <View style={styles.orDividerContainer}>
                  <View style={styles.orDividerLine} />
                  <Text style={styles.orDividerText}>OR</Text>
                  <View style={styles.orDividerLine} />
                </View>

                {/* Technical Issues Support Contact Card */}
                <TouchableOpacity 
                  style={styles.techSupportCard}
                  activeOpacity={0.8}
                  onPress={() => setSupportModalVisible(true)}
                >
                  <View style={styles.techSupportLeft}>
                    <View style={styles.techSupportIconWrap}>
                      <AppIcon name="phone-call" size={18} color="#0284C7" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.techSupportTitle}>CSFWD Support & Hotlines</Text>
                      <Text style={styles.techSupportPhone}>(045) 961-3546 • csfwd@yahoo.com</Text>
                    </View>
                  </View>
                  <View style={styles.techSupportPill}>
                    <Text style={styles.techSupportPillText}>Directory</Text>
                    <AppIcon name="chevron-forward" size={14} color="#0284C7" />
                  </View>
                </TouchableOpacity>
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
                    activeOpacity={0.7}
                  >
                    <AppIcon name="arrow-back" size={18} color="#0284C7" />
                    <Text style={styles.backBtnText}>Back</Text>
                  </TouchableOpacity>
                </View>

                {/* Sub-selector for Password Login vs Billing ID Login */}
                <View style={styles.subSelectorContainer}>
                  <TouchableOpacity 
                    activeOpacity={0.8}
                    style={[styles.subSelectorBtn, authMethod === 'PASSWORD' && styles.subSelectorBtnActive]}
                    onPress={() => { setAuthMethod('PASSWORD'); setError(null); }}
                  >
                    <AppIcon 
                      name="key-round" 
                      size={15} 
                      color={authMethod === 'PASSWORD' ? '#0284C7' : '#64748B'} 
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
                    <AppIcon 
                      name="receipt-text" 
                      size={15} 
                      color={authMethod === 'BILLING' ? '#0284C7' : '#64748B'} 
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
                      <View style={[
                        styles.fieldInputWrapper,
                        focusedField === 'email' && styles.fieldInputWrapperFocused
                      ]}>
                        <AppIcon name="mail-outline" size={18} color={focusedField === 'email' ? '#0284C7' : '#64748B'} style={styles.fieldIconLeft} />
                        <TextInput
                          style={styles.fieldInput}
                          placeholder="e.g. resident@sanfernando.gov.ph"
                          placeholderTextColor="#94A3B8"
                          value={email}
                          onChangeText={(val) => { setEmail(val); setEmailError(null); }}
                          onFocus={() => {
                            setFocusedField('email');
                            setIsKeyboardVisible(true);
                            setTimeout(() => scrollViewRef.current?.scrollTo({ y: 100, animated: true }), 120);
                          }}
                          onBlur={() => {
                            setFocusedField(null);
                            validateEmail();
                          }}
                          autoCapitalize="none"
                          keyboardType="email-address"
                        />
                      </View>
                      {emailError && <Text style={styles.fieldErrorText}>{emailError}</Text>}
                    </View>

                    {/* Password */}
                    <View style={styles.fieldGroup}>
                      <Text style={styles.fieldLabel}>PASSWORD</Text>
                      <View style={[
                        styles.fieldInputWrapper,
                        focusedField === 'password' && styles.fieldInputWrapperFocused
                      ]}>
                        <AppIcon name="lock-keyhole" size={18} color={focusedField === 'password' ? '#0284C7' : '#64748B'} style={styles.fieldIconLeft} />
                        <TextInput
                          style={styles.fieldInput}
                          placeholder="Enter password"
                          placeholderTextColor="#94A3B8"
                          value={password}
                          onChangeText={setPassword}
                          onFocus={() => {
                            setFocusedField('password');
                            setIsKeyboardVisible(true);
                            setTimeout(() => scrollViewRef.current?.scrollTo({ y: 160, animated: true }), 120);
                          }}
                          onBlur={() => setFocusedField(null)}
                          secureTextEntry={!showPassword}
                          autoCapitalize="none"
                        />
                        <TouchableOpacity 
                          onPress={() => setShowPassword(!showPassword)}
                          style={styles.fieldIconRight}
                          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                          activeOpacity={0.7}
                        >
                          <AppIcon 
                            name={showPassword ? "eye-off" : "eye"} 
                            size={20} 
                            color={showPassword ? "#0284C7" : "#94A3B8"} 
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
                      <View style={[
                        styles.fieldInputWrapper,
                        focusedField === 'billingId' && styles.fieldInputWrapperFocused
                      ]}>
                        <AppIcon name="receipt-text" size={18} color={focusedField === 'billingId' ? '#0284C7' : '#64748B'} style={styles.fieldIconLeft} />
                        <TextInput
                          style={[styles.fieldInput, { fontFamily: 'GeistMono-Regular' }]}
                          placeholder="BILL-SF904128"
                          placeholderTextColor="#94A3B8"
                          value={billingId}
                          onChangeText={setBillingId}
                          onFocus={() => {
                            setFocusedField('billingId');
                            setIsKeyboardVisible(true);
                            setTimeout(() => scrollViewRef.current?.scrollTo({ y: 140, animated: true }), 120);
                          }}
                          onBlur={() => setFocusedField(null)}
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
                          <AppIcon name="scan-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
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
                      <AppIcon name="arrow-forward" size={18} color="#FFFFFF" />
                    </>
                  )}
                </TouchableOpacity>

                {/* Technical Issues Support Contact Card under form */}
                <TouchableOpacity 
                  style={styles.techSupportCard}
                  activeOpacity={0.8}
                  onPress={() => setSupportModalVisible(true)}
                >
                  <View style={styles.techSupportLeft}>
                    <View style={styles.techSupportIconWrap}>
                      <AppIcon name="phone-call" size={18} color="#0284C7" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.techSupportTitle}>Need assistance? CSFWD Hotlines</Text>
                      <Text style={styles.techSupportPhone}>(045) 961-3546 • csfwd@yahoo.com</Text>
                    </View>
                  </View>
                  <View style={styles.techSupportPill}>
                    <Text style={styles.techSupportPillText}>Directory</Text>
                    <AppIcon name="chevron-forward" size={14} color="#0284C7" />
                  </View>
                </TouchableOpacity>
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
                    activeOpacity={0.7}
                  >
                    <AppIcon name="arrow-back" size={18} color="#0284C7" />
                    <Text style={styles.backBtnText}>Back</Text>
                  </TouchableOpacity>
                </View>

                {/* Full Name */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>FULL NAME</Text>
                  <View style={[
                    styles.fieldInputWrapper,
                    focusedField === 'regName' && styles.fieldInputWrapperFocused
                  ]}>
                    <AppIcon name="person-outline" size={18} color={focusedField === 'regName' ? '#0284C7' : '#64748B'} style={styles.fieldIconLeft} />
                    <TextInput
                      style={styles.fieldInput}
                      placeholder="Juan dela Cruz"
                      placeholderTextColor="#94A3B8"
                      value={regName}
                      onChangeText={setRegName}
                      onFocus={() => {
                        setFocusedField('regName');
                        setIsKeyboardVisible(true);
                        setTimeout(() => scrollViewRef.current?.scrollTo({ y: 80, animated: true }), 120);
                      }}
                      onBlur={() => setFocusedField(null)}
                    />
                  </View>
                </View>

                {/* Email Address */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>EMAIL ADDRESS</Text>
                  <View style={[
                    styles.fieldInputWrapper,
                    focusedField === 'regEmail' && styles.fieldInputWrapperFocused
                  ]}>
                    <AppIcon name="mail-outline" size={18} color={focusedField === 'regEmail' ? '#0284C7' : '#64748B'} style={styles.fieldIconLeft} />
                    <TextInput
                      style={styles.fieldInput}
                      placeholder="juan@domain.com"
                      placeholderTextColor="#94A3B8"
                      value={regEmail}
                      onChangeText={setRegEmail}
                      onFocus={() => {
                        setFocusedField('regEmail');
                        setIsKeyboardVisible(true);
                        setTimeout(() => scrollViewRef.current?.scrollTo({ y: 140, animated: true }), 120);
                      }}
                      onBlur={() => setFocusedField(null)}
                      autoCapitalize="none"
                      keyboardType="email-address"
                    />
                  </View>
                </View>

                {/* Phone Number */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>PHONE NUMBER</Text>
                  <View style={[
                    styles.fieldInputWrapper,
                    focusedField === 'regPhone' && styles.fieldInputWrapperFocused
                  ]}>
                    <AppIcon name="call-outline" size={18} color={focusedField === 'regPhone' ? '#0284C7' : '#64748B'} style={styles.fieldIconLeft} />
                    <TextInput
                      style={styles.fieldInput}
                      placeholder="09XX-XXX-XXXX"
                      placeholderTextColor="#94A3B8"
                      value={regPhone}
                      onChangeText={setRegPhone}
                      onFocus={() => {
                        setFocusedField('regPhone');
                        setIsKeyboardVisible(true);
                        setTimeout(() => scrollViewRef.current?.scrollTo({ y: 180, animated: true }), 120);
                      }}
                      onBlur={() => setFocusedField(null)}
                      keyboardType="phone-pad"
                    />
                  </View>
                </View>

                {/* Complete Address */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>COMPLETE ADDRESS</Text>
                  <View style={[
                    styles.fieldInputWrapper,
                    focusedField === 'regAddress' && styles.fieldInputWrapperFocused
                  ]}>
                    <AppIcon name="location-outline" size={18} color={focusedField === 'regAddress' ? '#0284C7' : '#64748B'} style={styles.fieldIconLeft} />
                    <TextInput
                      style={styles.fieldInput}
                      placeholder="House No., Street, Barangay, City"
                      placeholderTextColor="#94A3B8"
                      value={regAddress}
                      onChangeText={setRegAddress}
                      onFocus={() => {
                        setFocusedField('regAddress');
                        setIsKeyboardVisible(true);
                        setTimeout(() => scrollViewRef.current?.scrollTo({ y: 220, animated: true }), 120);
                      }}
                      onBlur={() => setFocusedField(null)}
                    />
                  </View>
                </View>

                {/* Password */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>PASSWORD</Text>
                  <View style={[
                    styles.fieldInputWrapper,
                    focusedField === 'regPassword' && styles.fieldInputWrapperFocused
                  ]}>
                    <AppIcon name="lock-keyhole" size={18} color={focusedField === 'regPassword' ? '#0284C7' : '#64748B'} style={styles.fieldIconLeft} />
                    <TextInput
                      style={styles.fieldInput}
                      placeholder="Min. 8 chars (e.g. Pass1234*)"
                      placeholderTextColor="#94A3B8"
                      value={regPassword}
                      onChangeText={setRegPassword}
                      onFocus={() => {
                        setFocusedField('regPassword');
                        setIsKeyboardVisible(true);
                        setTimeout(() => scrollViewRef.current?.scrollTo({ y: 260, animated: true }), 120);
                      }}
                      onBlur={() => setFocusedField(null)}
                      secureTextEntry={!regShowPassword}
                      autoCapitalize="none"
                    />
                    <TouchableOpacity 
                      onPress={() => setRegShowPassword(!regShowPassword)}
                      style={styles.fieldIconRight}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      activeOpacity={0.7}
                    >
                      <AppIcon 
                        name={regShowPassword ? "eye-off" : "eye"} 
                        size={20} 
                        color={regShowPassword ? "#0284C7" : "#94A3B8"} 
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
                  <View style={[
                    styles.fieldInputWrapper,
                    focusedField === 'regConfirmPassword' && styles.fieldInputWrapperFocused
                  ]}>
                    <AppIcon name="checkmark-circle-outline" size={18} color={focusedField === 'regConfirmPassword' ? '#0284C7' : '#64748B'} style={styles.fieldIconLeft} />
                    <TextInput
                      style={styles.fieldInput}
                      placeholder="Re-enter password"
                      placeholderTextColor="#94A3B8"
                      value={regConfirmPassword}
                      onChangeText={setRegConfirmPassword}
                      onFocus={() => {
                        setFocusedField('regConfirmPassword');
                        setIsKeyboardVisible(true);
                        setTimeout(() => scrollViewRef.current?.scrollTo({ y: 300, animated: true }), 120);
                      }}
                      onBlur={() => setFocusedField(null)}
                      secureTextEntry={!regShowConfirm}
                      autoCapitalize="none"
                    />
                    <TouchableOpacity 
                      onPress={() => setRegShowConfirm(!regShowConfirm)}
                      style={styles.fieldIconRight}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      activeOpacity={0.7}
                    >
                      <AppIcon 
                        name={regShowConfirm ? "eye-off" : "eye"} 
                        size={20} 
                        color={regShowConfirm ? "#0284C7" : "#94A3B8"} 
                      />
                    </TouchableOpacity>
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
                      <AppIcon name="person-add-outline" size={18} color="#FFFFFF" />
                    </>
                  )}
                </TouchableOpacity>

                {/* Technical Issues Support Contact Card under form */}
                <TouchableOpacity 
                  style={styles.techSupportCard}
                  activeOpacity={0.8}
                  onPress={() => setSupportModalVisible(true)}
                >
                  <View style={styles.techSupportLeft}>
                    <View style={styles.techSupportIconWrap}>
                      <AppIcon name="phone-call" size={18} color="#0284C7" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.techSupportTitle}>Need assistance? CSFWD Hotlines</Text>
                      <Text style={styles.techSupportPhone}>(045) 961-3546 • csfwd@yahoo.com</Text>
                    </View>
                  </View>
                  <View style={styles.techSupportPill}>
                    <Text style={styles.techSupportPillText}>Directory</Text>
                    <AppIcon name="chevron-forward" size={14} color="#0284C7" />
                  </View>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── CSFWD Directory & Support Modal ────────────────────────────── */}
      <Modal
        visible={supportModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSupportModalVisible(false)}
      >
        <TouchableOpacity 
          style={styles.supportModalOverlay}
          activeOpacity={1}
          onPress={() => setSupportModalVisible(false)}
        >
          <TouchableOpacity 
            activeOpacity={1} 
            style={styles.supportModalContent}
          >
            {/* Modal Header */}
            <View style={styles.supportModalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={[styles.techSupportIconWrap, { width: 32, height: 32, borderRadius: 16, marginRight: 8 }]}>
                  <AppIcon name="business-outline" size={16} color="#0284C7" />
                </View>
                <Text style={styles.supportModalTitle}>CSFWD Directory & Contacts</Text>
              </View>
              <TouchableOpacity 
                style={styles.supportModalCloseBtn}
                onPress={() => setSupportModalVisible(false)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <AppIcon name="close" size={18} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: SCREEN_HEIGHT * 0.62 }}>
              {/* Main Office Section */}
              <View style={styles.supportModalSection}>
                <Text style={styles.supportModalSectionTitle}>Main Office (Sto. Rosario)</Text>
                <View style={styles.supportModalCard}>
                  <View style={styles.supportInfoRow}>
                    <AppIcon name="location-outline" size={16} color="#0284C7" style={{ marginTop: 2 }} />
                    <Text style={styles.supportInfoText}>
                      B. Mendoza Street, Sto. Rosario, 2000 San Fernando, Pampanga
                    </Text>
                  </View>

                  <TouchableOpacity 
                    style={styles.supportInfoRow}
                    onPress={() => handleEmail('csfwd@yahoo.com')}
                    activeOpacity={0.7}
                  >
                    <AppIcon name="mail-outline" size={16} color="#0284C7" style={{ marginTop: 2 }} />
                    <Text style={[styles.supportInfoText, { color: '#0284C7', textDecorationLine: 'underline', fontFamily: 'PlusJakartaSans-Bold' }]}>
                      csfwd@yahoo.com
                    </Text>
                  </TouchableOpacity>

                  <View style={{ height: 1, backgroundColor: '#E2E8F0', marginVertical: 4 }} />

                  <Text style={[styles.supportInfoText, styles.supportInfoTextBold]}>Hotlines & Inquiries:</Text>

                  <TouchableOpacity 
                    style={styles.supportActionChip}
                    onPress={() => handleDial('(045) 961-3546')}
                    activeOpacity={0.7}
                  >
                    <AppIcon name="call-outline" size={14} color="#0284C7" />
                    <Text style={styles.supportActionChipText}>961-3546 Customer Service</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={styles.supportActionChip}
                    onPress={() => handleDial('(045) 961-5804')}
                    activeOpacity={0.7}
                  >
                    <AppIcon name="call-outline" size={14} color="#0284C7" />
                    <Text style={styles.supportActionChipText}>961-5804 Billing Inquiry</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={styles.supportActionChip}
                    onPress={() => handleDial('(045) 961-8837')}
                    activeOpacity={0.7}
                  >
                    <AppIcon name="call-outline" size={14} color="#0284C7" />
                    <Text style={styles.supportActionChipText}>961-8837 Follow-up on Service Application</Text>
                  </TouchableOpacity>

                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                    <TouchableOpacity 
                      style={styles.supportActionChip}
                      onPress={() => handleDial('0968-854-1343')}
                      activeOpacity={0.7}
                    >
                      <AppIcon name="phone" size={14} color="#0284C7" />
                      <Text style={styles.supportActionChipText}>0968-854-1343</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.supportActionChip}
                      onPress={() => handleDial('0933-8146585')}
                      activeOpacity={0.7}
                    >
                      <AppIcon name="phone" size={14} color="#0284C7" />
                      <Text style={styles.supportActionChipText}>0933-8146585</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* Sub Offices Section */}
              <View style={styles.supportModalSection}>
                <Text style={styles.supportModalSectionTitle}>Sub Offices</Text>
                <View style={styles.supportModalCard}>
                  {/* Sindalan Sub-office */}
                  <View>
                    <Text style={[styles.supportInfoText, styles.supportInfoTextBold]}>Sindalan Sub-office</Text>
                    <TouchableOpacity 
                      style={styles.supportActionChip}
                      onPress={() => handleDial('(045) 455-1988')}
                      activeOpacity={0.7}
                    >
                      <AppIcon name="call-outline" size={14} color="#0284C7" />
                      <Text style={styles.supportActionChipText}>455-1988</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={{ height: 1, backgroundColor: '#E2E8F0', marginVertical: 4 }} />

                  {/* Bulaon Sub-office */}
                  <View>
                    <Text style={[styles.supportInfoText, styles.supportInfoTextBold]}>Bulaon Sub-office</Text>
                    <TouchableOpacity 
                      style={styles.supportActionChip}
                      onPress={() => handleDial('(045) 961-5804')}
                      activeOpacity={0.7}
                    >
                      <AppIcon name="call-outline" size={14} color="#0284C7" />
                      <Text style={styles.supportActionChipText}>961-5804</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={{ height: 1, backgroundColor: '#E2E8F0', marginVertical: 4 }} />

                  {/* Saguin Sub-office */}
                  <View>
                    <Text style={[styles.supportInfoText, styles.supportInfoTextBold]}>Saguin Sub-office</Text>
                    <Text style={styles.supportInfoText}>
                      Fortune Square Bldg. (in front of Coke), Saguin, City of San Fernando, Pampanga
                    </Text>
                  </View>
                </View>
              </View>
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

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
              <AppIcon name="shield-outline" size={30} color="#EF4444" />
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
