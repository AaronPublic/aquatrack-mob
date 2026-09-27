import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView,  ActivityIndicator, Alert, UIManager, Platform, Modal } from 'react-native';
import { Image } from 'expo-image';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { File } from 'expo-file-system';
import * as FileSystem from 'expo-file-system/legacy';
import { useAudioRecorder, RecordingPresets, requestRecordingPermissionsAsync, setAudioModeAsync } from 'expo-audio';
import { LinearGradient } from 'expo-linear-gradient';
import MapboxGL from '@rnmapbox/maps';
import { MAPBOX_ACCESS_TOKEN, MAPBOX_STYLE_URL } from '../../src/config/mapbox';
import { api } from '../../src/config/api';
import { supabase } from '../../src/config/supabase';
import AppIcon from '../../components/AppIcon';
import styles from './FileComplaint.styles';
import homeStyles from './ConsumerHome.styles';
import { useNotificationStore } from '../../src/store/useNotificationStore';
import ConsumerNotificationModal from './ConsumerNotificationModal';

// Mapbox native access token — set at module load (web build uses the OSM iframe below instead)
if (Platform.OS !== 'web') {
  try {
    MapboxGL.setAccessToken(MAPBOX_ACCESS_TOKEN);
  } catch (err) {
    console.warn('[Mapbox] setAccessToken failed:', err?.message);
  }
}

