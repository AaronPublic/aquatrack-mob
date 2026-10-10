import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Modal,
  Linking,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import MapboxGL from '@rnmapbox/maps';
import { MAPBOX_ACCESS_TOKEN, MAPBOX_STYLE_URL } from '../../src/config/mapbox';
import AppIcon from '../AppIcon';
import styles from './TechRouteTrackingModal.styles';
import { useResponsive } from '../../src/utils/responsive';
import {
  Navigation,
  MapPin,
  Clock,
  Compass,
  ExternalLink,
  QrCode,
  X,
  Droplets,
} from 'lucide-react-native';

// Set Mapbox native access token on module load
if (Platform.OS !== 'web') {
  try {
    MapboxGL.setAccessToken(MAPBOX_ACCESS_TOKEN);
  } catch (err) {
    console.warn('[Mapbox] setAccessToken failed:', err?.message);
  }
}

const CATEGORY_MAP = {
  WATER_QUALITY: { label: 'Water Quality', color: '#0284C7', bg: '#E0F2FE' },
  LEAKAGE: { label: 'Pipe Leakage', color: '#0EA5E9', bg: '#E0F2FE' },
  PIPE_BURST: { label: 'Main Burst', color: '#EF4444', bg: '#FEE2E2' },
  LOW_PRESSURE: { label: 'Low Pressure', color: '#F59E0B', bg: '#FEF3C7' },
  NO_WATER: { label: 'Water Outage', color: '#DC2626', bg: '#FEE2E2' },
  BILLING_ISSUE: { label: 'Billing / Meter', color: '#10B981', bg: '#D1FAE5' },
};

const URGENCY_MAP = {
  CRITICAL: { text: '#EF4444', bg: '#FEE2E2', border: '#FECACA' },
  HIGH: { text: '#EF4444', bg: '#FEE2E2', border: '#FECACA' },
  MEDIUM: { text: '#D97706', bg: '#FEF3C7', border: '#FDE68A' },
  LOW: { text: '#059669', bg: '#ECFDF5', border: '#A7F3D0' },
};

