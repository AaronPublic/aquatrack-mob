import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Alert, Modal, Animated } from 'react-native';
import { supabase } from '../../src/config/supabase';
import { api } from '../../src/config/api';
import AppIcon from '../../components/AppIcon';
import { LinearGradient } from 'expo-linear-gradient';
import styles from './ConsumerHome.styles';
import { theme } from '../../src/config/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '../../src/store/useAuthStore';
import { useNotificationStore } from '../../src/store/useNotificationStore';

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
  if (!reading) return 84; // Fallback default
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

export default function ConsumerHome({ navigation }) {
  const [userName, setUserName] = useState('Pedro'); // Default fallback to "Pedro" per spec
  const [advisories, setAdvisories] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [recentComplaints, setRecentComplaints] = useState([]);
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [notificationsModalVisible, setNotificationsModalVisible] = useState(false);
  const { notifications, unreadCount, fetchNotifications, markAllAsRead, dismissNotification } = useNotificationStore();
  const [dismissedAlerts, setDismissedAlerts] = useState([]);
  const [metrics, setMetrics] = useState({ total: 25, pending: 9, active: 8, resolved: 8 });
  const [waterIndexData, setWaterIndexData] = useState({
    nodeName: 'DOLORES EDGE NODE',
    wqi: 84,
    statusText: 'STABLE STATE',
    description: 'Satisfactory pressure and quality. Safe for daily household tasks and normal usage.',
    statusColor: '#007AFF',
    statusBg: 'rgba(0, 122, 255, 0.08)'
  });

  const profileSlideAnim = useRef(new Animated.Value(280)).current;
  const profileFadeAnim = useRef(new Animated.Value(0)).current;

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
    const fetchProfileAndAdvisories = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const profile = await api.post('/api/auth/profile', { userId: session.user.id });
          if (profile?.name) {
            setUserName(profile.name);
          }

          // Fetch dynamic complaints for active user
          const { data: userComplaints, error: compError } = await supabase
            .from('Complaint')
            .select('id, status, createdAt, summary, category, rawText')
            .eq('userId', session.user.id)
            .order('createdAt', { ascending: false });

          if (!compError && userComplaints) {
            const total = userComplaints.length;
            const pending = userComplaints.filter(c => c.status === 'PENDING').length;
            const active = userComplaints.filter(c => c.status === 'EVALUATING' || c.status === 'DISPATCHED' || c.status === 'ONGOING').length;
            const resolved = userComplaints.filter(c => c.status === 'RESOLVED').length;
            
            // Sync with dynamic numbers only if user has logged complaints, preserving spec defaults otherwise
            setMetrics({ total, pending, active, resolved });
            setRecentComplaints(userComplaints.slice(0, 3));
          }

          // Fetch Telemetry Nodes and Readings to calculate dynamic Water Health Index
          try {
            const { data: nodes } = await supabase.from('TelemetryNode').select('*');
            const { data: readings } = await supabase
              .from('TelemetryReading')
              .select('*')
              .order('timestamp', { ascending: false });

            if (nodes && nodes.length > 0) {
              const userBarangay = profile?.address || '';
              
              // Match node by name match to user address, default to first node (Dolores Edge Node usually)
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
              
              let statusText = 'STABLE STATE';
              let description = 'Satisfactory pressure and quality. Safe for daily household tasks and normal usage.';
              let statusColor = '#007AFF'; // Blue
              let statusBg = 'rgba(0, 122, 255, 0.08)';

              if (computedWqi >= 85) {
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
        }

        // Fetch advisories from API
        const advisoriesData = await api.get('/api/advisories');
        if (advisoriesData?.success) {
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
    
    fetchProfileAndAdvisories();
    
    // Refresh data when screen receives focus
    const unsubscribeFocus = navigation.addListener('focus', () => {
      fetchProfileAndAdvisories();
    });

    let channel;
    const setupRealtime = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // Fetch profile to identify nearest node
        const profile = await api.post('/api/auth/profile', { userId: session.user.id });
        const userBarangay = profile?.address || '';

        // Fetch nodes
        const { data: nodes } = await supabase.from('TelemetryNode').select('id, name');
        let chosenNodeId = null;
        if (nodes && nodes.length > 0) {
          let chosenNode = nodes[0];
          for (const node of nodes) {
            const nodeNameFirstWord = node.name.split(' ')[0].toLowerCase();
            if (userBarangay.toLowerCase().includes(nodeNameFirstWord)) {
              chosenNode = node;
              break;
            }
          }
          chosenNodeId = chosenNode.id;
        }

        channel = supabase.channel(`home-realtime-${session.user.id}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'Complaint',
              filter: `userId=eq.${session.user.id}`
            },
            (payload) => {
              console.log('Realtime complaint change on home screen:', payload);
              fetchProfileAndAdvisories();
            }
          )
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'Advisory'
            },
            (payload) => {
              console.log('Realtime advisory change on home screen:', payload);
              fetchProfileAndAdvisories();
            }
          );

        // Add telemetry reading listener with nodeId filter (Option A!)
        if (chosenNodeId) {
          channel = channel.on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'TelemetryReading',
              filter: `nodeId=eq.${chosenNodeId}`
            },
            (payload) => {
              console.log(`Realtime telemetry change for node ${chosenNodeId}:`, payload);
              fetchProfileAndAdvisories();
            }
          );
        }

        channel.subscribe();
      }
    };

    setupRealtime();
    
    return () => {
      unsubscribeFocus();
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
          <View style={styles.logoContainer}>
            <AppIcon name="water" size={26} color="#7DD3FC" />
            <Text style={styles.brandTitleText}>
              <Text style={{ color: '#FFFFFF' }}>AQ</Text>
              <Text style={{ color: '#FBBF24' }}>U</Text>
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
            <Text style={[styles.locationText, { marginLeft: 0 }]}>City of San Fernando • Dolores</Text>
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
              <View className="w-1.5 h-1.5 rounded-full bg-[#10B981] mr-1.5" />
              <Text className="text-[#10B981] font-black text-[8px] tracking-wider uppercase font-mono">
                {waterIndexData.nodeName}
              </Text>
            </View>
          </View>

          {/* Card Inner Panel */}
          <View className="flex-row items-center gap-5">
            {/* Left: Circular progress ring graphic */}
            <View 
              style={{ borderColor: waterIndexData.statusColor }}
              className="w-16 h-16 rounded-full border-4 items-center justify-center bg-[#F8FAFC]"
            >
              <Text className="text-[#0B2240] font-black text-xl font-mono">
                {waterIndexData.wqi}
              </Text>
            </View>

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
                minute: '2-digit'
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
        {/* Tab 1: Home */}
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

        {/* Tab 5: Settings Icon (RIGHT BESIDE MEGAPHONE!) */}
        <TouchableOpacity style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }} onPress={handleProfilePress} activeOpacity={0.7}>
          <AppIcon name="settings-sharp" size={22} color="#007AFF" />
          <Text style={{ fontSize: 9, fontFamily: theme.fonts.bold, color: '#007AFF', marginTop: 2 }}>Settings</Text>
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

      {/* Notifications Drawer Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={notificationsModalVisible}
        onRequestClose={() => setNotificationsModalVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setNotificationsModalVisible(false)}
        >
          <TouchableOpacity 
            style={styles.notificationsModalContent}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Notifications & Updates</Text>
              <TouchableOpacity onPress={() => setNotificationsModalVisible(false)}>
                <AppIcon name="close" size={20} color="#0B1C3F" />
              </TouchableOpacity>
            </View>

            {/* Notifications Scrollable List */}
            {notifications.length === 0 ? (
              <View style={styles.emptyNotifications}>
                <AppIcon name="notifications-off-outline" size={48} color="#94a3b8" />
                <Text style={styles.emptyNotificationsText}>No updates or notifications yet.</Text>
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
                        styles.notificationItem, 
                        !item.read && styles.notificationItemUnread
                      ]}
                    >
                      <View style={[styles.notificationIconContainer, { backgroundColor: iconBg }]}>
                        <AppIcon name={iconName} size={18} color={iconColor} />
                      </View>
                      <View style={styles.notificationContent}>
                        <Text style={styles.notificationTitle}>{item.title}</Text>
                        <Text style={styles.notificationMessage}>{item.message}</Text>
                        <Text style={styles.notificationTime}>{timeString}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}
