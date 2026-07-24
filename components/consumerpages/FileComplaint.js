import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Image, ActivityIndicator, Alert, UIManager, Platform } from 'react-native';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import MapView, { Marker, Polygon } from 'react-native-maps';
import { api } from '../../src/config/api';
import { supabase } from '../../src/config/supabase';
import styles from './FileComplaint.styles';

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
  }, []);

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
        Alert.alert(
          'Ticket Submitted',
          `Complaint registered successfully! Barangay: ${result.barangay || resolvedLocation.barangay || 'Resolved'}.`,
          [{ text: 'OK', onPress: () => navigation.navigate('TrackComplaints') }]
        );
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
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContainer}>
      <View style={styles.header}>
        <Text style={styles.title}>File a Complaint</Text>
        <Text style={styles.subtitle}>Report utility anomalies to the City Water District command center</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>1. Incident Details</Text>
        
        <View style={styles.form}>
          <Text style={styles.label}>Problem Description</Text>
          <TextInput
            style={styles.textArea}
            multiline
            numberOfLines={4}
            placeholder="Type your issue. You can write in English, Tagalog, Taglish, or Kapampangan..."
            placeholderTextColor="#94a3b8"
            value={rawText}
            onChangeText={setRawText}
          />

          <TouchableOpacity 
            style={[styles.imagePickerBtn, photoUri && { borderColor: '#10b981', backgroundColor: '#ecfdf5' }]} 
            onPress={handlePickPhoto}
          >
            <Text style={[styles.imagePickerText, photoUri && { color: '#10b981' }]}>
              {photoUri ? "Photo Attached" : "Attach Incident Photo"}
            </Text>
          </TouchableOpacity>

          {photoUri && (
            <Image source={{ uri: photoUri }} style={styles.previewImage} />
          )}

        </View>
      </View>

      {/* AI Diagnostic Results Card */}
      {aiTriage && (
        <View style={styles.aiCard}>
          <Text style={styles.aiTitle}>Gemini AI Diagnosis</Text>
          <View style={styles.aiDetailRow}>
            <Text style={styles.aiDetailLabel}>Translation:</Text>
            <Text style={styles.aiDetailValue}>"{aiTriage.translatedText}"</Text>
          </View>
          <View style={styles.aiDetailRow}>
            <Text style={styles.aiDetailLabel}>Category:</Text>
            <Text style={styles.aiDetailValue}>{aiTriage.category}</Text>
          </View>
          <View style={styles.aiDetailRow}>
            <Text style={styles.aiDetailLabel}>Urgency:</Text>
            <Text style={styles.aiDetailValue}>{aiTriage.urgency}</Text>
          </View>
          <View style={styles.aiDetailRow}>
            <Text style={styles.aiDetailLabel}>Summary:</Text>
            <Text style={styles.aiDetailValue}>{aiTriage.summary}</Text>
          </View>
        </View>
      )}

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>2. Location Preview</Text>

        <View style={styles.mapContainer}>
          {hasNativeMap ? (
            <MapView
              style={styles.map}
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
                    // Verify new coords are inside geofence via API
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
              <View style={{ flex: 1, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center' }}>
                {hasLocation ? (
                  <Image
                    source={{
                      uri: `https://static-maps.yandex.ru/1.x/?ll=${location.longitude},${location.latitude}&size=450,200&z=14&l=map&pt=${location.longitude},${location.latitude},pm2rdl`
                    }}
                    style={{ width: '100%', height: '100%', borderRadius: 12 }}
                  />
                ) : (
                  <View style={{ padding: 20, alignItems: 'center' }}>
                    <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#001e66', marginBottom: 4, textAlign: 'center' }}>
                      Awaiting Location
                    </Text>
                    <Text style={{ fontSize: 11, color: '#525f7f', textAlign: 'center', lineHeight: 15 }}>
                      Your current location will be captured automatically when you submit your complaint.
                    </Text>
                  </View>
                )}
              </View>
            )
          )}
        </View>

        {hasLocation && (
          <View style={styles.locationStatus}>
            <Text style={styles.locationStatusText}>
              <Text style={styles.locationStatusLabel}>Barangay: </Text>
              {barangay || 'Detecting...'}
            </Text>
            <Text style={styles.locationStatusText}>
              <Text style={styles.locationStatusLabel}>Coordinates: </Text>
              {location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}
            </Text>
          </View>
        )}

        {outOfScope && (
          <View style={styles.geofenceWarning}>
            <Text style={styles.geofenceWarningText}>Outside Service Area. Please move pin inside San Fernando boundary.</Text>
          </View>
        )}
      </View>

      {/* Submit Status Indicator */}
      {loading && submitStatus ? (
        <View style={styles.statusIndicator}>
          <ActivityIndicator color="#001e66" size="small" />
          <Text style={styles.statusIndicatorText}>{submitStatus}</Text>
        </View>
      ) : null}

      <TouchableOpacity 
        style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
        onPress={handleSubmit}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text style={styles.submitBtnText}>Submit</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}
