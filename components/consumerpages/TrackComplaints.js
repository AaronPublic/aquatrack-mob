import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, ActivityIndicator, RefreshControl, Alert, TouchableOpacity, Image, LayoutAnimation, Platform, UIManager, Modal, ScrollView } from 'react-native';
import { supabase } from '../../src/config/supabase';
import { api } from '../../src/config/api';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import styles from './TrackComplaints.styles';
import homeStyles from './ConsumerHome.styles';
import { useNotificationStore } from '../../src/store/useNotificationStore';

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
      <View style={[homeStyles.headerCard, { paddingBottom: 24, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 }]}>
        {/* Background Water Ripple Decorations */}
        <View style={homeStyles.decorCircle1} />
        <View style={homeStyles.decorCircle2} />

        {/* Brand Row */}
        <View style={homeStyles.brandRow}>
          {/* Left: Brand Logo */}
          <View style={homeStyles.logoContainer}>
            <Image 
              source={require('../../assets/Logo.png')}
              style={homeStyles.logoImage}
              resizeMode="contain"
            />
          </View>

          {/* Middle: Subtitle Badge */}
          <View style={homeStyles.brandTextContainer}>
            <Text style={homeStyles.brandSubtitle}>TRACK TICKETS</Text>
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

        {/* Page Greeting & Subtitle */}
        <View style={homeStyles.greetingContainer}>
          <Text style={homeStyles.greetingText}>My Reports 🔍</Text>
          <View style={homeStyles.locationPill}>
            <Ionicons name="time-outline" size={13} color="#E0F2FE" />
            <Text style={homeStyles.locationText}>Real-time report status & technician logs</Text>
          </View>
        </View>
      </View>

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
    </View>
  );
}

