import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Image, ActivityIndicator, Alert } from 'react-native';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import MapView, { Marker, Polygon } from 'react-native-maps';
import { api } from '../../src/config/api';
import { supabase } from '../../src/config/supabase';
import styles from './FileComplaint.styles';

export default function FileComplaint({ navigation }) {
  const [rawText, setRawText] = useState('');
  const [category, setCategory] = useState('UNCLASSIFIED_INFRASTRUCTURE_ANOMALY');
  const [urgency, setUrgency] = useState('MEDIUM');
  
  // Geolocation states
  const [location, setLocation] = useState({
    latitude: 15.0298, // San Fernando default centroid
    longitude: 120.6955,
  });
  const [hasLocation, setHasLocation] = useState(false);
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

  // Ask for permissions on load
  useEffect(() => {
    (async () => {
      await Location.requestForegroundPermissionsAsync();
      await ImagePicker.requestCameraPermissionsAsync();
    })();
  }, []);

  // Locate the user automatically on click
  const handleLocateMe = async () => {
    setIsLocating(true);
    setOutOfScope(false);
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status !== 'granted') {
        const ask = await Location.requestForegroundPermissionsAsync();
        if (ask.status !== 'granted') {
          Alert.alert("Permission Denied", "GPS location permission is required to drop an accurate complaint pin.");
          setIsLocating(false);
          return;
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

      if (locData && locData.success) {
        setBarangay(locData.barangay);
        setOutOfScope(false);
      } else {
        // If API fails to detect local barangay, it's out of scope
        setBarangay("Unknown Area");
        setOutOfScope(true);
      }
    } catch (err) {
      console.error(err);
      Alert.alert("Location Error", "Could not query GPS position. Please drag the pin manually or try again.");
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

  // Run AI Diagnostics on rawText
  const handleRunAiTriage = async () => {
    if (!rawText.trim()) {
      Alert.alert("Input Required", "Please describe the problem first.");
      return;
    }
    setIsTriaging(true);
    setAiTriage(null);
    try {
      const data = await api.post('/api/triage', { text: rawText });
      if (data && data.success && data.result) {
        setAiTriage(data.result);
        setCategory(data.result.category);
        setUrgency(data.result.urgency);
      } else {
        throw new Error(data.error || "Triage failed");
      }
    } catch (err) {
      console.error(err);
      Alert.alert("AI Service Offline", "Could not complete real-time diagnostics. Defaulting parameters.");
    } finally {
      setIsTriaging(false);
    }
  };

  // Submit Complaint
  const handleSubmit = async () => {
    if (!rawText.trim()) {
      Alert.alert("Validation Error", "Please fill in the problem description.");
      return;
    }
    if (!hasLocation) {
      Alert.alert("Validation Error", "Please locate the issue on the map.");
      return;
    }
    if (outOfScope) {
      Alert.alert("Out of Service Area", "Complaints can only be filed within the valid water district service area of City of San Fernando.");
      return;
    }

    setLoading(true);
    let finalImageUrl = null;

    try {
      // 1. Upload photo to Supabase storage if selected
      if (photoUri) {
        setIsUploading(true);
        const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
        const response = await fetch(photoUri);
        const blob = await response.blob();
        
        const { error: uploadError } = await supabase.storage
          .from('complaint-media')
          .upload(filename, blob, { contentType: 'image/jpeg' });

        if (uploadError) {
          throw new Error("Photo upload failed: " + uploadError.message);
        }

        const { data } = supabase.storage.from('complaint-media').getPublicUrl(filename);
        finalImageUrl = data.publicUrl;
        setIsUploading(false);
      }

      // Get user session id
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id || null;

      // 2. Submit complaint payload
      const payload = {
        rawText,
        latitude: location.latitude,
        longitude: location.longitude,
        imageUrl: finalImageUrl,
        urgency,
        category,
        summary: aiTriage?.summary || null,
        translatedText: aiTriage?.translatedText || null,
        userId,
      };

      const result = await api.post('/api/complaints', payload);

      if (result && result.success) {
        Alert.alert(
          "Ticket Submitted",
          `Complaint registered successfully! Barangay: ${result.barangay || barangay || 'Resolved'}.`,
          [{ text: "OK", onPress: () => navigation.navigate('TrackComplaints') }]
        );
        // Clear Form
        setRawText('');
        setPhotoUri(null);
        setAiTriage(null);
        setHasLocation(false);
      } else {
        throw new Error(result.error || "Submission failed");
      }
    } catch (err) {
      console.error(err);
      Alert.alert("Submission Error", err.message || "Failed to submit complaint. Please try again.");
    } finally {
      setLoading(false);
      setIsUploading(false);
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

          <TouchableOpacity 
            style={[styles.locationButton, { backgroundColor: '#0ea5e9' }]}
            onPress={handleRunAiTriage}
            disabled={isTriaging}
          >
            {isTriaging ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.locationButtonText}>Get AI Diagnostics</Text>
            )}
          </TouchableOpacity>
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
        <Text style={styles.sectionTitle}>2. Geolocation Map</Text>

        <TouchableOpacity 
          style={[styles.locationButton, isLocating && { opacity: 0.8 }]}
          onPress={handleLocateMe}
          disabled={isLocating}
        >
          {isLocating ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.locationButtonText}>Get Current Location</Text>
          )}
        </TouchableOpacity>

        <View style={styles.mapContainer}>
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
                    if (locData && locData.success) {
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

      <TouchableOpacity 
        style={[styles.submitBtn, (loading || outOfScope || !hasLocation) && styles.submitBtnDisabled]}
        onPress={handleSubmit}
        disabled={loading || outOfScope || !hasLocation}
      >
        {loading || isUploading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text style={styles.submitBtnText}>Submit Complaint Ticket</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}
