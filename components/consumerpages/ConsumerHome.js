import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity,  Alert, Modal, Animated } from 'react-native';
import { Image } from 'expo-image';
import { supabase } from '../../src/config/supabase';
import { api } from '../../src/config/api';
import * as Location from 'expo-location';
import AppIcon from '../../components/AppIcon';
import { LinearGradient } from 'expo-linear-gradient';
import styles from './ConsumerHome.styles';
import { theme } from '../../src/config/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '../../src/store/useAuthStore';
import { useNotificationStore } from '../../src/store/useNotificationStore';
import ConsumerNotificationModal from './ConsumerNotificationModal';

const statusConfigs = {
  PENDING: { label: "Pending Review", text: "#b45309", bg: "#fef3c7", dot: "#f59e0b" },
  EVALUATING: { label: "Evaluating", text: "#1d4ed8", bg: "#eff6ff", dot: "#3b82f6" },
  DISPATCHED: { label: "Crew Dispatched", text: "#c2410c", bg: "#fff7ed", dot: "#f97316" },
  ONGOING: { label: "Ongoing Repair", text: "#4338ca", bg: "#eef2ff", dot: "#6366f1" },
  RESOLVED: { label: "Resolved", text: "#047857", bg: "#ecfdf5", dot: "#10b981" },
};

const categoryIconConfigs = {
  WATER_QUALITY: { name: 'flask', color: '#0284c7', bg: '#e0f2fe' },
  LEAKAGE: { name: 'water', color: '#0ea5e9', bg: '#e0f2fe' },
  PIPE_BURST: { name: 'build', color: '#ef4444', bg: '#fee2e2' },
  LOW_PRESSURE: { name: 'speedometer', color: '#f59e0b', bg: '#fef3c7' },
  NO_WATER: { name: 'close-circle', color: '#dc2626', bg: '#fee2e2' },
  BILLING_ISSUE: { name: 'cash', color: '#10b981', bg: '#d1fae5' },
  default: { name: 'document-text', color: '#64748b', bg: '#f1f5f9' }
};

const statusIconConfigs = {
  PENDING: { name: 'time-outline' },
  EVALUATING: { name: 'search-outline' },
  DISPATCHED: { name: 'paper-plane-outline' },
  ONGOING: { name: 'build-outline' },
  RESOLVED: { name: 'checkmark-circle-outline' },
};

const formatCategory = (cat) => {
  if (!cat) return 'Unclassified';
  return cat
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
};

const calculateWQI = (reading) => {
  if (!reading) return null; // No reading available — let the caller handle No Data state
  let score = 0;
  
  // pH (Max 30)
  const ph = reading.ph;
  if (ph >= 7.2 && ph <= 7.8) score += 30;
  else if (ph >= 6.5 && ph <= 8.5) score += 20;
  else score += 5;

  // Turbidity (Max 25)
  const turb = reading.turbidity;
  if (turb < 1.0) score += 25;
  else if (turb <= 3.0) score += 20;
  else if (turb <= 5.0) score += 12;
  else score += 2;

  // TDS (Max 25)
  const tds = reading.tds;
  if (tds < 150) score += 25;
  else if (tds <= 300) score += 20;
  else if (tds <= 500) score += 12;
  else score += 2;

  // Pressure (Max 20)
  const press = reading.pressure;
  if (press > 25) score += 20;
  else if (press >= 15) score += 15;
  else if (press >= 10) score += 8;
  else score += 2;

  return Math.round(score);
};

const WEAK_PRESSURE_PSI = 10;
const NEIGHBORHOOD_ALERT_THRESHOLD = 3;
const NEIGHBORHOOD_FALLBACK_RADIUS_METERS = 2000;
const BARANGAY_KEYS = ['dolores', 'pilar', 'calulut', 'sindalan', 'agustin'];

const getBarangayKey = (nameOrAddress) => {
  const lower = (nameOrAddress || '').toLowerCase();
  for (const key of BARANGAY_KEYS) {
    if (lower.includes(key)) return key;
  }
  return lower.split(' ')[0] || '';
};

const BARANGAY_LABELS = {
  dolores: 'Dolores',
  pilar: 'Del Pilar',
  calulut: 'Calulut',
  sindalan: 'Sindalan',
  agustin: 'San Agustin',
};

const getBarangayLabel = (nameOrAddress) => {
  const key = getBarangayKey(nameOrAddress);
  if (!key) return '';
  return BARANGAY_LABELS[key] || (key.charAt(0).toUpperCase() + key.slice(1));
};

const haversineDistanceMeters = (lat1, lon1, lat2, lon2) => {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
};

const isWeakPressure = (node, latestByNode) => {
  const reading = latestByNode[node.id];
  return !!reading && reading.pressure < WEAK_PRESSURE_PSI;
};

