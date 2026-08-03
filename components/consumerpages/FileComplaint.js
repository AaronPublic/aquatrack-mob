import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Image, ActivityIndicator, Alert, UIManager, Platform, Modal } from 'react-native';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import MapView, { Marker, Polygon } from 'react-native-maps';
import { api } from '../../src/config/api';
import { supabase } from '../../src/config/supabase';
import { Ionicons } from '@expo/vector-icons';
import styles from './FileComplaint.styles';
import homeStyles from './ConsumerHome.styles';
import { useNotificationStore } from '../../src/store/useNotificationStore';

const hasNativeMap = false; // Set to false to prevent Google Maps native crash due to empty API keys in AndroidManifest

const WebMap = ({ latitude, longitude }) => {
  if (Platform.OS !== 'web') return null;
  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${longitude - 0.005}%2C${latitude - 0.003}%2C${longitude + 0.005}%2C${latitude + 0.003}&layer=mapnik&marker=${latitude}%2C${longitude}`;
  return React.createElement('iframe', {
    src,
    style: { width: '100%', height: '100%', border: 'none', borderRadius: 8 },
    title: 'Location Preview'
  });
};

export default function FileComplaint({ navigation }) {
  const [rawText, setRawText] = useState('');
  const [category, setCategory] = useState('UNCLASSIFIED_INFRASTRUCTURE_ANOMALY');
  const [urgency, setUrgency] = useState('MEDIUM');
  
  // Geolocation states
  const [location, setLocation] = useState({
    latitude: 15.0298, // San Fernando default centroid
    longitude: 120.6955,
  });
  const [hasLocation, setHasLocation] = useState(true);
  const [barangay, setBarangay] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  const [outOfScope, setOutOfScope] = useState(false);

  // Media states
  const [photoUri, setPhotoUri] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  // AI Diagnostic states
  const [aiTriage, setAiTriage] = useState(null);
  const [isTriaging, setIsTriaging] = useState(false);

  const [loading, setLoading] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(''); // Progress status text shown during submit
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [successTicketDetails, setSuccessTicketDetails] = useState({
    ticketId: '',
    barangay: ''
  });
  const [userName, setUserName] = useState('Pedro');
  const [metrics, setMetrics] = useState({ total: 25, pending: 9, active: 8, resolved: 8 });
  const [notificationsModalVisible, setNotificationsModalVisible] = useState(false);
  const { notifications, unreadCount, fetchNotifications, markAllAsRead, dismissNotification } = useNotificationStore();

  const handleOpenNotifications = () => {
    setNotificationsModalVisible(true);
    markAllAsRead();
  };

  const handleNotificationPress = (item) => {
    setNotificationsModalVisible(false);
    dismissNotification(item.id);
    if (item.type === 'advisory') {
      navigation.navigate('Announcements');
    } else if (item.type === 'complaint_status') {
      navigation.navigate('TrackComplaints');
    }
  };

  // Ask for permissions and locate user on load
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      await ImagePicker.requestCameraPermissionsAsync();
      if (status === 'granted') {
        try {
          await locateUser();
        } catch (err) {
          console.warn("Initial location fetch bypassed:", err.message);
        }
      }
    })();

    const fetchProfileAndMetrics = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          // Fetch profile
          const profile = await api.post('/api/auth/profile', { userId: session.user.id });
          if (profile?.name) {
            setUserName(profile.name);
          }

          // Fetch complaint counts
          const { data: userComplaints, error: compError } = await supabase
            .from('Complaint')
            .select('id, status')
            .eq('userId', session.user.id);

          if (!compError && userComplaints) {
            const total = userComplaints.length;
            const pending = userComplaints.filter(c => c.status === 'PENDING').length;
            const active = userComplaints.filter(c => c.status === 'EVALUATING' || c.status === 'DISPATCHED' || c.status === 'ONGOING').length;
            const resolved = userComplaints.filter(c => c.status === 'RESOLVED').length;

            if (total > 0) {
              setMetrics({ total, pending, active, resolved });
            }
          }
        }
        // Load notifications update
        fetchNotifications();
      } catch (err) {
        console.warn("Failed to load header profile/metrics:", err);
      }
    };

    fetchProfileAndMetrics();

    // Refresh when focused
    const unsubscribeFocus = navigation.addListener('focus', () => {
      fetchProfileAndMetrics();
    });

    return () => {
      unsubscribeFocus();
    };
  }, [navigation]);

  // Automatically locate user — used internally by handleSubmit
  const locateUser = async () => {
    setIsLocating(true);
    setOutOfScope(false);
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status !== 'granted') {
        const ask = await Location.requestForegroundPermissionsAsync();
        if (ask.status !== 'granted') {
          throw new Error('GPS location permission is required to file a complaint.');
        }
      }

      const current = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const newCoords = {
        latitude: current.coords.latitude,
        longitude: current.coords.longitude,
      };

      setLocation(newCoords);
      setHasLocation(true);

      // Verify coordinate with locate-barangay API
      const locData = await api.post('/api/locate-barangay', {
        latitude: newCoords.latitude,
        longitude: newCoords.longitude,
      });

      if (locData && locData.barangay) {
        setLocation(newCoords);
        setHasLocation(true);
        setBarangay(locData.barangay);
        setOutOfScope(false);
        return { coords: newCoords, barangay: locData.barangay, outOfScope: false };
      } else {
        // If outside San Fernando (like California emulator), do not update map coordinate state to California.
        // Keep the map centered on default San Fernando coords (15.0298, 120.6955) so the map renders correctly.
        setBarangay('Unknown Area');
        setOutOfScope(true);
        setHasLocation(true); // Keep marker at default center
        return { 
          coords: { latitude: 15.0298, longitude: 120.6955 }, 
          barangay: 'Unknown Area', 
          outOfScope: true 
        };
      }
    } catch (err) {
      console.error(err);
      throw new Error(err.message || 'Could not query GPS position. Please try again.');
    } finally {
      setIsLocating(false);
    }
  };

  // Select Photo
  const handlePickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  // Run AI Diagnostics — used internally by handleSubmit
  const runAiTriage = async () => {
    setIsTriaging(true);
    setAiTriage(null);
    try {
      const data = await api.post('/api/triage', { text: rawText });
      if (data && data.success && data.result) {
        setAiTriage(data.result);
        setCategory(data.result.category);
        setUrgency(data.result.urgency);
        return data.result;
      }
    } catch (err) {
      console.error('AI triage failed, using defaults:', err);
    } finally {
      setIsTriaging(false);
    }
    return null; // Graceful fallback — submission proceeds with defaults
  };

  // Unified Submit — automatically locates, triages with AI, uploads photo, and submits
  const handleSubmit = async () => {
    if (!rawText.trim()) {
      Alert.alert('Validation Error', 'Please fill in the problem description.');
      return;
    }

    setLoading(true);
    setSubmitStatus('');
    let finalImageUrl = null;
    let triageResult = null;
    let resolvedLocation = { coords: location, barangay, outOfScope };

    try {
      // Step 1: Get current GPS location automatically if not already pinned
      if (!hasLocation) {
        setSubmitStatus('Acquiring GPS location...');
        resolvedLocation = await locateUser();
      }

      if (resolvedLocation.outOfScope) {
        Alert.alert(
          'Out of Service Area',
          'Your current location is outside the City of San Fernando water district service area. Complaints can only be filed within the valid service boundary.'
        );
        setLoading(false);
        setSubmitStatus('');
        return;
      }

      // Step 2: Run AI diagnostics on the complaint text
      setSubmitStatus('Running AI diagnostics...');
      triageResult = await runAiTriage();

      // Step 3: Upload photo to Supabase storage if selected
      if (photoUri) {
        setSubmitStatus('Uploading photo...');
        setIsUploading(true);
        const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
        const response = await fetch(photoUri);
        const blob = await response.blob();

        const { error: uploadError } = await supabase.storage
          .from('complaint-media')
          .upload(filename, blob, { contentType: 'image/jpeg' });

        if (uploadError) {
          throw new Error('Photo upload failed: ' + uploadError.message);
        }

        const { data } = supabase.storage.from('complaint-media').getPublicUrl(filename);
        finalImageUrl = data.publicUrl;
        setIsUploading(false);
      }

      // Step 4: Submit complaint payload
      setSubmitStatus('Submitting complaint...');
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id || null;

      const payload = {
        rawText,
        latitude: resolvedLocation.coords.latitude,
        longitude: resolvedLocation.coords.longitude,
        imageUrl: finalImageUrl,
        urgency: triageResult?.urgency || urgency,
        category: triageResult?.category || category,
        summary: triageResult?.summary || null,
        translatedText: triageResult?.translatedText || null,
        userId,
      };

      const result = await api.post('/api/complaints', payload);

      if (result && result.success) {
        setSuccessTicketDetails({
          ticketId: `AQ-${result.id?.slice(0, 8).toUpperCase() || 'RESOLVED'}`,
          barangay: result.barangay || resolvedLocation.barangay || 'City Center'
        });
        setSuccessModalVisible(true);
        // Clear form
        setRawText('');
        setPhotoUri(null);
        setAiTriage(null);
        setHasLocation(false);
        setBarangay(null);
        setOutOfScope(false);
      } else {
        throw new Error(result.error || 'Submission failed');
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Submission Error', err.message || 'Failed to submit complaint. Please try again.');
    } finally {
      setLoading(false);
      setIsUploading(false);
      setSubmitStatus('');
    }
  };

  return (
    <ScrollView 
      className="flex-1 bg-[#F2F5FA]" 
      contentContainerStyle={{ paddingBottom: 140 }}
    >
      <LinearGradient 
        colors={['#02205eff', '#325497ff']} 
        start={{ x: 0, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={homeStyles.headerCard}
      >
        {/* Brand Row */}
        <View style={homeStyles.brandRow}>
          {/* Left: Brand Logo */}
          <View style={homeStyles.logoContainer}>
            <Image 
              source={require('../../assets/LOGO3.png')}
              style={homeStyles.logoImage}
            />
          </View>

          {/* Middle: Brand Text */}
          <View style={homeStyles.brandTextContainer}>
            <View style={homeStyles.brandTitleRow}>
              <Text style={homeStyles.brandAqua}>AQ</Text>
              <Text style={homeStyles.brandAquaYellow}>U</Text>
              <Text style={homeStyles.brandAquaRed}>A</Text>
              <Text style={homeStyles.brandRack}>T</Text>
              <Text style={homeStyles.brandRack}>RACK</Text>
            </View>
            <Text style={homeStyles.brandSubtitle}>CONSUMER PORTAL</Text>
          </View>

          {/* Right: Notification & Profile Section */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            {/* Notification Bell */}
            <TouchableOpacity 
              activeOpacity={0.7} 
              onPress={handleOpenNotifications}
              style={homeStyles.notificationBell}
            >
              <Ionicons name="notifications-outline" size={18} color="#ffffff" />
              {unreadCount > 0 && <View style={homeStyles.notificationBadge} />}
            </TouchableOpacity>

            {/* User Profile Pill */}
            <TouchableOpacity 
              style={homeStyles.profilePill}
              activeOpacity={0.8}
            >
              <Text style={homeStyles.profileName} numberOfLines={1}>{userName}</Text>
              <View style={homeStyles.avatarContainer}>
                <Ionicons name="person" size={14} color="#ffffff" />
                <View style={homeStyles.activeDot} />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Metrics Counter Banner */}
        <View style={homeStyles.metricsBanner}>
          <View style={homeStyles.metricColumn}>
            <Text style={homeStyles.metricLabel}>TOTAL LOGS</Text>
            <Text style={homeStyles.metricNumber}>{metrics.total}</Text>
          </View>
          <View style={homeStyles.divider} />
          
          <View style={homeStyles.metricColumn}>
            <Text style={[homeStyles.metricLabel, { color: '#FFCC00' }]}>PENDING</Text>
            <Text style={[homeStyles.metricNumber, { color: '#FFCC00' }]}>{metrics.pending}</Text>
          </View>
          <View style={homeStyles.divider} />

          <View style={homeStyles.metricColumn}>
            <Text style={[homeStyles.metricLabel, { color: '#00D1FF' }]}>ACTIVE</Text>
            <Text style={[homeStyles.metricNumber, { color: '#00D1FF' }]}>{metrics.active}</Text>
          </View>
          <View style={homeStyles.divider} />

          <View style={homeStyles.metricColumn}>
            <Text style={[homeStyles.metricLabel, { color: '#4CD964' }]}>RESOLVED</Text>
            <Text style={[homeStyles.metricNumber, { color: '#4CD964' }]}>{metrics.resolved}</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Screen Content Wrapper */}
      <View className="px-[18px] mt-6">
        <View className="mb-6">
          <Text className="text-[#0B2240] font-black text-2xl tracking-tight">File a Complaint</Text>
          <Text className="text-[#627D98] font-medium text-xs mt-1.5 leading-relaxed">
            Report utility anomalies to the City Water District command center
          </Text>
        </View>

        <View className="bg-white border border-[#E2E8F5] rounded-3xl p-5 mb-5 shadow-sm">
          <Text className="text-[#009FDE] font-black text-xs uppercase tracking-widest mb-4">1. Incident Details</Text>
          
          <View className="space-y-4">
            <Text className="text-[#0B2240] font-black text-[10px] uppercase tracking-wider">Problem Description</Text>
            <TextInput
              className="bg-[#F8FAFC] border border-[#E2E8F5] rounded-2xl p-4 text-[#0B2240] text-sm leading-relaxed text-left mt-1.5 mb-3"
              style={{ minHeight: 120, textAlignVertical: 'top' }}
              multiline
              numberOfLines={4}
              placeholder="Type your issue. You can write in English, Tagalog, Taglish, or Kapampangan..."
              placeholderTextColor="#94a3b8"
              value={rawText}
              onChangeText={setRawText}
            />

            <TouchableOpacity 
              onPress={handlePickPhoto}
              activeOpacity={0.8}
              style={{ 
                backgroundColor: photoUri ? '#ECFDF5' : '#EFF6FF',
                borderColor: photoUri ? '#10B981' : '#009FDE',
                borderStyle: 'dashed'
              }}
              className="border rounded-2xl p-4 flex-row items-center justify-center mt-2"
            >
              <Ionicons 
                name={photoUri ? "checkmark-circle" : "camera"} 
                size={18} 
                color={photoUri ? '#10B981' : '#009FDE'} 
                style={{ marginRight: 8 }}
              />
              <Text 
                style={{ color: photoUri ? '#10B981' : '#007AFF' }} 
                className="font-bold text-sm"
              >
                {photoUri ? "Photo Attached" : "Attach Incident Photo"}
              </Text>
            </TouchableOpacity>

            {photoUri && (
              <Image 
                source={{ uri: photoUri }} 
                className="w-full h-48 rounded-2xl mt-4 border border-[#E2E8F5]"
                style={{ resizeMode: 'cover' }}
              />
            )}

          </View>
        </View>

        {/* AI Diagnostic Results Card */}
        {aiTriage && (
          <View className="bg-indigo-50/50 border border-indigo-100 rounded-3xl p-5 mb-5 shadow-sm">
            <View className="flex-row items-center mb-3">
              <Ionicons name="sparkles" size={16} color="#4F46E5" style={{ marginRight: 6 }} />
              <Text className="text-[#4F46E5] font-black text-sm uppercase tracking-wider">Gemini AI Diagnosis</Text>
            </View>
            
            <View className="space-y-2.5">
              <View className="flex-row items-start">
                <Text className="text-[#627D98] font-bold text-xs w-24">Translation:</Text>
                <Text className="text-[#0B2240] font-medium text-xs flex-1 italic">"{aiTriage.translatedText}"</Text>
              </View>
              <View className="flex-row items-start mt-2">
                <Text className="text-[#627D98] font-bold text-xs w-24">Category:</Text>
                <Text className="text-[#0B2240] font-bold text-xs flex-1 uppercase">{aiTriage.category?.replace(/_/g, ' ')}</Text>
              </View>
              <View className="flex-row items-start mt-2">
                <Text className="text-[#627D98] font-bold text-xs w-24">Urgency:</Text>
                <Text className="text-[#0B2240] font-bold text-xs flex-1 uppercase">{aiTriage.urgency}</Text>
              </View>
              <View className="flex-row items-start mt-2">
                <Text className="text-[#627D98] font-bold text-xs w-24">Summary:</Text>
                <Text className="text-[#0B2240] font-semibold text-xs flex-1">{aiTriage.summary}</Text>
              </View>
            </View>
          </View>
        )}

        <View className="bg-white border border-[#E2E8F5] rounded-3xl p-5 mb-5 shadow-sm">
          <Text className="text-[#009FDE] font-black text-xs uppercase tracking-widest mb-4">2. Location Preview</Text>

          <View className="w-full h-48 rounded-2xl overflow-hidden border border-[#E2E8F5] mb-4">
            {hasNativeMap ? (
              <MapView
                style={{ width: '100%', height: '100%' }}
                initialRegion={{
                  latitude: location.latitude,
                  longitude: location.longitude,
                  latitudeDelta: 0.05,
                  longitudeDelta: 0.05,
                }}
                region={{
                  latitude: location.latitude,
                  longitude: location.longitude,
                  latitudeDelta: 0.015,
                  longitudeDelta: 0.015,
                }}
              >
                {hasLocation && (
                  <Marker
                    coordinate={location}
                    draggable
                    onDragEnd={(e) => {
                      const newCoords = e.nativeEvent.coordinate;
                      setLocation(newCoords);
                      api.post('/api/locate-barangay', {
                        latitude: newCoords.latitude,
                        longitude: newCoords.longitude,
                      }).then((locData) => {
                        if (locData && locData.barangay) {
                          setBarangay(locData.barangay);
                          setOutOfScope(false);
                        } else {
                          setBarangay("Unknown Area");
                          setOutOfScope(true);
                        }
                      });
                    }}
                    pinColor="red"
                  />
                )}
              </MapView>
            ) : (
              Platform.OS === 'web' && hasLocation ? (
                <WebMap latitude={location.latitude} longitude={location.longitude} />
              ) : (
                <View className="flex-1 bg-[#F8FAFC] items-center justify-center p-4">
                  {hasLocation ? (
                    <Image
                      source={{
                        uri: `https://static-maps.yandex.ru/1.x/?ll=${location.longitude},${location.latitude}&size=450,200&z=14&l=map&pt=${location.longitude},${location.latitude},pm2rdl`
                      }}
                      className="w-full h-full rounded-2xl"
                      style={{ resizeMode: 'cover' }}
                    />
                  ) : (
                    <View className="items-center p-4">
                      <Ionicons name="location-outline" size={24} color="#0B2240" style={{ marginBottom: 6 }} />
                      <Text className="text-[#0B2240] font-black text-sm mb-1 text-center">
                        Awaiting Location
                      </Text>
                      <Text className="text-[#627D98] font-medium text-xs text-center leading-relaxed">
                        Your current location will be captured automatically when you submit your complaint.
                      </Text>
                    </View>
                  )}
                </View>
              )
            )}
          </View>

          {hasLocation && (
            <View className="bg-[#F8FAFC] border border-[#E2E8F5] rounded-2xl p-4 flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="text-[#627D98] font-bold text-[9px] uppercase tracking-wider">Barangay</Text>
                <Text className="text-[#0B2240] font-black text-xs mt-0.5">{barangay || 'Detecting...'}</Text>
              </View>
              <View className="w-px h-8 bg-[#E2E8F5] mx-4" />
              <View className="flex-grow flex-shrink-0">
                <Text className="text-[#627D98] font-bold text-[9px] uppercase tracking-wider">GPS Coordinates</Text>
                <Text className="text-[#0B2240] font-black text-xs mt-0.5">{location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}</Text>
              </View>
            </View>
          )}

          {outOfScope && (
            <View className="bg-red-50 border border-red-100 rounded-2xl p-4 mt-3">
              <Text className="text-[#EF4444] font-semibold text-xs text-center leading-relaxed">
                Outside Service Area. Please move pin inside San Fernando boundary.
              </Text>
            </View>
          )}
        </View>

        {/* Submit Status Indicator */}
        {loading && submitStatus ? (
          <View className="bg-[#EFF6FF] border border-[#3B82F6]/20 rounded-2xl p-4 mb-4 flex-row items-center justify-center">
            <ActivityIndicator color="#007AFF" size="small" style={{ marginRight: 8 }} />
            <Text className="text-[#007AFF] font-bold text-xs">{submitStatus}</Text>
          </View>
        ) : null}

        <TouchableOpacity 
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.8}
          className={`py-4 rounded-2xl items-center justify-center shadow-sm ${
            loading ? 'bg-slate-300' : 'bg-[#0B2240] active:bg-[#061224]'
          }`}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text className="text-white font-black text-sm uppercase tracking-wider">Submit Report</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Success Confirmation Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={successModalVisible}
        onRequestClose={() => setSuccessModalVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(11, 34, 64, 0.4)' }} className="justify-center items-center p-6">
          <View className="bg-white w-full max-w-sm rounded-3xl p-6 items-center shadow-xl border border-[#E2E8F5]">
            
            {/* Animated Checkmark Circle */}
            <View className="bg-[#ECFDF5] border border-[#10B981]/20 p-4 rounded-full mb-4 items-center justify-center">
              <Ionicons name="checkmark-circle" size={48} color="#10B981" />
            </View>

            {/* Title */}
            <Text className="text-[#0B2240] font-black text-lg text-center leading-snug mb-1">
              Complaint Registered
            </Text>
            <Text className="text-[#627D98] font-medium text-xs text-center mb-6 px-2">
              Your utility report has been successfully logged into the AquaTrack command center.
            </Text>

            {/* Ticket Details Panel */}
            <View className="bg-[#F8FAFC] border border-[#E2E8F5] w-full rounded-2xl p-4 mb-6">
              <View className="flex-row justify-between items-center mb-2.5">
                <Text className="text-[#627D98] font-bold text-[9px] uppercase tracking-wider">Ticket ID</Text>
                <Text className="text-[#0B2240] font-black text-xs font-mono">{successTicketDetails.ticketId}</Text>
              </View>
              <View className="w-full h-px bg-[#E2E8F5] my-1" />
              <View className="flex-row justify-between items-center mt-2.5">
                <Text className="text-[#627D98] font-bold text-[9px] uppercase tracking-wider">Service Area</Text>
                <Text className="text-[#0B2240] font-black text-xs">{successTicketDetails.barangay}</Text>
              </View>
            </View>

            {/* Buttons */}
            <View className="w-full">
              <TouchableOpacity 
                onPress={() => {
                  setSuccessModalVisible(false);
                  navigation.navigate('TrackComplaints');
                }}
                activeOpacity={0.85}
                className="bg-[#0B2240] py-3.5 rounded-2xl w-full items-center justify-center shadow-sm"
              >
                <Text className="text-white font-black text-xs uppercase tracking-wider">Track Progress</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                onPress={() => setSuccessModalVisible(false)}
                activeOpacity={0.8}
                className="border border-[#E2E8F5] py-3.5 rounded-2xl w-full items-center justify-center mt-3"
              >
                <Text className="text-[#627D98] font-bold text-xs">File Another Report</Text>
              </TouchableOpacity>
            </View>

          </View>
        </View>
      </Modal>

      {/* Notifications Drawer Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={notificationsModalVisible}
        onRequestClose={() => setNotificationsModalVisible(false)}
      >
        <TouchableOpacity 
          style={homeStyles.modalOverlay}
          activeOpacity={1}
          onPress={() => setNotificationsModalVisible(false)}
        >
          <TouchableOpacity 
            style={homeStyles.notificationsModalContent}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <View style={homeStyles.modalHeader}>
              <Text style={homeStyles.modalTitle}>Notifications & Updates</Text>
              <TouchableOpacity onPress={() => setNotificationsModalVisible(false)}>
                <Ionicons name="close" size={20} color="#0B1C3F" />
              </TouchableOpacity>
            </View>

            {/* Notifications Scrollable List */}
            {notifications.length === 0 ? (
              <View style={homeStyles.emptyNotifications}>
                <Ionicons name="notifications-off-outline" size={48} color="#94a3b8" />
                <Text style={homeStyles.emptyNotificationsText}>No updates or notifications yet.</Text>
              </View>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false}>
                {notifications.map((item) => {
                  let iconName = 'notifications-outline';
                  let iconColor = '#009FDE';
                  let iconBg = 'rgba(0, 159, 222, 0.08)';

                  if (item.type === 'advisory') {
                    if (item.category === 'warning') {
                      iconName = 'alert-circle-outline';
                      iconColor = '#EF4444';
                      iconBg = '#FEF2F2';
                    } else {
                      iconName = 'megaphone-outline';
                      iconColor = '#F59E0B';
                      iconBg = '#FEF3C7';
                    }
                  } else if (item.type === 'complaint_status') {
                    if (item.status === 'RESOLVED') {
                      iconName = 'checkmark-circle-outline';
                      iconColor = '#10B981';
                      iconBg = '#ECFDF5';
                    } else if (item.status === 'ONGOING') {
                      iconName = 'build-outline';
                      iconColor = '#6366F1';
                      iconBg = '#EEF2FF';
                    } else {
                      iconName = 'document-text-outline';
                      iconColor = '#3B82F6';
                      iconBg = '#EFF6FF';
                    }
                  }

                  const timeString = item.date.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <TouchableOpacity 
                      key={item.id} 
                      activeOpacity={0.7}
                      onPress={() => handleNotificationPress(item)}
                      style={[
                        homeStyles.notificationItem, 
                        !item.read && homeStyles.notificationItemUnread
                      ]}
                    >
                      <View style={[homeStyles.notificationIconContainer, { backgroundColor: iconBg }]}>
                        <Ionicons name={iconName} size={18} color={iconColor} />
                      </View>
                      <View style={homeStyles.notificationContent}>
                        <Text style={homeStyles.notificationTitle}>{item.title}</Text>
                        <Text style={homeStyles.notificationMessage}>{item.message}</Text>
                        <Text style={homeStyles.notificationTime}>{timeString}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </ScrollView>
  );
}