const WebMap = ({ latitude, longitude }) => {
  if (Platform.OS !== 'web') return null;
  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${longitude - 0.005}%2C${latitude - 0.003}%2C${longitude + 0.005}%2C${latitude + 0.003}&layer=mapnik&marker=${latitude}%2C${longitude}`;
  return React.createElement('iframe', {
    src,
    style: { width: '100%', height: '100%', border: 'none', borderRadius: 8 },
    title: 'Location Preview'
  });
};

// Speech-optimized audio recording options (24kHz Mono @ 32kbps cuts network payload by ~80% with zero quality loss)
const SPEECH_RECORDING_OPTIONS = {
  extension: '.m4a',
  sampleRate: 24000,
  numberOfChannels: 1,
  bitRate: 32000,
  android: {
    outputFormat: 'mpeg4',
    audioEncoder: 'aac',
  },
  ios: {
    outputFormat: 'aac ',
    audioQuality: 64,
    linearPCMBitDepth: 16,
    linearPCMIsBigEndian: false,
    linearPCMIsFloat: false,
  },
  web: {
    mimeType: 'audio/webm',
    bitsPerSecond: 32000,
  },
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

  // Voice-to-Text states (expo-audio speech-optimized)
  const audioRecorder = useAudioRecorder(SPEECH_RECORDING_OPTIONS);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const recordingTimerRef = useRef(null);

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
  const [notificationsModalVisible, setNotificationsModalVisible] = useState(false);
  const { notifications, unreadCount, markAllAsRead, dismissNotification } = useNotificationStore();

  const cameraRef = useRef(null);
  const mapReadyRef = useRef(false);
  const focusMapOn = (lat, lng) => {
    if (cameraRef.current && mapReadyRef.current) {
      cameraRef.current.setCamera({
        centerCoordinate: [lng, lat],
        zoomLevel: 14,
        animationDuration: 300
      });
    }
  };
  const handleMapLoaded = () => {
    mapReadyRef.current = true;
    focusMapOn(location.latitude, location.longitude);
  };
  const handlePinDragEnd = (payload) => {
    const coords = payload?.geometry?.coordinates;
    if (!coords || coords.length < 2) return;
    const newCoords = {
      latitude: coords[1],
      longitude: coords[0]
    };
    setLocation(newCoords);
    api.post('/api/locate-barangay', {
      latitude: newCoords.latitude,
      longitude: newCoords.longitude
    }).then((locData) => {
      if (locData && locData.barangay) {
        setBarangay(locData.barangay);
        setOutOfScope(false);
      } else {
        setBarangay("Unknown Area");
        setOutOfScope(true);
      }
    });
  };

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

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('ConsumerHome');
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

    const fetchProfileData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const profile = await api.post('/api/auth/profile', { userId: session.user.id });
          if (profile?.name) {
            setUserName(profile.name);
          }
        }
      } catch (err) {
        console.warn("Failed to load header profile:", err);
      }
    };

    fetchProfileData();
  }, [navigation]);

  // Automatically locate user — used internally by handleSubmit and manual button
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
        focusMapOn(newCoords.latitude, newCoords.longitude);
        return { coords: newCoords, barangay: locData.barangay, outOfScope: false };
      } else {
        setBarangay('Unknown Area');
        setOutOfScope(true);
        setHasLocation(true);
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

  // Clean up audio recording and timer on unmount
  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
      if (audioRecorder.isRecording) {
        audioRecorder.stop().catch(() => {});
      }
    };
  }, [audioRecorder]);

  // Voice Recording Handlers (expo-audio)
  const startVoiceRecording = async () => {
    try {
      const permission = await requestRecordingPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Microphone Permission', 'Please allow microphone access to record your complaint verbally.');
        return;
      }

      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
      });

      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();
      setIsRecording(true);
      setRecordingSeconds(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Failed to start recording:', err);
      Alert.alert('Recording Error', 'Could not access microphone: ' + (err.message || 'Unknown error'));
    }
  };

  const stopVoiceRecording = async () => {
    setIsRecording(false);
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }

    try {
      await audioRecorder.stop();
      const uri = audioRecorder.uri;
      console.log('[VoiceRecord] Saved audio file at:', uri);

      if (uri) {
        await handleSendAudioForTranscription(uri);
      } else {
        Alert.alert('Recording Notice', 'No audio was captured. Please try recording again.');
      }
    } catch (err) {
      console.error('Failed to stop recording:', err);
      Alert.alert('Recording Error', 'Failed to finalize audio recording.');
    }
  };

  const handleSendAudioForTranscription = async (audioUri) => {
    setIsTranscribing(true);
    try {
      let base64Audio = '';
      try {
        base64Audio = await FileSystem.readAsStringAsync(audioUri, {
          encoding: FileSystem.EncodingType.Base64,
        });
      } catch (legacyErr) {
        try {
          const file = new File(audioUri);
          base64Audio = await file.base64();
        } catch (fileErr) {
          console.warn('[VoiceRecord] File.base64 error:', fileErr);
        }
      }

      if (!base64Audio) {
        throw new Error('Could not encode audio file to base64');
      }

      const data = await api.post('/api/transcribe', {
        audio: base64Audio,
        mimeType: 'audio/mp4',
      });

      if (data && data.success && data.text) {
        setRawText((prev) => (prev ? `${prev} ${data.text}` : data.text).slice(0, 1000));
      } else if (data && data.text) {
        setRawText((prev) => (prev ? `${prev} ${data.text}` : data.text).slice(0, 1000));
      } else {
        throw new Error(data?.error || 'Empty transcription response');
      }
    } catch (err) {
      console.error('Transcription failed:', err);
      Alert.alert('Transcription Notice', 'Could not transcribe voice note: ' + (err.message || 'Network error'));
    } finally {
      setIsTranscribing(false);
    }
  };

  // Select Photo (Client-Side Pre-Compression to quality: 0.6)
  const handlePickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.6,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setPhotoUri(result.assets[0].uri);
      // Invalidate existing triage cache if photo changes
      setAiTriage(null);
    }
  };

  // Run AI Diagnostics with optional uploaded image URL
  const runAiTriage = async (imageUrlOverride = null) => {
    setIsTriaging(true);
    setAiTriage(null);
    try {
      let activeImageUrl = imageUrlOverride;

      // If no override provided but a local photoUri is selected, upload it first to get publicUrl
      if (!activeImageUrl && photoUri) {
        const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
        const response = await fetch(photoUri);
        const blob = await response.blob();
        const { error: uploadError } = await supabase.storage
          .from('complaint-media')
          .upload(filename, blob, { contentType: 'image/jpeg' });
        if (!uploadError) {
          const { data } = supabase.storage.from('complaint-media').getPublicUrl(filename);
          activeImageUrl = data?.publicUrl || null;
        }
      }

      const payload = { text: rawText };
      if (activeImageUrl) {
        payload.imageUrl = activeImageUrl;
      }

      const data = await api.post('/api/triage', payload);
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
    return null;
  };

  // Unified Submit — automatically locates, uploads photo, triages with AI, and submits
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

      // Step 2: Upload photo to Supabase storage if attached (before AI triage so photo is inspected)
      if (photoUri) {
        setSubmitStatus('Uploading photo evidence...');
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

      // Step 3: Run AI diagnostics on complaint text + photo evidence (or reuse cached triage if already evaluated)
      if (aiTriage && (!photoUri || finalImageUrl)) {
        triageResult = aiTriage;
      } else {
        setSubmitStatus('Cross-examining photo & description with AI...');
        triageResult = await runAiTriage(finalImageUrl);
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
          ticketId: `AQ-${result.id?.slice(0, 4).toUpperCase() || 'RESOLVED'}`,
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
      style={{ flex: 1, backgroundColor: '#F2F5FA' }}
      contentContainerStyle={{ paddingBottom: 140 }}
      showsVerticalScrollIndicator={false}
    >
      {/* ==================== TOP 30% BLUE SECTION ==================== */}
      <LinearGradient 
        colors={['#0C4F8B', '#008CE3']} 
        start={{ x: 0, y: 0 }} 
        end={{ x: 0, y: 1 }} 
        style={{
          paddingTop: Platform.OS === 'ios' ? 54 : 42,
          paddingHorizontal: 20,
          paddingBottom: 28,
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Background Decorative Ripples */}
        <View style={homeStyles.decorCircle1} />
        <View style={homeStyles.decorCircle2} />

        {/* Top Header Navigation Bar */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          {/* Back Button */}
          <TouchableOpacity 
            onPress={handleBack}
            activeOpacity={0.8}
            style={{
              width: 42,
              height: 42,
              borderRadius: 14,
              backgroundColor: 'rgba(255, 255, 255, 0.18)',
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: 'rgba(255, 255, 255, 0.28)'
            }}
          >
            <AppIcon name="arrow-back" size={22} color="#FFFFFF" />
          </TouchableOpacity>

          {/* Right Header Controls (Notification Bell) */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <TouchableOpacity 
              activeOpacity={0.7} 
              onPress={handleOpenNotifications}
              style={homeStyles.notificationBell}
            >
              <AppIcon name="notifications-outline" size={20} color="#ffffff" />
              {unreadCount > 0 && <View style={homeStyles.notificationBadge} />}
            </TouchableOpacity>
          </View>
        </View>

        {/* Hero Title Section inside 30% Blue Area */}
        <View style={{ marginTop: 4, marginBottom: 8 }}>
          <Text style={{ color: '#FFFFFF', fontSize: 30, fontWeight: '900', letterSpacing: -0.5, lineHeight: 36 }}>
            File A Report
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 6 }}>
            <AppIcon name="alert-circle-outline" size={14} color="#7DD3FC" />
            <Text style={{ color: '#BAE6FD', fontSize: 12, fontWeight: '600' }}>
              Report water utility & infrastructure anomalies
            </Text>
          </View>
        </View>
      </LinearGradient>

      {/* ==================== CONSUMER HOME WAVE SWIRL DIVIDER ==================== */}
      <View style={homeStyles.swirlWrapper} pointerEvents="none">
        <View style={homeStyles.swirlBlueMaskFill} />
        <View style={homeStyles.smoothWaveCurve1} />
        <View style={homeStyles.smoothWaveCurve2} />
      
      </View>

      {/* ==================== BOTTOM 70% SECTION ==================== */}
      <View style={{ paddingHorizontal: 18, marginTop: 12 }}>

        {/* 1. Incident Description */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, paddingHorizontal: 4 }}>
          <Text className="text-[#64748B] font-extrabold text-xs uppercase tracking-widest">
            Incident Description
          </Text>
          {isRecording && (
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF2F2', borderColor: '#FECACA', borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, gap: 6 }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#DC2626' }} />
              <Text style={{ color: '#DC2626', fontSize: 10, fontWeight: '900' }}>
                REC 00:{recordingSeconds < 10 ? `0${recordingSeconds}` : recordingSeconds}
              </Text>
            </View>
          )}
        </View>

        <View 
          className="bg-white border border-[#E2E8F5] rounded-3xl p-5 mb-5"
          style={{
            shadowColor: '#0B2240',
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.07,
            shadowRadius: 14,
            elevation: 4,
          }}
        >
          <TextInput
            className="bg-[#F8FAFC] border border-[#E2E8F5] rounded-2xl p-4 text-[#0B2240] text-sm leading-relaxed text-left"
            style={{ minHeight: 110, textAlignVertical: 'top' }}
            multiline
            numberOfLines={4}
            placeholder="Type your issue. You can speak or write in English, Tagalog, Taglish, or Kapampangan..."
            placeholderTextColor="#94a3b8"
            value={rawText}
            onChangeText={setRawText}
          />

          {/* Voice-to-Text Action Button */}
          <View style={{ marginTop: 12 }}>
            {isTranscribing ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12, borderRadius: 16, backgroundColor: '#F0F9FF', borderWidth: 1, borderColor: '#BAE6FD' }}>
                <ActivityIndicator color="#0284C7" size="small" style={{ marginRight: 8 }} />
                <Text style={{ color: '#0369A1', fontWeight: '700', fontSize: 12 }}>
                  Transcribing speech with Gemini...
                </Text>
              </View>
            ) : isRecording ? (
              <TouchableOpacity
                onPress={stopVoiceRecording}
                activeOpacity={0.8}
                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12, borderRadius: 16, backgroundColor: '#EF4444' }}
              >
                <AppIcon name="stop" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={{ color: '#FFFFFF', fontWeight: '900', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Stop Recording (00:{recordingSeconds < 10 ? `0${recordingSeconds}` : recordingSeconds})
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={startVoiceRecording}
                activeOpacity={0.8}
                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12, borderRadius: 16, backgroundColor: '#EFF6FF', borderWidth: 1, borderColor: '#BFDBFE' }}
              >
                <AppIcon name="mic" size={16} color="#0284C7" style={{ marginRight: 6 }} />
                <Text style={{ color: '#0369A1', fontWeight: '700', fontSize: 12 }}>
                  Voice Record
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* 2. Detailed Map & Geofence Location Preview */}
        <Text className="text-[#64748B] font-extrabold text-xs uppercase tracking-widest mb-2 px-1">
          Detailed Map & Geofence
        </Text>
        <View 
          className="bg-white border border-[#E2E8F5] rounded-3xl p-5 mb-5"
          style={{
            shadowColor: '#0B2240',
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.07,
            shadowRadius: 14,
            elevation: 4,
          }}
        >
          <View className="w-full h-48 rounded-2xl overflow-hidden border border-[#E2E8F5] mb-4">
            {hasLocation ? (
              Platform.OS === 'web' ? (
                <WebMap latitude={location.latitude} longitude={location.longitude} />
              ) : (
                <MapboxGL.MapView
                  style={{ flex: 1 }}
                  styleURL={MAPBOX_STYLE_URL}
                  logoEnabled
                  compassEnabled
                  onDidFinishLoadingMap={handleMapLoaded}
                >
                  <MapboxGL.Camera ref={cameraRef} zoomLevel={14} />
                  <MapboxGL.PointAnnotation
                    id="complaint-pin"
                    coordinate={[location.longitude, location.latitude]}
                    draggable
                    onDragEnd={handlePinDragEnd}
                  >
                    <View
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: 11,
                        backgroundColor: '#EF4444',
                        borderWidth: 3,
                        borderColor: '#FFFFFF',
                        shadowColor: '#EF4444',
                        shadowOpacity: 0.6,
                        shadowRadius: 6,
                        shadowOffset: { width: 0, height: 0 },
                        elevation: 4,
                      }}
                    />
                  </MapboxGL.PointAnnotation>
                </MapboxGL.MapView>
              )
            ) : (
              <View className="flex-1 bg-[#F8FAFC] items-center justify-center p-4">
                <View className="items-center p-4">
                  <Text className="text-[#0B2240] font-black text-sm mb-1 text-center">
                    Awaiting Location
                  </Text>
                  <Text className="text-[#627D98] font-medium text-xs text-center leading-relaxed">
                    Your current location will be captured automatically when you submit your complaint.
                  </Text>
                </View>
              </View>
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

        {/* 3. AI Diagnostic Results Card */}
        {aiTriage && (
          <>
            <Text className="text-[#64748B] font-extrabold text-xs uppercase tracking-widest mb-2 px-1">
              Gemini AI Diagnosis
            </Text>
            <View 
              className="bg-indigo-50/50 border border-indigo-100 rounded-3xl p-5 mb-5"
              style={{
                shadowColor: '#4F46E5',
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.08,
                shadowRadius: 14,
                elevation: 4,
              }}
            >
              <View className="flex-row items-center mb-3">
                <AppIcon name="sparkles" size={16} color="#4F46E5" style={{ marginRight: 6 }} />
                <Text className="text-[#4F46E5] font-black text-sm uppercase tracking-wider">Diagnosis Details</Text>
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
          </>
        )}

        {/* 4. Attach Incident Photo Card (Positioned directly above Submit Report) */}
        <Text className="text-[#64748B] font-extrabold text-xs uppercase tracking-widest mb-2 px-1">
          Evidence & Media
        </Text>
        <View 
          className="bg-white border border-[#E2E8F5] rounded-3xl p-5 mb-5"
          style={{
            shadowColor: '#0B2240',
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.07,
            shadowRadius: 14,
            elevation: 4,
          }}
        >
          <TouchableOpacity 
            onPress={handlePickPhoto}
            activeOpacity={0.8}
            style={{ 
              backgroundColor: photoUri ? '#ECFDF5' : '#EFF6FF',
              borderColor: photoUri ? '#10B981' : '#009FDE',
              borderStyle: 'dashed'
            }}
            className="border rounded-2xl p-4 flex-row items-center justify-center"
          >
            <AppIcon 
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
            <View className="relative mt-4">
              <Image 
                source={{ uri: photoUri }} 
                className="w-full h-48 rounded-2xl border border-[#E2E8F5]"
                style={{ resizeMode: 'cover' }}
              />
              <TouchableOpacity 
                onPress={() => setPhotoUri(null)}
                className="absolute top-2 right-2 bg-black/60 p-1.5 rounded-full"
              >
                <AppIcon name="close" size={16} color="#FFFFFF" />
              </TouchableOpacity>
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

        {/* Submit Report Action Button */}
        <TouchableOpacity 
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.8}
          style={{
            shadowColor: '#2196F3',
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.25,
            shadowRadius: 10,
            elevation: 5,
          }}
          className={`py-4 rounded-2xl items-center justify-center ${
            loading ? 'bg-slate-300' : 'bg-[#2196F3] active:bg-[#1E88E5]'
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
            
            <View className="bg-[#ECFDF5] border border-[#10B981]/20 p-4 rounded-full mb-4 items-center justify-center">
              <AppIcon name="checkmark-circle" size={48} color="#10B981" />
            </View>

            <Text className="text-[#0B2240] font-black text-lg text-center leading-snug mb-1">
              Complaint Registered
            </Text>
            <Text className="text-[#627D98] font-medium text-xs text-center mb-6 px-2">
              Your utility report has been successfully logged into the AquaTrack command center.
            </Text>

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

      {/* Upgraded Notifications Center Modal */}
      <ConsumerNotificationModal
        visible={notificationsModalVisible}
        onClose={() => setNotificationsModalVisible(false)}
        notifications={notifications}
        onNotificationPress={handleNotificationPress}
      />
    </ScrollView>
  );
}

