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

export default function Register({ navigation }) {
  const scrollViewRef = useRef(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [focusedField, setFocusedField] = useState(null);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
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
    if (!name.trim() || !email.trim() || !phone.trim() || !address.trim() || !password || !confirmPassword) {
      setError("All fields are mandatory. Please fill in all details.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match. Please try again.");
      return;
    }
    if (!validatePassword(password)) {
      setError("Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and an asterisk (*).");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const { data, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: name.trim(),
            phone: phone.trim(),
            address: address.trim(),
          }
        }
      });

      if (authError) {
        setError(authError.message);
        setLoading(false);
        return;
      }

      if (data?.user?.identities && data.user.identities.length === 0) {
        setError("This email address is already registered. Please sign in or use a different email.");
        setLoading(false);
        return;
      }

      if (data.user?.id) {
        try {
          await api.post('/api/auth/register', {
            id: data.user.id,
            email: data.user.email || email.trim(),
            fullName: name.trim(),
            phone: phone.trim(),
            address: address.trim(),
          });
        } catch (syncErr) {
          console.warn("DB profile sync failed; auth account created:", syncErr);
        }
      }

      if (data.session) {
        useAuthStore.getState().setSession(data.session);
        await useAuthStore.getState().fetchProfile(data.user.id);
      }

      setLoading(false);
      Alert.alert(
        "Registration Submitted",
        `A verification email has been sent to ${email.trim()}. Please check your email inbox to confirm your registration link before logging in.`,
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
              contentFit="cover"
            />

            <View style={styles.decorCircle1} />
            <View style={styles.decorCircle2} />

            {/* BIG TRANSPARENT PNG LOGO DIRECTLY ON BLUE */}
            <View style={isKeyboardVisible ? styles.logoWrapperCompact : styles.logoWrapper}>
              <Image 
                source={require('../../assets/Logo.png')}
                style={isKeyboardVisible ? styles.bigLogoImageCompact : styles.bigLogoImage}
                contentFit="contain"
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
                contentFit="cover"
              />
              <Image 
                source={require('../../assets/swirl_boundary.png')}
                style={isKeyboardVisible ? styles.swirlBoundaryImageCompact : styles.swirlBoundaryImage}
                contentFit="cover"
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
                activeOpacity={0.7}
              >
                <AppIcon name="arrow-back" size={18} color="#0284C7" />
                <Text style={styles.backBtnText}>Back</Text>
              </TouchableOpacity>
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
                <View style={[
                  styles.fieldInputWrapper,
                  focusedField === 'name' && styles.fieldInputWrapperFocused
                ]}>
                  <AppIcon name="person-outline" size={18} color={focusedField === 'name' ? '#0284C7' : '#64748B'} style={styles.fieldIconLeft} />
                  <TextInput
                    style={styles.fieldInput}
                    placeholder="Juan dela Cruz"
                    placeholderTextColor="#94A3B8"
                    value={name}
                    onChangeText={setName}
                    onFocus={() => {
                      setFocusedField('name');
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
                  focusedField === 'email' && styles.fieldInputWrapperFocused
                ]}>
                  <AppIcon name="mail-outline" size={18} color={focusedField === 'email' ? '#0284C7' : '#64748B'} style={styles.fieldIconLeft} />
                  <TextInput
                    style={styles.fieldInput}
                    placeholder="juan@domain.com"
                    placeholderTextColor="#94A3B8"
                    value={email}
                    onChangeText={setEmail}
                    onFocus={() => {
                      setFocusedField('email');
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
                  focusedField === 'phone' && styles.fieldInputWrapperFocused
                ]}>
                  <AppIcon name="call-outline" size={18} color={focusedField === 'phone' ? '#0284C7' : '#64748B'} style={styles.fieldIconLeft} />
                  <TextInput
                    style={styles.fieldInput}
                    placeholder="09XX-XXX-XXXX"
                    placeholderTextColor="#94A3B8"
                    value={phone}
                    onChangeText={setPhone}
                    onFocus={() => {
                      setFocusedField('phone');
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
                  focusedField === 'address' && styles.fieldInputWrapperFocused
                ]}>
                  <AppIcon name="location-outline" size={18} color={focusedField === 'address' ? '#0284C7' : '#64748B'} style={styles.fieldIconLeft} />
                  <TextInput
                    style={styles.fieldInput}
                    placeholder="House No., Street, Barangay, City"
                    placeholderTextColor="#94A3B8"
                    value={address}
                    onChangeText={setAddress}
                    onFocus={() => {
                      setFocusedField('address');
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
                  focusedField === 'password' && styles.fieldInputWrapperFocused
                ]}>
                  <AppIcon name="lock-keyhole" size={18} color={focusedField === 'password' ? '#0284C7' : '#64748B'} style={styles.fieldIconLeft} />
                  <TextInput
                    style={styles.fieldInput}
                    placeholder="Min. 8 chars (e.g. Pass1234*)"
                    placeholderTextColor="#94A3B8"
                    value={password}
                    onChangeText={setPassword}
                    onFocus={() => {
                      setFocusedField('password');
                      setIsKeyboardVisible(true);
                      setTimeout(() => scrollViewRef.current?.scrollTo({ y: 260, animated: true }), 120);
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
                <Text style={styles.passwordHintText}>
                  Must contain 8+ characters, uppercase, lowercase, digit, and asterisk (*).
                </Text>
              </View>

              {/* Confirm Password */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>CONFIRM PASSWORD</Text>
                <View style={[
                  styles.fieldInputWrapper,
                  focusedField === 'confirmPassword' && styles.fieldInputWrapperFocused
                ]}>
                  <AppIcon name="checkmark-circle-outline" size={18} color={focusedField === 'confirmPassword' ? '#0284C7' : '#64748B'} style={styles.fieldIconLeft} />
                  <TextInput
                    style={styles.fieldInput}
                    placeholder="Confirm account password"
                    placeholderTextColor="#94A3B8"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    onFocus={() => {
                      setFocusedField('confirmPassword');
                      setIsKeyboardVisible(true);
                      setTimeout(() => scrollViewRef.current?.scrollTo({ y: 300, animated: true }), 120);
                    }}
                    onBlur={() => setFocusedField(null)}
                    secureTextEntry={!showConfirm}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity 
                    onPress={() => setShowConfirm(!showConfirm)}
                    style={styles.fieldIconRight}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    activeOpacity={0.7}
                  >
                    <AppIcon 
                      name={showConfirm ? "eye-off" : "eye"} 
                      size={20} 
                      color={showConfirm ? "#0284C7" : "#94A3B8"} 
                    />
                  </TouchableOpacity>
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
    </View>
  );
}