const buildNeighborhoodAlert = ({ nodes, latestByNode, chosenNodeId, complaints }) => {
  if (!nodes || !nodes.length || !chosenNodeId) return null;

  const chosenNode = nodes.find((n) => n.id === chosenNodeId);
  if (!chosenNode) return null;

  const barangayKey = getBarangayKey(chosenNode.name);

  const barangayNodes = nodes.filter((n) => getBarangayKey(n.name) === barangayKey);

  let nearbyNodes = [...barangayNodes];

  if (nearbyNodes.length < NEIGHBORHOOD_ALERT_THRESHOLD) {
    const others = nodes
      .filter((n) => !nearbyNodes.includes(n))
      .map((n) => ({
        node: n,
        distance: haversineDistanceMeters(chosenNode.latitude, chosenNode.longitude, n.latitude, n.longitude),
      }))
      .sort((a, b) => a.distance - b.distance);

    for (const { node, distance } of others) {
      if (distance > NEIGHBORHOOD_FALLBACK_RADIUS_METERS) break;
      nearbyNodes.push(node);
    }
  }

  const weakPressureCount = nearbyNodes.filter((n) => isWeakPressure(n, latestByNode)).length;
  const barangayWeakCount = barangayNodes.filter((n) => isWeakPressure(n, latestByNode)).length;
  const allBarangayAffected = barangayNodes.length >= 2 && barangayWeakCount === barangayNodes.length;
  const nodeAlert = weakPressureCount >= NEIGHBORHOOD_ALERT_THRESHOLD || allBarangayAffected ? weakPressureCount : 0;

  const nearbyComplaints = (complaints || []).filter((c) => {
    const barangay = (c.barangay || '').toLowerCase();
    return barangay.includes(barangayKey) || barangayKey.includes(barangay);
  });

  const categoryCounts = {};
  nearbyComplaints.forEach((c) => {
    if (c.category) categoryCounts[c.category] = (categoryCounts[c.category] || 0) + 1;
  });

  let topCategory = null;
  let topCategoryCount = 0;
  Object.entries(categoryCounts).forEach(([category, count]) => {
    if (count > topCategoryCount) {
      topCategoryCount = count;
      topCategory = category;
    }
  });
  const complaintAlert = topCategoryCount >= NEIGHBORHOOD_ALERT_THRESHOLD ? { category: topCategory, count: topCategoryCount } : null;

  if (nodeAlert && complaintAlert) {
    return { kind: 'combined', nodeCount: nodeAlert, complaintCount: complaintAlert.count, category: complaintAlert.category };
  }
  if (nodeAlert) {
    return { kind: 'pressure', nodeCount: nodeAlert, complaintCount: 0 };
  }
  if (complaintAlert) {
    return { kind: 'complaints', nodeCount: 0, complaintCount: complaintAlert.count, category: complaintAlert.category };
  }
  return null;
};

const NEIGHBORHOOD_COPY = {
  PIPELINE_BREACH_PRESSURE_DROP: { title: 'Several Neighbors Reported Low Water Pressure', text: 'residents in your area reported low or no water pressure. Crews may already be on-site.' },
  HIGH_TURBIDITY: { title: 'Several Neighbors Reported Murky Water', text: 'residents in your area reported murky or dirty water.' },
  HIGH_MINERAL_CONTENT_TDS: { title: 'Several Neighbors Reported Unusual Water Taste', text: 'residents in your area reported an unusual taste or high mineral content.' },
  CHEMICAL_DISCOLORATION_CONTAMINATION: { title: 'Several Neighbors Reported Discolored Water', text: 'residents in your area reported discolored or strong-smelling water.' },
  UNCLASSIFIED_INFRASTRUCTURE_ANOMALY: { title: 'Water Issue Reported Across Your Area', text: 'residents in your area reported a water issue. Crews may already be on-site.' },
};

const buildNeighborhoodCopy = (alert) => {
  if (!alert) return null;
  if (alert.kind === 'pressure' || alert.kind === 'combined') {
    const neighborsNote = alert.complaintCount > 0
      ? ` ${alert.complaintCount} neighbors also reported it.`
      : ' Crews may already be on-site.';
    return {
      title: 'Low or No Water Pressure in Your Area',
      text: `${alert.nodeCount} nearby monitoring stations report low to no water pressure.${neighborsNote}`,
    };
  }
  const copy = NEIGHBORHOOD_COPY[alert.category] || NEIGHBORHOOD_COPY.UNCLASSIFIED_INFRASTRUCTURE_ANOMALY;
  return {
    title: copy.title,
    text: `${alert.complaintCount} ${copy.text}`,
  };
};

