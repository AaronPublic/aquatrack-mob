import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, ActivityIndicator, RefreshControl, Alert, TouchableOpacity, Image, LayoutAnimation, Platform, UIManager, Modal, ScrollView } from 'react-native';
import { supabase } from '../../src/config/supabase';
import { api } from '../../src/config/api';
import AppIcon from '../../components/AppIcon';
import { LinearGradient } from 'expo-linear-gradient';
import styles from './TrackComplaints.styles';
import homeStyles from './ConsumerHome.styles';
import { useNotificationStore } from '../../src/store/useNotificationStore';

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

export default function TrackComplaints({ navigation }) {
  const [complaints, setComplaints] = useState([]);
  const [techProfiles, setTechProfiles] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('ACTIVE'); // ACTIVE, ALL, RESOLVED
  const [expandedId, setExpandedId] = useState(null);
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
    const formattedDate = new Date(item.createdAt).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Manila'
    });

    const techName = item.assignedToId ? (techProfiles[item.assignedToId] || "Assigned Technician") : null;

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
                <Text style={styles.metaValueMono}>AQ-{item.id ? item.id.slice(0, 4).toUpperCase() : 'N/A'}</Text>
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

  const filteredComplaints = complaints.filter(item => {
    if (activeTab === 'ACTIVE') {
      return item.status !== 'RESOLVED';
    }
    if (activeTab === 'RESOLVED') {
      return item.status === 'RESOLVED';
    }
    return true;
  });

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('ConsumerHome');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: '#F2F5FA' }]}>
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
                <AppIcon name="close" size={20} color="#0B1C3F" />
              </TouchableOpacity>
            </View>

            {/* Notifications Scrollable List */}
            {notifications.length === 0 ? (
              <View style={homeStyles.emptyNotifications}>
                <AppIcon name="notifications-off-outline" size={48} color="#94a3b8" />
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
                    timeZone: 'Asia/Manila',
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
                        <AppIcon name={iconName} size={18} color={iconColor} />
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
    </View>
  );
}

