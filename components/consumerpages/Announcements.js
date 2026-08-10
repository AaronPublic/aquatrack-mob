import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, ActivityIndicator, RefreshControl, TouchableOpacity, LayoutAnimation, Platform, UIManager, Image, Modal, ScrollView } from 'react-native';
import { api } from '../../src/config/api';
import { supabase } from '../../src/config/supabase';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import styles from './Announcements.styles';
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

export default function Announcements({ route, navigation }) {
  const [advisories, setAdvisories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('ALL'); // ALL, WARNINGS, UPDATES
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

  const fetchAdvisories = async () => {
    try {
      const data = await api.get('/api/advisories');
      if (data?.success) {
        // Filter broadcast/consumer alerts
        const publicAdvisories = data.advisories.filter(
          (ad) => ad.targetRole === 'broadcast' || ad.targetRole === 'consumers' || !ad.targetRole
        );
        setAdvisories(publicAdvisories);
      }
    } catch (err) {
      console.error("Failed to fetch advisories:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchProfileAndMetrics = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // Fetch profile
        const profile = await api.post('/api/auth/profile', { userId: session.user.id });
        if (profile?.name) {
          setUserName(profile.name);
        }

        // Fetch complaint counts
        const { data: userComplaints, error: compError } = await supabase
          .from('Complaint')
          .select('id, status')
          .eq('userId', session.user.id);

        if (!compError && userComplaints) {
          const total = userComplaints.length;
          const pending = userComplaints.filter(c => c.status === 'PENDING').length;
          const active = userComplaints.filter(c => c.status === 'EVALUATING' || c.status === 'DISPATCHED' || c.status === 'ONGOING').length;
          const resolved = userComplaints.filter(c => c.status === 'RESOLVED').length;

          setMetrics({ total, pending, active, resolved });
        }
      }
      // Load notifications update
      fetchNotifications();
    } catch (err) {
      console.warn("Failed to load header profile/metrics:", err);
    }
  };

  useEffect(() => {
    fetchAdvisories();
    fetchProfileAndMetrics();

    // Refresh when focused
    const unsubscribeFocus = navigation?.addListener('focus', () => {
      fetchAdvisories();
      fetchProfileAndMetrics();
    });

    return () => {
      unsubscribeFocus?.();
    };
  }, [navigation]);

  useEffect(() => {
    if (route?.params?.highlightAdvisoryId) {
      // Set the expanded card ID to the warning
      setExpandedId(route.params.highlightAdvisoryId);
      // Automatically switch to ALL tab to make sure it is shown
      setActiveTab('ALL');
    }
  }, [route?.params?.highlightAdvisoryId]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAdvisories();
  };

  const toggleExpand = (id) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedId(expandedId === id ? null : id);
  };

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('ConsumerHome');
    }
  };

  const renderItem = ({ item }) => {
    const isWarning = item.type === 'warning';
    const isExpanded = expandedId === item.id;

    return (
      <TouchableOpacity 
        style={[
          styles.card, 
          isExpanded && styles.cardExpanded,
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
        <View style={styles.cardHeader}>
          <Text style={styles.date}>{item.date}</Text>
          <View style={[
            styles.badge,
            isWarning
              ? { backgroundColor: '#fef2f2', borderColor: '#fca5a5' }
              : { backgroundColor: '#eff6ff', borderColor: '#93c5fd' }
          ]}>
            <View style={[
              styles.badgeDot,
              { backgroundColor: isWarning ? '#dc2626' : '#2563eb' }
            ]} />
            <Text style={[
              styles.badgeText,
              isWarning ? { color: '#dc2626' } : { color: '#2563eb' }
            ]}>{item.type || 'info'}</Text>
          </View>
        </View>

        <Text style={styles.cardTitle}>{item.title}</Text>
        
        <Text 
          style={styles.cardText}
          numberOfLines={isExpanded ? undefined : 2}
        >
          {item.text}
        </Text>

        {isExpanded ? (
          <View style={styles.expandToggle}>
            <Text style={styles.expandToggleText}>Tap to collapse</Text>
            <Ionicons name="chevron-up" size={14} color="#8E8E93" />
          </View>
        ) : (
          <View style={styles.expandToggleRow}>
            <View style={styles.expandToggle}>
              <Text style={styles.expandToggleText}>Read More</Text>
              <Ionicons name="chevron-down" size={14} color="#8E8E93" />
            </View>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const filteredAdvisories = advisories.filter(item => {
    if (activeTab === 'WARNINGS') {
      return item.type === 'warning';
    }
    if (activeTab === 'UPDATES') {
      return item.type !== 'warning';
    }
    return true;
  });

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
            <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
          </TouchableOpacity>

          {/* Right Header Controls (Notification Bell) */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <TouchableOpacity 
              activeOpacity={0.7} 
              onPress={handleOpenNotifications}
              style={homeStyles.notificationBell}
            >
              <Ionicons name="notifications-outline" size={20} color="#ffffff" />
              {unreadCount > 0 && <View style={homeStyles.notificationBadge} />}
            </TouchableOpacity>
          </View>
        </View>

        {/* Hero Title Section inside 30% Blue Area */}
        <View style={{ marginTop: 4, marginBottom: 8 }}>
          <Text style={{ color: '#FFFFFF', fontSize: 30, fontWeight: '900', letterSpacing: -0.5, lineHeight: 36 }}>
            Advisories
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 6 }}>
            <Ionicons name="megaphone-outline" size={14} color="#7DD3FC" />
            <Text style={{ color: '#BAE6FD', fontSize: 12, fontWeight: '600' }}>
              Water maintenance & municipal notices
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
          data={filteredAdvisories}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ListHeaderComponent={
            <View style={{ paddingHorizontal: 18, paddingTop: 4 }}>
              {/* Outer Gray Label */}
              <Text style={{ color: '#64748B', fontWeight: '800', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, paddingHorizontal: 4 }}>
                Public Bulletins & Alerts
              </Text>
              {/* Segment Tabs */}
              <View style={[styles.tabBar, { marginHorizontal: 0, marginBottom: 16 }]}>
                {['ALL', 'WARNINGS', 'UPDATES'].map((tab) => {
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
              <Ionicons name="megaphone-outline" size={48} color="#8E8E93" style={{ marginBottom: 12 }} />
              <Text style={styles.emptyTitle}>No Bulletins Found</Text>
              <Text style={styles.emptySubtitle}>
                {activeTab === 'ALL'
                  ? "There are no bulletins broadcasted at this time."
                  : activeTab === 'WARNINGS'
                    ? "There are no critical warning alarms currently active."
                    : "There are no general service updates posted right now."}
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