export default function TechRouteTrackingModal({
  visible = false,
  complaint = null,
  onClose,
  onOpenScanner,
}) {
  const insets = useSafeAreaInsets();
  const { isSmallDevice } = useResponsive();
  const headerTopPadding = Math.max(insets.top, Platform.OS === 'android' ? 34 : 20) + 8;
  const bottomPadding = Math.max(insets.bottom, 16) + 12;

  const [techLocation, setTechLocation] = useState(null);
  const [routeCoordinates, setRouteCoordinates] = useState(null);
  const [routeStats, setRouteStats] = useState({ distance: '-- km', duration: '-- mins' });
  const [loadingRoute, setLoadingRoute] = useState(true);

  const cameraRef = useRef(null);
  const mapReadyRef = useRef(false);

  const focusMapOn = (lng, lat) => {
    if (cameraRef.current && mapReadyRef.current) {
      cameraRef.current.setCamera({
        centerCoordinate: [lng, lat],
        zoomLevel: 14,
        animationDuration: 500,
      });
    }
  };

  const handleMapLoaded = () => {
    mapReadyRef.current = true;
    if (techLocation) {
      focusMapOn(techLocation.longitude, techLocation.latitude);
    } else if (complaint) {
      const dLng = Number(complaint.longitude) || 120.6955;
      const dLat = Number(complaint.latitude) || 15.0298;
      focusMapOn(dLng, dLat);
    }
  };

  // Fetch Mapbox driving directions
  const fetchDirections = async (techCoords, destCoords) => {
    try {
      const start = [techCoords.longitude, techCoords.latitude];
      const end = [destCoords.longitude, destCoords.latitude];

      const res = await fetch(
        `https://api.mapbox.com/directions/v5/mapbox/driving/${start[0]},${start[1]};${end[0]},${end[1]}?geometries=geojson&overview=full&access_token=${MAPBOX_ACCESS_TOKEN}`
      );
      const data = await res.json();
      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        setRouteCoordinates(route.geometry.coordinates);

        const distanceKm = (route.distance / 1000).toFixed(1);
        const durationMin = Math.round(route.duration / 60);
        setRouteStats({
          distance: `${distanceKm} km`,
          duration: `${durationMin} mins`,
        });
      }
    } catch (err) {
      console.warn("Failed to fetch driving directions:", err.message);
    }
  };

  // GPS Location & Route Tracker Effect
  useEffect(() => {
    if (!visible || !complaint) {
      setTechLocation(null);
      setRouteCoordinates(null);
      setLoadingRoute(false);
      return;
    }

    let isMounted = true;
    let locationTimer = null;

    const destCoords = {
      longitude: Number(complaint.longitude) || 120.6955,
      latitude: Number(complaint.latitude) || 15.0298,
    };

    const updatePosition = async (isInitial = false) => {
      try {
        if (isInitial && isMounted) setLoadingRoute(true);

        let current = null;
        try {
          current = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
        } catch (posErr) {
          current = await Location.getLastKnownPositionAsync();
        }

        if (current && isMounted) {
          let coords = current.coords;

          // If emulator coordinates are in a different region (>5 deg), simulate realistic nearby position
          if (
            Math.abs(coords.latitude - destCoords.latitude) > 5 ||
            Math.abs(coords.longitude - destCoords.longitude) > 5
          ) {
            coords = {
              ...coords,
              longitude: destCoords.longitude - 0.012,
              latitude: destCoords.latitude - 0.007,
            };
          }

          setTechLocation(coords);
          await fetchDirections(coords, destCoords);

          if (isInitial && mapReadyRef.current) {
            focusMapOn(coords.longitude, coords.latitude);
          }
        }
      } catch (err) {
        console.warn("Location tracking error:", err);
      } finally {
        if (isInitial && isMounted) setLoadingRoute(false);
      }
    };

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert("GPS Required", "Please enable GPS location permissions to track your dispatch route.");
        if (isMounted) setLoadingRoute(false);
        return;
      }

      await updatePosition(true);

      // Poll technician position updates every 15 seconds
      locationTimer = setInterval(() => {
        updatePosition(false);
      }, 15000);
    })();

    return () => {
      isMounted = false;
      if (locationTimer) clearInterval(locationTimer);
    };
  }, [visible, complaint]);

  if (!visible || !complaint) return null;

  const destLng = Number(complaint.longitude) || 120.6955;
  const destLat = Number(complaint.latitude) || 15.0298;
  const shortTicketId = `AQ-${(complaint.id || '').slice(0, 8).toUpperCase()}`;
  const barangayLabel = complaint.barangay
    ? complaint.barangay.toLowerCase().startsWith('brgy')
      ? complaint.barangay
      : `Brgy. ${complaint.barangay}`
    : 'City of San Fernando';

  const categoryCfg = CATEGORY_MAP[complaint.category] || {
    label: complaint.category || 'Water Incident',
    color: '#0284C7',
    bg: '#EFF6FF',
  };

  const urgencyCfg = URGENCY_MAP[complaint.urgency] || URGENCY_MAP.MEDIUM;

  const handleLaunchExternalGps = () => {
    const lat = destLat;
    const lng = destLng;
    const label = encodeURIComponent(`AquaTrack: ${shortTicketId} (${barangayLabel})`);

    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    const appleMapsUrl = `maps:0,0?q=${label}@${lat},${lng}`;

    const url = Platform.OS === 'ios' ? appleMapsUrl : googleMapsUrl;

    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(url);
        } else {
          return Linking.openURL(googleMapsUrl);
        }
      })
      .catch((err) => {
        console.warn("External GPS open error:", err);
        Alert.alert("Navigation Error", "Could not launch external map app.");
      });
  };

  const handleRecenter = () => {
    if (techLocation) {
      focusMapOn(techLocation.longitude, techLocation.latitude);
    } else {
      focusMapOn(destLng, destLat);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        {/* ── Top Floating Navigation Header ── */}
        <View style={[styles.topHeaderOverlay, { paddingTop: headerTopPadding }]} pointerEvents="box-none">
          <View style={styles.topHeaderCard}>
            <View style={styles.topHeaderLeft}>
              <TouchableOpacity
                onPress={onClose}
                activeOpacity={0.7}
                style={styles.backButton}
              >
                <X size={20} color="#FFFFFF" />
              </TouchableOpacity>

              <View style={styles.headerTitleBlock}>
                <Text style={styles.headerSuperTitle}>Field Route Navigation</Text>
                <Text style={styles.headerMainTitle} numberOfLines={1}>
                  {barangayLabel}
                </Text>
              </View>
            </View>

            <View style={styles.ticketBadge}>
              <Text style={styles.ticketBadgeText}>{shortTicketId}</Text>
            </View>
          </View>
        </View>

        {/* ── Map Content ── */}
        <View style={styles.mapWrapper}>
          {Platform.OS === 'web' ? (
            <View style={styles.webContainer}>
              <Navigation size={42} color="#00AEEF" />
              <Text style={styles.webTitle}>Interactive Route Simulation</Text>
              <Text style={styles.webSubtitle}>
                Route to <Text style={{ color: '#FFFFFF', fontWeight: 'bold' }}>{barangayLabel}</Text> (
                {destLat.toFixed(4)}, {destLng.toFixed(4)}) is active.
              </Text>
            </View>
          ) : (
            <MapboxGL.MapView
              style={styles.map}
              styleURL={MAPBOX_STYLE_URL}
              logoEnabled={false}
              attributionEnabled={false}
              onDidFinishLoadingMap={handleMapLoaded}
            >
              <MapboxGL.Camera
                ref={cameraRef}
                zoomLevel={13.5}
                centerCoordinate={[destLng, destLat]}
                animationMode="flyTo"
                animationDuration={800}
              />

              {/* Technician Marker */}
              {techLocation && (
                <MapboxGL.PointAnnotation
                  id="techMarker"
                  coordinate={[techLocation.longitude, techLocation.latitude]}
                >
                  <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: 'rgba(0, 174, 239, 0.3)', alignItems: 'center', justifyContent: 'center' }}>
                    <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: '#00AEEF', borderWidth: 2, borderColor: '#FFFFFF' }} />
                  </View>
                </MapboxGL.PointAnnotation>
              )}

              {/* Destination Incident Pin */}
              <MapboxGL.PointAnnotation
                id="destMarker"
                coordinate={[destLng, destLat]}
              >
                <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                  <View style={{ backgroundColor: '#0F172A', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6, borderWidth: 1, borderColor: 'rgba(239,68,68,0.4)', marginBottom: 2 }}>
                    <Text style={{ color: '#FFFFFF', fontSize: 9, fontWeight: '800' }}>{barangayLabel}</Text>
                  </View>
                  <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: '#EF4444', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#FFFFFF' }}>
                    <AppIcon name="location" size={16} color="#FFFFFF" />
                  </View>
                </View>
              </MapboxGL.PointAnnotation>

              {/* Route Polyline */}
              {routeCoordinates && (
                <MapboxGL.ShapeSource
                  id="techRouteSource"
                  shape={{
                    type: 'Feature',
                    geometry: {
                      type: 'LineString',
                      coordinates: routeCoordinates,
                    },
                  }}
                >
                  <MapboxGL.LineLayer
                    id="techRouteCoreLayer"
                    style={{
                      lineColor: '#00AEEF',
                      lineWidth: 5,
                      lineOpacity: 0.9,
                      lineCap: 'round',
                      lineJoin: 'round',
                    }}
                  />
                </MapboxGL.ShapeSource>
              )}
            </MapboxGL.MapView>
          )}
        </View>

        {/* ── Floating Action FAB (Recenter) ── */}
        <View style={styles.fabContainer}>
          <TouchableOpacity
            style={styles.fabButton}
            activeOpacity={0.8}
            onPress={handleRecenter}
          >
            <Compass size={20} color="#00AEEF" />
          </TouchableOpacity>
        </View>

        {/* ── Bottom Navigation Info Drawer ── */}
        <View style={[styles.bottomPanelContainer, { paddingBottom: bottomPadding }]}>
          <View style={styles.dragHandle} />

          {/* Quick Metrics Bar: ETA + Distance */}
          <View style={styles.statsStrip}>
            <View style={styles.statBox}>
              <View style={styles.statIconWrapper}>
                <Clock size={18} color="#00AEEF" />
              </View>
              <View>
                <Text style={styles.statLabel}>Est. Travel Time</Text>
                <Text style={styles.statValue}>
                  {loadingRoute ? 'Calculating…' : routeStats.duration}
                </Text>
              </View>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statBox}>
              <View style={[styles.statIconWrapper, { backgroundColor: 'rgba(16, 185, 129, 0.12)' }]}>
                <Navigation size={18} color="#10B981" />
              </View>
              <View>
                <Text style={styles.statLabel}>Distance</Text>
                <Text style={styles.statValue}>
                  {loadingRoute ? 'Measuring…' : routeStats.distance}
                </Text>
              </View>
            </View>
          </View>

          {/* Incident Details Capsule */}
          <View style={styles.incidentInfoCard}>
            <View style={styles.incidentHeaderRow}>
              <View style={styles.categoryBadge}>
                <Droplets size={12} color={categoryCfg.color} />
                <Text style={[styles.categoryText, { color: categoryCfg.color }]}>
                  {categoryCfg.label}
                </Text>
              </View>

              <View
                style={[
                  styles.urgencyBadge,
                  { backgroundColor: urgencyCfg.bg, borderColor: urgencyCfg.border, borderWidth: 1 },
                ]}
              >
                <Text style={[styles.urgencyText, { color: urgencyCfg.text }]}>
                  {complaint.urgency || 'MEDIUM'}
                </Text>
              </View>
            </View>

            <View style={styles.incidentLocationRow}>
              <MapPin size={14} color="#001E66" />
              <Text style={styles.incidentLocationText} numberOfLines={1}>
                {barangayLabel}
              </Text>
            </View>

            <Text style={styles.incidentSummaryText} numberOfLines={2}>
              {complaint.summary ||
                complaint.translatedText ||
                complaint.rawText ||
                'Water infrastructure issue reported by resident.'}
            </Text>
          </View>

          {/* Action Buttons: Open in Google Maps + Scan QR */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.navAppButton}
              activeOpacity={0.85}
              onPress={handleLaunchExternalGps}
            >
              <ExternalLink size={16} color="#FFFFFF" />
              <Text style={styles.navAppButtonText}>Turn-by-Turn GPS</Text>
            </TouchableOpacity>

            {onOpenScanner && (
              <TouchableOpacity
                style={styles.scanButton}
                activeOpacity={0.85}
                onPress={() => {
                  onClose();
                  onOpenScanner();
                }}
              >
                <QrCode size={16} color="#FFFFFF" />
                <Text style={styles.scanButtonText}>Scan QR</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}