export default function ConsumerHome({ navigation }) {
  const [userName, setUserName] = useState('Pedro'); // Default fallback to "Pedro" per spec
  const [userLocation, setUserLocation] = useState('City of San Fernando • Dolores');
  const [gpsLocation, setGpsLocation] = useState(null);
  const [advisories, setAdvisories] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [recentComplaints, setRecentComplaints] = useState([]);
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [notificationsModalVisible, setNotificationsModalVisible] = useState(false);
  const { notifications, unreadCount, fetchNotifications, markAllAsRead, dismissNotification } = useNotificationStore();
  const [dismissedAlerts, setDismissedAlerts] = useState([]);
  const [neighborhoodAlert, setNeighborhoodAlert] = useState(null);
  const [metrics, setMetrics] = useState({ total: 25, pending: 9, active: 8, resolved: 8 });
  const [waterIndexData, setWaterIndexData] = useState({
    nodeName: 'DETECTING NEAREST NODE...',
    wqi: null,
    statusText: 'LOADING',
    description: 'Fetching nearest sensor data for your location…',
    statusColor: '#94A3B8',
    statusBg: 'rgba(148, 163, 184, 0.08)'
  });

  const profileSlideAnim = useRef(new Animated.Value(280)).current;
  const profileFadeAnim = useRef(new Animated.Value(0)).current;
  const alertPulseAnim = useRef(new Animated.Value(1)).current;
  const dotPulseAnim = useRef(new Animated.Value(0.3)).current;
  const wqiPulseAnim = useRef(new Animated.Value(1)).current;
  const wqiGlowAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(alertPulseAnim, {
          toValue: 1.015,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(alertPulseAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    );

    const dotLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(dotPulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(dotPulseAnim, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );

    const wqiPulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(wqiPulseAnim, {
          toValue: 1.04,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(wqiPulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );

    const wqiGlowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(wqiGlowAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(wqiGlowAnim, {
          toValue: 0.4,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );

    pulseLoop.start();
    dotLoop.start();
    wqiPulseLoop.start();
    wqiGlowLoop.start();

    return () => {
      pulseLoop.stop();
      dotLoop.stop();
      wqiPulseLoop.stop();
      wqiGlowLoop.stop();
    };
  }, []);

  useEffect(() => {
    if (profileModalVisible) {
      profileSlideAnim.setValue(280);
      profileFadeAnim.setValue(0);
      Animated.parallel([
        Animated.spring(profileSlideAnim, {
          toValue: 0,
          tension: 65,
          friction: 9,
          useNativeDriver: true,
        }),
        Animated.timing(profileFadeAnim, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [profileModalVisible]);

  useEffect(() => {
    const loadDismissed = async () => {
      try {
        const saved = await AsyncStorage.getItem('dismissed_alerts');
        if (saved) {
          setDismissedAlerts(JSON.parse(saved));
        }
      } catch (err) {
        console.error("Failed to load dismissed alerts:", err);
      }
    };
    loadDismissed();
  }, []);

  // GPS-based location detection (non-blocking: any failure keeps the existing fallback)
  useEffect(() => {
    let cancelled = false;
    const detectFromGps = async () => {
      try {
        const { status } = await Location.getForegroundPermissionsAsync();
        if (status !== 'granted') {
          const ask = await Location.requestForegroundPermissionsAsync();
          if (ask.status !== 'granted') return;
        }
        let current = null;
        try {
          current = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        } catch (err) {
          const last = await Location.getLastKnownPositionAsync();
          if (last) current = last;
        }
        if (!current || cancelled) return;
        const locData = await api.post('/api/locate-barangay', {
          latitude: current.coords.latitude,
          longitude: current.coords.longitude,
        });
        if (!cancelled && locData && locData.barangay && locData.barangay !== 'Unknown Area') {
          setGpsLocation(`City of San Fernando • ${locData.barangay}`);
        }
      } catch (err) {
        console.warn('GPS location detection unavailable:', err?.message);
      }
    };
    detectFromGps();
    return () => {
      cancelled = true;
    };
  }, []);

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

  useEffect(() => {
    let debounceTimer = null;

    const fetchProfileAndAdvisories = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        // Fetch profile and all dependent dashboard data in parallel to eliminate sequential latency
        const [
          profile,
          { data: userComplaints, error: compError },
          { data: nodes },
          { data: readings },
          { data: neighborhoodComplaints },
          advisoriesData
        ] = await Promise.all([
          api.post('/api/auth/profile', { userId: session.user.id }),
          supabase
            .from('Complaint')
            .select('id, status, createdAt, summary, category, rawText')
            .eq('userId', session.user.id)
            .order('createdAt', { ascending: false }),
          supabase
            .from('TelemetryNode')
            .select('id, name, status, latitude, longitude')
            .order('name', { ascending: true }),
          supabase
            .from('TelemetryReading')
            .select('id, nodeId, ph, turbidity, tds, pressure, timestamp')
            .order('timestamp', { ascending: false })
            .limit(30),
          supabase
            .from('Complaint')
            .select('id, category, barangay, status')
            .neq('status', 'RESOLVED')
            .limit(100),
          api.get('/api/advisories')
        ]);

        if (profile?.name) {
          setUserName(profile.name);
        }

        if (!compError && userComplaints) {
          const total = userComplaints.length;
          const pending = userComplaints.filter(c => c.status === 'PENDING').length;
          const active = userComplaints.filter(c => c.status === 'EVALUATING' || c.status === 'DISPATCHED' || c.status === 'ONGOING').length;
          const resolved = userComplaints.filter(c => c.status === 'RESOLVED').length;
          
          setMetrics({ total, pending, active, resolved });
          setRecentComplaints(userComplaints.slice(0, 3));
        }

        // Calculate dynamic Water Health Index
        try {
          const latestByNode = {};
          (readings || []).forEach((r) => {
            if (!latestByNode[r.nodeId]) latestByNode[r.nodeId] = r;
          });

          if (nodes && nodes.length > 0) {
            const userBarangay = profile?.address || '';
            
            let chosenNode = nodes[0];
            for (const node of nodes) {
              const nodeNameFirstWord = node.name.split(' ')[0].toLowerCase();
              if (userBarangay.toLowerCase().includes(nodeNameFirstWord)) {
                chosenNode = node;
                break;
              }
            }

            const latestReading = readings?.find(r => r.nodeId === chosenNode.id) || null;
            const computedWqi = calculateWQI(latestReading);

            const addressLabel = getBarangayLabel(profile?.address);
            const nodeLabel = getBarangayLabel(chosenNode.name);
            const locationLabel = addressLabel || nodeLabel;
            if (locationLabel) {
              setUserLocation(`City of San Fernando • ${locationLabel}`);
            }

            setNeighborhoodAlert(buildNeighborhoodAlert({
              nodes,
              latestByNode,
              chosenNodeId: chosenNode.id,
              complaints: neighborhoodComplaints || [],
            }));
            
            let statusText = 'NO DATA';
            let description = 'No sensor readings available for the nearest node yet.';
            let statusColor = '#94A3B8'; // Slate grey
            let statusBg = 'rgba(148, 163, 184, 0.08)';

            if (computedWqi === null) {
              // No reading for this node — keep No Data defaults
            } else if (computedWqi >= 85) {
              statusText = 'OPTIMAL STATE';
              description = 'Excellent water quality and pressure. Highly safe for drinking and all general household uses.';
              statusColor = '#10B981'; // Emerald
              statusBg = '#ECFDF5';
            } else if (computedWqi >= 70) {
              statusText = 'STABLE STATE';
              description = 'Satisfactory pressure and quality. Safe for daily household tasks and normal usage.';
              statusColor = '#007AFF'; // Blue
              statusBg = 'rgba(0, 122, 255, 0.08)';
            } else if (computedWqi >= 50) {
              statusText = 'MODERATE ANOMALY';
              description = 'Mild pressure drop or mineral increase detected. Safe for utility tasks; avoid direct consumption.';
              statusColor = '#F59E0B'; // Amber
              statusBg = '#FEF3C7';
            } else {
              statusText = 'CRITICAL STATE';
              description = 'High turbidity or severe pressure loss. Maintenance crews dispatched. Avoid usage for drinking/cooking.';
              statusColor = '#EF4444'; // Red
              statusBg = '#FEF2F2';
            }

            setWaterIndexData({
              nodeName: chosenNode.name.toUpperCase(),
              wqi: computedWqi,
              statusText,
              description,
              statusColor,
              statusBg
            });
          }
        } catch (telemetryErr) {
          console.warn("Failed to load dynamic water health index:", telemetryErr);
        }

        // Process Advisories
        if (advisoriesData?.success && advisoriesData.advisories) {
          const publicAdvisories = advisoriesData.advisories.filter(
            (ad) => ad.targetRole === 'broadcast' || ad.targetRole === 'consumers' || !ad.targetRole
          );
          setAdvisories(publicAdvisories);

          const criticalAlerts = publicAdvisories.filter(ad => ad.type === 'warning');
          setAlerts(criticalAlerts);
        }

        // Fetch global notifications store
        fetchNotifications();
      } catch (err) {
        console.error("Failed to load home content:", err);
      }
    };

    const debouncedFetch = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        fetchProfileAndAdvisories();
      }, 300);
    };
    
    fetchProfileAndAdvisories();
    
    // Refresh data when screen receives focus
    const unsubscribeFocus = navigation.addListener('focus', () => {
      fetchProfileAndAdvisories();
    });

    let channel;
    const setupRealtime = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        channel = supabase.channel(`home-realtime-${session.user.id}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'Complaint',
              filter: `userId=eq.${session.user.id}`
            },
            () => {
              debouncedFetch();
            }
          )
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'Advisory'
            },
            () => {
              debouncedFetch();
            }
          )
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'TelemetryReading'
            },
            () => {
              debouncedFetch();
            }
          )
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'Complaint'
            },
            () => {
              debouncedFetch();
            }
          );

        channel.subscribe();
      }
    };

    setupRealtime();
    
    return () => {
      unsubscribeFocus();
      if (debounceTimer) clearTimeout(debounceTimer);
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [navigation]);

  const renderStepper = (currentStatus) => {
    const steps = [
      { key: 'SUBMITTED', label: 'Reported', active: true },
      { key: 'EVALUATING', label: 'Evaluating', active: ['EVALUATING', 'DISPATCHED', 'ONGOING', 'RESOLVED'].includes(currentStatus) },
      { key: 'IN_PROGRESS', label: 'In Progress', active: ['DISPATCHED', 'ONGOING', 'RESOLVED'].includes(currentStatus) },
      { key: 'RESOLVED', label: 'Resolved', active: currentStatus === 'RESOLVED' }
    ];

    return (
      <View style={styles.stepperContainer}>
        {steps.map((step, idx) => (
          <React.Fragment key={step.key}>
            <View style={styles.stepWrapper}>
              <View style={[
                styles.stepDot,
                step.active ? styles.stepDotActive : styles.stepDotInactive
              ]}>
                {step.key === 'RESOLVED' && currentStatus === 'RESOLVED' ? (
                  <AppIcon name="checkmark" size={8} color="#fff" />
                ) : step.active ? (
                  <View style={styles.stepDotInner} />
                ) : null}
              </View>
              <Text style={[
                styles.stepLabel,
                step.active ? styles.stepLabelActive : styles.stepLabelInactive
              ]}>
                {step.label}
              </Text>
            </View>
            {idx < steps.length - 1 && (
              <View style={[
                styles.stepLine,
                steps[idx + 1].active ? styles.stepLineActive : steps[idx + 1].active ? styles.stepLineActive : styles.stepLineInactive
              ]} />
            )}
          </React.Fragment>
        ))}
      </View>
    );
  };

  const handleProfilePress = () => {
    setProfileModalVisible(true);
  };

  const handleLogout = async () => {
    try {
      await useAuthStore.getState().signOut();
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } catch (err) {
      Alert.alert("Logout Error", err.message);
    }
  };

  const handleDismissAlert = async (id) => {
    try {
      const updated = [...dismissedAlerts, id];
      setDismissedAlerts(updated);
      await AsyncStorage.setItem('dismissed_alerts', JSON.stringify(updated));
    } catch (err) {
      console.error("Failed to save dismissed alert:", err);
    }
  };

  const activeAlerts = alerts.filter(ad => !dismissedAlerts.includes(ad.id));
  const activeNeighborhoodAlert = neighborhoodAlert && !dismissedAlerts.includes('neighborhood-alert') ? neighborhoodAlert : null;
  const neighborhoodCopy = buildNeighborhoodCopy(activeNeighborhoodAlert);
return (
    <View style={styles.container}>
      {/* Top 30% Blue Gradient Header Card Component */}
      <LinearGradient 
        colors={['#0C4F8B', '#008CE3']} 
        start={{ x: 0, y: 0 }} 
        end={{ x: 0, y: 1 }} 
        style={styles.headerCard}
      >
        {/* Water Ripple Micro-Decorations */}
        <View style={styles.decorCircle1} />
        <View style={styles.decorCircle2} />

        {/* Brand Row */}
        <View style={styles.brandRow}>
          {/* Upper Left: Light Blue Water Droplet + Custom Colored AQUATRACK Logo */}
          <View style={[styles.logoContainer, { gap: 0 }]}>
            <Image
              source={require('../../assets/MOB-LOGO.png')}
              style={{ width: 44, height: 44, resizeMode: 'contain' }}
            />
            <Text style={styles.brandTitleText}>
              <Text style={{ color: '#FFFFFF' }}>AQ</Text>
              <Text style={{ color: '#ffd800' }}>U</Text>
              <Text style={{ color: '#EF4444' }}>A</Text>
              <Text style={{ color: '#FFFFFF' }}>TRACK</Text>
            </Text>
          </View>

          {/* Right: Notification & Consumer Profile Section */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            {/* Notification Bell */}
            <TouchableOpacity 
              activeOpacity={0.7} 
              onPress={handleOpenNotifications}
              style={styles.notificationBell}
            >
              <AppIcon name="notifications-outline" size={18} color="#ffffff" />
              {unreadCount > 0 && <View style={styles.notificationBadge} />}
            </TouchableOpacity>

            {/* Consumer Profile Pill */}
            <TouchableOpacity 
              style={styles.profilePill}
              onPress={handleProfilePress}
              activeOpacity={0.8}
            >
              <Text style={styles.profileName} numberOfLines={1}>{userName}</Text>
              <View style={styles.avatarContainer}>
                <AppIcon name="person" size={14} color="#ffffff" />
                <View style={styles.activeDot} />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Greeting & Location Row */}
        <View style={styles.greetingContainer}>
          <Text style={styles.greetingText}>Hello, {userName}</Text>
          <View style={styles.locationPill}>
            <Text style={[styles.locationText, { marginLeft: 0 }]}>{gpsLocation || userLocation}</Text>
          </View>
        </View>

        {/* The Logs / Metrics Counter Banner */}
        <View style={styles.metricsBanner}>
          <View style={styles.metricColumn}>
            <Text style={styles.metricLabel}>TOTAL LOGS</Text>
            <Text style={styles.metricNumber}>{metrics.total}</Text>
          </View>
          <View style={styles.divider} />
          
          <View style={styles.metricColumn}>
            <Text style={[styles.metricLabel, { color: '#E0F2FE' }]}>PENDING</Text>
            <Text style={[styles.metricNumber, { color: '#FFFFFF' }]}>{metrics.pending}</Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.metricColumn}>
            <Text style={[styles.metricLabel, { color: '#E0F2FE' }]}>ACTIVE</Text>
            <Text style={[styles.metricNumber, { color: '#FFFFFF' }]}>{metrics.active}</Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.metricColumn}>
            <Text style={[styles.metricLabel, { color: '#E0F2FE' }]}>RESOLVED</Text>
            <Text style={[styles.metricNumber, { color: '#FFFFFF' }]}>{metrics.resolved}</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Soft Smooth 2-Curve Water / Wave Swirl Divider Junction (Overlays & Masks Scrolling Content Exactly Along Waves) */}
      <View style={styles.swirlWrapper} pointerEvents="none">
        {/* Solid Blue Extension Mask Fill */}
        <View style={styles.swirlBlueMaskFill} />

        {/* Curve 1: Minimal Upper Ocean Cyan Swirl */}
        <View style={styles.smoothWaveCurve1} />

        {/* Curve 2: Minimal Mid Azure Fluid Water Swirl */}
        <View style={styles.smoothWaveCurve2} />

        {/* Soft Water Swirl Graphic Overlays */}
        <Image 
          source={require('../../assets/swirl_accent.png')}
          style={styles.swirlAccentImage}
          resizeMode="stretch"
        />
        
      </View>

      {/* Main Scroll Content */}
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Neighborhood Awareness Banner (3+ nearby nodes with zero pressure / clustered complaints) */}
        {activeNeighborhoodAlert && neighborhoodCopy && (
          <Animated.View style={{ transform: [{ scale: alertPulseAnim }] }}>
            <TouchableOpacity
              onPress={() => {
                handleDismissAlert('neighborhood-alert');
                navigation.navigate('Announcements');
              }}
              activeOpacity={0.9}
              style={{
                backgroundColor: '#FFF5F5',
                borderWidth: 1.5,
                borderColor: '#FEC2C2',
                borderRadius: 18,
                padding: 16,
                marginBottom: 16,
                flexDirection: 'row',
                alignItems: 'start',
                shadowColor: '#EF4444',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.12,
                shadowRadius: 8,
                elevation: 3,
              }}
            >
              <View className="bg-red-100 p-2 rounded-xl mr-3 items-center justify-center">
                <AppIcon name="warning" size={18} color="#EF4444" />
              </View>

              <View className="flex-1">
                <View className="flex-row items-center justify-between">
                  <Text className="text-[#EF4444] font-black text-[10px] uppercase tracking-widest">NEIGHBORHOOD AWARENESS ALARM</Text>
                  <Animated.View 
                    style={{ 
                      width: 8, 
                      height: 8, 
                      borderRadius: 4, 
                      backgroundColor: '#EF4444',
                      opacity: dotPulseAnim,
                      transform: [{ scale: dotPulseAnim }] 
                    }} 
                  />
                </View>
                <Text className="text-[#0B2240] font-black text-sm mt-1.5 leading-snug">{neighborhoodCopy.title}</Text>
                <Text className="text-[#627D98] font-semibold text-xs mt-0.5 leading-relaxed">{neighborhoodCopy.text}</Text>
              </View>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Critical System Alert Banner (conditional based on warnings) */}
        {activeAlerts.length > 0 && (
          <TouchableOpacity 
            onPress={() => {
              const targetAlertId = activeAlerts[0].id;
              handleDismissAlert(targetAlertId);
              navigation.navigate('Announcements', { highlightAdvisoryId: targetAlertId });
            }}
            activeOpacity={0.9}
            style={{
              backgroundColor: '#FFF5F5',
              borderWidth: 1.5,
              borderColor: '#FEC2C2',
              borderRadius: 18,
              padding: 16,
              marginBottom: 16,
              flexDirection: 'row',
              alignItems: 'start',
              shadowColor: '#EF4444',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
              elevation: 2,
            }}
          >
            {/* Left: Warning Icon Container */}
            <View className="bg-red-100 p-2 rounded-xl mr-3 items-center justify-center">
              <AppIcon name="warning" size={18} color="#EF4444" />
            </View>

            {/* Right: Alert text details */}
            <View className="flex-1">
              <View className="flex-row items-center justify-between">
                <Text className="text-[#EF4444] font-black text-[10px] uppercase tracking-widest">CRITICAL SYSTEM ALARM</Text>
                <View className="w-1.5 h-1.5 rounded-full bg-[#EF4444]" />
              </View>
              <Text className="text-[#0B2240] font-black text-sm mt-1.5 leading-snug">{activeAlerts[0].title}</Text>
              <Text className="text-[#627D98] font-semibold text-xs mt-0.5 leading-relaxed">{activeAlerts[0].text}</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Latest Ticket Tracker Card */}
        {recentComplaints.length > 0 && (
          <View style={{ marginBottom: 20 }}>
            <Text style={styles.sectionHeader}>LATEST TICKET TRACKER</Text>
            <TouchableOpacity 
              style={styles.trackerCard}
              onPress={() => navigation.navigate('TrackComplaints')}
              activeOpacity={0.9}
            >
              <Text style={styles.trackerTitle} numberOfLines={1}>
                {recentComplaints[0].summary || recentComplaints[0].category?.replace(/_/g, ' ') || 'Utility Issue'}
              </Text>
              <View style={{ marginTop: 12 }}>
                {renderStepper(recentComplaints[0].status)}
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* B. Quick Services Grid */}
        <Text style={styles.sectionHeader}>QUICK SERVICES</Text>
        <View style={styles.gridContainer}>
          <View style={styles.gridRow}>
            {/* Card 1: File Report */}
            <TouchableOpacity 
              style={styles.gridCard}
              onPress={() => navigation.navigate('FileComplaint')}
              activeOpacity={0.85}
            >
              <View style={styles.cardHeaderRow}>
                <View style={[styles.iconWrapper, { backgroundColor: 'rgba(0, 122, 255, 0.1)' }]}>
                  <AppIcon name="document-text" size={20} color="#007AFF" />
                </View>
                <AppIcon name="chevron-forward" size={16} color="#C7C7CC" />
              </View>
              <View>
                <Text style={styles.cardTitle}>File Report</Text>
                <Text style={styles.cardDesc}>Submit live water quality or pressure issues</Text>
              </View>
            </TouchableOpacity>

            {/* Card 2: Track Tickets */}
            <TouchableOpacity 
              style={styles.gridCard}
              onPress={() => navigation.navigate('TrackComplaints')}
              activeOpacity={0.85}
            >
              <View style={styles.cardHeaderRow}>
                <View style={[styles.iconWrapper, { backgroundColor: 'rgba(255, 149, 0, 0.1)' }]}>
                  <AppIcon name="ticket" size={20} color="#FF9500" />
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  {/* Floating badge */}
                  <View style={styles.badgeContainer}>
                    <Text style={styles.badgeText}>{metrics.total || 17}</Text>
                  </View>
                  <AppIcon name="chevron-forward" size={16} color="#C7C7CC" />
                </View>
              </View>
              <View>
                <Text style={styles.cardTitle}>Track Tickets</Text>
                <Text style={styles.cardDesc}>Monitor your filed reports & live technician progress</Text>
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.gridRow}>
            {/* Card 3: Advisories */}
            <TouchableOpacity 
              style={styles.gridCard}
              onPress={() => navigation.navigate('Announcements')}
              activeOpacity={0.85}
            >
              <View style={styles.cardHeaderRow}>
                <View style={[styles.iconWrapper, { backgroundColor: 'rgba(52, 199, 89, 0.1)' }]}>
                  <AppIcon name="megaphone" size={20} color="#34C759" />
                </View>
                <AppIcon name="chevron-forward" size={16} color="#C7C7CC" />
              </View>
              <View>
                <Text style={styles.cardTitle}>Advisories</Text>
                <Text style={styles.cardDesc}>Official water service advisories & updates</Text>
              </View>
            </TouchableOpacity>

            {/* Card 4: Support */}
            <TouchableOpacity 
              style={styles.gridCard}
              onPress={() => navigation.navigate('ContactSupport')}
              activeOpacity={0.85}
            >
              <View style={styles.cardHeaderRow}>
                <View style={[styles.iconWrapper, { backgroundColor: 'rgba(88, 86, 214, 0.1)' }]}>
                  <AppIcon name="headset" size={20} color="#5856D6" />
                </View>
                <AppIcon name="chevron-forward" size={16} color="#C7C7CC" />
              </View>
              <View>
                <Text style={styles.cardTitle}>Support</Text>
                <Text style={styles.cardDesc}>Direct customer support line open 24/7</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* C. Water Health Consumer Index Card */}
        <View className="bg-white border border-[#E2E8F5] rounded-3xl p-5 mb-6 shadow-sm mx-4">
          {/* Card Header */}
          <View className="flex-row items-center justify-between border-b border-[#F2F5FA] pb-3.5 mb-4">
            <View className="flex-row items-center">
              <AppIcon name="shield-checkmark" size={18} color="#007AFF" style={{ marginRight: 6 }} />
              <Text className="text-[#0B2240] font-black text-[10px] tracking-wider uppercase">
                Water Health Index
              </Text>
            </View>
            <View className="flex-row items-center bg-[#ECFDF5] px-2.5 py-1 rounded-full border border-[#10B981]/15">
              <Animated.View 
                style={{ 
                  opacity: wqiGlowAnim,
                  transform: [{ scale: wqiGlowAnim }] 
                }} 
                className="w-1.5 h-1.5 rounded-full bg-[#10B981] mr-1.5" 
              />
              <Text className="text-[#10B981] font-black text-[8px] tracking-wider uppercase font-mono">
                {waterIndexData.nodeName}
              </Text>
            </View>
          </View>

          {/* Card Inner Panel */}
          <View className="flex-row items-center gap-5">
            {/* Left: Circular progress ring graphic with gentle pulsing effect */}
            <Animated.View 
              style={{ 
                borderColor: waterIndexData.statusColor,
                transform: [{ scale: wqiPulseAnim }],
                shadowColor: waterIndexData.statusColor,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.2,
                shadowRadius: 6,
                elevation: 2,
              }}
              className="w-16 h-16 rounded-full border-4 items-center justify-center bg-[#F8FAFC]"
            >
              <Text className="text-[#0B2240] font-black text-xl font-mono">
                {waterIndexData.wqi !== null ? waterIndexData.wqi : '--'}
              </Text>
            </Animated.View>

            {/* Right: Status Pill & Description */}
            <View className="flex-1" style={{ paddingLeft: 8 }}>
              <View 
                style={{ backgroundColor: waterIndexData.statusBg }}
                className="self-start px-3 py-1 rounded-full mb-2"
              >
                <Text 
                  style={{ color: waterIndexData.statusColor }}
                  className="font-black text-[10px] tracking-wider uppercase font-mono"
                >
                  {waterIndexData.statusText}
                </Text>
              </View>
              <Text className="text-[#627D98] text-xs font-semibold leading-relaxed">
                {waterIndexData.description}
              </Text>
            </View>
          </View>
        </View>

        {/* D. Recent Activity Section */}
        <Text style={styles.sectionHeader}>Recent Activity</Text>
        <View style={styles.activityContainer}>
          {recentComplaints.length > 0 ? (
            recentComplaints.map((item) => {
              const statusCfg = statusConfigs[item.status] || { label: item.status, text: '#525f7f', bg: '#f1f5f9', dot: '#525f7f' };
              const catCfg = categoryIconConfigs[item.category] || categoryIconConfigs.default;
              const formattedDate = new Date(item.createdAt).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                timeZone: 'Asia/Manila'
              });
              return (
                <TouchableOpacity 
                  key={item.id}
                  onPress={() => navigation.navigate('TrackComplaints')}
                  activeOpacity={0.8}
                  className="bg-white border border-[#E2E8F5] rounded-2xl p-4 mb-3 shadow-sm active:scale-[0.99]"
                >
                  <View className="flex-row items-center justify-between mb-2.5">
                    <View className="flex-row items-center">
                      <Text className="text-[#0B2240] font-black text-[10px] font-mono tracking-wider mr-2">
                        AQ-{item.id.slice(0, 4).toUpperCase()}
                      </Text>
                      <Text className="text-[#475569] font-extrabold text-[10px] uppercase tracking-wider font-mono">
                        •  {formattedDate}
                      </Text>
                    </View>
                    {/* Status Badge */}
                    <View 
                      style={{ backgroundColor: statusCfg.bg, borderColor: statusCfg.text }}
                      className="flex-row items-center rounded-full py-1 px-2.5 border"
                    >
                      <AppIcon 
                        name={statusIconConfigs[item.status]?.name || 'alert-circle-outline'} 
                        size={11} 
                        color={statusCfg.text} 
                        style={{ marginRight: 4 }}
                      />
                      <Text style={{ color: statusCfg.text }} className="text-[9px] font-black uppercase tracking-wider">{statusCfg.label}</Text>
                    </View>
                  </View>
                  
                  {/* Category Classification */}
                  <Text className="text-[#009FDE] font-extrabold text-[9px] uppercase tracking-wider mb-1">
                    {formatCategory(item.category)}
                  </Text>
                  
                  <Text className="text-[#0B2240] font-black text-sm leading-snug">
                    {item.summary || item.category?.replace(/_/g, ' ') || 'Water Utility Report'}
                  </Text>
                  <Text className="text-[#627D98] font-semibold text-xs mt-1.5 leading-relaxed italic" numberOfLines={2} ellipsizeMode="tail">
                    {item.rawText}
                  </Text>
                </TouchableOpacity>
              );
            })
          ) : (
            <View style={styles.emptyActivityCard}>
              <AppIcon name="clipboard-outline" size={24} color="#8E8E93" style={{ marginBottom: 8 }} />
              <Text style={styles.emptyActivityTitle}>No Recent Reports</Text>
              <Text style={styles.emptyActivityDesc}>Any reports you file will show up here as live status logs.</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Floating Glass Bottom Navigation Bar (No White Background) */}
      <View
        style={{
          position: 'absolute',
          bottom: 14,
          left: 12,
          right: 12,
          backgroundColor: 'transparent',
          paddingVertical: 10,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-around',
          zIndex: 9999,
        }}
      >
        {/* Tab 1: Home (Active Highlight) */}
        <TouchableOpacity style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }} activeOpacity={0.7}>
          <AppIcon name="home" size={22} color="#007AFF" />
          <Text style={{ fontSize: 9, fontFamily: theme.fonts.bold, color: '#007AFF', marginTop: 2 }}>Home</Text>
          <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: '#007AFF', marginTop: 2 }} />
        </TouchableOpacity>

        {/* Tab 2: Docs */}
        <TouchableOpacity style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }} onPress={() => navigation.navigate('FileComplaint')} activeOpacity={0.7}>
          <AppIcon name="document-text-outline" size={22} color="#64748B" />
          <Text style={{ fontSize: 9, fontFamily: theme.fonts.semiBold, color: '#64748B', marginTop: 2 }}>Docs</Text>
        </TouchableOpacity>

        {/* Tab 3: Ticket */}
        <TouchableOpacity style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }} onPress={() => navigation.navigate('TrackComplaints')} activeOpacity={0.7}>
          <AppIcon name="ticket-outline" size={22} color="#64748B" />
          <Text style={{ fontSize: 9, fontFamily: theme.fonts.semiBold, color: '#64748B', marginTop: 2 }}>Ticket</Text>
        </TouchableOpacity>

        {/* Tab 4: Megaphone / Advisories Icon */}
        <TouchableOpacity style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }} onPress={() => navigation.navigate('Announcements')} activeOpacity={0.7}>
          <AppIcon name="megaphone-outline" size={22} color="#64748B" />
          <Text style={{ fontSize: 9, fontFamily: theme.fonts.semiBold, color: '#64748B', marginTop: 2 }}>Advisories</Text>
        </TouchableOpacity>

        {/* Tab 5: Settings Icon */}
        <TouchableOpacity style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }} onPress={handleProfilePress} activeOpacity={0.7}>
          <AppIcon name="settings-outline" size={22} color="#64748B" />
          <Text style={{ fontSize: 9, fontFamily: theme.fonts.semiBold, color: '#64748B', marginTop: 2 }}>Settings</Text>
        </TouchableOpacity>

        {/* Tab 6: Profile */}
        <TouchableOpacity style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }} onPress={handleProfilePress} activeOpacity={0.7}>
          <AppIcon name="person-outline" size={22} color="#64748B" />
          <Text style={{ fontSize: 9, fontFamily: theme.fonts.semiBold, color: '#64748B', marginTop: 2 }}>Profile</Text>
        </TouchableOpacity>
      </View>

      {/* Profile actions Modal overlay */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={profileModalVisible}
        onRequestClose={() => setProfileModalVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setProfileModalVisible(false)}
        >
          <Animated.View 
            style={{ 
              width: '100%', 
              opacity: profileFadeAnim, 
              transform: [{ translateY: profileSlideAnim }] 
            }}
          >
            <TouchableOpacity 
              style={styles.modalContent}
              activeOpacity={1}
              onPress={(e) => e.stopPropagation()} // Prevent close action from backdrop triggers
            >
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Resident Options</Text>
                <TouchableOpacity onPress={() => setProfileModalVisible(false)}>
                  <AppIcon name="close" size={20} color="#0B1C3F" />
                </TouchableOpacity>
              </View>

              {/* Profile Info Row */}
              <View style={styles.modalUserSection}>
                <View style={styles.modalAvatarLarge}>
                  <AppIcon name="person" size={20} color="#ffffff" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalUserName}>{userName}</Text>
                  <Text style={styles.modalUserRole}>Registered Resident</Text>
                </View>
              </View>

              {/* Action Buttons */}
              <View style={styles.modalActions}>
                {/* Complaint History */}
                <TouchableOpacity 
                  style={styles.modalBtnSecondary}
                  onPress={() => {
                    setProfileModalVisible(false);
                    navigation.navigate('ComplaintHistory');
                  }}
                >
                  <AppIcon name="archive-outline" size={15} color="#001e66" style={{ marginRight: 6 }} />
                  <Text style={styles.modalBtnSecondaryText}>Resolved Tickets History</Text>
                </TouchableOpacity>

                {/* Manage Account */}
                <TouchableOpacity 
                  style={styles.modalBtnPrimary}
                  onPress={() => {
                    setProfileModalVisible(false);
                    navigation.navigate('ManageAccount');
                  }}
                >
                  <AppIcon name="settings-outline" size={15} color="#ffffff" style={{ marginRight: 6 }} />
                  <Text style={styles.modalBtnPrimaryText}>Manage Account</Text>
                </TouchableOpacity>

                {/* Log Out */}
                <TouchableOpacity 
                  style={styles.modalBtnDanger}
                  onPress={async () => {
                    setProfileModalVisible(false);
                    await handleLogout();
                  }}
                >
                  <AppIcon name="log-out-outline" size={15} color="#FF3B30" style={{ marginRight: 6 }} />
                  <Text style={styles.modalBtnDangerText}>Log Out Account</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      </Modal>

      {/* Upgraded Notification Center Drawer Modal */}
      <ConsumerNotificationModal
        visible={notificationsModalVisible}
        onClose={() => setNotificationsModalVisible(false)}
        notifications={notifications}
        onNotificationPress={handleNotificationPress}
      />
    </View>
  );
}
