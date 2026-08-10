import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../src/config/supabase';
import { api } from '../../src/config/api';
import { Ionicons } from '@expo/vector-icons';
import styles from './ManageAccount.styles';
import homeStyles from './ConsumerHome.styles';

export default function ManageAccount({ navigation }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [originalEmail, setOriginalEmail] = useState('');
  const [userId, setUserId] = useState('');

  // Password verification states
  const [isVerified, setIsVerified] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState(null);

  // Profile update password fields
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // UI loading state
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setUserId(session.user.id);
          setEmail(session.user.email || '');
          setOriginalEmail(session.user.email || '');

          // Get profile name from Next.js server DB sync
          const profile = await api.post('/api/auth/profile', { userId: session.user.id });
          if (profile?.name) {
            setName(profile.name);
          }
        } else {
          Alert.alert("Session Expired", "Please log in again.");
          navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
        }
      } catch (err) {
        console.error("Failed to load user info:", err);
        setError("Failed to fetch account info from server.");
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [navigation]);

  const handleVerifyPassword = async () => {
    if (!currentPassword.trim()) {
      setVerifyError("Please enter your current password.");
      return;
    }

    setVerifying(true);
    setVerifyError(null);

    try {
      // Re-authenticate by signing in with current email and entered password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email,
        password: currentPassword,
      });

      if (signInError) {
        setVerifyError("Incorrect password. Please verify and try again.");
      } else {
        setIsVerified(true);
      }
    } catch (err) {
      console.error(err);
      setVerifyError("Verification service error. Please try again.");
    } finally {
      setVerifying(false);
    }
  };

  const validatePassword = (pwd) => {
    // Password must contain uppercase, lowercase, numbers, and an asterisk (*)
    const hasUpper = /[A-Z]/.test(pwd);
    const hasLower = /[a-z]/.test(pwd);
    const hasNumber = /[0-9]/.test(pwd);
    const hasAsterisk = /\*/.test(pwd);
    return hasUpper && hasLower && hasNumber && hasAsterisk && pwd.length >= 8;
  };

  const handleUpdateAccount = async () => {
    if (!name.trim() || !email.trim()) {
      setError("Name and Email address fields cannot be blank.");
      return;
    }

    if (password || confirmPassword) {
      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        return;
      }
      if (!validatePassword(password)) {
        setError("New password must be at least 8 characters and contain: uppercase, lowercase, digit, and an asterisk (*).");
        return;
      }
    }

    setError(null);
    setUpdating(true);

    try {
      // 1. Compile update options for Supabase auth
      const updateParams = {
        data: { full_name: name }
      };

      if (email !== originalEmail) {
        updateParams.email = email;
      }
      if (password) {
        updateParams.password = password;
      }

      const { error: authError } = await supabase.auth.updateUser(updateParams);

      if (authError) {
        setError(authError.message);
        setUpdating(false);
        return;
      }

      // 2. Update DB User profile row (Prisma sync)
      const { error: dbError } = await supabase
        .from('User')
        .update({ name: name, email: email })
        .eq('id', userId);

      if (dbError) {
        console.error("DB User sync warning:", dbError);
      }

      setUpdating(false);
      
      let successMsg = "Account settings updated successfully.";
      if (email !== originalEmail) {
        successMsg += " A verification email has been sent to your new address. Please confirm the link before logging back in.";
        setOriginalEmail(email);
      }

      // Clear password inputs
      setPassword('');
      setConfirmPassword('');

      Alert.alert("Success", successMsg, [{ text: "OK" }]);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to update profile settings.");
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color="#0C4F8B" size="large" />
        <Text style={styles.loadingText}>Syncing Credentials...</Text>
      </View>
    );
  }

  const renderHeader = (title, subtitle) => (
    <LinearGradient 
      colors={['#0C4F8B', '#008CE3']} 
      start={{ x: 0, y: 0 }} 
      end={{ x: 0, y: 1 }} 
      style={[homeStyles.headerCard, { borderBottomLeftRadius: 24, borderBottomRightRadius: 24, paddingBottom: 20, marginBottom: 12 }]}
    >
      <View style={homeStyles.decorCircle1} />
      <View style={homeStyles.decorCircle2} />

      <View style={homeStyles.brandRow}>
        <View style={homeStyles.logoContainer}>
          <Ionicons name="water" size={26} color="#7DD3FC" />
          <Text style={homeStyles.brandTitleText}>
            <Text style={{ color: '#FFFFFF' }}>AQ</Text>
            <Text style={{ color: '#FBBF24' }}>U</Text>
            <Text style={{ color: '#EF4444' }}>A</Text>
            <Text style={{ color: '#FFFFFF' }}>TRACK</Text>
          </Text>
        </View>
      </View>

      <View style={homeStyles.greetingContainer}>
        <Text style={homeStyles.greetingText}>{title}</Text>
        <View style={homeStyles.locationPill}>
          <Ionicons name="settings-outline" size={13} color="#E0F2FE" />
          <Text style={homeStyles.locationText}>{subtitle}</Text>
        </View>
      </View>
    </LinearGradient>
  );

  // 1. Password Verification Screen (runs first)
  if (!isVerified) {
    return (
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={[styles.container, { backgroundColor: '#F2F5FA' }]}
      >
        <ScrollView contentContainerStyle={{ paddingBottom: 110 }}>
          {renderHeader('Confirm Identity', 'Please verify your password before updating details')}

          <View style={[styles.card, { marginHorizontal: 16, marginTop: 16 }]}>
            <Text style={styles.sectionTitle}>Verification Required</Text>
            
            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Account Password</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="lock-closed-outline" size={16} color="#001e66" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter current password"
                    placeholderTextColor="#94a3b8"
                    value={currentPassword}
                    onChangeText={setCurrentPassword}
                    secureTextEntry={!showCurrentPassword}
                    autoCapitalize="none"
                    onSubmitEditing={handleVerifyPassword}
                  />
                  <TouchableOpacity onPress={() => setShowCurrentPassword(!showCurrentPassword)}>
                    <Ionicons 
                      name={showCurrentPassword ? "eye-off-outline" : "eye-outline"} 
                      size={16} 
                      color="#525f7f" 
                      style={{ padding: 4 }} 
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>

          {verifyError && <Text style={styles.errorText}>{verifyError}</Text>}

          <TouchableOpacity 
            style={[styles.saveBtn, verifying && { opacity: 0.8 }]}
            onPress={handleVerifyPassword}
            disabled={verifying}
          >
            {verifying ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.saveBtnText}>Verify Password</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // 2. Profile Management Screen (shown after verification succeeds)
  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: '#F2F5FA' }]}
    >
      <ScrollView contentContainerStyle={{ paddingBottom: 110 }}>
        {renderHeader('Account Settings', 'Modify contact details & update security password')}

        {/* Card 1: Profile Info */}
        <View style={[styles.card, { marginHorizontal: 16, marginTop: 16 }]}>
          <Text style={styles.sectionTitle}>Profile Details</Text>
          
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="person-outline" size={16} color="#001e66" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Juan dela Cruz"
                  placeholderTextColor="#94a3b8"
                  value={name}
                  onChangeText={setName}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="mail-outline" size={16} color="#001e66" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="juan@gmail.com"
                  placeholderTextColor="#94a3b8"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>
              {email !== originalEmail && (
                <Text style={styles.infoHelperText}>
                  Note: Email updates will require double link confirmation sent to your mailbox.
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Card 2: Security & Password */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Credentials Security</Text>
          
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>New Password (Optional)</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={16} color="#001e66" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Fill in to change password"
                  placeholderTextColor="#94a3b8"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons 
                    name={showPassword ? "eye-off-outline" : "eye-outline"} 
                    size={16} 
                    color="#525f7f" 
                    style={{ padding: 4 }} 
                  />
                </TouchableOpacity>
              </View>
            </View>

            {password.length > 0 && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Confirm New Password</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="lock-closed-outline" size={16} color="#001e66" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Repeat new password"
                    placeholderTextColor="#94a3b8"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                  />
                </View>
              </View>
            )}
          </View>
        </View>

        {error && <Text style={styles.errorText}>{error}</Text>}

        <TouchableOpacity 
          style={[styles.saveBtn, updating && { opacity: 0.8 }]}
          onPress={handleUpdateAccount}
          disabled={updating}
        >
          {updating ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.saveBtnText}>Save Account Changes</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
