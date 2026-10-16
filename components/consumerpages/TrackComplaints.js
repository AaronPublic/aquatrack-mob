import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, FlatList, ActivityIndicator, RefreshControl, Alert, TouchableOpacity, LayoutAnimation, Platform, UIManager, Modal, ScrollView, Linking } from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../../src/config/supabase';
import { api } from '../../src/config/api';
import AppIcon from '../../components/AppIcon';
import { LinearGradient } from 'expo-linear-gradient';
import styles from './TrackComplaints.styles';
import homeStyles from './ConsumerHome.styles';
import { theme } from '../../src/config/theme';
import { useNotificationStore } from '../../src/store/useNotificationStore';
import ConsumerNotificationModal from './ConsumerNotificationModal';
import { useResponsive } from '../../src/utils/responsive';
import { formatPHT } from '../../src/utils/dateUtils';
import { formatCategory, getCategoryFamiliarKeywords } from '../../src/utils/categoryUtils';

if (
  Platform.OS === 'android' && 
  UIManager.setLayoutAnimationEnabledExperimental && 
  !global.nativeFabricUIManager && 
  !global.__turboModuleProxy
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const statusConfigs = {
  PENDING: { label: "Pending Review", text: "#b45309", bg: "#fef3c7", border: "#fde68a", dot: "#f59e0b" },
  EVALUATING: { label: "Evaluating", text: "#1d4ed8", bg: "#eff6ff", border: "#bfdbfe", dot: "#3b82f6" },
  DISPATCHED: { label: "Crew Dispatched", text: "#c2410c", bg: "#fff7ed", border: "#ffedd5", dot: "#f97316" },
  ONGOING: { label: "Ongoing Repair", text: "#4338ca", bg: "#eef2ff", border: "#e0e7ff", dot: "#6366f1" },
  RESOLVED: { label: "Resolved", text: "#047857", bg: "#ecfdf5", border: "#a7f3d0", dot: "#10b981" },
};

// Module-level cache to eliminate redundant network fetches for technician names across renders
const techProfileCache = {};

export default function TrackComplaints({ navigation }) {
  const insets = useSafeAreaInsets();
  const { isSmallDevice } = useResponsive();
  const topPadding = Math.max(insets.top, Platform.OS === 'android' ? 34 : 20) + (isSmallDevice ? 2 : 6);

  const [complaints, setComplaints] = useState([]);
  const [techProfiles, setTechProfiles] = useState(techProfileCache);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('ACTIVE'); // ACTIVE, ALL, RESOLVED
  const [expandedId, setExpandedId] = useState(null);
  const [userName, setUserName] = useState('Pedro');
  const [metrics, setMetrics] = useState({ total: 25, pending: 9, active: 8, resolved: 8 });
  const [notificationsModalVisible, setNotificationsModalVisible] = useState(false);
  const [selectedQrId, setSelectedQrId] = useState(null);
  const [cancellingTicket, setCancellingTicket] = useState(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [selectedTechContact, setSelectedTechContact] = useState(null);

  const notifications = useNotificationStore(s => s.notifications);
  const unreadCount = useNotificationStore(s => s.unreadCount);
  const fetchNotifications = useNotificationStore(s => s.fetchNotifications);
  const markAllAsRead = useNotificationStore(s => s.markAllAsRead);
  const dismissNotification = useNotificationStore(s => s.dismissNotification);

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

  const handleConfirmCancel = async () => {
    if (!cancellingTicket) return;
    try {
      setIsCancelling(true);
      const { data: { session } } = await supabase.auth.getSession();
      const res = await api.post('/api/complaints/cancel', {
        id: cancellingTicket.id,
        userId: session?.user?.id
      });
      if (res?.success) {
        setCancellingTicket(null);
        await fetchComplaints();
        Alert.alert("Ticket Cancelled", "Your complaint ticket has been successfully cancelled and removed from the dispatch queue.");
      } else {
        throw new Error(res?.error || "Failed to cancel complaint ticket.");
      }
    } catch (err) {
      console.error("Cancel ticket error:", err);
      Alert.alert("Cancellation Failed", err.message || "Could not cancel ticket. Please try again.");
    } finally {
      setIsCancelling(false);
    }
  };

  const fetchComplaints = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setLoading(false);
        return;
      }

      // Fetch profile and user complaints in parallel
      const [profile, { data, error }] = await Promise.all([
        api.post('/api/auth/profile', { userId: session.user.id }).catch((err) => {
          console.warn("Bypassed profile fetch in TrackComplaints:", err);
          return null;
        }),
        supabase
          .from('Complaint')
          .select('id, userId, status, createdAt, summary, category, rawText, assignedToId, barangay, latitude, longitude, urgency, imageUrl')
          .eq('userId', session.user.id)
          .order('createdAt', { ascending: false })
      ]);

      if (profile?.name) {
        setUserName(profile.name);
      }

      if (error) throw error;

      setComplaints(data || []);

      if (data) {
        const total = data.length;
        const pending = data.filter(c => c.status === 'PENDING').length;
        const active = data.filter(c => c.status === 'EVALUATING' || c.status === 'DISPATCHED' || c.status === 'ONGOING').length;
        const resolved = data.filter(c => c.status === 'RESOLVED').length;
        setMetrics({ total, pending, active, resolved });
      }

      // Proactively fetch profiles and contact numbers of technicians assigned to these complaints
      const uniqueTechIds = [...new Set((data || []).map(c => c.assignedToId).filter(Boolean))];
      const uncachedIds = uniqueTechIds.filter(id => !techProfileCache[id]);

      if (uncachedIds.length > 0) {
        const mapping = {};

        // 1. Try Supabase User table
        try {
          const { data: profiles, error: profileErr } = await supabase
            .from('User')
            .select('id, name, phone')
            .in('id', uncachedIds);

          if (!profileErr && profiles && profiles.length > 0) {
            profiles.forEach(p => {
              if (p.id && p.name) {
                const info = { name: p.name, phone: p.phone || null };
                mapping[p.id] = info;
                techProfileCache[p.id] = info;
              }
            });
          }
        } catch (sbErr) {
          console.warn("Supabase direct tech query error:", sbErr);
        }

        // 2. Fallback to API for any unresolved technician IDs (bypasses client RLS)
        const missingIds = uncachedIds.filter(id => !techProfileCache[id]);
        if (missingIds.length > 0) {
          await Promise.all(
            missingIds.map(async (techId) => {
              try {
                const res = await api.post('/api/auth/profile', { userId: techId });
                if (res?.name) {
                  const info = { name: res.name, phone: res.phone || null };
                  mapping[techId] = info;
                  techProfileCache[techId] = info;
                }
              } catch (apiErr) {
                console.warn(`Could not resolve technician profile for ${techId}:`, apiErr?.message);
              }
            })
          );
        }

        if (Object.keys(mapping).length > 0) {
          setTechProfiles(prev => ({ ...prev, ...mapping }));
        }
      } else if (Object.keys(techProfileCache).length > 0) {
        setTechProfiles(prev => ({ ...prev, ...techProfileCache }));
      }
      // Load notification center updates
      fetchNotifications();
    } catch (err) {
      console.error("Failed to fetch tickets:", err);
      Alert.alert("Data Sync Failed", "Could not synchronize ticket records with server.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    let debounceTimer = null;
    fetchComplaints();

    const unsubscribeFocus = navigation?.addListener('focus', () => {
      fetchComplaints();
    });

    const debouncedFetch = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        fetchComplaints();
      }, 300);
    };

    let isMounted = true;
    let channel;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || !isMounted) return;

      channel = supabase
        .channel(`resident-complaints-${session.user.id}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'Complaint', filter: `userId=eq.${session.user.id}` },
          () => {
            debouncedFetch();
          }
        );

      if (isMounted) {
        channel.subscribe();
      }
    })();

    return () => {
      isMounted = false;
      unsubscribeFocus?.();
      if (debounceTimer) clearTimeout(debounceTimer);
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
                  <AppIcon name="checkmark" size={10} color="#fff" />
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
    const formattedDate = formatPHT(item.createdAt, 'dateTime');

    const techData = item.assignedToId ? techProfiles[item.assignedToId] : null;
    const techName = typeof techData === 'object' && techData !== null ? techData.name : (typeof techData === 'string' ? techData : (item.assignedToId ? "Assigned Technician" : null));
    const techPhone = typeof techData === 'object' && techData !== null ? techData.phone : null;

    return (
      <TouchableOpacity 
        style={[
          styles.ticketCard, 
          isExpanded && styles.ticketCardExpanded,
          {
            shadowColor: '#0B2240',
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.07,
            shadowRadius: 14,
            elevation: 4,
            marginBottom: 14,
            borderRadius: 24,
          }
        ]} 
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
          {item.summary || formatCategory(item.category) || "Resident Reported Complaint"}
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
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={styles.metaValueMono}>AQ-{item.id ? item.id.slice(0, 4).toUpperCase() : 'N/A'}</Text>
                  {item.status !== 'RESOLVED' && (
                    <TouchableOpacity
                      onPress={() => setSelectedQrId(item.id)}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 4,
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        backgroundColor: '#EFF6FF',
                        borderRadius: 8,
                        borderWidth: 1,
                        borderColor: '#BFDBFE'
                      }}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      activeOpacity={0.7}
                    >
                      <AppIcon name="qr-code" size={13} color="#008CE3" />
                      <Text style={{ fontSize: 10, fontFamily: theme.fonts.bold, color: '#008CE3' }}>View QR</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>Barangay</Text>
                <Text style={styles.metaValue}>Brgy. {item.barangay || 'Detecting...'}</Text>
              </View>
            </View>

            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>Category</Text>
                <Text style={styles.metaValue}>{formatCategory(item.category)}</Text>
                <Text style={{ fontSize: 10, color: '#0072a3', fontWeight: '700', marginTop: 2 }}>
                  {getCategoryFamiliarKeywords(item.category)[0]}
                </Text>
              </View>
              {item.urgency ? (
                <View style={styles.metaItem}>
                  <Text style={styles.metaLabel}>Urgency</Text>
                  <Text style={[styles.metaValue, { fontWeight: 'bold' }]}>{item.urgency}</Text>
                </View>
              ) : null}
            </View>

            {item.latitude && item.longitude && (
              <View style={styles.metaRow}>
                <View style={styles.metaItem}>
                  <Text style={styles.metaLabel}>Coordinates</Text>
                  <Text style={styles.metaValue}>{item.latitude.toFixed(5)}, {item.longitude.toFixed(5)}</Text>
                </View>
              </View>
            )}

            {item.imageUrl && (
              <View style={styles.imageBlock}>
                <Text style={styles.metaLabel}>Incident Attachment</Text>
                <Image source={{ uri: item.imageUrl }} style={styles.ticketImage} />
              </View>
            )}

            {/* Technician dispatch notice if assigned (Clickable to view contact details) */}
            {(item.assignedToId || item.status === 'DISPATCHED' || item.status === 'ONGOING' || item.status === 'RESOLVED') && (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setSelectedTechContact({
                  name: techName || "Field Technician Assigned",
                  phone: techPhone || null,
                  ticketId: item.id
                })}
                style={[styles.assignmentBlock, { paddingRight: 10 }]}
              >
                <View style={styles.assignmentAvatar}>
                  <Text style={styles.assignmentAvatarText}>
                    {techName ? techName.substring(0, 2).toUpperCase() : 'FT'}
                  </Text>
                </View>
                <View style={styles.assignmentInfo}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                    <Text style={styles.assignmentLabel}>Assigned Technician</Text>
                    {item.status === 'ONGOING' ? (
                      <View style={{ backgroundColor: '#EEF2FF', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4, borderWidth: 1, borderColor: '#C7D2FE' }}>
                        <Text style={{ fontSize: 8, fontFamily: theme.fonts.bold, color: '#4338CA' }}>ON-SITE REPAIR</Text>
                      </View>
                    ) : item.status === 'DISPATCHED' ? (
                      <View style={{ backgroundColor: '#FFF7ED', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4, borderWidth: 1, borderColor: '#FFEDD5' }}>
                        <Text style={{ fontSize: 8, fontFamily: theme.fonts.bold, color: '#C2410C' }}>DISPATCHED</Text>
                      </View>
                    ) : item.status === 'RESOLVED' ? (
                      <View style={{ backgroundColor: '#ECFDF5', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4, borderWidth: 1, borderColor: '#A7F3D0' }}>
                        <Text style={{ fontSize: 8, fontFamily: theme.fonts.bold, color: '#047857' }}>COMPLETED</Text>
                      </View>
                    ) : null}
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                    <Text style={[styles.assignmentName, { flex: 1 }]} numberOfLines={1}>
                      {techName || "Field Technician Assigned"}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#EFF6FF', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, borderWidth: 1, borderColor: '#BFDBFE' }}>
                      <AppIcon name="call" size={10} color="#008CE3" />
                      <Text style={{ fontSize: 9, fontFamily: theme.fonts.bold, color: '#008CE3' }}>Contact</Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            )}

            {/* Cancel ticket action for unassigned active complaints */}
            {!item.assignedToId && item.status !== 'RESOLVED' && (
              <TouchableOpacity
                onPress={() => setCancellingTicket(item)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  marginTop: 12,
                  paddingVertical: 10,
                  paddingHorizontal: 16,
                  backgroundColor: '#FEF2F2',
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: '#FECACA'
                }}
                activeOpacity={0.8}
              >
                <AppIcon name="trash-outline" size={14} color="#DC2626" />
                <Text style={{ fontSize: 12, fontFamily: theme.fonts.bold, color: '#DC2626' }}>
                  Cancel Complaint Ticket
                </Text>
              </TouchableOpacity>
            )}

            <View style={styles.expandToggle}>
              <Text style={styles.expandToggleText}>Tap to collapse</Text>
              <AppIcon name="chevron-up" size={14} color="#8E8E93" />
            </View>
          </View>
        ) : (
          <View style={styles.expandRow}>
            <View style={styles.ticketLocation}>
              <Text style={styles.ticketLocationText}>Brgy. {item.barangay || 'Resolved Area'}</Text>
            </View>
            <View style={styles.expandToggle}>
              <Text style={styles.expandToggleText}>Details</Text>
              <AppIcon name="chevron-down" size={14} color="#8E8E93" />
            </View>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const filteredComplaints = useMemo(() => {
    return complaints.filter(item => {
      if (activeTab === 'ACTIVE') {
        return item.status !== 'RESOLVED';
      }
      if (activeTab === 'RESOLVED') {
        return item.status === 'RESOLVED';
      }
      return true;
    });
  }, [complaints, activeTab]);

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('ConsumerHome');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: '#F2F5FA' }]}>
      {/* ==================== TOP BLUE SECTION ==================== */}
      <LinearGradient 
        colors={['#0C4F8B', '#008CE3']} 
        start={{ x: 0, y: 0 }} 
        end={{ x: 0, y: 1 }} 
        style={{
          paddingTop: topPadding,
          paddingHorizontal: 20,
          paddingBottom: 20,
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
            Track Tickets
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 6 }}>
            <AppIcon name="ticket-outline" size={14} color="#7DD3FC" />
            <Text style={{ color: '#BAE6FD', fontSize: 12, fontWeight: '600' }}>
              Track live ticket progress & dispatch logs
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

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator color="#0B2240" size="large" />
        </View>
      ) : (
        <FlatList
          style={{ flex: 1, marginTop: 12 }}
          data={filteredComplaints}
          keyExtractor={(item) => item.id}
          renderItem={renderTicketItem}
          initialNumToRender={8}
          maxToRenderPerBatch={10}
          windowSize={5}
          removeClippedSubviews={true}
          ListHeaderComponent={
            <View style={{ paddingHorizontal: 18, paddingTop: 4 }}>
              {/* Outer Gray Label */}
              <Text style={{ color: '#64748B', fontWeight: '800', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, paddingHorizontal: 4 }}>
                My Ticket Records
              </Text>
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
          contentContainerStyle={[styles.listContainer, { paddingHorizontal: 18 }]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#0B2240" />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <AppIcon name="ticket-outline" size={48} color="#8E8E93" style={{ marginBottom: 12 }} />
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

      {/* Notifications Drawer Modal */}
      {/* Upgraded Notifications Center Modal */}
      <ConsumerNotificationModal
        visible={notificationsModalVisible}
        onClose={() => setNotificationsModalVisible(false)}
        notifications={notifications}
        onNotificationPress={handleNotificationPress}
      />

      {/* QR Code Presentation Modal (Covers full screen including Bottom Tab Bar) */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={!!selectedQrId}
        onRequestClose={() => setSelectedQrId(null)}
        statusBarTranslucent={true}
      >
        <TouchableOpacity 
          style={{
            flex: 1,
            backgroundColor: 'rgba(11, 34, 64, 0.72)',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
          }}
          activeOpacity={1}
          onPress={() => setSelectedQrId(null)}
        >
          <TouchableOpacity 
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 32,
              padding: 24,
              paddingTop: 28,
              width: '100%',
              maxWidth: 330,
              alignItems: 'center',
              shadowColor: '#0B2240',
              shadowOffset: { width: 0, height: 12 },
              shadowOpacity: 0.25,
              shadowRadius: 24,
              elevation: 16,
              borderWidth: 1,
              borderColor: '#E2E8F0',
              position: 'relative'
            }}
            activeOpacity={1}
          >
            {/* Highly Visible, Prominent X Close Button */}
            <TouchableOpacity
              onPress={() => setSelectedQrId(null)}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              activeOpacity={0.7}
              style={{
                position: 'absolute',
                top: 16,
                right: 16,
                width: 38,
                height: 38,
                backgroundColor: '#F1F5F9',
                borderRadius: 19,
                borderWidth: 1.5,
                borderColor: '#CBD5E1',
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: '#0B2240',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.08,
                shadowRadius: 4,
                elevation: 3,
                zIndex: 10
              }}
            >
              <AppIcon name="close" size={20} color="#0F172A" />
            </TouchableOpacity>

            {/* QR Icon Badge */}
            <View style={{
              width: 46,
              height: 46,
              borderRadius: 23,
              backgroundColor: '#EFF6FF',
              borderWidth: 1,
              borderColor: '#BFDBFE',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 10
            }}>
              <AppIcon name="qr-code" size={22} color="#008CE3" />
            </View>

            <Text style={{ 
              fontSize: 18, 
              fontFamily: theme.fonts.extraBold, 
              color: '#0B2240', 
              letterSpacing: -0.3,
              textAlign: 'center'
            }}>
              Complaint QR Code
            </Text>

            {/* Reference Ticket Pill */}
            <View style={{
              backgroundColor: '#F0F9FF',
              paddingHorizontal: 12,
              paddingVertical: 4,
              borderRadius: 10,
              borderWidth: 1,
              borderColor: '#BAE6FD',
              marginTop: 6
            }}>
              <Text style={{ 
                fontSize: 12, 
                fontFamily: theme.fonts.monoBold, 
                color: '#0284C7',
                letterSpacing: 0.5
              }}>
                AQ-{selectedQrId ? selectedQrId.slice(0, 8).toUpperCase() : ''}
              </Text>
            </View>

            {/* QR Image Container */}
            <View style={{
              marginVertical: 18,
              padding: 14,
              backgroundColor: '#FFFFFF',
              borderRadius: 22,
              borderWidth: 1,
              borderColor: '#E2E8F0',
              shadowColor: '#0B2240',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.06,
              shadowRadius: 10,
              elevation: 3
            }}>
              {selectedQrId && (
                <Image
                  source={{ uri: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${selectedQrId}` }}
                  style={{ width: 185, height: 185 }}
                  contentFit="contain"
                />
              )}
            </View>

            <Text style={{ 
              fontSize: 11, 
              color: '#64748B', 
              textAlign: 'center', 
              lineHeight: 16, 
              fontFamily: theme.fonts.semiBold,
              paddingHorizontal: 4,
              marginBottom: 16
            }}>
              Present this QR code to the technician on site upon repair completion to verify and automatically resolve the ticket.
            </Text>

            {/* Prominent Bottom Close Button */}
            <TouchableOpacity
              onPress={() => setSelectedQrId(null)}
              activeOpacity={0.85}
              style={{
                width: '100%',
                height: 46,
                backgroundColor: '#0B2240',
                borderRadius: 14,
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: '#0B2240',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.15,
                shadowRadius: 8,
                elevation: 3
              }}
            >
              <Text style={{ 
                color: '#FFFFFF', 
                fontSize: 12, 
                fontFamily: theme.fonts.bold, 
                textTransform: 'uppercase', 
                letterSpacing: 0.8 
              }}>
                Close
              </Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Cancellation Confirmation Modal */}
      <Modal
        visible={!!cancellingTicket}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          if (!isCancelling) setCancellingTicket(null);
        }}
      >
        <TouchableOpacity 
          style={{
            flex: 1,
            backgroundColor: 'rgba(11, 34, 64, 0.65)',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24
          }}
          activeOpacity={1}
          onPress={() => {
            if (!isCancelling) setCancellingTicket(null);
          }}
        >
          <TouchableOpacity 
            activeOpacity={1} 
            style={{
              width: '100%',
              maxWidth: 360,
              backgroundColor: '#FFFFFF',
              borderRadius: 28,
              padding: 24,
              shadowColor: '#0B2240',
              shadowOffset: { width: 0, height: 12 },
              shadowOpacity: 0.18,
              shadowRadius: 24,
              elevation: 12,
            }}
          >
            {/* Header Icon */}
            <View style={{ alignItems: 'center', marginBottom: 14 }}>
              <View style={{
                width: 56,
                height: 56,
                borderRadius: 20,
                backgroundColor: '#FEF2F2',
                borderWidth: 1,
                borderColor: '#FEE2E2',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 12
              }}>
                <AppIcon name="warning" size={28} color="#DC2626" />
              </View>
              <Text style={{
                fontSize: 18,
                fontFamily: theme.fonts.bold,
                color: '#0B2240',
                textAlign: 'center'
              }}>
                Cancel Ticket?
              </Text>
              <View style={{
                backgroundColor: '#F1F5F9',
                paddingHorizontal: 10,
                paddingVertical: 3,
                borderRadius: 8,
                marginTop: 6
              }}>
                <Text style={{
                  fontSize: 11,
                  fontFamily: theme.fonts.monoBold,
                  color: '#475569'
                }}>
                  AQ-{cancellingTicket?.id ? cancellingTicket.id.slice(0, 8).toUpperCase() : ''}
                </Text>
              </View>
            </View>

            {/* Explanation */}
            <View style={{
              backgroundColor: '#F8FAFC',
              borderRadius: 14,
              padding: 12,
              borderWidth: 1,
              borderColor: '#E2E8F0',
              marginBottom: 16
            }}>
              <Text style={{
                fontSize: 11,
                fontFamily: theme.fonts.bold,
                color: '#334155',
                marginBottom: 4
              }}>
                {cancellingTicket?.summary || "Reported Issue"}
              </Text>
              <Text style={{
                fontSize: 11,
                fontFamily: theme.fonts.regular,
                color: '#64748B',
                lineHeight: 16
              }} numberOfLines={2}>
                "{cancellingTicket?.rawText}"
              </Text>
            </View>

            <Text style={{
              fontSize: 12,
              fontFamily: theme.fonts.regular,
              color: '#64748B',
              textAlign: 'center',
              lineHeight: 18,
              marginBottom: 20,
              paddingHorizontal: 8
            }}>
              Since no field crew has been dispatched yet, cancelling will withdraw this ticket from municipal dispatch.
            </Text>

            {/* Actions */}
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity
                disabled={isCancelling}
                onPress={() => setCancellingTicket(null)}
                style={{
                  flex: 1,
                  height: 46,
                  borderRadius: 14,
                  backgroundColor: '#F1F5F9',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 1,
                  borderColor: '#E2E8F0'
                }}
                activeOpacity={0.7}
              >
                <Text style={{
                  fontSize: 13,
                  fontFamily: theme.fonts.bold,
                  color: '#475569'
                }}>
                  Keep Ticket
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                disabled={isCancelling}
                onPress={handleConfirmCancel}
                style={{
                  flex: 1,
                  height: 46,
                  borderRadius: 14,
                  backgroundColor: '#DC2626',
                  alignItems: 'center',
                  justifyContent: 'center',
                  shadowColor: '#DC2626',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.25,
                  shadowRadius: 8,
                  elevation: 4
                }}
                activeOpacity={0.8}
              >
                {isCancelling ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={{
                    fontSize: 13,
                    fontFamily: theme.fonts.bold,
                    color: '#FFFFFF'
                  }}>
                    Yes, Cancel
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Technician Contact Modal */}
      <Modal
        visible={!!selectedTechContact}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedTechContact(null)}
      >
        <TouchableOpacity 
          style={{
            flex: 1,
            backgroundColor: 'rgba(11, 34, 64, 0.65)',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24
          }}
          activeOpacity={1}
          onPress={() => setSelectedTechContact(null)}
        >
          <TouchableOpacity 
            activeOpacity={1} 
            style={{
              width: '100%',
              maxWidth: 360,
              backgroundColor: '#FFFFFF',
              borderRadius: 28,
              padding: 24,
              shadowColor: '#0B2240',
              shadowOffset: { width: 0, height: 12 },
              shadowOpacity: 0.18,
              shadowRadius: 24,
              elevation: 12,
            }}
          >
            {/* Close X */}
            <TouchableOpacity
              onPress={() => setSelectedTechContact(null)}
              style={{
                position: 'absolute',
                top: 16,
                right: 16,
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: '#F1F5F9',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10
              }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <AppIcon name="close" size={16} color="#64748B" />
            </TouchableOpacity>

            {/* Avatar & Info */}
            <View style={{ alignItems: 'center', marginTop: 8, marginBottom: 16 }}>
              <LinearGradient
                colors={['#0C4F8B', '#008CE3']}
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: 22,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 12,
                  shadowColor: '#008CE3',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.25,
                  shadowRadius: 8,
                  elevation: 4
                }}
              >
                <Text style={{
                  fontSize: 20,
                  fontFamily: theme.fonts.bold,
                  color: '#FFFFFF'
                }}>
                  {selectedTechContact?.name ? selectedTechContact.name.substring(0, 2).toUpperCase() : 'FT'}
                </Text>
              </LinearGradient>
              <Text style={{
                fontSize: 17,
                fontFamily: theme.fonts.bold,
                color: '#0B2240',
                textAlign: 'center'
              }}>
                {selectedTechContact?.name}
              </Text>
              <View style={{
                backgroundColor: '#EFF6FF',
                paddingHorizontal: 10,
                paddingVertical: 3,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: '#BFDBFE',
                marginTop: 6
              }}>
                <Text style={{
                  fontSize: 10,
                  fontFamily: theme.fonts.bold,
                  color: '#008CE3',
                  textTransform: 'uppercase',
                  letterSpacing: 0.5
                }}>
                  Sub-Admin / Field Technician
                </Text>
              </View>
              <Text style={{
                fontSize: 11,
                fontFamily: theme.fonts.monoBold,
                color: '#94A3B8',
                marginTop: 4
              }}>
                Ticket AQ-{selectedTechContact?.ticketId ? selectedTechContact.ticketId.slice(0, 8).toUpperCase() : ''}
              </Text>
            </View>

            {/* Contact Card */}
            <View style={{
              backgroundColor: '#F8FAFC',
              borderRadius: 16,
              padding: 14,
              borderWidth: 1,
              borderColor: '#E2E8F0',
              marginBottom: 18
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <AppIcon name="call" size={14} color="#008CE3" />
                <Text style={{
                  fontSize: 11,
                  fontFamily: theme.fonts.bold,
                  color: '#475569',
                  textTransform: 'uppercase',
                  letterSpacing: 0.5
                }}>
                  Contact Number
                </Text>
              </View>

              {selectedTechContact?.phone ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 2 }}>
                  <Text style={{
                    fontSize: 15,
                    fontFamily: theme.fonts.monoBold,
                    color: '#0B2240',
                    letterSpacing: 0.5
                  }}>
                    {selectedTechContact.phone}
                  </Text>
                  <TouchableOpacity
                    onPress={() => Linking.openURL(`tel:${selectedTechContact.phone}`)}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 4,
                      backgroundColor: '#10B981',
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 10,
                      shadowColor: '#10B981',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.2,
                      shadowRadius: 4,
                      elevation: 2
                    }}
                    activeOpacity={0.8}
                  >
                    <AppIcon name="call" size={12} color="#FFFFFF" />
                    <Text style={{
                      fontSize: 11,
                      fontFamily: theme.fonts.bold,
                      color: '#FFFFFF'
                    }}>
                      Call
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={{ paddingTop: 2 }}>
                  <Text style={{
                    fontSize: 12,
                    fontFamily: theme.fonts.regular,
                    color: '#64748B',
                    fontStyle: 'italic',
                    marginBottom: 6
                  }}>
                    Direct mobile number not registered.
                  </Text>
                  <TouchableOpacity
                    onPress={() => Linking.openURL('tel:0459612345')}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      backgroundColor: '#EFF6FF',
                      padding: 8,
                      borderRadius: 10,
                      borderWidth: 1,
                      borderColor: '#BFDBFE'
                    }}
                    activeOpacity={0.8}
                  >
                    <View>
                      <Text style={{ fontSize: 10, fontFamily: theme.fonts.bold, color: '#008CE3' }}>
                        Dispatch Hotline
                      </Text>
                      <Text style={{ fontSize: 12, fontFamily: theme.fonts.monoBold, color: '#0B2240' }}>
                        (045) 961-2345
                      </Text>
                    </View>
                    <View style={{ backgroundColor: '#008CE3', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
                      <Text style={{ fontSize: 10, fontFamily: theme.fonts.bold, color: '#FFFFFF' }}>Call</Text>
                    </View>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Note */}
            <Text style={{
              fontSize: 11,
              fontFamily: theme.fonts.regular,
              color: '#94A3B8',
              textAlign: 'center',
              lineHeight: 16,
              marginBottom: 16,
              paddingHorizontal: 8
            }}>
              Available for service and inspection updates during municipal district operating hours.
            </Text>

            {/* Bottom Close */}
            <TouchableOpacity
              onPress={() => setSelectedTechContact(null)}
              style={{
                width: '100%',
                height: 44,
                backgroundColor: '#0B2240',
                borderRadius: 14,
                alignItems: 'center',
                justifyContent: 'center'
              }}
              activeOpacity={0.85}
            >
              <Text style={{
                color: '#FFFFFF',
                fontSize: 12,
                fontFamily: theme.fonts.bold,
                textTransform: 'uppercase',
                letterSpacing: 0.8
              }}>
                Close
              </Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

