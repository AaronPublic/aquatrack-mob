import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { supabase } from '../../src/config/supabase';
import { api } from '../../src/config/api';
import AppIcon from '../../components/AppIcon';
import styles from './ManageAccount.styles';
import TechHeader from '../subadminpages/TechHeader';

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
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F2F5FA' }}>
        <ActivityIndicator color="#0C4F8B" size="large" />
        <Text style={{ marginTop: 12, color: '#64748B', fontSize: 13, fontWeight: '600' }}>Syncing Credentials...</Text>
      </View>
    );
  }

  // 1. Password Verification Screen (runs first)
  if (!isVerified) {
    return (
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={[styles.container, { backgroundColor: '#F2F5FA' }]}
      >
        <TechHeader
          navigation={navigation}
          pageTitle="Manage Account"
          pageDesc="Please verify your password before updating details"
          showSwirl={true}
        />

        <ScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingTop: 16, paddingBottom: 110 }}>
          <View style={[styles.card, { borderRadius: 24, padding: 20, borderWidth: 1, borderColor: '#E2E8F0', shadowColor: '#0B2240', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.07, shadowRadius: 14, elevation: 4 }]}>
            <Text style={{ color: '#64748B', fontWeight: '800', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14 }}>
              VERIFICATION REQUIRED
            </Text>
            
            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={{ fontSize: 10, fontWeight: '800', color: '#0C4F8B', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 }}>
                  Account Password
                </Text>
                <View style={[styles.inputWrapper, { borderRadius: 16, borderColor: '#E2E8F0', height: 50 }]}>
                  <AppIcon name="lock-closed-outline" size={16} color="#0C4F8B" style={styles.inputIcon} />
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
                    <AppIcon 
                      name={showCurrentPassword ? "eye-off-outline" : "eye-outline"} 
                      size={18} 
                      color="#64748B" 
                      style={{ padding: 4 }} 
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {verifyError && <Text style={styles.errorText}>{verifyError}</Text>}

            <TouchableOpacity 
              style={[styles.saveBtn, { borderRadius: 16, backgroundColor: '#0C4F8B', height: 50, marginTop: 16 }, verifying && { opacity: 0.8 }]}
              onPress={handleVerifyPassword}
              disabled={verifying}
            >
              {verifying ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.saveBtnText}>Verify Password</Text>
              )}
            </TouchableOpacity>
          </View>
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
      <TechHeader
        navigation={navigation}
        pageTitle="Manage Account"
        pageDesc="Modify contact details & update security password"
        showSwirl={true}
      />

      <ScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingTop: 16, paddingBottom: 110 }}>
        {/* Card 1: Profile Info */}
        <View style={[styles.card, { borderRadius: 24, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: '#E2E8F0', shadowColor: '#0B2240', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.07, shadowRadius: 14, elevation: 4 }]}>
          <Text style={{ color: '#64748B', fontWeight: '800', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14 }}>
            PROFILE DETAILS
          </Text>
          
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={{ fontSize: 10, fontWeight: '800', color: '#0C4F8B', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 }}>
                Full Name
              </Text>
              <View style={[styles.inputWrapper, { borderRadius: 16, borderColor: '#E2E8F0', height: 50 }]}>
                <AppIcon name="person-outline" size={16} color="#0C4F8B" style={styles.inputIcon} />
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
              <Text style={{ fontSize: 10, fontWeight: '800', color: '#0C4F8B', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 }}>
                Email Address
              </Text>
              <View style={[styles.inputWrapper, { borderRadius: 16, borderColor: '#E2E8F0', height: 50 }]}>
                <AppIcon name="mail-outline" size={16} color="#0C4F8B" style={styles.inputIcon} />
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
        <View style={[styles.card, { borderRadius: 24, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: '#E2E8F0', shadowColor: '#0B2240', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.07, shadowRadius: 14, elevation: 4 }]}>
          <Text style={{ color: '#64748B', fontWeight: '800', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14 }}>
            CREDENTIALS SECURITY
          </Text>
          
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={{ fontSize: 10, fontWeight: '800', color: '#0C4F8B', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 }}>
                New Password (Optional)
              </Text>
              <View style={[styles.inputWrapper, { borderRadius: 16, borderColor: '#E2E8F0', height: 50 }]}>
                <AppIcon name="lock-closed-outline" size={16} color="#0C4F8B" style={styles.inputIcon} />
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
                  <AppIcon 
                    name={showPassword ? "eye-off-outline" : "eye-outline"} 
                    size={18} 
                    color="#64748B" 
                    style={{ padding: 4 }} 
                  />
                </TouchableOpacity>
              </View>
            </View>

            {password.length > 0 && (
              <View style={styles.inputGroup}>
                <Text style={{ fontSize: 10, fontWeight: '800', color: '#0C4F8B', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 }}>
                  Confirm New Password
                </Text>
                <View style={[styles.inputWrapper, { borderRadius: 16, borderColor: '#E2E8F0', height: 50 }]}>
                  <AppIcon name="lock-closed-outline" size={16} color="#0C4F8B" style={styles.inputIcon} />
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
          style={[styles.saveBtn, { borderRadius: 16, backgroundColor: '#0C4F8B', height: 50, marginTop: 8 }, updating && { opacity: 0.8 }]}
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
