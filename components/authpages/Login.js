import React, { useState } from 'react';
import { View, Text, Image, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, ImageBackground } from 'react-native';
import { supabase } from '../../src/config/supabase';
import { api } from '../../src/config/api';
import styles from './Login.styles';

export default function Login({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [billingId, setBillingId] = useState('');
  const [loading, setLoading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  // Selector state: PASSWORD, BILLING
  const [authMethod, setAuthMethod] = useState('PASSWORD');

  // Input validation indicators
  const [emailError, setEmailError] = useState(null);

  const validateEmail = () => {
    if (email && !/\S+@\S+\.\S+/.test(email)) {
      setEmailError("Invalid email address format");
      return false;
    } else {
      setEmailError(null);
      return true;
    }
  };

  const handleQrScanSimulation = () => {
    setIsScanning(true);
    setError(null);
    setTimeout(() => {
      setBillingId("BILL-SF904128");
      setIsScanning(false);
    }, 1000);
  };

  const handleLogin = async () => {
    if (authMethod === 'BILLING') {
      setError("Billing ID credential access is reserved purely for physical self-service kiosk terminals. Please switch back to the Password tab to log in.");
      return;
    }

    const isEmailValid = validateEmail();

    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }
    if (!isEmailValid) {
      setError("Please correct the email validation error.");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError(
          authError.status === 400
            ? "Invalid email address or password combination. Please try again."
            : authError.message
        );
        setLoading(false);
        return;
      }

      // Query local DB profile via API to resolve user role
      const profile = await api.post('/api/auth/profile', { userId: data.user.id });

      if (profile && profile.role) {
        if (profile.role === 'ADMIN') {
          await supabase.auth.signOut();
          setError("Access Denied: Administrator accounts are not allowed to log in on the mobile platform. Please use the Web Dashboard.");
          setLoading(false);
          return;
        } else if (profile.role === 'FIELD_ENGINEER_TECHNICIAN') {
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
      } else {
        // Fallback default
        navigation.reset({
          index: 0,
          routes: [{ name: 'ConsumerTab' }],
        });
      }
    } catch (err) {
      console.error(err);
      setError("Failed to connect to the server. Please check your network and try again.");
    } finally {
      setLoading(false);
    }
  };

  const getButtonText = () => {
    if (authMethod === 'BILLING') return '[send] Sign In with Billing ID';
    return '[send] Sign In with Credentials';
  };

  return (
    <ImageBackground 
      source={require('../../assets/loginBG.png')} 
      style={styles.backgroundImage}
      imageStyle={{ opacity: 0.12 }} // Adjusted opacity to be extremely clean and subtle
      resizeMode="cover"
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
          
          {/* 1. Branding Header Panel */}
          <View style={styles.headerPanel}>
            <Image 
              source={require('../../assets/Logo.png')}
              style={styles.Logo}
            />
            <Text style={styles.subtitle}>City of San Fernando</Text>
            <Text style={styles.supportingText}>
              Sign in to report water anomalies, review diagnostics, and view announcements.
            </Text>
          </View>

          {/* Form Area and Surface */}
          <View style={styles.formArea}>
            
            {/* 2. Authentication Method Selector (Only Password and Billing ID) */}
            <View style={styles.selectorContainer}>
              <TouchableOpacity 
                activeOpacity={0.8}
                style={[styles.selectorButton, authMethod === 'PASSWORD' && styles.selectorButtonActive]}
                onPress={() => {
                  setAuthMethod('PASSWORD');
                  setError(null);
                }}
              >
                <Text style={[styles.selectorText, authMethod === 'PASSWORD' && styles.selectorTextActive]}>
                  Password
                </Text>
              </TouchableOpacity>

              <TouchableOpacity 
                activeOpacity={0.8}
                style={[styles.selectorButton, authMethod === 'BILLING' && styles.selectorButtonActive]}
                onPress={() => {
                  setAuthMethod('BILLING');
                  setError(null);
                }}
              >
                <Text style={[styles.selectorText, authMethod === 'BILLING' && styles.selectorTextActive]}>
                  Billing Id
                </Text>
              </TouchableOpacity>
            </View>

            {/* 3. Form Surface */}
            <View style={styles.formCard}>
              
              {/* Global Errors */}
              {error && (
                <Text style={styles.globalErrorText}>{error}</Text>
              )}

              {authMethod === 'PASSWORD' ? (
                <View style={{ gap: 14 }}>
                  {/* Email Address */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Email Address</Text>
                    <View style={styles.inputWrapper}>
                      <Text style={styles.leftIconText}>[mail]</Text>
                      <TextInput
                        id="login-email"
                        style={styles.inputField}
                        placeholder="e.g. juan.delacruz@gmail.com"
                        placeholderTextColor="#94a3b8"
                        value={email}
                        onChangeText={(val) => {
                          setEmail(val);
                          setEmailError(null); // Clear errors while editing
                        }}
                        onBlur={validateEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                        autoComplete="email"
                      />
                    </View>
                    {emailError && (
                      <Text style={styles.errorText}>{emailError}</Text>
                    )}
                  </View>

                  {/* Password */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Password</Text>
                    <View style={styles.inputWrapper}>
                      <Text style={styles.leftIconText}>[lock]</Text>
                      <TextInput
                        id="login-password"
                        style={styles.inputField}
                        placeholder="Enter account password"
                        placeholderTextColor="#94a3b8"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry={!showPassword}
                        autoCapitalize="none"
                        autoComplete="password"
                      />
                      <TouchableOpacity 
                        activeOpacity={0.7} 
                        onPress={() => setShowPassword(!showPassword)}
                      >
                        <Text style={styles.rightIconText}>
                          {showPassword ? "[hide]" : "[show]"}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ) : (
                <View style={{ gap: 14 }}>
                  {/* Billing ID Input (Full Width) */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Billing ID</Text>
                    <View style={styles.inputWrapper}>
                      <Text style={styles.leftIconText}>[card]</Text>
                      <TextInput
                        id="login-billing-id"
                        style={styles.inputField}
                        placeholder="Enter billing ID or scan QR code"
                        placeholderTextColor="#94a3b8"
                        value={billingId}
                        onChangeText={setBillingId}
                        autoCapitalize="characters"
                      />
                    </View>
                  </View>

                  {/* QR SCAN Button */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>QR Code Scan</Text>
                    <TouchableOpacity 
                      style={styles.qrScanButton} 
                      onPress={handleQrScanSimulation}
                      activeOpacity={0.8}
                      disabled={isScanning}
                    >
                      {isScanning ? (
                        <ActivityIndicator color="#fff" size="small" />
                      ) : (
                        <Text style={styles.qrScanButtonText}>[QR Scan] Scan Statement QR Code</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* 4. Sign-In Action Button */}
              <TouchableOpacity 
                style={styles.submitButton}
                onPress={handleLogin}
                disabled={loading}
                activeOpacity={0.9}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.submitButtonText}>{getButtonText()}</Text>
                )}
              </TouchableOpacity>

              {/* 5. Registration Footer */}
              <View style={styles.footer}>
                <Text style={styles.footerText}>Don't have a resident account?</Text>
                <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                  <Text style={styles.footerLink}>Register here</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* IT Support Info */}
            <Text style={styles.supportText}>
              Technical access issues? Contact CSFWD IT Division at (045) 961-3546
            </Text>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}
