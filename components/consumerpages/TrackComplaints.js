import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, ActivityIndicator, RefreshControl, Alert, TouchableOpacity, Image, LayoutAnimation, Platform, UIManager } from 'react-native';
import { supabase } from '../../src/config/supabase';
import { api } from '../../src/config/api';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import styles from './TrackComplaints.styles';
import homeStyles from './ConsumerHome.styles';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const statusConfigs = {
  PENDING: { label: "Pending Review", text: "#b45309", bg: "#fef3c7", border: "#fde68a", dot: "#f59e0b" },
  EVALUATING: { label: "Evaluating", text: "#1d4ed8", bg: "#eff6ff", border: "#bfdbfe", dot: "#3b82f6" },
  DISPATCHED: { label: "Crew Dispatched", text: "#c2410c", bg: "#fff7ed", border: "#ffedd5", dot: "#f97316" },
  ONGOING: { label: "Ongoing Repair", text: "#4338ca", bg: "#eef2ff", border: "#e0e7ff", dot: "#6366f1" },
  RESOLVED: { label: "Resolved", text: "#047857", bg: "#ecfdf5", border: "#a7f3d0", dot: "#10b981" },
};

export default function TrackComplaints({ navigation }) {
  const [complaints, setComplaints] = useState([]);
  const [techProfiles, setTechProfiles] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('ALL'); // ALL, ACTIVE, RESOLVED
  const [expandedId, setExpandedId] = useState(null);
  const [userName, setUserName] = useState('Pedro');
  const [metrics, setMetrics] = useState({ total: 25, pending: 9, active: 8, resolved: 8 });

  const fetchComplaints = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setLoading(false);
        return;
      }

      // Fetch profile for header
      try {
        const profile = await api.post('/api/auth/profile', { userId: session.user.id });
        if (profile?.name) {
          setUserName(profile.name);
        }
      } catch (profileErr) {
        console.warn("Bypassed profile fetch in TrackComplaints:", profileErr);
      }

      // Query from Supabase directly for this resident's tickets
      const { data, error } = await supabase
        .from('Complaint')
        .select('*')
        .eq('userId', session.user.id)
        .order('createdAt', { ascending: false });

      if (error) throw error;

      setComplaints(data || []);

      if (data) {
        const total = data.length;
        const pending = data.filter(c => c.status === 'PENDING').length;
        const active = data.filter(c => c.status === 'EVALUATING' || c.status === 'DISPATCHED' || c.status === 'ONGOING').length;
        const resolved = data.filter(c => c.status === 'RESOLVED').length;
        setMetrics({ total, pending, active, resolved });
      }

      // Proactively fetch profiles of technicians assigned to these complaints
      const uniqueTechIds = [...new Set(data.map(c => c.assignedToId).filter(Boolean))];
      if (uniqueTechIds.length > 0) {
        const { data: profiles, error: profileErr } = await supabase
          .from('User')
          .select('id, name')
          .in('id', uniqueTechIds);

        if (!profileErr && profiles) {
          const mapping = {};
          profiles.forEach(p => {
            mapping[p.id] = p.name;
          });
          setTechProfiles(prev => ({ ...prev, ...mapping }));
        }
      }
    } catch (err) {
      console.error("Failed to fetch tickets:", err);
      Alert.alert("Data Sync Failed", "Could not synchronize ticket records with server.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchComplaints();

    const unsubscribeFocus = navigation?.addListener('focus', () => {
      fetchComplaints();
    });

    // Setup realtime subscription to update ticket status instantly on status updates!
    let channel;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      channel = supabase
        .channel(`resident-complaints-${session.user.id}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'Complaint', filter: `userId=eq.${session.user.id}` },
          (payload) => {
            console.log("Realtime ticket update:", payload);
            fetchComplaints(); // Refresh list immediately!
          }
        )
        .subscribe();
    })();

    return () => {
      unsubscribeFocus?.();
      if (channel) supabase.removeChannel(channel);
    };
  }, [navigation]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchComplaints();
  };

  const toggleExpand = (id) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedId(expandedId === id ? null : id);
  };

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
                  <Ionicons name="checkmark" size={10} color="#fff" />
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
                steps[idx + 1].active ? styles.stepLineActive : styles.stepLineInactive
              ]} />
            )}
          </React.Fragment>
        ))}
      </View>
    );
  };

  const renderTicketItem = ({ item }) => {
    const statusCfg = statusConfigs[item.status] || statusConfigs.PENDING;
    const isExpanded = expandedId === item.id;
    const formattedDate = new Date(item.createdAt).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const techName = item.assignedToId ? (techProfiles[item.assignedToId] || "Assigned Technician") : null;

    return (
      <TouchableOpacity 
        style={[styles.ticketCard, isExpanded && styles.ticketCardExpanded]} 
        onPress={() => toggleExpand(item.id)}
        activeOpacity={0.9}
      >
        <View style={styles.ticketHeader}>
          <Text style={styles.ticketDate}>{formattedDate}</Text>
          <View style={[
            styles.statusBadge, 
            { backgroundColor: statusCfg.bg, borderColor: statusCfg.border }
          ]}>
            <View style={[styles.statusDot, { backgroundColor: statusCfg.dot }]} />
            <Text style={[styles.statusText, { color: statusCfg.text }]}>{statusCfg.label}</Text>
          </View>
        </View>

        <Text style={styles.ticketSummary}>
          {item.summary || item.category?.replace(/_/g, ' ') || "Resident Reported Complaint"}
        </Text>
        
        <Text 
          style={styles.ticketDescription} 
          numberOfLines={isExpanded ? undefined : 2}
        >
          {item.rawText}
        </Text>

        {isExpanded ? (
          <View style={styles.expandedContent}>
            {/* Stepper Status Progress */}
            <Text style={styles.detailSectionTitle}>Progress Status</Text>
            {renderStepper(item.status)}

            {/* Additional metadata */}
            <View style={styles.metaDivider} />
            
            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>Ticket ID</Text>
                <Text style={styles.metaValueMono}>{item.id.substring(0, 16)}...</Text>
              </View>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>Barangay</Text>
                <Text style={styles.metaValue}>Brgy. {item.barangay || 'Detecting...'}</Text>
              </View>
            </View>

            {item.latitude && item.longitude && (
              <View style={styles.metaRow}>
                <View style={styles.metaItem}>
                  <Text style={styles.metaLabel}>Coordinates</Text>
                  <Text style={styles.metaValue}>{item.latitude.toFixed(5)}, {item.longitude.toFixed(5)}</Text>
                </View>
                {item.urgency && (
                  <View style={styles.metaItem}>
                    <Text style={styles.metaLabel}>Urgency</Text>
                    <Text style={[styles.metaValue, { fontWeight: 'bold' }]}>{item.urgency}</Text>
                  </View>
                )}
              </View>
            )}

            {item.imageUrl && (
              <View style={styles.imageBlock}>
                <Text style={styles.metaLabel}>Incident Attachment</Text>
                <Image source={{ uri: item.imageUrl }} style={styles.ticketImage} />
              </View>
            )}

            {/* Technician dispatch notice if assigned */}
            {techName && (
              <View style={styles.assignmentBlock}>
                <View style={styles.assignmentAvatar}>
                  <Text style={styles.assignmentAvatarText}>
                    {techName.substring(0, 2).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.assignmentInfo}>
                  <Text style={styles.assignmentLabel}>Assigned Technician</Text>
                  <Text style={styles.assignmentName}>{techName}</Text>
                </View>
              </View>
            )}

            <View style={styles.expandToggle}>
              <Text style={styles.expandToggleText}>Tap to collapse</Text>
              <Ionicons name="chevron-up" size={14} color="#8E8E93" />
            </View>
          </View>
        ) : (
          <View style={styles.expandRow}>
            <View style={styles.ticketLocation}>
              <Ionicons name="location-sharp" size={12} color="#00aeef" />
              <Text style={styles.ticketLocationText}>Brgy. {item.barangay || 'Resolved Area'}</Text>
            </View>
            <View style={styles.expandToggle}>
              <Text style={styles.expandToggleText}>Details</Text>
              <Ionicons name="chevron-down" size={14} color="#8E8E93" />
            </View>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const filteredComplaints = complaints.filter(item => {
    if (activeTab === 'ACTIVE') {
      return item.status !== 'RESOLVED';
    }
    if (activeTab === 'RESOLVED') {
      return item.status === 'RESOLVED';
    }
    return true;
  });

  return (
    <View style={[styles.container, { backgroundColor: '#F2F5FA' }]}>
      {/* Shared Header (Static at top for layout uniformity and flicker prevention) */}
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
              <Text style={[homeStyles.brandAqua, { color: '#ffd800' }]}>U</Text>
              <Text style={[homeStyles.brandAqua, { color: '#970006' }]}>A</Text>
              <Text style={homeStyles.brandRack}>T</Text>
              <Text style={homeStyles.brandRack}>RACK</Text>
            </View>
            <Text style={homeStyles.brandSubtitle}>CONSUMER PORTAL</Text>
          </View>

          {/* Right: User Profile Pill */}
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

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator color="#0B2240" size="large" />
        </View>
      ) : (
        <FlatList
          data={filteredComplaints}
          keyExtractor={(item) => item.id}
          renderItem={renderTicketItem}
          ListHeaderComponent={
            <View>
              {/* Title & Info */}
              <View className="mb-4">
                <Text className="text-[#0B2240] font-black text-2xl tracking-tight">Track My Tickets</Text>
                <Text className="text-[#627D98] font-medium text-xs mt-1.5 leading-relaxed">
                  Check real-time evaluation logs and engineer dispatches
                </Text>
              </View>

              {/* Segment Tabs */}
              <View style={[styles.tabBar, { marginHorizontal: 0, marginBottom: 16 }]}>
                {['ALL', 'ACTIVE', 'RESOLVED'].map((tab) => {
                  const isActive = activeTab === tab;
                  return (
                    <TouchableOpacity
                      key={tab}
                      style={[styles.tabButton, isActive && styles.tabButtonActive]}
                      onPress={() => {
                        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                        setActiveTab(tab);
                        setExpandedId(null);
                      }}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                        {tab}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          }
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#0B2240" />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="ticket-outline" size={48} color="#8E8E93" style={{ marginBottom: 12 }} />
              <Text style={styles.emptyTitle}>No Tickets Found</Text>
              <Text style={styles.emptySubtitle}>
                {activeTab === 'ALL'
                  ? "You haven't filed any utility reports yet."
                  : activeTab === 'ACTIVE'
                    ? "You have no active unresolved utility tickets."
                    : "You have no resolved tickets in your log history."}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

